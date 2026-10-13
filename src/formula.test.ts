import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate, restingBurn, schofieldAdult, schofieldBand, formulaFor, type Personal } from "./personal";

// Schofield as a third formula (canvas board TW, F1, 13 October 2026). The worked example on the board: a man, 45, 182 cm, 95 kg.
const year = new Date().getFullYear();
const man: Personal = { sex: "male", birthYear: year - 45, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting" } };

test("Schofield's adult bands: 18 to 30, 30 to 60, over 60, by sex and weight", () => {
  assert.equal(Math.round(schofieldAdult("male", 45, 95)), 1963);
  assert.equal(Math.round(schofieldAdult("male", 25, 70)), 1746);
  assert.equal(Math.round(schofieldAdult("female", 45, 60)), 1333);
  assert.equal(Math.round(schofieldAdult("female", 65, 60)), 1203);
  assert.equal(schofieldBand(29), "18 to 30"); assert.equal(schofieldBand(30), "30 to 60"); assert.equal(schofieldBand(60), "over 60");
});
test("the resting burn from each formula; Katch McArdle needs body fat", () => {
  assert.equal(restingBurn(man, "mifflin"), 1868);
  assert.equal(restingBurn(man, "schofield"), 1963);
  assert.equal(restingBurn(man, "katch"), null);
  assert.equal(restingBurn({ ...man, bodyFatPct: 20 }, "katch"), 2012);
});
test("the pick: the coach's pin wins, then the person's, then Automatic", () => {
  assert.equal(formulaFor(man), "mifflin");
  assert.equal(formulaFor({ ...man, bodyFatPct: 20 }), "katch");
  assert.equal(formulaFor({ ...man, formula: "schofield" }), "schofield");
  assert.equal(formulaFor({ ...man, formula: "schofield" }, "mifflin"), "mifflin");
});
test("Schofield moves only the resting burn, and the lines name it", () => {
  const m = calculate(man, "maintain")!, s = calculate({ ...man, formula: "schofield" }, "maintain")!;
  assert.equal(s.bmr - m.bmr, 95);
  assert.equal(s.protein, m.protein);
  assert.equal(Math.round((s.tdee - m.tdee) / 10) * 10, 120, "about 120 kcal a day with a sitting job");
  assert.match(s.method, /^Schofield \(30 to 60\)/);
  assert.match(s.weekdays![0].how[0], /1,963 at rest \(Schofield, 30 to 60: sex and weight\)/);
  // Katch McArdle picked without body fat falls back to Mifflin St Jeor
  assert.equal(calculate({ ...man, formula: "katch" }, "maintain")!.bmr, m.bmr);
});
