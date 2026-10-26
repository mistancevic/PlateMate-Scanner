// Eval 2's scoring is code, so it is tested like code: a weighed plate against a read.
import { test } from "node:test";
import assert from "node:assert/strict";
import { scorePlate } from "../evals/photoMatch";

const truth = [
  { name: "Chicken breast, grilled", grams: 182, calories: 165 },
  { name: "Rice, cooked", also: ["basmati"], grams: 160, calories: 130 },
  { name: "Cucumber salad", also: ["salad"], grams: 90, calories: 40 },
];
test("Eval 2: each weighed food found once by its main word; the weighed grams in the read's range; a food not on the plate is invented", () => {
  const s = scorePlate(truth, [
    { name: "Grilled chicken", grams: 180, low: 140, high: 240, calories: 165 },
    { name: "Basmati rice", grams: 150, low: 120, high: 150, calories: 130 },
    { name: "Mixed salad, dressed", grams: 90, low: 60, high: 120, calories: 60 },
    { name: "Olive oil", grams: 8, low: 5, high: 15, calories: 884 },
  ]);
  assert.equal(s.found, 3);
  assert.equal(s.invented, 1);
  assert.deepEqual(s.extra, ["Olive oil"]);
  assert.equal(s.inRange, 2, "160 g of rice is outside a read of 120 to 150 g");
  assert.equal(s.kcalTrue, Math.round(182 * 1.65 + 160 * 1.3 + 90 * 0.4));
  assert.equal(s.kcalOk, true);
});
test("Eval 2: a food not read is missing; no kcal check without the weighed values", () => {
  const s = scorePlate([{ name: "Pork schnitzel", grams: 300 }, { name: "Fries", grams: 250 }], [{ name: "Fries", grams: 250, low: 200, high: 320, calories: 312 }]);
  assert.equal(s.found, 1); assert.equal(s.pairs[0].read, null); assert.equal(s.kcalTrue, null); assert.equal(s.kcalOk, null);
});
