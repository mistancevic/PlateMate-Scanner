// DT180 (0.3.25, board Stories129): Your case, in Milan's five parts, read from what the app already knows. Before: your
// usual. The path here: this week, from the record. Now: the situation and today's plan. The path on: what to change, each
// one tap. The goal: tonight, as usual. Then the trend (before to now, carried on) against the trajectory (what the goal
// needs), and the gap in plain words. A day page knows its horizon: the third short night in a week is a week question.
import type { Personal } from "./personal";
import { lifestyleOf, dayFor, getDay } from "./personal";
import type { Feedback } from "./pilot";
import { slotsOf, slotsOn, toMin, trainingWhen } from "./slots";
import { planLine, ymd, type PlanDay } from "./plan";

const BED_WORDS: Record<string, string> = { early: "before 22:00", mid: "22:00 to midnight", late: "after midnight", varies: "at varying times" };
const WAKE_WORDS: Record<string, string> = { early: "before 6:00", mid: "6:00 to 8:00", late: "after 8:00", varies: "at varying times" };
// the usual bedtime as a clock, for the goal line: the end of the band
const BED_BY: Record<string, string> = { early: "22:00", mid: "23:00", late: "01:00", varies: "the usual time" };
const WD = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
const pad = (n: number) => String(n).padStart(2, "0");
export const plusDays = (date: string, n: number) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + n); return ymd(d); };
const clockOf = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const COFFEE = /coffee|espresso|kaffee|cappuccino|latte|americano|cold brew|energy drink|cola\b/i;
const ALCOHOL = /\bbeer\b|\bwine\b|\bbier\b|\bwein\b|rakija|whisky|vodka|gin\b|prosecco|cocktail|spritz/i;

export type Tap = { id: "protein" | "snack" | "easy" | "dinner"; label: string; where: string };
export type SleepCase = {
  parts: { k: string; title: string; body: string }[];
  taps: Tap[];
  trend: string | null;
  weekQuestion: boolean;
  hasSnackSlot: boolean;
};

// the meals eaten after 21:30 on a date, the dinner's clock that day, coffee after 14:00, a drink: from the feedback cards
export function eveningOf(feedback: Feedback[], date: string) {
  const onDay = feedback.filter((f) => f.status === "eaten" && f.createdAt.slice(0, 10) === date);
  const late = onDay.filter((f) => toMin(clockOf(f.createdAt)) >= 21 * 60 + 30);
  const names = (f: Feedback) => `${f.meal.title} ${f.meal.items.map((i) => i.food.name).join(" ")}`;
  const coffeeLate = onDay.some((f) => toMin(clockOf(f.createdAt)) >= 14 * 60 && COFFEE.test(names(f)));
  const drink = onDay.some((f) => ALCOHOL.test(names(f)));
  const dinner = onDay.filter((f) => /dinner/i.test(f.which ?? "") || /dinner/i.test(f.moment ?? "")).map((f) => clockOf(f.createdAt)).sort().pop() ?? null;
  return { late: late.length, dinner, coffeeLate, drink };
}

export function sleepCase(personal: Personal, feedback: Feedback[], today = new Date()): SleepCase {
  const l = lifestyleOf(personal), slots = slotsOf(l), key = ymd(today);
  const todaySlots = slotsOn(l, personal.timesOn, key);
  const last = slots[slots.length - 1], first = slots[0];
  const snack = slots.find((s) => /snack/i.test(s.name));
  const tr = dayFor(personal, today)?.day ?? getDay(personal, today).plan ?? null;
  const tw = trainingWhen(tr);
  const hard = Boolean(tr && tr.kind !== "rest" && tr.intensity === "hard");
  const trainingToday = tr && tr.kind !== "rest" ? `${planLine({ ...tr, when: undefined })}${tw ? `, ${tw.phrase.replace(/^training /, "")}` : ""}` : "no training";
  // the week: the six days before today
  const days = Array.from({ length: 6 }, (_, i) => plusDays(key, -(6 - i)));
  const evenings = days.map((d) => ({ d, ...eveningOf(feedback, d) }));
  const dinnersMoved = days.map((d) => personal.timesOn?.[d]?.[last?.id ?? ""]).filter(Boolean) as string[];
  const lateNights = evenings.filter((e) => e.late > 0).length;
  const coffeeDays = evenings.filter((e) => e.coffeeLate).length;
  const drinkDays = evenings.filter((e) => e.drink).length;
  const dinnerClocks = evenings.map((e) => e.dinner).filter(Boolean) as string[];
  const path: string[] = [];
  if (dinnerClocks.length) path.push(`Dinner eaten at ${dinnerClocks.join(", ")}.`);
  else if (dinnersMoved.length) path.push(`Dinner moved to ${dinnersMoved.join(", ")} on ${dinnersMoved.length} ${dinnersMoved.length === 1 ? "day" : "days"}.`);
  if (lateNights) path.push(`Something eaten after 21:30 on ${lateNights} ${lateNights === 1 ? "evening" : "evenings"}.`);
  if (coffeeDays) path.push(`Coffee after 14:00 on ${coffeeDays} ${coffeeDays === 1 ? "day" : "days"}.`);
  if (drinkDays) path.push(`A drink on ${drinkDays} ${drinkDays === 1 ? "day" : "days"}.`);
  if (!path.length) path.push(`${last ? `Dinner at ${last.time}, as usual. ` : ""}Nothing in the record points at the evenings this week. The cause may be outside what the app sees.`);
  const bed = l.bed ? BED_WORDS[l.bed] : null, wake = l.wake ? WAKE_WORDS[l.wake] : null;
  const usual = [bed || wake ? `Bed ${bed ?? "at your usual time"}, up ${wake ?? "at your usual time"}.` : "No wake-up or bedtime set in Lifestyle yet.", last ? `${last.name} at ${last.time}.` : "", tr && tr.kind !== "rest" ? `Training today: ${trainingToday}.` : ""].filter(Boolean).join(" ");
  const taps: Tap[] = [
    { id: "protein", label: `${first?.name ?? "Breakfast"} and lunch with more protein and fibre`, where: "Ask Chef Mealan for the plate; your numbers unchanged" },
    snack ? { id: "snack", label: `A planned snack at ${todaySlots.find((s) => s.id === snack.id)?.time ?? snack.time}`, where: "On Plan, instead of a craving at 22:30" } : { id: "snack", label: "A snack slot in the afternoon", where: "In Lifestyle, meals a day; then a planned snack instead of a craving" },
    ...(tr && tr.kind !== "rest" ? [{ id: "easy" as const, label: hard ? "Today's training easy, or a walk" : "Today's training as planned, or a walk", where: "On Plan, this date only; Keep it stays open" }] : []),
  ];
  const goalBed = l.bed ? BED_BY[l.bed] : "the usual time";
  // the trend: dinner later each day this week, carried on; the trajectory: bed by the usual time
  let trend: string | null = null;
  const clocks = dinnerClocks.map(toMin);
  if (clocks.length >= 3) {
    const per = (clocks[clocks.length - 1] - clocks[0]) / (clocks.length - 1);
    if (per >= 10) { const fri = clocks[clocks.length - 1] + per * 2; const h = Math.floor(fri / 60), m = Math.round(fri % 60 / 5) * 5; trend = `Your trend: dinner about ${Math.round(per)} minutes later each day this week. Carried on, dinner is at ${pad(h)}:${pad(m % 60)} in two days. Your goal needs bed by ${goalBed}. The gap closes with one change: dinner back at ${last?.time ?? "the usual time"}.`; }
  }
  if (!trend && lateNights >= 2) trend = `Your trend: a late snack on ${lateNights} of six evenings. Your goal needs the night at ${goalBed}. The gap closes with a planned snack in the afternoon and dinner at ${last?.time ?? "the usual time"}.`;
  return {
    parts: [
      { k: "1", title: "Before: your usual", body: usual },
      { k: "2", title: "The path here: this week", body: path.join(" ") },
      { k: "3", title: "Now: a short night", body: `You opened this page, so last night was short. Today: ${trainingToday}.` },
      { k: "4", title: "The path on: today", body: `Each one tap. Then: no coffee after 14:00, dinner at ${last?.time ?? "the usual time"}, bed at the usual time.` },
      { k: "5", title: "The goal: tonight", body: `Bed by ${goalBed}, as usual. Your goal and your check-in stay as they are.` },
    ],
    taps, trend,
    weekQuestion: lateNights >= 3,
    hasSnackSlot: Boolean(snack),
  };
}

// the pages opened, by date, so the third time in a week can point up a level
const OKEY = "chefmealan-situation-opens";
export function noteOpen(id: string, date = ymd(new Date())): number {
  try {
    const all = JSON.parse(localStorage.getItem(OKEY) || "{}") as Record<string, string[]>;
    const cut = plusDays(date, -6);
    const list = Array.from(new Set([...(all[id] ?? []).filter((d) => d >= cut), date])).sort();
    all[id] = list; localStorage.setItem(OKEY, JSON.stringify(all));
    return list.length;
  } catch { return 1; }
}
export const easyDay = (d: PlanDay): PlanDay => ({ ...d, intensity: "easy" as PlanDay["intensity"] });
