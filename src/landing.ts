// The "Try it" part of chefmealan.com: the same lift as the app, for a few fixed foods.
// Values per 100 g: chocolate spread and crisps from typical labels, butter biscuits from a typical label,
// skyr, cottage cheese and Greek yogurt (2 %) from typical labels and USDA FoodData Central. Nothing is saved.
export type DemoFood = { id: string; name: string; grams?: number; kcal: number; protein: number; amount?: string; alone?: string };
export const WANTS: DemoFood[] = [
  { id: "spread", name: "Chocolate spread", grams: 40, kcal: 539, protein: 6.3, amount: "40 g of chocolate spread", alone: "chocolate spread has" },
  { id: "biscuits", name: "Butter biscuits", grams: 30, kcal: 470, protein: 7.5, amount: "30 g of butter biscuits", alone: "butter biscuits have" },
  { id: "croissant", name: "Croissant", grams: 60, kcal: 406, protein: 8.2, amount: "a 60 g croissant", alone: "a croissant has" },
];
export const HAVES: DemoFood[] = [
  { id: "skyr", name: "Skyr", kcal: 63, protein: 11 },
  { id: "cottage", name: "Cottage cheese", kcal: 98, protein: 11.1 },
  { id: "yogurt", name: "Greek yogurt", kcal: 73, protein: 10 },
];
// The page works for one goal only, Recomposition, the one most people pick (approved 6 October 2026).
// PD 6.5 is where Recomposition lands for typical adults: 6.3 for a man of 75 kg, 6.8 for a woman of 65 kg.
export const DEMO_GOAL = { name: "Recomposition", pd: 6.5 };
// a bowl bigger than this is not a sensible snack; the page then suggests less of what you crave
export const BIG_BOWL = 250;
// grams of the food you have, so that protein / kcal of the whole plate equals the target: (pA + pB x) / (kA + kB x) = T / 100
export function lift(want: DemoFood, have: DemoFood, pd: number) {
  const g = want.grams ?? 40;
  const kA = (want.kcal * g) / 100, pA = (want.protein * g) / 100;
  const t = pd / 100, kB = have.kcal / 100, pB = have.protein / 100;
  const raw = (t * kA - pA) / (pB - t * kB);
  const grams = Math.max(0, Math.round(raw / 5) * 5);
  const kcal = Math.round(kA + kB * grams), protein = Math.round((pA + pB * grams) * 10) / 10;
  return { grams, kcal, protein, pd: Math.round((protein / kcal) * 1000) / 10, total: g + grams };
}
// when the bowl would be too big: the largest amount of the craving, in 5 g steps, whose partner stays within the bowl
export function smaller(want: DemoFood, have: DemoFood, pd: number) {
  for (let g = (want.grams ?? 40) - 5; g >= 5; g -= 5) { const r = lift({ ...want, grams: g }, have, pd); if (r.grams <= BIG_BOWL) return { ...r, partner: r.grams, grams: g }; }
  return null;
}
