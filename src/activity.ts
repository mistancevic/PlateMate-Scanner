// DT340 (0.3.182, board Stories282; Go 23 November 2026, 13:15): the day's activity, on the client's phone and on the coach's card.
// The phone keeps, for each day, whether the app was opened and whether she did something that shapes her food day (a meal
// logged, the plan changed, a weigh-in, a note answered), and when she last did. It rides in the account's main record, so the
// coach's card can draw it: opened, active, full (full comes from the day line, measured.ts). The last 28 days only.
export type DayActivity = "opened" | "active";
export type Activity = { days: Record<string, DayActivity>; lastActiveAt: string | null; lastOpenAt: string | null };
const KEY = "chefmealan-activity";
const KEEP_DAYS = 28;
const ymdLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const empty = (): Activity => ({ days: {}, lastActiveAt: null, lastOpenAt: null });

export function activityOf(x: unknown): Activity {
  if (!x || typeof x !== "object") return empty();
  const a = x as any, days: Record<string, DayActivity> = {};
  if (a.days && typeof a.days === "object") for (const [k, v] of Object.entries(a.days)) if (/^\d{4}-\d{2}-\d{2}$/.test(k) && (v === "opened" || v === "active")) days[k] = v;
  return { days, lastActiveAt: typeof a.lastActiveAt === "string" ? a.lastActiveAt : null, lastOpenAt: typeof a.lastOpenAt === "string" ? a.lastOpenAt : null };
}
export const getActivity = (): Activity => { try { return activityOf(JSON.parse(localStorage.getItem(KEY) || "null")); } catch { return empty(); } };
const trim = (a: Activity, now: Date): Activity => {
  const from = ymdLocal(new Date(now.getTime() - KEEP_DAYS * 864e5));
  return { ...a, days: Object.fromEntries(Object.entries(a.days).filter(([k]) => k >= from).sort(([x], [y]) => (x < y ? -1 : 1))) };
};
const put = (a: Activity) => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* kept for this visit only */ } };

// the app was opened: once a day is enough; returns whether anything changed
export function markOpened(now = new Date()): boolean {
  const a = getActivity(), day = ymdLocal(now);
  if (a.days[day]) return false;
  put(trim({ ...a, days: { ...a.days, [day]: a.days[day] ?? "opened" }, lastOpenAt: now.toISOString() }, now));
  return true;
}
// she did something that shapes her food day
export function markActive(now = new Date()): boolean {
  const a = getActivity(), day = ymdLocal(now);
  const was = a.days[day] === "active" && a.lastActiveAt && Date.parse(a.lastActiveAt) > now.getTime() - 60_000;
  if (was) return false;
  put(trim({ ...a, days: { ...a.days, [day]: "active" }, lastActiveAt: now.toISOString(), lastOpenAt: a.lastOpenAt && a.lastOpenAt > now.toISOString() ? a.lastOpenAt : now.toISOString() }, now));
  return true;
}
// what the account keeps
export const activityOut = (): Activity => trim(getActivity(), new Date());

// the coach's side: the days the app was not opened, counted back from the coach's today, today left out
export function quietDays(a: Activity | null | undefined, today: string): number {
  if (!a?.lastOpenAt) return 0;
  const last = ymdLocal(new Date(a.lastOpenAt));
  const days = Math.round((Date.parse(`${today}T12:00:00`) - Date.parse(`${last}T12:00:00`)) / 864e5) - 1;
  return Math.max(0, days);
}
export const QUIET_AFTER = 3;
