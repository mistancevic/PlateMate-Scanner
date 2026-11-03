// DT232 (0.3.72, board Stories171; Coach Milan 3 November 15:56 to 16:32, Go): View the app as Me, Coach or User, for the owner.
// Only what this phone shows changes: the role in the account, the server's checks and the data stay as they are. Kept on this
// phone; Dev data sets it, the header leads back.
import { useSyncExternalStore } from "react";
export type ViewAs = "me" | "coach" | "user";
const KEY = "chefmealan-view-as";
const subs = new Set<() => void>();
export function viewAs(): ViewAs {
  try { const v = localStorage.getItem(KEY); return v === "coach" || v === "user" ? v : "me"; } catch { return "me"; }
}
export function setViewAs(v: ViewAs) {
  try { if (v === "me") localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch { /* this phone keeps none */ }
  subs.forEach((f) => f());
}
export function useViewAs(): ViewAs {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, viewAs, () => "me");
}
// what a profile shows as: a coach role is kept for Me and Coach; Admin only for Me
export function shownProfile<P extends { role?: "coach"; admin?: boolean }>(p: P, v: ViewAs): P {
  if (v === "me") return p;
  return { ...p, admin: false, role: v === "user" ? undefined : p.role };
}
export const viewWord = (v: ViewAs) => (v === "coach" ? "Coach" : v === "user" ? "User" : "Me");
