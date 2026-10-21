// The counter, on the phone (0.2.5+r17, canvas board M; privacy notice section 7, How the pilot is used). Some pilot log
// events go to our server too, stripped to the event, the day, the version and short codes or numbers: no free text,
// no photos, no food names, no health situation. The server adds the member number; the email never travels with them.
// Home page counts are one tap each: no cookie, no visitor id.
import type { Feedback } from "./pilot";
import type { PlannedMeal } from "./planned";
import type { Slot } from "./slots";
import { dayRecord } from "./record";
import { livedByPlan } from "./metricsCalc";

const SEND = new Set(["app_open", "day_closed", "fit_used", "label_read", "safety_flag", "meal_saved", "feedback", "made", "carry", "food_in", "mix_taken", "adult_confirmed", "cover", "members", "recipe_in", "recipe_fit", "parts"]);
const KEYS = new Set(["way", "how", "went", "ate", "locked", "method", "kind", "moment", "case", "status", "result", "source", "items", "pd", "kcal", "photos", "products",
  "date", "planned", "byPlan", "extras", "swapped", "lived", "proteinPct", "energyPct", "kept"]);
// the event as it may leave the phone: short codes and numbers only
export function stripped(event: string, data: Record<string, unknown>): { e: string; t: string; d: Record<string, string | number | boolean> } | null {
  if (!SEND.has(event)) return null;
  const d: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!KEYS.has(k)) continue;
    if (typeof v === "number" && Number.isFinite(v)) d[k] = v;
    else if (typeof v === "boolean") d[k] = v;
    else if (typeof v === "string" && v.length <= 24 && /^[\w .%-]*$/.test(v)) d[k] = v;
  }
  return { e: event, t: new Date().toISOString(), d };
}
const OUT = "chefmealan-outbox";
const read = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* the next event tries again */ } };
export function enqueue(event: string, data: Record<string, unknown>) {
  const x = stripped(event, data); if (!x) return;
  const box: unknown[] = read(OUT) ?? [];
  box.push(x); write(OUT, box.slice(-500));
  // sent a few seconds later while sending is on, so a day's events arrive the same day
  if (auto !== null && !timer) timer = setTimeout(() => { timer = null; if (auto !== null) void flush(auto); }, 3000);
}
let auto: string | null = null, timer: ReturnType<typeof setTimeout> | null = null;
// on while signed in (App), off when signed out
export const autoFlush = (version: string | null) => { auto = version; };
// sent a few at a time while signed in; what the server took leaves the phone
let sending = false;
export async function flush(version: string) {
  if (sending || typeof navigator !== "undefined" && navigator.onLine === false) return;
  const box: unknown[] = read(OUT) ?? [];
  if (!box.length) return;
  sending = true;
  try {
    const batch = box.slice(0, 100);
    const r = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ v: version, events: batch }), keepalive: true });
    if (r.ok) write(OUT, (read(OUT) ?? []).slice(batch.length));
    else if (r.status === 400 || r.status === 403) write(OUT, []); // not a member, or nothing the server takes: nothing to keep
  } catch { /* offline: next time */ } finally { sending = false; }
}
// a home page count: one per tap or page, nothing stored on the device
export function hit(k: "hp_visit" | "hp_qr" | "hp_calc" | "hp_try" | "built_visit" | `book_${string}`) {
  try {
    const body = JSON.stringify({ k });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) navigator.sendBeacon("/api/hit", new Blob([body], { type: "application/json" }));
    else void fetch("/api/hit", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch { /* a count is never worth an error */ }
}
// Today opened: once a day. The first day is kept, so days before it are never reported.
const FIRST = "chefmealan-first-day", OPENED = "chefmealan-open-day", SENT = "chefmealan-days-sent";
export function openedToday(today: string, log: (e: "app_open") => void) {
  if (!read(FIRST)) write(FIRST, today);
  if (read(OPENED) === today) return;
  write(OPENED, today); log("app_open");
}
// The days before today, closed: what the plan held, what was eaten, and whether the day was lived by the plan.
// Each day once, at most the last 7, never before the first day Today was opened on this phone.
export function closeDays(o: {
  today: Date; ymd: (d: Date) => string; slots: Slot[]; planned: Record<string, Record<string, PlannedMeal>>;
  logged: (d: Date) => Feedback[]; target: (d: Date) => { kcal: number; protein: number } | null;
  log: (e: "day_closed", data: Record<string, unknown>) => void;
}) {
  const first: string | null = read(FIRST); if (!first) return;
  const sent: string[] = read(SENT) ?? [];
  for (let n = 7; n >= 1; n--) {
    const d = new Date(o.today); d.setDate(d.getDate() - n);
    const key = o.ymd(d);
    if (key < first || sent.includes(key)) continue;
    const held = o.planned[key] ?? {};
    const rec = dayRecord(o.slots, held, o.logged(d), key);
    const swapped = rec.eaten.filter((f) => { const h = held[f.slot!.slotId]; return h?.mealId && f.meal?.id && h.mealId !== f.meal.id; }).length;
    const v = livedByPlan({ planned: rec.planned, open: rec.open.length, kcal: rec.kcal, protein: rec.protein }, o.target(d));
    o.log("day_closed", { date: key, planned: rec.planned, byPlan: rec.byPlan, extras: rec.extras.length, swapped, lived: v.lived, proteinPct: v.proteinPct ?? -1, energyPct: v.energyPct ?? -1 });
    sent.push(key);
  }
  write(SENT, sent.slice(-30));
}
