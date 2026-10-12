// Every walkthrough, two at a time (agreed 12 October 2026): each one runs on a port of its own, so two lanes never meet.
// A walkthrough is a file in tests/flows that runs on its own: helpers (module.exports) and the paths runner are left out.
//   node scripts/run-flows.cjs            all walkthroughs, 2 lanes      (npm run build first)
//   node scripts/run-flows.cjs today plan  only the names given
//   node scripts/run-flows.cjs --count    how many walkthroughs there are
//   LANES=3 node scripts/run-flows.cjs    more lanes
const fs = require("node:fs"), path = require("node:path"), { spawn } = require("node:child_process");
const DIR = path.resolve(__dirname, "../tests/flows");
const all = fs.readdirSync(DIR).filter((f) => f.endsWith(".cjs") && !f.startsWith("_lane-") && f !== "paths.cjs")
  .filter((f) => !/module\.exports\s*=/.test(fs.readFileSync(path.join(DIR, f), "utf8"))).sort();
const args = process.argv.slice(2);
if (args.includes("--count")) { console.log(all.length); process.exit(0); }
const pick = args.length ? all.filter((f) => args.some((a) => f.replace(/\.cjs$/, "") === a.replace(/\.cjs$/, ""))) : all;
const LANES = Number(process.env.LANES || 2);
let next = 0, failed = [], done = 0;
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
    console.log(`${code === 0 && !fails.length ? "pass" : "FAIL"}  ${file}  ${checks} checks  ${Math.round((Date.now() - t) / 1000)} s  (${done}/${pick.length})`);
    for (const l of fails) console.log("      " + l);
    resolve();
  });
});
const lane = async (i) => { while (next < pick.length) { const f = pick[next++]; await run(f, 3400 + i * 10 + (next % 10)); } };
Promise.all(Array.from({ length: LANES }, (_, i) => lane(i))).then(() => {
  console.log(`\n${pick.length - failed.length} of ${pick.length} walkthroughs passed in ${Math.round((Date.now() - t0) / 60000)} min${failed.length ? ": failed " + failed.join(", ") : ""}`);
  process.exit(failed.length ? 1 : 0);
});
