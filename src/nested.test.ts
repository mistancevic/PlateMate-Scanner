// 0.3.57 (Coach Milan 2 November 17:50): "Function WriteBatch.set() called with invalid data. Nested arrays are not supported".
// The account's database refuses an array inside an array. 0.3.56 kept a recipe's moves that way. Nothing that goes to the
// account may hold one; moves already on a phone are turned into { m: [...] } when the app opens.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fixMoves, repairState } from "./pilot";
import { stripPhotos } from "./cloud";
import { clean } from "./records";

const nested = (x: any, path = ""): string | null => {
  if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) { if (Array.isArray(x[i])) return `${path}[${i}]`; const r = nested(x[i], `${path}[${i}]`); if (r) return r; } return null; }
  if (x && typeof x === "object") { for (const k of Object.keys(x)) { const r = nested(x[k], `${path}.${k}`); if (r) return r; } }
  return null;
};
const old = [["Add [[i:a|eggs]].", "Add [[i:b|milk]]."], null, ["Fold them."]];
const meal = () => ({ id: "m1", title: "Crêpes", items: [], portion: 100, savedAt: "2026-11-02T10:00:00Z", steps: ["a", "b", "c"], moves: structuredClone(old) });

test("0.3.57: moves saved as lists inside a list are turned into { m } wherever they sit", () => {
  const s: any = { version: 1, goals: {}, foods: [], meals: [meal()], feedback: [{ id: "f", meal: meal() }], preferences: "", items: [], title: "", portion: null,
    cook: { ui: { plateSteps: { steps: ["a"], moves: structuredClone(old) }, way: { drafted: { steps: ["a"], moves: structuredClone(old) } } } }, later: [{ cook: { ui: { plateSteps: { moves: structuredClone(old) } } } }] };
  repairState(s);
  assert.equal(nested(s), null, "no list inside a list: " + nested(s));
  assert.deepEqual(s.meals[0].moves, [{ m: ["Add [[i:a|eggs]].", "Add [[i:b|milk]]."] }, { m: [] }, { m: ["Fold them."] }]);
  assert.deepEqual(fixMoves({ moves: [{ m: ["x"] }] }), { moves: [{ m: ["x"] }] }, "the new shape stays as it is");
});
test("0.3.57: what goes to the account holds no list inside a list, even from an old copy in memory", () => {
  const s: any = { version: 1, goals: {}, foods: [], meals: [meal()], feedback: [], preferences: "", items: [], title: "", portion: null, cook: { ui: { plateSteps: { moves: structuredClone(old) } } } };
  assert.equal(nested(stripPhotos(s)), null);
  assert.equal(nested(clean("recipes", meal())), null);
  assert.equal(nested(clean("cards", { id: "f", meal: meal() })), null);
});
