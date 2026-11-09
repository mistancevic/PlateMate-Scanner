import test from "node:test";
import assert from "node:assert/strict";
import { dishOf, visitFor, upsertServed, visitsOf, withNote, mealItems, mealTitle, type Served } from "./served";

const food = (name: string) => ({ id: name, name, calories: 100, protein: 10, fats: 1, carbs: 1, fiber: 0 }) as any;
const plate = (id: string, at: string, x: Partial<Served> = {}): Served => ({ id, name: id, dish: "main", mine: true, at, visit: "v1", items: [{ id: "i", grams: 100, locked: false, food: food(id) } as any], photo: "data:image/jpeg;base64,xx", ...x });

test("DT268: the dish is one of five, anything else is a main", () => {
  assert.equal(dishOf("dessert"), "dessert");
  assert.equal(dishOf("soup"), "main");
  assert.equal(dishOf(undefined), "main");
});
test("DT268: a plate joins the visit of the same day within two and a half hours, else none", () => {
  const list = [plate("a", "2026-11-07T12:00:00"), plate("b", "2026-11-07T19:30:00", { visit: "v2" })];
  assert.equal(visitFor(list, "2026-11-07T13:40:00"), "v1");
  assert.equal(visitFor(list, "2026-11-07T20:10:00"), "v2");
  assert.equal(visitFor(list, "2026-11-07T16:00:00"), null);
  assert.equal(visitFor(list, "2026-11-08T12:10:00"), null);
});
test("DT268: keeping the plate as it stands settles: the same list when nothing changed", () => {
  const a = plate("a", "2026-11-07T12:00:00");
  const one = upsertServed([], a);
  assert.equal(one.length, 1);
  assert.equal(upsertServed(one, structuredClone(a)), one);
  const two = upsertServed(one, { ...a, name: "Ana's meatballs" });
  assert.notEqual(two, one); assert.equal(two[0].name, "Ana's meatballs");
});
test("DT268: keeping a plate again keeps its visit's note and that it was eaten", () => {
  const a = plate("a", "2026-11-07T12:00:00", { note: "Café Jadran", eatenAt: "2026-11-07T12:00:00" });
  const next = upsertServed([a], plate("a", "2026-11-07T12:00:00", { dish: "dessert" }));
  assert.equal(next[0].note, "Café Jadran"); assert.equal(next[0].eatenAt, "2026-11-07T12:00:00"); assert.equal(next[0].dish, "dessert");
});
test("DT268: visits, the latest first; your dishes in the order of a meal, the others as scanned", () => {
  const list = [
    plate("dessert", "2026-11-07T13:10:00", { dish: "dessert" }), plate("main", "2026-11-07T12:30:00"), plate("starter", "2026-11-07T12:40:00", { dish: "starter" }),
    plate("ana", "2026-11-07T12:35:00", { mine: false }), plate("old", "2026-11-01T19:00:00", { visit: "v0" }),
  ];
  const v = visitsOf(list);
  assert.deepEqual(v.map((x) => x.id), ["v1", "v0"]);
  assert.deepEqual(v[0].mine.map((s) => s.id), ["starter", "main", "dessert"]);
  assert.deepEqual(v[0].others.map((s) => s.id), ["ana"]);
});
test("DT268: a visit's note sits on every plate of it; an empty one takes it off", () => {
  const list = [plate("a", "2026-11-07T12:00:00"), plate("b", "2026-11-07T12:10:00"), plate("c", "2026-11-01T12:00:00", { visit: "v0" })];
  const noted = withNote(list, "v1", "  Café   Jadran ");
  assert.deepEqual(noted.map((s) => s.note), ["Café Jadran", "Café Jadran", undefined]);
  assert.equal(visitsOf(noted)[0].note, "Café Jadran");
  assert.deepEqual(withNote(noted, "v1", " ").map((s) => s.note), [undefined, undefined, undefined]);
});
test("DT268: your dishes as one meal: every food once, named after the main", () => {
  const plates = [plate("Bruschetta", "2026-11-07T12:00:00", { dish: "starter" }), plate("Croque madame", "2026-11-07T12:20:00")];
  const items = mealItems(plates);
  assert.equal(items.length, 2); assert.equal(new Set(items.map((i) => i.id)).size, 2);
  assert.equal(mealTitle(plates), "Croque madame");
  assert.equal(mealTitle([plates[0]]), "Bruschetta");
});
