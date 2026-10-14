// The slots of a day (0.2.1, canvas S and H, 11 October 2026): when I eat. A slot is a time and a name; the meal in it comes
// in 0.2.2. The slots come from Lifestyle: meals a day gives how many, the eating window gives the first and the last time,
// the rest sit evenly between. Times can be changed in Lifestyle; a day's training (the Training week) sits between them as a row.
import type { Lifestyle, PlanDay, When } from "./plan";

export type Slot = { id: string; name: string; time: string };
export type DayRow = { kind: "slot"; slot: Slot } | { kind: "training"; time: string; label: string; exact: boolean; day: PlanDay };

// the names by how many meals a day: 2 to 5; 4 and 5 hold snacks
const NAMES: Record<number, string[]> = {
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
  if (n <= 1) return [toTime(from)];
  const span = Math.max(60, to - from);
  return Array.from({ length: n }, (_, i) => toTime(from + (span * i) / (n - 1)));
}

// the slots of a Lifestyle: meals a day (3 when unset), the window, and any times the person changed (slotTimes by id)
export function slotsOf(l: Pick<Lifestyle, "meals" | "window"> & { slotTimes?: Record<string, string> }): Slot[] {
  const n = Math.min(5, Math.max(2, l.meals ?? 3));
  const names = NAMES[n], id = ids(names), times = defaultTimes(n, l.window);
  return names.map((name, i) => ({ id: id[i], name, time: l.slotTimes?.[id[i]] ?? times[i] }));
}

// The training's time (canvas board FX, TT0 to TT2, Milan 14 October 2026): a clock time only when the person set one.
// A part of the day is shown as words and only places the row among the meals; nothing set sits at the end of the day.
export const TRAINING_TIME: Record<When, string> = { morning: "07:00", day: "12:30", evening: "17:30", late: "20:30", afterschool: "15:00", lateafternoon: "16:30" };
const WHEN_WORD: Record<When, string> = { morning: "Morning", day: "During the day", evening: "Evening", late: "Late night", afterschool: "After school", lateafternoon: "Late afternoon" };
const WHEN_PHRASE: Record<When, string> = { morning: "in the morning", day: "during the day", evening: "in the evening", late: "late at night", afterschool: "after school", lateafternoon: "in the late afternoon" };
const isClock = (t?: string) => !!t && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
// the clock time the person set, or null
export const trainingTime = (d: PlanDay | null | undefined): string | null => (d && d.kind !== "rest" && isClock(d.at) ? d.at! : null);
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
