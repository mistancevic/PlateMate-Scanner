import { test } from "node:test";
import assert from "node:assert/strict";
import { slotsOf } from "./slots";
import { choicesOf, fromKey, keyOf, nextMeal, nextPurpose, lineOf, hintOf, titleOf, prepDates, datesWord, plural, EXPLORING } from "./purpose";

const slots = slotsOf({ meals: 3, window: null }); // 07:30, 13:45, 20:00
const at = (h: number, m = 0) => new Date(2026, 9, 17, h, m);

test("the chips: Exploring, the day's meals, a snack off the plan when the plan has none, Meal prep, Plan it", () => {
  assert.deepEqual(choicesOf(slots).map((c) => c.label), ["Exploring", "Breakfast", "Lunch", "Dinner", "Snack", "Meal prep", "Plan it"]);
  const four = slotsOf({ meals: 4, window: null });
  assert.deepEqual(choicesOf(four).map((c) => c.label), ["Exploring", "Breakfast", "Lunch", "Snack", "Dinner", "Meal prep", "Plan it"]);
});

test("a tap on a chip; Meal prep starts from the picked meal, four portions, into the plan", () => {
  assert.deepEqual(fromKey("meal:dinner", EXPLORING, null, slots), { kind: "meal", slotId: "dinner" });
  assert.deepEqual(fromKey("prep", { kind: "meal", slotId: "lunch" }, null, slots), { kind: "prep", slotId: "lunch", n: 4, toPlan: true });
  assert.deepEqual(fromKey("prep", EXPLORING, null, slots), { kind: "prep", slotId: "lunch", n: 4, toPlan: true });
  assert.equal(keyOf(fromKey("plan", EXPLORING, null, slots)), "plan");
  assert.equal(keyOf(fromKey("exploring", { kind: "snack" }, null, slots)), "exploring");
});

test("the next meal is never one whose time has passed (0.2.26 picked breakfast at 20:06)", () => {
  assert.equal(nextMeal(slots, new Set(["lunch", "dinner"]), at(20, 6)), null);
  assert.equal(nextMeal(slots, new Set(), at(20, 6))?.id, "dinner");
  assert.equal(nextMeal(slots, new Set(), at(12))?.id, "lunch");
  assert.deepEqual(nextPurpose(slots, new Set(["lunch", "dinner"]), at(20, 6)), { kind: "snack" });
  assert.deepEqual(nextPurpose(slots, new Set(), at(19)), { kind: "meal", slotId: "dinner" });
});

test("the line and the hint say what the plate is for, with the plan's numbers", () => {
  const share = { kcal: 933, protein: 60 };
  assert.equal(lineOf(EXPLORING, slots, null, "PD 6.4"), "Exploring · not sized for a meal");
  assert.equal(lineOf({ kind: "meal", slotId: "dinner" }, slots, share, "PD 6.4"), "Dinner, 20:00 · 933 kcal · 60 g protein · PD 6.4");
  assert.equal(lineOf({ kind: "prep", slotId: "lunch", n: 4, toPlan: true }, slots, share, "PD 6.4"), "Meal prep · 4 lunches · 933 kcal · 60 g protein · PD 6.4 each");
  assert.equal(hintOf({ kind: "meal", slotId: "dinner" }, slots, share, "PD 6.4"), "Dinner, 20:00: 933 kcal · 60 g protein · PD 6.4, from your plan for today.");
  assert.match(hintOf(EXPLORING, slots, null, "PD 6.4"), /^Exploring: nothing is sized for a meal/);
  assert.equal(titleOf({ kind: "meal", slotId: "dinner" }, slots, "Chef Mealan").title, "What are you craving for dinner?");
  assert.equal(titleOf(EXPLORING, slots, "Chef Mealan").title, "Add a recipe or foods");
  assert.equal(titleOf({ kind: "prep", slotId: "lunch", n: 4, toPlan: true }, slots, "Chef Mealan").title, "What are you prepping?");
});

test("meal prep: the next open slots for that meal, from tomorrow", () => {
  const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const taken = new Set(["2026-10-19"]);
  const dates = prepDates(4, "lunch", at(20, 6), (d) => ({ slot: true, taken: taken.has(d) }), ymd);
  assert.deepEqual(dates, ["2026-10-18", "2026-10-20", "2026-10-21", "2026-10-22"]);
  assert.equal(datesWord(dates), "Sun 18, Tue 20, Wed 21 and Thu 22");
  assert.equal(plural("lunch"), "lunches"); assert.equal(plural("dinner"), "dinners");
});
