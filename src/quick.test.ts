import test from "node:test";
import assert from "node:assert/strict";
import { quickPicks } from "./quick";
const food = (id: string, extra: any = {}) => ({ id, name: id, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories: 100, protein: 10, fats: 1, carbs: 1, fiber: 0, ...extra }) as any;
const card = (ids: string[], daysAgo: number) => ({ id: "c" + Math.random(), meal: { id: "m", title: "", items: ids.map((id) => ({ id: "i", food: food(id), grams: 100, locked: false })), portion: 1, savedAt: "" }, status: "eaten", taste: "", notes: "", createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString() }) as any;
test("favourites first, then most used, at most eight", () => {
  const foods = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map((id) => food(id, id === "j" ? { favorite: true } : {}));
  const { picks } = quickPicks(foods, [card(["c", "d"], 2), card(["d"], 3)]);
  assert.deepEqual(picks.slice(0, 3).map((f) => f.id), ["j", "d", "c"]);
  assert.equal(picks.length, 8);
});
test("old meals don't count", () => {
  const { picks } = quickPicks([food("a"), food("b")], [card(["b"], 90)]);
  assert.equal(picks[0].id, "a");
});
test("C6 (DT103, 0.2.91): quick picks are foods you eat as they are; yeast, flour and oil stay in the list", () => {
  const foods = [food("Skyr"), food("Active dry yeast", { favorite: true }), food("Wheat flour"), food("Olive oil"), food("Apple")];
  const { picks } = quickPicks(foods, [card(["Olive oil"], 1)]);
  assert.deepEqual(picks.map((f) => f.id), ["Skyr", "Apple"]);
});
// DT308 (0.3.154, board Stories236): From the list on the empty Plate
import { macroPicks, macroOf } from "./quick";
test("DT308: a food belongs to the macro that gives most of its energy", () => {
  assert.equal(macroOf(food("skyr", { protein: 11, carbs: 4, fats: 0.2 })), "protein");
  assert.equal(macroOf(food("rice", { protein: 2.7, carbs: 28, fats: 0.3 })), "carbs");
  assert.equal(macroOf(food("almonds", { protein: 21, carbs: 5.4, fats: 50 })), "fat");
});
test("DT308: three foods each for Protein, Carbs and Fat, favourites first, then most used", () => {
  const P = { protein: 20, carbs: 1, fats: 1 }, C = { protein: 2, carbs: 30, fats: 1 }, Fa = { protein: 5, carbs: 5, fats: 40 };
  const foods = [food("p1", P), food("p2", P), food("p3", P), food("p4", P), food("p5", { ...P, favorite: true }), food("c1", C), food("c2", C), food("f1", Fa)];
  const got = macroPicks(foods, [card(["p4", "c2"], 2), card(["p4"], 3)]);
  assert.deepEqual(got.map((g) => g.key), ["protein", "carbs", "fat"]);
  assert.deepEqual(got[0].foods.map((f) => f.id), ["p5", "p4", "p1"]);
  assert.deepEqual(got[1].foods.map((f) => f.id), ["c2", "c1"]);
  assert.deepEqual(got[2].foods.map((f) => f.id), ["f1"]);
});
test("DT308: a macro with no food of yours is left out; cooking foods are not picks", () => {
  const got = macroPicks([food("Skyr", { protein: 11, carbs: 4, fats: 0.2 }), food("Olive oil", { protein: 0, carbs: 0, fats: 100 })], []);
  assert.deepEqual(got.map((g) => g.key), ["protein"]);
});
