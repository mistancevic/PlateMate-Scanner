// DT196 (0.3.37, board Stories145; Coach Milan 31 October 22:01 "Sign out after 30 days of inactivity"): a phone that has not
// opened the app for 30 days signs out, the way Sign out does (saves what is not saved, clears the phone), and the sign-in page
// says why in one line. The day the app was last opened is kept on the phone only. Tracker f16.
export const IDLE_DAYS = 30;
export const LAST_OPEN_KEY = "chefmealan-last-open";
export const IDLE_OUT_KEY = "chefmealan-idle-out";   // set just before the sign-out, read once by the sign-in page

export const daysSince = (iso: string | null, now: Date): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso); if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / 86400000);
};
// true when the phone has to sign out: last opened 30 or more days ago. No date yet means the app was never opened on this
// phone since 0.3.37: the date is set now and nothing else happens
export const idleOut = (lastOpen: string | null, now: Date): boolean => { const d = daysSince(lastOpen, now); return d !== null && d >= IDLE_DAYS; };

export function lastOpen(): string | null { try { return localStorage.getItem(LAST_OPEN_KEY); } catch { return null; } }
export function markOpen(now = new Date()): void { try { localStorage.setItem(LAST_OPEN_KEY, now.toISOString()); } catch { /* nothing to keep */ } }
// the line on the sign-in page, read once
export function takeIdleOut(): boolean { try { const v = sessionStorage.getItem(IDLE_OUT_KEY) === "1"; sessionStorage.removeItem(IDLE_OUT_KEY); return v; } catch { return false; } }
export function setIdleOut(): void { try { sessionStorage.setItem(IDLE_OUT_KEY, "1"); } catch { /* the page says nothing, then */ } }
export const IDLE_LINE = `This phone did not open Chef Mealan for ${IDLE_DAYS} days, so the app signed you out. Your data is in your account.`;
