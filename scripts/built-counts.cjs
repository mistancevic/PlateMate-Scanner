// The counts behind /built that come from the files alone (scripts/built-facts.cjs writes them; src/builtFacts.test.ts checks them).
const fs = require("node:fs"), path = require("node:path");
const LIVE_SINCE = "2026-09-30";      // the live app behind sign-in (commit of 30 September 2026)
const NUMBERED_SINCE = "2026-10-02";  // the first version number, v0.1.1
function walkthroughs(root) {
  const out = require("node:child_process").execFileSync(process.execPath, [path.join(root, "scripts/run-flows.cjs"), "--count"], { cwd: root, encoding: "utf8" });
  return Number(out.trim().split("\n").pop());
}
function evals(root) {
  const dir = path.join(root, "evals"); let cases = 0, sets = 0;
  for (const f of fs.readdirSync(dir).sort()) {
    if (/-cases\.json$|^swap-golden\.json$/.test(f)) { const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); cases += (Array.isArray(d) ? d : d.cases).length; sets++; }
    else if (f.endsWith(".jsonl")) { cases += fs.readFileSync(path.join(dir, f), "utf8").split("\n").filter((l) => l.trim()).length; sets++; }
  }
  return { evalCases: cases, evalSets: sets };
}
// 0.3.157 (Coach Milan 18 November, Go 11:14): every version named in the change log and in docs/versions.md, each once, and
// the version being built (its line in docs/versions.md is written after the merge). No git is read: release tags can't be
// pushed from the build workspace, and a fresh clone is shallow, so tags and merge commits counted too few.
function releases(root) {
  const v = new Set([...fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8").matchAll(/\*\*v(\d+\.\d+\.\d+)\*\*/g)].map((m) => m[1]));
  for (const m of fs.readFileSync(path.join(root, "docs/versions.md"), "utf8").matchAll(/^v(\d+\.\d+\.\d+) /gm)) v.add(m[1]);
  v.add(JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version);
  return v.size;
}
function fromFiles(root) {
  return { version: JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version, liveSince: LIVE_SINCE, numberedSince: NUMBERED_SINCE, walkthroughs: walkthroughs(root), ...evals(root) };
}
module.exports = { fromFiles, releases, walkthroughs, evals };
