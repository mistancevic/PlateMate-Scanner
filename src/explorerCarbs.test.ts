import { test } from "node:test";
import assert from "node:assert/strict";
import { CARB_FOODS, carbCardOf } from "./explorerCarbs";

const F = (id: string) => CARB_FOODS.find((f) => f.id === id)!;

test("DT155: one portion against one meal: carbs, fibre against the meal's share, GI band and GL", () => {
  const len = carbCardOf(F("lentils"), 94, 1 / 3);
  assert.deepEqual([len.carb, len.closes, len.fibre, len.fibreMeal, len.gl, len.band, len.mostly], [40.2, 43, 15.8, 8.3, 8, "low", "starch"]);
  const pasta = carbCardOf(F("pasta"), 94, 1 / 3);
  assert.deepEqual([pasta.closes, pasta.band, pasta.gl], [66, "low", 29]);
  assert.deepEqual([carbCardOf(F("potato"), 94, 1 / 3).band, carbCardOf(F("rice"), 94, 1 / 3).gl], ["high", 30]);
  assert.equal(carbCardOf(F("apple"), 94, 1 / 3).mostly, "sugars");
});

test("DT155: every food names its USDA row and its row in the GI table; the members add up to the carbs", () => {
  for (const f of CARB_FOODS) {
    assert.match(f.src, /^USDA SR Legacy, FDC \d+/, f.id);
    assert.ok(f.giRow.length > 3, f.id);
    const c = carbCardOf(f, 94, 1 / 3);
    assert.ok(Math.abs(c.members.starch + c.members.sugar + c.members.fibre - c.carb) < 0.1, f.id);
  }
});

test("DT157: fibre in two kinds, the soluble share from Li 2002 applied to the card's fibre; dry oats have none", () => {
  const len = carbCardOf(F("lentils"), 94, 1 / 3);
  assert.deepEqual([len.solubleShare, len.members.soluble, len.members.insoluble], [0.08, 1.19, 14.61]);
  assert.ok(Math.abs((len.members.soluble ?? 0) + (len.members.insoluble ?? 0) - (len.members.fibre ?? 0)) < 0.02);
  assert.deepEqual([carbCardOf(F("rice"), 94, 1 / 3).members.soluble, carbCardOf(F("rice"), 94, 1 / 3).solubleShare], [0, 0]);
  assert.deepEqual([carbCardOf(F("oats"), 94, 1 / 3).members.soluble, carbCardOf(F("oats"), 94, 1 / 3).solubleShare], [null, null]);
  assert.equal(carbCardOf(F("potato"), 94, 1 / 3).solubleShare, 0.48);
});
