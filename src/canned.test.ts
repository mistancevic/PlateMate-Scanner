import { test } from "node:test";
import assert from "node:assert/strict";
import { canOil, drainedOf, isDrained, libraryId, oilChoices, oilFood, packLine, packOf } from "./canned";
import { candidateFood } from "./pilot";

const tuna = { product_name: "Tuna in olive oil", brand: "Rio Mare", calories: 190, protein: 26, fats: 9.5, carbs: 0, fiber: 0, serving: { grams: 160, name: "can" }, pack: { net: 160, drained: 120, liquid: "olive oil", per: "drained" } };

test("DT82: My foods keeps the label as printed; the Plate gets the drained food and the oil", () => {
  const f = candidateFood(tuna, "label");
  assert.deepEqual(f.serving, { grams: 160, name: "can" }, "the can as sold, 160 g, as the pack prints it");
  assert.equal(f.calories, 190, "the label's values untouched");
  const d = drainedOf(f)!;
  assert.equal(d.name, "Tuna, drained"); assert.deepEqual(d.serving, { grams: 120, name: "can" }); assert.equal(d.calories, 190);
  assert.ok(isDrained(d) && libraryId(d.id) === f.id, "its own id, back to the food in My foods");
  assert.equal(d.pack!.can, "Tuna in olive oil", "the can's name for the line on top");
  assert.equal(drainedOf(d), null, "never drained twice");
  assert.deepEqual(canOil(f), { grams: 40, refId: "olive-oil", kind: "olive oil" });
  assert.deepEqual(oilChoices(40).map((c) => c.grams), [0, 10, 40]);
  const o = oilFood(d, () => "x")!;
  assert.equal(o.name, "Olive oil from the can"); assert.equal(o.calories, 884); assert.equal(o.fats, 100);
  assert.equal(packLine(f), "In olive oil: 160 g, 120 g drained. The values are per 100 g drained. On the Plate the can comes as two foods: Tuna, drained, 120 g, and Olive oil from the can, up to 40 g, if you add it.");
  assert.equal(drainedOf(candidateFood({ ...tuna, product_name: "Thunfisch in Olivenöl" }, "label"))!.name, "Thunfisch, drained");
});

test("DT82: water brings no oil; the whole contents or an unknown basis stay one food", () => {
  const water = candidateFood({ ...tuna, product_name: "Tuna in water", pack: { ...tuna.pack, liquid: "water" } }, "label");
  assert.equal(canOil(water), null); assert.equal(drainedOf(water)!.name, "Tuna, drained");
  assert.match(packLine(water)!, /comes as Tuna, drained, 120 g\.$/);
  const whole = candidateFood({ ...tuna, pack: { ...tuna.pack, per: "whole" } }, "label");
  assert.equal(canOil(whole), null); assert.equal(drainedOf(whole), null);
  assert.match(packLine(whole)!, /whole contents, olive oil included, so the can is one food, 160 g\./);
  const unknown = candidateFood({ ...tuna, pack: { ...tuna.pack, per: "unknown" } }, "label");
  assert.equal(drainedOf(unknown), null); assert.match(packLine(unknown)!, /Check it\.$/);
  assert.equal(packOf({ net: 160, drained: 200, liquid: "olive oil", per: "drained" })!.drained, null, "drained above net is a misread");
  assert.equal(packOf({ net: 0, liquid: "oil" }), undefined);
  assert.equal(candidateFood({ product_name: "Skyr", serving: { grams: 150, name: "pot" } }, "label").pack, undefined, "no pack, no change");
});
