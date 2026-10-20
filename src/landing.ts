// The calculator on chefmealan.com (board HP, 12 October 2026): the same lift as the app, for a few fixed foods.
// Values per 100 g: peanut butter, vanilla ice cream, potato crisps, cheese pizza, tuna in water, roasted chicken breast,
// egg white, cottage cheese from USDA FoodData Central (SR Legacy); granola, chocolate spread, skyr, Greek yogurt (2 %)
// and whey powder from typical labels. Nothing is saved.
// A craving is sweet or savoury, and the foods offered next to it follow the app's pairing rule: a sweet craving gets
// dairy or whey, a savoury one gets tuna, chicken, egg whites or a yogurt dip, never skyr on a pizza.
// HP68 (board Stories41, Milan 20 October 2026, 23:35): you pick a craving and a food you have, then set the weight of
// each with a stepper; the plate's kcal, protein and PD follow from the two weights. Milk 1.5% (47 kcal and 3.4 g protein
// per 100 ml, a typical label) is one of the foods you have, next to skyr. Milan 23:48: the page opens on a usual bowl,
// 30 g of granola with 200 ml of milk, PD 4.1; milk can't lift it to the goal, and the page names the foods that can.
export type DemoFood = { id: string; name: string; of?: string; unit?: "g" | "ml"; grams?: number; step?: number; min?: number; max?: number; kcal: number; protein: number; kind: "sweet" | "savoury"; note?: string };
export const WANTS: DemoFood[] = [
  { id: "granola", name: "Granola", of: "granola", grams: 30, step: 10, min: 20, max: 120, kcal: 450, protein: 9, kind: "sweet", note: "Granola looks healthy, but it brings many calories and little protein." },
  { id: "spread", name: "Chocolate spread", of: "chocolate spread", grams: 40, step: 10, min: 10, max: 80, kcal: 539, protein: 6.3, kind: "sweet", note: "Chocolate spread alone is mostly sugar and fat." },
  { id: "peanut", name: "Peanut butter", of: "peanut butter", grams: 30, step: 10, min: 10, max: 60, kcal: 588, protein: 25.1, kind: "sweet", note: "Peanut butter has protein, but peanut butter alone is mostly fat." },
  { id: "icecream", name: "Ice cream", of: "ice cream", grams: 100, step: 25, min: 50, max: 200, kcal: 207, protein: 3.5, kind: "sweet", note: "Ice cream alone is mostly sugar and fat." },
  { id: "pizza", name: "Pizza slice", of: "pizza", grams: 120, step: 30, min: 60, max: 240, kcal: 266, protein: 11.4, kind: "savoury", note: "Pizza alone is mostly dough and cheese." },
  { id: "crisps", name: "Crisps", of: "crisps", grams: 30, step: 10, min: 10, max: 100, kcal: 536, protein: 7, kind: "savoury", note: "Crisps alone are mostly fat and starch." },
];
// grams is the amount a page opens with for that food
export const HAVES: DemoFood[] = [
  { id: "milk", name: "Milk 1.5%", unit: "ml", grams: 200, step: 50, min: 50, max: 400, kcal: 47, protein: 3.4, kind: "sweet" },
  { id: "skyr", name: "Skyr", grams: 150, step: 25, min: 25, max: 300, kcal: 63, protein: 11, kind: "sweet" },
  { id: "yogurt", name: "Greek yogurt", grams: 150, step: 25, min: 25, max: 300, kcal: 73, protein: 10, kind: "sweet" },
  { id: "cottage", name: "Cottage cheese", grams: 150, step: 25, min: 25, max: 300, kcal: 98, protein: 11.1, kind: "sweet" },
  { id: "whey", name: "Whey powder", grams: 25, step: 5, min: 5, max: 60, kcal: 380, protein: 78, kind: "sweet" },
  { id: "tuna", name: "Tuna", grams: 80, step: 20, min: 20, max: 200, kcal: 116, protein: 25.5, kind: "savoury" },
  { id: "chicken", name: "Chicken breast", grams: 100, step: 25, min: 25, max: 250, kcal: 165, protein: 31, kind: "savoury" },
  { id: "eggwhite", name: "Egg whites", grams: 100, step: 25, min: 25, max: 250, kcal: 52, protein: 10.9, kind: "savoury" },
  { id: "dip", name: "Yogurt dip", grams: 100, step: 25, min: 25, max: 250, kcal: 73, protein: 10, kind: "savoury" },
];
export const unitOf = (f: DemoFood) => f.unit ?? "g";
// a food at a weight: kcal, protein, PD
export function part(f: DemoFood, g: number) {
  const kcal = Math.round((f.kcal * g) / 100), protein = Math.round(((f.protein * g) / 100) * 10) / 10;
  return { kcal, protein, pd: kcal ? Math.round((protein / kcal) * 1000) / 10 : 0 };
}
// the plate: the craving and the food you have, each at its weight
export function plate(want: DemoFood, wg: number, have: DemoFood, hg: number) {
  const kcal = Math.round((want.kcal * wg + have.kcal * hg) / 100), protein = Math.round(((want.protein * wg + have.protein * hg) / 100) * 10) / 10;
  return { kcal, protein, pd: Math.round((protein / kcal) * 1000) / 10, total: wg + hg };
}
// the foods offered for a craving: the same kind; a food whose own PD is under the goal (milk) can never lift a plate to it
export const havesFor = (want: DemoFood) => HAVES.filter((h) => h.kind === want.kind);
// a line for a pair that is a known dish
export const PAIR_NOTES: Record<string, string> = { "pizza|tuna": "Pizza with tuna is a pizza tonno." };
// The page works for one goal only, Recomposition, the one most people pick (approved 6 October 2026).
// PD 6.5 is where Recomposition lands for typical adults: 6.3 for a man of 75 kg, 6.8 for a woman of 65 kg.
export const DEMO_GOAL = { name: "Recomposition", pd: 6.5 };
// a bowl bigger than this is not a sensible snack; the page then suggests less of what you crave
export const BIG_BOWL = 250;
// grams of the food you have, so that protein / kcal of the whole plate equals the target: (pA + pB x) / (kA + kB x) = T / 100
export function lift(want: DemoFood, have: DemoFood, pd: number, g: number = want.grams ?? 40) {
  const kA = (want.kcal * g) / 100, pA = (want.protein * g) / 100;
  const t = pd / 100, kB = have.kcal / 100, pB = have.protein / 100;
  const raw = (t * kA - pA) / (pB - t * kB);
  // in 5 g steps, and to the gram under 20 g, where a 5 g step would miss the target (a spoon of whey)
  const grams = Math.max(0, raw < 20 ? Math.round(raw) : Math.round(raw / 5) * 5);
  const kcal = Math.round(kA + kB * grams), protein = Math.round((pA + pB * grams) * 10) / 10;
  return { grams, kcal, protein, pd: Math.round((protein / kcal) * 1000) / 10, total: g + grams };
}
// the craving on its own: its energy, protein and PD
export const alone = (want: DemoFood, g: number = want.grams ?? 40) => part(want, g);
// when the bowl would be too big: the largest amount of the craving, in 5 g steps, whose partner stays within the bowl
export function smaller(want: DemoFood, have: DemoFood, pd: number, from: number = want.grams ?? 40) {
  for (let g = from - 5; g >= 5; g -= 5) { const r = lift(want, have, pd, g); if (r.grams <= BIG_BOWL) return { ...r, partner: r.grams, grams: g }; }
  return null;
}
