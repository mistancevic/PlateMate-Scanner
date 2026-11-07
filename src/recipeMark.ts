// DT202 (0.3.75, board Stories174; Coach Milan 1 November 17:48, 3 November 19:22 to 19:39, Go): a mark on each recipe. From the
// kitchen: cooked at least once, to the end of Eat (its first eaten card says when), or marked I cooked this when published.
// On paper: calculated from labels and food tables, not cooked yet.
import type { Feedback, Meal } from "./pilot";
import { cardsOfRecipe } from "./carry";
import { w, dateV } from "./words";
export type KitchenMark = { cooked: boolean; at: string | null };
export function kitchenMark(m: Pick<Meal, "id" | "title" | "cookedAt">, cards: Feedback[]): KitchenMark {
  const first = cardsOfRecipe(m, cards).map((f) => f.createdAt).sort()[0] ?? null;
  const at = [m.cookedAt, first].filter(Boolean).sort()[0] ?? null;
  return { cooked: Boolean(at), at };
}
// DT243 part two: the words live in src/i18n/en.json (recipe.mark*)
export const MARK_WORDS = { get cooked() { return w("recipe.markCooked"); }, get paper() { return w("recipe.markPaper"); } };
export const markWord = (k: { cooked: boolean }) => (k.cooked ? MARK_WORDS.cooked : MARK_WORDS.paper);
export const markLine = (k: KitchenMark) =>
  k.cooked ? (k.at ? w("recipe.markLineCookedOn", { date: dateV(new Date(k.at), { day: "numeric", month: "long" }) }) : w("recipe.markLineCooked"))
  : w("recipe.markLinePaper");
