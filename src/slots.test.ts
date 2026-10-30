import test from "node:test";
import assert from "node:assert/strict";
import { slotsOf, defaultTimes, rowsOf, trainingTime, trainingWhen, slotAt, toTime } from "./slots";

test("three meals a day with no window sit at 07:30, 13:45 and 20:00", () => {
  const s = slotsOf({ meals: 3, window: null });
  assert.deepEqual(s.map((x) => [x.id, x.name, x.time]), [["breakfast", "Breakfast", "07:30"], ["lunch", "Lunch", "13:45"], ["dinner", "Dinner", "20:00"]]);
});
test("the eating window sets the first and the last slot", () => {
  const s = slotsOf({ meals: 3, window: { from: "10:00", to: "18:00" } });
  assert.deepEqual(s.map((x) => x.time), ["10:00", "14:00", "18:00"]);
});
test("meals a day unset means three; two means lunch and dinner; five holds two snacks with their own ids", () => {
  assert.equal(slotsOf({ window: null }).length, 3);
  assert.deepEqual(slotsOf({ meals: 2, window: null }).map((x) => x.name), ["Lunch", "Dinner"]);
  assert.deepEqual(slotsOf({ meals: 5, window: null }).map((x) => x.id), ["breakfast", "snack", "lunch", "snack2", "dinner"]);
});
test("a changed time wins over the default, by the slot's id", () => {
  const s = slotsOf({ meals: 3, window: null, slotTimes: { lunch: "12:30" } });
  assert.equal(s[1].time, "12:30"); assert.equal(s[0].time, "07:30");
});
test("times round to five minutes and stay in the day", () => {
  assert.equal(toTime(13 * 60 + 47), "13:45"); assert.equal(toTime(24 * 60 + 10), "00:10");
  assert.deepEqual(defaultTimes(1, null), ["18:00"], "DT134: one meal a day starts at 18:00");
});
test("the training row: a clock time only when set; a part of the day as words; nothing set at the end (board FX, TT2)", () => {
  const training = { work: true, kind: "strength" as const, intensity: "hard" as const, when: "evening" as const, minutes: 60 };
  assert.equal(trainingTime(training), null, "a part of the day is no clock time");
  assert.equal(trainingTime({ ...training, at: "18:15" }), "18:15");
  assert.equal(trainingTime({ work: true, kind: "rest" as const, at: "18:15" }), null);
  const order = (d: any) => rowsOf(slotsOf({ meals: 3, window: null }), d).map((r) => (r.kind === "slot" ? r.slot.id : "training"));
  assert.deepEqual(order(training), ["breakfast", "lunch", "training", "dinner"], "the evening sits before dinner");
  assert.deepEqual(order({ ...training, at: "21:00" }), ["breakfast", "lunch", "dinner", "training"], "a set time places it");
  assert.deepEqual(order({ ...training, when: undefined }), ["breakfast", "lunch", "dinner", "training"], "nothing set: the end of the day");
  assert.equal(trainingWhen(training)!.label, "Evening");
  assert.equal(trainingWhen({ ...training, when: undefined })!.phrase, "training, no time set");
  assert.equal(trainingWhen({ ...training, at: "18:15" })!.phrase, "training at 18:15");
});
test("a meal at 12:50 belongs to the 13:45 lunch; one at 03:00 belongs to nothing", () => {
  const s = slotsOf({ meals: 3, window: null });
  assert.equal(slotAt(s, "12:50")?.id, "lunch"); assert.equal(slotAt(s, "03:00"), null);
});

test("DT134: one meal a day: one slot, Meal; the window an hour from it; 2 to 5 as before", async () => {
  const { slotsOf, windowOf } = await import("./slots");
  assert.deepEqual(slotsOf({ meals: 1, window: null }), [{ id: "meal", name: "Meal", time: "18:00" }]);
  assert.deepEqual(windowOf({ meals: 1, window: null, slotTimes: { meal: "19:30" } }), { from: "19:30", to: "20:30" });
  assert.deepEqual(windowOf({ meals: 3, window: { from: "07:00", to: "21:00" } }), { from: "07:00", to: "21:00" });
  assert.equal(slotsOf({ meals: 2, window: null }).length, 2);
});

// DT147 (0.2.128, board Stories99 version 2; Tester 3 works Canadian hours from Cyprus): work hours count
import { workHoursOf, workMealTimes, suggestWhen, whenAtWork, timesFromWork } from "./slots";
import { withDay } from "./plan";
test("DT147: work hours from the chips and from My hours; none for flexible, shifts, study or home", () => {
  assert.deepEqual(workHoursOf({ hours: "fixed", slot: "9-5" }), { from: "09:00", to: "17:00" });
  assert.deepEqual(workHoursOf({ weekdays: "work", hours: "fixed", slot: "my", workFrom: "16:00", workTo: "23:00" }), { from: "16:00", to: "23:00" });
  assert.deepEqual(workHoursOf({ hours: "fixed", slot: "my", workFrom: "22:00", workTo: "06:00" }), { from: "22:00", to: "06:00" }, "past midnight");
  assert.equal(workHoursOf({ hours: "flexible", slot: "9-5" }), null);
  assert.equal(workHoursOf({ weekdays: "study", hours: "fixed", slot: "9-5" }), null);
  assert.equal(workHoursOf({ hours: "fixed", slot: "my" }), null, "My hours without From and To");
});
test("DT147: meal times around work; the usual ones stay when they already fit", () => {
  assert.equal(workMealTimes(3, { from: "09:00", to: "17:00" }), null, "9 to 5 keeps 07:30, 13:45, 20:00");
  assert.equal(workMealTimes(4, { from: "08:00", to: "16:00" }), null, "8 to 4 keeps the usual four");
  assert.deepEqual(workMealTimes(3, { from: "07:00", to: "15:00" }), ["06:00", "11:00", "18:00"]);
  assert.deepEqual(workMealTimes(3, { from: "16:00", to: "23:00" }), ["10:00", "15:00", "19:30"], "Tester 3: late morning, an hour before work, the break");
  assert.deepEqual(workMealTimes(4, { from: "16:00", to: "23:00" }), ["10:00", "15:00", "19:30", "23:30"]);
  assert.deepEqual(workMealTimes(2, { from: "16:00", to: "23:00" }), ["15:00", "19:30"]);
  assert.equal(workMealTimes(3, { from: "22:00", to: "06:00" }), null, "night work keeps the usual times");
  const l = { meals: 3, hours: "fixed" as const, slot: "my" as const, workFrom: "16:00", workTo: "23:00" };
  assert.deepEqual(slotsOf(l).map((s) => s.time), ["10:00", "15:00", "19:30"]);
  assert.deepEqual(slotsOf({ ...l, slotTimes: { breakfast: "09:15" } }).map((s) => s.time), ["09:15", "15:00", "19:30"], "a time you set wins");
  assert.equal(timesFromWork(l), true);
  assert.equal(timesFromWork({ ...l, slotTimes: { breakfast: "09:15", lunch: "14:00", dinner: "20:00" } }), false, "all set by hand");
  assert.deepEqual(slotsOf({ ...l, window: { from: "07:00", to: "21:00" } }).map((s) => s.time), ["07:00", "14:00", "21:00"], "an eating window set before stays");
});
test("DT147: training is suggested outside work; every part stays open", () => {
  const w = { from: "16:00", to: "23:00" };
  assert.equal(whenAtWork("evening", w), true);
  assert.equal(whenAtWork("morning", w), false);
  assert.equal(suggestWhen("evening", w), "morning");
  assert.equal(suggestWhen("evening", { from: "09:00", to: "17:00" }), "evening");
  assert.equal(suggestWhen("evening", null), "evening");
  const plan = Array.from({ length: 7 }, () => ({ work: true, kind: "rest" as const }));
  assert.equal(withDay(plan, 1, { level: "moderate" }, w)[1].when, "morning");
  assert.equal(withDay(plan, 1, { level: "moderate", when: "evening" }, w)[1].when, "evening", "picked by you, in work hours: kept");
});

// DT166 (0.3.8, board Stories118): wake-up and bedtime set the first and last meal
import { sleepWindow, startTimes } from "./slots";
test("DT166: wake-up and bedtime set the first and last meal; the middle answers keep 07:30 and 20:00", () => {
  assert.deepEqual(sleepWindow({ wake: "early", bed: "early" }), { from: "06:30", to: "19:00" });
  assert.deepEqual(sleepWindow({ wake: "mid", bed: "mid" }), { from: "07:30", to: "20:00" });
  assert.deepEqual(sleepWindow({ wake: "late", bed: "late" }), { from: "09:30", to: "22:00" });
  assert.equal(sleepWindow({ wake: "varies", bed: "varies" }), null);
  assert.equal(sleepWindow({}), null);
  assert.deepEqual(slotsOf({ meals: 3, window: null, wake: "early", bed: "early" }).map((s) => s.time), ["06:30", "12:45", "19:00"]);
  assert.deepEqual(slotsOf({ meals: 3, window: null, wake: "late", bed: "late" }).map((s) => s.time), ["09:30", "15:45", "22:00"]);
  assert.deepEqual(slotsOf({ meals: 3, window: null, wake: "mid", bed: "mid" }).map((s) => s.time), ["07:30", "13:45", "20:00"]);
  assert.equal(startTimes(3, { window: null, wake: "early" }).from, "sleep");
});
test("DT166: your own time, an eating window and fixed work hours still come first; one meal stays 18:00", () => {
  assert.deepEqual(slotsOf({ meals: 3, window: null, wake: "early", bed: "early", slotTimes: { breakfast: "07:00" } }).map((s) => s.time), ["07:00", "12:45", "19:00"]);
  assert.equal(startTimes(3, { window: { from: "08:00", to: "21:00" }, wake: "early" }).from, "window");
  assert.deepEqual(slotsOf({ meals: 1, window: null, wake: "early", bed: "early" }).map((s) => s.time), ["18:00"]);
  // 9 to 5, up after 8:00: work comes first, breakfast not before you wake, at most as work starts
  assert.deepEqual(slotsOf({ meals: 3, window: null, weekdays: "work", hours: "fixed", slot: "9-5", wake: "late", bed: "late" }).map((s) => s.time), ["09:00", "13:00", "18:30"]);
  // 9 to 5, up before 6:00: the sleep times already sit around work
  assert.equal(startTimes(3, { window: null, weekdays: "work", hours: "fixed", slot: "9-5", wake: "early", bed: "early" }).from, "sleep");
  // work alone, no sleep answers: as since 0.2.128
  assert.deepEqual(slotsOf({ meals: 3, window: null, weekdays: "work", hours: "fixed", slot: "7-3" }).map((s) => s.time), ["06:00", "11:00", "18:00"]);
});
