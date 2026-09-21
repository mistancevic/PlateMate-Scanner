import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregate,
  category,
  density,
  EMPTY,
  Food,
  Ingredient,
  numberInput,
  parseState,
  portionTotals,
  solveIngredient,
  symbol,
  validateFood,
} from "./pilot";
const food = (id: string, p: Partial<Food>): Food => ({
  id,
  name: id,
  brand: "",
  basis: "100g",
  source: "test",
  notes: "",
  reviewedAt: "2026-09-21",
  readyToEat: true,
  ...EMPTY,
  ...p,
});
const nut = food("nut", {
  calories: 539,
  protein: 6.3,
  fats: 30.9,
  carbs: 57.5,
  fiber: null,
});
const yogurt = food("yogurt", {
  calories: 60,
  protein: 7.2,
  fats: 0.8,
  carbs: 6,
  fiber: 0,
});
const items: Ingredient[] = [
  { id: "n", food: nut, grams: 50, locked: true },
  { id: "y", food: yogurt, grams: 100, locked: false },
];
test("density is not mass percentage and does not round before classification", () => {
  assert.equal(density(7, 125), 5.6);
  assert.equal(density(10, 100), 10);
  assert.equal(density(null, 100), null);
  assert.equal(density(1, 0), null);
  assert.equal(category(4.999), "Intermediate protein density");
});
test("missing fibre remains unknown, not zero or a subtotal", () =>
  assert.equal(aggregate(items).fiber, null));
test("locked 50g ingredient, recompute after gram rounding", () => {
  const s = solveIngredient(items, "y", 6, null);
  assert.ok(s.ok);
  assert.equal(s.grams, 362);
  assert.equal(s.items[0].grams, 50);
  const t = aggregate(s.items);
  assert.equal(t.calories, 486.7);
  assert.ok(Math.abs(t.protein! - 29.214) < 1e-9);
  assert.ok(Math.abs(s.actualPD - 6.0024655845) < 1e-8);
  const p = portionTotals(s.items, 400);
  assert.ok(Math.abs(p.protein! - 28.3631067961) < 1e-8);
  assert.ok(Math.abs(density(p.protein, p.calories)! - s.actualPD) < 1e-8);
});
test("infeasible size and locked ingredient cannot be silently changed", () => {
  assert.equal(solveIngredient(items, "y", 6, 300).ok, false);
  assert.equal(solveIngredient(items, "n", 6, null).ok, false);
});
test("zero quantity does not poison a meal; excess selected portion does", () => {
  const zero = { ...items[0], grams: 0 };
  assert.equal(aggregate([zero, items[1]]).fiber, 0);
  assert.equal(portionTotals(items, 999).calories, null);
});
test("notation follows reference density, not percent of daily budget", () => {
  const s = solveIngredient(items, "y", 6, null);
  assert.ok(s.ok);
  const t = aggregate(s.items),
    g = { calories: 2500, protein: 150, fats: 80, carbs: 280, fiber: 30 };
  assert.equal(symbol("protein", t, g), "P");
  assert.equal(symbol("fats", t, g), "F+");
  assert.equal(symbol("fiber", t, g), "Fi ?");
  assert.equal(symbol("protein", t, EMPTY), "P ?");
});
test("decimal commas and missing or trace input", () => {
  assert.equal(numberInput("7,2"), 7.2);
  for (const v of ["", null, "<0.5", "trace", true, -1, "Infinity"])
    assert.equal(numberInput(v), null);
  assert.equal(numberInput("0"), 0);
});
test("reject invalid records/imports rather than mutating data", () => {
  assert.ok(validateFood(food("bad", { calories: 200, protein: 101 })).length);
  assert.throws(() => parseState('{"version":1}'));
});
