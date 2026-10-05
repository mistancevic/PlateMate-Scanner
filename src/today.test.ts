import test from "node:test";
import assert from "node:assert/strict";
import { dayLog, loggedLine, daysAgo, dayLabel } from "./today";
const food = { id: "s", name: "Skyr", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories: 63, protein: 11, fats: 0.2, carbs: 4, fiber: 0 } as any;
const card = (status: string, day: Date, grams = 300, dayType?: string) => ({ id: Math.random() + "", meal: { id: "m", title: "Bowl", items: [{ id: "i", food, grams, locked: false }], portion: grams, savedAt: "" }, status, taste: "", notes: "", createdAt: new Date(day).toISOString(), dayType }) as any;
test("a day sums only what was eaten and keeps prepared cards apart", () => {
  const today = new Date();
  const log = dayLog([card("eaten", today), card("prepared", today), card("not-used", today), card("eaten", daysAgo(1))], today);
  assert.equal(log.logged.length, 1); assert.equal(log.prepared.length, 1); assert.equal(Math.round(log.kcal), 189); assert.equal(Math.round(log.protein), 33);
});
test("the line is information, never a verdict", () => {
  const today = new Date();
  assert.equal(loggedLine(dayLog([card("eaten", today, 300)], today), true), "1 meal logged, 189 kcal and 33 g protein so far.");
  assert.equal(loggedLine(dayLog([], daysAgo(2)), false), "Nothing logged.");
});
test("day labels", () => { assert.equal(dayLabel(daysAgo(0)), "Today"); assert.equal(dayLabel(daysAgo(1)), "Yesterday"); });
test("the day type comes from the cards of that day", () => { const d = daysAgo(1); assert.equal(dayLog([card("eaten", d, 300, "training")], d).dayType, "training"); });

test("five bands, every edge a multiple of the target: a bit under is on plan", async () => {
  const { fit, bandRange } = await import("./goal");
  const T = 5.5;
  assert.equal(fit(1.6, T), "below");   // Leibniz
  assert.equal(fit(3.5, T), "close");   // oats, 0.64 T
  assert.equal(fit(5.0, T), "plan");    // 0.91 T, a bit under: on plan
  assert.equal(fit(8.0, T), "plan");
  assert.equal(fit(12.0, T), "high");   // cottage cheese
  assert.equal(fit(17.5, T), "top");    // skyr
  assert.equal(fit(12.0, 7), "high");   // the same cottage cheese on a lose-fat target
  assert.equal(fit(12.0, 3.5), "top");   // 3.4 T on a high-energy target
  assert.equal(bandRange("plan", T), "5.0 to 8.3");
});

test("the line under the chips says the range and the partner, for the current target", async () => {
  const { bandHint, BAND_LABEL, BAND_LINE_IDLE } = await import("./goal");
  assert.equal(BAND_LABEL.below, "Low\u2212"); assert.equal(BAND_LABEL.close, "Low");
  assert.equal(bandHint("below", 5.5), "Low\u2212: PD under 3.3 for your 5.5. Pair with a High+ food to reach your plan.");
  assert.equal(bandHint("plan", 5.5), "On plan: PD 5.0 to 8.3 for your 5.5. Fine alone.");
  assert.equal(bandHint("plan", null), BAND_LINE_IDLE);
});
