import test from "node:test";
import assert from "node:assert/strict";
import { sameFoods, diffLine, newNameFor } from "./recipeDiff";
const f = (id: string, name: string) => ({ id, name } as any);
const it = (food: any, grams: number) => ({ id: food.id + grams, food, grams, locked: false } as any);
const SK = f("s", "Skyr, natural"), OA = f("o", "Oats"), EW = f("e", "Egg whites"), CH = f("c", "Gouda cheese");
test("DT137: the same foods and grams in any order are the recipe", () => {
  assert.ok(sameFoods([it(SK, 250), it(OA, 40)], [it(OA, 40), it(SK, 250)]));
  assert.ok(!sameFoods([it(SK, 250), it(OA, 40)], [it(SK, 250), it(OA, 60)]));
});
test("DT137: what changed, in one line", () => {
  assert.equal(diffLine([it(SK, 250), it(OA, 40), it(EW, 100)], [it(SK, 250), it(OA, 40), it(CH, 30)]), "Egg whites out, Gouda cheese 30 g in");
  assert.equal(diffLine([it(OA, 20)], [it(OA, 60)]), "Oats 20 to 60 g");
});
test("DT137: a new recipe's name says the change and is never taken", () => {
  assert.equal(newNameFor("Skyr breakfast", [it(SK, 250), it(EW, 100)], [it(SK, 250), it(CH, 30)], ["Skyr breakfast"]), "Skyr breakfast with cheese");
  assert.equal(newNameFor("Skyr breakfast", [it(SK, 250), it(EW, 100)], [it(SK, 250)], []), "Skyr breakfast without egg whites");
  assert.equal(newNameFor("Skyr breakfast", [it(OA, 20)], [it(OA, 60)], ["Skyr breakfast, changed"]), "Skyr breakfast, changed 2");
});
