// DT214 v2 and DT212 v4 (0.3.53): the cook and Saved for later, as pure rules
import { test } from "node:test";
import assert from "node:assert/strict";
import * as c from "./cooking";
import type { PilotState, Ingredient } from "./pilot";

const food = (id: string, name: string) => ({ id, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: false, calories: 100, protein: 10, fats: 1, carbs: 10, fiber: 0 }) as any;
const it = (id: string, name: string, grams = 100): Ingredient => ({ id, food: food(id, name), grams, locked: false }) as Ingredient;
const base = (items: Ingredient[] = [], extra: Partial<PilotState> = {}): PilotState => ({ version: 1, goals: {} as any, foods: [], meals: [], feedback: [], preferences: "", items, title: "", portion: null, ...extra });

test("DT214: a cook takes the plate; leaving it brings the free Plate back, Go on brings the cook back", () => {
  let s = base([it("a", "Oat flour"), it("b", "Eggs")], { title: "Protein Pancake", fromRecipe: "m1", plateAt: "2026-11-02T10:00:00Z" });
  s = c.startCook(s, { title: "Protein Pancake", recipeId: "m1", steps: 5, now: "2026-11-02T10:05:00Z" });
  assert.equal(s.cook?.inView, true);
  assert.equal(s.items.length, 2);
  s = { ...s, cook: { ...s.cook!, ui: { ticks: ["s0", "s1"], stepPhotos: { "1": "data:x" } } } };
  s = c.swapOut(s);
  assert.equal(s.items.length, 0, "the Plate is free");
  assert.equal(s.cook?.inView, false);
  assert.equal(s.cook?.plate.items?.length, 2);
  assert.equal(s.cook?.plate.fromRecipe, "m1");
  // a food on the free Plate stays there through Go on and back
  s = { ...s, items: [it("x", "Skyr")] };
  s = c.swapIn(s);
  assert.deepEqual(s.items.map((i) => i.id), ["a", "b"]);
  assert.equal(s.cook?.free?.items?.[0].id, "x");
  s = c.swapOut(s);
  assert.deepEqual(s.items.map((i) => i.id), ["x"]);
});

test("DT214: the strip says the dish and the step; after eating, when Chef Mealan asks", () => {
  const cook: c.Cook = { id: "1", startedAt: "2026-11-02T10:00:00Z", title: "Protein Pancake", stage: "make", plate: {}, ui: { ticks: ["s0", "s1"] }, steps: 5 };
  assert.deepEqual(c.stripWords(cook), { lead: "Cooking now", rest: "Protein Pancake · step 3 of 5" });
  const eaten = new Date("2026-11-02T12:40:00");
  const after = { ...cook, stage: "carry" as const, eatenAt: eaten.toISOString() };
  assert.deepEqual(c.stripWords(after, new Date(eaten.getTime() + 12 * 60000)), { lead: "Eaten 12:40", rest: "Protein Pancake · Chef Mealan asks how it carried you in 18 min" });
  assert.equal(c.resumeLine({ ...cook, ui: { ticks: ["s0", "s1", "s2"], stepPhotos: { "0": "a", "1": "b" } } }), "You were cooking Protein Pancake: 3 of 5 steps ticked, 2 photos. Go on where you left off?");
});

test("DT214: a second cook puts the first one away to Saved for later; Continue brings it back", () => {
  let s = c.startCook(base([it("a", "Oats")]), { title: "Porridge", steps: 3 });
  s = { ...s, cook: { ...s.cook!, ui: { ticks: ["s0"] } } };
  s = c.swapOut(s);
  s = { ...s, items: [it("b", "Rice")] };
  s = c.startCook(s, { title: "Rice bowl" });
  assert.equal(s.cook?.title, "Rice bowl");
  assert.equal(s.later?.length, 1);
  assert.equal(s.later?.[0].kind, "cook");
  assert.equal(s.later?.[0].cook?.title, "Porridge");
  assert.deepEqual(s.items.map((i) => i.id), ["b"]);
  const id = s.later![0].id;
  s = c.swapOut(s);
  s = c.continueLater(s, id);
  assert.equal(s.cook?.title, "Porridge");
  assert.equal(s.cook?.inView, true);
  assert.deepEqual(s.items.map((i) => i.id), ["a"]);
  assert.equal(s.later?.[0].cook?.title, "Rice bowl", "the one that ran waits now");
});

test("DT212: Save for later keeps the plate 7 days; Continue puts it back", () => {
  let s = c.savePlate(base([it("a", "Chicken breast"), it("b", "Peas, green"), it("c", "Rice")], { plateAt: "2026-11-01T13:11:00Z" }), "2026-11-02T08:00:00Z");
  assert.equal(s.items.length, 0);
  assert.equal(s.later?.length, 1);
  assert.equal(c.laterRow(s.later![0]).title, "Chicken breast, peas and rice");
  s = c.tidyCooks(s, new Date("2026-11-08T07:00:00Z"));
  assert.equal(s.later?.length, 1);
  const kept = c.continueLater(s, s.later![0].id);
  assert.equal(kept.items.length, 3);
  assert.equal(kept.plateAt, "2026-11-01T13:11:00Z");
  s = c.tidyCooks(s, new Date("2026-11-09T09:00:00Z"));
  assert.equal(s.later?.length, 0, "gone after 7 days");
});

test("DT214: an eaten cook whose last question was never answered closes at the end of its day", () => {
  const s = base([], { cook: { id: "1", startedAt: "2026-11-01T10:00:00", title: "X", stage: "carry", eatenAt: "2026-11-01T12:40:00", plate: {}, ui: {} } });
  assert.ok(c.tidyCooks(s, new Date("2026-11-01T20:00:00")).cook);
  assert.equal(c.tidyCooks(s, new Date("2026-11-02T08:00:00")).cook, undefined);
});

test("DT212: a plate from an earlier meal; Keep working on it is not asked again", () => {
  const now = new Date("2026-11-02T00:42:00");
  const s = base([it("a", "Chicken breast"), it("b", "Peas, green"), it("c", "Rice")], { plateAt: new Date("2026-11-01T13:11:00").toISOString() });
  assert.equal(c.plateOldOf(s, now), true);
  assert.equal(c.whenWords(c.plateSince(s)!, now), "yesterday, 13:11");
  assert.equal(c.foodsLine(s.items), "Chicken breast, peas and rice");
  assert.equal(c.plateOldOf({ ...s, plateAsked: c.plateSince(s)!.toISOString() }, now), false);
  assert.equal(c.plateOldOf({ ...s, plateAt: new Date("2026-11-02T00:22:00").toISOString() }, now), false);
  assert.equal(c.agoWords(new Date("2026-11-02T00:22:00"), now), "20 minutes ago");
});
