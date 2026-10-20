// The calculator on chefmealan.com (board HP, 12 October 2026): the same lift as the app, for a few fixed foods.
// Values per 100 g: peanut butter, vanilla ice cream, potato crisps, cheese pizza, tuna in water, roasted chicken breast,
// egg white, cottage cheese from USDA FoodData Central (SR Legacy); granola, chocolate spread, skyr, Greek yogurt (2 %)
// and whey powder from typical labels. Nothing is saved.
// A craving is sweet or savoury, and the foods offered next to it follow the app's pairing rule: a sweet craving gets
// dairy or whey, a savoury one gets tuna, chicken, egg whites or a yogurt dip, never skyr on a pizza.
// HP68 (board Stories41, Milan 20 October 2026): granola comes with milk 1.5% (47 kcal and 3.4 g protein per 100 ml,
// a typical label), the same bowl as page 8 of Worthy Numbers: 60 g with 200 ml is PD 3.4. Every craving has a stepper
// for its grams, and granola one more for the milk.
export type Milk = { name: string; ml: number; kcal: number; protein: number; step: number; max: number };
export type DemoFood = { id: string; name: string; of?: string; grams?: number; step?: number; min?: number; max?: number; milk?: Milk; kcal: number; protein: number; kind: "sweet" | "savoury"; note?: string };
export const MILK: Milk = { name: "milk 1.5%", ml: 200, kcal: 47, protein: 3.4, step: 50, max: 300 };
export const WANTS: DemoFood[] = [
  { id: "granola", name: "Granola with milk", of: "granola", grams: 60, step: 10, min: 30, max: 100, milk: MILK, kcal: 450, protein: 9, kind: "sweet", note: "Granola with milk looks like a good breakfast, but the bowl is mostly energy." },
  { id: "spread", name: "Chocolate spread", of: "chocolate spread", grams: 40, step: 10, min: 20, max: 80, kcal: 539, protein: 6.3, kind: "sweet", note: "Chocolate spread alone is mostly sugar and fat." },
  { id: "peanut", name: "Peanut butter", of: "peanut butter", grams: 30, step: 10, min: 20, max: 60, kcal: 588, protein: 25.1, kind: "sweet", note: "Peanut butter has protein, but peanut butter alone is mostly fat." },
  { id: "icecream", name: "Ice cream", of: "ice cream", grams: 100, step: 25, min: 50, max: 200, kcal: 207, protein: 3.5, kind: "sweet", note: "Ice cream alone is mostly sugar and fat." },
  { id: "pizza", name: "Pizza slice", of: "pizza", grams: 120, step: 30, min: 60, max: 240, kcal: 266, protein: 11.4, kind: "savoury", note: "Pizza alone is mostly dough and cheese." },
  { id: "crisps", name: "Crisps", of: "crisps", grams: 30, step: 10, min: 20, max: 100, kcal: 536, protein: 7, kind: "savoury", note: "Crisps alone are mostly fat and starch." },
];
// how much of the craving: grams, and millilitres of milk where the craving comes with milk
export type Amounts = { grams: number; ml: number };
export const startAmounts = (w: DemoFood): Amounts => ({ grams: w.grams ?? 40, ml: w.milk?.ml ?? 0 });
// the craving in words: "60 g of granola with 200 ml of milk 1.5%"
export const describe = (w: DemoFood, a: Amounts = startAmounts(w)) => `${a.grams} g of ${w.of ?? w.name.toLowerCase()}${w.milk && a.ml > 0 ? ` with ${a.ml} ml of ${w.milk.name}` : ""}`;
// energy and protein of the craving as you have it
function base(w: DemoFood, a: Amounts) {
  const m = w.milk && a.ml > 0 ? w.milk : null;
  return { kA: (w.kcal * a.grams) / 100 + (m ? (m.kcal * a.ml) / 100 : 0), pA: (w.protein * a.grams) / 100 + (m ? (m.protein * a.ml) / 100 : 0) };
}
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
export function lift(want: DemoFood, have: DemoFood, pd: number, a: Amounts = startAmounts(want)) {
  const { kA, pA } = base(want, a);
  const t = pd / 100, kB = have.kcal / 100, pB = have.protein / 100;
  const raw = (t * kA - pA) / (pB - t * kB);
  // in 5 g steps, and to the gram under 20 g, where a 5 g step would miss the target (a spoon of whey)
  const grams = Math.max(0, raw < 20 ? Math.round(raw) : Math.round(raw / 5) * 5);
  const kcal = Math.round(kA + kB * grams), protein = Math.round((pA + pB * grams) * 10) / 10;
  return { grams, kcal, protein, pd: Math.round((protein / kcal) * 1000) / 10, total: a.grams + a.ml + grams };
}
// the craving on its own: its energy, protein and PD
export function alone(want: DemoFood, a: Amounts = startAmounts(want)) {
  const { kA, pA } = base(want, a), kcal = Math.round(kA), protein = Math.round(pA * 10) / 10;
  return { kcal, protein, pd: Math.round((protein / kcal) * 1000) / 10 };
}
// when the bowl would be too big: the largest amount of the craving, in 5 g steps, whose partner stays within the bowl
export function smaller(want: DemoFood, have: DemoFood, pd: number, a: Amounts = startAmounts(want)) {
  for (let g = a.grams - 5; g >= 5; g -= 5) { const r = lift(want, have, pd, { ...a, grams: g }); if (r.grams <= BIG_BOWL) return { ...r, partner: r.grams, grams: g }; }
  return null;
}
