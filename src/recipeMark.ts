// DT202 (0.3.75, board Stories174; Coach Milan 1 November 17:48, 3 November 19:22 to 19:39, Go): a mark on each recipe. From the
// kitchen: cooked at least once, to the end of Eat (its first eaten card says when), or marked I cooked this when published.
// On paper: calculated from labels and food tables, not cooked yet.
import type { Feedback, Meal } from "./pilot";
import { cardsOfRecipe } from "./carry";
export type KitchenMark = { cooked: boolean; at: string | null };
export function kitchenMark(m: Pick<Meal, "id" | "title" | "cookedAt">, cards: Feedback[]): KitchenMark {
  const first = cardsOfRecipe(m, cards).map((f) => f.createdAt).sort()[0] ?? null;
  const at = [m.cookedAt, first].filter(Boolean).sort()[0] ?? null;
  return { cooked: Boolean(at), at };
}
export const MARK_WORDS = { cooked: "From the kitchen", paper: "On paper" } as const;
export const markWord = (k: { cooked: boolean }) => (k.cooked ? MARK_WORDS.cooked : MARK_WORDS.paper);
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
export const markLine = (k: KitchenMark) =>
  k.cooked ? `Cooked${k.at ? ` first on ${day(k.at)}` : ""}, and weighed. The numbers come from labels and food tables.`
  : "Calculated from labels and food tables, not cooked yet. Cook it once, to the end of Eat, and it says From the kitchen.";
