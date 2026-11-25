import { test } from "node:test";
import assert from "node:assert/strict";
import { stepText, stepParts, tokenOf, missingFoods, usedIds, chipKeep, shortName, amountFor } from "./steps";

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

test("B165: a chip keeps its amount with the food's first word; the rest may go on to the next line", () => {
  assert.deepEqual(chipKeep("250 g Körniger Frischkäse Tworog 2,5% Fett"), ["250 g Körniger", " Frischkäse Tworog 2,5% Fett"]);
  assert.deepEqual(chipKeep("2 eggs (L)"), ["2 eggs (L)", ""]);
  assert.deepEqual(chipKeep("salt"), ["salt", ""]);
  assert.equal(chipKeep("150 g Feta Leicht").join(""), "150 g Feta Leicht");
});

test("B169: a first starter food (typical values, check your pack) is a basic food: small letters in a step", () => {
  assert.equal(shortName({ name: "Chicken breast, cooked", brand: "typical values, check your pack", source: "label" }), "chicken breast");
  assert.equal(shortName({ name: "Frischer Blätterteig", brand: "", source: "label" }), "Frischer Blätterteig");
  assert.equal(shortName({ name: "Frischer Blätterteig", barcode: "4056489000002", source: "label" }), "Frischer Blätterteig");
});

test("B169: a step saved with Chicken breast, as the app wrote it since B163, follows the food: chicken breast", () => {
  const food = { id: "f-chicken", name: "Chicken breast, cooked", brand: "typical values, check your pack", source: "label", calories: 165, protein: 31, fats: 3.6, carbs: 0 } as any;
  const items = [{ id: "c", food, grams: 100, locked: false }] as any;
  assert.equal(amountFor("c", "Chicken breast", items), "100 g chicken breast");
  assert.equal(amountFor("c", "chicken", items), "100 g chicken");
});
