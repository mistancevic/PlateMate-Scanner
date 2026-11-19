// B145 (0.3.161, board B145): For cooking, not counted shows only foods the person's own words named, never a way of cooking.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cookingNamed, isWayOfCooking } from "./mealPhoto";

test("B145 AC1: no words, no cooking foods, whatever the read returns", () => {
  assert.deepEqual(cookingNamed(["olive oil", "salt"], ""), []);
  assert.deepEqual(cookingNamed(["simmered", "pureed"], "   "), []);
  assert.deepEqual(cookingNamed(undefined, ""), []);
});

test("B145 AC2: with my words, the foods I named stay", () => {
  assert.deepEqual(cookingNamed(["olive oil"], "fried in olive oil"), ["olive oil"]);
  assert.deepEqual(cookingNamed(["vegetable stock", "bay leaf", "black pepper"], "a soup with stock, bay leaf and pepper"), ["vegetable stock", "bay leaf", "black pepper"]);
});

test("B145 AC3: a way of cooking is never a food", () => {
  assert.deepEqual(cookingNamed(["simmered", "pureed", "chives"], "a soup with chives, simmered and pureed"), ["chives"]);
  for (const x of ["simmered", "pureed", "puréed", "pan-fried", "stir fried", "slow cooked", "deep frying", "grilled", "Sautéed", "whipped", "chopped"]) assert.equal(isWayOfCooking(x), true, x);
  for (const x of ["olive oil", "smoked paprika", "baking powder", "mixed herbs", "browned butter", "chives", "salt", "stock", "frying oil", "minced garlic", "chard", "panko", "dill"]) assert.equal(isWayOfCooking(x), false, x);
});
