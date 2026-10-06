import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "./personal";
import { loadOf, planFromCounts, countsOf, type Plan } from "./plan";

// The worked example from the canvas, 6 October 2026: 95 kg, 182 cm, born 1981, desk job, Maintain.
const plan: Plan = [
  { work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 },
  { work: true, kind: "rest" },
  { work: true, kind: "cardio", intensity: "moderate", when: "morning", minutes: 45 },
  { work: true, kind: "yoga", intensity: "easy", when: "evening", minutes: 30 },
  { work: true, kind: "strength", intensity: "moderate", when: "morning", minutes: 60 },
  { work: false, kind: "walk", intensity: "easy", when: "day", minutes: 60 },
  { work: false, kind: "rest" },
];
const me: any = { sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, lifestyle: { hours: "fixed", slot: "9-5", move: "sitting" }, plan };

test("each day of the plan: resting burn x the work baseline, plus its activity at its intensity", () => {
  const c = calculate(me, "maintain")!;
  assert.deepEqual(c.weekdays!.map((d) => d.kcal), [2900, 2450, 2850, 2500, 2800, 2650, 2450]);
  assert.equal(c.kcal, 2650, "the week's average is the mean of the seven days");
  assert.equal(c.protein, 180, "two or more moderate or hard days: 1.6 to 2.2 g per kg, middle 1.9 x 95");
  assert.equal(c.fats, Math.round((2650 * 0.3) / 9));
  assert.equal(c.weekdays![0].carbs, Math.round((2900 - 180 * 4 - c.fats * 9) / 4));
  assert.ok(c.weekdays![0].how.some((l) => /6 METs × 95 kg × 1 h/.test(l)), c.weekdays![0].how.join(" | "));
});

test("load: rest, light, moderate, hard; counts follow the plan", () => {
  assert.deepEqual(plan.map(loadOf), ["hard", "passive", "easy", "active", "easy", "active", "passive"]);
  assert.deepEqual(countsOf(plan), { passive: 2, active: 2, easy: 2, hard: 1 });
});

test("the old My week counts become a starting plan, work Monday to Friday", () => {
  const p = planFromCounts({ passive: 2, active: 1, easy: 2, hard: 2 });
  assert.deepEqual(countsOf(p), { passive: 2, active: 1, easy: 2, hard: 2 });
  assert.deepEqual(p.map((d) => d.work), [true, true, true, true, true, false, false]);
});
