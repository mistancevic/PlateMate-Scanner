// BP1 (0.3.51): the numbers on /built are counted by scripts/built-facts.cjs, never typed. This fails when the file is behind
// the repo: a new version, a walkthrough or an eval case added without running the script again.
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import facts from "./builtFacts.json" with { type: "json" };
const require = createRequire(import.meta.url);
const counts = require("../scripts/built-counts.cjs");

test("the /built facts match the repo: version, walkthroughs, evals", () => {
  const now = counts.fromFiles(process.cwd());
  for (const k of ["version", "walkthroughs", "evalCases", "evalSets", "liveSince", "numberedSince"] as const) assert.equal((facts as any)[k], now[k], `${k}: run node scripts/built-facts.cjs`);
});
test("the /built facts: releases at least the change log's, unit tests counted, a rate per day", () => {
  assert.ok(facts.releases >= counts.releases(process.cwd()), "releases behind the change log: run node scripts/built-facts.cjs");
  assert.ok(facts.unitTests > 500 && facts.perDay >= 1);
});
