// DT290 (0.3.144, board Stories217): which meals a dish suits
import { test } from "node:test";
import assert from "node:assert/strict";
import { kindOfSlot, kindsByFoods, suitsOf, suitPenalty } from "./mealFit";
import { STARTERS, fillDay, type PlannedMeal } from "./planned";
const food = (name: string, kcal: number, protein: number) => ({ id: name, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", calories: kcal, protein, fats: 5, carbs: 10, fiber: 0 }) as any;
const meal = (title: string, items: [string, number][], kcal = 560, protein = 40, mealId?: string): PlannedMeal => ({ title, kcal, protein, source: "mine", mealId, items: items.map(([n, g], i) => ({ id: String(i), food: food(n, 120, 10), grams: g, locked: false })) });
test("DT290: the meal of a slot, in three languages", () => {
  assert.equal(kindOfSlot("Breakfast"), "breakfast"); assert.equal(kindOfSlot("Doručak"), "breakfast"); assert.equal(kindOfSlot("Abendessen"), "dinner"); assert.equal(kindOfSlot("Snack"), "snack"); assert.equal(kindOfSlot("Meal 2"), null);
});
test("DT290: by its foods, beans and rice is lunch or dinner, oats and skyr a breakfast", () => {
  assert.deepEqual(kindsByFoods(meal("Beans and rice", [["Kidney beans, cooked", 300], ["Rice, cooked", 150]])), ["lunch", "dinner"]);
  assert.deepEqual(kindsByFoods(meal("Oats bowl", [["Oats", 60], ["Skyr, natural", 200], ["Banana", 100]])), ["breakfast", "snack"]);
});
test("DT290: yours wins, then where you ate it, then the starters, then the foods", () => {
  const beans = meal("Beans and rice", [["Kidney beans, cooked", 300], ["Rice, cooked", 150]], 560, 30, "bea");
  assert.equal(suitsOf(beans, { goodFor: ["breakfast"] }, [], {})!.from, "yours");
  const fb = [1, 2].map((d) => ({ id: String(d), status: "eaten", recipeId: "bea", createdAt: "", slot: { date: "2026-11-1" + d, slotId: "breakfast", name: "Breakfast", time: "07:30" }, meal: { id: "x", title: "Beans and rice", items: [], savedAt: "" } })) as any;
  const h = suitsOf(beans, null, fb, {})!; assert.equal(h.from, "history"); assert.deepEqual(h.kinds, ["breakfast"]); assert.equal(h.usual, "breakfast");
  assert.equal(suitsOf(STARTERS.find((m) => m.title === "Protein pancakes")!, null, [], {})!.from, "starter");
  assert.equal(suitsOf(beans, null, [], {})!.from, "foods");
});
test("DT290: Fill gives breakfasts for breakfast while two or more fit", () => {
  const slot = { id: "breakfast", name: "Breakfast", time: "07:30" } as any;
  const ms = [meal("Beans and rice", [["Kidney beans, cooked", 300], ["Rice, cooked", 150]], 560, 45), meal("Chicken and rice", [["Chicken breast, cooked", 170], ["Rice, cooked", 150]], 560, 45), ...STARTERS.filter((m) => /pancakes|Skyr bowl|Omelette/.test(m.title))];
  const suits = (m: PlannedMeal) => suitsOf(m, null, [], {});
  const [row] = fillDay([slot], {}, ms, { kcal: 600, protein: 45 }, 7, undefined, undefined, suits);
  assert.ok(!/rice/i.test(row.meal.title), row.meal.title);
  assert.ok(row.ranked!.every((m) => !suitPenalty(suits(m), "breakfast")));
});
