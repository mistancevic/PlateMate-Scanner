import { test } from "node:test";
import assert from "node:assert/strict";
import { amountChoices, changeCard, deleteCard } from "./pastMeal";

const food = (id: string) => ({ id, name: id, basis: "per100g", calories: 100, protein: 10, carbs: 10, fat: 1 }) as any;
const it = (id: string, g: number) => ({ id, food: food(id), grams: g, locked: false }) as any;
const recipe: any = { id: "r", title: "Egg sandwiches", items: [it("bread", 100), it("egg", 184), it("chicken", 40)], portion: 324, steps: [], savedAt: "x" };
const card = (id: string, items: any[], extra = {}): any => ({ id, meal: { ...recipe, items, portion: items.reduce((a, i) => a + i.grams, 0) }, recipeId: "r", status: "eaten", taste: "", notes: "", createdAt: "2026-11-11T09:08:00.000Z", photo: "data:image/png;base64,AAAA", ...extra });
const state = (fb: any[], cook?: any): any => ({ version: 1, goals: {}, foods: [], items: [], meals: [recipe], feedback: fb, ...(cook ? { cook } : {}) });

test("how much: half a portion, one portion of the recipe, or as logged", () => {
  const c = amountChoices(card("a", [it("bread", 100), it("egg", 250), it("chicken", 93)]), recipe);
  assert.deepEqual(c.map((x) => [x.key, x.grams]), [["half", 162], ["one", 324], ["logged", 443]]);
  assert.deepEqual(c[0].items.map((x) => x.grams), [50, 92, 20], "the recipe's foods, at half a portion");
  // a meal that was one portion: One portion is As logged
  assert.deepEqual(amountChoices(card("b", recipe.items), recipe).map((x) => x.key), ["half", "logged"]);
  // no recipe: half of it, or as logged
  assert.deepEqual(amountChoices(card("c", [it("bread", 80)]), null).map((x) => [x.key, x.grams]), [["halfOf", 40], ["logged", 80]]);
});

test("a change stays one record, at its own time; a delete takes the record out", () => {
  const s = state([card("a", [it("bread", 100), it("egg", 250), it("chicken", 93)]), card("b", recipe.items, { createdAt: "2026-11-11T20:13:00.000Z" })], { cardId: "b", ui: {} });
  const half = amountChoices(s.feedback[0], recipe)[0];
  const ch = changeCard(s, "a", { items: half.items, taste: "DaaM good", notes: "Half a portion." });
  assert.equal(ch.feedback.length, 2); const a = ch.feedback.find((f) => f.id === "a")!;
  assert.equal(a.createdAt, "2026-11-11T09:08:00.000Z"); assert.equal(a.taste, "DaaM good"); assert.equal(a.notes, "Half a portion.");
  assert.equal(a.meal.portion, 162); assert.equal(a.photo, "data:image/png;base64,AAAA", "the photo stays unless changed");
  const d = deleteCard(ch, "b");
  assert.deepEqual(d.feedback.map((f) => f.id), ["a"]); assert.equal((d.cook as any).cardId, undefined, "the cook no longer points to it");
  assert.equal(deleteCard(d, "zz"), d, "nothing to delete: nothing changes");
});
