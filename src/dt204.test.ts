// DT204 (0.3.47, board Stories151; Coach Milan 1 November 18:44 Go; Tester 2's lunch photo of 30 October)
import { test } from "node:test";
import assert from "node:assert/strict";
import { iconFor } from "./icons";
import { fmt, fixed } from "./ui";
import { itemsOfRead, type PhotoRead } from "./mealPhoto";

test("DT204: pasta shapes get the pasta icon; torte is cake only as a word of its own", () => {
  for (const n of ["Tortellini", "Ravioli with ricotta", "Gnocchi", "Lasagne", "Tagliatelle"]) assert.equal(iconFor(n), "🍝", n);
  for (const n of ["Torte", "Obsttorte", "Carrot cake"]) assert.equal(iconFor(n), "🍰", n);
});
test("DT204: one decimal point whatever the phone's language", () => {
  assert.equal(fixed(5.1), "5.1"); assert.equal(fixed(8.2), "8.2"); assert.equal(fmt(1234.5, 0), "1,235"); assert.equal(fmt(3.25, 1), "3.3");
});
test("DT204: the foods of a photo read are marked as the dish's parts, and the table's spinach is named in English", () => {
  const read: PhotoRead = { dish: "Tortellini with spinach pesto", unsure: null, foods: [
    { name: "Tortellini", grams: 130, low: 100, high: 160, calories: 290, protein: 12, fats: 9, carbs: 40, fiber: 2, confidence: "medium" },
    { name: "Spinach, raw", grams: 30, low: 20, high: 45, calories: 23, protein: 2.9, fats: 0.4, carbs: 1.4, fiber: 2.2, confidence: "low" } ] };
  let n = 0; const { items } = itemsOfRead(read, [], "belgrade", () => `id${n++}`);
  assert.ok(items.every((i) => i.fromPhoto));
  const sp = items.find((i) => i.food.refId === "spinach");
  assert.ok(sp, "spinach is the table's food"); assert.equal(sp!.food.name, "Spinach, raw"); assert.ok(sp!.food.aliases!.includes("Spanać"));
});
