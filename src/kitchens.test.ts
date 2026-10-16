import { test } from "node:test";
import assert from "node:assert/strict";
import { KITCHEN, tasteOf, another, anotherLeft, undo, tasteForChef } from "./kitchens";
import { KITCHENS } from "./personal";

test("every kitchen on the page has a line and eight dishes, none twice", () => {
  for (const k of KITCHENS) {
    assert.ok(KITCHEN[k], `${k} has content`);
    assert.ok(KITCHEN[k].what.length > 40, `${k} has a line`);
    assert.equal(KITCHEN[k].dishes.length, 8, `${k} has eight dishes`);
    assert.equal(new Set(KITCHEN[k].dishes).size, 8, `${k} has no dish twice`);
  }
});

test("CH7b: Another swaps a dish in its place and remembers it; Undo brings it back", () => {
  const t0 = tasteOf({}, "Balkan");
  assert.deepEqual(t0.shown, ["Šopska salad with grilled chicken", "Sarma", "Ćevapi with ajvar and onion"]);
  const t1 = another(t0, "Balkan", 2);
  assert.deepEqual(t1.shown, ["Šopska salad with grilled chicken", "Sarma", "Stuffed peppers"]);
  assert.deepEqual(t1.out, [{ dish: "Ćevapi with ajvar and onion", with: "Stuffed peppers" }]);
  const t2 = another(t1, "Balkan", 0);
  assert.equal(t2.shown[0], "Bean stew with smoked meat");
  assert.deepEqual(undo(t2).shown, t1.shown);
  assert.deepEqual(undo(undo(t2)), t0);
  // after all eight: Another does nothing, and says there are no more
  let t = t0; for (let i = 0; i < 5; i++) t = another(t, "Balkan", 1);
  assert.equal(anotherLeft(t, "Balkan"), false);
  assert.deepEqual(another(t, "Balkan", 1), t);
});

test("Chef Mealan gets the dishes kept and the ones swapped away, per kitchen picked", () => {
  const p = { kitchens: ["Balkan", "Italian"], kitchenTaste: { Balkan: another(tasteOf({}, "Balkan"), "Balkan", 2) } };
  assert.deepEqual(tasteForChef(p), [
    { kitchen: "Balkan", cook_toward: ["Šopska salad with grilled chicken", "Sarma", "Stuffed peppers"], leave_out: ["Ćevapi with ajvar and onion"] },
    { kitchen: "Italian", cook_toward: ["Pasta al pomodoro with chicken", "Mushroom risotto", "Minestrone"], leave_out: [] },
  ]);
});
