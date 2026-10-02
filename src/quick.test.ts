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
