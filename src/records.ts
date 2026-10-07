// Storage release 2 (canvas boards S0 to S2, approved 7 October 2026): one record per food, recipe and card, each with
// its own "changed at" time. A phone sends only the records that changed; when it reads the account it takes the newest
// of each record, one by one, so two changes on two phones are both kept. A deleted record leaves a "deleted" note, so
// the other phone deletes it too instead of bringing it back. Pure functions here; the account calls are in cloud.ts.
export type Kind = "foods" | "recipes" | "cards";
export const KINDS: Kind[] = ["foods", "recipes", "cards"];
// what this phone last sent or took, per record: the fingerprint of its content and its "changed at"; "-" is a deleted note
export type Known = Record<string, { sig: string; at: string }>;
export type RemoteRec = { id: string; data: any | null; at: string; deletedAt?: string | null };
export type Remote = Record<Kind, RemoteRec[]>;
export type Up = { kind: Kind; id: string; data: any; at: string };
export type Del = { kind: Kind; id: string; at: string };

const keyOf = (kind: Kind, id: string) => `${kind}/${id}`;
const listOf = (s: any, kind: Kind): any[] => (kind === "foods" ? s.foods : kind === "recipes" ? s.meals : s.feedback) ?? [];
const withList = (s: any, kind: Kind, list: any[]) => (kind === "foods" ? { ...s, foods: list } : kind === "recipes" ? { ...s, meals: list } : { ...s, feedback: list });

// A record as the account keeps it: no photos (they are files since release 1), nothing undefined.
const stripFood = (f: any) => { if (f && typeof f === "object") { if (Array.isArray(f.photos)) f.photoCount = f.photos.length; else if (f.photo) f.photoCount = 0; delete f.photo; delete f.photos; } };
export function clean(kind: Kind, x: any): any {
  const c = JSON.parse(JSON.stringify(x ?? null));
  if (!c) return c;
  if (kind === "foods") stripFood(c);
  if (kind === "recipes") (c.items ?? []).forEach((i: any) => stripFood(i?.food));
  if (kind === "cards") { delete c.photo; (c.meal?.items ?? []).forEach((i: any) => stripFood(i?.food)); }
  return c;
}
// a short fingerprint of a record's content, enough to see that it changed
export function sigOf(kind: Kind, x: any): string {
  const s = JSON.stringify(clean(kind, x));
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${(h >>> 0).toString(36)}`;
}

// What to send: every record whose content changed since it was last sent or taken, and a deleted note for every record
// this phone knew that is no longer there. Deleted notes are only sent once the account has been read in this session,
// so a phone that opened on an old or empty copy can never delete what it simply doesn't have yet.
export function changes(state: any, known: Known, now: string, mayDelete: boolean): { ups: Up[]; dels: Del[]; next: Known } {
  const next: Known = { ...known };
  const ups: Up[] = [], dels: Del[] = [];
  for (const kind of KINDS) {
    const ids = new Set<string>();
    for (const x of listOf(state, kind)) {
      if (!x?.id) continue;
      ids.add(x.id);
      const k = keyOf(kind, x.id), sig = sigOf(kind, x);
      if (known[k]?.sig === sig) continue;
      ups.push({ kind, id: x.id, data: clean(kind, x), at: now });
      next[k] = { sig, at: now };
    }
    if (!mayDelete) continue;
    const gone = Object.keys(known).filter((k) => k.startsWith(`${kind}/`) && known[k].sig !== "-" && !ids.has(k.slice(kind.length + 1)));
    const alive = Object.keys(known).filter((k) => k.startsWith(`${kind}/`) && known[k].sig !== "-").length;
    // a safety valve: more than half of a kind gone at once, and more than five, is a copy that went wrong, not a person deleting
    if (gone.length > 5 && gone.length > alive / 2) continue;
    for (const k of gone) {
      dels.push({ kind, id: k.slice(kind.length + 1), at: now });
      next[k] = { sig: "-", at: now };
    }
  }
  return { ups, dels, next };
}

// Take the account's records into the phone's copy: for each record the newest wins. A record changed on this phone and
// not sent yet counts as changed at `localAt` (the phone's last change). Photos stay with the phone's copy of a record.
export function merge(state: any, remote: Remote, known: Known, localAt: string): { state: any; known: Known; changed: boolean } {
  let s = state, changed = false;
  const next: Known = { ...known };
  for (const kind of KINDS) {
    const list = [...listOf(s, kind)];
    const at = new Map(list.map((x, i) => [x.id, i]));
    let touched = false;
    const drop = new Set<string>();
    for (const r of remote[kind] ?? []) {
      const k = keyOf(kind, r.id), kn = next[k];
      const i = at.get(r.id), local = i === undefined ? undefined : list[i];
      const localSig = local ? sigOf(kind, local) : null;
      const localWhen = local ? (kn && kn.sig === localSig ? kn.at : localAt) : kn?.sig === "-" ? kn.at : "";
      if (r.deletedAt) {
        if (local && r.deletedAt >= localWhen) { drop.add(r.id); next[k] = { sig: "-", at: r.deletedAt }; touched = true; }
        else if (!local) next[k] = { sig: "-", at: r.deletedAt };
        continue;
      }
      if (!r.data) continue;
      const remoteSig = sigOf(kind, r.data);
      if (local && localSig === remoteSig) { next[k] = { sig: remoteSig, at: r.at > localWhen ? r.at : localWhen }; continue; }
      if (!local) {
        if (kn?.sig === "-" && kn.at >= r.at) continue; // deleted here after the account's change
        if (kn && kn.sig !== "-" && r.at <= kn.at) continue; // deleted here and not sent yet: the account still has the version this phone knew
        list.push(r.data); at.set(r.id, list.length - 1); next[k] = { sig: remoteSig, at: r.at }; touched = true;
        continue;
      }
      if (r.at > localWhen) {
        const keep = kind === "foods" ? { photo: local.photo, photos: local.photos } : kind === "cards" ? { photo: local.photo } : {};
        list[i!] = { ...r.data, ...Object.fromEntries(Object.entries(keep).filter(([, v]) => v !== undefined)) };
        next[k] = { sig: remoteSig, at: r.at }; touched = true;
      }
    }
    if (touched) {
      let out = list.filter((x) => !drop.has(x.id));
      if (kind === "cards") out = out.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      s = withList(s, kind, out); changed = true;
    }
  }
  return { state: s, known: next, changed };
}
