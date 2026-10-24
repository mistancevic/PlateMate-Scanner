import test from "node:test";
import assert from "node:assert/strict";
import { jobOf, plainLine, todayLine, portionOf, portionLine, startGrams } from "./foodjob";
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
