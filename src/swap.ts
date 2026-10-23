// DT83 (Milan 23 October 2026, 16:49 and 20:00): a food swapped in a recipe takes the old one's place with an amount the
// person chooses: the same energy or the same weight, both with their grams. The same food in another state (cooked rice to
// raw rice) leads with the same energy, which is what the pot does; a different food leads with the same weight. Before
// saving, one line says what changed for one portion, and Undo takes the last change back.
import type { Food, Ingredient } from "./pilot";
import { aggregate, density } from "./pilot";

export type SwapWay = "energy" | "weight";
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const STATE = /\b(cooked|raw|boiled|drained|dry|dried|uncooked|steamed|baked|fried|grilled|roasted|canned|white|brown|gekocht|roh|kuvan[ao]?|sirov[ao]?|lean|fat)\b/g;
// the food's kind: the first word of its name without the state, "rice" in Rice, cooked and in Rice, white, raw
export const kindOf = (name: string) => fold(name).replace(/[(),.%\d]/g, " ").replace(STATE, " ").trim().split(/\s+/)[0] ?? "";
export const sameKind = (a: Pick<Food, "name">, b: Pick<Food, "name">) => { const k = kindOf(a.name); return k.length > 1 && k === kindOf(b.name); };

const round = (g: number) => (g >= 50 ? Math.round(g / 5) * 5 : Math.max(1, Math.round(g)));
export function swapGrams(old: Pick<Ingredient, "grams" | "food">, f: Pick<Food, "calories">, way: SwapWay): number {
  const a = old.food.calories ?? 0, b = f.calories ?? 0;
  return way === "energy" && a > 0 && b > 0 ? round((old.grams * a) / b) : old.grams;
}
// the two answers, the one that fits first; only the same weight when a food has no energy to match
export function swapChoices(old: Pick<Ingredient, "grams" | "food">, f: Pick<Food, "calories" | "name">): { way: SwapWay; grams: number }[] {
  const weight = { way: "weight" as const, grams: old.grams };
  if (!(old.food.calories! > 0) || !(f.calories! > 0)) return [weight];
  const energy = { way: "energy" as const, grams: swapGrams(old, f, "energy") };
  return sameKind(old.food, f) ? [energy, weight] : [weight, energy];
}

const g = (n: number) => `${Math.round(n).toLocaleString("en-US")} g`;
// what changed between the recipe as saved and as edited, for one portion; null when nothing did
export function changeOf(before: Ingredient[], after: Ingredient[], serves: number) {
  const on = (l: Ingredient[]) => l.filter((i) => i.grams > 0);
  const b = on(before), a = on(after), key = (i: Ingredient) => i.food.id;
  const out = b.filter((x) => !a.some((y) => key(y) === key(x))).map((x) => `${x.food.name}, ${g(x.grams)}`);
  const inn = a.filter((x) => !b.some((y) => key(y) === key(x))).map((x) => `${x.food.name}, ${g(x.grams)}`);
  const moved = a.filter((x) => b.some((y) => key(y) === key(x) && Math.round(y.grams) !== Math.round(x.grams))).map((x) => `${x.food.name}, ${g(b.find((y) => key(y) === key(x))!.grams)} to ${g(x.grams)}`);
  if (!out.length && !inn.length && !moved.length) return null;
  const n = Math.max(1, serves), sb = aggregate(b), sa = aggregate(a);
  const kcal: [number, number] = [sb.calories / n, sa.calories / n], protein: [number, number] = [sb.protein / n, sa.protein / n];
  const pd: [number | null, number | null] = [density(sb.protein, sb.calories), density(sa.protein, sa.calories)];
  return { out, in: inn, moved, kcal, protein, pd, big: kcal[0] > 0 && Math.abs(kcal[1] - kcal[0]) / kcal[0] > 0.2 };
}
