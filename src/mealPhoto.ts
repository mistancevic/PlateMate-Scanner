// A photo of the meal in front of you (0.2.108, board Stories75, DT127; Milan 25 October 14:26, 15:14, 15:51, 16:20, "Yes. Go"
// at 16:29). The read names the foods and guesses the amounts; this file turns the read into rows on the Plate (each an
// estimate, marked), keeps the question the read is unsure about, and writes Chef Mealan's one line from the gates, by code:
// eat it as it is; eat half and take the rest home; add a protein side; this is a snack. Nothing here asks the AI.
import type { Food, Ingredient } from "./pilot";
import { basicOf } from "./foodId";
import { referenceFood } from "./reference";
import type { GateLine } from "./gates";

export type PhotoFood = { name: string; grams: number; low: number; high: number; calories: number | null; protein: number | null; fats: number | null; carbs: number | null; fiber: number | null; confidence: "high" | "medium" | "low" };
export type PhotoRead = { dish: string; foods: PhotoFood[]; unsure: { name: string; options: [number, number] } | null };
export type Estimate = { low: number; high: number };

// what the server returns, checked: names, numbers, at most eight foods, grams in sense
export function cleanRead(d: any): PhotoRead | null {
  if (!d || !Array.isArray(d.foods)) return null;
  const num = (x: unknown, lo = 0, hi = 5000) => (typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi ? Math.round(x * 10) / 10 : null);
  const foods: PhotoFood[] = d.foods.slice(0, 8).map((f: any) => {
    const grams = num(f?.grams, 1) ?? 100;
    const low = Math.min(grams, num(f?.low, 1) ?? Math.round(grams * 0.7)), high = Math.max(grams, num(f?.high, 1) ?? Math.round(grams * 1.3));
    return { name: String(f?.name ?? "").trim().slice(0, 60), grams, low, high, calories: num(f?.calories, 0, 900), protein: num(f?.protein, 0, 100), fats: num(f?.fats, 0, 100), carbs: num(f?.carbs, 0, 100), fiber: num(f?.fiber, 0, 60), confidence: f?.confidence === "high" || f?.confidence === "low" ? f.confidence : "medium" };
  }).filter((f: PhotoFood) => f.name);
  if (!foods.length) return null;
  const u = d.unsure && typeof d.unsure === "object" ? d.unsure : null;
  const a = num(u?.options?.[0], 1), b = num(u?.options?.[1], 1);
  const unsure = u && typeof u.name === "string" && a !== null && b !== null && a !== b && foods.some((f) => f.name.toLowerCase() === String(u.name).toLowerCase()) ? { name: String(u.name).slice(0, 60), options: [Math.min(a, b), Math.max(a, b)] as [number, number] } : null;
  return { dish: String(d.dish ?? "").trim().slice(0, 60), foods, unsure };
}

// a food of the read as a food of yours: the table's food when the name is a basic food (its values win), else an estimate
// with the read's values; a food already in the library is reused
export function foodOfRead(f: PhotoFood, library: Food[], region: string | null | undefined, uid: () => string): { food: Food; fresh: boolean } {
  const have = library.find((x) => x.name.toLowerCase() === f.name.toLowerCase());
  if (have) return { food: have, fresh: false };
  const r = basicOf({ name: f.name });
  if (r) {
    const twin = library.find((x) => x.refId === r.id);
    if (twin) return { food: twin, fresh: false };
    return { food: referenceFood(r, region, uid), fresh: true };
  }
  const food = { id: uid(), name: f.name, brand: "estimate", basis: "100g", source: "estimate", notes: "Read from a photo of the meal. Values are a chef's estimate per 100 g.", reviewedAt: new Date().toISOString(), readyToEat: true,
    calories: f.calories ?? 0, protein: f.protein ?? 0, fats: f.fats, carbs: f.carbs, fiber: f.fiber } as Food;
  return { food, fresh: true };
}
export function itemsOfRead(read: PhotoRead, library: Food[], region: string | null | undefined, uid: () => string): { items: Ingredient[]; fresh: Food[] } {
  const fresh: Food[] = []; const lib = [...library];
  const items = read.foods.map((f) => { const { food, fresh: isNew } = foodOfRead(f, lib, region, uid); if (isNew) { fresh.push(food); lib.push(food); } return { id: uid(), food, grams: f.grams, locked: false, est: { low: f.low, high: f.high } } as Ingredient; });
  return { items, fresh };
}

// the plate's energy as a range, from each row's low and high (a corrected row has none: its grams count once)
export function kcalRange(items: Ingredient[]): { low: number; high: number; kcal: number } {
  const per = (i: Ingredient, g: number) => ((i.food.calories ?? 0) * g) / 100;
  return { low: Math.round(items.reduce((n, i) => n + per(i, i.est ? i.est.low : i.grams), 0)), high: Math.round(items.reduce((n, i) => n + per(i, i.est ? i.est.high : i.grams), 0)), kcal: Math.round(items.reduce((n, i) => n + per(i, i.grams), 0)) };
}
const r10 = (n: number) => Math.round(n / 10) * 10;
const plural = (w: string) => (/(ch|sh|s|x)$/.test(w) ? `${w}es` : `${w}s`);
export const aboutKcal = (x: { low: number; high: number; kcal: number }) => (x.high - x.low < 60 ? `about ${r10(x.kcal)} kcal` : `about ${r10(x.low)} to ${r10(x.high)} kcal`);

// Chef Mealan's one line, by code, from what the gates and the size said; the first button is the advice
export type Advice = { line: string; first: "all" | "half" | "add" };
export function photoAdvice(x: { items: Ingredient[]; protein: number; mealWord: string; mealKcal: number | null; big: number; nutrition: GateLine; day: GateLine; culinaryOk: boolean | null; snackKcal?: number }): Advice {
  const k = kcalRange(x.items), kcal = aboutKcal(k), prot = `${Math.round(x.protein)} g protein`;
  const n = x.nutrition, d = x.day;
  if (x.big >= 2) return { line: `Eat half and take the rest home. The whole plate is ${kcal}, about ${x.big} ${plural(x.mealWord)} for your day${n.ok ? "" : ", and " + n.why.charAt(0).toLowerCase() + n.why.slice(1).replace(/\.$/, "")}. Half is a ${x.mealWord}.`, first: "half" };
  if (x.mealKcal && k.kcal < Math.max(150, x.mealKcal * 0.4)) return { line: `This is a snack, not your ${x.mealWord}: ${kcal} and ${prot}. Eat it, and your ${x.mealWord} is still to come.`, first: "all" };
  if (!n.ok && n.ways.includes("protein")) return { line: `${n.why} Add a protein side and it is your ${x.mealWord}; as it stands it is ${kcal} and ${prot}.`, first: "add" };
  if (!n.ok) return { line: `${n.why} As it stands it is ${kcal} and ${prot}.`, first: "all" };
  if (!d.ok) return { line: `${d.why} ${kcal} and ${prot}.`, first: "all" };
  return { line: `Eat it as it is. ${kcal.charAt(0).toUpperCase() + kcal.slice(1)} and ${prot}, a full ${x.mealWord} for your day${x.culinaryOk === false ? "" : x.culinaryOk ? ", and nothing on it argues with the dish" : ""}.`, first: "all" };
}
