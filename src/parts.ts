import { decodeEntities } from "./entities";
// Dishes in parts, and optional foods inside them (0.2.19, canvas boards IM, IM12 to IM14, and IM15 to IM18; Milan 17 October
// 2026, 10:32 to 11:26). A part is a name on a food: Base, Filling, Topping; a bowl's Rice, Chicken, Toppings. Parts come from
// the recipe as read, from the person (Parts on the plate, Edit recipe), never invented by code. Rules the code keeps:
// - every part scales by the same factor, so the dish holds together;
// - an optional food stays out of the numbers until added; added, it is a food like any other;
// - Change works inside one part: every food outside it stays as it was;
// - Leave it out takes a whole part with its numbers; every part can go but the last one.
import type { Food, Ingredient, PlateOpt } from "./pilot";
import type { Changed } from "./recipeIn";
import { checkChange, roundGrams } from "./recipeIn";

export const cleanPart = (x: unknown): string => { const t = decodeEntities(String(x ?? "")).replace(/\s+/g, " ").trim().replace(/^(for the|for|the)\s+/i, "").replace(/[:.]+$/, "").trim().slice(0, 30); return t ? t.charAt(0).toUpperCase() + t.slice(1) : ""; };
// the parts in the order they first come: the plate's foods, then its optional foods, then the parts left out
export function partsOf(items: { part?: string }[], opts: { part?: string }[] = [], leftOut: { part: string }[] = []): string[] {
  const out: string[] = [];
  for (const x of [...items, ...opts, ...leftOut]) if (x.part && !out.includes(x.part)) out.push(x.part);
  return out;
}
// a food kept with a recipe carries no photo: the photos live in the photo store, by food
export const leanFood = (f: Food): Food => { const { photo: _p, photos: _ps, ...rest } = f as Food & { photos?: unknown }; return rest as Food; };
// the recipe's optional foods at this plate's portion: the recipe's grams times the factor the plate uses
export const optAt = (list: { name: string; written?: string; note?: string; grams: number; food: Food; part?: string }[] | undefined, factor: number, id: () => string): PlateOpt[] =>
  (list ?? []).map((o) => ({ id: id(), name: o.name, ...(o.written ? { written: o.written } : {}), ...(o.note ? { note: o.note } : {}), grams: roundGrams(o.grams * factor), food: o.food, ...(o.part ? { part: o.part } : {}) }));
// + Add (IM12b): the optional food becomes a food on the plate; Leave it out (on that food) sends it back
export const optToItem = (o: PlateOpt): Ingredient => ({ id: o.id, food: o.food, grams: o.grams, locked: false, ...(o.part ? { part: o.part } : {}), optional: { ...(o.written ? { written: o.written } : {}), ...(o.note ? { note: o.note } : {}) } });
export const itemToOpt = (i: Ingredient): PlateOpt => ({ id: i.id, name: i.food.name, ...(i.optional?.written ? { written: i.optional.written } : {}), ...(i.optional?.note ? { note: i.optional.note } : {}), grams: i.grams, food: i.food, ...(i.part ? { part: i.part } : {}) });
// Leave it out on a part (IM16b): every part can go but the last one with foods on the plate
export const canLeaveOut = (items: { part?: string }[], part: string) => partsOf(items).filter((x) => x !== part).length > 0 && items.some((i) => i.part === part);
// Change on one part (IM16): the foods outside the part stay exactly as they were, the foods inside keep their jobs (IM5)
export function checkPart(original: { name: string; grams: number; part?: string; role?: string }[], next: Changed[], part: string): string | null {
  for (const o of original.filter((x) => x.part !== part)) {
    const same = next.find((x) => x.name.toLowerCase() === o.name.toLowerCase());
    if (!same || same.change !== "same" || Math.abs(same.grams - o.grams) > Math.max(1, o.grams * 0.02)) return `${o.name} is not in the ${part.toLowerCase()}: it stays as it is.`;
  }
  const inside = original.filter((x) => x.part === part).map((x) => ({ name: x.name, role: (x.role ?? "other") as any }));
  const outsideNames = new Set(original.filter((x) => x.part !== part).map((x) => x.name.toLowerCase()));
  return checkChange(inside, next.filter((x) => !outsideNames.has(x.name.toLowerCase())));
}
