import { test } from "node:test";
import assert from "node:assert/strict";
import { servingChips, stepping, portionShare, portionsInWhole } from "./servings";

test("DT349 AC5: the chips are 1 to 5, only numbers", () => {
  assert.deepEqual(servingChips(4), [1, 2, 3, 4, 5]);
});
test("DT349: the recipe's own number and the plan's join the chips when they are other", () => {
  assert.deepEqual(servingChips(8), [1, 2, 3, 4, 5, 8]);
  assert.deepEqual(servingChips(4, 6), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(servingChips(4, 3), [1, 2, 3, 4, 5]);
});
test("DT349 AC8: − and + are grey until used, and in use for a number outside the chips", () => {
  const c = servingChips(4);
  assert.equal(stepping(2, c, false), false);
  assert.equal(stepping(5, c, true), true);
  assert.equal(stepping(10, c, false), true);
});
test("DT349 AC11: my dinner of 733 kcal is a third of a 2,194 kcal recipe", () => {
  const s = portionShare(733, 2194);
  assert.equal(Math.round(897 * s), 300);
  assert.equal(portionsInWhole(s), 3);
});
test("DT349: a portion is never more than the whole recipe", () => {
  assert.equal(portionShare(3000, 2194), 1);
  assert.equal(portionShare(500, 0), 1);
});
