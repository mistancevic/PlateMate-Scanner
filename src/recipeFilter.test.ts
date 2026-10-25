import { test } from "node:test";
import assert from "node:assert/strict";
import { applyFilters, sortRows, memberLines, kitchenLines, momentsOf, recipeHit, countLine, EMPTY, YOU, NONE, type RecipeRow } from "./recipeFilter";

const R = (id: string, title: string, foods: string[], x: Partial<RecipeRow> = {}): RecipeRow =>
  ({ id, title, foods, steps: ["Mix."], kitchen: null, cook: "", mine: false, at: "2026-10-2" + id, made: 0, kcal: 600, pd: 10, shared: "members", ...x });
const rows = [
  R("1", "Protein first", ["Chicken breast, raw", "Rice, cooked"], { cook: "Marko", mine: true, kitchen: "Mediterranean", made: 2, steps: ["Grill.", "Serve."], pd: 12 }),
  R("2", "Tuna salata", ["Tunina v oljčnem olju", "Greek yoghurt", "Apple"], { mine: true, made: 1, kcal: 400, pd: 11.7 }),
  R("3", "Sarma", ["Beef mince, raw", "Rice, raw"], { cook: "Darinka", kitchen: "Balkan", made: 3, steps: ["Roll.", "Simmer two hours."], kcal: 900, pd: 6 }),
  R("4", "Overnight oats with skyr", ["Oats", "Skyr, natural"], { kcal: 300, pd: 9, made: 4 }),
];
const ctx = { target: 10, dayKcal: 2000, myFoods: ["Oats", "Skyr, natural", "Apple"], needsCooking: (n: string) => /raw|mince/i.test(n) };

test("DT126: the search reads the title, the foods in any language, and the cook", () => {
  assert.ok(recipeHit(rows[1], "tuna"));
  assert.ok(recipeHit(rows[1], "tunjevina"));
  assert.ok(recipeHit(rows[2], "darinka"));
  assert.ok(!recipeHit(rows[0], "tuna"));
  assert.deepEqual(applyFilters(rows, { ...EMPTY, q: "tuna" }, ctx).map((r) => r.id), ["2"]);
});
test("DT126: filters stack; the Member drop-down knows you, the cooks and the unnamed", () => {
  assert.deepEqual(applyFilters(rows, { ...EMPTY, nocook: true }, ctx).map((r) => r.id), ["2", "4"]);
  assert.deepEqual(applyFilters(rows, { ...EMPTY, nocook: true, day: true }, ctx).map((r) => r.id), ["2"]);
  assert.deepEqual(applyFilters(rows, { ...EMPTY, withMine: true }, ctx).map((r) => r.id), ["4"]);
  assert.deepEqual(applyFilters(rows, { ...EMPTY, member: YOU }, ctx).map((r) => r.id), ["1", "2"]);
  assert.deepEqual(applyFilters(rows, { ...EMPTY, member: NONE }, ctx).map((r) => r.id), ["4"]);
  assert.deepEqual(applyFilters(rows, { ...EMPTY, member: "Darinka" }, ctx).map((r) => r.id), ["3"]);
  assert.deepEqual(applyFilters(rows, { ...EMPTY, kitchen: "Balkan" }, ctx).map((r) => r.id), ["3"]);
  assert.deepEqual(memberLines(rows), [{ key: YOU, label: "You", count: "2, one without your name" }, { key: "Darinka", label: "Darinka", count: "1" }, { key: NONE, label: "Without a name", count: "1" }]);
  assert.deepEqual(kitchenLines(rows).map((l) => l.label), ["Balkan", "Mediterranean"]);
});
test("DT126: the moment by the portion's share of the day; the sorts", () => {
  assert.deepEqual(momentsOf(300, 2000), ["snack"]);
  assert.deepEqual(momentsOf(600, 2000), ["breakfast", "lunch"]);
  assert.deepEqual(momentsOf(900, 2000), ["lunch"]);
  assert.deepEqual(applyFilters(rows, { ...EMPTY, moment: "snack" }, ctx).map((r) => r.id), ["4"]);
  assert.deepEqual(sortRows(rows, "made").map((r) => r.id), ["4", "3", "1", "2"]);
  assert.deepEqual(sortRows(rows, "pd").map((r) => r.id), ["1", "2", "4", "3"]);
  assert.deepEqual(sortRows(rows, "quick").map((r) => r.id), ["4", "2", "1", "3"]);
  assert.deepEqual(sortRows(rows, "az").map((r) => r.title[0]), ["O", "P", "S", "T"]);
  assert.deepEqual(sortRows(rows, "new").map((r) => r.id), ["4", "3", "2", "1"]);
  assert.equal(countLine(2, 5, { ...EMPTY, nocook: true, day: true, member: YOU }, () => ""), "2 of 5 recipes · Member: you · Fits my day · No cooking");
});
