// Ranking replacements for one food on a plate. Pure code: the evals run it directly.
import { solveIngredient, type Ingredient, type Food } from "./pilot";
export type SwapOption = { f: Food; grams: number | null; fits: boolean };
const stem = (name: string) => name.toLowerCase().split(/[\s,(]+/).filter((w) => w.length >= 3)[0] ?? name.toLowerCase();
// A replacement never is, or contains, the food that's missing.
export const sameFood = (a: string, b: string) => { const s = stem(b); return a.toLowerCase().includes(s); };
// What a food does in a dish, from its name. Crude on purpose; the evals say when it needs more.
export type Role = "dairy" | "savoury" | "grain" | "sweet" | "fruit" | "nut" | "supplement" | "other";
const ROLES: [Role, RegExp][] = [
  ["supplement", /whey|protein ?powder|casein|proteinpulver/i],
  ["dairy", /skyr|quark|yog|joghurt|cottage|hüttenk|milk|milch|kefir|frischk|ricotta|cream cheese/i],
  ["savoury", /chicken|hähnchen|huhn|salmon|lachs|fish|fisch|tuna|thunfisch|beef|rind|pork|schwein|turkey|pute|\begg|\beier?\b|tofu|ham\b|schinken|steak/i],
  ["grain", /oat|hafer|rice|reis|bread|brot|pasta|nudel|müsli|muesli|granola|toast|cracker|knäcke/i],
  ["sweet", /nutella|honey|honig|ice ?cream|\beis\b|keks|biscuit|cookie|chocolate|schoko|jam|marmelade|sugar|zucker|syrup|sirup/i],
  ["fruit", /banana|banane|apple|apfel|berr|beere|fruit|frucht|mango|orange|pear|birne|grape|traube/i],
  ["nut", /almond|mandel|\bnut|nuss|peanut|erdnuss|cashew|walnut|pistach/i],
];
export const roleOf = (name: string): Role => ROLES.find(([, re]) => re.test(name))?.[0] ?? "other";
const NEAR: Partial<Record<Role, Role[]>> = { dairy: ["supplement"], supplement: ["dairy"], sweet: ["fruit"], fruit: ["sweet"], nut: ["sweet"] };
export function rankSwaps(items: Ingredient[], slotId: string, library: Food[], target: number, cap: number | null, missing?: string): SwapOption[] {
  const slot = items.find((i) => i.id === slotId); if (!slot) return [];
  const gone = missing ?? slot.food.name;
  const role = roleOf(slot.food.name);
  const sweetPlate = items.some((i) => i.id !== slotId && ["sweet", "fruit"].includes(roleOf(i.food.name)));
  // same role first, a near role next, anything else last; no savoury protein in a sweet dish
  const rank = (f: Food) => { const r = roleOf(f.name); return r === role ? 0 : NEAR[role]?.includes(r) ? 1 : 2; };
  return library
    .filter((f) => !items.some((i) => i.food.id === f.id))
    .filter((f) => !sameFood(f.name, gone))
    .filter((f) => !(sweetPlate && roleOf(f.name) === "savoury"))
    .map((f) => {
      const trial = items.map((i) => (i.id === slotId ? { ...i, food: { ...f, readyToEat: true }, locked: false } : { ...i, locked: true }));
      const r = solveIngredient(trial, slotId, target, null);
      const grams = r.ok ? r.grams : null;
      const fits = grams !== null && grams <= (cap ?? Infinity);
      return { f, grams, fits, rank: rank(f) };
    })
    .sort((a, b) => (a.fits !== b.fits ? (a.fits ? -1 : 1) : a.rank !== b.rank ? a.rank - b.rank : (a.grams ?? 1e9) - (b.grams ?? 1e9)))
    .map(({ f, grams, fits }) => ({ f, grams, fits }));
}
