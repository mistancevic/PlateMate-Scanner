import { test } from "node:test";
import assert from "node:assert/strict";
import { ratesOf, lettersOf, letterOf, letterLine, letterWord } from "./letters";

const day = { kcal: 2750, protein: 180, fats: 92, carbs: 300 };
test("DT108: the day's rates come from the plan, protein from the PD target", () => {
  const r = ratesOf(day, 6.5)!;
  assert.equal(r.protein, 6.5);
  assert.equal(Math.round(r.fats * 10) / 10, 3.3);
  assert.equal(Math.round(r.carbs * 10) / 10, 10.9);
  assert.equal(r.fiber, 1.4);
  assert.equal(ratesOf(null, null), null);
});
test("DT108: four letters in the EU label order, F C Fi P, by the PD bands", () => {
  const r = ratesOf(day, 6.5)!;
  assert.deepEqual(lettersOf({ calories: 63, protein: 11, fats: 0.2, carbs: 4, fiber: 0 }, r), ["f-", "c-", "fi-", "P+"]); // skyr: 6.3 g carbs per 100 kcal, 0.58 of 10.9, just under 0.6
  assert.deepEqual(lettersOf({ calories: 89, protein: 1.1, fats: 0.3, carbs: 20, fiber: 2.6 }, r), ["f-", "C+", "Fi+", "p-"]); // banana
  assert.deepEqual(lettersOf({ calories: 379, protein: 13, fats: 7, carbs: 60, fiber: 10 }, r), ["f-", "C", "Fi+", "p-"]); // oats
  assert.deepEqual(lettersOf({ calories: 539, protein: 6, fats: 31, carbs: 57, fiber: null }, r), ["F+", "C", "fi?", "p-"]); // nutella
  assert.deepEqual(lettersOf({ calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0 }, r), ["f", "c-", "fi-", "P+"]); // chicken
});
test("DT108: a letter never disagrees with the PD band", () => {
  assert.equal(letterOf("protein", 6.5 * 0.95, 6.5), "P");
  assert.equal(letterOf("protein", 6.5 * 0.7, 6.5), "p");
  assert.equal(letterOf("protein", 6.5 * 0.5, 6.5), "p-");
  assert.equal(letterOf("protein", 6.5 * 1.6, 6.5), "P+");
  assert.equal(letterLine("fats", 12.5, 3.3), "F+ fat: 12.5 g per 100 kcal, more than your day's 3.3.");
  assert.equal(letterLine("fiber", null, 1.4), "fi? fibre: no value on the label.");
});

test("DT128: the word under a cell: fat, high · carbs, under · fibre, no value · protein, as your day", () => {
  assert.equal(letterWord("fats", 12.5, 3.3), "fat, high");
  assert.equal(letterWord("carbs", 8, 10.9), "carbs, under");
  assert.equal(letterWord("fiber", null, 1.4), "fibre, no value");
  assert.equal(letterWord("protein", 6.5, 6.5), "protein, as your day");
  assert.equal(letterWord("carbs", 1, 10.9), "carbs, close to none");
});
