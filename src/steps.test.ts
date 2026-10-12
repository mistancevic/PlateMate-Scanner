import { test } from "node:test";
import assert from "node:assert/strict";
import { stepText, stepParts, tokenOf, missingFoods, usedIds } from "./steps";

const food = (name: string) => ({ id: name, name, brand: "", calories: 100, protein: 10, carbs: 1, fats: 1, fiber: 0 } as any);
const items = [{ id: "a", food: food("Eggs"), grams: 120 }, { id: "b", food: food("Milk 1.5%"), grams: 100 }, { id: "c", food: food("Chicken breast, cooked"), grams: 80 }] as any[];

test("a step reads the amount from the recipe, so a changed weight changes the step (R13b)", () => {
  const s = `Fold in ${tokenOf(items[2])} and cook slowly.`;
  assert.equal(stepText(s, items), "Fold in 80 g chicken breast and cook slowly.");
  const more = items.map((i) => (i.id === "c" ? { ...i, grams: 100 } : i));
  assert.equal(stepText(s, more), "Fold in 100 g chicken breast and cook slowly.");
});
test("a step without foods is plain text, as before", () => {
  assert.equal(stepText("Whisk the eggs with the milk.", items), "Whisk the eggs with the milk.");
  assert.deepEqual(stepParts("Whisk.", items), [{ text: "Whisk." }]);
});
test("a food taken out of the recipe keeps its name in the step, without an amount", () => {
  const s = `Add ${tokenOf(items[1])}.`;
  assert.equal(stepText(s, items.filter((i) => i.id !== "b")), "Add milk 1.5%.");
  const p = stepParts(s, items.filter((i) => i.id !== "b"))[1] as any;
  assert.equal(p.gone, true);
});
test("a food in no step is named, once any step names a food (R13a)", () => {
  const steps = [`Whisk ${tokenOf(items[0])} with ${tokenOf(items[1])}.`, "Fold in the rest."];
  assert.deepEqual(missingFoods(steps, items).map((i) => i.id), ["c"]);
  assert.deepEqual([...usedIds(steps)], ["a", "b"]);
  assert.deepEqual(missingFoods(["Whisk everything."], items), [], "plain steps from before are left alone");
});
