// What a food is, by its job on a plate. A property of the food, never a verdict: that depends on the day (see todayLine).
import { englishName } from "./foodId";
import { density, type Food } from "./pilot";
import { roleOf } from "./swaps";
import { kindOf, gramsOfOne } from "./counted";
export const JOBS = ["Protein base", "Flavour food", "Carb base", "Fat source", "Volume food", "Drink", "Mixed"] as const;
export type Job = (typeof JOBS)[number];
const SPREAD = /nutella|spread|aufstrich|creme|crème|butter|peanut ?butter|erdnussmus|nussmus|honig|honey|jam|marmelade|konfit/i;
const DRINK = /drink|juice|saft|milk\b|milch\b|cola|soda|tea\b|tee\b|coffee|kaffee|smoothie|shake|wasser|water|bier|beer|wein|wine/i;
export function jobOf(f: Food): { job: Job; note: string; taste: "sweet" | "savoury" | null; mine: boolean } {
  // DT125 (0.2.104): the job comes from what the food is, by its English name, never from a name in another language
  // (Thunfisch in Wasser read as a Drink because of Wasser)
  const name = englishName(f);
  const role = roleOf(name);
  const sugarsLine = f.table?.find((r) => r.key === "sugars")?.amount ?? null;
  const taste = role === "sweet" || role === "fruit" ? "sweet" : role === "savoury" ? "savoury" : sugarsLine !== null && sugarsLine >= 25 ? "sweet" : null;
  if (f.job && (JOBS as readonly string[]).includes(f.job)) return { job: f.job as Job, note: SPREAD.test(name) ? "spread" : "", taste, mine: true };
  const kcal = f.calories ?? 0, pd = density(f.protein, f.calories) ?? 0;
  const fat = kcal ? ((f.fats ?? 0) * 9) / kcal : 0, carb = kcal ? ((f.carbs ?? 0) * 4) / kcal : 0;
  const sugars = f.table?.find((r) => r.key === "sugars")?.amount ?? null;
  const spread = SPREAD.test(name);
  let job: Job;
  if ((f.basis as string) === "100ml" || (DRINK.test(name) && kcal < 120)) job = "Drink";
  else if (pd >= 8) job = "Protein base";
  else if (kcal > 0 && kcal < 60) job = "Volume food";
  else if (pd < 3 && (role === "sweet" || spread || (sugars !== null && sugars >= 25))) job = "Flavour food";
  else if (fat >= 0.55) job = "Fat source";
  else if (carb >= 0.6 && pd < 5) job = "Carb base";
  else job = "Mixed";
  return { job, note: spread && job === "Flavour food" ? "spread" : "", taste, mine: false };
}
// A typical portion by job, for the plain line. A starting point, not advice: the solver sets real amounts.
export const PORTION: Record<Job, number> = { "Protein base": 150, "Flavour food": 20, "Carb base": 80, "Fat source": 20, "Volume food": 150, "Drink": 250, "Mixed": 100 };
// The least a moved food can be and still be a portion: a plate reaches the target, it never reaches it with 8 g of chicken.
export const MIN_PORTION: Record<Job, number> = { "Protein base": 80, "Flavour food": 10, "Carb base": 50, "Fat source": 5, "Volume food": 50, "Drink": 100, "Mixed": 50 };
export const minPortionOf = (f: Food) => (roleOf(f.name) === "supplement" ? 20 : MIN_PORTION[jobOf(f).job]);
export function plainLine(f: Food, target: number | null): string {
  const { job } = jobOf(f);
  const pd = density(f.protein, f.calories);
  const g = PORTION[job];
  const kcal = f.calories == null ? null : Math.round((f.calories * g) / 100);
  const prot = f.protein == null ? null : Math.round((f.protein * g) / 10) / 10;
  const portion = kcal == null ? "" : ` ${g} g is ${kcal} kcal${prot != null ? ` and ${prot} g protein` : ""}.`;
  if (pd == null || target == null) return portion.trim();
  const fits = pd >= target;
  const what = job === "Flavour food" ? "It brings the taste; let a protein base carry the plate." : job === "Protein base" ? "It can carry a plate on its own." : fits ? "It fits on its own." : "Pair it with a protein base to reach your target.";
  return `PD ${pd.toFixed(1)}, ${fits ? "on" : "below"} your ${target.toFixed(1)}. ${what}${portion}`;
}
// Today, for this person: computed fresh every time, never stored.
export function todayLine(f: Food, dayKcal: number | null, eatenKcal: number, dayName: string): string | null {
  if (dayKcal == null || f.calories == null) return null;
  const { job } = jobOf(f);
  // a counted food's portion is one serving; the line says so in the pack's own word
  const grams = f.serving ? f.serving.grams : PORTION[job];
  const portion = f.serving ? `1 ${f.serving.name} (${f.serving.grams} g)` : `A ${PORTION[job]} g portion`;
  const portionKcal = Math.round((f.calories * grams) / 100);
  const left = Math.round(dayKcal - eatenKcal);
  const so = eatenKcal > 0 ? `${Math.round(eatenKcal).toLocaleString("en")} of ${Math.round(dayKcal).toLocaleString("en")} kcal so far today` : `${Math.round(dayKcal).toLocaleString("en")} kcal planned, nothing logged yet`;
  if (left <= 0) return `${dayName}: ${so}. Not today.`;
  if (portionKcal > left) return `${dayName}: ${so}. ${portion} is more than the ${left} kcal left.`;
  return `${dayName}: ${so}. ${portion} fits.`;
}

// DT93 (0.2.88, board Stories60; Milan 24 October 13:58): a normal portion of a food, by its name first, else by its job.
// Code holds these, not the AI. Fit never moves a food past its range, and a food outside it gets a line under it.
// A counted food (a bar, an egg) goes by its piece: one to three pieces.
const NAMED: [RegExp, [number, number], string][] = [
  // 0.2.115: a salad is a salad by its name, dressed or not; its oil made it read as a fat source (5 to 40 g)
  [/\b(salad|salat|salata)\b/i, [50, 300], ""],
  [/\byeast\b|hefe/i, [3, 10], "A dough uses 5 to 10 g."],
  [/\b(baking powder|baking soda|backpulver|natron)\b/i, [2, 10], ""],
  [/\b(salt|salz|pepper|pfeffer)\b/i, [1, 5], ""],
  [/\b(protein|whey|casein) ?(powder|pulver)\b|\bwhey\b|\bcasein\b/i, [20, 40], "One scoop is about 30 g."],
  [/peanut ?butter|erdnussmus|nussmus|almond butter|tahini|nutella|spread|aufstrich/i, [15, 40], ""],
  [/\b(honey|honig|jam|marmelade|maple|sirup|syrup|sugar|zucker)\b/i, [5, 30], ""],
  [/\b(oil|öl|butter|ghee|lard|schmalz)\b/i, [5, 25], ""],
  [/\b(nuts?|almonds?|walnuts?|cashews?|hazelnuts?|pistachios?|seeds?|nüsse|mandeln)\b/i, [15, 50], "A handful is about 30 g."],
  [/\b(parmesan|feta|cheddar|gouda|mozzarella|cheese|käse)\b/i, [20, 80], ""],
  [/\b(chocolate|schokolade)\b/i, [10, 40], ""],
  [/\b(cookie|keks|biscuit|cracker)\b/i, [15, 60], ""],
  [/\b(chicken|turkey|beef|pork|lamb|veal|steak|mince|salmon|tuna|cod|fish|trout|breast|thigh|tofu|tempeh)\b/i, [80, 300], ""],
  [/\b(egg|eggs|eier)\b/i, [50, 200], ""],
  [/\b(rice|reis|bulgur|couscous|quinoa|pasta|penne|spaghetti|noodles?|nudeln)\b.*\b(cooked|boiled|gekocht)\b/i, [100, 300], ""],
  [/\b(rice|reis|bulgur|couscous|quinoa|pasta|penne|spaghetti|noodles?|nudeln|oats?|haferflocken)\b/i, [40, 120], ""],
  [/\b(bread|brot|roll|brötchen|tortilla|wrap|pita|toast)\b/i, [30, 150], ""],
  [/\b(potato|kartoffel)/i, [100, 400], ""],
  [/\b(skyr|quark|yogurt|yoghurt|joghurt|cottage|hüttenkäse)\b/i, [100, 400], ""],
];
const JOB_RANGE: Record<Job, [number, number]> = { "Protein base": [80, 300], "Flavour food": [10, 50], "Carb base": [40, 250], "Fat source": [5, 40], "Volume food": [50, 400], "Drink": [100, 500], "Mixed": [50, 300] };
export type Portion = { min: number; max: number; note: string; piece?: { grams: number; name: string } };
export function portionOf(f: Food): Portion {
  if (f.serving && f.serving.grams > 0) return { min: f.serving.grams, max: f.serving.grams * 3, note: `One ${f.serving.name} is ${Math.round(f.serving.grams)} g.`, piece: f.serving };
  if (/\bbar\b|riegel/i.test(f.name)) return { min: 35, max: 100, note: "One bar is about 50 g.", piece: { grams: 50, name: "bar" } };
  for (const [re, [min, max], note] of NAMED) if (re.test(f.name)) return { min, max, note };
  const [min, max] = JOB_RANGE[jobOf(f).job];
  return { min, max, note: "" };
}
// the line under a food outside its portion: 150 g is 3 bars. One bar is 50 g. / 158 g is over a portion of yeast, 3 to 10 g. A dough uses 5 to 10 g.
export function portionLine(f: Food, grams: number): string | null {
  const p = portionOf(f);
  if (grams <= p.max && grams >= p.min) return null;
  const short = f.name.split(",")[0].trim().toLowerCase();
  if (grams > p.max && p.piece) { const n = Math.round(grams / p.piece.grams); return `${Math.round(grams)} g is ${n} ${p.piece.name}${n === 1 ? "" : "s"}. ${p.note}`.trim(); }
  if (grams > p.max) return `${Math.round(grams)} g is over a portion of ${short}, ${p.min} to ${p.max} g.${p.note ? ` ${p.note}` : ""}`;
  return `${Math.round(grams)} g is under a portion of ${short}, ${p.min} to ${p.max} g.`;
}
// DT96 (0.2.89, board Stories61; Milan 24 October 17:04): Add puts a food on the plate at its normal portion: a piece when the
// pack prints one (1 bar, 1 can), one M egg or banana when it is counted, else the middle of its range, to 5 g. Before, every
// Add landed at 150 g (50 g under PD 3), so a bar came as 3 bars and yeast as 150 g.
export function startGrams(f: Food): number {
  if (f.serving && f.serving.grams > 0) return f.serving.grams;
  const k = kindOf(f.name);
  if (k) return gramsOfOne({ kind: k, size: "M" });
  const p = portionOf(f);
  if (p.piece) return p.piece.grams;
  const mid = (p.min + p.max) / 2;
  return mid < 20 ? Math.round(mid) : Math.round(mid / 5) * 5;
}
