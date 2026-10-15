import { test } from "node:test";
import assert from "node:assert/strict";
import { mealShare, mealNow, routeOf, solveMeal, type Add } from "./makeMeal";
import { slotsOf } from "./slots";
import type { Food } from "./pilot";

const slots = slotsOf({ meals: 3, window: null }); // 07:30, 13:45, 20:00
const food = (name: string, calories: number, protein: number): Food => ({ id: name, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats: 5, carbs: 10, fiber: null });
const CH = food("Chicken breast, cooked", 165, 31), CO = food("Cottage cheese", 98, 12), BR = food("Wholegrain bread", 250, 9), TO = food("Tomato", 18, 0.9), CU = food("Cucumber", 15, 0.7), OI = food("Olive oil", 884, 0);
let n = 0; const uid = () => `u${++n}`;

test("how big a meal is: what is left of the day over the meals still to come, a snack half", () => {
  assert.deepEqual(mealShare(slots, "lunch", { kcal: 2800, protein: 180 }, { kcal: 0, protein: 0 }, new Set()), { kcal: 933, protein: 60 });
  assert.deepEqual(mealShare(slots, "lunch", { kcal: 2800, protein: 180 }, { kcal: 472, protein: 36 }, new Set(["breakfast"])), { kcal: 1164, protein: 72 });
  const four = slotsOf({ meals: 4, window: null }); // breakfast, lunch, snack, dinner
  assert.deepEqual(mealShare(four, "snack", { kcal: 2800, protein: 180 }, { kcal: 0, protein: 0 }, new Set()), { kcal: 400, protein: 26 });
  assert.equal(mealShare(slots, "lunch", null, { kcal: 0, protein: 0 }, new Set()), null);
});

test("the meal a plate off the plan is for: the next one not eaten, by the time now", () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 15, h, m);
  assert.equal(mealNow(slots, new Set(), at(8, 30))?.id, "breakfast");
  assert.equal(mealNow(slots, new Set(), at(10))?.id, "lunch");
  assert.equal(mealNow(slots, new Set(["breakfast"]), at(8, 30))?.id, "lunch");
  assert.equal(mealNow(slots, new Set(), at(22))?.id, "dinner");
});

test("which way the plate goes: the quick fit when maths does it, Chef Mealan when it cannot", () => {
  // Milan's plate of 15 October: PD 16.8 against 6.4, but 477 kcal of a 933 kcal lunch
  assert.equal(routeOf({ pd: 16.8, target: 6.4, kcal: 477, need: 933, fit: null }), "chef");
  assert.equal(routeOf({ pd: 9, target: 6.4, kcal: 800, need: 933, fit: null }), "fit");
  assert.equal(routeOf({ pd: 4, target: 6.4, kcal: 600, need: 933, fit: { ok: true, kcal: 720 } }), "fit");
  assert.equal(routeOf({ pd: 4, target: 6.4, kcal: 200, need: 933, fit: { ok: true, kcal: 300 } }), "chef");
  assert.equal(routeOf({ pd: 2, target: 6.4, kcal: 600, need: 933, fit: { ok: false, kcal: 0 } }), "chef");
  assert.equal(routeOf({ pd: 16.8, target: 6.4, kcal: 477, need: null, fit: null }), "fit");
  assert.equal(routeOf({ pd: 3, target: 6.4, kcal: 1500, need: 933, fit: { ok: false, kcal: 0 } }), "fit"); // bigger than the meal
});

test("CH3: Chef Mealan's Balkan lunch lands on 927 kcal at PD 10.1; the bread's grams are the app's", () => {
  const plate = [{ id: "a", food: CH, grams: 200, locked: false }, { id: "b", food: CO, grams: 150, locked: false }];
  const adds: Add[] = [{ food: BR, grams: 100, base: true, have: true }, { food: TO, grams: 150, base: false, have: false }, { food: CU, grams: 150, base: false, have: false }, { food: OI, grams: 10, base: false, have: false }];
  const s = solveMeal(plate, adds, 933, 6.4, () => false, uid);
  assert.ok(s.ok);
  if (s.ok) { assert.equal(s.baseGrams, 125); assert.equal(s.kcal, 927); assert.equal(Math.round(s.pd! * 10) / 10, 10.1); assert.equal(s.items.filter((i) => !i.locked).length, 1); }
  assert.match((solveMeal(plate, adds, 933, 6.4, (f) => f.name === "Tomato", uid) as any).why, /allergy/);
  assert.match((solveMeal(plate, [{ food: OI, grams: 60, base: false, have: false }, { food: BR, grams: 100, base: true, have: true }], 933, 6.4, () => false, uid) as any).why, /under a portion/);
  assert.match((solveMeal(plate, [{ food: TO, grams: 100, base: true, have: false }], 933, 6.4, () => false, uid) as any).why, /not a portion/);
  const sweet = food("Honey", 304, 0.3);
  assert.match((solveMeal([{ id: "c", food: CO, grams: 100, locked: false }], [{ food: sweet, grams: 50, base: true, have: false }], 600, 6.4, () => false, uid) as any).why, /under the target/);
});
