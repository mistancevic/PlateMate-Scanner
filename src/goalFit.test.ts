// DT335 (0.3.184, board Stories284; Go 23 November 2026, 14:13): the limits are WHO's weight lines and Gallagher 2000's
// body fat lines; a target body weight with its pace.
import { test } from "node:test";
import assert from "node:assert/strict";
import { unfitOf, fatTop, healthyKg, targetCheck, targetProgress, whyLines } from "./goalFit";

const now = new Date("2026-11-23T12:00:00");

test("DT335 AC2: too light greys the goals that mean eating less", () => {
  assert.deepEqual(unfitOf({ sex: "female", birthYear: 1998, heightCm: 168, weightKg: 48 }, now), { ids: ["recomp", "fatloss"], why: "light" });
  assert.equal(unfitOf({ sex: "female", birthYear: 1998, heightCm: 168, weightKg: 53 }, now), null, "53 kg at 168 cm is inside the line");
  assert.deepEqual(healthyKg(168), { low: 53, high: 70 });
});

test("DT335 AC3: too much body fat greys the goals that mean eating more, only with body fat given", () => {
  assert.deepEqual(unfitOf({ sex: "female", birthYear: 1990, heightCm: 168, weightKg: 82, bodyFatPct: 38 }, now), { ids: ["healthy", "gain", "gainsteady"], why: "fat" });
  assert.equal(unfitOf({ sex: "female", birthYear: 1990, heightCm: 168, weightKg: 82 }, now), null, "no body fat given: nothing greyed on the heavy side");
  assert.equal(unfitOf({ sex: "male", birthYear: 1990, heightCm: 180, weightKg: 98, bodyFatPct: 15 }, now), null, "a muscular man");
  assert.equal(unfitOf({ sex: "female", birthYear: 1990, heightCm: 168, weightKg: 70, bodyFatPct: 33 }, now), null, "33 % is the top of the range, still in");
});

test("DT335: the body fat lines by sex and age (Gallagher 2000)", () => {
  assert.deepEqual([fatTop("female", 25), fatTop("female", 45), fatTop("female", 65)], [33, 34, 36]);
  assert.deepEqual([fatTop("male", 25), fatTop("male", 45), fatTop("male", 65)], [20, 22, 25]);
});

test("DT335 AC5: a target to gain to, roughly 1 kg a month, up to the healthy weight", () => {
  const b = { heightCm: 168, weightKg: 48 };
  assert.deepEqual(targetCheck("healthy", 55, b), { ok: true, kind: "healthy", diff: 7, months: [7, 7] });
  assert.deepEqual(targetCheck("healthy", 71, b), { ok: false, reason: "tooHigh", limit: 70 });
  assert.deepEqual(targetCheck("healthy", 47, b), { ok: false, reason: "notAbove", limit: 48 });
  assert.deepEqual(targetCheck("healthy", 48.5, b), { ok: true, kind: "healthy", diff: 0.5, months: [1, 1] });
});

test("DT335 AC6: a target to lose to, 0.5 to 1 % a week, down to the underweight line, no top limit", () => {
  assert.deepEqual(targetCheck("fatloss", 72, { heightCm: 168, weightKg: 82 }), { ok: true, kind: "fatloss", diff: 10, months: [3, 6] });
  assert.deepEqual(targetCheck("fatloss", 52, { heightCm: 168, weightKg: 82 }), { ok: false, reason: "tooLow", limit: 53 });
  assert.equal(targetCheck("fatloss", 90, { heightCm: 180, weightKg: 95 })?.ok, true, "a muscular man aiming above BMI 25");
});

test("DT335 AC7: how far she has come", () => {
  assert.deepEqual(targetProgress(55, 48, 49), { done: 1, all: 7 });
  assert.deepEqual(targetProgress(72, 82, 79.5), { done: 2.5, all: 10 });
  assert.deepEqual(targetProgress(55, 48, 47), { done: 0, all: 7 });
});

test("DT335 AC4: the reason from her own numbers, no BMI number; with a coach, without one", () => {
  const light = { sex: "female" as const, birthYear: 1998, heightCm: 168, weightKg: 48 };
  const a = whyLines(unfitOf(light, now)!, light, null, now);
  assert.match(a.why, /48(\.0)? kg at 168 cm/); assert.doesNotMatch(a.why + a.next, /BMI/);
  assert.match(a.next, /height and weight in Profile/); assert.match(a.next, /doctor or a nutrition professional/);
  const b = whyLines(unfitOf(light, now)!, light, "Milan", now);
  assert.match(b.next, /Talk to Milan/); assert.match(b.next, /can set any goal/);
  const fat = { sex: "female" as const, birthYear: 1990, heightCm: 168, weightKg: 82, bodyFatPct: 38 };
  const c = whyLines(unfitOf(fat, now)!, fat, null, now);
  assert.match(c.why, /38 %.*woman of 36/); assert.match(c.next, /body fat in Profile/);
});
