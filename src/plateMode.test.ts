import test from "node:test";
import assert from "node:assert/strict";
import { plateWhenOf, mealOfDay, atMeal } from "./plateMode";

// DT149 (0.2.130): the past adds what you ate, the future plans, the moment is what you eat
test("DT149: the day of a plate decides what it is for", () => {
  const now = new Date("2026-10-29T12:10:00");
  assert.equal(plateWhenOf(null, now), "now", "a plate with no meal of a day is the moment");
  assert.equal(plateWhenOf({ date: "2026-10-30", time: "20:00" }, now), "plan", "tomorrow plans");
  assert.equal(plateWhenOf({ date: "2026-10-28", time: "20:00" }, now), "past", "yesterday adds what you ate");
  assert.equal(plateWhenOf({ date: "2026-10-29", time: "20:00" }, now), "plan", "later today plans");
  assert.equal(plateWhenOf({ date: "2026-10-29", time: "12:30" }, now), "now", "around the meal's time it is the moment");
  assert.equal(plateWhenOf({ date: "2026-10-29", time: "07:30" }, now), "past", "this morning's breakfast, long gone, adds what you ate");
  assert.equal(plateWhenOf({ date: "2026-10-30", time: "20:00", mode: "eat" }, now), "now", "from Today: what you eat");
});
test("DT149: a meal of a day in words, and the moment it counts at", () => {
  const now = new Date("2026-10-29T12:10:00");
  assert.equal(mealOfDay("2026-10-30", "Dinner", now), "tomorrow's dinner");
  assert.equal(mealOfDay("2026-10-28", "Lunch", now), "yesterday's lunch");
  assert.equal(mealOfDay("2026-10-31", "Breakfast", now), "Saturday's breakfast");
  assert.equal(new Date(atMeal("2026-10-28", "20:00")).getHours(), 20);
});
