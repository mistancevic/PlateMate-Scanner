import type { Ingredient } from "./pilot";
import { amountOf, plainName } from "./recipes";
import { countOf, countInStep } from "./counted";
import { potLine } from "./frying";

// Steps that carry the foods with their exact amounts (0.2.5+r16, canvas board S4, R13a to R13c, Milan 22:02: crafting
// steps with exact measurements from the food list is hard). A food in a step is kept as a token that names the food
// in the recipe, [[i:<item id>|<short name>]]; the amount is never typed, it is read from the recipe each time, so a
// changed weight changes every step that names the food. A step without tokens is plain text, as before.
export const TOKEN = /\[\[i:([^|\]]+)\|([^\]]*)\]\]/g;
export const shortName = (food: { name: string; brand?: string | null }) => plainName(food).split(",")[0].trim().toLowerCase();
export const tokenOf = (item: Ingredient) => `[[i:${item.id}|${shortName(item.food).replace(/[[\]|]/g, "")}]]`;
const amountFor = (id: string, name: string, items: Ingredient[]) => {
  const it = items.find((i) => i.id === id && i.grams > 0);
  if (!it) return name;
  // R3, the fix (0.2.39): a step is for cooking, so frying oil is the whole pot, as the recipe writes it
  if (it.fry) return potLine(it.fry, name, (g) => amountOf(g));
  // an egg or a banana is counted (0.2.24, board CT2): "2 eggs (L)"
  const c = countOf(it);
  return c ? countInStep(c, it.grams) : `${amountOf(it.grams)} ${name}`;
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

// A draft from Chef Mealan (0.2.10, canvas board CH, CH5): the foods are written {1}, {2} in the recipe's order and become the
// recipe's own food chips, so the amounts are the recipe's. The app checks the draft: three to eight steps, every food in a
// step, no number that is not a food, no amount typed in the words, no food from their library that is not in the recipe.
export type Draft = { ok: true; steps: string[] } | { ok: false; why: string };
export function fromDraft(draft: string[], items: Ingredient[], library: string[]): Draft {
  const steps = draft.map((x) => String(x).replace(/\s+/g, " ").trim()).filter(Boolean);
  if (steps.length < 3 || steps.length > 8) return { ok: false, why: `${steps.length} steps; it takes three to eight` };
  const used = new Set<number>();
  for (const st of steps) for (const m of st.matchAll(/\{(\d+)\}/g)) { const n = Number(m[1]); if (n < 1 || n > items.length) return { ok: false, why: `{${n}} is not a food of this recipe` }; used.add(n); }
  const missing = items.map((it, k) => (used.has(k + 1) ? null : it.food.name)).filter(Boolean);
  if (missing.length) return { ok: false, why: `no step names ${missing.join(", ").toLowerCase()}` };
  const words = steps.map((st) => st.replace(/\{\d+\}/g, " ")).join(" ");
  if (/\b\d+\s?(g|grams?|kg|ml)\b/i.test(words)) return { ok: false, why: "an amount is typed in the words; the recipe's amounts are the chips" };
  const mine = new Set(items.map((i) => shortName(i.food)));
  const lower = words.toLowerCase();
  const sneaked = library.map((n) => shortName({ name: n })).filter((n) => n.length >= 4 && !mine.has(n) && ![...mine].some((x) => x.includes(n) || n.includes(x)) && new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower));
  if (sneaked.length) return { ok: false, why: `${sneaked[0]} is not in this recipe` };
  return { ok: true, steps: steps.map((st) => st.replace(/\{(\d+)\}/g, (_, n: string) => tokenOf(items[Number(n) - 1]))) };
}
