// DT178 (0.3.21, board Stories126): the phone's side of the Chef Mealan calendar. The token lives in this tab for about an
// hour (sessionStorage); with it, every change goes across within seconds. Without it, Plan and the Calendar page show one
// button, Update Google Calendar, and a tap brings the next 14 days up to date.
import { useEffect, useState } from "react";
import { CAL_SCOPE, syncCalendar, removeCalendar, type CalEvent, type Fetch } from "./gcal";
import { calendarToken } from "./cloud";

export type CalStatus = { state: "off" | "tap" | "busy" | "done" | "error"; at?: string; message?: string; n?: number };
const TKEY = "chefmealan-cal-token", SKEY = "chefmealan-cal-synced";
let status: CalStatus = { state: "off" };
const subs = new Set<(s: CalStatus) => void>();
export const calStatus = () => status;
export function setCalStatus(s: CalStatus) { status = s; for (const f of subs) f(s); }
export function useCalStatus(): CalStatus {
  const [s, set] = useState(status);
  useEffect(() => { subs.add(set); set(status); return () => { subs.delete(set); }; }, []);
  return s;
}
// the walkthroughs, on this computer only, hand a token in without Google's window
const local = () => typeof location !== "undefined" && /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
export function heldToken(): string | null {
  try {
    if (local()) { const t = (window as any).__cmCalendarToken; if (t) return String(t); }
    const v = JSON.parse(sessionStorage.getItem(TKEY) || "null");
    return v && v.until > Date.now() ? v.token : null;
  } catch { return null; }
}
// a tap: Google's window, once, for the one right
export async function askToken(): Promise<string | null> {
  const held = heldToken();
  if (held) return held;
  const t = await calendarToken(CAL_SCOPE);
  if (!t) return null;
  try { sessionStorage.setItem(TKEY, JSON.stringify(t)); } catch {}
  return t.token;
}
export const dropToken = () => { try { sessionStorage.removeItem(TKEY); } catch {} };
// what went across last, so the same plan is not sent twice
const lastSent = () => { try { return localStorage.getItem(SKEY) || ""; } catch { return ""; } };
const markSent = (sig: string) => { try { localStorage.setItem(SKEY, sig); } catch {} };
export const forgetSent = () => { try { localStorage.removeItem(SKEY); } catch {} };
export const sigOf = (id: string | undefined, events: CalEvent[]) => `${id ?? ""}:${events.map((e) => `${e.id}.${e.h}`).join(",")}`;
export const needsSync = (id: string | undefined, events: CalEvent[]) => !id || sigOf(id, events) !== lastSent();

const nowTime = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
let running: Promise<string | null> | null = null;
// brings the calendar up to date; answers the calendar's id (a new one when it was made), or null when it could not
export async function runSync(token: string, id: string | undefined, events: CalEvent[], from: string, to: string, timeZone: string, f: Fetch = (u, i) => fetch(u, i)): Promise<string | null> {
  if (running) await running.catch(() => null);
  running = (async () => {
    setCalStatus({ ...status, state: "busy" });
    try {
      const r = await syncCalendar(f, token, id, events, from, to, timeZone);
      markSent(sigOf(r.id, events));
      setCalStatus({ state: "done", at: nowTime(), n: events.length });
      return r.id;
    } catch (e: any) {
      if (e?.status === 401) { dropToken(); setCalStatus({ state: "tap" }); return null; }
      setCalStatus({ state: "error", message: e?.message || "Google Calendar did not answer." });
      return null;
    }
  })();
  try { return await running; } finally { running = null; }
}
export async function dropCalendar(token: string, id: string, f: Fetch = (u, i) => fetch(u, i)) { await removeCalendar(f, token, id); forgetSent(); }
