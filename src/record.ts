// The day against the plan (0.2.3, canvas S "Today through the day" and H10 to H14): which slots are eaten, what came from
// outside, and the record line once every slot is eaten. A meal eaten for a slot counts as by the plan; a meal without a
// slot counts as extra. Information for the person and, on Friday, their coach.
import { aggregate, density, type Feedback } from "./pilot";
import type { PlannedMeal } from "./planned";
import type { Slot } from "./slots";

export type DayRecord = {
  slots: Slot[];
  planned: number;             // slots that hold a meal
  eaten: Feedback[];           // cards eaten for a slot of this day
  extras: Feedback[];          // cards eaten without a slot
  open: Slot[];                // slots still to come: planned and not eaten
  empty: Slot[];               // slots with nothing planned
  byPlan: number;
  kcal: number; protein: number; pd: number | null;
  done: boolean;               // every planned slot eaten, and at least one was planned
};

const numsOf = (cards: Feedback[]) => cards.reduce((t, f) => { const a = aggregate(f.meal.items); return { kcal: t.kcal + (a.calories ?? 0), protein: t.protein + (a.protein ?? 0) }; }, { kcal: 0, protein: 0 });

export function dayRecord(slots: Slot[], held: Record<string, PlannedMeal> | undefined, logged: Feedback[], date: string): DayRecord {
  const eaten = logged.filter((f) => f.status === "eaten" && f.slot?.date === date);
  const extras = logged.filter((f) => f.status === "eaten" && !f.slot);
  const eatenIds = new Set(eaten.map((f) => f.slot!.slotId));
  const open = slots.filter((s) => held?.[s.id] && !eatenIds.has(s.id));
  const empty = slots.filter((s) => !held?.[s.id] && !eatenIds.has(s.id));
  const planned = slots.filter((s) => held?.[s.id] || eatenIds.has(s.id)).length;
  const n = numsOf([...eaten, ...extras]);
  return { slots, planned, eaten, extras, open, empty, byPlan: eaten.length, kcal: n.kcal, protein: n.protein, pd: density(n.protein, n.kcal), done: planned > 0 && open.length === 0 };
}

// "1 of 3 by the plan so far, 1 extra · 1,420 of 2,200 kcal"
export function planLine(r: DayRecord, dayKcal: number | null): string {
  const of = r.planned || r.slots.length;
  const parts = [`${r.byPlan} of ${of} by the plan${r.done ? "" : " so far"}`];
  if (r.extras.length) parts.push(`${r.extras.length} extra`);
  const kcal = Math.round(r.kcal).toLocaleString("en");
  return `${parts.join(", ")} · ${dayKcal ? `${kcal} of ${Math.round(dayKcal).toLocaleString("en")} kcal` : `${kcal} kcal`}`;
}

// the record's sentence: "3 of 3 by the plan, 1 extra (the cake, 250 kcal)."
export function recordLine(r: DayRecord): string {
  const extras = r.extras.length
    ? `, ${r.extras.length} extra (${r.extras.map((f) => `${f.meal.title.toLowerCase()}, ${Math.round(aggregate(f.meal.items).calories ?? 0)} kcal`).join("; ")})`
    : "";
  return `${r.byPlan} of ${r.planned} by the plan${extras}.`;
}
