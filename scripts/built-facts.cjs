// The numbers on /built (BP1, 0.3.51; Coach Milan 2 November 07:35 to 08:31): counted, never typed. Run at every release,
// after the full walkthrough run: node scripts/built-facts.cjs. It runs the unit tests and counts the rest from the files,
// then writes src/builtFacts.json. src/builtFacts.test.ts fails when the counts from the files no longer match the file.
//   unitTests     the tests that pass in src/*.test.ts (the test runner's own count)
//   walkthroughs  the files tests/flows run on their own (scripts/run-flows.cjs --count)
//   evalCases     the cases in evals/*-cases.json, swap-golden.json and plate-questions.jsonl; evalSets how many files
//   releases      every version since numbering began on 2 October 2026: the change log, the git tags, the merge commits
const fs = require("node:fs"), path = require("node:path"), { execFileSync, spawnSync } = require("node:child_process");
const ROOT = path.resolve(__dirname, "..");
const counts = require("./built-counts.cjs");
// the unit tests, all but this file's own check (it reads the file written here); its own tests are run and added after
const SELF = "builtFacts.test.ts";
const run = (files) => { const t = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-reporter=tap", ...files.map((f) => path.join("src", f))], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return [Number(/^# pass (\d+)/m.exec(t.stdout || "")?.[1] ?? NaN), Number(/^# fail (\d+)/m.exec(t.stdout || "")?.[1] ?? NaN)]; };
const [pass, fail] = run(fs.readdirSync(path.join(ROOT, "src")).filter((f) => f.endsWith(".test.ts") && f !== SELF));
if (!(pass > 0) || fail !== 0) { console.error(`unit tests: ${pass} pass, ${fail} fail; the facts are not written`); process.exit(1); }
let tags = [], merges = "";
try { tags = execFileSync("git", ["tag"], { cwd: ROOT, encoding: "utf8" }).split("\n"); merges = execFileSync("git", ["log", "--format=%s"], { cwd: ROOT, encoding: "utf8" }); } catch { /* no git: the change log alone */ }
const facts = { ...counts.fromFiles(ROOT), unitTests: pass, releases: counts.releases(ROOT, tags, merges) };
facts.perDay = Math.round(facts.releases / Math.max(1, Math.round((Date.now() - Date.parse(facts.numberedSince + "T00:00:00Z")) / 86400000)));
const write = () => fs.writeFileSync(path.join(ROOT, "src/builtFacts.json"), JSON.stringify(facts, null, 2) + "\n");
write();
const [own, ownFail] = run([SELF]);
if (ownFail !== 0) { console.error(`${SELF} fails on the facts just written`); process.exit(1); }
facts.unitTests += own; write();
console.log(JSON.stringify(facts));
