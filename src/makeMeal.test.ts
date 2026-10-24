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
  // DT91 (0.2.88): too much oil stays too much even at half its amount and the smallest bread: it says so
  assert.match((solveMeal(plate, [{ food: OI, grams: 150, base: false, have: false }, { food: BR, grams: 100, base: true, have: true }], 933, 6.4, () => false, uid) as any).why, /^\d+ kcal, over the 840 to 1026 kcal of this meal, even with 50 g wholegrain bread$/);
  // a tomato cannot carry a dinner: 300 g is its most
  assert.match((solveMeal(plate, [{ food: TO, grams: 100, base: true, have: false }], 933, 6.4, () => false, uid) as any).why, /under the 840 to 1026 kcal of this meal, even with 300 g tomato/);
  const sweet = food("Honey", 304, 0.3);
  assert.match((solveMeal([{ id: "c", food: CO, grams: 100, locked: false }], [{ food: sweet, grams: 50, base: true, have: false }], 600, 6.4, () => false, uid) as any).why, /under the target/);
});

import { closedSlots, unloggedMeal } from "./makeMeal";
test("MS1: a meal eaten off the plan closes the meal nearest its time; dinner gets 937 of the 1,873 kcal left", () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 16, h, m).toISOString();
  const rec = { eaten: [], skipped: [], extras: [{ createdAt: at(13, 10) }] };
  const closed = closedSlots(slots, rec);
  assert.deepEqual([...closed], ["lunch"]);
  assert.deepEqual(mealShare(slots, "dinner", { kcal: 2800, protein: 180 }, { kcal: 927, protein: 94 }, new Set()), { kcal: 624, protein: 29 });
  assert.deepEqual(mealShare(slots, "dinner", { kcal: 2800, protein: 180 }, { kcal: 927, protein: 94 }, closed), { kcal: 937, protein: 43 });
  // between two windows (breakfast ends 09:00, lunch starts 12:45): no meal closes
  assert.equal(closedSlots(slots, { eaten: [], skipped: [], extras: [{ createdAt: at(10, 30) }] }).size, 0);
  // two plates at lunch: the second goes to the next meal in its window, if any
  assert.deepEqual([...closedSlots(slots, { eaten: [], skipped: [], extras: [{ createdAt: at(13, 10) }, { createdAt: at(14, 0) }] })], ["lunch"]);
});
test("MS2: a passed meal not logged is asked once; I skipped it gives its share to the meals to come", () => {
  const now = new Date(2026, 9, 16, 17, 30);
  const closed = new Set(["lunch"]);
  assert.equal(unloggedMeal(slots, closed, {}, now, "dinner")?.id, "breakfast");
  assert.equal(unloggedMeal(slots, closed, { breakfast: "had" }, now, "dinner"), null);
  assert.equal(unloggedMeal(slots, new Set(), {}, new Date(2026, 9, 16, 8, 30), "breakfast"), null);
  const skipped = closedSlots(slots, { eaten: [], skipped: [], extras: [{ createdAt: new Date(2026, 9, 16, 13, 10).toISOString() }] }, { breakfast: "skipped" });
  assert.deepEqual(mealShare(slots, "dinner", { kcal: 2800, protein: 180 }, { kcal: 927, protein: 94 }, skipped), { kcal: 1873, protein: 86 });
  // the CH1 example: 11:00, nothing logged: lunch stays 933; breakfast skipped: 1,400
  assert.deepEqual(mealShare(slots, "lunch", { kcal: 2800, protein: 180 }, { kcal: 0, protein: 0 }, new Set()), { kcal: 933, protein: 60 });
  assert.deepEqual(mealShare(slots, "lunch", { kcal: 2800, protein: 180 }, { kcal: 0, protein: 0 }, new Set(["breakfast"])), { kcal: 1400, protein: 90 });
});

test("DT91: the dinner lands in its range; the base stays a normal portion; the other foods carry the rest", () => {
  const CHK = food("Chicken breast, cooked", 165, 31), PE = food("Penne, dry", 359, 12.5), PA = food("Passata", 30, 1.3), PM = food("Parmesan", 392, 35);
  const plate = [{ id: "c", food: CHK, grams: 150, locked: false }];
  // 0.2.87's stand-in: the penne alone would be 137 g dry; now 110 g at most, and the passata, parmesan and oil grow with it
  const s = solveMeal(plate, [{ food: PE, grams: 80, base: true, have: false }, { food: PA, grams: 150, base: false, have: false }, { food: PM, grams: 15, base: false, have: false }, { food: OI, grams: 10, base: false, have: false }], 933, 6.4, () => false, uid);
  assert.ok(s.ok);
  if (s.ok) {
    assert.equal(s.baseGrams, 110);
    assert.ok(s.kcal >= 840 && s.kcal <= 1026, "in the range: " + s.kcal);
    assert.deepEqual(s.items.filter((i) => i.locked && i.id !== "c").map((i) => i.grams), [225, 25, 15]);
  }
  // the potato dinner that needed 632 g: potatoes at 400 g, the rest doubled, 866 kcal, in the range
  const PO = food("Potatoes, boiled", 87, 1.9), AJ = food("Ajvar", 85, 1.5), FE = food("Feta cheese", 264, 14);
  const b = solveMeal(plate, [{ food: PO, grams: 250, base: true, have: false }, { food: AJ, grams: 40, base: false, have: false }, { food: TO, grams: 120, base: false, have: false }, { food: FE, grams: 30, base: false, have: false }], 933, 6.4, () => false, uid);
  assert.ok(b.ok, (b as any).why);
  if (b.ok) { assert.equal(b.baseGrams, 400); assert.ok(b.kcal >= 840); }
  // the bulgur bowl stays under even at 250 g cooked bulgur: its card says why
  const BU = food("Bulgur, cooked", 83, 3.1), YO = food("Greek yogurt 2%", 73, 10);
  const c = solveMeal(plate, [{ food: BU, grams: 180, base: true, have: false }, { food: YO, grams: 100, base: false, have: false }, { food: CU, grams: 100, base: false, have: false }], 933, 6.4, () => false, uid);
  assert.ok(!c.ok);
  assert.match((c as { why: string }).why, /^\d+ kcal, under the 840 to 1026 kcal of this meal, even with 250 g bulgur, cooked$/);
});
