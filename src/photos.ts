// Storage release 1 (7 October 2026, canvas boards P0 to P2): photos are files.
// On the phone they live in their own photo store (IndexedDB), never inside the saved data, which browsers cap at about 5 MB.
// In the account they live as image files in Firebase Storage, Frankfurt, under users/{uid}/photos/.
// Keys, as before: food:<foodId> is the small preview, food:<foodId>:<n> the larger copies, fb:<cardId> a plate photo.

type Photoish = { photo?: string; photos?: string[] };
const isData = (x: unknown): x is string => typeof x === "string" && x.startsWith("data:");

// A cheap fingerprint: enough to see that the picture under a key changed, without comparing whole photos.
export const sig = (data: string) => `${data.length}:${data.slice(-32)}`;

// Copies of a food: inside the plate being built (items), saved meals, and the plates on cards (feedback[].meal.items).
const copiesOf = (state: any): any[] => [
  ...(state?.items ?? []).map((i: any) => i?.food),
  ...(state?.meals ?? []).flatMap((m: any) => (m?.items ?? []).map((i: any) => i?.food)),
  ...(state?.feedback ?? []).flatMap((fb: any) => (fb?.meal?.items ?? []).map((i: any) => i?.food)),
].filter(Boolean);
const libraryIds = (state: any) => new Set<string>((state?.foods ?? []).map((f: any) => f?.id).filter(Boolean));

// Every photo the state holds, by key. The library is the one source for a food's photos: a copy of a library food
// inside a plate, a meal or a card never speaks for it (a copy can be older). Only a food that left the library is
// kept through its copies.
export function photosOf(state: any): Map<string, string> {
  const out = new Map<string, string>();
  const rec = (pre: string) => (f: (Photoish & { id?: string }) | undefined) => {
    if (!f || !f.id) return;
    if (isData(f.photo) && !out.has(`${pre}:${f.id}`)) out.set(`${pre}:${f.id}`, f.photo);
    (f.photos ?? []).forEach((x, n) => { if (isData(x) && !out.has(`${pre}:${f.id}:${n + 1}`)) out.set(`${pre}:${f.id}:${n + 1}`, x); });
  };
  const food = rec("food");
  (state?.foods ?? []).forEach(food);
  // a card's photos (10 October 2026): the plate photo as the preview, the meal's photos as the copies, like a food
  (state?.feedback ?? []).forEach(rec("fb"));
  const lib = libraryIds(state);
  copiesOf(state).filter((f) => !lib.has(f.id)).forEach(food);
  return out;
}

// What a food or a card says about its photos, for the other phones: the fingerprint of the preview first, then of each
// larger copy, "" where there is none. Only from photos that are here; undefined when they have not loaded.
export function photoSigsOf(x: any): string[] | undefined {
  if (!x || typeof x !== "object") return undefined;
  if (Array.isArray(x.photos)) return [isData(x.photo) ? sig(x.photo) : "", ...x.photos.map((p: unknown) => (isData(p) ? sig(p) : ""))];
  if (isData(x.photo)) return [sig(x.photo)];
  return undefined;
}
const loaded = (f: any) => Array.isArray(f?.photos) || isData(f?.photo);
const same = (a?: string[], b?: string[]) => Boolean(a && b && a.join() === b.join());

// Photos another phone added or changed: a food from the account says which photos it has (photoSigs); where this phone
// doesn't hold them yet, these are the keys to fetch, with the fingerprint each should have.
export function photosWanted(state: any): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of state?.foods ?? []) {
    const want: string[] | undefined = Array.isArray(f?.photoSigs) ? f.photoSigs : undefined;
    if (!f?.id || !want || loaded(f)) continue;
    want.forEach((s, n) => { if (s) out.set(n === 0 ? `food:${f.id}` : `food:${f.id}:${n}`, s); });
  }
  for (const fb of state?.feedback ?? []) {
    const want: string[] | undefined = Array.isArray(fb?.photoSigs) ? fb.photoSigs : undefined;
    if (!fb?.id || !want || loaded(fb)) continue;
    want.forEach((s, n) => { if (s) out.set(n === 0 ? `fb:${fb.id}` : `fb:${fb.id}:${n}`, s); });
  }
  return out;
}

// Puts photos back where they belong, only where the state has none: what the state already holds is never replaced.
// A food whose list of photos is empty on purpose ([]) stays empty. A food that says which photos it has (photoSigs) gets
// them only as a whole set, each one the right one: from the phone's store when its fingerprint matches, or as fetched
// from the account (accept). Never half a set, so this phone can't send back fewer photos than the food has.
export function withPhotos<T>(state: T, photos: Map<string, string>, accept?: Set<string>): T {
  if (!photos.size) return state;
  const s: any = state;
  let changed = false;
  const rec = (pre: string) => (f: any) => {
    if (!f || !f.id) return f;
    if (Array.isArray(f.photos) && f.photos.length === 0 && !f.photo) return f;
    const want: string[] | undefined = Array.isArray(f.photoSigs) ? f.photoSigs : undefined;
    if (want) {
      if (loaded(f) || !want.some(Boolean)) return f;
      const pick = (k: string, n: number) => { const x = photos.get(k); return x && (accept?.has(k) || sig(x) === want[n]) ? x : undefined; };
      const thumb = want[0] ? pick(`${pre}:${f.id}`, 0) : undefined;
      if (want[0] && !thumb) return f;
      const more: string[] = [];
      for (let n = 1; n < want.length; n++) { const x = want[n] ? pick(`${pre}:${f.id}:${n}`, n) : undefined; if (!x) return f; more.push(x); }
      changed = true;
      return { ...f, photo: thumb, photos: want.length > 1 ? more : undefined };
    }
    const thumb = f.photo ?? photos.get(`${pre}:${f.id}`);
    let more = f.photos as string[] | undefined;
    if (!more) {
      const found: string[] = [];
      for (let n = 1; n <= 12; n++) { const x = photos.get(`${pre}:${f.id}:${n}`); if (!x) break; found.push(x); }
      if (found.length) more = found;
    }
    if (thumb === f.photo && more === f.photos) return f;
    changed = true;
    return { ...f, photo: thumb, photos: more };
  };
  const food = rec("food"), card = rec("fb");
  const inItems = (items: any[] | undefined) => (items ?? []).map((i: any) => (i?.food ? { ...i, food: food(i.food) } : i));
  const next = {
    ...s,
    foods: (s.foods ?? []).map(food),
    feedback: (s.feedback ?? []).map((fb: any) => {
      const withOwn = card(fb);
      return { ...withOwn, meal: fb.meal ? { ...fb.meal, items: inItems(fb.meal.items) } : fb.meal };
    }),
    items: inItems(s.items),
    meals: (s.meals ?? []).map((m: any) => ({ ...m, items: inItems(m.items) })),
  };
  return changed ? next : state;
}
// Whether this phone's photos of a food or card are the ones the account's copy names (or the account names none)
export const samePhotos = (local: any, remote: any) => !Array.isArray(remote?.photoSigs) || !loaded(local) || same(photoSigsOf(local), remote.photoSigs);

// The saved data without the photos that are safely in the photo store. A food or a card keeps its photos in the saved
// data until every one of them is confirmed in the store, so nothing is ever only in memory. Copies of a library food
// carry no photos in the saved data at all: they come back from the library's.
export function withoutStored<T>(state: T, stored: Set<string>): T {
  const s: any = structuredClone(state);
  const lib = libraryIds(s);
  const food = (f: any, copy = false) => {
    if (!f || !f.id) return;
    if (copy && lib.has(f.id)) { delete f.photo; delete f.photos; return; }
    const keys = [...(isData(f.photo) ? [`food:${f.id}`] : []), ...((f.photos ?? []) as string[]).map((_, n) => `food:${f.id}:${n + 1}`)];
    if (!keys.length || !keys.every((k) => stored.has(k))) return;
    f.photoCount = Array.isArray(f.photos) ? f.photos.length : 0;
    if (!copy) f.photoSigs = photoSigsOf(f);
    delete f.photo; delete f.photos;
  };
  (s.foods ?? []).forEach((f: any) => food(f));
  copiesOf(s).forEach((f) => food(f, true));
  (s.feedback ?? []).forEach((fb: any) => {
    if (!fb || !fb.id) return;
    const keys = [...(isData(fb.photo) ? [`fb:${fb.id}`] : []), ...((fb.photos ?? []) as string[]).map((_, n) => `fb:${fb.id}:${n + 1}`)];
    if (!keys.length || !keys.every((k) => stored.has(k))) return;
    fb.photoCount = Array.isArray(fb.photos) ? fb.photos.length : 0;
    fb.photoSigs = photoSigsOf(fb); fb.hasPhoto = isData(fb.photo);
    delete fb.photo; delete fb.photos;
  });
  return s;
}

// A key as a file name in the account: food:abc:2 becomes food~abc~2.jpg
export const fileOf = (key: string) => `${key.replace(/:/g, "~")}.jpg`;
export const keyOf = (file: string) => file.replace(/\.jpg$/, "").replace(/~/g, ":");

// A photo that left the state is removed from the phone and the account only when what it belonged to is gone.
// For a library food, the library decides: the food is gone, or its list of photos is shorter than the key's number,
// or it has no photos left at all ([] and no preview). A food whose photos have not loaded yet never loses them.
// A food that left the library keeps its photos while a plate, a meal or a card still shows it.
export function isOrphan(key: string, state: any): boolean {
  const [kind, id, n] = key.split(":");
  if (kind === "fb") {
    const fb = (state?.feedback ?? []).find((f: any) => f?.id === id);
    if (!fb) return true;
    if (!n) return false;
    return Array.isArray(fb.photos) ? fb.photos.length < Number(n) : false;
  }
  const lib = (state?.foods ?? []).find((f: any) => f?.id === id);
  if (lib) {
    if (!Array.isArray(lib.photos)) return false;
    return n ? lib.photos.length < Number(n) : lib.photos.length === 0 && !lib.photo;
  }
  const copies = copiesOf(state).filter((f) => f.id === id);
  if (!copies.length) return true;
  if (!n) return false;
  const lists = copies.filter((f: any) => Array.isArray(f.photos));
  return lists.length > 0 && lists.every((f: any) => f.photos.length < Number(n));
}
// previews first: a key without a copy number
export const isPreview = (key: string) => key.split(":").length === 2;

// ---- the phone's photo store ----
const DB_NAME = "chefmealan-photos", OS = "photos";
let dbp: Promise<IDBDatabase> | null = null;
function open(): Promise<IDBDatabase> {
  if (!dbp) dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore(OS); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error("photo store blocked"));
    } catch (e) { rej(e); }
  });
  return dbp;
}
const tx = async <R,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<R> | void): Promise<R | undefined> => {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(OS, mode);
    const req = fn(t.objectStore(OS));
    t.oncomplete = () => res(req ? (req as IDBRequest<R>).result : undefined);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error ?? new Error("aborted"));
  });
};
// true when this browser gives us a photo store; private windows and old browsers may not
export async function storeOk(): Promise<boolean> {
  try { await tx("readwrite", (s) => s.put("ok", "__probe")); return true; } catch { return false; }
}
export async function storeAll(): Promise<Map<string, string>> {
  const db = await open();
  return new Promise((res, rej) => {
    const out = new Map<string, string>();
    const t = db.transaction(OS, "readonly");
    const c = t.objectStore(OS).openCursor();
    c.onsuccess = () => { const cur = c.result; if (cur) { if (String(cur.key) !== "__probe" && isData(cur.value)) out.set(String(cur.key), cur.value as string); cur.continue(); } };
    t.oncomplete = () => res(out);
    t.onerror = () => rej(t.error);
  });
}
export async function storePut(entries: [string, string][]) {
  if (!entries.length) return;
  await tx("readwrite", (s) => { for (const [k, v] of entries) s.put(v, k); });
}
export async function storeDel(keys: string[]) {
  if (!keys.length) return;
  await tx("readwrite", (s) => { for (const k of keys) s.delete(k); });
}
export async function storeClear() {
  try { await tx("readwrite", (s) => s.clear()); } catch { /* nothing to clear */ }
}

// A food's real photos (board C9, Milan, 8 October 2026): a drawn picture (an SVG icon) is never one of them, so it never
// shows as a photo, and the first real photo added takes its place as the food's picture. The main photo is the first.
export const isDrawn = (x: string | null | undefined) => typeof x === "string" && x.startsWith("data:image/svg");
export function realPhotosOf(f: { photos?: string[]; photo?: string } | null | undefined): string[] {
  if (!f) return [];
  return (f.photos?.length ? f.photos : f.photo ? [f.photo] : []).filter((x) => x && !isDrawn(x));
}
