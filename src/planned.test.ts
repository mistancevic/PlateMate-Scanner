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
