// DT334 (0.3.178, board Stories278): up to 3 kitchens you cook
import { test } from "node:test";
import assert from "node:assert/strict";
import { pickKitchen, KITCHENS_MAX } from "./personal";
import { kitchensOf } from "./kitchensMax";

test("DT334 AC2: with 3 picked, a fourth is not picked and says so", () => {
  assert.equal(KITCHENS_MAX, 3);
  assert.deepEqual(pickKitchen(["Balkan", "Italian", "Greek"], "Indian"), { list: ["Balkan", "Italian", "Greek"], full: true });
});
test("DT334 AC3: one off, then another", () => {
  const a = pickKitchen(["Balkan", "Italian", "Greek"], "Greek");
  assert.deepEqual(a, { list: ["Balkan", "Italian"], full: false });
  assert.deepEqual(pickKitchen(a.list, "Indian"), { list: ["Balkan", "Italian", "Indian"], full: false });
});
test("DT334 AC4: a list from before with more is kept; a tap takes one off, a new one is not picked", () => {
  const before = ["Balkan", "Italian", "Mediterranean", "German", "French"];
  assert.deepEqual(pickKitchen(before, "Indian"), { list: before, full: true });
  assert.deepEqual(pickKitchen(before, "German").list, ["Balkan", "Italian", "Mediterranean", "French"]);
  assert.deepEqual(pickKitchen(undefined, "Thai"), { list: ["Thai"], full: false });
});
test("DT334 AC4: Chef Mealan is sent the first 3, in the order they were tapped", () => {
  assert.deepEqual(kitchensOf(["Balkan", "Italian", "Mediterranean", "German", "French"]), ["Balkan", "Italian", "Mediterranean"]);
  assert.deepEqual(kitchensOf(undefined), []);
  assert.deepEqual(kitchensOf(["Greek"]), ["Greek"]);
});
