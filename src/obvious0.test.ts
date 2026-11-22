// DT336 (0.3.174, board Stories274): which products count as 0, as settled by Coach Milan on 22 November 2026, 20:32
import { test } from "node:test";
import assert from "node:assert/strict";
import { obviousZero } from "./obvious0";
import { candidateFood, validateFood } from "./pilot";

test("DT336 AC1, AC3: the category first", () => {
  assert.equal(obviousZero("Peppermint", ["en:beverages", "en:hot-beverages", "en:teas", "en:herbal-teas"]), "tea");
  assert.equal(obviousZero("Gold", ["en:coffees", "en:instant-coffees"]), "coffee");
  assert.equal(obviousZero("Still", ["en:waters", "en:mineral-waters"]), "water");
  assert.equal(obviousZero("Fleur de sel", ["en:salts", "en:sea-salts"]), "salt");
});
test("DT336: a category that is none of them: the name is not read", () => {
  assert.equal(obviousZero("Black tea", ["en:snacks"]), null);
});
test("DT336 AC3: the name only when there is no category, in English, German and Serbian", () => {
  for (const [n, k] of [["Peppermint tea", "tea"], ["Kräutertee", "tea"], ["Pfefferminz Tee", "tea"], ["Čaj od nane", "tea"], ["Чај од нане", "tea"],
    ["Coffee beans", "coffee"], ["Kaffee gemahlen", "coffee"], ["Domaća kafa", "coffee"], ["Кафа", "coffee"],
    ["Still water", "water"], ["Mineralwasser", "water"], ["Voda", "water"], ["Вода", "water"],
    ["Sea salt", "salt"], ["Meersalz fein", null], ["Salz", "salt"], ["Morska so", "salt"], ["Kuhinjska so", "salt"]] as const)
    assert.equal(obviousZero(n), k, n);
});
test("DT336: a whole word only; so alone is not salt", () => {
  for (const n of ["Teacake", "Salted peanuts", "Watermelon", "So good oats", "Steak"]) assert.equal(obviousZero(n), null, n);
});
test("DT336: the words that block the 0 always win", () => {
  for (const n of ["Salt and vinegar crisps", "Tea biscuits", "Coffee cake", "Kaffee Sahne", "Iced tea peach", "Eistee Pfirsich", "Ledeni čaj",
    "Caffe latte", "Cappuccino coffee", "Coffee 3in1", "Tea with milk", "Kaffee mit Milch", "Sea salt chocolate",
    "Salz Kekse", "Coffee syrup", "Water with juice", "Flavoured water", "Wasser mit Geschmack", "Salted nuts with sea salt", "Kolač sa kafom"])
    assert.equal(obviousZero(n, n === "Sea salt chocolate" ? ["en:salts"] : undefined), null, n);
  assert.equal(obviousZero("Peach", ["en:teas", "en:iced-teas"]), null);
  assert.equal(obviousZero("Lemon", ["en:waters", "en:flavoured-waters"]), null);
  assert.equal(obviousZero("Mocha", ["en:coffees", "en:coffee-drinks"]), null);
  assert.equal(obviousZero("Sweet", ["en:teas", "en:sweetened-beverages"]), null);
});
const tea = { product_name: "Peppermint tea", brand: "Herbal & Co", barcode: "4009300000001", calories: null, protein: null, fats: null, carbs: null, fiber: null, table: [], noValues: true, categories: [] };
test("DT336 AC1: a tea from the database with no values is marked as 0", () => {
  const f = candidateFood(tea, "Open Food Facts · 2026-11-22");
  assert.equal(f.zeroKind, "tea");
  assert.equal(f.dbEmpty, undefined);
});
test("DT336 AC7: any other product with no values gets the heads-up, never 0", () => {
  const f = candidateFood({ ...tea, product_name: "Oat biscuits" }, "Open Food Facts · 2026-11-22");
  assert.equal(f.zeroKind, undefined);
  assert.equal(f.dbEmpty, true);
  assert.deepEqual(validateFood(f), ["Energy and protein are required to calculate PD."]);
});
test("DT336 AC8: a tea with values is as today", () => {
  const f = candidateFood({ ...tea, calories: 1, protein: 0, fats: 0, carbs: 0.2, noValues: false }, "Open Food Facts · 2026-11-22");
  assert.equal(f.zeroKind, undefined);
  assert.equal(f.dbEmpty, undefined);
});
test("DT336: a per-100-ml record the app leaves empty is not a product with no values", () => {
  const f = candidateFood({ ...tea, noValues: false }, "Open Food Facts · 2026-11-22");
  assert.equal(f.zeroKind, undefined);
  assert.equal(f.dbEmpty, undefined);
});
test("DT336: values from a photo of the table win: the tea is an ordinary food", () => {
  const f = candidateFood({ ...tea, calories: 2, protein: 0.1 }, "Open Food Facts · 2026-11-22");
  assert.equal(f.zeroKind, undefined);
});
test("DT336 AC2: a tea at 0 passes the checks", () => {
  const f = { ...candidateFood(tea, "Open Food Facts · 2026-11-22"), calories: 0, protein: 0, fats: 0, carbs: 0 };
  assert.deepEqual(validateFood(f), []);
});
test("DT336 AC6: in a dish the tea keeps its grams and adds no energy", async () => {
  const { nutritionOf } = await import("./nutrition");
  const oats = { ...candidateFood({ product_name: "Oats", calories: 370, protein: 13, fats: 7, carbs: 59, fiber: 10 }, "Manual entry") };
  const t = { ...candidateFood(tea, "Open Food Facts · 2026-11-22"), calories: 0, protein: 0, fats: 0, carbs: 0 };
  const alone = nutritionOf([{ grams: 100, food: oats }], 1)!, both = nutritionOf([{ grams: 100, food: oats }, { grams: 300, food: t }], 1)!;
  assert.equal(both.grams, 400);
  assert.equal(both.rows.find((r) => r.key === "energy")!.all, alone.rows.find((r) => r.key === "energy")!.all);
  assert.equal(both.rows.find((r) => r.key === "protein")!.all, alone.rows.find((r) => r.key === "protein")!.all);
});
