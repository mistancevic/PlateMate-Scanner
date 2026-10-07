// Sign in with Google and keep each person's data under their own account. Off entirely when not configured.
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut, deleteUser, reauthenticateWithPopup, type User } from "firebase/auth";
import { getFirestore, initializeFirestore, doc, getDoc, setDoc, deleteDoc, updateDoc, collection, query, where, getDocs, writeBatch, type Firestore } from "firebase/firestore";
import { getStorage, ref as fileRef, uploadString, getBytes, deleteObject, listAll } from "firebase/storage";

// outside the browser build (the tests) there is no env: the cloud is simply off
const env: Record<string, string | undefined> = (import.meta as any).env ?? {};
const cfg = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  // photos as files (storage release 1): the project's default bucket, in Frankfurt, unless told otherwise
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (env.VITE_FIREBASE_PROJECT_ID ? `${env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app` : undefined),
};
export const cloudEnabled = Boolean(cfg.apiKey && cfg.projectId && cfg.appId && cfg.authDomain);
let app: FirebaseApp | null = null;
const getApp = () => (app ??= initializeApp(cfg));
const auth = () => getAuth(getApp());
// A project can hold several Firestore databases; the client reaches "(default)" unless told which one.
const dbId = env.VITE_FIREBASE_DB_ID;
// Fields a label read leaves as undefined must not break a save: the client drops them on the way out.
let dbInstance: Firestore | null = null;
const db = () => {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = dbId && dbId !== "(default)" ? initializeFirestore(getApp(), { ignoreUndefinedProperties: true }, dbId) : initializeFirestore(getApp(), { ignoreUndefinedProperties: true });
  } catch {
    dbInstance = dbId && dbId !== "(default)" ? getFirestore(getApp(), dbId) : getFirestore(getApp());
  }
  return dbInstance;
};

export type CloudUser = { uid: string; name: string; email: string; photo: string };
const asUser = (u: User): CloudUser => ({ uid: u.uid, name: u.displayName ?? "", email: u.email ?? "", photo: u.photoURL ?? "" });

export function watchUser(cb: (u: CloudUser | null) => void) {
  if (!cloudEnabled) { cb(null); return () => {}; }
  getRedirectResult(auth()).catch(() => {});
  return onAuthStateChanged(auth(), (u) => cb(u ? asUser(u) : null));
}
export async function signIn() {
  const provider = new GoogleAuthProvider();
  try { await signInWithPopup(auth(), provider); }
  catch (e: any) {
    if (String(e?.code).includes("popup")) await signInWithRedirect(auth(), provider); else throw e;
  }
}
export const signOutCloud = () => signOut(auth());

// One document per person: the pilot state plus goal and name, and who coaches them.
// role is set by hand in the Firebase console ("coach"); nobody can sign up as a coach.
export type CloudDoc = { photosMovedAt?: string; photosOldGoneAt?: string; state: unknown; goal: unknown; clientName: string; updatedAt: string; goneFoods?: string[]; personal?: unknown; safety?: unknown; aiConfirmedAt?: string; aiConfirmedBy?: string; goalLog?: unknown[]; formula?: "mifflin" | "katch" | null; role?: "coach"; coachId?: string; coachName?: string; coachEmail?: string | null; coachPhoto?: string | null; joinedAt?: string | null; coachSetAt?: string };
export async function loadCloud(uid: string): Promise<CloudDoc | null> {
  const snap = await getDoc(doc(db(), "users", uid));
  return snap.exists() ? (snap.data() as CloudDoc) : null;
}
// While an account is being deleted, this phone writes nothing to it: no save, no card, no photo file. An open app could
// otherwise put its old copy back after the record is gone (7 October 2026). A paused write fails, so nothing counts as saved.
let paused = false;
export const pauseAccountWrites = (on: boolean) => { paused = on; };
const notPaused = () => { if (paused) throw new Error("Saving is paused while your account is deleted."); };
export async function saveCloud(uid: string, data: CloudDoc) {
  notPaused();
  // merge, so fields the coach or the console own (role, coach link, coachSetAt) are never wiped by the client's save
  await setDoc(doc(db(), "users", uid), data, { merge: true });
}
// ---- coach and clients ----
// A short code from the coach's uid; the coach publishes it once under coaches/{code}.
export const codeFor = (uid: string) => { let h = 0; for (const ch of uid) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h.toString(36).toUpperCase().padStart(6, "0").slice(-6); };
export async function publishCoachCode(uid: string, name: string) {
  const code = codeFor(uid);
  await setDoc(doc(db(), "coaches", code), { uid, name, updatedAt: new Date().toISOString() });
  return code;
}
export async function joinCoach(_uid: string, code: string) {
  // the server checks the invite: right code, right email, not used, not expired
  const r = await fetch("/api/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Couldn't join with that code.");
  return { coachId: d.coachId as string, coachName: (d.coachName as string) || "your coach", coachEmail: (d.coachEmail as string | null) ?? undefined, coachPhoto: (d.coachPhoto as string | null) ?? undefined, joinedAt: (d.joinedAt as string) ?? undefined };
}
export async function leaveCoach(uid: string) {
  await updateDoc(doc(db(), "users", uid), { coachId: null, coachName: null, coachEmail: null, coachPhoto: null, joinedAt: null });
}
export type ClientRow = { uid: string; name: string; review: NumbersReview | null; goal: any; feedback: any[]; foods: number; updatedAt: string; goalLog: any[]; formula: "mifflin" | "katch" | null; pdUnit: "pd" | "pct"; flags: { situation: string; at: string }[]; birthYear: number | null; aiConfirmedAt: string | null; consentBy: string | null };
export async function pinFormula(clientUid: string, formula: "mifflin" | "katch" | null) { await updateDoc(doc(db(), "users", clientUid), { formula }); }
export async function listClients(coachUid: string): Promise<ClientRow[]> {
  const q = query(collection(db(), "users"), where("coachId", "==", coachUid));
  const snap = await getDocs(q);
  const rows = await Promise.all(snap.docs.map(async (d) => {
    const x = d.data() as any;
    let feedback: any[] = [];
    try { feedback = await loadSharedCards(d.id); } catch { /* none shared or not allowed */ }
    // the coach sees situation and date only, never the person's words
    const flags = Array.isArray(x.safety?.flags) ? x.safety.flags.map((f: any) => ({ situation: String(f.situation), at: String(f.at ?? "").slice(0, 10) })) : [];
    return { uid: d.id, name: x.clientName || "unnamed", review: x.numbersReview ?? null, goal: x.goal ?? null, feedback, foods: x.state?.foods?.length ?? 0, updatedAt: x.updatedAt ?? "", goalLog: x.goalLog ?? [], formula: x.formula ?? null, pdUnit: x.personal?.pdUnit ?? "pd", flags, birthYear: x.personal?.birthYear ?? null, aiConfirmedAt: x.aiConfirmedAt ?? null, consentBy: x.safety?.consentBy ?? null };
  }));
  return rows.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}
// Target analysis and Coach Milan: what the person kept on purpose goes to the coach to approve or ask to change.
export type ReviewFinding = { id: string; title: string; body: string; source: string; day: string | null };
export type NumbersReview = { status: "waiting" | "approved" | "change" | "closed"; kept?: ReviewFinding[]; summary?: string; note?: string; reply?: string; at: string; by?: string };
export async function askReview(uid: string, kept: ReviewFinding[], summary: string, reply?: string) {
  await setDoc(doc(db(), "users", uid), { numbersReview: { status: "waiting", kept, summary, ...(reply ? { reply } : {}), at: new Date().toISOString() } }, { merge: true });
}
export async function closeReview(uid: string) { await setDoc(doc(db(), "users", uid), { numbersReview: { status: "closed", at: new Date().toISOString() } }, { merge: true }); }
export async function answerReview(clientUid: string, status: "approved" | "change", note: string, coachName: string, prev: NumbersReview) {
  await updateDoc(doc(db(), "users", clientUid), { numbersReview: { ...prev, status, note: note.trim() || null, by: coachName, at: new Date().toISOString() } });
}
export async function setClientGoal(clientUid: string, goal: any, goals: { calories: number; protein: number }, coachName: string) {
  await updateDoc(doc(db(), "users", clientUid), {
    goal: { ...goal, setBy: "coach", coachName, setAt: new Date().toISOString(), source: "coach" },
    "state.goals.calories": goals.calories, "state.goals.protein": goals.protein,
    coachSetAt: new Date().toISOString(),
  });
}
// Plain words for the two failures people will actually hit.
export function explainCloudError(e: any): string {
  const code = String(e?.code ?? ""), msg = String(e?.message ?? "");
  if (code.includes("permission-denied")) return "your account isn't allowed to save yet (the database rules)";
  if (/exceeds the maximum size|too large|1048487|INVALID_ARGUMENT/i.test(msg)) return "too much to save in one go";
  if (code.includes("unavailable") || /network|offline/i.test(msg)) return "no connection";
  return msg || "unknown error";
}
// Photos stay on the phone for now; everything else goes to the account. Keeps the document small.
export function stripPhotos<T>(state: T): T {
  const s: any = structuredClone(state);
  const strip = (f: any) => { if (f && typeof f === "object") { if (Array.isArray(f.photos)) f.photoCount = f.photos.length; else if (f.photo) f.photoCount = 0; delete f.photo; delete f.photos; } return f; };
  (s.foods ?? []).forEach(strip);
  (s.items ?? []).forEach((i: any) => strip(i.food));
  (s.meals ?? []).forEach((m: any) => (m.items ?? []).forEach((i: any) => strip(i.food)));
  s.feedback = []; // cards live as their own documents, see saveCards
  return s;
}
// ---- cards ----
// Each meal card is its own document under users/{uid}/cards. Private by default; the coach may read only shared ones.
export async function saveCards(uid: string, cards: any[]) {
  notPaused();
  for (let i = 0; i < cards.length; i += 20) {
    const b = writeBatch(db());
    for (const fb of cards.slice(i, i + 20)) {
      const copy = structuredClone(fb); delete copy.photo;
      (copy.meal?.items ?? []).forEach((it: any) => { if (it.food) { delete it.food.photo; delete it.food.photos; } });
      b.set(doc(db(), "users", uid, "cards", fb.id), { ...copy, shared: fb.shared ? true : false, reason: fb.shared?.reason ?? null, sharedAt: fb.shared?.at ?? null });
    }
    await b.commit();
  }
}
export async function loadCards(uid: string): Promise<any[]> {
  const snap = await getDocs(collection(db(), "users", uid, "cards"));
  return snap.docs.map((d) => { const x = d.data() as any; const { shared, reason, sharedAt, ...rest } = x; return { ...rest, shared: shared ? { reason, at: sharedAt } : undefined }; })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}
export async function loadSharedCards(clientUid: string): Promise<any[]> {
  const q = query(collection(db(), "users", clientUid, "cards"), where("shared", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => { const x = d.data() as any; const { shared, reason, sharedAt, ...rest } = x; return { ...rest, shared: { reason, at: sharedAt } }; })
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}
export async function deleteCard(uid: string, id: string) { await deleteDoc(doc(db(), "users", uid, "cards", id)); }
export const isEmptyState = (st: any) => !st || ((st.foods?.length ?? 0) === 0 && (st.feedback?.length ?? 0) === 0 && (st.meals?.length ?? 0) === 0);
// Delete everything: the photos, the cards and the recipes under the account, then the account document, then the sign-in.
// Each step reports; a step that fails stops the rest so nothing is half gone with the sign-in already removed.
export async function deleteAccount(onStep?: (s: string) => void) {
  const u = auth().currentUser; if (!u) return;
  for (const sub of ["photos", "cards", "inbox"]) {
    onStep?.(`Removing ${sub}`);
    const snap = await getDocs(collection(db(), "users", u.uid, sub));
    let batch = writeBatch(db()), n = 0;
    for (const d of snap.docs) { batch.delete(d.ref); if (++n % 400 === 0) { await batch.commit(); batch = writeBatch(db()); } }
    await batch.commit();
  }
  onStep?.("Removing the account record");
  await deleteDoc(doc(db(), "users", u.uid));
  onStep?.("Removing the sign-in");
  try { await deleteUser(u); }
  catch (e: any) {
    // Firebase wants a fresh sign-in before it removes the sign-in itself: ask for one, then try again
    if (e?.code !== "auth/requires-recent-login") throw e;
    onStep?.("Sign in once more to finish");
    await reauthenticateWithPopup(u, new GoogleAuthProvider());
    await deleteUser(u);
  }
}
// The coach confirms Mealan's chat for a client: two fields on the client's document, situation flags stay the client's
export async function confirmClientAi(clientUid: string, coachUid: string) { await updateDoc(doc(db(), "users", clientUid), { aiConfirmedAt: new Date().toISOString(), aiConfirmedBy: coachUid }); }
export async function clearClientAi(clientUid: string) { await updateDoc(doc(db(), "users", clientUid), { aiConfirmedAt: null, aiConfirmedBy: null }); }
// Everything under the account, for export: the record, the photos, the cards, the recipes
export async function exportAccount(uid: string) {
  const main = await loadCloud(uid);
  const read = async (sub: string) => (await getDocs(collection(db(), "users", uid, sub))).docs.map((d) => ({ id: d.id, ...d.data() }));
  return { account: main, photos: await read("photos"), cards: await read("cards"), inbox: await read("inbox") };
}

// ---- photos as files (storage release 1) ----
// Each photo is an image file under users/{uid}/photos/ in Firebase Storage. Only the owner reads and writes (storage.rules);
// a coach sees a shared plate's photo through our server, which checks the link and the share first.
const files = () => getStorage(getApp());
const photoFile = (uid: string, name: string) => fileRef(files(), `users/${uid}/photos/${name}`);
export async function uploadPhoto(uid: string, name: string, dataUrl: string) {
  notPaused();
  // the type comes from the photo itself (most are JPEG; the starter foods' pictures are SVG)
  await uploadString(photoFile(uid, name), dataUrl, "data_url", { cacheControl: "private, max-age=31536000" });
}
export async function deletePhotoFile(uid: string, name: string) {
  notPaused();
  try { await deleteObject(photoFile(uid, name)); } catch (e: any) { if (e?.code !== "storage/object-not-found") throw e; }
}
export async function listPhotoFiles(uid: string): Promise<string[]> {
  const r = await listAll(fileRef(files(), `users/${uid}/photos`));
  return r.items.map((i) => i.name);
}
export async function downloadPhoto(uid: string, name: string): Promise<string> {
  const bytes = await getBytes(photoFile(uid, name));
  const head = new Uint8Array(bytes.slice(0, 64));
  const text = new TextDecoder().decode(head).trimStart();
  const type = text.startsWith("<svg") || text.startsWith("<?xml") ? "image/svg+xml" : head[0] === 0x89 && head[1] === 0x50 ? "image/png" : head[0] === 0x52 && head[1] === 0x49 ? "image/webp" : "image/jpeg";
  const blob = new Blob([bytes], { type });
  return await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(blob); });
}
// The photos moved out of the database once; the old copies stay 30 days as a backup, then go.
export async function markPhotosMoved(uid: string) { notPaused(); await setDoc(doc(db(), "users", uid), { photosMovedAt: new Date().toISOString() }, { merge: true }); }
export async function dropOldPhotoCopies(uid: string) {
  notPaused();
  const snap = await getDocs(collection(db(), "users", uid, "photos"));
  let batch = writeBatch(db()), n = 0;
  for (const d of snap.docs) { batch.delete(d.ref); if (++n % 400 === 0) { await batch.commit(); batch = writeBatch(db()); } }
  await batch.commit();
  await setDoc(doc(db(), "users", uid), { photosOldGoneAt: new Date().toISOString() }, { merge: true });
}

// ---- photos before storage release 1 ----
// One per document under users/{uid}/photos: read once to move them into files, kept 30 days as a backup.
export async function loadPhotos(uid: string): Promise<Map<string, string>> {
  const snap = await getDocs(collection(db(), "users", uid, "photos"));
  return new Map(snap.docs.map((d) => [d.id, (d.data() as any).data as string]));
}

// ---- inbox: recipes a coach sends to a client ----
export type InboxItem = { id: string; from: string; note: string; meal: any; sentAt: string };
export async function sendRecipe(clientUid: string, item: InboxItem) {
  const copy = structuredClone(item);
  (copy.meal?.items ?? []).forEach((it: any) => { if (it.food) { delete it.food.photo; delete it.food.photos; } });
  await setDoc(doc(db(), "users", clientUid, "inbox", item.id), copy);
}
export async function loadInbox(uid: string): Promise<InboxItem[]> {
  const snap = await getDocs(collection(db(), "users", uid, "inbox"));
  return snap.docs.map((d) => d.data() as InboxItem).sort((a, b) => (b.sentAt > a.sentAt ? 1 : -1));
}
export async function clearInboxItem(uid: string, id: string) { await deleteDoc(doc(db(), "users", uid, "inbox", id)); }

// Every call to our own server carries the signed-in person's token; the server refuses AI calls without one.
let fetchPatched = false;
export function installAuthFetch() {
  if (!cloudEnabled || fetchPatched || typeof window === "undefined") return;
  fetchPatched = true;
  const plain = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
    const own = url.startsWith("/api/") || url.startsWith(`${location.origin}/api/`);
    const u = own ? auth().currentUser : null;
    if (u) {
      const send = async (fresh: boolean) => {
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        headers.set("Authorization", `Bearer ${await u.getIdToken(fresh)}`);
        return plain(input, { ...init, headers });
      };
      const res = await send(false);
      // a stale token gets one fresh retry, silently
      return res.status === 401 ? send(true) : res;
    }
    return plain(input, init);
  };
}
installAuthFetch();
