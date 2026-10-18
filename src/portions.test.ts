import { test } from "node:test";
import assert from "node:assert/strict";
import { plural, yourPortions } from "./portions";

test("R12: the whole recipe in your portions", () => {
  assert.equal(yourPortions(3730, 933), 4);
  assert.equal(yourPortions(6770, 564), 12);
  assert.equal(yourPortions(900, 1200), 1);
  assert.equal(yourPortions(900, 0), 1);
  assert.deepEqual(["lunch", "dinner", "breakfast", "snack", "meal"].map(plural), ["lunches", "dinners", "breakfasts", "snacks", "meals"]);
});
