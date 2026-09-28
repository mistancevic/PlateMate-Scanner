// Sign in with Google and keep each person's data under their own account. Off entirely when not configured.
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut, deleteUser, type User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, updateDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const cloudEnabled = Boolean(cfg.apiKey && cfg.projectId && cfg.appId && cfg.authDomain);
let app: FirebaseApp | null = null;
const getApp = () => (app ??= initializeApp(cfg));
const auth = () => getAuth(getApp());
// A project can hold several Firestore databases; the client reaches "(default)" unless told which one.
const dbId = import.meta.env.VITE_FIREBASE_DB_ID as string | undefined;
const db = () => (dbId && dbId !== "(default)" ? getFirestore(getApp(), dbId) : getFirestore(getApp()));

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
export type CloudDoc = { state: unknown; goal: unknown; clientName: string; updatedAt: string; role?: "coach"; coachId?: string; coachName?: string; coachSetAt?: string };
export async function loadCloud(uid: string): Promise<CloudDoc | null> {
  const snap = await getDoc(doc(db(), "users", uid));
  return snap.exists() ? (snap.data() as CloudDoc) : null;
}
export async function saveCloud(uid: string, data: CloudDoc) {
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
export async function joinCoach(uid: string, code: string) {
  const snap = await getDoc(doc(db(), "coaches", code.trim().toUpperCase()));
  if (!snap.exists()) throw new Error("No coach with that code.");
  const { uid: coachId, name } = snap.data() as { uid: string; name: string };
  await updateDoc(doc(db(), "users", uid), { coachId, coachName: name || "your coach" });
  return { coachId, coachName: name || "your coach" };
}
export async function leaveCoach(uid: string) {
  await updateDoc(doc(db(), "users", uid), { coachId: null, coachName: null });
}
export type ClientRow = { uid: string; name: string; goal: any; feedback: any[]; foods: number; updatedAt: string };
export async function listClients(coachUid: string): Promise<ClientRow[]> {
  const q = query(collection(db(), "users"), where("coachId", "==", coachUid));
  const snap = await getDocs(q);
  const rows = await Promise.all(snap.docs.map(async (d) => {
    const x = d.data() as any;
    let feedback: any[] = [];
    try { feedback = await loadSharedCards(d.id); } catch { /* none shared or not allowed */ }
    return { uid: d.id, name: x.clientName || "unnamed", goal: x.goal ?? null, feedback, foods: x.state?.foods?.length ?? 0, updatedAt: x.updatedAt ?? "" };
  }));
  return rows.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}
export async function setClientGoal(clientUid: string, goal: any, goals: { calories: number; protein: number }, coachName: string) {
  await updateDoc(doc(db(), "users", clientUid), {
    goal: { ...goal, setBy: "coach", coachName, setAt: new Date().toISOString() },
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
  const strip = (f: any) => { if (f && typeof f === "object") delete f.photo; return f; };
  (s.foods ?? []).forEach(strip);
  (s.items ?? []).forEach((i: any) => strip(i.food));
  (s.meals ?? []).forEach((m: any) => (m.items ?? []).forEach((i: any) => strip(i.food)));
  s.feedback = []; // cards live as their own documents, see saveCards
  return s;
}
// ---- cards ----
// Each meal card is its own document under users/{uid}/cards. Private by default; the coach may read only shared ones.
export async function saveCards(uid: string, cards: any[]) {
  for (let i = 0; i < cards.length; i += 20) {
    const b = writeBatch(db());
    for (const fb of cards.slice(i, i + 20)) {
      const copy = structuredClone(fb); delete copy.photo;
      (copy.meal?.items ?? []).forEach((it: any) => { if (it.food) delete it.food.photo; });
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
export async function deleteAccount() {
  const u = auth().currentUser; if (!u) return;
  await deleteDoc(doc(db(), "users", u.uid)).catch(() => {});
  await deleteUser(u);
}

// ---- photos ----
// Small pictures (label thumbnails, plate photos) live one per document under users/{uid}/photos, so the main document stays small
// and a second device, or the coach, can fetch them. Keys: food:<foodId>, fb:<feedbackId>.
export async function savePhotos(uid: string, photos: { key: string; data: string }[]) {
  for (let i = 0; i < photos.length; i += 20) {
    const b = writeBatch(db());
    for (const p of photos.slice(i, i + 20)) b.set(doc(db(), "users", uid, "photos", p.key), { data: p.data, updatedAt: new Date().toISOString() });
    await b.commit();
  }
}
export async function loadPhotos(uid: string): Promise<Map<string, string>> {
  const snap = await getDocs(collection(db(), "users", uid, "photos"));
  return new Map(snap.docs.map((d) => [d.id, (d.data() as any).data as string]));
}

// ---- inbox: recipes a coach sends to a client ----
export type InboxItem = { id: string; from: string; note: string; meal: any; sentAt: string };
export async function sendRecipe(clientUid: string, item: InboxItem) {
  const copy = structuredClone(item);
  (copy.meal?.items ?? []).forEach((it: any) => { if (it.food) delete it.food.photo; });
  await setDoc(doc(db(), "users", clientUid, "inbox", item.id), copy);
}
export async function loadInbox(uid: string): Promise<InboxItem[]> {
  const snap = await getDocs(collection(db(), "users", uid, "inbox"));
  return snap.docs.map((d) => d.data() as InboxItem).sort((a, b) => (b.sentAt > a.sentAt ? 1 : -1));
}
export async function clearInboxItem(uid: string, id: string) { await deleteDoc(doc(db(), "users", uid, "inbox", id)); }
