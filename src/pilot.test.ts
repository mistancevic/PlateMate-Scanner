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

test("a less-than in the notes fills a blank field with the printed bound", async () => {
  const { lessThanFromNotes } = await import("./pilot");
  const b = lessThanFromNotes("Values reported as less-than: Fett <0,5g, davon gesättigte Fettsäuren <0,1g, Ballaststoffe <0,5g, Eiweiß <0,5g.");
  assert.equal(b.protein, 0.5);
  assert.equal(b.fats, 0.5);
  assert.equal(b.fiber, 0.5);
  assert.equal(b.carbs, undefined);
  assert.deepEqual(lessThanFromNotes("as sold; contains milk"), {});
});

test("a counted food: what Mealan moves snaps to whole servings, never under one", async () => {
  const { servingsFor, snapToServing, servingLabel, solveIngredient, servingOf } = await import("./pilot");
  const bar = { id: "bar", name: "Protein bar", brand: "", basis: "100g", source: "test", notes: "", reviewedAt: "", readyToEat: true, calories: 363, protein: 50, fats: 10, carbs: 27, fiber: null, serving: { grams: 45, name: "bar" } } as any;
  assert.equal(servingsFor(bar, 60), 2);
  assert.equal(servingsFor(bar, 45), 1);
  assert.equal(servingsFor(bar, 10), 1);
  assert.equal(snapToServing(bar, 60), 90);
  assert.equal(servingLabel(bar, 90), "2 bars");
  assert.equal(servingLabel(bar, 45), "1 bar");
  assert.equal(servingOf({ grams: 45, name: "bar" })?.grams, 45);
  assert.equal(servingOf({ grams: 2, name: "bar" }), undefined);
  // the solver: a bar moved next to 150 g skyr lands on whole bars
  const skyr = { ...bar, id: "skyr", name: "Skyr", calories: 63, protein: 11, serving: undefined };
  const r = solveIngredient([{ id: "a", food: skyr, grams: 150, locked: true }, { id: "b", food: bar, grams: 45, locked: false }], "b", 15, null) as any;
  assert.equal(r.ok, true);
  assert.equal(r.grams % 45, 0, `whole bars: ${r.grams} g`);
  assert.ok(r.grams >= 45);
});
