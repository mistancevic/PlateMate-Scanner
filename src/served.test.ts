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

// ---- step 3: the menu ----
import { cleanMenu, withMenuLine, withoutMenuLine, applyMenu, MENU_BAND } from "./served";
const raw = { lines: [{ name: " Ćufte u paradajz sosu, pire ", grams: 300, unit: "g", course: "main", about: "fried, in tomato sauce" }, { name: "Kesadilja sa piletinom", grams: 320, course: "main" }, { name: "Kesadilja sa sirom", grams: 280, course: "main" }, { name: "Limunada", grams: 330, unit: "ml", course: "drink" }, { name: "", grams: 100 }, { name: "Hleb", grams: 5 }],
  matches: [{ plate: "a", line: 0, sure: true }, { plate: "b", line: 1, sure: false, options: [1, 2, 9] }, { plate: "zz", line: 0, sure: true }, { plate: "c", line: 4, sure: true }] };
test("DT268 step 3: the menu read is checked: names, weights in sense, plates of the visit, lines that exist", () => {
  const m = cleanMenu(raw, ["a", "b", "c"])!;
  assert.equal(m.lines[0].name, "Ćufte u paradajz sosu, pire"); assert.equal(m.lines[0].grams, 300); assert.equal(m.lines[0].unit, "g");
  assert.equal(m.lines[3].unit, "ml");
  assert.equal(m.lines[5].grams, undefined, "5 g is no weight of a dish");
  assert.deepEqual(m.matches, [{ plate: "a", line: 0 }]);
  assert.deepEqual(m.asks, [{ plate: "b", options: [1, 2] }], "two lines fit: asked, with the lines that exist");
  assert.equal(cleanMenu({ lines: [{ name: "" }] }, ["a"]), null);
  assert.equal(cleanMenu(null, ["a"]), null);
});
test("DT268 step 3: a plate takes its line: the menu's weight is the plate's total, each food in proportion, the range the menu's band", () => {
  const p0 = plate("a", "2026-11-07T12:00:00", { dish: "starter", items: [{ id: "1", grams: 150, locked: false, est: { low: 100, high: 220 }, food: food("meat") } as any, { id: "2", grams: 50, locked: false, est: { low: 30, high: 80 }, food: food("mash") } as any] });
  const m = cleanMenu(raw, ["a"])!;
  const p1 = withMenuLine(p0, m.lines[0]);
  assert.deepEqual(p1.items.map((i) => i.grams), [225, 75]);
  assert.equal(p1.items.reduce((n, i) => n + i.grams, 0), 300);
  assert.deepEqual(p1.items[0].est, { low: Math.round(225 * (1 - MENU_BAND)), high: Math.round(225 * (1 + MENU_BAND)) });
  assert.equal(p1.dish, "main"); assert.equal(p1.menu?.name, "Ćufte u paradajz sosu, pire");
  // another line later starts from the photo's foods again, not from the scaled ones
  const p2 = withMenuLine(p1, m.lines[2]);
  assert.equal(p2.items.reduce((n, i) => n + i.grams, 0), 280);
  // Not this: back to the photo's read
  const back = withoutMenuLine(p2);
  assert.deepEqual(back.items.map((i) => i.grams), [150, 50]); assert.deepEqual(back.items[0].est, { low: 100, high: 220 }); assert.equal(back.menu, undefined);
});
test("DT268 step 3: a line with no weight names the plate and its dish, and leaves the amounts", () => {
  const p0 = plate("a", "2026-11-07T12:00:00");
  const p1 = withMenuLine(p0, { name: "Supa dana", course: "starter" });
  assert.deepEqual(p1.items, p0.items); assert.equal(p1.dish, "starter"); assert.equal(p1.menu?.was, undefined);
});
test("DT268 step 3: the read is applied to the plates of that visit only", () => {
  const list = [plate("a", "2026-11-07T12:00:00"), plate("b", "2026-11-07T12:10:00"), plate("x", "2026-11-01T12:00:00", { visit: "v0" })];
  const out = applyMenu(list, "v1", cleanMenu({ lines: raw.lines, matches: [{ plate: "a", line: 0, sure: true }, { plate: "x", line: 1, sure: true }] }, ["a", "b", "x"])!);
  assert.equal(out[0].menu?.grams, 300); assert.equal(out[1].menu, undefined); assert.equal(out[2].menu, undefined);
});
test("DT268 step 3: a plate matched to the menu keeps its match while it is still on the Plate", () => {
  const p1 = withMenuLine(plate("a", "2026-11-07T12:00:00"), { name: "X", grams: 300, unit: "g" });
  const list = [p1];
  assert.equal(upsertServed(list, plate("a", "2026-11-07T12:00:00")), list);
});
