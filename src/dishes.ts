// DT246 and DT247 (0.3.96, boards Stories182 and Stories183; Coach Milan 6 November, Go 12:24). Pure rules, so the unit tests
// and the walkthroughs read the same ones.
// DT246: a plate already recorded says which meal it went to, and every change on the Plate goes to that meal too.
// DT247: one meal, two dishes (a main and a dessert). A second photo soon after a meal asks once: Dessert to your dinner, or
// its own snack; within an hour Dessert is the main button. Each dish keeps its own photo, foods and checks; the meal adds
// them up. Fit to my target works on the dish you are on, and the other dish counts as it is.
import type { Feedback, Ingredient } from "./pilot";

export type Recorded = { cardId: string; date: string; slot: string | null; at: string };

// the plate follows its record while it is still the same plate: at least one of its rows came from the record. A new plate
// (a new photo, a recipe, a cleared plate) shares none, so the record stays as it was and the plate stops following it.
export function stillSame(items: Ingredient[], card: Feedback | undefined): boolean {
  if (!card || !items.length) return false;
  const ids = new Set(card.meal.items.map((i) => i.id));
  return items.some((i) => ids.has(i.id));
}
// the record this plate is: the one it was opened from (DT247's dishes), or the meal its photo was recorded with. A photo is
// one meal's own, so a plate back on the Plate with that photo and its rows is that meal, whatever way it came back. Never a recipe's
// foods: a recipe cooked again is a new meal.
export const RECORD_DAYS = 3;
export function recordOf(feedback: Feedback[], plate: { items: Ingredient[]; photo?: { image: string; who?: string }; recorded?: Recorded }, now = new Date()): Feedback | null {
  if (!plate.items.length) return null;
  if (plate.recorded) { const c = feedback.find((f) => f.id === plate.recorded!.cardId && f.status === "eaten"); return c && stillSame(plate.items, c) ? c : null; }
  const ph = plate.photo; if (!ph || ph.who === "idea") return null;
  const since = now.getTime() - RECORD_DAYS * 86400000;
  // the same photo and the same rows: a copy of that plate, not a new read of a photo like it
  return feedback.find((f) => f.status === "eaten" && f.photo === ph.image && new Date(f.createdAt).getTime() >= since && !f.left && stillSame(plate.items, f)) ?? null;
}
const sig = (items: Ingredient[]) => items.map((i) => `${i.id}:${i.food.id}:${Math.round(i.grams)}`).join("|");
// the record with the Plate's foods, amounts and name; null when nothing changed
export function followed(card: Feedback, items: Ingredient[], title: string): Feedback | null {
  const name = title && title !== "DaaM" ? title : card.meal.title;
  if (sig(card.meal.items) === sig(items) && name === card.meal.title) return null;
  const meal = { ...card.meal, title: name, items: structuredClone(items).map((i) => ({ ...i, est: undefined })), portion: items.reduce((n, i) => n + i.grams, 0) };
  return { ...card, meal };
}

// the dishes already eaten at this meal of this day, except the plate's own record
export const dishesOf = (feedback: Feedback[], date: string, slotId: string, except?: string | null) =>
  feedback.filter((f) => f.status === "eaten" && f.slot?.date === date && f.slot.slotId === slotId && f.id !== except)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

const kcalOf = (items: Ingredient[]) => items.reduce((n, i) => n + ((i.food.calories ?? 0) * i.grams) / 100, 0);
const protOf = (items: Ingredient[]) => items.reduce((n, i) => n + ((i.food.protein ?? 0) * i.grams) / 100, 0);
export const dishNums = (items: Ingredient[]) => ({ kcal: Math.round(kcalOf(items)), protein: Math.round(protOf(items) * 10) / 10 });

// the meal as a whole: its dishes added up, and where it lands against the meal's range (need, within 10 %)
export function mealBar(need: number, dishes: { kcal: number; protein: number }[]) {
  const kcal = dishes.reduce((n, d) => n + d.kcal, 0), protein = dishes.reduce((n, d) => n + d.protein, 0);
  const lo = Math.round(need * 0.9), hi = Math.round(need * 1.1);
  const off = kcal > hi ? kcal - hi : kcal < lo ? kcal - lo : 0;
  return { kcal: Math.round(kcal), protein, pd: kcal > 0 ? Math.round((protein / kcal) * 1000) / 10 : null, lo, hi, over: off > 0 ? Math.round(off / 10) * 10 : 0, under: off < 0 ? Math.round(-off / 10) * 10 : 0 };
}

// what this dish has room for: the meal's size less the other dishes, as they are
export const roomFor = (need: number, others: { kcal: number; protein: number }[], needProtein: number) => ({
  kcal: Math.max(0, Math.round(need - others.reduce((n, d) => n + d.kcal, 0))),
  protein: Math.max(0, Math.round(needProtein - others.reduce((n, d) => n + d.protein, 0))),
});

// a dish's name in the meal: the first is the main; one you said is a dessert says so; any other is a dish
export const courseOf = (k: number, f: { course?: "dessert" }): "main" | "dessert" | "dish" => (f.course === "dessert" ? "dessert" : k === 0 ? "main" : "dish");

// DT247: a second photo after a meal of today asks once. The meal eaten last, within 3 hours before the photo, of a meal of the
// day (not a snack off the plan). Within an hour of it, Dessert to that meal is the main button; later, its own snack is.
export const ASK_HOURS = 3, DESSERT_WITHIN = 60;
export function secondDish(feedback: Feedback[], photoAt: Date): { prev: Feedback; minutes: number; dessertFirst: boolean } | null {
  const t = photoAt.getTime();
  const prev = feedback.filter((f) => f.status === "eaten" && f.slot && !/snack/i.test(f.slot.name) && !f.which)
    .map((f) => ({ f, m: (t - new Date(f.createdAt).getTime()) / 60000 }))
    .filter(({ f, m }) => m >= 0 && m <= ASK_HOURS * 60 && new Date(f.createdAt).toDateString() === photoAt.toDateString())
    .sort((a, b) => a.m - b.m)[0];
  if (!prev) return null;
  const minutes = Math.max(1, Math.round(prev.m));
  return { prev: prev.f, minutes, dessertFirst: minutes <= DESSERT_WITHIN };
}
