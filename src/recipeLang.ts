// DT250 (0.3.99, board Stories185; Coach Milan 7 November 06:14 to 08:05, Go): a recipe in your language.
// c) both: a recipe that comes in from a link or a screenshot in another language than the app's is translated as it comes
// in, the original kept; an older one gets the offer on its page, and b) Start cooking asks once. Chef Mealan translates the
// name, the steps and the names of foods not in the food table, once, and the translation is kept with the recipe. Amounts,
// times and temperatures stay as written; each food in a step keeps its link to its row (the [[i:id|name]] tokens).
import type { Meal } from "./pilot";
import { textLang, type Lang } from "./lang";
import { TOKEN } from "./steps";

export type RecipeTr = { lang: Lang; from: Lang; title: string; steps: string[]; foods?: Record<string, string>; at: string; auto?: boolean; v?: number };
// 0.3.100 (Coach Milan 08:52, Go 08:54): version 2 translates the food names in the steps' tokens and the words around the numbers
// (8 minuta); a translation made before is offered again
export const TR_V = 2;
const current = (m: Meal, lang: Lang) => !!m.tr && m.tr.lang === lang && (m.tr.v ?? 1) >= TR_V;

// the words of a step, with each food's token read as its name
const plainStep = (s: string) => s.replace(TOKEN, (_m, _id, name) => name);
export const recipeLangOf = (m: Pick<Meal, "title" | "steps">): Lang => textLang([m.title, ...(m.steps ?? []).map(plainStep)].join(" "));

// the recipe as it shows in this language: its translation, unless the original is asked for
export function shownMeal(m: Meal, lang: Lang): Meal {
  const tr = m.tr;
  if (!tr || !current(m, lang) || m.trShow === "orig") return m;
  const steps = m.steps ?? [];
  const meta = m.stepPicMeta?.map((x, k) => (x && x.step === steps[k] && tr.steps[k] ? { ...x, step: tr.steps[k] } : x));
  return {
    ...m, title: tr.title || m.title, steps: tr.steps.length === steps.length ? tr.steps : steps,
    items: m.items.map((i) => (tr.foods?.[i.id] && !i.food.refId ? { ...i, food: { ...i.food, name: tr.foods[i.id] } } : i)),
    ...(meta ? { stepPicMeta: meta } : {}),
    // the foods the steps were written for, by the same names, so a renamed food is no changed food (0.3.100)
    ...(m.stepsFor ? { stepsFor: m.stepsFor.map((n) => { const it = m.items.find((i) => i.food.name === n && !i.food.refId && tr.foods?.[i.id]); return it ? tr.foods![it.id] : n; }) } : {}),
  };
}
export const showsTranslation = (m: Meal, lang: Lang) => current(m, lang) && m.trShow !== "orig";

// the language to offer a translation from: a recipe with steps, in another language than the app's, not translated into it
// yet and not kept as it is for this language; null when there is nothing to offer
export function offerFrom(m: Meal, lang: Lang): Lang | null {
  if (!m.steps?.length) return null;
  const from = recipeLangOf(m);
  if (from === lang || current(m, lang) || (m.trNo ?? []).includes(lang)) return null;
  return from;
}

// a translation keeps every step and every food's token; anything else is no translation
export function trProblems(orig: string[], out: string[]): string[] {
  if (out.length !== orig.length) return [`${out.length} steps for ${orig.length}`];
  const toks = (s: string) => [...s.matchAll(TOKEN)].map((m) => m[1]).sort().join("|");
  const nums = (s: string) => (plainStep(s).match(/\d+(?:[.,]\d+)?/g) ?? []).map((x) => x.replace(",", ".")).sort().join("|");
  return orig.flatMap((s, k) => [...(toks(s) !== toks(out[k]) ? [`step ${k + 1}: a food's link changed`] : []), ...(nums(s) !== nums(out[k]) ? [`step ${k + 1}: a number changed`] : [])]);
}

// a change made while the translation shows goes into the translation; the original stays as written
export function patchShown(m: Meal, lang: Lang, patch: Partial<Meal>): Partial<Meal> {
  if (!showsTranslation(m, lang) || (!("steps" in patch) && !("title" in patch))) return patch;
  const { steps, title, ...rest } = patch;
  const tr = { ...m.tr!, ...(steps ? { steps } : {}), ...(title ? { title } : {}) };
  return { ...rest, tr };
}
