import test from "node:test";
import assert from "node:assert/strict";
import { activePlaces, inPlace, inferPlaces, placesOfNew, renameForPlace, tripOn, tripOver, samePlace, usedIds } from "./places";
const F = (x: any) => ({ id: "a", name: "x", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories: 1, protein: 1, fats: 0, carbs: 0, fiber: 0, ...x });
test("DT136: home is always on; another place only when switched on or on its trip", () => {
  const a = activePlaces("limassol", [], null, "2026-10-28");
  assert.equal(inPlace(F({ places: ["belgrade"] }), a), false);
  assert.equal(inPlace(F({ places: ["limassol"] }), a), true);
  assert.equal(inPlace(F({ places: [] }), a), true);
  assert.equal(inPlace(F({}), a), true);
  assert.equal(inPlace(F({ places: ["belgrade"] }), activePlaces("limassol", ["belgrade"], null, "2026-10-28")), true);
});
test("DT136: a trip is on for its days; its switch wins; it is over the day after", () => {
  const t = { place: "belgrade" as const, from: "2026-11-03", to: "2026-11-10" };
  assert.equal(tripOn(t, "2026-11-02"), false); assert.equal(tripOn(t, "2026-11-03"), true); assert.equal(tripOn(t, "2026-11-11"), false);
  assert.equal(tripOn({ ...t, on: true }, "2026-11-01"), true); assert.equal(tripOn({ ...t, on: false }, "2026-11-05"), false);
  assert.equal(tripOver(t, "2026-11-10"), false); assert.equal(tripOver(t, "2026-11-11"), true);
  assert.equal(inPlace(F({ places: ["belgrade"] }), activePlaces("limassol", [], t, "2026-11-05")), true);
});
test("DT136: places in one market match: Belgrade and Serbia, Munich and Germany", () => {
  assert.ok(samePlace("belgrade", "serbia")); assert.ok(samePlace("munich", "germany")); assert.ok(!samePlace("belgrade", "limassol"));
});
test("DT136: a food from before gets its place from its name", () => {
  assert.deepEqual(inferPlaces(F({ name: "Pileća prsa, sirova", refId: "chicken-breast-raw", source: "Reference table" })), ["belgrade"]);
  assert.deepEqual(inferPlaces(F({ name: "Chicken breast, raw", refId: "chicken-breast-raw", source: "Reference table" })), []);
  assert.deepEqual(inferPlaces(F({ name: "Pileći file", source: "Members' foods", notes: "Members' foods, checked by a member on 2026-10-20; seen in Belgrade." })), ["belgrade"]);
  assert.deepEqual(inferPlaces(F({ name: "My scan" })), []);
});
test("DT136: a new food takes the place you are in; a basic or common starter food is sold everywhere", () => {
  assert.deepEqual(placesOfNew(F({ name: "Kajmak" }), "belgrade"), ["belgrade"]);
  assert.deepEqual(placesOfNew(F({ name: "Oats", brand: "typical values, check your pack" }), "belgrade"), []);
  assert.deepEqual(placesOfNew(F({ name: "Chicken breast, raw", source: "Reference table", refId: "chicken-breast-raw" }), "belgrade"), []);
});
test("DT136: a basic food takes the name of where you are; the old name stays as another", () => {
  const g = renameForPlace(F({ name: "Pileća prsa, sirova", refId: "chicken-breast-raw" }), "limassol");
  assert.equal(g.name, "Chicken breast, raw"); assert.ok(g.aliases!.includes("Pileća prsa, sirova"));
  const own = F({ name: "My chicken", refId: "chicken-breast-raw" });
  assert.equal(renameForPlace(own, "limassol"), own);
});
test("DT136: a food on a plate, in a recipe, logged or a favourite is used", () => {
  const foods = [F({ id: "u1" }), F({ id: "u2" }), F({ id: "u3", favorite: true }), F({ id: "u4" })];
  const used = usedIds({ items: [{ food: { id: "u1" } }], meals: [], feedback: [{ foods: [{ id: "u2" }] }], foods }, null);
  assert.deepEqual([...used].sort(), ["u1", "u2", "u3"]);
});
