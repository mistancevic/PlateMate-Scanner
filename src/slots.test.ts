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
  assert.deepEqual(defaultTimes(1, null), ["07:30"]);
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
