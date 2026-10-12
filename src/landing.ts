// The calculator on chefmealan.com (board HP, 12 October 2026): the same lift as the app, for a few fixed foods.
// Values per 100 g: peanut butter, vanilla ice cream, potato crisps, cheese pizza, tuna in water, roasted chicken breast,
// egg white, cottage cheese from USDA FoodData Central (SR Legacy); granola, chocolate spread, skyr, Greek yogurt (2 %)
// and whey powder from typical labels. Nothing is saved.
// A craving is sweet or savoury, and the foods offered next to it follow the app's pairing rule: a sweet craving gets
// dairy or whey, a savoury one gets tuna, chicken, egg whites or a yogurt dip, never skyr on a pizza.
export type DemoFood = { id: string; name: string; grams?: number; kcal: number; protein: number; amount?: string; alone?: string; kind: "sweet" | "savoury"; note?: string };
export const WANTS: DemoFood[] = [
  { id: "granola", name: "Granola", grams: 50, kcal: 450, protein: 9, kind: "sweet", amount: "50 g of granola", alone: "50 g of granola", note: "Granola looks healthy, but granola alone is mostly energy." },
  { id: "spread", name: "Chocolate spread", grams: 40, kcal: 539, protein: 6.3, kind: "sweet", amount: "40 g of chocolate spread", alone: "40 g of chocolate spread", note: "Chocolate spread alone is mostly sugar and fat." },
  { id: "peanut", name: "Peanut butter", grams: 30, kcal: 588, protein: 25.1, kind: "sweet", amount: "30 g of peanut butter", alone: "30 g of peanut butter", note: "Peanut butter has protein, but peanut butter alone is mostly fat." },
  { id: "icecream", name: "Ice cream", grams: 100, kcal: 207, protein: 3.5, kind: "sweet", amount: "100 g of ice cream", alone: "100 g of ice cream", note: "Ice cream alone is mostly sugar and fat." },
  { id: "pizza", name: "Pizza slice", grams: 120, kcal: 266, protein: 11.4, kind: "savoury", amount: "a 120 g slice of pizza", alone: "A slice of pizza, 120 g", note: "A slice of pizza alone is mostly dough and cheese." },
  { id: "crisps", name: "Crisps", grams: 30, kcal: 536, protein: 7, kind: "savoury", amount: "30 g of crisps", alone: "30 g of crisps", note: "Crisps alone are mostly fat and starch." },
];
export const HAVES: DemoFood[] = [
  { id: "skyr", name: "Skyr", kcal: 63, protein: 11, kind: "sweet" },
  { id: "yogurt", name: "Greek yogurt", kcal: 73, protein: 10, kind: "sweet" },
  { id: "cottage", name: "Cottage cheese", kcal: 98, protein: 11.1, kind: "sweet" },
  { id: "whey", name: "Whey powder", kcal: 380, protein: 78, kind: "sweet" },
  { id: "tuna", name: "Tuna", kcal: 116, protein: 25.5, kind: "savoury" },
  { id: "chicken", name: "Chicken breast", kcal: 165, protein: 31, kind: "savoury" },
  { id: "eggwhite", name: "Egg whites", kcal: 52, protein: 10.9, kind: "savoury" },
  { id: "dip", name: "Yogurt dip", kcal: 73, protein: 10, kind: "savoury" },
];
// the foods offered for a craving: the same kind
export const havesFor = (want: DemoFood) => HAVES.filter((h) => h.kind === want.kind);
// a line for a pair that is a known dish
export const PAIR_NOTES: Record<string, string> = { "pizza|tuna": "Pizza with tuna is a pizza tonno." };
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
// the craving on its own: its energy, protein and PD
export function alone(want: DemoFood) {
  const g = want.grams ?? 40, kcal = Math.round((want.kcal * g) / 100), protein = Math.round(((want.protein * g) / 100) * 10) / 10;
  return { kcal, protein, pd: Math.round((protein / kcal) * 1000) / 10 };
}
// when the bowl would be too big: the largest amount of the craving, in 5 g steps, whose partner stays within the bowl
export function smaller(want: DemoFood, have: DemoFood, pd: number) {
  for (let g = (want.grams ?? 40) - 5; g >= 5; g -= 5) { const r = lift({ ...want, grams: g }, have, pd); if (r.grams <= BIG_BOWL) return { ...r, partner: r.grams, grams: g }; }
  return null;
}
