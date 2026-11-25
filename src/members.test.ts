import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanShared, portionOf, membersFor, firstName } from "./members";

const f = (name: string, calories: number, protein: number) => ({ name, brand: "", calories, protein, fats: 5, carbs: 10, fiber: 0, readyToEat: true });
const stir = { title: "Chicken and broccoli stir-fry with rice", kitchen: "Chinese", sharedAt: "2026-10-16T10:00:00Z", steps: [], items: [
  { id: "a", grams: 400, food: f("Chicken breast, cooked", 165, 31) }, { id: "b", grams: 400, food: f("Broccoli", 34, 2.8) },
  { id: "c", grams: 500, food: f("Rice, cooked", 130, 2.7) }, { id: "d", grams: 40, food: f("Soy sauce", 53, 8) }, { id: "e", grams: 20, food: f("Sesame oil", 884, 0) }] };
const salmon = { title: "Salmon", kitchen: "Mediterranean", sharedAt: "2026-10-16T11:00:00Z", steps: [], items: [{ id: "a", grams: 180, food: f("Salmon", 208, 20) }, { id: "b", grams: 300, food: f("Potatoes", 77, 2) }, { id: "c", grams: 10, food: f("Olive oil", 884, 0) }] };
const pb = { title: "Toast with peanut butter", kitchen: null, sharedAt: "2026-10-16T12:00:00Z", steps: [], items: [{ id: "a", grams: 60, food: f("Peanut butter", 588, 25) }] };

test("CO3: Nina's stir-fry at an 850 kcal dinner: 700 g of the 1,360 g it makes (the drawing said 705: the foods to 5 g each add up to 700), PD 9.2", () => {
  const p = portionOf(stir, 850);
  assert.equal(p.total, 1360); assert.equal(p.grams, 700); assert.equal(Math.round(p.pd! * 10) / 10, 9.2);
  assert.deepEqual(p.items.map((i) => i.grams), [205, 205, 260, 20, 10]);
});
test("Members: allergies hidden; at or above the target first, then your kitchens", () => {
  const out = membersFor([salmon, pb, stir], { target: 6.4, kitchens: ["Mediterranean"], allergies: ["peanut"] });
  assert.deepEqual(out.map((r) => r.title), ["Chicken and broccoli stir-fry with rice", "Salmon"]);
  assert.deepEqual(membersFor([salmon, stir], { target: 6.4, kitchens: [], allergies: [], kitchen: "Mediterranean" }).map((r) => r.title), ["Salmon"]);
});
test("what a shared recipe may carry: names, values, amounts, steps and a kitchen, nothing else", () => {
  const c = cleanShared({ title: "  Salmon  ", kitchen: "Mediterranean", steps: ["Bake it."], notes: "private", items: [{ id: "a", grams: 180, food: { ...f("Salmon", 208, 20), notes: "my note", photo: "data:image/jpeg;base64,x" } }, { id: "b", grams: 0, food: f("Air", 0, 0) }] })!;
  assert.equal(c.title, "Salmon"); assert.equal(c.items.length, 1); assert.equal((c.items[0].food as any).notes, undefined); assert.equal((c.items[0].food as any).photo, undefined); assert.equal((c as any).notes, undefined);
  assert.equal(cleanShared({ title: "", items: [] }), null);
  assert.equal(firstName("Milan Stancevic"), "Milan");
});

// B170 (0.3.196, board B170, canvas Page 6; Coach Milan, Go 25 November 2026, 20:01)
import { sharedOf, foodMatcher, itemsOf } from "./members";
const pack = (id: string, name: string, calories: number, barcode?: string) => ({ id, name, brand: "", calories, protein: 6, fats: 25, carbs: 36, fiber: 1.5, basis: "100g" as const, source: "label", notes: "my note", reviewedAt: "2026-11-20T10:00:00Z", readyToEat: false, photo: "data:image/jpeg;base64,x", ...(barcode ? { barcode } : {}) });
test("B170 AC1: sharing keeps a pack's source and barcode and a basic food's source and id; no notes, no photos", () => {
  const eggs = { ...pack("e", "Eggs", 143), source: "Reference table", refId: "egg-whole" };
  const meal: any = { id: "m", title: "Lazy Burek", items: [{ id: "b", grams: 375, locked: false, food: pack("t", "Frischer Blätterteig", 400, "4000000000035") }, { id: "d", grams: 122, locked: false, food: eggs }], steps: [] };
  const c = cleanShared(JSON.parse(JSON.stringify(sharedOf(meal, "Balkan"))))!;
  assert.deepEqual([c.items[0].food.source, c.items[0].food.barcode, c.items[0].food.refId], ["label", "4000000000035", undefined]);
  assert.deepEqual([c.items[1].food.source, c.items[1].food.barcode, c.items[1].food.refId], ["Reference table", undefined, "egg-whole"]);
  assert.equal((c.items[0].food as any).notes, undefined); assert.equal((c.items[0].food as any).photo, undefined);
  const mine = itemsOf(c)[0].food;
  assert.deepEqual([mine.source, mine.barcode], ["label", "4000000000035"]);
  assert.equal(itemsOf({ items: [{ id: "x", grams: 10, food: { name: "Salt", brand: "", calories: 0, protein: 0, fats: 0, carbs: 0, fiber: 0, readyToEat: false } }] })[0].food.source, "members");
});
test("B170 AC2: a wrong barcode, source or basic food id is dropped; the food stays", () => {
  const c = cleanShared({ title: "X", items: [{ id: "a", grams: 100, food: { ...pack("t", "Teig", 400), barcode: "abc12", source: "x".repeat(200), refId: "<b>" } }] })!;
  assert.equal(c.items.length, 1); assert.equal(c.items[0].food.name, "Teig");
  assert.deepEqual([c.items[0].food.barcode, c.items[0].food.source, c.items[0].food.refId], [undefined, undefined, undefined]);
  assert.equal(cleanShared({ title: "X", items: [{ id: "a", grams: 100, food: { ...pack("t", "Teig", 400), barcode: "1234567" } }] })!.items[0].food.barcode, undefined);
});
test("B170 AC4 and AC5: by barcode first; my pack with another barcode is another food; the same barcode is mine once", () => {
  const myTeig = pack("f-teig", "Frischer Blätterteig", 330, "4000000000042"), myTyped = pack("f-typed", "Feta Leicht", 175);
  const lib = foodMatcher([myTeig, myTyped]);
  assert.equal(lib.find({ name: "Frischer Blätterteig", brand: "", barcode: "4000000000035" }), undefined);
  assert.equal(lib.find({ name: "Anything", brand: "", barcode: "4000000000042" }), myTeig);
  assert.equal(lib.find({ name: "Frischer Blätterteig", brand: "" }), myTeig);
  assert.equal(lib.find({ name: "Feta Leicht", brand: "", barcode: "4000000000028" }), myTyped, "a food of mine with no barcode still matches by name and brand");
  const egg = { ...pack("f-egg", "Ei", 140), refId: "egg-whole" }; const lib2 = foodMatcher([egg]);
  assert.equal(lib2.find({ name: "Eggs", brand: "", refId: "egg-whole" }), egg);
  const sams = pack("n1", "Frischer Blätterteig", 400, "4000000000035"); lib.add(sams);
  assert.equal(lib.find({ name: "Frischer Blätterteig", brand: "", barcode: "4000000000035" }), sams);
});
