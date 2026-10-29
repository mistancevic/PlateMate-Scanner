import { test } from "node:test";
import assert from "node:assert/strict";
import { FAT_FOODS, fatCardOf } from "./explorerFats";

const F = (id: string) => FAT_FOODS.find((f) => f.id === id)!;

test("DT154: one portion against one meal: fat, saturated against the meal's share, EPA and DHA against the day", () => {
  const olive = fatCardOf(F("olive"), 26, 767);
  assert.deepEqual([olive.fat, olive.closes, olive.sat, olive.satMeal, olive.epaDha, olive.mostly], [14, 54, 1.9, 8.5, 0, "monounsaturated"]);
  const salmon = fatCardOf(F("salmon"), 26, 767);
  assert.deepEqual([salmon.epaDha, salmon.closes], [2940, 77]);
  const cheddar = fatCardOf(F("cheddar"), 26, 767);
  assert.deepEqual([cheddar.sat, cheddar.mostly, cheddar.unsatToSat], [5.7, "saturated", 0.5]);
  assert.ok(fatCardOf(F("butter"), 10, 300).sat > fatCardOf(F("butter"), 10, 300).satMeal, "a small meal: butter goes over");
});

test("DT154: the members add up, and the ratios say what is there", () => {
  for (const f of FAT_FOODS) assert.ok(f.omega6 + f.ala <= f.pufa + 0.05, f.id + ": omega-6 and omega-3 fit inside polyunsaturated (the table rounds)");
  assert.equal(fatCardOf(F("almonds"), 26, 767).omega6To3, null);
  assert.equal(fatCardOf(F("walnuts"), 26, 767).omega6To3, 4.2);
  assert.equal(fatCardOf(F("olive"), 26, 767).members.trans, null);
  for (const f of FAT_FOODS) assert.match(f.src, /^USDA SR Legacy/, f.id);
});
