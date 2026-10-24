import { test } from "node:test";
import assert from "node:assert/strict";
import { chatRows } from "./chatFoods";
import type { Food, Ingredient } from "./pilot";

const F = (id: string, name: string, calories: number, protein: number, fats: number, carbs: number, extra: Partial<Food> = {}): Food =>
  ({ id, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats, carbs, fiber: null, ...extra }) as Food;
const bar = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, { serving: { grams: 50, name: "bar" } } as any);
const yeast = F("yeast", "Active dry yeast", 325, 40, 7, 41);
const quark = F("quark", "Quark, low fat (Magerquark)", 67, 12, 0.2, 4);
const greek = F("greek", "Greek yogurt 2%", 73, 9.5, 2, 4);
const chicken = F("chicken", "Chicken breast, cooked", 165, 31, 3.6, 0);
const plate: Ingredient[] = [{ id: "a", food: bar, grams: 50, locked: false }, { id: "b", food: yeast, grams: 7, locked: false }];
let n = 0; const uid = () => "u" + ++n;

test("DT106: foods named in an answer become rows: mine first, then the basic foods, through the rules", () => {
  const rows = chatRows(["low-fat quark", "an apple", "Greek yogurt", "chicken breast", "dried cranberries"], ["active dry yeast"], [bar, yeast, quark, greek, chicken], plate, "DE", uid);
  const kinds = rows.map((r) => `${r.kind}:${r.name}`);
  assert.deepEqual(kinds, ["drop:Active dry yeast", "add:Quark, low fat (Magerquark)", "add:Apfel", "add:Greek yogurt 2%", "scan:dried cranberries"]);
  const q = rows[1] as any; assert.equal(q.from, "mine"); assert.equal(q.grams > 0, true); assert.equal(q.reaches! > 5, true);
  const a = rows[2] as any; assert.equal(a.from, "basic"); assert.equal(a.food.calories, 52);
});
test("DT106: a food already on the plate is no row; a name that names nothing is Scan it", () => {
  const rows = chatRows(["protein bar", "pumpkin spice latte"], [], [bar, yeast], plate, null, uid);
  assert.deepEqual(rows.map((r) => r.kind), ["scan"]);
});
