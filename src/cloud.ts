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
const db = () => getFirestore(getApp());

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
export async function deleteAccount() {
  const u = auth().currentUser; if (!u) return;
  await deleteDoc(doc(db(), "users", u.uid)).catch(() => {});
  await deleteUser(u);
}
