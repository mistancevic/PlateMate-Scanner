import { test } from "node:test";
import assert from "node:assert/strict";
import { dayLineOf, wordsOf } from "./dayLines";
import { slotsOf } from "./slots";

// the coach's week (board CW): one line a day from Plan and the cards
const slots = slotsOf({ meals: 3, window: null });
const food = { id: "f", name: "x", brand: "", basis: "100g", source: "label", notes: "", calories: 100, protein: 10, fats: 3, carbs: 10, fiber: null } as any;
const card = (id: string, title: string, grams: number, slot?: { date: string; slotId: string }, mealId = id) => ({ id, status: "eaten", taste: "", notes: "", createdAt: "2026-10-14T12:00:00", slot, meal: { id: mealId, title, savedAt: "", portion: grams, items: [{ id: id + "i", food, grams, locked: false }] } }) as any;
const held = { breakfast: { title: "Oats", kcal: 500, protein: 50, source: "mine", mealId: "b" }, lunch: { title: "Sarma", kcal: 600, protein: 60, source: "mine", mealId: "l" }, dinner: { title: "Chicken", kcal: 700, protein: 70, source: "coach", mealId: "d" } } as any;
const target = { kcal: 1800, protein: 180 };

test("a day by the plan, lived: every meal eaten as planned, protein and energy on target", () => {
  const logged = [card("b", "Oats", 500, { date: "2026-10-12", slotId: "breakfast" }), card("l", "Sarma", 600, { date: "2026-10-12", slotId: "lunch" }), card("d", "Chicken", 700, { date: "2026-10-12", slotId: "dinner" })];
  const l = dayLineOf({ date: "2026-10-12", today: "2026-10-15", slots, held, logged, target, training: "strength, 60 min" });
  assert.equal(l.lived, true); assert.equal(l.byPlan, 3);
  assert.deepEqual(wordsOf(l), { status: "By the plan", tone: "lived", detail: "3 of 3 · strength, 60 min" });
});
test("a changed day: lunch swapped, dinner not eaten, an extra; a skipped meal is closed, not a change", () => {
  const logged = [card("b", "Oats", 500, { date: "2026-10-14", slotId: "breakfast" }), card("w", "Chicken wrap", 600, { date: "2026-10-14", slotId: "lunch" }), card("p", "Pizza", 1180)];
  const l = dayLineOf({ date: "2026-10-14", today: "2026-10-15", slots, held, logged, target, training: null });
  const w = wordsOf(l);
  assert.equal(w.status, "2 changes"); assert.equal(w.tone, "changed");
  assert.equal(w.detail, "lunch swapped, dinner not eaten · 1 extra: pizza, 1,180 kcal");
  assert.deepEqual(l.slots.map((s) => s.mark), ["plan", "swapped", "missed"]);
  const skippedDinner = { ...held, dinner: { ...held.dinner, skipped: true } };
  const l2 = dayLineOf({ date: "2026-10-14", today: "2026-10-15", slots, held: skippedDinner, logged: logged.slice(0, 2), target: { kcal: 1100, protein: 110 }, training: null });
  assert.equal(wordsOf(l2).status, "1 change", "the skip is not a change");
  assert.match(wordsOf(l2).detail, /1 skipped on purpose/);
});
test("today so far names the next meal; a day to come counts what is planned", () => {
  const logged = [card("b", "Oats", 500, { date: "2026-10-15", slotId: "breakfast" })];
  const t = dayLineOf({ date: "2026-10-15", today: "2026-10-15", slots, held, logged, target, training: null });
  assert.equal(wordsOf(t).status, "Today so far"); assert.match(wordsOf(t).detail, /^1 of 3 · lunch at /);
  const f = dayLineOf({ date: "2026-10-17", today: "2026-10-15", slots, held, logged: [], target, training: null });
  assert.equal(wordsOf(f).status, "3 planned");
});
