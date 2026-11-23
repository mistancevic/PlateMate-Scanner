// DT342 (0.3.185, board Stories285; Go 23 November 2026, 16:21): 0 where it is a fact; a block word always wins
import { test } from "node:test";
import assert from "node:assert/strict";
import { fibreFree, fibreOf } from "./fibre0";
import { aggregate, type Food } from "./pilot";

test("DT342 AC2: fibre-free by nature, whole words, three languages", () => {
  for (const n of ["Olive oil", "Olivenöl extra vergine", "Maslinovo ulje", "Sugar", "Chicken breast, cooked", "Putenbrust", "Piletina", "Пилетина", "Tuna in brine", "Lachs", "Eggs", "Jaja", "Greek yogurt 2%", "Skyr, natural", "Magerquark", "Sir gauda", "Mleko 2,8%", "Green tea", "Kafa", "Mineralwasser"])
    assert.equal(fibreFree(n), true, n);
});
test("DT342 AC2: a word for something with fibre in it, or added fibre, blocks the 0", () => {
  for (const n of ["Strawberry yogurt", "Joghurt mit Früchten", "Jogurt sa voćem", "Chocolate milk", "Breaded chicken", "Pohovana piletina", "Muesli bar", "Tuna salad", "Tuna with beans", "Protein yogurt with inulin", "Joghurt mit Ballaststoffen", "Jogurt sa vlaknima", "Cheese bread", "Eistee", "Oats", "Broccoli", ""])
    assert.equal(fibreFree(n), false, n);
});
test("DT342: a food's own value always wins over the list", () => {
  assert.equal(fibreOf({ name: "Olive oil", fiber: null }), 0);
  assert.equal(fibreOf({ name: "Protein yogurt", fiber: 3 }), 3);
  assert.equal(fibreOf({ name: "Muesli bar", fiber: null }), null);
});
const food = (name: string, calories: number, fiber: number | null) => ({ id: name, name, brand: "", basis: "100g", calories, protein: 1, fats: 1, carbs: 1, fiber }) as unknown as Food;
test("DT342 AC1, AC4: the plate counts what is known and says what is missing", () => {
  const base = [{ id: "a", grams: 150, food: food("Rice, cooked", 130, 0.4) }, { id: "b", grams: 200, food: food("Broccoli, steamed", 35, 2.6) }, { id: "c", grams: 10, food: food("Olive oil", 828, null) }] as any[];
  const t = aggregate(base);
  assert.equal(Math.round(t.fiber! * 10) / 10, 5.8); assert.deepEqual(t.fiberZero, ["Olive oil"]); assert.equal(t.fiberMissing, undefined);
  const u = aggregate([...base, { id: "d", grams: 45, food: food("Muesli bar", 400, null) }] as any[]);
  assert.equal(u.fiber, null, "the total stays unknown for everyone else"); assert.equal(Math.round(u.fiberKnown! * 10) / 10, 5.8); assert.deepEqual(u.fiberMissing, ["Muesli bar"]);
  const v = aggregate([{ id: "d", grams: 45, food: food("Muesli bar", 400, null) }] as any[]);
  assert.equal(v.fiber, null); assert.equal(v.fiberKnown, undefined, "no food with a value: nothing known");
});
