import test from "node:test";
import assert from "node:assert/strict";
import { shoppingList, shoppingText, shopGrams } from "./shopping";

const food = (name: string, brand = "") => ({ id: name, name, brand, basis: "100g", calories: 100, protein: 10, fats: 1, carbs: 10, fiber: 0, source: "label", notes: "", reviewedAt: "", readyToEat: true }) as any;
const it = (f: any, grams: number) => ({ id: f.name + grams, food: f, grams, locked: true });
const chicken = food("Chicken breast, raw"), rice = food("Rice, cooked"), skyr = food("Skyr, natural", "Arla");
// a recipe for four: 800 g chicken, 1,200 g rice; one portion is a quarter
const curry = { title: "Chicken curry", kcal: 600, protein: 50, source: "mine" as const, mealId: "c", items: [it(chicken, 800), it(rice, 1200)], portion: 500, servings: 4 };
const bowl = { title: "Skyr bowl", kcal: 300, protein: 30, source: "mine" as const, mealId: "s", items: [it(skyr, 250)], portion: 250 };
const starter = { title: "Chicken, rice and greens", kcal: 640, protein: 52, source: "starter" as const };

test("seven days of the plan, one portion per meal, every food added up by name", () => {
  const plan = { "2026-10-20": { lunch: curry, breakfast: bowl }, "2026-10-21": { lunch: curry, dinner: starter, snack: { ...bowl, skipped: true } }, "2026-10-30": { lunch: curry } };
  const l = shoppingList(plan, ["2026-10-20", "2026-10-21", "2026-10-22"]);
  assert.equal(l.meals, 4, "the skipped snack is left out; 30 October is outside the days");
  assert.deepEqual(l.lines.map((x) => [x.name, x.grams, x.meals]), [["Chicken breast, raw", 400, 2], ["Rice, cooked", 600, 2], ["Skyr, natural", 250, 1]]);
  assert.deepEqual(l.without, [{ date: "2026-10-21", title: "Chicken, rice and greens" }]);
});

test("grams read as a shop reads them, and the text leaves out what is ticked", () => {
  assert.equal(shopGrams(7.4), 7); assert.equal(shopGrams(0.2), 1); assert.equal(shopGrams(123), 120); assert.equal(shopGrams(605), 610);
  const l = shoppingList({ "2026-10-20": { lunch: curry, breakfast: bowl } }, ["2026-10-20"]);
  assert.equal(shoppingText(l, "20 to 26 October", new Set(["rice, cooked|"])), "Shopping list, 20 to 26 October\n\nChicken breast, raw: 200 g\nSkyr, natural (Arla): 250 g");
});
