// DT178 (0.3.21, board Stories126, Coach Milan 31 October 00:08): Chef Mealan's own calendar in Google. The plan goes out as
// events into a calendar of its own, called Chef Mealan; the person's other events are never read or touched. An event says
// the name, the time and a link to that day on Plan: never kcal, protein, the goal or health words. 14 days ahead.
// The right asked for is calendar.app.created only (create its own calendar, manage the events in it). The access is a
// Google sign-in token the phone holds for about an hour; no Google key is kept on our server.
import type { Slot } from "./slots";
import { toMin, trainingWhen } from "./slots";
import { activityName, type PlanDay } from "./plan";
import type { Planned } from "./planned";

export const CAL_SCOPE = "https://www.googleapis.com/auth/calendar.app.created";
export const CAL_DAYS = 14;
export const CAL_NAME = "Chef Mealan";
export type CalKind = "meals" | "cooking" | "training" | "shopping" | "weigh" | "checkin";
export const CAL_KINDS: CalKind[] = ["meals", "cooking", "training", "shopping", "weigh", "checkin"];
// Weigh in and Check-in start off: calendars get shared with family and colleagues
export const KIND_START: Record<CalKind, boolean> = { meals: true, cooking: true, training: true, shopping: true, weigh: false, checkin: false };
export type CalSettings = { on: boolean; id?: string; kinds?: Partial<Record<CalKind, boolean>>; dish?: boolean; since?: string };
export const kindOn = (c: CalSettings | null | undefined, k: CalKind) => c?.kinds?.[k] ?? KIND_START[k];
export const dishOn = (c: CalSettings | null | undefined) => c?.dish ?? true;

export type CalTime = { dateTime?: string; date?: string; timeZone?: string };
export type CalEvent = { id: string; key: string; summary: string; description: string; start: CalTime; end: CalTime; h: string };
export type CalInput = {
  days: string[];
  slotsOf: (date: string) => Slot[];
  trainingOf: (date: string) => PlanDay | null;
  planned: Planned;
  // recipes with steps: a planned meal from one of these is cooked
  cooked: (mealId: string) => boolean;
  settings: CalSettings;
  weigh: boolean;
  noKitchen?: (date: string) => boolean;
  checkIn: { date: string; name: string } | null;
  shopping: { n: number; at: string }[];
  origin: string;
  timeZone: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
export function plusDays(date: string, n: number): string { const x = new Date(`${date}T12:00:00`); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; }
// a clock time on a date, minutes past that date's midnight; past midnight rolls to the next date
export function at(date: string, min: number): string {
  const d = Math.floor(min / 1440), m = ((min % 1440) + 1440) % 1440;
  return `${plusDays(date, d)}T${pad(Math.floor(m / 60))}:${pad(m % 60)}:00`;
}
// Google's event ids: the letters a to v and the digits, 5 to 1024 long. The key, as base32hex, is its own id, so the same
// meal on the same date is always the same event.
export function eventId(key: string): string {
  const bytes = new TextEncoder().encode(key), A = "0123456789abcdefghijklmnopqrstuv";
  let bits = 0, val = 0, out = "";
  for (const b of bytes) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += A[(val >>> (bits - 5)) & 31]; bits -= 5; } val &= (1 << bits) - 1; }
  if (bits > 0) out += A[(val << (5 - bits)) & 31];
  return `cm${out}`;
}
const hashOf = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
export const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function calendarEvents(x: CalInput): CalEvent[] {
  const c = x.settings, out: CalEvent[] = [];
  const link = (date: string) => `Open in Chef Mealan: ${x.origin}/plan?day=${date}`;
  const add = (key: string, summary: string, date: string, start: CalTime, end: CalTime) => {
    const description = link(date);
    out.push({ id: eventId(key), key, summary, description, start, end, h: hashOf(JSON.stringify([summary, description, start, end])) });
  };
  const timed = (date: string, from: number, to: number): [CalTime, CalTime] => [{ dateTime: at(date, from), timeZone: x.timeZone }, { dateTime: at(date, to), timeZone: x.timeZone }];
  for (const date of x.days) {
    const slots = x.slotsOf(date), held = x.planned[date] ?? {};
    for (const s of slots) {
      const m = held[s.id];
      if (m?.skipped) continue;
      const t = toMin(s.time), dish = m && dishOn(c) ? ` · ${m.title}` : "";
      if (kindOn(c, "meals")) add(`${date}|meal|${s.id}`, `${s.name}${dish}`, date, ...timed(date, t, t + 30));
      if (kindOn(c, "cooking") && m?.mealId && x.cooked(m.mealId) && !x.noKitchen?.(date)) add(`${date}|cook|${s.id}`, `Cook ${lower(s.name)}${dish}`, date, ...timed(date, t - 30, t));
    }
    const tr = x.trainingOf(date), w = trainingWhen(tr);
    if (kindOn(c, "training") && tr && w) {
      const name = activityName(tr);
      if (w.label === "No time set") add(`${date}|training`, name, date, { date }, { date: plusDays(date, 1) });
      else { const t = toMin(w.sort); add(`${date}|training`, name, date, ...timed(date, t, t + (tr.minutes || 60))); }
    }
    if (kindOn(c, "weigh") && x.weigh && slots.length) { const t = toMin(slots[0].time); add(`${date}|weigh`, "Weigh in", date, ...timed(date, t - 15, t - 10)); }
    if (kindOn(c, "checkin") && x.checkIn?.date === date) add(`${date}|checkin`, x.checkIn.name, date, { date }, { date: plusDays(date, 1) });
    if (kindOn(c, "shopping")) for (const l of x.shopping) if (l.at.slice(0, 10) === date) { const t = toMin(l.at.slice(11, 16)); add(`${date}|shop|${l.n}`, `Shopping list ${l.n}`, date, ...timed(date, t, t + 60)); }
  }
  return out;
}

// ---- Google Calendar, from the phone ----
export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
const API = "https://www.googleapis.com/calendar/v3";
export class CalError extends Error { constructor(public status: number, msg: string) { super(msg); } }
async function call(f: Fetch, token: string, method: string, path: string, body?: unknown): Promise<any> {
  const r = await f(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 204) return null;
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new CalError(r.status, j?.error?.message || `Google Calendar answered ${r.status}`);
  return j;
}
export const makeCalendar = async (f: Fetch, token: string, timeZone: string): Promise<string> => (await call(f, token, "POST", "/calendars", { summary: CAL_NAME, description: "Your meals, cooking and training from Chef Mealan. Names and times only.", timeZone })).id;
export const removeCalendar = (f: Fetch, token: string, id: string) => call(f, token, "DELETE", `/calendars/${encodeURIComponent(id)}`).catch((e) => { if (!(e instanceof CalError && (e.status === 404 || e.status === 410))) throw e; });
const body = (e: CalEvent) => ({ id: e.id, summary: e.summary, description: e.description, start: e.start, end: e.end, status: "confirmed", transparency: "opaque",
  reminders: { useDefault: true }, extendedProperties: { private: { cm: "1", h: e.h } } });

export type SyncResult = { id: string; made: number; changed: number; removed: number; created: boolean };
// Brings the calendar to the events asked for, between from and to: new ones in, changed ones updated, ours that are no longer
// planned taken out. Events someone added to the calendar by hand (without our mark) stay. A calendar removed in Google is
// made again.
export async function syncCalendar(f: Fetch, token: string, id: string | undefined, events: CalEvent[], from: string, to: string, timeZone: string): Promise<SyncResult> {
  let created = false;
  if (!id) { id = await makeCalendar(f, token, timeZone); created = true; }
  const cal = `/calendars/${encodeURIComponent(id)}/events`;
  const have = new Map<string, { h?: string; cm?: boolean }>();
  try {
    let page: string | undefined;
    do {
      const q = new URLSearchParams({ timeMin: `${from}T00:00:00Z`, timeMax: `${to}T23:59:59Z`, singleEvents: "true", maxResults: "250", ...(page ? { pageToken: page } : {}) });
      const r = await call(f, token, "GET", `${cal}?${q}`);
      for (const it of r?.items ?? []) have.set(it.id, { h: it.extendedProperties?.private?.h, cm: it.extendedProperties?.private?.cm === "1" });
      page = r?.nextPageToken;
    } while (page);
  } catch (e) {
    if (e instanceof CalError && (e.status === 404 || e.status === 410) && !created) return syncCalendar(f, token, undefined, events, from, to, timeZone);
    throw e;
  }
  let made = 0, changed = 0, removed = 0;
  const want = new Set(events.map((e) => e.id));
  for (const e of events) {
    const h = have.get(e.id);
    if (!h) {
      try { await call(f, token, "POST", cal, body(e)); }
      // the id was used before (an event taken out earlier keeps its id): bring it back
      catch (err) { if (err instanceof CalError && err.status === 409) await call(f, token, "PUT", `${cal}/${e.id}`, body(e)); else throw err; }
      made++;
    } else if (h.h !== e.h) { await call(f, token, "PUT", `${cal}/${e.id}`, body(e)); changed++; }
  }
  for (const [eid, h] of have) if (h.cm && !want.has(eid)) { await call(f, token, "DELETE", `${cal}/${eid}`).catch((e) => { if (!(e instanceof CalError && (e.status === 404 || e.status === 410))) throw e; }); removed++; }
  return { id, made, changed, removed, created };
}
