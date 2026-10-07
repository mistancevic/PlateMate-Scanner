// Storage release 1 (7 October 2026, canvas boards P0 to P2): photos are files.
// On the phone they live in their own photo store (IndexedDB), never inside the saved data, which browsers cap at about 5 MB.
// In the account they live as image files in Firebase Storage, Frankfurt, under users/{uid}/photos/.
// Keys, as before: food:<foodId> is the small preview, food:<foodId>:<n> the larger copies, fb:<cardId> a plate photo.

type Photoish = { photo?: string; photos?: string[] };
const isData = (x: unknown): x is string => typeof x === "string" && x.startsWith("data:");

// A cheap fingerprint: enough to see that the picture under a key changed, without comparing whole photos.
export const sig = (data: string) => `${data.length}:${data.slice(-32)}`;

// Every photo the state holds, by key. A food inside a plate or a meal counts under its own food key.
export function photosOf(state: any): Map<string, string> {
  const out = new Map<string, string>();
  const food = (f: (Photoish & { id?: string }) | undefined) => {
    if (!f || !f.id) return;
    if (isData(f.photo) && !out.has(`food:${f.id}`)) out.set(`food:${f.id}`, f.photo);
    (f.photos ?? []).forEach((x, n) => { if (isData(x) && !out.has(`food:${f.id}:${n + 1}`)) out.set(`food:${f.id}:${n + 1}`, x); });
  };
  (state?.foods ?? []).forEach(food);
  (state?.feedback ?? []).forEach((fb: any) => { if (isData(fb?.photo)) out.set(`fb:${fb.id}`, fb.photo); });
  (state?.items ?? []).forEach((i: any) => food(i?.food));
  (state?.meals ?? []).forEach((m: any) => (m?.items ?? []).forEach((i: any) => food(i?.food)));
  return out;
}

// Puts photos back where they belong, only where the state has none: what the state already holds is never replaced.
export function withPhotos<T>(state: T, photos: Map<string, string>): T {
  if (!photos.size) return state;
  const s: any = state;
  const food = (f: any) => {
    if (!f || !f.id) return f;
    const thumb = f.photo ?? photos.get(`food:${f.id}`);
    let more = f.photos as string[] | undefined;
    if (!more) {
      const found: string[] = [];
      for (let n = 1; n <= 12; n++) { const x = photos.get(`food:${f.id}:${n}`); if (!x) break; found.push(x); }
      if (found.length) more = found;
    }
    return thumb === f.photo && more === f.photos ? f : { ...f, photo: thumb, photos: more };
  };
  let changed = false;
  const food0 = food;
  const foodC = (f: any) => { const g = food0(f); if (g !== f) changed = true; return g; };
  const next = {
    ...s,
    foods: (s.foods ?? []).map(foodC),
    feedback: (s.feedback ?? []).map((fb: any) => (fb.photo || !photos.get(`fb:${fb.id}`) ? fb : ((changed = true), { ...fb, photo: photos.get(`fb:${fb.id}`) }))),
    items: (s.items ?? []).map((i: any) => (i?.food ? { ...i, food: foodC(i.food) } : i)),
    meals: (s.meals ?? []).map((m: any) => ({ ...m, items: (m.items ?? []).map((i: any) => (i?.food ? { ...i, food: foodC(i.food) } : i)) })),
  };
  return changed ? next : state;
}

// The saved data without the photos that are safely in the photo store. A food or a card keeps its photos in the saved
// data until every one of them is confirmed in the store, so nothing is ever only in memory.
export function withoutStored<T>(state: T, stored: Set<string>): T {
  const s: any = structuredClone(state);
  const food = (f: any) => {
    if (!f || !f.id) return;
    const keys = [...(isData(f.photo) ? [`food:${f.id}`] : []), ...((f.photos ?? []) as string[]).map((_, n) => `food:${f.id}:${n + 1}`)];
    if (!keys.length || !keys.every((k) => stored.has(k))) return;
    f.photoCount = Array.isArray(f.photos) ? f.photos.length : 0;
    delete f.photo; delete f.photos;
  };
  (s.foods ?? []).forEach(food);
  (s.items ?? []).forEach((i: any) => food(i?.food));
  (s.meals ?? []).forEach((m: any) => (m?.items ?? []).forEach((i: any) => food(i?.food)));
  (s.feedback ?? []).forEach((fb: any) => { if (isData(fb?.photo) && stored.has(`fb:${fb.id}`)) { delete fb.photo; fb.hasPhoto = true; } });
  return s;
}

// A key as a file name in the account: food:abc:2 becomes food~abc~2.jpg
export const fileOf = (key: string) => `${key.replace(/:/g, "~")}.jpg`;
export const keyOf = (file: string) => file.replace(/\.jpg$/, "").replace(/~/g, ":");

// A photo that left the state is removed from the phone and the account only when what it belonged to is gone:
// the food or the card no longer exists, or the food's list of photos got shorter. A food whose photos simply
// have not loaded yet never loses them.
export function isOrphan(key: string, state: any): boolean {
  const [kind, id, n] = key.split(":");
  if (kind === "fb") return !(state?.feedback ?? []).some((f: any) => f?.id === id);
  const all = [...(state?.foods ?? []), ...(state?.items ?? []).map((i: any) => i?.food), ...(state?.meals ?? []).flatMap((m: any) => (m?.items ?? []).map((i: any) => i?.food))];
  const mine = all.filter((f: any) => f && f.id === id);
  if (!mine.length) return true;
  if (!n) return false;
  const lists = mine.filter((f: any) => Array.isArray(f.photos));
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
