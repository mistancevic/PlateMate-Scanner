// DT337 (0.3.176, board Stories277): Chef Mealan's meal ideas against the target's range. Each case asks /api/meal as the Plate
// does (the plate, the meal, its size, the target, the plate's PD and what the meal is missing), then the app's own code sets
// the grams (solveMeal) and checks: every option lands in the range, and on a plate above the range no option adds a protein
// food. Needs a running server with the AI on: BASE_URL=http://127.0.0.1:3000 npm run eval:meal (a signed-in member's cookie in
// EVAL_COOKIE when the server asks for one).
import fs from "node:fs";
import path from "node:path";
import { solveMeal, missingOf, aboveRange, rangeTop, type Add } from "../src/makeMeal";
import { aggregate, density, type Food, type Ingredient } from "../src/pilot";
const dir = path.dirname(new URL(import.meta.url).pathname);
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const lib: Food[] = JSON.parse(fs.readFileSync(path.join(dir, "library.json"), "utf8")).foods;
const { cases } = JSON.parse(fs.readFileSync(path.join(dir, "meal-range-cases.json"), "utf8"));
const PROTEIN_FOOD = /\b(whey|quark|skyr|cottage|yog(h)?urt|chicken|turkey|beef|pork|ham|tuna|salmon|fish|egg|tofu|protein)\b/i;
const est = (a: any): Food => ({ id: a.name, name: a.name, brand: "", basis: "100g", source: "estimate", notes: "", reviewedAt: "", readyToEat: true, calories: a.calories, protein: a.protein, fats: a.fats ?? null, carbs: a.carbs ?? null, fiber: null } as Food);
let pass = 0, n = 0; const uid = () => `u${++n}`;
for (const c of cases) {
  const plate: Ingredient[] = c.plate.map((p: any, i: number) => ({ id: `p${i}`, food: lib.find((f) => f.name === p.food)!, grams: p.grams, locked: true }));
  const t = aggregate(plate), pd = density(t.protein, t.calories);
  const body = { plate: plate.map((i) => ({ name: i.food.name, grams: i.grams, calories: i.food.calories, protein: i.food.protein })), meal: c.meal, need: c.need, target: c.target, kitchens: ["Balkan", "Mediterranean", "German"], library: lib.slice(0, 40).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })), plate_pd: pd, missing: missingOf(c.day, c.need, t), very_low_carb: c.very_low_carb === true };
  let data: any = {}, err = "";
  try { const r = await fetch(`${BASE}/api/meal`, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.EVAL_COOKIE ? { Cookie: process.env.EVAL_COOKIE } : {}) }, body: JSON.stringify(body) }); data = await r.json(); if (!r.ok) err = data.error || String(r.status); } catch (e: any) { err = e.message; }
  const notes: string[] = [];
  for (const o of data.options ?? []) {
    const adds: Add[] = o.adds.map((a: any) => ({ food: lib.find((f) => f.name.toLowerCase() === a.name.toLowerCase()) ?? est(a), grams: a.grams, base: a.base, have: false }));
    const s = solveMeal(plate, adds, c.need, c.target, () => false, uid);
    if (c.expect.in_range && !s.ok) notes.push(`${o.title}: ${(s as any).why}`);
    if (c.expect.no_protein_food && aboveRange(pd, c.target)) for (const a of o.adds) if (PROTEIN_FOOD.test(a.name)) notes.push(`${o.title}: adds ${a.name}`);
    if (c.expect.fat_not_carbs) { const carbs = o.adds.reduce((x: number, a: any) => x + (a.carbs ?? 0) * a.grams / 100, 0), fats = o.adds.reduce((x: number, a: any) => x + (a.fats ?? 0) * a.grams / 100, 0); if (carbs > fats) notes.push(`${o.title}: more carbs than fat on a very low carb day`); }
  }
  const ok = !err && (data.options ?? []).length >= 2 && !notes.length;
  pass += ok ? 1 : 0;
  console.log(`${ok ? "ok  " : "FAIL"} ${c.id} (range to ${rangeTop(c.target)})${err ? ` error: ${err}` : ""}${notes.length ? "\n      " + notes.join("\n      ") : ""}`);
}
console.log(`\n${pass} of ${cases.length} cases pass.`);
process.exit(pass === cases.length ? 0 : 1);
