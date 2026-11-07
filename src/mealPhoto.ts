// A photo of the meal in front of you (0.2.108, board Stories75, DT127; Milan 25 October 14:26, 15:14, 15:51, 16:20, "Yes. Go"
// at 16:29). The read names the foods and guesses the amounts; this file turns the read into rows on the Plate (each an
// estimate, marked), keeps the question the read is unsure about, and writes Chef Mealan's one line from the gates, by code:
// eat it as it is; eat half and take the rest home; add a protein side; this is a snack. Nothing here asks the AI.
import type { Food, Ingredient } from "./pilot";
import { basicOf } from "./foodId";
import { referenceFood } from "./reference";
import { sizeOf, type GateLine } from "./gates";
import { w, mealV } from "./words";

// DT244 (0.3.96, board Stories182; Coach Milan 6 November 10:38 and 10:39): local, the name in the app's language (Srpski or
// German, also in Travel mode); name stays English, kept as the food's other name (aliases) for search and the food table
export type PhotoFood = { name: string; local?: string; grams: number; low: number; high: number; calories: number | null; protein: number | null; fats: number | null; carbs: number | null; fiber: number | null; confidence: "high" | "medium" | "low" };
// DT228 v2 (0.3.63): a food whose kind the read cannot tell, with two to four kinds it could be and Chef Mealan's question
export type Which = { name: string; question: string; options: { name: string; calories: number; protein: number; fats: number | null; carbs: number | null; fiber: number | null }[] };
export type PhotoRead = { dish: string; dishLocal?: string; foods: PhotoFood[]; unsure: { name: string; options: [number, number] } | null; which?: Which | null };
export type Estimate = { low: number; high: number };

// what the server returns, checked: names, numbers, at most eight foods, grams in sense
export function cleanRead(d: any): PhotoRead | null {
  if (!d || !Array.isArray(d.foods)) return null;
  const num = (x: unknown, lo = 0, hi = 5000) => (typeof x === "number" && Number.isFinite(x) && x >= lo && x <= hi ? Math.round(x * 10) / 10 : null);
  const foods: PhotoFood[] = d.foods.slice(0, 8).map((f: any) => {
    const grams = num(f?.grams, 1) ?? 100;
    const low = Math.min(grams, num(f?.low, 1) ?? Math.round(grams * 0.7)), high = Math.max(grams, num(f?.high, 1) ?? Math.round(grams * 1.3));
    const local = typeof f?.local === "string" ? f.local.replace(/\s+/g, " ").trim().slice(0, 60) : "";
    return { name: String(f?.name ?? "").trim().slice(0, 60), ...(local && local.toLowerCase() !== String(f?.name ?? "").trim().toLowerCase() ? { local } : {}), grams, low, high, calories: num(f?.calories, 0, 900), protein: num(f?.protein, 0, 100), fats: num(f?.fats, 0, 100), carbs: num(f?.carbs, 0, 100), fiber: num(f?.fiber, 0, 60), confidence: f?.confidence === "high" || f?.confidence === "low" ? f.confidence : "medium" };
  }).filter((f: PhotoFood) => f.name);
  if (!foods.length) return null;
  const u = d.unsure && typeof d.unsure === "object" ? d.unsure : null;
  const a = num(u?.options?.[0], 1), b = num(u?.options?.[1], 1);
  const unsure = u && typeof u.name === "string" && a !== null && b !== null && a !== b && foods.some((f) => f.name.toLowerCase() === String(u.name).toLowerCase()) ? { name: String(u.name).slice(0, 60), options: [Math.min(a, b), Math.max(a, b)] as [number, number] } : null;
  const dishLocal = typeof d.dishLocal === "string" ? d.dishLocal.replace(/\s+/g, " ").trim().slice(0, 60) : "";
  return { dish: String(d.dish ?? "").trim().slice(0, 60), ...(dishLocal ? { dishLocal } : {}), foods, unsure, which: whichOf(d.which, foods, num) };
}
// DT228 v2: the question about a food's kind, checked: it names a food of the read; two to four kinds, each with its values
function whichOf(wh: any, foods: PhotoFood[], num: (x: unknown, lo?: number, hi?: number) => number | null): Which | null {
  if (!wh || typeof wh !== "object" || typeof wh.name !== "string") return null;
  const name = wh.name.trim().slice(0, 60);
  if (!foods.some((f) => f.name.toLowerCase() === name.toLowerCase())) return null;
  const seen = new Set<string>();
  const options = (Array.isArray(wh.options) ? wh.options : []).map((o: any) => ({ name: String(o?.name ?? "").trim().slice(0, 60), calories: num(o?.calories, 0, 900), protein: num(o?.protein, 0, 100), fats: num(o?.fats, 0, 100), carbs: num(o?.carbs, 0, 100), fiber: num(o?.fiber, 0, 60) }))
    .filter((o: any) => o.name && o.calories !== null && o.protein !== null && !seen.has(o.name.toLowerCase()) && seen.add(o.name.toLowerCase())).slice(0, 4);
  if (options.length < 2) return null;
  const q = typeof wh.question === "string" ? wh.question.replace(/\s+/g, " ").trim().slice(0, 140) : "";
  return { name, question: q || w("photo.whatIsThe", { food: name.split(",")[0].toLowerCase() }), options };
}

// a food of the read as a food of yours: the table's food when the name is a basic food (its values win), else an estimate
// with the read's values; a food already in the library is reused
export function foodOfRead(f: PhotoFood, library: Food[], region: string | null | undefined, uid: () => string): { food: Food; fresh: boolean } {
  const same = (a: string | undefined, b: string | undefined) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
  const have = library.find((x) => same(x.name, f.name) || (x.aliases ?? []).some((a) => same(a, f.name)) || same(x.name, f.local));
  if (have) return { food: have, fresh: false };
  const r = basicOf({ name: f.name });
  if (r) {
    const twin = library.find((x) => x.refId === r.id);
    if (twin) return { food: twin, fresh: false };
    return { food: referenceFood(r, region, uid), fresh: true };
  }
  // DT244: a food of the table keeps the table's name (shown in your language by foodName); an estimate is named in your language
  const food = { id: uid(), name: f.local || f.name, ...(f.local ? { aliases: [f.name] } : {}), brand: "estimate", basis: "100g", source: "estimate", notes: "Read from a photo of the meal. Values are a chef's estimate per 100 g.", reviewedAt: new Date().toISOString(), readyToEat: true,
    calories: f.calories ?? 0, protein: f.protein ?? 0, fats: f.fats, carbs: f.carbs, fiber: f.fiber } as Food;
  return { food, fresh: true };
}
export function itemsOfRead(read: PhotoRead, library: Food[], region: string | null | undefined, uid: () => string): { items: Ingredient[]; fresh: Food[] } {
  const fresh: Food[] = []; const lib = [...library];
  const items = read.foods.map((f) => { const { food, fresh: isNew } = foodOfRead(f, lib, region, uid); if (isNew) { fresh.push(food); lib.push(food); } return { id: uid(), food, grams: f.grams, locked: false, est: { low: f.low, high: f.high }, fromPhoto: true } as Ingredient; });
  return { items, fresh };
}

// the plate's energy as a range, from each row's low and high (a corrected row has none: its grams count once)
export function kcalRange(items: Ingredient[]): { low: number; high: number; kcal: number } {
  const per = (i: Ingredient, g: number) => ((i.food.calories ?? 0) * g) / 100;
  return { low: Math.round(items.reduce((n, i) => n + per(i, i.est ? i.est.low : i.grams), 0)), high: Math.round(items.reduce((n, i) => n + per(i, i.est ? i.est.high : i.grams), 0)), kcal: Math.round(items.reduce((n, i) => n + per(i, i.grams), 0)) };
}
const r10 = (n: number) => (Math.round(n / 10) * 10).toLocaleString("en-US");
export const aboutKcal = (x: { low: number; high: number; kcal: number }) => (x.high - x.low < 60 ? w("photo.aboutKcal", { kcal: r10(x.kcal) }) : w("photo.aboutKcalRange", { low: r10(x.low), high: r10(x.high) }));
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// how many portions of the meal the plate is (C31, sizeOf in gates.ts): over 1.5 it is at least two, else 0; the eval runs this same rule
export const mealsOn = (kcal: number, mealKcal: number | null | undefined): number => { const s = sizeOf(kcal, mealKcal); return s.big ? Math.max(2, Math.round(s.portions)) : 0; };

// Chef Mealan's one line, by code, from what the gates and the size said; the first button is the advice
export type Advice = { line: string; first: "all" | "half" | "add" | "portion" };
export function photoAdvice(x: { items: Ingredient[]; protein: number; mealWord: string; mealKcal: number | null; big: number; nutrition: GateLine; day: GateLine; culinaryOk: boolean | null; snackKcal?: number }): Advice {
  const k = kcalRange(x.items), kcal = aboutKcal(k), prot = w("photo.gProtein", { n: Math.round(x.protein) }), meal = mealV(x.mealWord, true);
  // the gates' lines, read without relying on narrowing (this project builds without strictNullChecks)
  type No = { ok: false; why: string; ways: string[] };
  const n = x.nutrition as GateLine & Partial<No>, d = x.day as GateLine & Partial<No>;
  const nWhy = n.why ?? "", dWhy = d.why ?? "", nWays = n.ways ?? [], dWays = d.ways ?? [];
  // DT133 (0.2.113, board Stories88; Milan 27 October 14:12: let's call them portions): a plate of several meals in portions
  // of this meal, counted against the plan (the meal's share of what is left of the day), never a fixed number
  if (x.big >= 2) return { line: w(n.ok ? "photo.portions" : "photo.portionsWhy", { big: x.big, meal, kcal, mealKcal: r10(x.mealKcal ?? 0), why: nWhy }), first: "portion" };
  if (x.mealKcal && k.kcal < Math.max(150, x.mealKcal * 0.4)) return { line: w("photo.snack", { meal, kcal, prot }), first: "all" };
  if (!n.ok && nWays.includes("protein")) return { line: w("photo.addProtein", { why: nWhy, meal, kcal, prot }), first: "add" };
  if (!n.ok) return { line: w("photo.asItStands", { why: nWhy, kcal, prot }), first: "all" };
  // DT212 v4 (0.3.53): the eating window is said once, by Chef Mealan's checks above (Your day); the card only asks
  // DT243: the window's line is known by its way ("window"), not its English words, so it holds in every language
  if (!d.ok && dWays.includes("window")) return { line: w("photo.didYouEat", { kcal: cap(kcal), prot }), first: "all" };
  if (!d.ok) return { line: w("photo.dayWhy", { why: dWhy, kcal: cap(kcal), prot }), first: "all" };
  return { line: w(x.culinaryOk ? "photo.eatAsIsDish" : "photo.eatAsIs", { kcal: cap(kcal), prot, meal }), first: "all" };
}

// DT130 (0.2.110): a plate that is an idea (a friend's dinner, a plate online): nothing to eat now, so the line says what it
// is as the photo shows it and what Fit does; the buttons are for cooking it, not for logging it
export function ideaAdvice(x: { items: Ingredient[]; protein: number; mealWord: string; big: number; nutrition: GateLine }): string {
  const k = kcalRange(x.items), kcal = aboutKcal(k), prot = w("photo.gProtein", { n: Math.round(x.protein) }), meal = mealV(x.mealWord, true);
  const n = x.nutrition as GateLine & { why?: string };
  if (x.big >= 2) return w("photo.ideaPortions", { kcal, prot, big: x.big, meal });
  if (!n.ok && n.why) return w("photo.ideaWhy", { why: n.why, kcal, prot, meal });
  return w("photo.idea", { meal, kcal, prot });
}
