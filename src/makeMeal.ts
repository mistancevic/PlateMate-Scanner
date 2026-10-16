// Make it a meal (0.2.9, canvas board CH, CH1 to CH3; Milan 15 October 2026, 21:34 to 22:43). Rules decide what must be
// true, Chef Mealan decides what is good to eat:
//   - how big a meal is: a rule, what is left of the day shared over the meals still to come, a snack counting half;
//   - which way a plate goes: the quick fit when maths does it (one food moves, a real portion, near the meal's size);
//     Chef Mealan when it cannot (no food lifts the PD, a silly portion, or the plate is far from a meal);
//   - Chef Mealan names the foods to add and the base that carries the energy; the app sets the base's grams and checks.
import { aggregate, density, type Food, type Ingredient } from "./pilot";
import { minPortionOf } from "./foodjob";
import { weightOf } from "./planned";
import type { Slot } from "./slots";
import { toMin } from "./slots";

export type Nums = { kcal: number; protein: number };
// the meal's share of what is left: the meals not yet eaten or skipped, this one included
export function mealShare(slots: Slot[], slotId: string, day: Nums | null, eaten: Nums, closed: Set<string>): Nums | null {
  if (!day) return null;
  const slot = slots.find((s) => s.id === slotId); if (!slot) return null;
  const toCome = slots.filter((s) => s.id === slotId || !closed.has(s.id));
  const total = toCome.reduce((n, s) => n + weightOf(s), 0) || 1, share = weightOf(slot) / total;
  return { kcal: Math.round(Math.max(0, day.kcal - eaten.kcal) * share), protein: Math.round(Math.max(0, day.protein - eaten.protein) * share) };
}
// Which meals are done for today (0.2.12, canvas board MS, MS1 and MS2; Milan 16 October 2026, 18:08): eaten for the plan,
// skipped on purpose, a meal eaten off the plan for the meal nearest its time (from an hour before that meal to an hour and
// a half after, the window that decides which meal a plate is for), and a meal the person said they skipped. For the size
// only: the plan still shows a plate off the plan as extra.
export const WINDOW = { before: 60, after: 90 };
export function closedSlots(slots: Slot[], rec: { eaten: { slot?: { slotId: string } }[]; skipped: Slot[]; extras: { createdAt: string }[] }, answers: Record<string, "had" | "skipped"> = {}): Set<string> {
  const closed = new Set<string>([...rec.eaten.map((f) => f.slot!.slotId), ...rec.skipped.map((x) => x.id)]);
  for (const [id, a] of Object.entries(answers)) if (a === "skipped") closed.add(id);
  for (const f of [...rec.extras].sort((x, y) => (x.createdAt < y.createdAt ? -1 : 1))) {
    const d = new Date(f.createdAt), t = d.getHours() * 60 + d.getMinutes();
    const near = slots.filter((s) => !closed.has(s.id) && t >= toMin(s.time) - WINDOW.before && t <= toMin(s.time) + WINDOW.after)
      .sort((x, y) => Math.abs(t - toMin(x.time)) - Math.abs(t - toMin(y.time)))[0];
    if (near) closed.add(near.id);
  }
  return closed;
}
// A meal whose time has passed and isn't logged (MS2): the first one, unless the person already answered for it today
export function unloggedMeal(slots: Slot[], closed: Set<string>, answers: Record<string, "had" | "skipped">, now: Date, current: string | null): Slot | null {
  const m = now.getHours() * 60 + now.getMinutes();
  return slots.find((s) => s.id !== current && !closed.has(s.id) && !answers[s.id] && toMin(s.time) + WINDOW.after < m) ?? null;
}
// the meal a plate off the plan is for: the next meal not yet eaten or skipped, by the time now; after the last, the last
export function mealNow(slots: Slot[], closed: Set<string>, now: Date): Slot | null {
  const m = now.getHours() * 60 + now.getMinutes();
  const open = slots.filter((s) => !closed.has(s.id));
  // a meal counts as now from an hour before its time to an hour and a half after
  return open.find((s) => toMin(s.time) + 90 >= m) ?? open[open.length - 1] ?? slots[slots.length - 1] ?? null;
}

// which way the plate goes
export const NEAR = [0.6, 1.4] as const; // a plate between 60 % and 140 % of the meal's energy is near enough to be the meal
export type Route = "fit" | "chef";
export function routeOf(o: { pd: number | null; target: number | null; kcal: number; need: number | null; fit: { ok: boolean; kcal: number } | null }): Route {
  if (o.need === null || o.need < 150 || o.target === null || o.pd === null) return "fit";
  const near = (k: number) => k >= o.need! * NEAR[0] && k <= o.need! * NEAR[1];
  // a plate already bigger than the meal: adding food cannot help; the quick fit, as before
  if (o.kcal > o.need * NEAR[1]) return "fit";
  if (o.pd < o.target - 0.05) return o.fit?.ok && near(o.fit.kcal) ? "fit" : "chef";
  return near(o.kcal) ? "fit" : "chef";
}

// an idea from Chef Mealan on the plate: the plate as it stands, the foods Chef Mealan adds at their amounts, and the base
// that carries the energy, whose grams the app works out so the meal lands on its size. Then the checks.
export type Add = { food: Food; grams: number; base: boolean; have: boolean };
export type Solved = { ok: true; items: Ingredient[]; kcal: number; protein: number; pd: number | null; baseGrams: number } | { ok: false; why: string };
const r5 = (g: number) => Math.round(g / 5) * 5;
export function solveMeal(plate: Ingredient[], adds: Add[], need: number, target: number | null, allergic: (f: Food) => boolean, uid: () => string): Solved {
  if (!adds.length) return { ok: false, why: "nothing to add" };
  const bad = adds.find((a) => allergic(a.food)); if (bad) return { ok: false, why: `${bad.food.name} clashes with an allergy` };
  if (adds.some((a) => !(Number(a.food.calories) >= 0) || !(Number(a.food.protein) >= 0))) return { ok: false, why: "a food without numbers" };
  const base = adds.find((a) => a.base) ?? [...adds].sort((x, y) => (y.food.calories ?? 0) * y.grams - (x.food.calories ?? 0) * x.grams)[0];
  const kept = plate.map((i) => ({ ...i, locked: true }));
  const fixed = [...kept, ...adds.filter((a) => a !== base).map((a) => ({ id: uid(), food: a.food, grams: Math.max(0, Math.round(a.grams)), locked: true }))];
  const kcalFixed = aggregate(fixed).calories ?? 0, per = (base.food.calories ?? 0) / 100;
  if (per <= 0) return { ok: false, why: `${base.food.name} carries no energy` };
  const raw = (need - kcalFixed) / per, min = minPortionOf(base.food);
  if (raw < min) return { ok: false, why: `${base.food.name} would be ${Math.max(0, Math.round(raw))} g, under a portion` };
  if (raw > 450) return { ok: false, why: `${base.food.name} would be ${Math.round(raw)} g, not a portion` };
  const baseGrams = r5(raw);
  const items: Ingredient[] = [...fixed, { id: uid(), food: base.food, grams: baseGrams, locked: false }];
  const t = aggregate(items), pd = density(t.protein, t.calories);
  if (target !== null && pd !== null && pd < target - 0.05) return { ok: false, why: `PD ${pd.toFixed(1)} under the target ${target.toFixed(1)}` };
  return { ok: true, items, kcal: Math.round(t.calories ?? 0), protein: Math.round((t.protein ?? 0) * 10) / 10, pd, baseGrams };
}
