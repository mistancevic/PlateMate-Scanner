// B160 (0.3.187, board Stories287; Go 23 November 2026, 20:03): which meals are asked about, and the meal at the same share
import { test } from "node:test";
import assert from "node:assert/strict";
import { mealsOf, followed, foodsChanged, askFrom } from "./recipeChange";

const food = (id: string) => ({ id, name: id, brand: "", basis: "100g", calories: 100, protein: 10, fats: 1, carbs: 1, fiber: 0 }) as any;
const it = (id: string, g: number) => ({ id: id + g, food: food(id), grams: g, locked: false });
const before = [it("q", 500), it("p", 375), it("s", 3), it("e", 122)], after = [it("q", 250), it("p", 375), it("s", 3), it("e", 122)];
const card = (id: string, at: string, items = [it("q", 125), it("p", 94), it("s", 1), it("e", 31)]) => ({ id, meal: { id: "x", title: "Cheese pie", items }, status: "eaten", recipeId: "m-pie", taste: "", notes: "", createdAt: at }) as any;
const now = new Date("2026-11-23T19:00:00+01:00");

test("B160 AC1, AC4: today and yesterday are asked about, older meals are counted", () => {
  const r = mealsOf({ id: "m-pie", title: "Cheese pie" }, [card("a", "2026-11-23T17:00:00.000Z"), card("b", "2026-11-22T06:00:00.000Z"), card("c", "2026-11-20T17:00:00.000Z")], now);
  assert.deepEqual(r.recent.map((f) => f.id), ["b", "a"]); assert.equal(r.older, 1);
  assert.equal(new Date(askFrom(now)).getDate(), 22);
  assert.equal(mealsOf({ id: "m-pie", title: "Cheese pie" }, [card("a", "2026-11-23T17:00:00.000Z")], now, "a").recent.length, 0, "the meal being logged now is not asked about");
});
test("B160 AC2: the meal takes the new foods at the share it had", () => {
  const f = followed(card("a", "2026-11-23T17:00:00.000Z"), before, after);
  assert.deepEqual(f.map((i) => [i.food.id, i.grams]), [["q", 63], ["p", 94], ["s", 1], ["e", 31]]);
});
test("B160 AC5: only a change of foods asks", () => {
  assert.equal(foodsChanged(before, before.map((i) => ({ ...i, id: i.id + "x" }))), false);
  assert.equal(foodsChanged(before, after), true);
  assert.equal(foodsChanged(before, [...before, it("sesame", 15)]), true);
});
