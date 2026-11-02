// DT228 v2 (0.3.63, board Stories168): the read's question about a food's kind, checked before it reaches the Plate
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanRead } from "./mealPhoto";
const food = (name: string) => ({ name, grams: 180, low: 140, high: 220, calories: 250, protein: 25, fats: 14, carbs: 8, fiber: 0.5, confidence: "medium" });
const opt = (name: string, protein = 25) => ({ name, calories: 240, protein, fats: 12, carbs: 8, fiber: 0.5 });
test("DT228: which names a food of the read, with two to four kinds; anything else is dropped", () => {
  const r = cleanRead({ dish: "Schnitzel", foods: [food("Pork schnitzel, breaded"), food("Roasted potatoes")], which: { name: "Pork schnitzel, breaded", question: "under the breading, is it pork, veal, chicken or fish?", options: [opt("Pork schnitzel, breaded"), opt("Veal schnitzel, breaded", 26), opt("Chicken schnitzel, breaded"), opt("Fish fillet, breaded", 14), opt("Turkey schnitzel")] } });
  assert.equal(r?.which?.options.length, 4, "at most four");
  assert.equal(r?.which?.question, "under the breading, is it pork, veal, chicken or fish?");
  assert.equal(cleanRead({ dish: "", foods: [food("Rice")], which: { name: "Fish", options: [opt("Fish"), opt("Pork")] } })?.which, null, "a food not on the plate: no question");
  assert.equal(cleanRead({ dish: "", foods: [food("Rice")], which: { name: "Rice", options: [opt("Rice")] } })?.which, null, "one kind is no question");
  assert.equal(cleanRead({ dish: "", foods: [food("Rice")], which: { name: "Rice", options: [opt("Rice"), { name: "Bulgur" }] } })?.which, null, "a kind without values is dropped, and one left is no question");
  assert.match(cleanRead({ dish: "", foods: [food("Pie")], which: { name: "Pie", options: [opt("Pie"), opt("Quiche")] } })!.which!.question, /^What is the pie\?$/);
});
