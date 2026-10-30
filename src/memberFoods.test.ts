import { test } from "node:test";
import assert from "node:assert/strict";
import { travels, alsoSeen, seenLine, asMine, type MemberFood } from "./memberFoods";
import type { Food } from "./pilot";

const F = (id: string, name: string, extra: Partial<Food> = {}): Food => ({ id, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-10-20T10:00:00Z", readyToEat: true, calories: 100, protein: 10, fats: 1, carbs: 1, fiber: null, ...extra }) as Food;
const M = (name: string, extra: Partial<MemberFood> = {}): MemberFood => ({ key: "k:" + name, name, brand: "", calories: 99, protein: 23, fats: 0.5, carbs: 0, fiber: 0, source: "label", seenIn: ["belgrade"], updatedAt: "2026-10-25T01:00:00Z", ...extra });

test("DT115: which of your foods travel: reviewed, with numbers, never the basic foods, starters, estimates or members' copies", () => {
  assert.equal(travels(F("x", "Tuna in olive oil, drained")), true);
  assert.equal(travels(F("x", "Tuna", { reviewedAt: undefined })), false);
  assert.equal(travels(F("x", "Apple", { source: "Reference table" })), false);
  assert.equal(travels(F("f-nutella", "Nutella")), false);
  assert.equal(travels(F("x", "Skyr", { brand: "typical values, check your pack" })), false);
  assert.equal(travels(F("x", "Skyr", { source: "Members' foods" })), false);
  assert.equal(travels(F("x", "Skyr", { calories: null })), false);
});
test("DT115: the same food in another state from the catalogue, and where it was seen", () => {
  const mine = F("x", "Tuna in olive oil, drained", { barcode: "1" });
  const cat = [M("Tuna in water, drained", { barcode: "2", seenIn: ["munich", "cyprus"] }), M("Chicken breast")];
  assert.equal(alsoSeen(mine, cat)?.name, "Tuna in water, drained");
  assert.equal(alsoSeen(F("y", "Skyr, natural"), cat), null);
  // DT171 (privacy finding 9, option a): where a food was seen is never shown to other members
  assert.equal(seenLine(cat[0], "munich"), ""); assert.equal(seenLine(cat[0], "belgrade"), "");
  let n = 0; const copy = asMine(cat[0], () => "u" + ++n);
  assert.equal(copy.source, "Members' foods"); assert.equal(copy.barcode, "2"); assert.equal(copy.calories, 99); assert.equal(copy.notes, "Members' foods, checked by a member."); assert.ok(!/2026|Munich|Cyprus/.test(copy.notes), "no day, no market");
});
