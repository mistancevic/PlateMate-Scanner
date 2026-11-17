// Quick picks for the plate: favourites first, then what this person has actually used lately.
import type { Food, Feedback } from "./pilot";
import { isIngredient } from "./mixtip";
export const QUICK_MAX = 8;
const WINDOW_DAYS = 42;
export function usageCounts(feedback: Feedback[], now = Date.now()): Map<string, number> {
  const counts = new Map<string, number>();
  for (const f of feedback) {
    if (now - Date.parse(f.createdAt) > WINDOW_DAYS * 86_400_000) continue;
    for (const i of f.meal.items) counts.set(i.food.id, (counts.get(i.food.id) ?? 0) + 1);
  }
  return counts;
}
export function quickPicks(foods0: Food[], feedback: Feedback[], now = Date.now()): { picks: Food[]; why: Map<string, "favourite" | "often" | "new"> } {
  // C6 (DT103, 0.2.91): quick picks are foods you eat as they are; an ingredient (yeast, flour, oil) stays in the list and the search
  const foods = foods0.filter((f) => !isIngredient(f));
  const used = usageCounts(feedback, now);
  const why = new Map<string, "favourite" | "often" | "new">();
  const favs = foods.filter((f) => f.favorite).sort((a, b) => (used.get(b.id) ?? 0) - (used.get(a.id) ?? 0) || a.name.localeCompare(b.name));
  favs.forEach((f) => why.set(f.id, "favourite"));
  const often = foods.filter((f) => !f.favorite && (used.get(f.id) ?? 0) > 0).sort((a, b) => (used.get(b.id) ?? 0) - (used.get(a.id) ?? 0));
  often.forEach((f) => why.set(f.id, "often"));
  // before there's any history: the library's own order, newest first, so the starter foods or the latest scans show
  const rest = foods.filter((f) => !why.has(f.id));
  rest.forEach((f) => why.set(f.id, "new"));
  return { picks: [...favs, ...often, ...rest].slice(0, QUICK_MAX), why };
}

// DT308 (0.3.154, board Stories236; Coach Milan 17 November 02:02): on an empty plate the list shows three of your foods for each
// macro, so its end is always in reach. A food belongs to the macro that gives most of its energy. Within a macro: favourites,
// then the most used, then the library's own order. Ingredients (yeast, flour, oil to cook with) stay out, as in quick picks.
export type MacroKey = "protein" | "carbs" | "fat";
export const MACRO_EACH = 3;
export function macroOf(f: Pick<Food, "protein" | "carbs" | "fats">): MacroKey {
  const p = (f.protein ?? 0) * 4, c = (f.carbs ?? 0) * 4, fa = (f.fats ?? 0) * 9;
  return p >= c && p >= fa ? "protein" : c >= fa ? "carbs" : "fat";
}
export function macroPicks(foods0: Food[], feedback: Feedback[], now = Date.now()): { key: MacroKey; foods: Food[] }[] {
  const foods = foods0.filter((f) => !isIngredient(f));
  const used = usageCounts(feedback, now);
  const rank = (f: Food) => (f.favorite ? 1e6 : 0) + (used.get(f.id) ?? 0);
  return (["protein", "carbs", "fat"] as MacroKey[]).map((key) => ({ key, foods: foods.map((f, i) => ({ f, i })).filter((x) => macroOf(x.f) === key).sort((a, b) => rank(b.f) - rank(a.f) || a.i - b.i).slice(0, MACRO_EACH).map((x) => x.f) })).filter((g) => g.foods.length > 0);
}
