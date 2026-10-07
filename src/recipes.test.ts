import test from "node:test";
import assert from "node:assert/strict";
import { numbersOf, fitsOf, slugOf, claimProblem, forVisitor, amountOf } from "./recipes";

// The crepes Milan drew on the canvas (board R1): 12 crepes from protein flour, protein milk, eggs, mascarpone
const f = (name: string, calories: number, protein: number, carbs: number, fats: number, fiber: number | null) => ({ id: name, name, calories, protein, carbs, fats, fiber } as any);
const crepes = { items: [
  { grams: 200, food: f("Protein flour", 357, 21, 59, 2.4, 5) },
  { grams: 500, food: f("Skim milk with milk protein", 51, 7.5, 5, 0.1, 0) },
  { grams: 180, food: f("Eggs", 143, 12.6, 0.7, 9.5, 0) },
  { grams: 50, food: f("Mascarpone", 379, 3.4, 3.4, 39, 0) },
] as any[] };

test("a recipe's numbers: all of it, one serving, PD and the protein share", () => {
  const n = numbersOf(crepes, 12)!;
  assert.equal(n.all.kcal, 1416); assert.equal(n.perServing.kcal, 118); assert.equal(n.perServing.protein, 8.7);
  assert.equal(n.pd, 7.3); assert.equal(n.proteinShare, 29); assert.equal(n.per100.grams, 930);
});
test("a food without its energy or protein: no numbers, nothing to publish", () => {
  assert.equal(numbersOf({ items: [{ grams: 100, food: f("x", null as any, 5, 1, 1, 0) }] as any }, 1), null);
});
test("the goals it fits best, as on the page", () => {
  assert.deepEqual(fitsOf(7.2).map((x) => [x.name, x.how]), [["Lose fat", "fits"], ["Recomposition", "just above"]]);
  assert.deepEqual(fitsOf(1.2), []);
});
test("the address, the claim and what a visitor sees", () => {
  assert.equal(slugOf("High protein crêpes!"), "high-protein-crepes");
  assert.equal(slugOf("Pašteta & Brot"), "pasteta-brot");
  assert.match(claimProblem("High protein cookies", "", 14) ?? "", /20 %/);
  assert.equal(claimProblem("High protein crepes", "", 29), null);
  assert.equal(claimProblem("Cookies", "", 10), null);
  const r: any = { who: "members", items: [{ name: "x" }], steps: ["y"] };
  assert.deepEqual([forVisitor(r).items.length, forVisitor(r).steps.length, (forVisitor(r) as any).locked], [0, 0, true]);
  assert.equal(amountOf(1250), "1.3 kg"); assert.equal(amountOf(49.6), "50 g");
});
