import { test } from "node:test";
import assert from "node:assert/strict";
import { asDish, portionOf, servingsOf } from "./pilot";
import { fromMeal, plannedPortion, refreshPlanned } from "./planned";
import { onePortion } from "./recipeIn";
import { measure } from "./measured";

const food = (name: string, calories: number, protein: number) => ({ id: name, name, calories, protein, fats: 1, carbs: 1, fiber: 0 }) as any;
// the fritters in short: 7,794 kcal, 2,342 g, 12 fritters, the portion saved as 195 g
const fritters = { id: "fr", title: "Homemade apple fritters", savedAt: "2026-10-19T00:00:00Z", portion: 195, makes: { n: 12, unit: "fritters" },
  items: [{ id: "a", food: food("Flour", 364, 10), grams: 1200, locked: true }, { id: "b", food: food("Vegetable oil", 884, 0), grams: 246, locked: true }, { id: "c", food: food("Apples", 52, 0.3), grams: 896, locked: true }] } as any;
const kcalOf = (items: any[]) => items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0);

test("R21: one portion is the recipe divided by what it makes, the same on the tile, the Plate, Plan and Today", () => {
  const whole = kcalOf(fritters.items), one = whole / 12;
  assert.equal(servingsOf(fritters), 12);
  const o = portionOf(fritters)!;
  assert.equal(o.word, "fritter"); assert.equal(o.n, 12); assert.equal(Math.round(o.kcal), Math.round(one));
  assert.equal(Math.round(kcalOf(onePortion(fritters.items, 12))), Math.round(one), "the Plate's one portion");
  assert.equal(Math.round(kcalOf(asDish(fritters))), Math.round(one), "a dish on the plate");
  const p = fromMeal(fritters, "mine");
  assert.equal(p.kcal, Math.round(one), "Plan, not the 195 g saved"); assert.equal(p.servings, 12);
  assert.equal(Math.round(kcalOf(plannedPortion(p, "x", "2026-10-19T00:00:00Z")!.items)), Math.round(one), "Today, I ate it");
  const crepes = { id: "c", title: "Crêpes", savedAt: "", portion: 235, items: [{ id: "e", food: food("Eggs", 143, 12.6), grams: 940, locked: true }] } as any;
  assert.equal(portionOf(crepes)!.word, "portion"); assert.equal(portionOf(crepes)!.n, 4);
});

test("R21: a recipe planned before keeps its slot and gets the recount", () => {
  const old = { "2026-10-20": { dinner: { title: "Homemade apple fritters", kcal: 649, protein: 7, source: "mine" as const, mealId: "fr", items: fritters.items, portion: 195 } } };
  const r = refreshPlanned(old, [fritters]);
  assert.equal(r["2026-10-20"].dinner.kcal, Math.round(kcalOf(fritters.items) / 12)); assert.equal(r["2026-10-20"].dinner.source, "mine");
  assert.equal(refreshPlanned(r, [fritters]), r, "nothing to change twice");
});

test("R21: past day 14 the squares are the last 14 days, today last", () => {
  const m = measure({ days: {}, weighIns: [], today: "2026-10-21", start: "2026-10-07" });
  assert.equal(m.day, 15);
  assert.equal(m.squares[0].date, "2026-10-08"); assert.equal(m.squares[13].date, "2026-10-21"); assert.equal(m.squares[13].state, "today");
  const d13 = measure({ days: {}, weighIns: [], today: "2026-10-19", start: "2026-10-07" });
  assert.equal(d13.squares[0].date, "2026-10-07", "until day 14 the first two weeks");
});
