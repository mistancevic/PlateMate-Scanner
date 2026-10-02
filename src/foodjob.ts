// What a food is, by its job on a plate. A property of the food, never a verdict: that depends on the day (see todayLine).
import { density, type Food } from "./pilot";
import { roleOf } from "./swaps";
export const JOBS = ["Protein base", "Flavour food", "Carb base", "Fat source", "Volume food", "Drink", "Mixed"] as const;
export type Job = (typeof JOBS)[number];
const SPREAD = /nutella|spread|aufstrich|creme|crème|butter|peanut ?butter|erdnussmus|nussmus|honig|honey|jam|marmelade|konfit/i;
const DRINK = /drink|juice|saft|milk\b|milch\b|cola|soda|tea\b|tee\b|coffee|kaffee|smoothie|shake|wasser|water|bier|beer|wein|wine/i;
export function jobOf(f: Food): { job: Job; note: string; taste: "sweet" | "savoury" | null; mine: boolean } {
  const role = roleOf(f.name);
  const sugarsLine = f.table?.find((r) => r.key === "sugars")?.amount ?? null;
  const taste = role === "sweet" || role === "fruit" ? "sweet" : role === "savoury" ? "savoury" : sugarsLine !== null && sugarsLine >= 25 ? "sweet" : null;
  if (f.job && (JOBS as readonly string[]).includes(f.job)) return { job: f.job as Job, note: SPREAD.test(f.name) ? "spread" : "", taste, mine: true };
  const kcal = f.calories ?? 0, pd = density(f.protein, f.calories) ?? 0;
  const fat = kcal ? ((f.fats ?? 0) * 9) / kcal : 0, carb = kcal ? ((f.carbs ?? 0) * 4) / kcal : 0;
  const sugars = f.table?.find((r) => r.key === "sugars")?.amount ?? null;
  const spread = SPREAD.test(f.name);
  let job: Job;
  if ((f.basis as string) === "100ml" || (DRINK.test(f.name) && kcal < 120)) job = "Drink";
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
  const portionKcal = Math.round((f.calories * PORTION[job]) / 100);
  const left = Math.round(dayKcal - eatenKcal);
  const so = eatenKcal > 0 ? `${Math.round(eatenKcal).toLocaleString("en")} of ${Math.round(dayKcal).toLocaleString("en")} kcal so far in Mealan` : `${Math.round(dayKcal).toLocaleString("en")} kcal planned, nothing in Mealan yet`;
  if (left <= 0) return `${dayName}: ${so}. Not today.`;
  if (portionKcal > left) return `${dayName}: ${so}. A ${PORTION[job]} g portion is more than the ${left} kcal left.`;
  return `${dayName}: ${so}. A ${PORTION[job]} g portion fits.`;
}
