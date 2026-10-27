// Eval 1 for Photo of my meal runs on every push: the advice by code on the 20 plates in evals/photo-advice-cases.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runAdvice } from "../evals/advice";

test("Eval 1 (DT127, DT130, DT132, DT133): Chef Mealan's advice on a photo plate follows the coach's rules, 22 of 22", () => {
  const r = runAdvice();
  assert.equal(r.length, 22);
  // a case marked open fails on purpose: it names a decision that waits for the coach
  const fails = r.filter((x) => !x.ok && !x.open).map((x) => `${x.id}: ${x.misses.join("; ")} :: ${x.line}`);
  assert.deepEqual(fails, []);
});
