import { test } from "node:test";
import assert from "node:assert/strict";
import { changeOf, kindOf, sameKind, swapChoices } from "./swap";

const food = (id: string, name: string, calories: number, protein: number) => ({ id, name, brand: "", basis: "100g" as const, calories, protein, fats: 0, carbs: 0, fiber: 0, source: "", notes: "", reviewedAt: "", readyToEat: true });
const cookedRice = food("rc", "Rice, cooked", 130, 2.7), rawRice = food("rr", "Rice, white, raw", 365, 7.1), mince = food("mi", "Beef mince, 15 % fat, raw", 215, 18.6), chicken = food("ch", "Chicken breast, cooked", 165, 31), cabbage = food("cb", "Cabbage, raw", 25, 1.3);
const it = (f: ReturnType<typeof food>, grams: number) => ({ id: f.id + grams, food: f, grams, locked: true });

test("DT83: the same food in another state leads with the same energy", () => {
  assert.equal(kindOf("Rice, white, raw"), "rice"); assert.equal(kindOf("Beef mince, 15 % fat, raw"), "beef");
  assert.ok(sameKind(cookedRice, rawRice)); assert.ok(!sameKind(mince, chicken));
  assert.deepEqual(swapChoices(it(cookedRice, 300), rawRice), [{ way: "energy", grams: 105 }, { way: "weight", grams: 300 }], "300 g cooked rice is about 107 g raw, rounded to 105");
});

test("DT83: a different food leads with the same weight; no energy, only the weight", () => {
  assert.deepEqual(swapChoices(it(mince, 500), chicken), [{ way: "weight", grams: 500 }, { way: "energy", grams: 650 }]);
  assert.deepEqual(swapChoices(it(mince, 500), { ...chicken, calories: 0 }), [{ way: "weight", grams: 500 }]);
  assert.deepEqual(swapChoices(it(cabbage, 30), rawRice).find((c) => c.way === "energy"), { way: "energy", grams: 2 }, "under 50 g rounds to the gram");
});

test("DT83: the change, for one portion", () => {
  const before = [it(cabbage, 800), it(mince, 500), it(cookedRice, 300)];
  assert.equal(changeOf(before, before.map((x) => ({ ...x })), 8), null, "nothing changed, no line");
  const after = [before[0], before[1], it(rawRice, 105)];
  const c = changeOf(before, after, 8)!;
  assert.deepEqual(c.out, ["Rice, cooked, 300 g"]); assert.deepEqual(c.in, ["Rice, white, raw, 105 g"]);
  assert.deepEqual(c.kcal.map(Math.round), [208, 207]); assert.equal(c.big, false);
  const big = changeOf(before, [before[0], it(chicken, 500), before[2]], 8)!;
  assert.equal(big.big, false, "mince to chicken at the same weight: 1,075 to 825 kcal of mince is under a fifth of the recipe");
  const bigger = changeOf(before, [before[0], it(mince, 1000), before[2]], 8)!;
  assert.deepEqual(bigger.moved, ["Beef mince, 15 % fat, raw, 500 g to 1,000 g"]); assert.equal(bigger.big, true, "a fifth more energy per portion turns it amber");
});
