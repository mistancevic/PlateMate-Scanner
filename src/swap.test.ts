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

// C51 (DT148, 0.2.129, board Stories100 version 2; Tester 3 swapped Quark and got Quark again, then anything by PD)
import { swapKind, sameFoodName, fitsPlate as fitsPlate51 } from "./mixtip";
import { basicsHere } from "./places";
import { rankSwaps } from "./swaps";
import { referenceFood } from "./reference";
test("C51: the same food under another name is no swap; the same kind first, then your foods, then the basic foods sold here", () => {
  assert.equal(sameFoodName("Quark, low fat", "Quark, low fat (Magerquark)"), true);
  assert.equal(sameFoodName("Tuna in olive oil", "Tuna in water"), false);
  const F = (id: string, name: string, calories: number, protein: number, fats = 1, carbs = 4) => ({ id, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats, carbs, fiber: 0 }) as any;
  const quark = F("q", "Quark, low fat", 67, 12, 0.3, 4);
  assert.equal(swapKind(quark, F("g", "Greek yogurt 2%", 73, 9.9)), 1);
  assert.equal(swapKind(quark, F("c", "Cottage cheese", 98, 12)), 1);
  assert.equal(swapKind(quark, F("w", "Whey protein powder", 380, 78)), 2);
  assert.equal(swapKind(F("t", "Tuna in olive oil", 190, 25, 9, 0), F("t2", "Tuna in water", 110, 25, 1, 0)), 0, "the same food in another state leads (DT115)");
  const items = [{ id: "a", food: quark, grams: 200, locked: true }, { id: "b", food: F("o", "Oats", 372, 13.5, 7, 59), grams: 30, locked: true }, { id: "c", food: F("s", "Strawberries", 32, 0.7, 0.3, 7.7), grams: 120, locked: true }];
  let n = 0; const uid = () => "u" + n++;
  const lib = [F("m", "Quark, low fat (Magerquark)", 67, 12, 0.3, 4), F("w", "Whey protein powder", 380, 78, 5, 6), F("g", "Greek yogurt 2%", 73, 9.9, 1.9, 3.9), F("ic", "Vanilla ice cream", 200, 3.5, 11, 23)];
  const basics = basicsHere(new Set(["limassol"])).map(({ ref, place }) => ({ ...referenceFood(ref, "limassol", uid), id: `ref:${ref.id}`, places: place ? [place] : [] }));
  const r = rankSwaps(items as any, "a", [...lib, ...basics], 5.2, 300, undefined, fitsPlate51, swapKind, sameFoodName);
  assert.ok(!r.some((x) => /Magerquark/.test(x.f.name)), "Quark under another name is left out");
  assert.equal(r[0].f.name, "Greek yogurt 2%", "yours, of the same kind, first: " + r.slice(0, 3).map((x) => x.f.name).join(", "));
  const firstOther = r.findIndex((x) => (x.kind ?? 0) > 1), lastSame = r.map((x) => x.kind ?? 0).lastIndexOf(1);
  assert.ok(firstOther > lastSame, "other kinds come after every food of the same kind");
  assert.ok(r.some((x) => x.f.id === "ref:cy-yoghurt-sheep" && x.kind === 1), "a Cypriot yoghurt sold in Limassol is offered, as the same kind");
  assert.ok(r.findIndex((x) => x.f.id.startsWith("ref:")) > r.findIndex((x) => x.f.id === "g"), "your foods before the ones that would join them");
});
