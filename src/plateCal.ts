// The calendar the Plate's meal is picked in (0.3.157, DT308.1 and DT308.9, boards Stories236 and Stories241; Go 18 November
// 11:14). Pure rules, so the unit tests and the walkthroughs read the same ones. The days on top, that day's meals under
// them with their time and state. No meal is guessed when something lands; a guess is only marked when you say Ate it.
import type { Slot } from "./slots";

export type CalMode = "line" | "plan" | "ate";
// what a row says after its time
export type CalState = "eaten" | "notEaten" | "next" | "now" | "planned" | "free" | "at" | "none";
export type CalRow = { id: string | null; name: string; time: string; state: CalState; holds?: string; off?: boolean };
const ymdOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const minOf = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
export const dayAt = (from: string, n: number) => { const d = new Date(`${from}T12:00:00`); d.setDate(d.getDate() + n); return ymdOf(d); };
// a meal counts as still to come until an hour and a half after its time, as the clock's meal does (mealNow)
export const AFTER = 90;

// the days on top: yesterday, today, tomorrow and the day after; a day picked outside them stands with them, in order
export function calDays(today: string, picked: string): string[] {
  const days = [-1, 0, 1, 2].map((n) => dayAt(today, n));
  return days.includes(picked) ? days : [...days, picked].sort();
}

// a day's meals as rows. eaten: what was logged in each meal of that day (titles); planned: what the plan holds there.
// A snack off the plan is a row of its own (id null) when the day has no snack among its meals: today, and on a day gone by
// when you say Ate it. A plan stores a meal under a meal of its day, so a coming day has no such row (Coach Milan, 18 November).
export function calRows(o: { date: string; now: Date; slots: Slot[]; eaten: Record<string, string[]>; planned: Record<string, { title: string; skipped?: boolean }> | undefined; mode: CalMode; photoAt?: Date | null }): CalRow[] {
  const today = ymdOf(o.now), m = o.now.getHours() * 60 + o.now.getMinutes();
  const past = o.date < today, coming = o.date > today;
  let nextSeen = false;
  const rows: CalRow[] = o.slots.map((s) => {
    const ate = o.eaten[s.id] ?? [], held = o.planned?.[s.id], gone = past || (!coming && minOf(s.time) + AFTER < m);
    const off = o.mode === "ate" ? coming : o.mode === "plan" ? gone : false;
    if (ate.length) return { id: s.id, name: s.name, time: s.time, state: "eaten" as const, holds: ate.join(", "), off };
    if (gone) return { id: s.id, name: s.name, time: s.time, state: "notEaten" as const, off };
    if (held && !held.skipped) return { id: s.id, name: s.name, time: s.time, state: "planned" as const, holds: held.title, off };
    if (coming) return { id: s.id, name: s.name, time: s.time, state: "free" as const, off };
    const next = !nextSeen; nextSeen = true;
    return { id: s.id, name: s.name, time: s.time, state: next ? "next" as const : "none" as const, off };
  });
  const hasSnack = o.slots.some((s) => /snack/i.test(s.name));
  if (!hasSnack && !coming && o.mode !== "plan" && (o.mode === "ate" || !past)) {
    const ph = o.photoAt && ymdOf(o.photoAt) === o.date ? o.photoAt : null;
    rows.push({ id: null, name: "Snack", time: ph ? `${String(ph.getHours()).padStart(2, "0")}:${String(ph.getMinutes()).padStart(2, "0")}` : "", state: ph ? "at" : past ? "none" : "now" });
  }
  return rows;
}

// the guess marked when you say Ate it: the meal nearest the time (the clock's, or an older photo's). A meal already eaten
// is not guessed again: a snack then (board Stories237, DT308.5: lunch not eaten that day, so Lunch; with lunch eaten, Snack).
// Returns the meal's id, null for a snack off the plan, undefined when the day has no meals.
export function calGuess(slots: Slot[], eaten: Record<string, string[]>, at: Date): string | null | undefined {
  if (!slots.length) return undefined;
  const m = at.getHours() * 60 + at.getMinutes();
  const s = [...slots].sort((a, b) => Math.abs(minOf(a.time) - m) - Math.abs(minOf(b.time) - m))[0];
  if (!(eaten[s.id] ?? []).length) return s.id;
  const snack = slots.find((x) => /snack/i.test(x.name) && !(eaten[x.id] ?? []).length);
  return snack ? snack.id : null;
}
