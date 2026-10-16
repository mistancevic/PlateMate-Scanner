import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanShared, portionOf, membersFor, firstName } from "./members";

const f = (name: string, calories: number, protein: number) => ({ name, brand: "", calories, protein, fats: 5, carbs: 10, fiber: 0, readyToEat: true });
const stir = { title: "Chicken and broccoli stir-fry with rice", kitchen: "Chinese", sharedAt: "2026-10-16T10:00:00Z", steps: [], items: [
  { id: "a", grams: 400, food: f("Chicken breast, cooked", 165, 31) }, { id: "b", grams: 400, food: f("Broccoli", 34, 2.8) },
  { id: "c", grams: 500, food: f("Rice, cooked", 130, 2.7) }, { id: "d", grams: 40, food: f("Soy sauce", 53, 8) }, { id: "e", grams: 20, food: f("Sesame oil", 884, 0) }] };
const salmon = { title: "Salmon", kitchen: "Mediterranean", sharedAt: "2026-10-16T11:00:00Z", steps: [], items: [{ id: "a", grams: 180, food: f("Salmon", 208, 20) }, { id: "b", grams: 300, food: f("Potatoes", 77, 2) }, { id: "c", grams: 10, food: f("Olive oil", 884, 0) }] };
const pb = { title: "Toast with peanut butter", kitchen: null, sharedAt: "2026-10-16T12:00:00Z", steps: [], items: [{ id: "a", grams: 60, food: f("Peanut butter", 588, 25) }] };

test("CO3: Davorka's stir-fry at an 850 kcal dinner: 700 g of the 1,360 g it makes (the drawing said 705: the foods to 5 g each add up to 700), PD 9.2", () => {
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
