// The save check (rule S1, docs/rules/storage.md): what a phone sends to the account holds nothing Firestore refuses.
import { test } from "node:test";
import assert from "node:assert/strict";
import { shapeProblems, saveCheck, PILOT_KEY } from "./saveShape";

const base = { version: 1, goals: {}, foods: [], meals: [], feedback: [], preferences: "", items: [], title: "", portion: null };
test("S1: the shapes the account refuses are named with their path", () => {
  assert.deepEqual(shapeProblems({ a: [[1]] }, "doc"), ["doc.a[0]: a list inside a list"]);
  assert.deepEqual(shapeProblems({ a: [{ b: [1, 2] }] }), [], "a list in a map in a list is fine");
  assert.match(shapeProblems({ "": 1 })[0], /field name "" is not allowed/);
  assert.match(shapeProblems({ __x__: 1 })[0], /field name "__x__"/);
  let deep: any = 1; for (let i = 0; i < 25; i++) deep = { d: deep };
  assert.match(shapeProblems(deep)[0], /nested deeper than 20/);
  assert.match(shapeProblems({ s: "x".repeat(1_100_000) })[0], /past the 1 MiB/);
});
test("S1: a phone's storage is checked as the account would get it", () => {
  const meal = { id: "m1", title: "Crêpes", items: [], portion: 100, savedAt: "2026-11-02T10:00:00Z", steps: ["a"], moves: [["Add eggs."]] };
  const ok = saveCheck({ [PILOT_KEY]: JSON.stringify({ ...base, meals: [meal] }), "chefmealan-goal": JSON.stringify({ band: "maintain" }) });
  assert.ok(ok.writes >= 3, "the block, its preview copy and the recipe: " + ok.writes);
  assert.deepEqual(ok.problems, [], "old moves are repaired on the way, as on the phone");
  const bad = saveCheck({ [PILOT_KEY]: JSON.stringify({ ...base, meals: [{ ...meal, grid: [[1, 2], [3]] }] }) });
  assert.ok(bad.problems.some((p) => /recipes\/m1.*grid\[0\]: a list inside a list/.test(p)), JSON.stringify(bad.problems));
  assert.deepEqual(saveCheck({}), { writes: 0, problems: [] }, "no app storage, nothing to check");
});
