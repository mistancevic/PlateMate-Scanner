import test from "node:test";
import assert from "node:assert/strict";
import { jobOf, plainLine, todayLine, portionOf, portionLine, startGrams, mealScale } from "./foodjob";
import type { Food } from "./pilot";
const f = (name: string, calories: number, protein: number, fats: number, carbs: number, extra: any = {}) => ({ id: name, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats, carbs, fiber: 0, ...extra }) as any;
const nutella = f("Nutella", 539, 6.3, 30.9, 57.5), skyr = f("Skyr, natural", 63, 11, 0.2, 4), rice = f("Rice, cooked", 130, 2.7, 0.3, 28), oil = f("Olive oil", 884, 0, 100, 0), flips = f("Protein Flips Salt & Vinegar", 404, 23, 8.4, 56), cucumber = f("Cucumber", 15, 0.7, 0.1, 3);
test("Nutella is a flavour food, a spread", () => { const j = jobOf(nutella); assert.equal(j.job, "Flavour food"); assert.equal(j.note, "spread"); });
test("Skyr is a protein base, rice a carb base, oil a fat source, cucumber volume", () => {
  assert.equal(jobOf(skyr).job, "Protein base"); assert.equal(jobOf(rice).job, "Carb base"); assert.equal(jobOf(oil).job, "Fat source"); assert.equal(jobOf(cucumber).job, "Volume food");
});
test("a label the person set wins", () => { assert.equal(jobOf({ ...flips, job: "Carb base" }).job, "Carb base"); });
test("the plain line says PD against the target and a portion", () => { assert.match(plainLine(nutella, 5.5), /PD 1\.2, below your 5\.5\. It brings the taste.* 20 g is 108 kcal/); });
test("today depends on the day: rest day near the ceiling says not today", () => {
  assert.match(todayLine(nutella, 2600, 2550, "Rest day")!, /more than the 50 kcal left/);
  assert.match(todayLine(nutella, 3300, 1800, "Training day")!, /fits/);
});

test("DT93 (0.2.88): a normal portion by name, piece or job; the line under a food outside it", () => {
  const f = (name: string, calories: number, protein: number, extra: Partial<Food> = {}): Food => ({ id: name, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats: 10, carbs: 30, fiber: null, ...extra });
  assert.deepEqual(portionOf(f("Active dry yeast", 325, 40)), { min: 3, max: 10, note: "A dough uses 5 to 10 g." });
  assert.equal(portionLine(f("Active dry yeast", 325, 40), 158), "158 g is over a portion of active dry yeast, 3 to 10 g. A dough uses 5 to 10 g.");
  assert.equal(portionLine(f("Active dry yeast", 325, 40), 7), null);
  assert.equal(portionLine(f("Clean Protein Bar Peanut Love", 400, 20), 150), "150 g is 3 bars. One bar is about 50 g.");
  assert.equal(portionLine(f("Clean Protein Bar Peanut Love", 400, 20, { serving: { grams: 45, name: "bar" } }), 150), "150 g is 3 bars. One bar is 45 g.");
  assert.equal(portionLine(f("Peanut butter", 588, 25), 150), "150 g is over a portion of peanut butter, 15 to 40 g.");
  assert.equal(portionLine(f("Chicken breast, cooked", 165, 31), 150), null);
  assert.equal(portionLine(f("Skyr, natural", 63, 11), 250), null);
});

test("DT96 (0.2.89): Add puts a food on at its normal portion", () => {
  const f = (name: string, calories: number, protein: number, extra: Partial<Food> = {}): Food => ({ id: name, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats: 10, carbs: 30, fiber: null, ...extra });
  assert.equal(startGrams(f("Clean Protein Bar Peanut Love", 400, 20)), 50); // one bar, about 50 g
  assert.equal(startGrams(f("Clean Protein Bar Peanut Love", 400, 20, { serving: { grams: 45, name: "bar" } })), 45);
  assert.equal(startGrams(f("Active dry yeast", 325, 40)), 7);
  assert.equal(startGrams(f("Peanut butter", 588, 25)), 30);
  assert.equal(startGrams(f("Chicken breast, cooked", 165, 31)), 190);
  assert.equal(startGrams(f("Skyr, natural", 63, 11)), 250);
  assert.equal(startGrams(f("Olive oil", 884, 0)), 15);
  assert.equal(startGrams(f("Eggs", 155, 13)), 52);
});

test("0.2.115: a dressed salad is a salad, 50 to 300 g, not a fat source", () => {
  assert.equal(portionLine(f("Mixed salad, dressed", 60, 1.2, 4.5, 3.5), 90), null);
  assert.match(portionLine(f("Mixed salad, dressed", 60, 1.2, 4.5, 3.5), 400)!, /over a portion of mixed salad, 50 to 300 g/);
});

// DT135 (0.2.116, board Stories92): a food's portion grows with the meal
test("DT135: the meal in meals of three a day, 1 to 3", () => {
  assert.equal(mealScale(2750, 2750), 3); assert.equal(mealScale(1375, 2750), 1.5); assert.equal(mealScale(900, 2700), 1);
  assert.equal(mealScale(500, 2700), 1); assert.equal(mealScale(null, 2700), 1); assert.equal(mealScale(4000, 2700), 3);
});
test("DT135: one meal a day, pasta up to 900 g cooked and cheese up to 240 g; the least stays", () => {
  const pasta = f("Pasta, cooked", 150, 5.5, 1, 30), cheese = f("Parmesan", 400, 35, 28, 0);
  assert.deepEqual([portionOf(pasta, 3).min, portionOf(pasta, 3).max], [100, 900]);
  assert.equal(portionOf(cheese, 3).max, 240);
  assert.equal(portionLine(pasta, 1000, 1), "1000 g is over a portion of pasta, 100 to 300 g.");
  assert.equal(portionLine(pasta, 800, 3), null);
  assert.equal(portionLine(pasta, 1000, 3), "1000 g is over your meal's portion of pasta, 100 to 900 g.");
});
test("DT135: yeast, baking powder, salt and pepper keep their ranges; a bar keeps its pieces", () => {
  for (const n of ["Dry yeast", "Baking powder", "Salt", "Black pepper"]) assert.equal(portionOf(f(n, 0, 0, 0, 0), 3).max, portionOf(f(n, 0, 0, 0, 0)).max);
  const bar = f("Protein bar", 380, 30, 12, 35, { serving: { grams: 45, name: "bar" } });
  assert.equal(portionOf(bar, 3).max, 405); assert.equal(startGrams(bar, 3), 45);
});
test("DT135: Add starts in the middle of the meal's range", () => {
  assert.equal(startGrams(f("Penne, dry", 360, 13, 1.5, 72), 3), 200);
  assert.equal(startGrams(f("Penne, dry", 360, 13, 1.5, 72)), 80);
});

// 0.2.118 (Milan 18:23, "Fix Paprika"), C50: a sweet pepper is a vegetable, the spice stays the spice
import { isVegPepper } from "./foodjob";
import { isIngredient } from "./mixtip";
import { tasteOf } from "./dishTaste";
test("C50: bell pepper and Paprika, rot are vegetables, 50 to 300 g, no ingredient", () => {
  for (const n of ["Bell pepper, red, raw", "Paprika, rot, roh", "Paprika", "Paprika, crvena", "Red peppers", "Pepper, green", "Grilled peppers"]) {
    assert.ok(isVegPepper(n), n); assert.deepEqual([portionOf(f(n, 31, 1, 0.3, 6)).min, portionOf(f(n, 31, 1, 0.3, 6)).max], [50, 300], n);
    assert.equal(isIngredient({ name: n }), false, n); assert.equal(tasteOf(n), "veg", n);
  }
  assert.equal(portionLine(f("Paprika, rot, roh", 31, 1, 0.3, 6), 150), null);
});
test("C50: black pepper, smoked paprika, Paprikapulver and pepper flakes stay the spice", () => {
  for (const n of ["Black pepper", "Pepper", "Smoked paprika", "Paprikapulver edelsüß", "Red pepper flakes", "Aleva paprika"]) {
    assert.equal(isVegPepper(n), false, n); assert.deepEqual([portionOf(f(n, 280, 14, 13, 30)).min, portionOf(f(n, 280, 14, 13, 30)).max], [1, 5], n);
  }
  assert.equal(portionOf(f("Black pepper", 250, 10, 3, 40), 3).max, 5);
  assert.equal(portionOf(f("Paprika, rot", 31, 1, 0.3, 6), 3).max, 900);
});
