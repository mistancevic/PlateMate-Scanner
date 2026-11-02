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
function releases(root, tags = [], merges = "") {
  const v = new Set([...fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8").matchAll(/\*\*v(\d+\.\d+\.\d+)\*\*/g)].map((m) => m[1]));
  for (const t of tags) { const m = /^v(\d+\.\d+\.\d+)$/.exec(t.trim()); if (m) v.add(m[1]); }
  for (const m of merges.matchAll(/Merge dt\d+: (\d+\.\d+\.\d+)/g)) v.add(m[1]);
  v.add(JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version);
  return v.size;
}
function fromFiles(root) {
  return { version: JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version, liveSince: LIVE_SINCE, numberedSince: NUMBERED_SINCE, walkthroughs: walkthroughs(root), ...evals(root) };
}
module.exports = { fromFiles, releases, walkthroughs, evals };
