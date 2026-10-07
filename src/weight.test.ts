import { test } from "node:test";
import assert from "node:assert/strict";
import { withWeighIn, avg7, trendOf, expectedChange, weighInsOff, verdictNote } from "./weight";

const now = new Date("2026-10-07T09:00:00");
const ago = (n: number) => new Date(now.getTime() - n * 864e5);
// weigh-ins over 4 weeks, every other day plus the last week daily, rising by `perWeek` kg, with morning noise
function series(start: number, perWeek: number) {
  let l: any[] = [];
  for (let d = 27; d >= 0; d--) if (d % 2 === 0 || d < 7 || d > 21) l = withWeighIn(l, start + (perWeek * (27 - d)) / 7 + ((d * 7) % 5 - 2) * 0.15, ago(d));
  return l;
}
test("one weigh-in per date; the newest replaces; the 7-day average", () => {
  let l = withWeighIn([], 96.04, ago(2)); l = withWeighIn(l, 95.6, ago(1)); l = withWeighIn(l, 95.8, ago(1));
  assert.equal(l.length, 2); assert.equal(l[1].kg, 95.8); assert.equal(l[0].kg, 96);
  assert.equal(avg7(l, now), 95.9);
  assert.equal(avg7(withWeighIn([], 90, ago(10)), now), null, "older than 7 days does not count");
});
test("what each goal expects over 3 weeks, in kg", () => {
  assert.deepEqual(expectedChange("gainsteady", 96, 3, "3p").map((x) => Math.round(x * 100) / 100), [0.17, 0.33]);
  assert.deepEqual(expectedChange("fatloss", 80, 3).map((x) => Math.round(x * 10) / 10), [-2.4, -1.2]);
  assert.deepEqual(expectedChange("maintain", 70, 3), [-0.5, 0.5]);
});
test("the trend: on track, faster, slower, and not enough weigh-ins yet", () => {
  assert.equal(trendOf(series(96, 0.08), "gainsteady", 96, "3p", now).verdict, "on track");
  assert.equal(trendOf(series(96, 0.4), "gainsteady", 96, "3p", now).verdict, "faster");
  assert.equal(trendOf(series(96, -0.1), "gainsteady", 96, "3p", now).verdict, "slower");
  assert.equal(trendOf(series(85, -0.6), "fatloss", 85, undefined, now).verdict, "on track");
  assert.equal(trendOf(series(85, -1.5), "fatloss", 85, undefined, now).verdict, "faster");
  assert.equal(trendOf(series(70, 0.5), "maintain", 70, undefined, now).verdict, "up");
  const few = trendOf(withWeighIn([], 96, ago(1)), "gainsteady", 96, "3p", now);
  assert.equal(few.verdict, "too few"); assert.match(verdictNote("gainsteady", "too few")!, /3 weigh-ins in the first week/);
  assert.match(verdictNote("gainsteady", "faster")!, /100 kcal off/);
});
test("an eating situation switches weigh-ins off", () => {
  assert.equal(weighInsOff({ situations: ["eating"] }), true);
  assert.equal(weighInsOff({ situations: ["allergies"] }), false);
});
