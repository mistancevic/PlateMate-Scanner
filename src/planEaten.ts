// B167 (0.3.191, board Stories292; Coach Milan, Go 23 November 22:57): one meal, the same on Today and in Plan. A meal of
// the day is eaten when a record holds that day and that meal (status eaten). Plan on today shows it as eaten, as a past day
// does, and its numbers count what was eaten in that meal, in place of what was planned for it.
import { aggregate, type Feedback } from "./pilot";
import type { PlannedMeal } from "./planned";

export const eatenIn = (logged: Feedback[], date: string, slotId: string): Feedback[] =>
  logged.filter((f) => f.status === "eaten" && f.slot?.date === date && f.slot.slotId === slotId);

// the plan of a day with each eaten meal in place of its plan: what the day's numbers count
export function withEaten(held: Record<string, PlannedMeal>, logged: Feedback[], date: string): Record<string, PlannedMeal> {
  const ids = new Set(logged.filter((f) => f.status === "eaten" && f.slot?.date === date).map((f) => f.slot!.slotId));
  if (!ids.size) return held;
  const next: Record<string, PlannedMeal> = { ...held };
  for (const id of ids) {
    const e = eatenIn(logged, date, id);
    const n = e.reduce((s, f) => { const a = aggregate(f.meal.items); return { kcal: s.kcal + (a.calories ?? 0), protein: s.protein + (a.protein ?? 0) }; }, { kcal: 0, protein: 0 });
    next[id] = { title: e.map((f) => f.meal.title).join(", "), kcal: Math.round(n.kcal), protein: Math.round(n.protein), source: "mine" };
  }
  return next;
}
