import { test } from "node:test";
import assert from "node:assert/strict";
import { capOil } from "./frying";

const it = (name: string, written: string, grams: number, part?: string) => ({ name, written, grams, ...(part ? { part } : {}) });
test("R3: deep frying counts the oil the food takes up, 15% of the fried food; the glaze is not fried", () => {
  const fritters = [it("All-purpose flour", "4 1/2 cups (563g)", 563, "Dough"), it("Whole milk", "1 cup", 240, "Dough"), it("Apples", "3 cups", 360, "Filling"),
    it("Vegetable oil", "1 to 2 quarts (1 to 1.9 L)", 1380, "For shaping and frying"), it("Confectioners' sugar", "3 cups", 360, "Glaze")];
  const out = capOil(fritters, ["Heat the oil to 350°F.", "Fry 2 to 3 fritters at a time."]);
  const oil = out.find((x) => x.name === "Vegetable oil")!;
  assert.equal(oil.grams, Math.round((563 + 240 + 360) * 0.15));
  assert.deepEqual(oil.fry, { pot: 1380 });
  assert.equal(out.find((x) => x.name === "Whole milk")!.grams, 240, "every other food stays");
});
test("R3: a splash in a pan, a stir fry and a cake's oil are counted in full", () => {
  const pan = capOil([it("Chicken breast", "200g", 200), it("Olive oil", "a splash", 2)], ["Fry the chicken in the oil."]);
  assert.equal(pan[1].grams, 2); assert.equal((pan[1] as any).fry, undefined);
  const stir = capOil([it("Chicken", "500g", 500), it("Rice", "300g", 300), it("Sesame oil", "3 tbsp", 40)], ["Stir fry the chicken."]);
  assert.equal(stir[2].grams, 40);
  const muffins = capOil([it("Flour", "250g", 250), it("Sugar", "150g", 150), it("Vegetable oil", "1/2 cup", 110), it("Eggs", "2", 100)], ["Mix and bake for 20 minutes."]);
  assert.equal(muffins[2].grams, 110, "a cake's oil is part of the batter: no frying, no cap");
  const shortbread = capOil([it("Butter", "225g", 225), it("Flour", "300g", 300), it("Sugar", "100g", 100)], ["Fry nothing; bake."]);
  assert.equal(shortbread[0].grams, 225, "butter is never capped");
});
test("R3: a schnitzel in 1 cm of oil counts what the meat takes up", () => {
  const s = capOil([it("Pork cutlets", "4 (600g)", 600), it("Breadcrumbs", "100g", 100), it("Sunflower oil", "for frying, about 300 ml", 270)], ["Fry the cutlets in hot oil, 3 minutes a side."]);
  assert.equal(s[2].grams, 105); assert.deepEqual((s[2] as any).fry, { pot: 270 });
});
