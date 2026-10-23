import { test } from "node:test";
import assert from "node:assert/strict";
import { kindOf, sizeFrom, countFrom, countRead, countLabel, countWord, stepCount, resize, weighed, guessSize, countOf, countInStep, wholeOnPlate } from "./counted";

test("CT: which foods are counted; egg whites, yolks and liquid egg stay in grams", () => {
  assert.equal(kindOf("Eggs"), "egg"); assert.equal(kindOf("Egg"), "egg"); assert.equal(kindOf("Large eggs"), "egg");
  for (const n of ["Egg whites", "Egg yolk", "Liquid egg", "Egg noodles", "Banana chips", "Banana bread", "Dried banana"]) assert.equal(kindOf(n), null, n);
  assert.equal(kindOf("Banana"), "banana");
});

test("CT1: the size and the count the recipe names; code sets the grams", () => {
  assert.equal(sizeFrom("2 large", "egg"), "L"); assert.equal(sizeFrom("3 medium eggs", "egg"), "M"); assert.equal(sizeFrom("1 extra large", "egg"), "XL");
  assert.equal(sizeFrom("2", "egg"), "M", "none named: M"); assert.equal(sizeFrom("1 extra small banana", "banana"), "XS"); assert.equal(sizeFrom("1 extra small", "egg"), "S", "eggs have no XS");
  assert.equal(countFrom("2 large"), 2); assert.equal(countFrom("1 1/2"), 1.5); assert.equal(countFrom("1/2"), 0.5); assert.equal(countFrom("½"), 0.5); assert.equal(countFrom("2½"), 2.5); assert.equal(countFrom("large"), null);
  assert.deepEqual(countRead("Eggs", "2 large", 120), { count: { kind: "egg", size: "L" }, grams: 122 });
  assert.deepEqual(countRead("Banana", "1 medium", 120), { count: { kind: "banana", size: "M" }, grams: 118 });
  assert.equal(countRead("Eggs", "100 g", 100)!.grams, 100, "a measure keeps its grams");
  assert.equal(countRead("Egg", "50g", 50)!.grams, 50, "50g is grams, not 50 eggs");
  assert.equal(countRead("Banana", "120 g", 120)!.grams, 120);
  assert.equal(countRead("Flour", "2 cups", 240), null);
});

test("CT2, CT3: the count large, the size and grams small; a share is a fraction", () => {
  const L = { kind: "egg" as const, size: "L" as const };
  assert.deepEqual(countLabel(L, 122), { main: "2 eggs", small: "L · 122 g" });
  assert.deepEqual(countLabel(L, 15.25), { main: "¼ egg", small: "L · 15 g" });
  assert.equal(countLabel({ kind: "egg", size: "M" }, 52).main, "1 egg");
  assert.equal(countLabel({ kind: "egg", size: "M" }, 78).main, "1½ eggs");
  assert.equal(countWord(0.2), "⅕"); assert.equal(countWord(0.27), "0.3"); assert.equal(countWord(3), "3");
  assert.equal(countInStep(L, 122), "2 eggs (L)");
  assert.deepEqual(countLabel({ kind: "banana", size: "M" }, 118), { main: "1 banana", small: "M · 118 g peeled" });
});

test("CT4, CT5: − and + move whole ones; a new size keeps the count; weighed grams win", () => {
  const M = { kind: "egg" as const, size: "M" as const };
  assert.equal(stepCount(M, 156, 1), 208); assert.equal(stepCount(M, 156, -1), 104); assert.equal(stepCount(M, 13, 1), 52, "a share goes up to one");
  assert.equal(stepCount(M, 13, -1), 0);
  assert.deepEqual(resize(M, 156, "L"), { count: { kind: "egg", size: "L" }, grams: 183 });
  assert.deepEqual(weighed({ kind: "banana", size: "M" }, 134), { kind: "banana", size: "L", weighed: true });
  assert.deepEqual(countLabel({ kind: "banana", size: "L", weighed: true }, 134), { main: "1 banana", small: "L · 134 g peeled, weighed" });
  assert.equal(guessSize("egg", 120), "L", "120 g of eggs kept before sizes: 2 large"); assert.equal(guessSize("egg", 156), "M");
  assert.deepEqual(countOf({ food: { name: "Eggs" }, grams: 104 }), { kind: "egg", size: "M" });
});

test("CT2, CT4: steps count eggs; Fit to my target lands on whole eggs", async () => {
  const { stepText } = await import("./steps");
  const { solveIngredient } = await import("./pilot");
  const food = (id: string, name: string, calories: number, protein: number) => ({ id, name, brand: "", basis: "100g", source: "estimate", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats: 5, carbs: 5, fiber: null } as any);
  const eggs = { id: "e", food: food("e", "Eggs", 143, 12.6), grams: 122, locked: false, count: { kind: "egg" as const, size: "L" as const } };
  assert.equal(stepText("Beat in [[i:e|eggs]].", [eggs]), "Beat in 2 eggs (L).");
  const plate = [{ id: "t", food: food("t", "Toast", 265, 9), grams: 80, locked: true }, { ...eggs, count: { kind: "egg" as const, size: "M" as const }, grams: 52 }];
  const r = solveIngredient(plate, "e", 8, null);
  assert.ok(r.ok, (r as any).reason);
  const g = (r as any).items.find((x: any) => x.id === "e").grams;
  assert.equal(g % 52, 0, `whole M eggs (${g} g)`);
});

// DT77 (Milan 23 October 09:52): a whole recipe in whole ones; apples counted; other languages
test("DT77: the whole recipe says whole eggs; a portion keeps its share", () => {
  const c = { kind: "egg" as const, size: "M" as const };
  assert.equal(countLabel(c, 94).main, "1⅘ eggs");                 // a portion's share, for the numbers
  assert.equal(countLabel(c, 94, true).main, "2 eggs");             // the whole recipe, for cooking
  assert.equal(countLabel(c, 94, true).small, "M · 94 g");          // the grams stay as saved
  assert.equal(countLabel(c, 20, true).main, "1 egg");              // at least one
});
test("DT77: apples are counted; German and Serbian names count too", () => {
  for (const n of ["Apple, raw", "Äpfel", "Apfel Braeburn", "Jabuka"]) assert.equal(kindOf(n), "apple", n);
  for (const n of ["Apple juice", "Apfelmus", "Pineapple, raw", "Apple pie", "Apfelsaft"]) assert.equal(kindOf(n), null, n);
  for (const n of ["Eier, Freiland", "Bio Ei", "Jaja"]) assert.equal(kindOf(n), "egg", n);
  for (const n of ["Eiweiß", "Eis Vanille", "Eiernudeln"]) assert.equal(kindOf(n), null, n);
  assert.equal(kindOf("Banane"), "banana");
});
test("DT78: on the Plate eggs, bananas and apples land on whole ones; weighed and dish shares stay", () => {
  const egg = { food: { name: "Eggs" }, grams: 92, count: { kind: "egg" as const, size: "M" as const } };
  const out = wholeOnPlate([egg])!;
  assert.equal(out[0].grams, 104); assert.deepEqual(out[0].count, { kind: "egg", size: "M" });
  assert.equal(wholeOnPlate([{ ...egg, grams: 104 }]), null);                                // already whole
  assert.equal(wholeOnPlate([{ ...egg, grams: 20 }])![0].grams, 52);                         // at least one
  assert.equal(wholeOnPlate([{ food: { name: "Banana" }, grams: 134, count: { kind: "banana" as const, size: "L" as const, weighed: true } }]), null);
  assert.equal(wholeOnPlate([{ ...egg, dish: { id: "d" } }]), null);                         // a share of a batch
  assert.equal(wholeOnPlate([{ food: { name: "Oats" }, grams: 37 }]), null);
});
