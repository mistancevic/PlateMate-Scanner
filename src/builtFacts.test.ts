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
// G1 (0.3.157): the releases are the versions in the change log and docs/versions.md together, each once, with the version
// being built; no git is read, so a fresh shallow clone with no tags counts the same
test("G1: the /built facts: releases counted from the change log and docs/versions.md, unit tests counted, a rate per day", () => {
  assert.equal(facts.releases, counts.releases(process.cwd()), "releases: run node scripts/built-facts.cjs");
  assert.ok(facts.unitTests > 500 && facts.perDay >= 1);
});
test("G1: the release count reads no git", () => {
  const src = require("node:fs").readFileSync("scripts/built-counts.cjs", "utf8") + require("node:fs").readFileSync("scripts/built-facts.cjs", "utf8");
  assert.ok(!/execFileSync\("git"|git tag|git log/.test(src.replace(/^\s*\/\/.*$/gm, "")));
});
