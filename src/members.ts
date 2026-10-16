// Members: the recipes members share with each other (0.2.11, canvas board CO, CO2 to CO4b; Milan 16 October 2026).
// Each recipe is shown at your portion for the meal ahead, the rule from Make it a meal: what is left of the day shared
// over the meals still to come. The ones that reach your PD target come first, then your kitchens; under the target is
// shown and marked. A real photo does not move a recipe up. A recipe with one of your declared allergies is not shown.
import type { Food, Ingredient, Meal } from "./pilot";
import { aggregate, density } from "./pilot";
import { blockedByAllergy } from "./safety";

export type SharedFood = Pick<Food, "name" | "brand" | "calories" | "protein" | "fats" | "carbs" | "fiber" | "readyToEat"> & { icon?: string; serving?: Food["serving"] };
export type SharedItem = { id: string; grams: number; food: SharedFood };
export type SharedRecipe = {
  id: string; title: string; items: SharedItem[]; steps: string[]; kitchen: string | null;
  name: string; cover: string | null; coverKind: "drawn" | "photo"; sharedAt: string; updatedAt: string; made: number; mine?: boolean;
};

const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 && x < 10000 ? x : null);
const str = (x: unknown, n: number) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, n) : "");
// What a shared recipe may carry, checked on the server: the name, the foods with their values and amounts, the steps and
// a kitchen. Nothing else from the recipe gets through (no notes, no photos inside foods, no publish draft).
export function cleanShared(r: any): Omit<SharedRecipe, "id" | "name" | "cover" | "coverKind" | "sharedAt" | "updatedAt" | "made" | "mine"> | null {
  if (!r || typeof r !== "object") return null;
  const title = str(r.title, 80);
  const items: SharedItem[] = (Array.isArray(r.items) ? r.items : []).slice(0, 30).map((i: any) => ({
    id: str(i?.id, 40) || Math.random().toString(36).slice(2, 10),
    grams: num(i?.grams) ?? 0,
    food: {
      name: str(i?.food?.name, 80), brand: str(i?.food?.brand, 60),
      calories: num(i?.food?.calories), protein: num(i?.food?.protein), fats: num(i?.food?.fats), carbs: num(i?.food?.carbs), fiber: num(i?.food?.fiber),
      readyToEat: Boolean(i?.food?.readyToEat), ...(typeof i?.food?.icon === "string" && i.food.icon.length <= 8 ? { icon: i.food.icon } : {}),
      ...(i?.food?.serving && num(i.food.serving.grams) ? { serving: { grams: num(i.food.serving.grams)!, name: str(i.food.serving.name, 30) } } : {}),
    },
  })).filter((i: SharedItem) => i.food.name && i.grams > 0 && i.food.calories !== null);
  if (!title || !items.length) return null;
  const steps = (Array.isArray(r.steps) ? r.steps : []).slice(0, 30).map((x: unknown) => str(x, 400)).filter(Boolean);
  const kitchen = str(r.kitchen, 30) || null;
  return { title, items, steps, kitchen };
}

// A recipe of Mine as members get it
export function sharedOf(m: Meal, kitchen: string | null) {
  return {
    title: m.title,
    items: m.items.filter((i) => i.grams > 0).map((i) => ({ id: i.id, grams: i.grams, food: { name: i.food.name, brand: i.food.brand, calories: i.food.calories, protein: i.food.protein, fats: i.food.fats, carbs: i.food.carbs, fiber: i.food.fiber, readyToEat: i.food.readyToEat, icon: i.food.icon, serving: i.food.serving } })),
    steps: m.steps ?? [],
    kitchen,
  };
}
// what members have of a recipe, as a short fingerprint: a change to the name, foods, amounts, steps or kitchen reaches them
export function contentSig(x: unknown): string {
  const t = JSON.stringify(x); let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
  return `${t.length}:${h.toString(36)}`;
}
// the cook's first name, when they switch it on
export const firstName = (name: string | null | undefined) => String(name ?? "").trim().split(/\s+/)[0] ?? "";

// A shared food as a food of yours: the values, no photos, no notes
export const foodOf = (f: SharedFood, id: string): Food => ({ id, name: f.name, brand: f.brand ?? "", calories: f.calories, protein: f.protein, fats: f.fats, carbs: f.carbs, fiber: f.fiber, basis: "100g", source: "members", notes: "", reviewedAt: new Date().toISOString(), readyToEat: f.readyToEat, ...(f.icon ? { icon: f.icon } : {}), ...(f.serving ? { serving: f.serving } : {}) });
export const itemsOf = (r: Pick<SharedRecipe, "items">): Ingredient[] => r.items.map((i) => ({ id: i.id, grams: i.grams, locked: false, food: foodOf(i.food, `m-${i.id}`) }));

// The recipe at your portion: every food scaled by the same factor, to the nearest 5 g (at least 5 g)
export function portionOf(r: Pick<SharedRecipe, "items">, need: number | null) {
  const items = itemsOf(r);
  const whole = aggregate(items);
  const total = items.reduce((n, i) => n + i.grams, 0);
  const pd = density(whole.protein, whole.calories);
  if (!need || !whole.calories) return { factor: 1, items, grams: total, total, kcal: Math.round(whole.calories ?? 0), protein: Math.round(whole.protein ?? 0), pd };
  const factor = need / whole.calories;
  const scaled = items.map((i) => ({ ...i, grams: Math.max(5, Math.round((i.grams * factor) / 5) * 5) }));
  const t = aggregate(scaled);
  return { factor, items: scaled, grams: scaled.reduce((n, i) => n + i.grams, 0), total, kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0), pd };
}

// What Members shows you: no recipe with your declared allergies; at or above your PD target first, then your kitchens
export function membersFor<T extends Pick<SharedRecipe, "items" | "kitchen" | "sharedAt">>(list: T[], o: { target: number | null; kitchens: string[]; allergies: string[]; kitchen?: string | null }) {
  const safe = list.filter((r) => !itemsOf(r).some((i) => blockedByAllergy(i.food, o.allergies)));
  const shown = o.kitchen ? safe.filter((r) => r.kitchen === o.kitchen) : safe;
  const rank = (r: T) => {
    const pd = portionOf(r, null).pd;
    const ok = o.target === null || (pd !== null && pd >= o.target - 0.05);
    return (ok ? 0 : 2) + (r.kitchen && o.kitchens.includes(r.kitchen) ? 0 : 1);
  };
  return shown.map((r, k) => ({ r, k, rank: rank(r) })).sort((a, b) => a.rank - b.rank || a.k - b.k).map((x) => x.r);
}
