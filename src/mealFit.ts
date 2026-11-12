// DT290 (0.3.144, board Stories217; found building DT287, Go 12 November 17:19): which meals a dish suits. Your choice on the
// recipe (Good for) wins; else where you ate or planned it; else Chef Mealan's starters; else its foods. Fill keeps to it.
import type { Feedback, Meal } from "./pilot";
import type { Planned, PlannedMeal } from "./planned";

export type MealKind = "breakfast" | "lunch" | "dinner" | "snack";
export const MEAL_KINDS: MealKind[] = ["breakfast", "lunch", "dinner", "snack"];
export function kindOfSlot(name: string | undefined | null): MealKind | null {
  const n = String(name ?? "").toLowerCase();
  return /breakfast|doručak|frühstück/.test(n) ? "breakfast" : /lunch|ručak|mittag/.test(n) ? "lunch" : /dinner|večer|abend/.test(n) ? "dinner" : /snack|užin|zwischen/.test(n) ? "snack" : null;
}
const STARTER_KINDS: Record<string, MealKind[]> = {
  "skyr bowl with berries": ["breakfast", "snack"], "oats, skyr and banana": ["breakfast"], "omelette with bread": ["breakfast", "lunch"], "protein pancakes": ["breakfast"],
  "cottage cheese and fruit": ["breakfast", "snack"], "chicken, rice and greens": ["lunch", "dinner"], "tuna salad wrap": ["lunch", "dinner"], sarma: ["lunch", "dinner"],
};
const MORNING = /oat|muesli|granola|skyr|quark|yog(h)?urt|cottage|egg|omelet|bread|toast|roll|banana|berr|apple|fruit|honey|jam|peanut butter|cereal|pancake|milk|jaj|hleb|ovs|jogurt|mleko|ei\b|eier|brot|haferflocken|müsli/i;
const MAIN = /rice|pasta|noodle|potato|chicken|turkey|beef|pork|lamb|mince|fish|salmon|tuna|cod|bean|lentil|chickpea|stew|curry|cabbage|pirinač|pirinac|krompir|piletin|meso|riba|pasulj|sočiv|kupus|reis|nudel|kartoffel|hähnchen|fleisch|fisch|bohne|linse/i;
// from its foods: grams of morning foods against grams of main-dish foods
export function kindsByFoods(m: Pick<PlannedMeal, "items" | "title">): MealKind[] | null {
  const items = m.items ?? []; if (!items.length) return null;
  let morning = 0, main = 0;
  for (const i of items) { const n = i.food.name; if (MAIN.test(n)) main += i.grams; else if (MORNING.test(n)) morning += i.grams; }
  if (!morning && !main) return null;
  return morning > main ? ["breakfast", "snack"] : ["lunch", "dinner"];
}
// where you ate or planned it: the meals of the day it went into
export function kindsByHistory(m: Pick<PlannedMeal, "mealId" | "title">, feedback: Feedback[], planned: Planned): Map<MealKind, number> {
  const out = new Map<MealKind, number>();
  const same = (id?: string, title?: string) => (m.mealId && id === m.mealId) || (title ?? "").trim().toLowerCase() === m.title.trim().toLowerCase();
  for (const f of feedback) { if (f.status !== "eaten" || !f.slot || !same(f.recipeId, f.meal.title)) continue; const k = kindOfSlot(f.slot.name ?? f.slot.slotId); if (k) out.set(k, (out.get(k) ?? 0) + 1); }
  for (const day of Object.values(planned)) for (const [slot, pm] of Object.entries(day)) { if (pm.skipped || !same(pm.mealId, pm.title)) continue; const k = kindOfSlot(slot); if (k) out.set(k, (out.get(k) ?? 0) + 1); }
  return out;
}
export type Suits = { kinds: MealKind[]; from: "yours" | "history" | "starter" | "foods"; usual?: MealKind };
export function suitsOf(m: PlannedMeal, recipe: Pick<Meal, "goodFor"> | null | undefined, feedback: Feedback[], planned: Planned): Suits | null {
  if (recipe?.goodFor?.length) return { kinds: recipe.goodFor as MealKind[], from: "yours" };
  const h = kindsByHistory(m, feedback, planned);
  if (h.size) { const usual = [...h.entries()].sort((a, b) => b[1] - a[1])[0]; return { kinds: [...h.keys()], from: "history", ...(usual[1] >= 2 ? { usual: usual[0] } : {}) }; }
  const st = STARTER_KINDS[m.title.trim().toLowerCase()]; if (m.source === "starter" && st) return { kinds: st, from: "starter" };
  const f = kindsByFoods(m); return f ? { kinds: f, from: "foods" } : null;
}
// in a slot of a kind the dish does not suit, it drops far back
export const suitPenalty = (s: Suits | null, slot: MealKind | null) => (s && slot && !s.kinds.includes(slot) ? 4 : 0);
