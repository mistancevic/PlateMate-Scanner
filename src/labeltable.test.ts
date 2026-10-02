import test from "node:test";
import assert from "node:assert/strict";
import { recognise, rowsFromRaw, displayRows } from "./labeltable";
test("German, English and Serbian lines are recognised", () => {
  assert.equal(recognise("davon gesättigte Fettsäuren"), "saturates");
  assert.equal(recognise("of which sugars"), "sugars");
  assert.equal(recognise("Kohlenhydrate"), "carbohydrate");
  assert.equal(recognise("Ballaststoffe"), "fibre");
  assert.equal(recognise("Eiweiß"), "protein");
  assert.equal(recognise("Salz"), "salt");
  assert.equal(recognise("od toga zasićene masne kiseline"), "saturates");
  assert.equal(recognise("davon mehrwertige Alkohole"), "polyols");
  assert.equal(recognise("einfach ungesättigte Fettsäuren"), "mono");
});
test("vitamins are kept as micro lines, unknown lines as other", () => {
  assert.ok(recognise("Vitamin C").startsWith("micro:"));
  assert.ok(recognise("Taurin").startsWith("other:"));
});
test("printed order is kept, missing core values slotted in", () => {
  const rows = rowsFromRaw([{ name: "Energie", amount: 404, unit: "kcal" }, { name: "Fett", amount: 8.4 }, { name: "davon gesättigte Fettsäuren", amount: 1.0 }, { name: "Salz", amount: 3.3 }], "label");
  const shown = displayRows({ table: rows, calories: 404, fats: 8.4, carbs: 56, fiber: 5.2, protein: 23 }).map((r) => r.key);
  assert.deepEqual(shown.slice(0, 3), ["energy", "fat", "saturates"]);
  assert.ok(shown.includes("protein") && shown.includes("carbohydrate") && shown.indexOf("salt") > -1);
});
