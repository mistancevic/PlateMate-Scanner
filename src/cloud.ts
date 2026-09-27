// Sign in with Google and keep each person's data under their own account. Off entirely when not configured.
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut, deleteUser, type User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

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

// One document per person: the pilot state plus goal and name. Small enough for now; foods with photos may need their own collection later.
export type CloudDoc = { state: unknown; goal: unknown; clientName: string; updatedAt: string };
export async function loadCloud(uid: string): Promise<CloudDoc | null> {
  const snap = await getDoc(doc(db(), "users", uid));
  return snap.exists() ? (snap.data() as CloudDoc) : null;
}
export async function saveCloud(uid: string, data: CloudDoc) {
  await setDoc(doc(db(), "users", uid), data);
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
  (s.feedback ?? []).forEach((fb: any) => { delete fb.photo; (fb.meal?.items ?? []).forEach((i: any) => strip(i.food)); });
  return s;
}
export const isEmptyState = (st: any) => !st || ((st.foods?.length ?? 0) === 0 && (st.feedback?.length ?? 0) === 0 && (st.meals?.length ?? 0) === 0);
export async function deleteAccount() {
  const u = auth().currentUser; if (!u) return;
  await deleteDoc(doc(db(), "users", u.uid)).catch(() => {});
  await deleteUser(u);
}
