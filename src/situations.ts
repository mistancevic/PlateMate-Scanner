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

// ---- 0.3.26: the cases for Glucose and insulin (per meal), Glycogen (per day), The fat store and Fat burning (per week) ----
import { aggregate } from "./pilot";
import { lettersOf, ratesOf } from "./letters";
import type { Planned } from "./planned";
import { trendOf, avg7 } from "./weight";
import { dayLog } from "./today";
import { dayRecord } from "./record";
import { livedByPlan } from "./metricsCalc";
import { goalLabel } from "./goal";
import { STEPS } from "./personal";

export type Case = { parts: { k: string; title: string; body: string }[]; taps: Tap[]; trend: string | null };
export type GlucoseIn = { personal: Personal; feedback: Feedback[]; planned: Planned; numbersFor: (d: Date) => { kcal: number; protein: number; fats: number; carbs: number } | null; pdRef: number | null; giOf: (name: string) => number | null };
const kindOfDay = (tr: PlanDay | null) => (!tr || tr.kind === "rest" ? "rest" : tr.intensity === "hard" ? "hard" : "training");
const lettersFor = (items: import("./pilot").Ingredient[], rates: ReturnType<typeof ratesOf>) => {
  if (!rates || !items.length) return null;
  const a = aggregate(items);
  const [f, c, fi, p] = lettersOf({ calories: a.calories, protein: a.protein, fats: a.fats, carbs: a.carbs, fiber: (a as any).fiber ?? null }, rates);
  return { f, c, fi, p, text: `P ${p === "P" ? "in the range" : p.endsWith("+") ? "high" : "low"}, C ${c === "C" ? "in the range" : c.endsWith("+") ? "high" : "low"}, Fi ${fi === "Fi" ? "in the range" : fi.endsWith("+") ? "high" : fi.endsWith("?") ? "unknown" : "low"}` };
};

export function glucoseCase(x: GlucoseIn, today = new Date()): Case {
  const l = lifestyleOf(x.personal), key = ymd(today), slots = slotsOn(l, x.personal.timesOn, key);
  const n = x.numbersFor(today), rates = ratesOf(n, x.pdRef);
  const tr = dayFor(x.personal, today)?.day ?? getDay(x.personal, today).plan ?? null, kind = kindOfDay(tr);
  const nowMin = today.getHours() * 60 + today.getMinutes();
  const next = slots.find((s) => toMin(s.time) + 90 >= nowMin) ?? slots[slots.length - 1];
  const held = x.planned[key] ?? {}, m = next ? held[next.id] : undefined;
  const let_ = m?.items ? lettersFor(m.items, rates) : null;
  const gi = m?.items ? m.items.map((i) => ({ n: i.food.name, g: x.giOf(i.food.name) })).filter((z) => z.g !== null) : [];
  const giWords = gi.length ? ` ${gi.map((z) => `${z.n.split(",")[0]} GI about ${z.g}`).join(", ")}.` : "";
  // this week's meals of the same slot, from the cards: the letters of each
  const days = Array.from({ length: 6 }, (_, i) => plusDays(key, -(6 - i)));
  const week = days.map((d) => { const cards = x.feedback.filter((f) => f.status === "eaten" && f.createdAt.slice(0, 10) === d && next && (f.which ?? f.moment ?? "").toLowerCase().includes(next.name.toLowerCase())); const c = cards[cards.length - 1]; return c ? { d, le: lettersFor(c.meal.items, ratesOf(x.numbersFor(new Date(`${d}T12:00:00`)), x.pdRef)), title: c.meal.title } : null; }).filter(Boolean) as { d: string; le: ReturnType<typeof lettersFor>; title: string }[];
  const highC = week.filter((w) => w.le?.c.endsWith("+")).length, lowFi = week.filter((w) => w.le && (w.le.fi.endsWith("-") || w.le.fi === "fi")).length;
  const carbs = n ? `${Math.round(n.carbs)} g` : "your range";
  const taps: Tap[] = [];
  if (m) taps.push({ id: "protein", label: let_ && let_.p === "P" && !let_.fi.endsWith("-") && let_.fi !== "fi" ? `Keep this ${next!.name.toLowerCase()}` : `More protein and fibre on this ${next!.name.toLowerCase()}`, where: let_ && let_.p === "P" && !let_.fi.endsWith("-") && let_.fi !== "fi" ? "It already does what this page says" : "Ask Chef Mealan for the plate; your numbers unchanged" });
  else if (next) taps.push({ id: "protein", label: `Pick ${next.name.toLowerCase()} with protein and fibre`, where: "On Plan; Chef Mealan's ideas lean that way" });
  if (kind === "hard") taps.push({ id: "dinner", label: "Tonight: the bigger carb meal, after the session", where: "On Plan, this date; Chef Mealan sizes it to your day" });
  if (lowFi >= 2) taps.push({ id: "snack", label: `Fibre on this week's ${next?.name.toLowerCase() ?? "meal"}: beans, a salad, whole grain`, where: "The Plate's Fi letter goes into the range" });
  return {
    parts: [
      { k: "1", title: `Before: your usual ${next?.name.toLowerCase() ?? "meal"}`, body: `${l.meals ?? 3} meals a day${next ? `, ${next.name.toLowerCase()} at ${next.time}` : ""}. Your carbs today: ${carbs}, moving with your training.` },
      { k: "2", title: `The path here: this week's ${next ? next.name.toLowerCase() + "s" : "meals"}`, body: week.length ? week.map((w) => `${WD(w.d)} ${w.title}${w.le ? `, ${w.le.c === "C" ? "C in the range" : w.le.c.endsWith("+") ? "C+" : "C low"}${w.le.fi.endsWith("-") || w.le.fi === "fi" ? ", Fi low" : ""}` : ""}`).join(". ") + "." : "No cards for this meal this week yet. What you eat and tick on Today fills this in." },
      { k: "3", title: `Now: ${next ? `today's ${next.name.toLowerCase()}` : "today"}`, body: m ? `${m.title}, planned.${let_ ? ` Letters: ${let_.text}.` : ""}${giWords}${kind === "hard" ? ` Today is a hard training day${trainingWhen(tr) ? `, ${trainingWhen(tr)!.phrase}` : ""}: muscle glycogen gets used, so tonight's carbs refill it. That is when it helps.` : kind === "training" ? " A training day: the meal after the session is where carbs land best." : " No training today: carbs inside the range, with protein and fibre, and no special job."}` : `Nothing planned for ${next?.name.toLowerCase() ?? "this meal"} yet.${kind === "hard" ? " A hard training day: the bigger carb meal goes after the session." : kind === "training" ? " A training day: the meal after the session is where carbs land best." : " No training today: carbs inside the range, with protein and fibre."}` },
      { k: "4", title: "The path on", body: "" },
      { k: "5", title: "The goal: the day", body: `Carbs inside your range, fibre at least 25 g a day, protein at every meal. Your numbers do not change.` },
    ],
    taps,
    trend: week.length >= 3 && (highC >= 2 || lowFi >= 2) ? `Your trend: ${highC >= 2 ? `${highC} of ${week.length} ${next?.name.toLowerCase() ?? "meal"}s this week C+` : ""}${highC >= 2 && lowFi >= 2 ? " and " : ""}${lowFi >= 2 ? `${lowFi} with Fi low` : ""}. Your goal needs Fi in the range every day. The change: fibre on the plate, not fewer carbs.` : null,
  };
}

export function glycogenCase(personal: Personal, today = new Date()): Case {
  const key = ymd(today), yKey = plusDays(key, -1), tKey = plusDays(key, 1);
  const of = (d: string) => { const dt = new Date(`${d}T12:00:00`); return dayFor(personal, dt)?.day ?? getDay(personal, dt).plan ?? null; };
  const y = of(yKey), t = of(key), tm = of(tKey);
  const yk = kindOfDay(y), tk = kindOfDay(t), tmk = kindOfDay(tm);
  const tw = trainingWhen(t);
  const l = lifestyleOf(personal), slots = slotsOf(l), first = slots[0];
  const taps: Tap[] = [];
  if (tk !== "rest") taps.push({ id: "dinner", label: "The day's biggest carb meal, after the session", where: "On Plan; Chef Mealan sizes it to your day" });
  if (tmk === "rest") taps.push({ id: "snack", label: "Tomorrow, a rest day: carbs back to the usual share", where: "Plan reads your training week" });
  if (tk === "rest" && tmk !== "rest") taps.push({ id: "dinner", label: "Tomorrow's session: carbs in the meal before, and after", where: "On Plan" });
  return {
    parts: [
      { k: "1", title: "Before: yesterday", body: yk === "rest" ? "A rest day. The muscle's store is full." : `A training day${y && y.intensity ? `, ${y.intensity}` : ""}. The muscle's store was used and refilled by the carbs after.` },
      { k: "2", title: "The path here", body: `${first ? `${first.name} at ${first.time} refilled the liver.` : "The first meal refills the liver."} ${tk === "rest" ? "No carbs with a job in the muscle today." : "Today's session will use the muscle's store."}` },
      { k: "3", title: "Now", body: tk === "rest" ? "A rest day. Carbs inside the range, with no special job." : `${planLine({ ...t!, when: undefined })}${tw ? `, ${tw.phrase.replace(/^training /, "")}` : ""} today. Muscle glycogen will be used.` },
      { k: "4", title: "The path on", body: "" },
      { k: "5", title: "The goal: the day", body: "Carbs inside your range, placed where they have a job. Your numbers do not change." },
    ],
    taps: taps.length ? taps : [{ id: "snack", label: "Carbs at the usual share today", where: "Nothing to change; the store is full" }],
    trend: null,
  };
}

export type FatIn = { personal: Personal; feedback: Feedback[]; planned: Planned; band: string; goalSetAt?: string; numbersFor: (d: Date) => { kcal: number; protein: number } | null };
export function fatCase(x: FatIn, today = new Date()): Case {
  const l = lifestyleOf(x.personal), key = ymd(today);
  const w = x.personal.weightKg ?? 0;
  const tr = w ? trendOf(x.personal.weighIns, x.band, w, x.personal.trainingAge, today) : null;
  const a7 = avg7(x.personal.weighIns, today);
  // the week by the plan: days lived by the plan out of the last 7
  const days = Array.from({ length: 7 }, (_, i) => plusDays(key, -(7 - i)));
  const lived = days.filter((d) => { const dt = new Date(`${d}T12:00:00`); const slots = slotsOn(l, x.personal.timesOn, d); const rec = dayRecord(slots, x.planned[d], dayLog(x.feedback, dt).logged, d); return livedByPlan({ planned: rec.planned, open: rec.open.length, kcal: rec.kcal, protein: rec.protein }, x.numbersFor(dt)).lived; }).length;
  const over = days.filter((d) => { const dt = new Date(`${d}T12:00:00`); const n = x.numbersFor(dt); const log = dayLog(x.feedback, dt); return n && log.logged.length > 0 && log.kcal > n.kcal * 1.1; }).length;
  const steps = STEPS.find((s) => s.id === x.personal.steps);
  const goalName = goalLabel(x.band);
  const since = x.goalSetAt ? new Date(x.goalSetAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" }) : null;
  const change = tr && tr.change !== null ? `${tr.change > 0 ? "up" : "down"} ${Math.abs(tr.change).toFixed(1)} kg over ${tr.weeks} ${tr.weeks === 1 ? "week" : "weeks"}` : "too few weigh-ins for a trend yet";
  const expected = tr ? `${tr.expected[0]} to ${tr.expected[1]} kg` : null;
  const taps: Tap[] = [
    { id: "easy", label: "A 30 minute walk after lunch, most days", where: "Easy work that adds up; ask Chef Mealan where it fits your day" },
    ...(over >= 2 ? [{ id: "dinner" as const, label: `Dinner inside the range on the ${over} long days`, where: "Chef Mealan's quick dinners, cooked ahead" }] : []),
    { id: "protein", label: "Protein at every meal, the strength days kept", where: "The fat goes, the muscle stays" },
  ];
  return {
    parts: [
      { k: "1", title: `Before: your goal${since ? `, set ${since}` : ""}`, body: `${goalName}${w ? `. ${w} kg at the start` : ""}.${expected ? ` The goal expects ${expected} over ${tr!.weeks} ${tr!.weeks === 1 ? "week" : "weeks"}.` : ""}` },
      { k: "2", title: "The path here: the last week", body: `${lived} of 7 days by the plan.${over ? ` ${over} ${over === 1 ? "day" : "days"} over the range.` : ""}${steps ? ` Steps: ${steps.name}.` : ""}` },
      { k: "3", title: "Now", body: `${a7 !== null ? `${a7.toFixed(1)} kg on the 7-day average. ` : ""}Trend: ${change}.${tr && tr.verdict !== "too few" ? ` Against the goal: ${tr.verdict}.` : ""}` },
      { k: "4", title: "The path on", body: "" },
      { k: "5", title: "The goal: the check-in", body: `${goalName}: ${expected ? `${expected}, ` : ""}six of seven days by the plan, the strength days kept.` },
    ],
    taps,
    trend: tr && tr.change !== null && tr.verdict !== "too few" ? `Your trend: ${change}. Your goal needs ${expected}. ${tr.verdict === "on track" ? "They point the same way: nothing to change." : tr.verdict === "slower" || (x.band !== "maintain" && tr.verdict === "up") ? "The gap is a walk a day and the days over the range, not a harder cut." : tr.verdict === "faster" ? "Faster than the goal expects: eat to the range, the cut is deep enough." : "Read the record on Goal with your coach."}` : null,
  };
}
