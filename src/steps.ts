import type { Ingredient } from "./pilot";
import { amountOf, plainName } from "./recipes";

// Steps that carry the foods with their exact amounts (0.2.5+r16, canvas board S4, R13a to R13c, Milan 22:02: crafting
// steps with exact measurements from the food list is hard). A food in a step is kept as a token that names the food
// in the recipe, [[i:<item id>|<short name>]]; the amount is never typed, it is read from the recipe each time, so a
// changed weight changes every step that names the food. A step without tokens is plain text, as before.
export const TOKEN = /\[\[i:([^|\]]+)\|([^\]]*)\]\]/g;
export const shortName = (food: { name: string; brand?: string | null }) => plainName(food).split(",")[0].trim().toLowerCase();
export const tokenOf = (item: Ingredient) => `[[i:${item.id}|${shortName(item.food).replace(/[[\]|]/g, "")}]]`;
const amountFor = (id: string, name: string, items: Ingredient[]) => {
  const it = items.find((i) => i.id === id && i.grams > 0);
  return it ? `${amountOf(it.grams)} ${name}` : name;
};
export type StepPart = { text: string } | { id: string; name: string; label: string; gone: boolean };
// a step in parts: the words, and the foods with their amounts now
export function stepParts(step: string, items: Ingredient[]): StepPart[] {
  const out: StepPart[] = [];
  let at = 0;
  for (const m of step.matchAll(TOKEN)) {
    if (m.index! > at) out.push({ text: step.slice(at, m.index) });
    const gone = !items.some((i) => i.id === m[1] && i.grams > 0);
    out.push({ id: m[1], name: m[2], label: amountFor(m[1], m[2], items), gone });
    at = m.index! + m[0].length;
  }
  if (at < step.length) out.push({ text: step.slice(at) });
  return out;
}
// a step as it reads: on the page, in the images, on the Plate
export const stepText = (step: string, items: Ingredient[]) => step.replace(TOKEN, (_, id: string, name: string) => amountFor(id, name, items)).replace(/\s+/g, " ").trim();
export const usedIds = (steps: string[]) => new Set(steps.flatMap((s) => [...s.matchAll(TOKEN)].map((m) => m[1])));
export const hasTokens = (steps: string[]) => steps.some((s) => new RegExp(TOKEN.source).test(s));
// the foods of the recipe that no step names yet, once any step names a food
export const missingFoods = (steps: string[], items: Ingredient[]) => {
  if (!hasTokens(steps)) return [];
  const used = usedIds(steps);
  return items.filter((i) => i.grams > 0 && !used.has(i.id));
};
