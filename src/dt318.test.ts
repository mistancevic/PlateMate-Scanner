// DT318 (0.3.160, board DT318): what the person set stays when Chef Mealan looks again, and the foods of one kind.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toldAgain } from "./mealPhoto";
import { sameKind } from "./swap";
import { kinWords, isKin, answerIsReal } from "./screens/PlateChecks";
import type { Ingredient, Food } from "./pilot";

const food = (name: string, extra: Partial<Food> = {}) => ({ id: name, name, brand: "estimate", basis: "100g", source: "estimate", calories: 100, protein: 5, fats: 1, carbs: 5, fiber: 0, ...extra }) as unknown as Food;
const item = (id: string, name: string, grams: number, x: Partial<Ingredient> = {}): Ingredient => ({ id, food: food(name), grams, locked: false, fromPhoto: true, est: { low: grams - 20, high: grams + 20 }, readAs: name, ...x });

test("DT318 AC10: an amount I set stays, and the read's own version of that food is dropped", () => {
  const prev = [item("a", "Chicken breast, grilled", 200, { est: undefined }), item("b", "Sweet potato fries, baked", 180), item("c", "Yogurt, 10% fat", 80)];
  const read = [item("x", "Chicken breast, grilled", 250), item("y", "Sweet potato fries, baked", 180), item("z", "Yogurt, 0.2% fat", 80), item("m", "Mayonnaise", 20)];
  const r = toldAgain(prev, read, sameKind);
  assert.deepEqual(r.items.map((i) => `${i.food.name} ${i.grams}`), ["Chicken breast, grilled 200", "Sweet potato fries, baked 180", "Yogurt, 0.2% fat 80", "Mayonnaise 20"]);
  assert.equal(r.items[0].id, "a");
  assert.deepEqual(r.fresh.map((i) => i.food.name), ["Mayonnaise"]);
  assert.deepEqual(r.changed.map((c) => `${c.from.food.name} > ${c.to.food.name}`), ["Yogurt, 10% fat > Yogurt, 0.2% fat"]);
  assert.equal(r.gone.length, 0);
});
test("DT318 AC10: a food settled by a check stays, also when the read names it as before", () => {
  const prev = [item("c", "Hildebrand yogurt, 0.2% fat", 80, { checked: true, readAs: "Yogurt, 10% fat" }), item("b", "Rice, cooked", 150)];
  const read = [item("z", "Yogurt, 10% fat", 90), item("y", "Rice, cooked", 150)];
  const r = toldAgain(prev, read, sameKind);
  assert.deepEqual(r.items.map((i) => i.id), ["c", "y"]);
  assert.equal(r.fresh.length + r.changed.length + r.gone.length, 0);
});
test("DT318 AC11: an amount typed on the Plate stays too", () => {
  const prev = [item("b", "Sweet potato fries, baked", 150, { amountSet: true })];
  const r = toldAgain(prev, [item("y", "Sweet potato fries, baked", 180)], sameKind);
  assert.deepEqual(r.items.map((i) => `${i.id} ${i.grams}`), ["b 150"]);
});
test("DT318: a food the second look no longer sees is gone, and said so", () => {
  const prev = [item("a", "Rice, cooked", 150), item("b", "Ketchup", 20)];
  const r = toldAgain(prev, [item("x", "Rice, cooked", 150)], sameKind);
  assert.deepEqual(r.gone.map((i) => i.food.name), ["Ketchup"]);
});
test("DT318 AC6: the same kind is found by a word of the name, also behind a brand", () => {
  const kin = kinWords({ name: "Yogurt, 10% fat" });
  assert.ok(isKin(kin, { name: "Greek yogurt, 2 %" }));
  assert.ok(isKin(kin, { name: "Hildebrand yogurt 0.2% fat" }));
  assert.ok(isKin(kin, { name: "Naturjoghurt", aliases: ["Yogurt, plain, whole"] }));
  assert.ok(!isKin(kin, { name: "Sour cream, 20 %" }));
  const sour = kinWords({ name: "Sour cream" });
  assert.ok(isKin(sour, { name: "Sour cream, 20 %" }));
  assert.ok(!isKin(sour, { name: "Trahanas, dried (cracked wheat and sour milk)" }));
});
test("DT318 AC7: an answer is real when it names a food of the list or a basic food, else an estimate", () => {
  assert.ok(answerIsReal("Skyr, natural", []));
  assert.ok(answerIsReal("My yogurt", [food("My yogurt", { source: "Label", brand: "Hildebrand" })]));
  assert.ok(!answerIsReal("My yogurt", [food("My yogurt")]));
  assert.ok(!answerIsReal("Dragon sauce", []));
});
