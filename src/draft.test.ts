import { test } from "node:test";
import assert from "node:assert/strict";
import { fromDraft, stepText } from "./steps";
import type { Food, Ingredient } from "./pilot";

const food = (name: string): Food => ({ id: name, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories: 100, protein: 10, fats: 1, carbs: 1, fiber: null });
const items: Ingredient[] = [["c", "Chicken breast, cooked", 200], ["b", "Cottage cheese (Hüttenkäse)", 150], ["t", "Tomato", 150], ["u", "Cucumber", 150], ["o", "Olive oil", 10], ["w", "Wholegrain bread", 125]].map(([id, n, g]) => ({ id: id as string, food: food(n as string), grams: g as number, locked: false }));
const draft = ["Cut {3} and {4} into chunks, salt them lightly and leave for five minutes.", "Slice {1} across the grain; warm it in a dry pan, two minutes a side.", "Crumble {2} over the salad and finish with {5}.", "Toast {6} and serve it on the side."];

test("CH5: Chef Mealan's draft becomes steps with the recipe's own amounts", () => {
  const d = fromDraft(draft, items, ["Nutella", "Skyr, natural"]);
  assert.ok(d.ok);
  if (d.ok) assert.equal(stepText(d.steps[0], items), "Cut 150 g tomato and 150 g cucumber into chunks, salt them lightly and leave for five minutes.");
});

test("CH5: the app's checks on a draft", () => {
  assert.match((fromDraft(draft.slice(0, 2), items, []) as any).why, /three to eight/);
  assert.match((fromDraft([...draft.slice(0, 3), "Serve."], items, []) as any).why, /no step names wholegrain bread/);
  assert.match((fromDraft([...draft, "Add {7}."], items, []) as any).why, /\{7\} is not a food/);
  assert.match((fromDraft([...draft.slice(0, 3), "Toast {6}, about 80 g, and serve."], items, []) as any).why, /amount is typed/);
  assert.match((fromDraft([...draft.slice(0, 3), "Toast {6} and spread with nutella."], items, ["Nutella"]) as any).why, /nutella is not in this recipe/);
  assert.ok(fromDraft(draft, items, ["Olive oil, extra virgin", "Tomato"]).ok); // their own foods that are in the recipe
});
