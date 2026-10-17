import { test } from "node:test";
import assert from "node:assert/strict";
import { deletePlan, forgetRecipe, deletedLine, countOf } from "./recipeDelete";
import { isOrphan } from "./photos";

const food = (id: string) => ({ id, name: id, brand: "estimate", basis: "100g", source: "estimate", notes: "", reviewedAt: "", readyToEat: true, calories: 100, protein: 5, fats: 1, carbs: 1, fiber: null } as any);
const cake = {
  id: "m1", title: "Protein cheesecake", portion: 150, savedAt: "2026-10-17T09:00:00Z", steps: ["Mix", "Bake"], stepParts: ["Base", "Filling"],
  items: [{ id: "i1", food: food("biscuits"), grams: 120, locked: false, part: "Base" }, { id: "i2", food: food("quark"), grams: 500, locked: false, part: "Filling" }],
  optional: [{ name: "Raspberries", written: "a handful", grams: 80, food: food("raspberries"), part: "Topping" }],
  source: { name: "@bakes on Instagram", from: "screenshot", at: "2026-10-17T09:00:00Z", steps: ["Crush", "Bake 40 min"], shotSigs: ["a", "b"] },
  stated: { kcal: 220, protein: 18, fats: null, carbs: null }, makes: { n: 8, unit: "slices" },
  members: { id: "share1", at: "", named: false, coverSig: "c", kitchen: null, sent: "" }, coverSig: "c", photoSigs: ["c", "p1"], cover: { state: "drawn", day: "2026-10-17" },
} as any;
const card = (id: string, status: string, left?: number) => ({ id, meal: structuredClone(cake), status, taste: "", notes: "", createdAt: "2026-10-17T10:00:00Z", recipeId: "m1", ...(left ? { left } : {}) } as any);
const state = { version: 1, foods: [food("biscuits"), food("quark"), food("raspberries"), food("oats")], meals: [cake, { ...cake, id: "m2", title: "Oats" }],
  feedback: [card("f1", "eaten"), card("f2", "eaten"), card("f3", "eaten"), card("f4", "prepared", 6)], fromRecipe: "m1", openRecipe: "m1" } as any;

test("IM22: the card counts exactly what goes, what others see and what stays", () => {
  const p = deletePlan(cake, state, { status: "live", waiting: true });
  assert.deepEqual(p.recipe, ["its foods and grams", "steps", "parts", "optional foods", "the original steps", "the recipe's own numbers"]);
  assert.equal(p.shots, 2); assert.equal(p.photos, 1, "the drawn picture is not counted as a photo"); assert.equal(p.drawn, true);
  assert.equal(p.members, true); assert.equal(p.page, "live+waiting");
  assert.equal(p.eaten, 3); assert.equal(p.left, 6); assert.equal(p.unit, "slices"); assert.equal(p.foods, 3, "only the foods it uses");
  assert.equal(deletePlan(cake, state, { status: "waiting" }).page, "waiting");
  assert.equal(deletePlan(cake, state, { status: "down" }).page, "down");
  assert.equal(deletePlan(cake, state, null).page, null);
  assert.equal(countOf(1, "slices"), "1 slice"); assert.equal(countOf(6, "slices"), "6 slices"); assert.equal(countOf(1, "glass"), "1 glass");
});

test("IM22b: a recipe only you have: no Members, no page", () => {
  const mine = { ...cake, members: undefined, coverSig: undefined, photoSigs: [], cover: undefined, source: { name: "x", from: "link", at: "" } };
  const p = deletePlan(mine, { foods: state.foods, feedback: [] }, null);
  assert.equal(p.members, false); assert.equal(p.page, null); assert.equal(p.shots, 0); assert.equal(p.drawn, false); assert.equal(p.eaten, 0); assert.equal(p.left, 0);
});

test("IM22: the recipe goes with its own content; the meals eaten, the portions left and the foods stay", () => {
  const s = forgetRecipe(state, cake);
  assert.deepEqual(s.meals.map((m: any) => m.id), ["m2"]);
  assert.equal(s.foods.length, 4, "a food holds nothing personal");
  assert.equal(s.feedback.length, 4); assert.equal(s.feedback[3].left, 6);
  for (const f of s.feedback) {
    assert.equal(f.meal.title, "Protein cheesecake"); assert.equal(f.meal.items.length, 2, "what you ate stays what you ate");
    for (const k of ["steps", "stepParts", "optional", "stated", "members", "coverSig", "photoSigs", "cover"]) assert.equal((f.meal as any)[k], undefined, k);
    assert.deepEqual(f.meal.source, { name: "@bakes on Instagram", from: "screenshot", at: "2026-10-17T09:00:00Z" }, "the original steps and screenshots go");
  }
  assert.equal(s.fromRecipe, undefined); assert.equal(s.openRecipe, undefined);
  assert.equal(s.meals[0].steps.length, 2, "other recipes keep theirs");
  // the photos and screenshots leave the phone and the account at the next save
  assert.equal(isOrphan("src:m1:1", s), true); assert.equal(isOrphan("meal:m1:1", s), true); assert.equal(isOrphan("food:quark", s), false);
});

test("IM22c: the line after says what was done, with exact words", () => {
  const p = deletePlan(cake, state, { status: "live" });
  assert.equal(deletedLine(p, { members: true, page: true }, "Milan"), "Taken back from Members and down on chefmealan.com. Its screenshots leave your account with the next save.");
  assert.equal(deletedLine(p, { members: false, page: true }, "Milan"), "Taken down on chefmealan.com. Its screenshots leave your account with the next save.");
  assert.equal(deletedLine(deletePlan(cake, state, { status: "waiting" }), { members: false, page: true }, "Milan"), "Withdrawn from Milan. Its screenshots leave your account with the next save.");
  assert.equal(deletedLine({ ...p, shots: 1 }, { members: false, page: false }, "Milan"), "Its screenshot leaves your account with the next save.");
  assert.equal(deletedLine({ ...p, shots: 0, photos: 0, drawn: true }, { members: false, page: false }, "Milan"), "Its picture leaves your account with the next save.");
  assert.equal(deletedLine({ ...p, shots: 0, photos: 0, drawn: false }, { members: false, page: false }, "Milan"), "");
});
