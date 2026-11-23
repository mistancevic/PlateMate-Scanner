// B141 (0.3.146, board Stories219; Coach Milan 14 November 2026): a client is never unnamed, and the coach sees how they came in.
// The name on Clients: what the client typed in Profile; else the name from the form or the invite; else the invite's email.
import { w, dateText } from "./words";
import { BOOK_PAGES, BOOK_SOURCES } from "./bookPages";

export type Via = { kind: "form" | "invite" | "waitlist"; from?: string; src?: string; at?: string };
export type Joined = { uid: string; name: string; email: string; via: Via | null };
export type Identity = { name: string; email: string; named: boolean; via: Via | null };

export function clientIdentity(profileName: unknown, j?: Joined | null): Identity {
  const own = typeof profileName === "string" ? profileName.trim() : "", email = (j?.email ?? "").trim(), given = (j?.name ?? "").trim();
  const name = own || given || email;
  return { name: name || w("coach.noNameYet"), email, named: Boolean(own || given), via: j?.via ?? null };
}

// "From the home page form · QR · 13 November"
export function fromLine(via: Via | null | undefined): string {
  if (!via) return "";
  const at = via.at && !Number.isNaN(Date.parse(via.at)) ? dateText(new Date(via.at), { day: "numeric", month: "long" }) : "";
  const where = via.kind === "waitlist" ? w("coach.fromWaitlist") : via.kind === "invite" ? w("coach.fromInvite")
    : via.from && BOOK_PAGES[via.from] ? w("coach.fromPage", { page: BOOK_PAGES[via.from] }) : w("coach.fromHomeForm");
  const src = via.kind === "form" && via.src && BOOK_SOURCES[via.src] ? BOOK_SOURCES[via.src] : "";
  return [where, src, at].filter(Boolean).join(" · ");
}

// An empty Profile name never replaces a name already in the account (the cause of "unnamed": the phone saved its empty name
// over the one the invite had written).
export function keepName<T extends { clientName?: unknown }>(data: T): T {
  if (typeof data.clientName === "string" && data.clientName.trim()) return data;
  const { clientName: _drop, ...rest } = data; return rest as T;
}

// B156 (0.3.181, board Stories281; Go 23 November 2026, 12:43): a card with no name shows the whole line No name yet, never
// its first word No; any other name gives its first word, as before.
export const firstOf = (name: string): string => { const n = String(name ?? "").trim(); return n === w("coach.noNameYet") ? n : n.split(" ")[0]; };

// B156: the names from the invites. The last good answer is kept on the coach's phone (cleared with the phone at sign-out) and
// used when the request fails; a failed request is asked once more about 3 s later, and onLate gets that answer when it comes.
const JOINED_KEY = (coach: string) => `chefmealan-joined-${coach}`;
export const RETRY_MS = 3000;
const keepJoined = (coach: string, list: Joined[]) => { try { localStorage.setItem(JOINED_KEY(coach), JSON.stringify(list.map(({ uid, name, email, via }) => ({ uid, name, email, via })))); } catch { /* the names stay for this visit only */ } };
const keptJoined = (coach: string): Joined[] => { try { const x = JSON.parse(localStorage.getItem(JOINED_KEY(coach)) || "[]"); return Array.isArray(x) ? x : []; } catch { return []; } };
async function askJoined(get: () => Promise<Response>): Promise<Joined[] | null> {
  try { const r = await get(); if (!r.ok) return null; const d = await r.json(); return Array.isArray(d?.joined) ? (d.joined as Joined[]) : null; } catch { return null; }
}
// known: the answer the second try already brought, so the cards are drawn again without asking a third time
export async function joinedNames(coach: string, onLate?: (list: Joined[]) => void, get: () => Promise<Response> = () => fetch("/api/invites"), known?: Joined[]): Promise<{ joined: Map<string, Joined>; fresh: boolean }> {
  const list = known ?? (await askJoined(get));
  if (list) { keepJoined(coach, list); return { joined: new Map(list.map((j) => [j.uid, j])), fresh: true }; }
  if (onLate) setTimeout(async () => { const again = await askJoined(get); if (again) { keepJoined(coach, again); onLate(again); } }, RETRY_MS);
  return { joined: new Map(keptJoined(coach).map((j) => [j.uid, j])), fresh: false };
}
