// The coach's week (0.2.6, canvas board CW, CW1 to CW3, Milan 13 and 15 October 2026). The client's phone closes each day
// into one line: the meals planned against the meals eaten, swaps, skips, extras, the numbers against the day's own target,
// and whether the day was lived by the plan. The lines go to the account with the rest; the coach's page reads them.
// Meal names travel as the person named them. Words and photos travel only on cards the person shares.
import { aggregate, type Feedback } from "./pilot";
import type { PlannedMeal } from "./planned";
import type { Slot } from "./slots";
import { dayRecord } from "./record";
import { livedByPlan } from "./metricsCalc";
import { fullOf } from "./measured";

export type SlotMark = "plan" | "swapped" | "skipped" | "missed" | "open";
export type SlotLine = { name: string; time: string; planned: string | null; eaten: string | null; mark: SlotMark; kcal: number; protein: number };
export type DayLine = {
  date: string; when: "past" | "today" | "future";
  planned: number; byPlan: number; swapped: number; skipped: number; missed: number; open: number;
  kcal: number; protein: number; target: { kcal: number; protein: number } | null; lived: boolean;
  slots: SlotLine[]; extras: { title: string; kcal: number; protein: number }[]; training: string | null;
  // 0.2.7 (board FT): the meal slots of the day, and whether the day counts for the measured burn (see measured.ts)
  slotCount?: number; full?: boolean;
};
const n = (f: Feedback) => { const a = aggregate(f.meal.items); return { kcal: Math.round(a.calories ?? 0), protein: Math.round(a.protein ?? 0) }; };

export function dayLineOf(o: { date: string; today: string; slots: Slot[]; held: Record<string, PlannedMeal> | undefined; logged: Feedback[]; target: { kcal: number; protein: number } | null; training: string | null }): DayLine {
  const when = o.date < o.today ? "past" : o.date === o.today ? "today" : "future";
  const rec = dayRecord(o.slots, o.held, when === "future" ? [] : o.logged, o.date);
  const eatenBy = new Map(rec.eaten.map((f) => [f.slot!.slotId, f]));
  const slots: SlotLine[] = [];
  for (const s of o.slots) {
    const h = o.held?.[s.id], e = eatenBy.get(s.id);
    if (!h && !e) continue;
    const swapped = !!(e && h && h.mealId && e.meal.id && h.mealId !== e.meal.id) || !!(e && h && !h.mealId && e.meal.title !== h.title);
    const mark: SlotMark = e ? (swapped ? "swapped" : "plan") : h?.skipped ? "skipped" : when === "past" ? "missed" : "open";
    const nums = e ? n(e) : { kcal: Math.round(h?.kcal ?? 0), protein: Math.round(h?.protein ?? 0) };
    slots.push({ name: s.name, time: s.time, planned: h?.title ?? null, eaten: e ? e.meal.title : null, mark, ...nums });
  }
  const count = (m: SlotMark) => slots.filter((x) => x.mark === m).length;
  const target = o.target ? { kcal: Math.round(o.target.kcal), protein: Math.round(o.target.protein) } : null;
  const lived = when === "past" && livedByPlan({ planned: rec.planned, open: rec.open.length, kcal: rec.kcal, protein: rec.protein }, target).lived;
  const line: DayLine = {
    date: o.date, when, planned: rec.planned, byPlan: count("plan"), swapped: count("swapped"), skipped: count("skipped"), missed: count("missed"), open: count("open"),
    kcal: Math.round(rec.kcal), protein: Math.round(rec.protein), target, lived, slots,
    extras: rec.extras.map((f) => ({ title: f.meal.title, ...n(f) })), training: o.training, slotCount: o.slots.length,
  };
  return { ...line, full: fullOf(line) };
}

// the line's words, the same on the coach's page: status, colour and the detail under it
export type LineWords = { status: string; tone: "lived" | "plan" | "changed" | "today" | "none"; detail: string };
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export function wordsOf(l: DayLine): LineWords {
  const of = `${l.byPlan + l.swapped} of ${l.planned}`;
  const extra = l.extras.length ? `${l.extras.length} extra: ${l.extras.map((x) => `${lower(x.title)}, ${x.kcal.toLocaleString("en")} kcal`).join("; ")}` : "";
  const skip = l.skipped ? `${l.skipped} skipped on purpose` : "";
  if (l.when === "future") return { status: l.planned ? `${l.planned} planned` : "Nothing planned yet", tone: "none", detail: "" };
  if (l.when === "today") {
    const next = l.slots.find((s) => s.mark === "open");
    return { status: "Today so far", tone: "today", detail: [of, next ? `${lower(next.name)} at ${next.time}` : "", skip, extra].filter(Boolean).join(" · ") };
  }
  if (!l.planned && !l.extras.length) return { status: "Nothing planned or eaten", tone: "none", detail: "" };
  if (!l.planned) return { status: "Not planned", tone: "none", detail: extra };
  const changes = l.slots.filter((s) => s.mark === "swapped" || s.mark === "missed");
  if (changes.length) {
    const what = changes.map((s) => `${lower(s.name)} ${s.mark === "swapped" ? "swapped" : "not eaten"}`).join(", ");
    return { status: `${changes.length} ${changes.length === 1 ? "change" : "changes"}`, tone: "changed", detail: [what, skip, extra].filter(Boolean).join(" · ") };
  }
  return { status: "By the plan", tone: l.lived ? "lived" : "plan", detail: [of, skip, l.training, extra].filter(Boolean).join(" · ") };
}
