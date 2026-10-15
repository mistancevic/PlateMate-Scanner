import { test } from "node:test";
import assert from "node:assert/strict";
import { measure, gapOf, startOf, addDays, fullOf, daysFromLines, kgText, spanOf, type DayIn } from "./measured";
import type { DayLine } from "./dayLines";

// board FT, FT4: the first two weeks from Saturday 10 October; ate 2,380 on 12 full days, weight down 0.25 kg in 14 days
const START = "2026-10-10";
const days = (full: number[], kcal = 2380): Record<string, DayIn> => Object.fromEntries(Array.from({ length: 14 }, (_, i) => [addDays(START, i), { kcal, full: full.includes(i + 1), logged: true }]));
const weigh = (on: number[], perDay = -0.25 / 14, from = 95) => on.map((d) => ({ date: addDays(START, d - 1), kg: Math.round((from + perDay * (d - 1)) * 1000) / 1000 }));
const twelve = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

test("FT4: on day 14 the burn is what was eaten plus what the weight did, 7,700 kcal a kg", () => {
  const m = measure({ days: days(twelve), weighIns: weigh([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), today: "2026-10-23", start: START });
  assert.equal(m.day, 14);
  assert.equal(m.ready, true);
  assert.equal(m.fullDays, 12);
  assert.equal(m.ate, 2380);
  assert.equal(m.changeKg, -0.25);
  assert.equal(m.kcal, 2520); // 2,380 + 0.25 × 7,700 ÷ 14 = 2,517.5
  assert.deepEqual([m.lo, m.hi], [2445, 2595]); // a perfect line: never narrower than 75 either side
  assert.equal(m.phase, false);
});

test("FT3: day 6 is not ready, says what counts so far, and when it can be ready", () => {
  const ds = days([1, 2, 4, 5]); for (let i = 6; i <= 14; i++) delete ds[addDays(START, i - 1)];
  const m = measure({ days: ds, weighIns: weigh([2, 3, 5, 6]), today: "2026-10-15", start: START });
  assert.equal(m.day, 6);
  assert.equal(m.ready, false);
  assert.equal(m.phase, true);
  assert.equal(m.fullDays, 4);
  assert.equal(m.weighIns, 2); // days 2 and 3 are water: weigh-ins count from day 4
  assert.equal(m.readyOn, "2026-10-23");
  assert.equal(m.kcal, null);
  assert.deepEqual(m.squares.slice(0, 7).map((s) => s.state), ["full", "full", "part", "full", "full", "today", "todo"]);
  assert.deepEqual(m.squares.filter((s) => s.weighed).map((s) => s.date), ["2026-10-11", "2026-10-12", "2026-10-14", "2026-10-15"]);
});

test("too few full days or weigh-ins: not ready, even on day 14; then it goes on with the last 14 days", () => {
  const few = measure({ days: days([1, 2, 3, 4, 5, 6, 7, 8, 9]), weighIns: weigh([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), today: "2026-10-23", start: START });
  assert.equal(few.ready, false);
  assert.equal(few.phase, true);
  const later = measure({ days: { ...days(twelve), ...Object.fromEntries([14, 15].map((i) => [addDays(START, i), { kcal: 2380, full: true, logged: true }])) }, weighIns: weigh([4, 6, 8, 10, 12, 14, 16]), today: "2026-10-26", start: START });
  assert.equal(later.from, "2026-10-13");
  assert.equal(later.ready, true);
  const thin = measure({ days: days(twelve), weighIns: weigh([4, 6, 8, 10, 12, 14]), today: "2026-10-23", start: START });
  assert.equal(thin.ready, false);
});

test("people already using the app: the last 14 days, no first two weeks", () => {
  const m = measure({ days: days(twelve), weighIns: weigh([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), today: "2026-10-24", start: "2026-08-01" });
  assert.equal(m.start, null);
  assert.equal(m.day, null);
  assert.equal(m.phase, false);
  assert.equal(m.from, "2026-10-11");
  assert.equal(m.ready, true);
  assert.deepEqual(m.squares, []);
});

test("the more the weigh-ins sit off the line, the wider the range", () => {
  const noisy = weigh([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]).map((w, i) => ({ ...w, kg: w.kg + (i % 2 ? 0.4 : -0.4) }));
  const m = measure({ days: days(twelve), weighIns: noisy, today: "2026-10-23", start: START });
  assert.ok(m.hi! - m.lo! > 150);
});

test("FT7: a gap of more than 15 % from the formula gets a line; lower points at unlogged meals", () => {
  const m = measure({ days: days(twelve), weighIns: weigh([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), today: "2026-10-23", start: START });
  assert.equal(gapOf(m, 2650)!.line, null);
  assert.equal(gapOf(m, 2650)!.kcal, -130);
  assert.match(gapOf(m, 3100)!.line!, /unlogged/);
  assert.match(gapOf(m, 2100)!.line!, /busier/);
});

test("the start is the first goal's date; a full day closes every planned meal and every slot", () => {
  assert.equal(startOf({ setAt: "2026-10-12T10:00:00" }, [{ at: "2026-10-10T09:00:00" }]), "2026-10-10");
  assert.equal(startOf(null, []), null);
  const base: DayLine = { date: "2026-10-12", when: "past", planned: 3, byPlan: 3, swapped: 0, skipped: 0, missed: 0, open: 0, kcal: 2200, protein: 180, target: null, lived: true, slots: [], extras: [], training: null, slotCount: 3 };
  assert.equal(fullOf(base), true);
  assert.equal(fullOf({ ...base, planned: 1, byPlan: 1 }), false); // only breakfast logged on a three-meal day
  assert.equal(fullOf({ ...base, planned: 2, byPlan: 2, extras: [{ title: "Pizza", kcal: 900, protein: 30 }] }), true);
  assert.equal(fullOf({ ...base, missed: 1, byPlan: 2 }), false);
  assert.equal(fullOf({ ...base, when: "today" }), false);
  assert.equal(daysFromLines({ x: { ...base, full: false } }).x.full, false);
  assert.equal(kgText(-0.25), "0.25 kg");
  assert.equal(kgText(0.3), "0.3 kg");
  assert.equal(spanOf("2026-10-10", "2026-10-23"), "10 to 23 October");
});
