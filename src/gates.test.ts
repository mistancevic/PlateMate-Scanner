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

// DT132 (0.2.113, board Stories88): on the edge
const salmon = F("sal", "Salmon, baked", 208, 20, 13, 0, 0), avocado = F("avo", "Avocado", 160, 2, 15, 9, 7);
test("DT132: fat within 2 points of half passes on the edge, with the number, the line and the fattiest food", () => {
  const r = nutritionGate({ items: [I(salmon, 200), I(rice, 80), I(avocado, 60)], kind: "meal", beforeTraining: false, mealWord: "lunch" }) as any;
  assert.equal(r.ok, true);
  assert.match(r.edge, /^Fat is about half of this lunch's energy: 5[01] percent, and the line is 50\.$/);
  assert.match(r.hint, /a little less salmon, or a protein side/);
  const over = nutritionGate({ items: [I(salmon, 200), I(avocado, 150)], kind: "meal", beforeTraining: false, mealWord: "lunch" });
  assert.equal(over.ok, false, "well over the line stays a fail");
  assert.equal((nutritionGate({ items: [I(chicken, 180), I(rice, 200)], kind: "meal", beforeTraining: false, mealWord: "lunch" }) as any).edge, undefined, "clear of the line: no note");
});
test("DT132: the day's edges: before training 570 to 630 kcal, after training 13 to 17 g protein; a fail wins", () => {
  const at = new Date(2026, 9, 25, 13, 0);
  const d = (items: Ingredient[], moment: any) => dayGate({ items, moment, now: at, window: null, kind: "meal", mealWord: "lunch", needsCooking: () => false }) as any;
  assert.match(d([I(rice, 460)], "before").edge, /^Before training 598 kcal, and the line is 600\./);
  assert.equal(d([I(rice, 520)], "before").ok, false);
  assert.match(d([I(chicken, 50), I(rice, 20)], "after").edge, /After training this plate has 16 g protein, and the line is 15\./);
  assert.equal(d([I(chicken, 30), I(rice, 100)], "after").ok, false);
});
test("DT132, C31: the plate's size: over 1.5 portions is not the meal yet; 1.3 to 1.5 on the edge", async () => {
  const { sizeOf } = await import("./gates");
  assert.deepEqual([sizeOf(1400, 1000).big, sizeOf(1400, 1000).edge], [false, true]);
  assert.deepEqual([sizeOf(1550, 1000).big, sizeOf(1550, 1000).edge], [true, false]);
  assert.deepEqual([sizeOf(1100, 1000).big, sizeOf(1100, 1000).edge], [false, false]);
  assert.equal(sizeOf(1400, 100).big, false, "no meal size under 150 kcal");
});
