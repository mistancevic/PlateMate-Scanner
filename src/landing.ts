// The "Try it" part of chefmealan.com: the same lift as the app, for a few fixed foods.
// Values per 100 g: chocolate spread and crisps from typical labels, butter biscuits from a typical label,
// skyr, cottage cheese and Greek yogurt (2 %) from typical labels and USDA FoodData Central. Nothing is saved.
export type DemoFood = { id: string; name: string; grams?: number; kcal: number; protein: number };
export const WANTS: DemoFood[] = [
  { id: "spread", name: "Chocolate spread", grams: 40, kcal: 539, protein: 6.3 },
  { id: "crisps", name: "Crisps", grams: 30, kcal: 536, protein: 6.6 },
  { id: "biscuits", name: "Biscuits", grams: 30, kcal: 470, protein: 7.5 },
];
export const HAVES: DemoFood[] = [
  { id: "skyr", name: "Skyr", kcal: 63, protein: 11 },
  { id: "cottage", name: "Cottage cheese", kcal: 98, protein: 11.1 },
  { id: "yogurt", name: "Greek yogurt", kcal: 73, protein: 10 },
];
// a typical PD target for each goal, for the demo only; in the app the target is the person's own
export const GOALS = [
  { id: "fatloss", name: "Lose fat", pd: 7 },
  { id: "maintain", name: "Maintain", pd: 5.5 },
  { id: "gain", name: "Build muscle", pd: 5 },
];
// grams of the food you have, so that protein / kcal of the whole plate equals the target: (pA + pB x) / (kA + kB x) = T / 100
export function lift(want: DemoFood, have: DemoFood, pd: number) {
  const g = want.grams ?? 40;
  const kA = (want.kcal * g) / 100, pA = (want.protein * g) / 100;
  const t = pd / 100, kB = have.kcal / 100, pB = have.protein / 100;
  const raw = (t * kA - pA) / (pB - t * kB);
  const grams = Math.max(0, Math.round(raw / 5) * 5);
  const kcal = Math.round(kA + kB * grams), protein = Math.round((pA + pB * grams) * 10) / 10;
  return { grams, kcal, protein, pd: Math.round((protein / kcal) * 1000) / 10 };
}
