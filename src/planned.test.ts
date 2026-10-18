import { test } from "node:test";
import assert from "node:assert/strict";
import { withPlanned, needOf, fitOf, sumOf, fromMeal } from "./planned";
import type { Slot } from "./slots";

const slots: Slot[] = [{ id: "breakfast", name: "Breakfast", time: "07:30" }, { id: "lunch", name: "Lunch", time: "12:30" }, { id: "snack", name: "Snack", time: "16:00" }, { id: "dinner", name: "Dinner", time: "20:00" }];
const food = { id: "f", name: "Skyr", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories: 63, protein: 11, fats: 0.2, carbs: 4, fiber: 0 } as any;

test("a meal goes into a slot and comes out again; an empty date disappears", () => {
  const a = withPlanned({}, "2026-10-12", "lunch", { title: "Sarma", kcal: 410, protein: 21, source: "starter" });
  assert.equal(a["2026-10-12"].lunch.title, "Sarma");
  const b = withPlanned(a, "2026-10-12", "lunch", null);
  assert.deepEqual(b, {});
});
test("what a slot needs: the day shared out, a snack half a meal", () => {
  const n = needOf(slots, slots[1], { kcal: 2100, protein: 175 });
  assert.deepEqual(n, { kcal: 600, protein: 50 });
  assert.deepEqual(needOf(slots, slots[2], { kcal: 2100, protein: 175 }), { kcal: 300, protein: 25 });
  assert.equal(needOf(slots, slots[0], null), null);
});
test("the mark: fits within a point of the target, else how far under", () => {
  assert.equal(fitOf({ kcal: 640, protein: 52 }, 8.2).state, "fits");
  const u = fitOf({ kcal: 410, protein: 21 }, 8.2);
  assert.equal(u.state, "under"); assert.equal(u.text, "3.1 under");
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 8.2, "pct").text, "12 % under");
  assert.equal(fitOf({ kcal: 410, protein: 21 }, null).state, "none");
});
test("the day as planned adds up", () => {
  const s = sumOf({ lunch: { title: "a", kcal: 640, protein: 52, source: "starter" }, dinner: { title: "b", kcal: 360, protein: 28, source: "mine" } });
  assert.equal(s.kcal, 1000); assert.equal(s.protein, 80); assert.equal(s.n, 2); assert.equal(Math.round(s.pd! * 10) / 10, 8);
});
test("a recipe becomes a planned meal at its portion", () => {
  const m = fromMeal({ id: "m", title: "Skyr bowl", items: [{ id: "i", food, grams: 300, locked: true }], portion: 150, savedAt: "" }, "mine");
  assert.equal(m.kcal, 95); assert.equal(m.protein, 17); assert.equal(m.source, "mine"); assert.equal(m.mealId, "m");
});

test("R16: I ate it logs one portion of the planned recipe, as the plan counts it", async () => {
  const { plannedPortion, fromMeal } = await import("./planned");
  const food = (id: string, calories: number, protein: number, fats: number, carbs: number) => ({ id, name: id, brand: "", basis: "100g", source: "estimate", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats, carbs, fiber: null }) as any;
  const recipe = { id: "r1", title: "Fritters", items: [{ id: "a", food: food("dough", 302, 8, 10, 45), grams: 2000, locked: true }, { id: "b", food: food("glaze", 400, 0, 0, 100), grams: 340, locked: true }], portion: 195, savedAt: "" } as any;
  const planned = fromMeal(recipe, "mine");
  const meal = plannedPortion(planned, "r1", "2026-10-19T07:05:00Z")!;
  assert.ok(Math.abs(meal.portion - 195) < 0.5, "one portion: " + meal.portion);
  const { parseState, aggregate, KEYS } = await import("./pilot");
  assert.ok(meal.portion <= aggregate(meal.items).weight, "the portion never weighs more than its foods");
  const st = { version: 1, goals: Object.fromEntries(KEYS.map((k) => [k, null])), foods: [], items: [], meals: [], feedback: [{ id: "f1", meal, status: "eaten", taste: "", notes: "", createdAt: "2026-10-19T07:05:00Z" }], preferences: "", title: "", portion: null };
  assert.doesNotThrow(() => parseState(JSON.stringify(st)), "the logged meal is read back");
  const kcal = meal.items.reduce((n, i) => n + (i.food.calories * i.grams) / 100, 0);
  assert.ok(Math.abs(kcal - planned.kcal) <= 1, `the log counts what the plan counts: ${kcal} vs ${planned.kcal}`);
  assert.equal(plannedPortion({ title: "Skyr bowl", kcal: 420, protein: 46, source: "starter" }, "x", ""), null, "a starter has no foods to log");
});
