import { test } from "node:test";
import assert from "node:assert/strict";
import { nutritionGate, dayGate, gramsLine } from "./gates";
import { needsCooking } from "./cookWords";
import type { Food, Ingredient } from "./pilot";

const F = (id: string, name: string, calories: number, protein: number, fats: number, carbs: number, fiber: number | null = null): Food =>
  ({ id, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats, carbs, fiber }) as Food;
const I = (food: Food, grams: number): Ingredient => ({ id: food.id, food, grams, locked: false });
const pb = F("pb", "Peanut butter", 588, 25, 50, 20, 6), keks = F("keks", "Leibniz Butterkeks", 460, 7, 14, 73, 2), whey = F("whey", "Whey protein powder, vanilla", 380, 78, 5, 7, 0);
const chicken = F("ch", "Chicken breast, cooked", 165, 31, 3.6, 0, 0), rice = F("rice", "Rice, cooked", 130, 2.7, 0.3, 28, 1), rawChicken = F("rch", "Chicken breast, raw", 120, 23, 2.6, 0, 0);
const banana = F("ban", "Banana", 89, 1.1, 0.3, 20, 2.6);

test("N27: fat over half a meal's energy", () => {
  const r = nutritionGate({ items: [I(pb, 60), I(keks, 30)], kind: "meal", beforeTraining: false, mealWord: "lunch" });
  assert.equal(r.ok, false); if (!r.ok) { assert.match(r.why, /More than half of this lunch's energy is fat: 6\d percent/); assert.deepEqual(r.ways, ["protein", "snack", "keep"]); }
  assert.equal(nutritionGate({ items: [I(pb, 60), I(keks, 30)], kind: "snack", beforeTraining: false, mealWord: "snack" }).ok, true, "a snack is not held to it");
});
test("N28: most of the protein from a supplement", () => {
  const r = nutritionGate({ items: [I(pb, 40), I(keks, 50), I(whey, 60)], kind: "meal", beforeTraining: false, mealWord: "lunch" });
  assert.equal(r.ok, false); if (!r.ok) assert.match(r.why, /Most of this lunch's protein comes from the powder: 47 of 6\d g/);
  assert.equal(nutritionGate({ items: [I(chicken, 180), I(rice, 200), I(whey, 10)], kind: "meal", beforeTraining: false, mealWord: "lunch" }).ok, true);
});
test("N29: carbs under 10 percent, before training only", () => {
  const plate = [I(chicken, 180), I(F("oil", "Olive oil", 884, 0, 100, 0, 0), 10)];
  assert.equal(nutritionGate({ items: plate, kind: "meal", beforeTraining: true, mealWord: "meal" }).ok, false);
  assert.equal(nutritionGate({ items: plate, kind: "meal", beforeTraining: false, mealWord: "meal" }).ok, true);
});
test("Your day, version 1: the moment and the time of day", () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 25, h, m);
  const base = { window: { from: "08:00", to: "21:00" }, kind: "meal", mealWord: "dinner", needsCooking };
  assert.equal(dayGate({ ...base, items: [I(chicken, 180), I(rice, 200)], moment: "regular", now: at(13) }).ok, true);
  const late = dayGate({ ...base, items: [I(chicken, 180), I(rice, 200)], moment: "regular", now: at(23, 10) });
  assert.equal(late.ok, false); if (!late.ok) assert.match(late.why, /23:10, and your eating window is 08:00 to 21:00/);
  const pot = dayGate({ ...base, items: [I(rawChicken, 200), I(rice, 150)], moment: "meeting", now: at(12) });
  assert.equal(pot.ok, false); if (!pot.ok) assert.match(pot.why, /A meeting wants nothing to cook, and chicken breast, raw needs a pot/);
  const after = dayGate({ ...base, items: [I(banana, 120), I(keks, 30)], moment: "after", now: at(18) });
  assert.equal(after.ok, false); if (!after.ok) assert.match(after.why, /After training protein comes first, and this plate has \d g/);
  assert.equal(dayGate({ ...base, items: [I(banana, 120)], moment: "before", now: at(17) }).ok, true);
  assert.equal(dayGate({ ...base, window: null, items: [I(chicken, 180), I(rice, 200)], moment: "regular", now: at(23) }).ok, true, "no window set, no check");
});
test("the grams line under the letters", () => {
  assert.equal(gramsLine({ fats: 22.4, carbs: 20.6, fiber: 9 }), "22 g fat · 21 g carbs · 9 g fibre");
  assert.equal(gramsLine({ fats: 22.4, carbs: 20.6, fiber: null }), "22 g fat · 21 g carbs · fibre ?");
});
