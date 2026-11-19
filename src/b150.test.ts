// B150 (0.3.160, board B150): one day per record, and the repair of records that hold two days.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mealOnItsDay } from "./pilot";
import { mealAt, atMeal } from "./plateMode";

const local = (y: number, m: number, d: number, h: number, min: number) => new Date(y, m - 1, d, h, min).toISOString();

test("B150 AC12: a record with Tuesday's time and Wednesday's dinner becomes Tuesday's dinner", () => {
  const f = { status: "eaten", createdAt: local(2026, 11, 17, 19, 56), slot: { date: "2026-11-18", slotId: "dinner", name: "Dinner", time: "18:00" } };
  assert.equal(mealOnItsDay(f).slot.date, "2026-11-17");
  assert.equal(mealOnItsDay(f).slot.slotId, "dinner");
});
test("B150: a dinner logged after midnight for the evening before stays as it is", () => {
  const f = { status: "eaten", createdAt: local(2026, 11, 18, 0, 20), slot: { date: "2026-11-17", slotId: "dinner", name: "Dinner", time: "20:00" } };
  assert.equal(mealOnItsDay(f), f);
});
test("B150: a record of its own day, a planned card and a record with no meal stay as they are", () => {
  const a = { status: "eaten", createdAt: local(2026, 11, 17, 13, 0), slot: { date: "2026-11-17", slotId: "lunch" } };
  const b = { status: "planned", createdAt: local(2026, 11, 17, 13, 0), slot: { date: "2026-11-19", slotId: "lunch" } };
  const c = { status: "eaten", createdAt: local(2026, 11, 17, 13, 0) };
  assert.equal(mealOnItsDay(a), a); assert.equal(mealOnItsDay(b), b); assert.equal(mealOnItsDay(c), c);
});
test("B150 AC11: a meal of a day gone by is logged at that meal's time; a time still ahead is now", () => {
  const now = new Date(2026, 10, 15, 18, 0);
  assert.equal(mealAt("2026-11-14", "19:30", now), atMeal("2026-11-14", "19:30"));
  assert.equal(mealAt("2026-11-15", "13:45", now), atMeal("2026-11-15", "13:45"));
  assert.equal(mealAt("2026-11-15", "20:00", now), undefined);
});
