// What is in the slots (0.2.2, canvas S "Plan purpose one" and H7): a meal per slot per date, with its numbers, so the day
// adds up before anything is cooked. A meal comes from My recipes, Coach's recipes, Chef Mealan's starters, or the Plate.
import { aggregate, density, type Ingredient, type Meal } from "./pilot";
import type { Slot } from "./slots";

export type Source = "mine" | "coach" | "starter" | "plate";
export type PlannedMeal = { title: string; kcal: number; protein: number; source: Source; mealId?: string; items?: Ingredient[]; portion?: number };
export type Planned = Record<string, Record<string, PlannedMeal>>; // by date (ymd), then by slot id

const KEY = "chefmealan-planned";
export const getPlanned = (): Planned => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
export const storePlanned = (p: Planned) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };
// put a meal in a slot, or empty it with null; a date with nothing left disappears
export function withPlanned(p: Planned, date: string, slotId: string, meal: PlannedMeal | null): Planned {
  const day = { ...(p[date] ?? {}) };
  if (meal) day[slotId] = meal; else delete day[slotId];
  const next = { ...p };
  if (Object.keys(day).length) next[date] = day; else delete next[date];
  return next;
}

// a recipe as a planned meal: its numbers at the portion saved
export function fromMeal(m: Meal, source: Source): PlannedMeal {
  const t = aggregate(m.items);
  const ratio = m.portion && t.weight > 0 ? Math.min(1, m.portion / t.weight) : 1;
  return { title: m.title, kcal: Math.round((t.calories ?? 0) * ratio), protein: Math.round((t.protein ?? 0) * ratio), source, mealId: m.id, items: m.items, portion: m.portion };
}

// Chef Mealan's starters: a few meals so a plan can start before any recipe exists. Removable later; seeded per market later.
export const STARTERS: PlannedMeal[] = [
  { title: "Skyr bowl with berries", kcal: 420, protein: 46, source: "starter" },
  { title: "Oats, skyr and banana", kcal: 520, protein: 38, source: "starter" },
  { title: "Omelette with bread", kcal: 450, protein: 34, source: "starter" },
  { title: "Chicken, rice and greens", kcal: 640, protein: 52, source: "starter" },
  { title: "Tuna salad wrap", kcal: 480, protein: 36, source: "starter" },
  { title: "Protein pancakes", kcal: 520, protein: 44, source: "starter" },
  { title: "Sarma", kcal: 410, protein: 21, source: "starter" },
  { title: "Cottage cheese and fruit", kcal: 260, protein: 28, source: "starter" },
];

// what a slot needs: the day's numbers shared out by slot, a snack half of a meal
export const weightOf = (s: Slot) => (/snack/i.test(s.name) ? 0.5 : 1);
export function needOf(slots: Slot[], slot: Slot, day: { kcal: number; protein: number } | null): { kcal: number; protein: number } | null {
  if (!day) return null;
  const total = slots.reduce((n, s) => n + weightOf(s), 0) || 1;
  const share = weightOf(slot) / total;
  return { kcal: Math.round(day.kcal * share), protein: Math.round(day.protein * share) };
}

// the mark next to a meal: fits when its PD reaches the day's target, within a point; else how far under
export type Fit = { pd: number | null; state: "fits" | "under" | "none"; gap: number | null; text: string };
export function fitOf(meal: { kcal: number; protein: number }, target: number | null, unit: "pd" | "pct" = "pd"): Fit {
  const pd = density(meal.protein, meal.kcal);
  if (pd === null || target === null) return { pd, state: "none", gap: null, text: "" };
  const gap = target - pd;
  if (gap <= 1) return { pd, state: "fits", gap: 0, text: "fits" };
  const g = unit === "pct" ? `${Math.round(gap * 4)} %` : gap.toFixed(1);
  return { pd, state: "under", gap, text: `${g} under` };
}

// the day as planned: what the slots hold, added up
export function sumOf(day: Record<string, PlannedMeal> | undefined): { kcal: number; protein: number; pd: number | null; n: number } {
  const meals = Object.values(day ?? {});
  const kcal = meals.reduce((n, m) => n + m.kcal, 0), protein = meals.reduce((n, m) => n + m.protein, 0);
  return { kcal, protein, pd: density(protein, kcal), n: meals.length };
}
