// DT178 (0.3.21, board Stories126): the phone's side of the Chef Mealan calendar. The token lives in this tab for about an
// hour (sessionStorage); with it, every change goes across within seconds. Without it, Plan and the Calendar page show one
// button, Update Google Calendar, and a tap brings the next 14 days up to date.
import { useEffect, useState } from "react";
import { CAL_SCOPE, syncCalendar, removeCalendar, freeBusy, type CalEvent, type CalMove, type Fetch } from "./gcal";
import { calendarToken } from "./cloud";

export type CalStatus = { state: "off" | "tap" | "busy" | "done" | "error"; at?: string; message?: string; n?: number; done?: number; total?: number };
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
// DT179 (0.3.23): a token holds the rights it was asked with; one asked for more rights replaces it
export function heldToken(scopes: string[] = [CAL_SCOPE]): string | null {
  try {
    if (local()) { const t = (window as any).__cmCalendarToken; if (t) return String(t); }
    const v = JSON.parse(sessionStorage.getItem(TKEY) || "null");
    return v && v.until > Date.now() && scopes.every((s) => (v.scopes ?? [CAL_SCOPE]).includes(s)) ? v.token : null;
  } catch { return null; }
}
// a tap: Google's window, once, for the rights the calendar needs
export async function askToken(scopes: string[] = [CAL_SCOPE]): Promise<string | null> {
  const held = heldToken(scopes);
  if (held) return held;
  const t = await calendarToken(scopes);
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
// DT179: the calendar is looked at again every 10 minutes while a token is held, so a meal moved in Google comes back
let lookedAt = 0;
export const lookDue = (now = Date.now()) => now - lookedAt > 10 * 60 * 1000;
// DT179: meals moved in Google go to whoever listens (the app takes the new times)
let movesTo: (m: CalMove[]) => void = () => {};
export const onMoves = (f: (m: CalMove[]) => void) => { movesTo = f; };
// brings the calendar up to date; answers the calendar's id (a new one when it was made), or null when it could not
export async function runSync(token: string, id: string | undefined, events: CalEvent[], from: string, to: string, timeZone: string, onCreated?: (id: string) => void, f: Fetch = (u, i) => fetch(u, i)): Promise<string | null> {
  if (running) await running.catch(() => null);
  running = (async () => {
    setCalStatus({ ...status, state: "busy" });
    try {
      const r = await syncCalendar(f, token, id, events, from, to, timeZone, { onCreated, onProgress: (done, total) => setCalStatus({ state: "busy", done, total }) });
      markSent(sigOf(r.id, events)); lookedAt = Date.now();
      if (r.moves.length) movesTo(r.moves);
      setCalStatus({ state: "done", at: nowTime(), n: events.length });
      return r.id;
    } catch (e: any) {
      if (e?.status === 401) { dropToken(); setCalStatus({ state: "tap" }); return null; }
      if (e?.name === "TimeoutError" || e?.name === "AbortError") { setCalStatus({ state: "error", message: "Google Calendar did not answer in time. Try again." }); return null; }
      // 0.3.24: the phone could not reach Google, even after trying again: plain words, and the tap goes on where it stopped
      if (e?.name === "TypeError") { setCalStatus({ state: "error", message: "Google Calendar could not be reached. Tap Update to go on where it stopped." }); return null; }
      setCalStatus({ state: "error", message: e?.message || "Google Calendar did not answer." });
      return null;
    }
  })();
  try { return await running; } finally { running = null; }
}
export async function dropCalendar(token: string, id: string, f: Fetch = (u, i) => fetch(u, i)) { await removeCalendar(f, token, id); forgetSent(); }

// ---- DT179 (0.3.23, board Stories127): busy times, read on the phone and kept on the phone only ----
export type BusyStore = { at: number; from: string; to: string; list: { s: number; e: number }[]; error?: string };
const BKEY = "chefmealan-cal-busy";
let busyNow: BusyStore | null = (() => { try { return JSON.parse(localStorage.getItem(BKEY) || "null"); } catch { return null; } })();
const busySubs = new Set<(b: BusyStore | null) => void>();
const setBusy = (b: BusyStore | null) => { busyNow = b; try { if (b) localStorage.setItem(BKEY, JSON.stringify(b)); else localStorage.removeItem(BKEY); } catch {} for (const f of busySubs) f(b); };
export const busyStore = () => busyNow;
export const forgetBusy = () => setBusy(null);
export function useBusy(): BusyStore | null {
  const [b, set] = useState(busyNow);
  useEffect(() => { busySubs.add(set); set(busyNow); return () => { busySubs.delete(set); }; }, []);
  return b;
}
// read again after 10 minutes, or when the days asked for change
export const busyStale = (from: string, to: string, now = Date.now()) => !busyNow || busyNow.from !== from || busyNow.to !== to || now - busyNow.at > 10 * 60 * 1000;
let reading: Promise<void> | null = null;
export async function readBusy(token: string, from: string, to: string, timeZone: string, f: Fetch = (u, i) => fetch(u, i)) {
  if (reading) return reading;
  reading = (async () => {
    try { setBusy({ at: Date.now(), from, to, list: await freeBusy(f, token, from, to, timeZone) }); }
    catch (e: any) { setBusy({ at: Date.now(), from, to, list: busyNow?.list ?? [], error: e?.status === 403 ? "Google has not given Chef Mealan your busy times. Turn Read when I'm busy off and on again." : "Your busy times could not be read just now." }); }
  })();
  try { await reading; } finally { reading = null; }
}
