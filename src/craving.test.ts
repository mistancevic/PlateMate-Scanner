import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCraving, matchesCraving, splitByPd, safeIdeaItem } from "./craving";

test("R17: a craving in your words; PD 7+ is a filter, in any of its spellings", () => {
  assert.deepEqual(parseCraving("chocolate PD 7+"), { words: ["chocolate"], minPd: 7, text: "chocolate" });
  assert.equal(parseCraving("something chocolate, PD 7 or more").minPd, 7);
  assert.equal(parseCraving("pudding pd over 8.5").minPd, 8.5);
  assert.equal(parseCraving("PD7+ pancakes").minPd, 7);
  assert.equal(parseCraving("pd at least 6,5 quark").minPd, 6.5);
  assert.deepEqual(parseCraving("I crave Crêpes").words, ["crepes"]);
  assert.equal(parseCraving("sarma").minPd, null);
});

test("R17: the words find the name, a food, a part, the plural and the taste", () => {
  const crepes = { title: "DaaM good protein crêpes", foods: ["Eggs", "Milk 1.5%", "Oats", "Whey protein powder"] };
  assert.ok(matchesCraving(["crepes"], crepes) && matchesCraving(["crepe"], crepes), "accents and plural");
  assert.ok(matchesCraving(["oats"], crepes) && matchesCraving(["whey"], crepes), "a food");
  const bowl = { title: "Breakfast bowl", foods: ["Oats", "Nutella", "Banana"] };
  assert.ok(matchesCraving(["chocolate"], bowl), "Nutella is chocolate");
  assert.ok(matchesCraving(["sweet"], bowl) && !matchesCraving(["savoury"], bowl), "the dish's taste");
  assert.ok(matchesCraving(["glaze"], { title: "Fritters", foods: ["Flour"], parts: ["Glaze"] }), "a part");
  assert.ok(!matchesCraving(["tiramisu"], crepes));
  assert.ok(matchesCraving(["chocolate", "oats"], bowl) && !matchesCraving(["chocolate", "eggs"], bowl), "every word must be found");
});

test("R17: under the filter is named, not hidden; what fits comes first", () => {
  const r = (key: string, pd: number) => ({ key, title: key, kcal: 400, protein: pd * 4, pd, ref: key });
  const { shown, under } = splitByPd([r("bowl", 3.5), r("pudding", 14.4), r("crepes", 8.7)], 7, 6.4);
  assert.deepEqual(shown.map((x) => x.key), ["pudding", "crepes"]);
  assert.deepEqual(under.map((x) => x.key), ["bowl"]);
  assert.deepEqual(splitByPd([r("sarma", 5.1), r("crepes", 8.7)], null, 6.4).shown.map((x) => x.key), ["crepes", "sarma"]);
});

test("R17: Chef Mealan's idea is kept only with values a label can have", () => {
  assert.deepEqual(safeIdeaItem({ name: "quark", grams: 250, calories: 67, protein: 12, fats: 0.2, carbs: 4 }), { name: "Quark", grams: 250, calories: 67, protein: 12, fats: 0.2, carbs: 4 });
  assert.equal(safeIdeaItem({ name: "x", grams: 0, calories: 100, protein: 1 }), null);
  assert.equal(safeIdeaItem({ name: "x", grams: 10, calories: 1200, protein: 1 }), null);
  assert.equal(safeIdeaItem({ name: "x", grams: 10, calories: 0, protein: 5 }), null);
  assert.equal(safeIdeaItem({ name: "cocoa", grams: 10, calories: 228, protein: 20, fats: 14, carbs: 70 })!.carbs, null, "macros over 100 g drop the carbs");
});
