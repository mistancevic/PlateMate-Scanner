// Eval 1 for Photo of my meal (DT127, DT130): from a read plate to Chef Mealan's line and first button, through the same code
// the app runs: the nutrition rules (N27 to N29), your day, the plate size (C31) and the advice. Deterministic; runs on every
// push (npm test) and on its own (npm run eval:advice). The expected lines are the coach's rules, written per case.
import fs from "node:fs";
import path from "node:path";
import { nutritionGate, dayGate } from "../src/gates";
import { photoAdvice, ideaAdvice, mealsOn } from "../src/mealPhoto";
import { aggregate, type Food, type Ingredient } from "../src/pilot";

const dir = path.dirname(new URL(import.meta.url).pathname);
export type AdviceResult = { id: string; title: string; ok: boolean; first: string | null; line: string; misses: string[]; open: string | null };

export function runAdvice(file = path.join(dir, "photo-advice-cases.json")): AdviceResult[] {
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  return d.cases.map((c: any) => {
    const items: Ingredient[] = c.plate.map((p: any, k: number) => {
      const f = d.foods[p.food];
      const food = { id: `f${k}`, name: f.name, brand: "estimate", basis: "100g", source: "estimate", calories: f.calories, protein: f.protein, fats: f.fats, carbs: f.carbs, fiber: f.fiber, readyToEat: true } as Food;
      return { id: `i${k}`, food, grams: p.grams, locked: false, est: { low: Math.round(p.grams * 0.75), high: Math.round(p.grams * 1.25) } } as Ingredient;
    });
    const t = aggregate(items), kcal = t.calories ?? 0;
    const [h, m] = String(c.time).split(":").map(Number); const now = new Date(2026, 9, 26, h, m);
    const nutrition = nutritionGate({ items, kind: "meal", beforeTraining: c.moment === "before", mealWord: c.meal });
    const day = dayGate({ items, moment: c.moment, now, window: d.window, kind: "meal", mealWord: c.meal, needsCooking: () => false });
    const big = mealsOn(kcal, c.mealKcal);
    let first: string | null = null, line: string;
    if (c.who === "idea") line = ideaAdvice({ items, protein: t.protein ?? 0, mealWord: c.meal, big, nutrition });
    else { const a = photoAdvice({ items, protein: t.protein ?? 0, mealWord: c.meal, mealKcal: c.mealKcal, big, nutrition, day, culinaryOk: c.culinaryOk }); first = a.first; line = a.line; }
    const misses: string[] = [];
    if (c.expect.first && first !== c.expect.first) misses.push(`first button ${first}, expected ${c.expect.first}`);
    if (c.expect.says && !new RegExp(c.expect.says).test(line)) misses.push(`line does not say /${c.expect.says}/`);
    if (c.expect.never && new RegExp(c.expect.never).test(line)) misses.push(`line says what it must not: /${c.expect.never}/`);
    return { id: c.id, title: c.title, ok: misses.length === 0, first, line, misses, open: c.open ?? null };
  });
}
