import { test } from "node:test";
import assert from "node:assert/strict";
import { canOil, oilChoices, oilFood, packLine, packOf, packServing } from "./canned";
import { candidateFood } from "./pilot";

const tuna = { product_name: "Thunfisch in Olivenöl", brand: "Rio Mare", calories: 190, protein: 26, fats: 9.5, carbs: 0, fiber: 0, serving: { grams: 160, name: "can" }, pack: { net: 160, drained: 120, liquid: "olive oil", per: "drained" } };

test("DT82: a can in oil counts as its drained weight, and its oil can go on the plate", () => {
  const f = candidateFood(tuna, "label");
  assert.deepEqual(f.serving, { grams: 120, name: "can" }, "one can is the drained weight, not the 160 g read as the serving");
  assert.deepEqual(canOil(f), { grams: 40, refId: "olive-oil", kind: "olive oil" });
  assert.deepEqual(oilChoices(40).map((c) => c.grams), [0, 10, 40]);
  const o = oilFood(f, () => "x")!;
  assert.equal(o.name, "Olive oil from the can"); assert.equal(o.calories, 884); assert.equal(o.fats, 100);
  assert.match(packLine(f)!, /^In olive oil: 160 g, 120 g drained\. The values are per 100 g drained, so one can counts as 120 g\. The olive oil you pour off can go on the plate too\.$/);
});

test("DT82: water, brine, values for the whole contents, or an unknown basis make no oil to add", () => {
  assert.equal(canOil(candidateFood({ ...tuna, pack: { ...tuna.pack, liquid: "water" } }, "label")), null);
  const whole = candidateFood({ ...tuna, pack: { ...tuna.pack, per: "whole" } }, "label");
  assert.equal(canOil(whole), null); assert.deepEqual(whole.serving, { grams: 160, name: "can" });
  assert.match(packLine(whole)!, /whole contents, olive oil included, so one can counts as 160 g/);
  const unknown = candidateFood({ ...tuna, pack: { ...tuna.pack, per: "unknown" } }, "label");
  assert.deepEqual(unknown.serving, { grams: 160, name: "can" }, "an unknown basis keeps what the label read gave");
  assert.match(packLine(unknown)!, /Check it/);
  assert.equal(packOf({ net: 160, drained: 200, liquid: "olive oil", per: "drained" })!.drained, null, "drained above net is a misread");
  assert.equal(packOf({ net: 0, liquid: "oil" }), undefined);
  assert.deepEqual(packServing(packOf({ net: 400, drained: 240, liquid: "brine", per: "drained" }), "portion"), { grams: 240, name: "can" });
  assert.equal(candidateFood({ product_name: "Skyr", serving: { grams: 150, name: "pot" } }, "label").pack, undefined, "no pack, no change");
});
