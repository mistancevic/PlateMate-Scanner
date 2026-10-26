import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanRead, itemsOfRead, kcalRange, aboutKcal, photoAdvice, ideaAdvice } from "./mealPhoto";

const raw = { dish: "Grilled chicken with rice and salad", foods: [
  { name: "Chicken breast, grilled", grams: 180, low: 140, high: 240, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" },
  { name: "Rice, cooked", grams: 150, low: 120, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "medium" },
  { name: "Olive oil", grams: 8, low: 5, high: 15, calories: 884, protein: 0, fats: 100, carbs: 0, fiber: 0, confidence: "low" },
], unsure: { name: "Chicken breast, grilled", options: [350, 180] } };

test("DT127: the read is checked and kept: names, ranges around the guess, the one question with its two amounts in order", () => {
  const r = cleanRead(raw)!;
  assert.equal(r.foods.length, 3);
  assert.deepEqual([r.foods[0].low, r.foods[0].grams, r.foods[0].high], [140, 180, 240]);
  assert.deepEqual(r.unsure, { name: "Chicken breast, grilled", options: [180, 350] });
  assert.equal(cleanRead({ foods: [] }), null);
  assert.equal(cleanRead({ foods: [{ name: "Soup", grams: 300 }], unsure: { name: "Bread", options: [30, 60] } })!.unsure, null, "a question about a food not on the plate is dropped");
});
test("DT127: a basic food of the read becomes the table's food, the rest an estimate; the rows are marked", () => {
  const r = cleanRead(raw)!;
  const { items, fresh } = itemsOfRead(r, [], null, (() => { let n = 0; return () => `id${++n}`; })());
  assert.equal(items.length, 3);
  assert.ok(items.every((i) => i.est && i.est.low <= i.grams && i.grams <= i.est.high));
  assert.ok(fresh.length >= 1 && fresh.some((f) => f.source === "estimate" || f.source === "Reference table"));
  const rice = items.find((i) => /rice/i.test(i.food.name))!;
  assert.ok(rice.food.refId || rice.food.source === "estimate", "rice is the table's cooked rice when the table has it");
});
test("DT127: the energy as a range from the rows' low and high; a corrected row counts once", () => {
  const r = cleanRead(raw)!;
  const { items } = itemsOfRead(r, [], null, (() => { let n = 0; return () => `k${++n}`; })());
  const k = kcalRange(items);
  assert.ok(k.low < k.kcal && k.kcal < k.high);
  assert.match(aboutKcal(k), /^about \d+ to \d+ kcal$/);
  const fixed = items.map((i) => ({ ...i, est: undefined }));
  const f = kcalRange(fixed); assert.equal(f.low, f.high); assert.match(aboutKcal(f), /^about \d+ kcal$/);
});
test("DT127: Chef Mealan's line by code: eat it, eat half, a snack, add protein", () => {
  const r = cleanRead(raw)!;
  const { items } = itemsOfRead(r, [], null, (() => { let n = 0; return () => `a${++n}`; })());
  const ok = { ok: true as const };
  assert.equal(photoAdvice({ items, protein: 60, mealWord: "lunch", mealKcal: 900, big: 0, nutrition: ok, day: ok, culinaryOk: true }).first, "all");
  assert.match(photoAdvice({ items, protein: 60, mealWord: "lunch", mealKcal: 900, big: 0, nutrition: ok, day: ok, culinaryOk: true }).line, /^Eat it as it is\. About .* a full lunch for your day, and nothing on it argues with the dish\.$/);
  const half = photoAdvice({ items, protein: 60, mealWord: "lunch", mealKcal: 900, big: 2, nutrition: { ok: false, why: "More than half of this lunch's energy is fat: 61 percent, 110 g.", ways: ["protein", "snack", "keep"] }, day: ok, culinaryOk: true });
  assert.equal(half.first, "half"); assert.match(half.line, /^Eat half and take the rest home\..*about 2 lunches for your day, and more than half of this lunch's energy is fat.*Half is a lunch\.$/);
  const snack = photoAdvice({ items, protein: 20, mealWord: "lunch", mealKcal: 3000, big: 0, nutrition: ok, day: ok, culinaryOk: null });
  assert.equal(snack.first, "all"); assert.match(snack.line, /^This is a snack, not your lunch/);
  const add = photoAdvice({ items, protein: 10, mealWord: "dinner", mealKcal: 900, big: 0, nutrition: { ok: false, why: "Most of this dinner's protein comes from the powder: 20 of 25 g.", ways: ["protein", "snack", "keep"] }, day: ok, culinaryOk: true });
  assert.equal(add.first, "add"); assert.match(add.line, /Add a protein side/);
});
test("DT130: an idea's line: what it is as the photo shows it, and what Fit does; no eating words", () => {
  const r = cleanRead(raw)!;
  const { items } = itemsOfRead(r, [], null, (() => { let n = 0; return () => `i${++n}`; })());
  const ok = { ok: true as const };
  const a = ideaAdvice({ items, protein: 60, mealWord: "breakfast", big: 0, nutrition: ok });
  assert.match(a, /^A breakfast as the photo shows it: about .* kcal and 60 g protein\. Fit it and it is sized for your day\.$/);
  assert.match(ideaAdvice({ items, protein: 60, mealWord: "lunch", big: 2, nutrition: ok }), /about 2 lunches for your day\. Fit it and it is one lunch\.$/);
  assert.doesNotMatch(a, /Eat|Ate/);
});
