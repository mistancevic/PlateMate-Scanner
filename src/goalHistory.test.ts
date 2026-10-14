import { test } from "node:test";
import assert from "node:assert/strict";
import { collapseLog, periodsOf, periodLine } from "./goalHistory";
import type { GoalEntry } from "./goal";

const e = (at: string, band: string, kcal: number, source: GoalEntry["source"] = "profile"): GoalEntry => ({ at, band, kcal, protein: 180, source });
// the log on board FX, G0: three tries on 6 October, one quick try on 12 October
const log = [e("2026-09-28T08:10:00", "recomp", 2400), e("2026-10-06T19:02:00", "fatloss", 2150), e("2026-10-06T19:03:10", "recomp", 2400),
  e("2026-10-06T19:04:30", "gainsteady", 2750), e("2026-10-06T19:05:40", "recomp", 2400), e("2026-10-09T07:40:00", "recomp", 2350, "exact"),
  e("2026-10-12T20:11:00", "fatloss", 2150, "quick"), e("2026-10-12T20:12:20", "recomp", 2400)];

test("trying goals leaves no trace: one goal per day, the last one; the same goal stays one period", () => {
  const c = collapseLog(log);
  assert.deepEqual(c.map((x) => `${x.at.slice(0, 10)} ${x.band} ${x.source}`), ["2026-09-28 recomp profile", "2026-10-09 recomp exact", "2026-10-12 recomp profile"]);
});
test("History as periods, newest first, each with the days it held", () => {
  const p = periodsOf(log);
  assert.equal(p.length, 3);
  assert.equal(periodLine(p[0]), "Since 12 October"); assert.equal(p[0].now, true);
  assert.equal(periodLine(p[1]), "9 to 11 October, 3 days");
  assert.equal(periodLine(p[2]), "28 September to 8 October, 11 days");
});
test("the same goal with new numbers after a weigh-in keeps its start and takes the newest numbers", () => {
  const c = collapseLog([e("2026-10-01T08:00:00", "fatloss", 2200), e("2026-10-05T08:00:00", "fatloss", 2150)]);
  assert.equal(c.length, 1); assert.equal(c[0].at, "2026-10-01T08:00:00"); assert.equal(c[0].kcal, 2150);
});
