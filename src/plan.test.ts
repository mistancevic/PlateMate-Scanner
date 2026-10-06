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

test("ISO weeks: 5 to 11 October 2026 is week 41; 22 to 28 June is week 26; 27 July is week 31", async () => {
  const { isoWeek, datesOfWeek } = await import("./plan");
  assert.equal(isoWeek(new Date(2026, 9, 6)).week, 41);
  assert.equal(isoWeek(new Date(2026, 5, 24)).week, 26);
  assert.equal(isoWeek(new Date(2026, 6, 27)).week, 31);
  const days = datesOfWeek(isoWeek(new Date(2026, 9, 6)).monday);
  assert.equal(days[0].getDate(), 5); assert.equal(days[6].getDate(), 11);
});

test("a change for one date never touches the usual week, and can be taken back", async () => {
  const { withDated, dayFor } = await import("./personal");
  const plan = Array.from({ length: 7 }, (_, i) => ({ work: i < 5, kind: "rest" as const }));
  const p0: any = { plan };
  const sat = new Date(2026, 9, 17);
  const p1 = withDated(p0, sat, { work: false, kind: "match", sport: "football", intensity: "hard" });
  assert.equal(dayFor(p1, sat)!.day.kind, "match"); assert.equal(dayFor(p1, sat)!.changed, true);
  assert.equal(dayFor(p1, new Date(2026, 9, 24))!.day.kind, "rest", "the next Saturday follows the usual week");
  assert.equal(p1.plan, plan, "the usual week is the same object");
  const p2 = withDated(p1, sat, null);
  assert.equal(dayFor(p2, sat)!.changed, false);
});

test("under 18: Schofield, the way to school, sport at school and a football training add up", async () => {
  const { calculate } = await import("./personal");
  const year = new Date().getFullYear();
  const p: any = { sex: "female", birthYear: year - 17, heightCm: 168, weightKg: 60, lifestyle: { commute: "bike" },
    plan: Array.from({ length: 7 }, (_, i) => ({ work: i < 5, kind: "rest" })) };
  const c = calculate(p, "maintain")!;
  // Schofield for girls 10 to 18: 13.384 x 60 + 692.6 = 1,495.6
  assert.equal(c.bmr, 1496);
  const day = { work: true, kind: "club", sport: "football", intensity: "hard", when: "lateafternoon", minutes: 90, pe: true } as const;
  const n = c.numbersOf(day as any);
  // 1,495.6 x 1.3 = 1,944; + bike 30 min (3 x 60 x 0.5 = 90); + sport at school 45 min (3 x 60 x 0.75 = 135); + football hard 90 min (8.5 x 60 x 1.5 = 765)
  assert.equal(n.kcal, 2950);
  assert.ok(n.how.some((x) => /Schofield/.test(x)) && n.how.some((x) => /sport at school/.test(x)) && n.how.some((x) => /cycling to school/.test(x)), n.how.join(" | "));
  // a calorie cut is never applied under 18
  assert.equal(calculate(p, "fatloss")!.numbersOf(day as any).kcal, 2950);
});
