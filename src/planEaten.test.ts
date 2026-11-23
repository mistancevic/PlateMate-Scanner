import { test } from "node:test";
import assert from "node:assert/strict";
import { eatenIn, withEaten } from "./planEaten";
import { dayRecord } from "./record";
import { deleteCard } from "./pastMeal";

const food = { id: "f", name: "Feta", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories: 200, protein: 17, fats: 14, carbs: 1, fiber: 0 } as any;
const DINNER = { date: "2026-11-23", slotId: "dinner", name: "Dinner", time: "18:00" };
const card = (id: string, grams: number, slot: any = DINNER, status = "eaten") => ({ id, meal: { id: "m", title: "Lazy Burek", items: [{ id: "i" + id, food, grams, locked: false }], portion: grams }, status, taste: "", notes: "", createdAt: "2026-11-23T17:28:00.000Z", slot }) as any;
const slots = [{ id: "breakfast", name: "Breakfast", time: "07:30" }, { id: "dinner", name: "Dinner", time: "18:00" }];

test("B167: a meal of the day is eaten when a record holds that day and that meal", () => {
  const log = [card("a", 500), card("b", 100, { ...DINNER, date: "2026-11-22" }), card("c", 100, DINNER, "prepared"), card("d", 100, { ...DINNER, slotId: "breakfast" })];
  assert.deepEqual(eatenIn(log, "2026-11-23", "dinner").map((f) => f.id), ["a"], "another day, a prepared one and another meal do not count");
});

test("B167: the day's numbers count what was eaten in a meal, in place of its plan", () => {
  const held = { dinner: { title: "Lazy Burek", kcal: 2318, protein: 113, source: "mine" as const }, breakfast: { title: "Skyr", kcal: 300, protein: 30, source: "mine" as const } };
  const n = withEaten(held, [card("a", 500), card("b", 100)], "2026-11-23");
  assert.equal(n.dinner.kcal, 1200, "both dishes of Dinner, 500 g and 100 g of feta");
  assert.equal(n.dinner.protein, 102);
  assert.equal(n.breakfast.kcal, 300, "a meal with nothing eaten counts its plan");
  assert.equal(withEaten({}, [card("a", 500)], "2026-11-23").dinner.kcal, 1000, "an emptied plan keeps the eaten meal");
  assert.equal(withEaten(held, [], "2026-11-23"), held, "nothing eaten: the plan as it is");
});

test("B167: a meal counts once by the plan, however many dishes it holds", () => {
  const r = dayRecord(slots, { dinner: { title: "Lazy Burek", kcal: 2318, protein: 113, source: "mine" } }, [card("a", 500), card("b", 100)], "2026-11-23");
  assert.equal(r.byPlan, 1); assert.equal(r.planned, 1); assert.equal(r.done, true);
  assert.equal(Math.round(r.kcal), 1200, "both dishes in the kcal");
});

test("B167: deleting the meal a cook saved ends the cook once eaten; a cook still cooking stays", () => {
  const s = { feedback: [card("a", 500), card("b", 100)], cook: { id: "k", title: "Lazy Burek", stage: "carry", cardId: "b", eatenAt: "2026-11-23T21:24:00Z", startedAt: "2026-11-23T20:30:00Z", plate: {}, ui: {} } } as any;
  const d = deleteCard(s, "b");
  assert.equal(d.cook, undefined, "the strip goes");
  assert.equal(d.feedback.length, 1);
  assert.equal(deleteCard(s, "a").cook, s.cook, "another meal deleted: the cook stays");
  const making = { ...s, cook: { ...s.cook, stage: "make" } };
  assert.equal((deleteCard(making, "b").cook as any).stage, "make", "a cook not eaten yet keeps going, without its card");
});
