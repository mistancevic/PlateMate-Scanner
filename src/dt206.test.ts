// DT205 and DT206 (0.3.48; Coach Milan 1 November 19:42 findings, 19:54 Go)
import { test } from "node:test";
import assert from "node:assert/strict";
import { isDrink } from "./mixtip";
import { profileOdd } from "./profileOdd";
const F = (name: string, calories: number) => ({ id: name, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-01T00:00:00Z", readyToEat: true, calories, protein: 0.3, fats: 0, carbs: 5, fiber: 0 }) as any;
test("DT206: an alcohol-free beer is a drink; a chicken breast is not", () => {
  assert.equal(isDrink(F("Augustiner Alkoholfrei Hell", 25)), true);
  assert.equal(isDrink(F("Radler", 40)), true);
  assert.equal(isDrink(F("Chicken breast, cooked", 165)), false);
});
test("DT205: a typed number that cannot be right yet waits", () => {
  assert.equal(profileOdd({ birthYear: 19 } as any), "the birth year needs four digits");
  assert.equal(profileOdd({ birthYear: 1981, heightCm: 18 } as any), "the height looks wrong");
  assert.equal(profileOdd({ birthYear: 1981, heightCm: 182, weightKg: 93 } as any), null);
});
