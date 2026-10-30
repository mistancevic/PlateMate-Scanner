// The slots of a day (0.2.1, canvas S and H, 11 October 2026): when I eat. A slot is a time and a name; the meal in it comes
// in 0.2.2. The slots come from Lifestyle: meals a day gives how many, the eating window gives the first and the last time,
// the rest sit evenly between. Times can be changed in Lifestyle; a day's training (the Training week) sits between them as a row.
import type { Lifestyle, PlanDay, When } from "./plan";

export type Slot = { id: string; name: string; time: string };
export type DayRow = { kind: "slot"; slot: Slot } | { kind: "training"; time: string; label: string; exact: boolean; day: PlanDay };

// the names by how many meals a day: 1 to 5; 4 and 5 hold snacks; one meal a day is Meal (DT134, 0.2.113)
const NAMES: Record<number, string[]> = {
  1: ["Meal"],
  2: ["Lunch", "Dinner"],
  3: ["Breakfast", "Lunch", "Dinner"],
  4: ["Breakfast", "Lunch", "Snack", "Dinner"],
  5: ["Breakfast", "Snack", "Lunch", "Snack", "Dinner"],
};
const ids = (names: string[]) => { const seen: Record<string, number> = {}; return names.map((n) => { const k = n.toLowerCase(); seen[k] = (seen[k] ?? 0) + 1; return seen[k] > 1 ? `${k}${seen[k]}` : k; }); };

export const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
export const toTime = (min: number) => { const m = ((Math.round(min / 5) * 5) % (24 * 60) + 24 * 60) % (24 * 60); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };

// the default times: the window's start and end, or 07:30 to 20:00 when none is set, the rest evenly between
export function defaultTimes(n: number, window: { from: string; to: string } | null | undefined): string[] {
  const from = toMin(window?.from || "07:30"), to = toMin(window?.to || "20:00");
  if (n <= 1) return ["18:00"]; // DT134: one meal a day starts at 18:00; the person sets their own
  const span = Math.max(60, to - from);
  return Array.from({ length: n }, (_, i) => toTime(from + (span * i) / (n - 1)));
}

// DT147 (0.2.128, board Stories99 version 2; Tester 3 works Canadian hours from Cyprus; Coach Milan 28 October, Go at 23:13):
// work hours as a time span. Fixed hours with one of the three common chips, or My hours, From and To; hours past midnight end
// the next day. Flexible hours, shifts, study and At home have none.
type WorkLife = Pick<Lifestyle, "weekdays" | "hours" | "slot" | "workFrom" | "workTo">;
export type WorkHours = { from: string; to: string };
export const SLOT_HOURS: Record<string, WorkHours> = { "9-5": { from: "09:00", to: "17:00" }, "8-4": { from: "08:00", to: "16:00" }, "7-3": { from: "07:00", to: "15:00" } };
const isTime = (t?: string) => !!t && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
export function workHoursOf(l: WorkLife | null | undefined): WorkHours | null {
  if (!l) return null;
  const wk = l.weekdays ?? "work";
  if ((wk !== "work" && wk !== "both") || l.hours !== "fixed" || !l.slot) return null;
  if (l.slot === "my") return isTime(l.workFrom) && isTime(l.workTo) && l.workFrom !== l.workTo ? { from: l.workFrom!, to: l.workTo! } : null;
  return SLOT_HOURS[l.slot] ?? null;
}
// the span in minutes from midnight; an end before the start is the next day
const spanOf = (w: WorkHours) => { const a = toMin(w.from); let b = toMin(w.to); if (b <= a) b += 24 * 60; return { a, b }; };
// a minute of the day falls in work hours, the night after midnight too
export const atWork = (min: number, w: WorkHours | null): boolean => { if (!w) return false; const { a, b } = spanOf(w); return (min >= a && min < b) || (min + 24 * 60 >= a && min + 24 * 60 < b); };

// Meal times around work, for the meals the person has not timed. Day work (start 05:00 to 10:59): the usual times stay when
// the first meal comes before work and the last after it (9 to 5, 8 to 4); else breakfast an hour before work, lunch at the
// halfway break, dinner an hour and a half after, not before 18:00. Late work (start 11:00 to 19:59): breakfast late morning,
// the main meal an hour before work, a small meal at the halfway break. Night work, or anything that doesn't fit: the usual times.
// DT166: usual, the times sleep gives (wake-up and bedtime); then breakfast before work is never before that breakfast
export function workMealTimes(n: number, w: WorkHours | null, usualIn?: string[] | null): string[] | null {
  if (!w || n < 1 || n > 5) return null;
  const { a, b } = spanOf(w), len = b - a;
  if (len < 180 || len > 13 * 60) return null;
  const mid = a + len / 2;
  let t: number[];
  if (a >= 5 * 60 && a < 11 * 60) {
    const usual = (usualIn ?? defaultTimes(n, null)).map(toMin);
    if (n > 1 && usual[0] <= a - 30 && usual[n - 1] >= b + 30) return null; // already around work
    const B = usualIn ? Math.min(Math.max(a - 60, usual[0]), a) : a - 60, D = Math.min(Math.max(b + 90, 18 * 60), 21 * 60 + 30), after = b + 15;
    t = n === 1 ? [Math.max(b + 60, 18 * 60)] : n === 2 ? [mid, D] : n === 3 ? [B, mid, D] : n === 4 ? [B, mid, after, D] : [B, (B + mid) / 2, mid, after, D];
  } else if (a >= 11 * 60 && a < 20 * 60) {
    const B = Math.min(Math.max(a - 360, 8 * 60), 11 * 60), main = a - 60, brk = mid, end = b + 30;
    const late = end <= 23 * 60 + 55;
    t = n === 1 ? [main] : n === 2 ? [main, brk] : n === 3 ? [B, main, brk] : n === 4 ? (late ? [B, main, brk, end] : [B, main, (main + brk) / 2, brk]) : [B, (B + main) / 2, main, (main + brk) / 2, brk];
  } else return null;
  for (let i = 1; i < t.length; i++) if (t[i] - t[i - 1] < 30) return null;
  return t.map(toTime);
}
// DT166 (0.3.8, board Stories118; Coach Milan 30 October: "Makes no sense that it is there set but no influence"): wake-up and
// bedtime set the day's first and last meal. Breakfast an hour and a half after the start of your wake-up range (before 6:00
// counts as 5:00); the last meal two hours before the start of your bedtime range (before 22:00 counts as 21:00). Our rule, not a
// study's: 6:00 to 8:00 and 22:00 to midnight give 07:30 and 20:00, the times the app has always used. Varies with shifts: as before.
type SleepLife = Partial<Pick<Lifestyle, "wake" | "bed">>;
const WAKE_FROM: Record<string, number> = { early: 5 * 60, mid: 6 * 60, late: 8 * 60 };
const BED_FROM: Record<string, number> = { early: 21 * 60, mid: 22 * 60, late: 24 * 60 };
export function sleepWindow(l: SleepLife | null | undefined): { from: string; to: string } | null {
  const w = l?.wake ? WAKE_FROM[l.wake] : undefined, b = l?.bed ? BED_FROM[l.bed] : undefined;
  if (w === undefined && b === undefined) return null;
  return { from: toTime((w ?? 6 * 60) + 90), to: toTime((b ?? 22 * 60) - 120) };
}
export type TimesFrom = "window" | "work" | "sleep" | "usual";
// the times the slots start from: an eating window set before; else around work; else from wake-up and bedtime; else 07:30 to 20:00
export const startTimes = (n: number, l: Partial<WorkLife> & Pick<Lifestyle, "window"> & SleepLife): { times: string[]; fromWork: boolean; from: TimesFrom } => {
  if (l.window) return { times: defaultTimes(n, l.window), fromWork: false, from: "window" };
  const sw = n > 1 ? sleepWindow(l) : null, usual = sw ? defaultTimes(n, sw) : null;
  const w = workMealTimes(n, workHoursOf(l as WorkLife), usual); if (w) return { times: w, fromWork: true, from: "work" };
  if (usual) return { times: usual, fromWork: false, from: "sleep" };
  return { times: defaultTimes(n, null), fromWork: false, from: "usual" };
};
// the slots of a Lifestyle: meals a day (3 when unset), the window or the work hours, and any times the person changed
// (slotTimes by id): a time you set always wins
export function slotsOf(l: Pick<Lifestyle, "meals" | "window"> & Partial<WorkLife> & SleepLife & { slotTimes?: Record<string, string> }): Slot[] {
  const n = Math.min(5, Math.max(1, l.meals ?? 3));
  const names = NAMES[n], id = ids(names), times = startTimes(n, l).times;
  return names.map((name, i) => ({ id: id[i], name, time: l.slotTimes?.[id[i]] ?? times[i] }));
}
// some meal still takes its time from the work hours
export const timesFromWork = (l: Pick<Lifestyle, "meals" | "window"> & Partial<WorkLife> & SleepLife & { slotTimes?: Record<string, string> }): boolean => {
  const n = Math.min(5, Math.max(1, l.meals ?? 3));
  return startTimes(n, l).fromWork && ids(NAMES[n]).some((k) => !l.slotTimes?.[k]);
};
// DT166: some meal still takes its time from wake-up and bedtime
export const timesFromSleep = (l: Pick<Lifestyle, "meals" | "window"> & Partial<WorkLife> & SleepLife & { slotTimes?: Record<string, string> }): boolean => {
  const n = Math.min(5, Math.max(1, l.meals ?? 3));
  return startTimes(n, l).from === "sleep" && ids(NAMES[n]).some((k) => !l.slotTimes?.[k]);
};

// the eating window the day gate reads: one meal a day eats within an hour from the meal (DT134, 0.2.113, board Stories89);
// otherwise the window as set
export function windowOf(l: Pick<Lifestyle, "meals" | "window"> & Partial<WorkLife> & SleepLife & { slotTimes?: Record<string, string> }): { from: string; to: string } | null {
  if ((l.meals ?? 3) === 1) { const t = slotsOf(l)[0].time; return { from: t, to: toTime(toMin(t) + 60) }; }
  return l.window ?? null;
}

// A day's own times (0.2.8, canvas board CH, CH6): a meal moved for one date from the chat ("Move dinner to after
// training"); the usual times in Lifestyle stay as they are
export type TimesOn = Record<string, Record<string, string>>;
export function slotsOn(l: Pick<Lifestyle, "meals" | "window"> & Partial<WorkLife> & SleepLife & { slotTimes?: Record<string, string> }, timesOn: TimesOn | undefined, date: string): Slot[] {
  const own = timesOn?.[date];
  return slotsOf(l).map((s) => (own?.[s.id] ? { ...s, time: own[s.id] } : s));
}
// a slot's time for one date; the same as the usual time takes the date's own time away; dates older than 60 days drop off
export function withTimeOn(timesOn: TimesOn | undefined, date: string, slotId: string, time: string | null, usual: string): TimesOn {
  const cut = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
  const next: TimesOn = Object.fromEntries(Object.entries(timesOn ?? {}).filter(([d]) => d >= cut));
  const day = { ...(next[date] ?? {}) };
  if (time && time !== usual) day[slotId] = time; else delete day[slotId];
  if (Object.keys(day).length) next[date] = day; else delete next[date];
  return next;
}

// The training's time (canvas board FX, TT0 to TT2, Milan 14 October 2026): a clock time only when the person set one.
// A part of the day is shown as words and only places the row among the meals; nothing set sits at the end of the day.
export const TRAINING_TIME: Record<When, string> = { morning: "07:00", day: "12:30", evening: "17:30", late: "20:30", afterschool: "15:00", lateafternoon: "16:30" };
const WHEN_WORD: Record<When, string> = { morning: "Morning", day: "During the day", evening: "Evening", late: "Late night", afterschool: "After school", lateafternoon: "Late afternoon" };
const WHEN_PHRASE: Record<When, string> = { morning: "in the morning", day: "during the day", evening: "in the evening", late: "late at night", afterschool: "after school", lateafternoon: "in the late afternoon" };
const isClock = (t?: string) => !!t && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
// the clock time the person set, or null
export const trainingTime = (d: PlanDay | null | undefined): string | null => (d && d.kind !== "rest" && isClock(d.at) ? d.at! : null);
// DT147: a part of the day for training falls in work hours when its usual time does
export const whenAtWork = (w: When, wh: WorkHours | null): boolean => atWork(toMin(TRAINING_TIME[w]), wh);
// the part of the day suggested for a new training day: the usual one, else the first outside work (evening, morning, during
// the day, late night). Nothing is taken away: every part stays open, a break at work can be gym time.
export function suggestWhen(usual: When, wh: WorkHours | null): When {
  if (!whenAtWork(usual, wh)) return usual;
  return (["evening", "morning", "day", "late"] as When[]).find((x) => !whenAtWork(x, wh)) ?? usual;
}
export const WORK_WHEN = (wh: WorkHours) => `Chef Mealan suggests training outside your work hours, ${wh.from} to ${wh.to}. Every time stays open: a break at work can be gym time.`;
// where the row goes and what its time column says
export function trainingWhen(d: PlanDay | null | undefined): { label: string; sort: string; exact: boolean; phrase: string } | null {
  if (!d || d.kind === "rest") return null;
  if (isClock(d.at)) return { label: d.at!, sort: d.at!, exact: true, phrase: `training at ${d.at}` };
  if (d.when) return { label: WHEN_WORD[d.when], sort: TRAINING_TIME[d.when], exact: false, phrase: `training ${WHEN_PHRASE[d.when]}` };
  return { label: "No time set", sort: "23:59", exact: false, phrase: "training, no time set" };
}

// the day's rows in time order: the slots, and the training between them
export function rowsOf(slots: Slot[], training: PlanDay | null | undefined): DayRow[] {
  const rows: DayRow[] = slots.map((slot) => ({ kind: "slot", slot }));
  const t = trainingWhen(training);
  if (t && training) rows.push({ kind: "training", time: t.sort, label: t.label, exact: t.exact, day: training });
  return rows.sort((a, b) => toMin(a.kind === "slot" ? a.slot.time : a.time) - toMin(b.kind === "slot" ? b.slot.time : b.time));
}

// the slot a meal eaten at this time belongs to: the nearest by time, within two hours, else none
export function slotAt(slots: Slot[], time: string): Slot | null {
  const m = toMin(time); let best: Slot | null = null, gap = 121;
  for (const s of slots) { const g = Math.abs(toMin(s.time) - m); if (g < gap) { gap = g; best = s; } }
  return best;
}
