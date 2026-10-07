import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { numbersOf, numberChecks, type NumberCase, type Snapshot } from "./numbersEval";

// Numbers evals on every push: the ten people of evals/number-cases.json hold every check, and their numbers stay as
// recorded. A change to the calculation that moves them is shown to the coach, then recorded with npm run eval:numbers -- --update.
const cases: NumberCase[] = JSON.parse(readFileSync(new URL("../evals/number-cases.json", import.meta.url), "utf8")).cases;
const snap: Snapshot = JSON.parse(readFileSync(new URL("../evals/number-snapshot.json", import.meta.url), "utf8"));
for (const c of cases) {
  test(`numbers eval ${c.id}: ${c.title}`, () => {
    const o = numbersOf(c);
    assert.ok(o, "calculated");
    const bad = Object.entries(numberChecks(c, o!, snap[c.id])).filter(([, v]) => !v).map(([k]) => k);
    assert.deepEqual(bad, [], `${c.id}: ${o!.kcal} kcal, ${o!.protein} g protein`);
  });
}
