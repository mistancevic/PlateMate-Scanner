// Every walkthrough, two at a time (agreed 12 October 2026): each one runs on a port of its own, so two lanes never meet.
// A walkthrough is a file in tests/flows that runs on its own: helpers (module.exports) and the paths runner are left out.
//   node scripts/run-flows.cjs            all walkthroughs, 2 lanes      (npm run build first)
//   node scripts/run-flows.cjs today plan  only the names given
//   node scripts/run-flows.cjs --count    how many walkthroughs there are
//   LANES=3 node scripts/run-flows.cjs    more lanes
// Every full run also writes tests/flows-report.json (not in git) and docs/qa/runs/<version>.json (in git): each walkthrough, what it covers (its opening comment), every
// check it made with ok or FAIL, and the time; scripts/flows-page.cjs turns it into the Walkthroughs page (Milan, 22 October).
const fs = require("node:fs"), path = require("node:path"), { spawn } = require("node:child_process");
const DIR = path.resolve(__dirname, "../tests/flows");
const all = fs.readdirSync(DIR).filter((f) => f.endsWith(".cjs") && !f.startsWith("_lane-") && f !== "paths.cjs")
  .filter((f) => !/module\.exports\s*=/.test(fs.readFileSync(path.join(DIR, f), "utf8"))).sort();
const args = process.argv.slice(2);
if (args.includes("--count")) { console.log(all.length); process.exit(0); }
const pick = args.length ? all.filter((f) => args.some((a) => f.replace(/\.cjs$/, "") === a.replace(/\.cjs$/, ""))) : all;
const LANES = Number(process.env.LANES || 2);
let next = 0, failed = [], done = 0; const report = [];
const t0 = Date.now();
const run = (file, port) => new Promise((resolve) => {
  // the same walkthrough with its own port, next to the original so its requires still resolve
  const src = fs.readFileSync(path.join(DIR, file), "utf8");
  const ports = [...new Set([...src.matchAll(/PORT: "(\d{4})"/g)].map((m) => m[1]))];
  let body = src; for (const p of ports) body = body.split(p).join(String(port));
  const tmp = path.join(DIR, `_lane-${port}-${file}`); fs.writeFileSync(tmp, body);
  const t = Date.now(); let out = "";
  const ch = spawn(process.execPath, [tmp], { env: process.env, cwd: path.resolve(__dirname, "..") });
  ch.stdout.on("data", (d) => (out += d)); ch.stderr.on("data", (d) => (out += d));
  const kill = setTimeout(() => { out += "\nFAIL timed out after 6 minutes"; ch.kill("SIGKILL"); }, 6 * 60_000);
  ch.on("close", (code) => {
    clearTimeout(kill); fs.rmSync(tmp, { force: true });
    const checks = (out.match(/^ok /gm) ?? []).length, fails = out.split("\n").filter((l) => l.startsWith("FAIL"));
    done++; if (code !== 0 || fails.length) failed.push(file);
    const about = (src.match(/^(\/\/[^\n]*\n)+/) || [""])[0].split("\n").map((l) => l.replace(/^\/\/\s?/, "")).join(" ").replace(/\s+/g, " ").trim();
    report.push({ file, about, pass: code === 0 && !fails.length, seconds: Math.round((Date.now() - t) / 1000), checks: out.split("\n").filter((l) => /^(ok |FAIL)/.test(l)).map((l) => ({ ok: l.startsWith("ok"), text: l.replace(/^(ok\s+|FAIL\s*)/, "").slice(0, 400) })) });
    console.log(`${code === 0 && !fails.length ? "pass" : "FAIL"}  ${file}  ${checks} checks  ${Math.round((Date.now() - t) / 1000)} s  (${done}/${pick.length})`);
    for (const l of fails) console.log("      " + l);
    resolve();
  });
});
const lane = async (i) => { while (next < pick.length) { const f = pick[next++]; await run(f, 3400 + i * 10 + (next % 10)); } };
Promise.all(Array.from({ length: LANES }, (_, i) => lane(i))).then(() => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"));
    const commit = require("node:child_process").execSync("git rev-parse --short HEAD", { cwd: path.resolve(__dirname, "..") }).toString().trim();
    // the run is kept in the repo, one file per version (docs/qa/runs), so the Walkthroughs page shows the history
    const rep = JSON.stringify({ version: pkg.version, commit, at: new Date().toISOString(), minutes: Math.round((Date.now() - t0) / 60000), flows: report.sort((a, b) => a.file.localeCompare(b.file)) }, null, 1);
    if (!args.length) { fs.writeFileSync(path.resolve(__dirname, "../tests/flows-report.json"), rep); fs.mkdirSync(path.resolve(__dirname, "../docs/qa/runs"), { recursive: true }); fs.writeFileSync(path.resolve(__dirname, `../docs/qa/runs/${pkg.version}.json`), rep); }
  } catch {}
  console.log(`\n${pick.length - failed.length} of ${pick.length} walkthroughs passed in ${Math.round((Date.now() - t0) / 60000)} min${failed.length ? ": failed " + failed.join(", ") : ""}`);
  process.exit(failed.length ? 1 : 0);
});
