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
