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

// Milan, 8 October 2026: a bar's sugar alcohols were taken for sugars, and the database's 313.3333 kcal showed as it came
import { tidy, withPackLines } from "./labeltable";
test("sugar alcohols are polyols, in the languages on the packs", () => {
  for (const n of ["of which sugar alcohols", "davon Zuckeralkohole", "Sugar alcohols (polyols)", "od toga šećerni alkoholi", "davon mehrwertige Alkohole", "Erythrit"]) assert.equal(recognise(n), "polyols", n);
  assert.equal(recognise("davon Zucker"), "sugars");
});
test("values as a label prints them", () => {
  assert.equal(tidy(313.3333, "kcal"), 313); assert.equal(tidy(8.888889), 8.9); assert.equal(tidy(0.354), 0.35); assert.equal(tidy(31.11111), 31.1); assert.equal(tidy(null), null);
});
test("the pack's lines the database lacks are added, in European order", () => {
  const db = rowsFromRaw([{ name: "Energy", amount: 313, unit: "kcal" }, { name: "Carbohydrate", amount: 31.1, unit: "g" }, { name: "of which sugars", amount: 3.1, unit: "g", sub: true }, { name: "Protein", amount: 31.1, unit: "g" }], "database");
  const pack = rowsFromRaw([{ name: "Kohlenhydrate", amount: 31, unit: "g" }, { name: "davon Zuckeralkohole", amount: 12, unit: "g", sub: true }, { name: "Eiweiß", amount: 31, unit: "g" }], "label");
  const out = withPackLines(db, pack);
  assert.deepEqual(out.map((r) => r.key), ["energy", "carbohydrate", "sugars", "polyols", "protein"]);
  assert.equal(out.find((r) => r.key === "polyols")!.source, "label");
  assert.equal(out.find((r) => r.key === "carbohydrate")!.amount, 31.1, "the database's own lines stay");
});
