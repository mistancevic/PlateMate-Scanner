import { test } from "node:test";
import assert from "node:assert/strict";
import { setUnits, wText, wFrom, wDelta, hText, ftIn, parseFtIn, asC, asF, tempsIn, gramsFromMeasure, cleanUnits } from "./units";
import { cleanRead } from "./recipeIn";

test("UN: metric is the start; anything else in the saved data falls back to it", () => {
  assert.deepEqual(cleanUnits(undefined), { temp: "c", weight: "kg", height: "cm" });
  assert.deepEqual(cleanUnits({ temp: "f", weight: "stone", height: "ftin" }), { temp: "f", weight: "kg", height: "ftin" });
});

test("UN2: 95 kg is 209.4 lb and comes back as 209.4 lb; 182 cm is 6 ft 0 in", () => {
  setUnits({ weight: "lb", height: "ftin" });
  assert.equal(wText(95), "209.4 lb");
  assert.equal(wText(wFrom(209.4)), "209.4 lb");
  assert.equal(wDelta(-0.4), "−0.9 lb");
  assert.equal(hText(182), "6 ft 0 in");
  assert.deepEqual(ftIn(180), { ft: 5, inch: 11 });
  for (const s of ["6 ft 0 in", "6'0", "6 0", "6ft", "6 ft 0", "5'11\""]) assert.ok(parseFtIn(s), s);
  assert.equal(parseFtIn("6 ft 0 in"), 182.9);
  assert.equal(parseFtIn("5 ft 13 in"), null); assert.equal(parseFtIn("182"), null);
  setUnits({});
  assert.equal(wText(95), "95.0 kg"); assert.equal(hText(182), "182 cm"); assert.equal(wDelta(0.4), "+0.4 kg");
});

test("UN: oven heat rounds the way dials step; 350 °F is 175 °C, 180 °C is 350 °F, 200 °C is 400 °F; a core temperature to the degree", () => {
  assert.equal(asC(350), 175); assert.equal(asF(180), 350); assert.equal(asF(200), 400); assert.equal(asF(220), 425);
  assert.equal(asC(165), 74); assert.equal(asF(74), 165);
  assert.equal(tempsIn("Bake at 180 °C for 12 minutes.", "f"), "Bake at 350 °F for 12 minutes.");
  assert.equal(tempsIn("Preheat the oven to 350F.", "c"), "Preheat the oven to 175 °C.");
  assert.equal(tempsIn("Heat to 400 degrees F, then 2 c of milk.", "c"), "Heat to 205 °C, then 2 c of milk.");
  assert.equal(tempsIn("Bake at 180°C / 350°F.", "f"), "Bake at 180°C / 350°F.");
  assert.equal(tempsIn("Mix 2 eggs.", "f"), "Mix 2 eggs.");
});

test("UN: recipe measures turned into grams by code, per food kind; a measure we don't know stays the model's", () => {
  assert.equal(gramsFromMeasure("1 cup", "Flour"), 127.2);
  assert.equal(gramsFromMeasure("1/2 cup", "Sugar"), 100.8);
  assert.equal(gramsFromMeasure("2 tbsp", "Olive oil"), 27.6);
  assert.equal(gramsFromMeasure("2 tbsp", "Peanut butter"), 32.4);
  assert.equal(gramsFromMeasure("1 stick", "Butter"), 113);
  assert.equal(gramsFromMeasure("8 oz", "Chicken breast"), 226.8);
  assert.equal(gramsFromMeasure("1 lb", "Ground beef"), 453.6);
  assert.equal(gramsFromMeasure("1½ cups", "Milk"), 360);
  assert.equal(gramsFromMeasure("1 cup", "Spinach"), null);
  assert.equal(gramsFromMeasure("2 balls", "Mozzarella"), null);
  assert.equal(gramsFromMeasure("1", "Egg"), null);
  const r = cleanRead({ title: "Pancakes", servings: 2, items: [{ name: "flour", written: "1 cup", grams: 150, how: "converted", role: "base", calories: 364, protein: 10 }, { name: "spinach", written: "1 cup", grams: 30, how: "converted", role: "vegetable", calories: 23, protein: 3 }] })!;
  assert.deepEqual(r.items.map((i) => [i.grams, i.how]), [[127, "converted"], [30, "converted"]]);
});
