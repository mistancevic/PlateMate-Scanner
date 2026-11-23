// B160 (0.3.187, board Stories287; Go 23 November 2026, 20:03): a recipe changed after a meal was logged from it. Every logged
// meal keeps its own foods: that record is what was eaten. Saving a change to the recipe's foods asks once, for all the meals
// from it logged today or yesterday (Coach Milan 20:03: once for all), whether they were made this way: Update gives each the
// recipe's new foods at the share it had of the recipe; Keep leaves them. Older meals are not asked; the save says how many
// keep their foods.
import { uid, type Feedback, type Ingredient, type Meal } from "./pilot";
import { cardsOfRecipe } from "./carry";
import { dateText } from "./words";

const DAY = 864e5;
// midnight of yesterday on the phone's clock
export const askFrom = (now = new Date()) => { const d = new Date(now.getTime() - DAY); d.setHours(0, 0, 0, 0); return d.getTime(); };
const sig = (its: Ingredient[]) => JSON.stringify(its.filter((i) => i.grams > 0).map((i) => [i.food.id, Math.round(i.grams)]).sort());
export const foodsChanged = (before: Ingredient[], after: Ingredient[]) => sig(before) !== sig(after);
// the meals eaten from the recipe: those to ask about, and how many older ones keep their foods
export function mealsOf(meal: Pick<Meal, "id" | "title">, cards: Feedback[], now = new Date(), except?: string): { recent: Feedback[]; older: number } {
  const all = cardsOfRecipe(meal, cards).filter((f) => f.id !== except), from = askFrom(now);
  const recent = all.filter((f) => Date.parse(f.createdAt) >= from).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  return { recent, older: all.length - recent.length };
}
const weight = (its: Ingredient[]) => its.reduce((n, i) => n + (i.grams > 0 ? i.grams : 0), 0);
// the meal at the same share of the changed recipe: its grams over the recipe's grams before the change; each food to the gram
export function followed(f: Feedback, before: Ingredient[], after: Ingredient[]): Ingredient[] {
  const share = weight(before) > 0 ? weight(f.meal.items) / weight(before) : 0;
  return after.filter((i) => i.grams > 0).map((i) => ({ ...i, id: uid(), locked: false, grams: Math.max(1, Math.round(i.grams * share)) }));
}
// the meal as the recipe's list of cooks says it: Monday 23 November, 18:00
export const whenOf = (f: Pick<Feedback, "createdAt">) => { const at = new Date(f.createdAt); return `${dateText(at, { weekday: "long", day: "numeric", month: "long" })}, ${at.toTimeString().slice(0, 5)}`; };
export const whenAll = (fs: Feedback[], and: string) => { const ws = fs.map(whenOf); return ws.length <= 1 ? ws.join("") : `${ws.slice(0, -1).join(", ")} ${and} ${ws[ws.length - 1]}`; };
// a change waiting from the Plate (Update my recipe there): asked when the recipe's page opens next, on this phone
export type RecipeAsk = { recipeId: string; before: Ingredient[]; ids: string[] };
const KEY = "chefmealan-recipe-ask";
export const getRecipeAsk = (): RecipeAsk | null => { try { const a = JSON.parse(localStorage.getItem(KEY) || "null"); return a && typeof a.recipeId === "string" && Array.isArray(a.ids) && Array.isArray(a.before) ? a : null; } catch { return null; } };
export const setRecipeAsk = (a: RecipeAsk | null) => { try { if (a) localStorage.setItem(KEY, JSON.stringify(a)); else localStorage.removeItem(KEY); } catch { /* this visit only */ } };
