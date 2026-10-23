import type { Meal, PublishDraft } from "./pilot";
import { plainName } from "./recipes";
import { sameKind } from "./swap";
type Published = { items?: { name: string }[] } | null;
// A name kept for the page belongs to its food, not to its place in the list (Milan 23 October 23:27: Sarma's live page
// still said Rice, cooked after rice was swapped for oats, because the swap kept the row's place). A name saved with its
// food's id counts only for that food; an older name without ids counts only while it still names the same food.
const fold = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
export const nameFits = (name: string | undefined, food: { name: string; brand?: string | null }): boolean => {
  if (!name) return false;
  const a = fold(name), b = fold(plainName(food)), c = fold(food.name);
  if (!a) return false;
  if (a === b || a === c || b.startsWith(a + " ") || a.startsWith(b + " ") || c.startsWith(a + " ")) return true;
  // a name the person wrote for the same food (White cabbage for Cabbage, raw), as long as it names no other state of it
  const states = (x: string) => x.split(" ").filter((w) => STATES.has(w));
  return sameKind({ name }, food) && states(a).every((w) => states(c).includes(w));
};
const STATES = new Set(["cooked", "raw", "boiled", "drained", "dried", "dry", "steamed", "baked", "fried", "grilled", "roasted", "canned", "gekocht", "roh", "kuvan", "kuvana", "kuvano", "sirov", "sirova", "sirovo"]);
export function keptName(meal: Meal, k: number, d: PublishDraft, published: Published): string {
  const i = meal.items[k];
  if (d.names?.[k] && (d.nameIds ? d.nameIds[k] === i.food.id : nameFits(d.names[k], i.food))) return d.names[k];
  const live = published?.items?.[k]?.name;
  if (live && nameFits(live, i.food)) return live;
  return plainName(i.food);
}
