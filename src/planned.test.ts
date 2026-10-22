import { test } from "node:test";
import assert from "node:assert/strict";
import { withPlanned, needOf, fitOf, sumOf, fromMeal, leftOf, dayOff, fitPortions, usualPortions, plannedPortion, amountText } from "./planned";
import type { Slot } from "./slots";

const slots: Slot[] = [{ id: "breakfast", name: "Breakfast", time: "07:30" }, { id: "lunch", name: "Lunch", time: "12:30" }, { id: "snack", name: "Snack", time: "16:00" }, { id: "dinner", name: "Dinner", time: "20:00" }];
const food = { id: "f", name: "Skyr", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories: 63, protein: 11, fats: 0.2, carbs: 4, fiber: 0 } as any;

test("a meal goes into a slot and comes out again; an empty date disappears", () => {
  const a = withPlanned({}, "2026-10-12", "lunch", { title: "Sarma", kcal: 410, protein: 21, source: "starter" });
  assert.equal(a["2026-10-12"].lunch.title, "Sarma");
  const b = withPlanned(a, "2026-10-12", "lunch", null);
  assert.deepEqual(b, {});
});
test("what a slot needs: the day shared out, a snack half a meal", () => {
  const n = needOf(slots, slots[1], { kcal: 2100, protein: 175 });
  assert.deepEqual(n, { kcal: 600, protein: 50 });
  assert.deepEqual(needOf(slots, slots[2], { kcal: 2100, protein: 175 }), { kcal: 300, protein: 25 });
  assert.equal(needOf(slots, slots[0], null), null);
});
test("the mark: fits within a point of the target, else how far under", () => {
  assert.equal(fitOf({ kcal: 640, protein: 52 }, 8.2).state, "fits");
  const u = fitOf({ kcal: 410, protein: 21 }, 8.2);
  assert.equal(u.state, "under"); assert.equal(u.text, "3.1 under");
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 8.2, "pct").text, "12 % under");
  assert.equal(fitOf({ kcal: 410, protein: 21 }, null).state, "none");
});
test("the day as planned adds up", () => {
  const s = sumOf({ lunch: { title: "a", kcal: 640, protein: 52, source: "starter" }, dinner: { title: "b", kcal: 360, protein: 28, source: "mine" } });
  assert.equal(s.kcal, 1000); assert.equal(s.protein, 80); assert.equal(s.n, 2); assert.equal(Math.round(s.pd! * 10) / 10, 8);
});
test("a recipe becomes a planned meal at its portion", () => {
  const m = fromMeal({ id: "m", title: "Skyr bowl", items: [{ id: "i", food, grams: 300, locked: true }], portion: 150, savedAt: "" }, "mine");
  assert.equal(m.kcal, 95); assert.equal(m.protein, 17); assert.equal(m.source, "mine"); assert.equal(m.mealId, "m");
});

test("R16: I ate it logs one portion of the planned recipe, as the plan counts it", async () => {
  const { plannedPortion, fromMeal } = await import("./planned");
  const food = (id: string, calories: number, protein: number, fats: number, carbs: number) => ({ id, name: id, brand: "", basis: "100g", source: "estimate", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats, carbs, fiber: null }) as any;
  const recipe = { id: "r1", title: "Fritters", items: [{ id: "a", food: food("dough", 302, 8, 10, 45), grams: 2000, locked: true }, { id: "b", food: food("glaze", 400, 0, 0, 100), grams: 340, locked: true }], portion: 195, savedAt: "" } as any;
  const planned = fromMeal(recipe, "mine");
  const meal = plannedPortion(planned, "r1", "2026-10-19T07:05:00Z")!;
  assert.ok(Math.abs(meal.portion - 195) < 0.5, "one portion: " + meal.portion);
  const { parseState, aggregate, KEYS } = await import("./pilot");
  assert.ok(meal.portion <= aggregate(meal.items).weight, "the portion never weighs more than its foods");
  const st = { version: 1, goals: Object.fromEntries(KEYS.map((k) => [k, null])), foods: [], items: [], meals: [], feedback: [{ id: "f1", meal, status: "eaten", taste: "", notes: "", createdAt: "2026-10-19T07:05:00Z" }], preferences: "", title: "", portion: null };
  assert.doesNotThrow(() => parseState(JSON.stringify(st)), "the logged meal is read back");
  const kcal = meal.items.reduce((n, i) => n + (i.food.calories * i.grams) / 100, 0);
  assert.ok(Math.abs(kcal - planned.kcal) <= 1, `the log counts what the plan counts: ${kcal} vs ${planned.kcal}`);
  assert.equal(plannedPortion({ title: "Skyr bowl", kcal: 420, protein: 46, source: "starter" }, "x", ""), null, "a starter has no foods to log");
});

// DT74 (board DT74, Anna's first run): the day adds up
test("DT74: a slot has what is left once the other slots are planned; with nothing planned it is the share", () => {
  const day = { kcal: 2100, protein: 175 };
  assert.deepEqual(leftOf(slots, slots[1], day, {}), needOf(slots, slots[1], day));
  const held = { breakfast: { title: "Skyr bowl", kcal: 420, protein: 46, source: "starter" as const } };
  // 2100 − 420 = 1680 shared by Lunch, Snack (half) and Dinner: 2.5 shares, lunch one
  assert.deepEqual(leftOf(slots, slots[1], day, held), { kcal: 672, protein: 52 });
  // a skipped breakfast counts nothing: the day is shared by the other three; the slot being swapped does not count itself
  assert.deepEqual(leftOf(slots, slots[1], day, { breakfast: { ...held.breakfast, skipped: true } }), { kcal: 840, protein: 70 });
  assert.deepEqual(leftOf(slots, slots[0], day, held), needOf(slots, slots[0], day));
  assert.deepEqual(leftOf(slots, slots[1], day, { breakfast: { title: "Huge", kcal: 3000, protein: 200, source: "starter" } }), { kcal: 0, protein: 0 });
});
test("DT74: fits only when it fits; within a point under is close; size named against what is left", () => {
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 5.6).state, "close");               // Sarma, PD 5.1 against 5.6
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 5.6).text, "close");
  assert.equal(fitOf({ kcal: 420, protein: 46 }, 5.6).state, "fits");
  assert.equal(fitOf({ kcal: 640, protein: 52 }, 8.2).state, "fits");                 // 8.1: the same number on screen
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 8.2).state, "under");
  const big = fitOf({ kcal: 640, protein: 52 }, 7, "pd", { kcal: 400, protein: 30 });
  assert.equal(big.size, "big"); assert.equal(big.state, "close"); assert.equal(big.text, "big for this slot");
  assert.equal(fitOf({ kcal: 260, protein: 28 }, 6, "pd", { kcal: 700, protein: 45 }).text, "small for this slot");
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 8.2, "pd", { kcal: 700, protein: 45 }).text, "3.1 under · small for this slot");
});
test("DT74: a full day off by more than a tenth says so; fitting the portions lands it; back to the usual undoes it", () => {
  assert.deepEqual(dayOff({ kcal: 1350, n: 3 }, { kcal: 2100 }, 0), { by: 750, short: true });
  assert.equal(dayOff({ kcal: 1350, n: 3 }, { kcal: 2100 }, 1), null);                  // a slot still open: not yet
  assert.equal(dayOff({ kcal: 2000, n: 3 }, { kcal: 2100 }, 0), null);                  // within a tenth: land around
  assert.deepEqual(dayOff({ kcal: 2500, n: 3 }, { kcal: 2100 }, 0), { by: 400, short: false });
  const held = { a: { title: "A", kcal: 420, protein: 46, source: "starter" as const }, b: { title: "B", kcal: 480, protein: 36, source: "starter" as const }, c: { title: "C", kcal: 450, protein: 34, source: "starter" as const, skipped: true } };
  const fit = fitPortions(held, { kcal: 2100 });
  assert.equal(fit.c, held.c);                                                            // skipped stays
  assert.equal(fit.a.amount, 2); assert.equal(fit.a.kcal, 840);                          // never more than double
  const fair = fitPortions({ a: held.a, b: held.b }, { kcal: 1200 });
  assert.equal(fair.a.amount, 1.35); assert.ok(Math.abs(fair.a.kcal + fair.b.kcal - 1200) / 1200 <= 0.1);
  assert.equal(amountText(fair.a), "1.35 portions"); assert.equal(amountText(held.a), null);
  const back = usualPortions(fair);
  assert.equal(back.a.amount, undefined); assert.equal(back.a.kcal, 420); assert.equal(back.b.kcal, 480);
});
test("DT74: a fitted meal is eaten at its amount", () => {
  const m = fromMeal({ id: "m", title: "Skyr bowl", items: [{ id: "i", food, grams: 200, locked: true }], portion: 200, savedAt: "" } as any, "mine");
  const one = plannedPortion(m, "x", "")!, more = plannedPortion({ ...m, amount: 1.5 }, "x", "")!;
  assert.equal(Math.round(more.items[0].grams), Math.round(one.items[0].grams * 1.5));
});
