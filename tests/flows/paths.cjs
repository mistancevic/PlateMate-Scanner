// The happy paths, one line each, run on request: npm run qa:paths
// The paths are defined in the Worth Building doc, tab "Happy paths". This runs the walkthroughs that guard each one
// and prints a verdict per path; the paths with no guard in the sandbox say so, they are checked on the phone.
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const PATHS = [
  { id: "P1", name: "Getting in: landing, access, sign-in, coach code, profile with consent, goal", guards: ["safety", "first-goal"], note: "sign-in and the coach code are checked on the phone" },
  { id: "P2", name: "At the shelf: Scan, label check, PD, fit, Mix it, one tap to a plate", guards: ["camera-group", "camera-every-mode", "mix-tip", "find-then-add"] },
  { id: "P3", name: "A craving at home: moment, foods in, Fit to my target, Make it, saved", guards: ["meal-from-empty-plate", "mix-tip"] },
  { id: "P4", name: "Out, or missing something: the helper and the chat work with what I have", guards: ["dont-have-it", "chat-then-craving"] },
  { id: "P5", name: "Around training: the fit line for the moment, the count it gives", guards: ["mix-tip"] },
  { id: "P6", name: "The day: the plan, the day set once, what went through Mealan", guards: ["today", "quick-picks"] },
  { id: "P7", name: "With a coach: shared cards, a recipe sent, the day seen", guards: [] },
  { id: "P8", name: "Leaving, or taking my data: export, full deletion", guards: ["safety"], note: "deletion needs a live account; checked on the phone" },
];
const results = new Map();
const run = (name) => {
  if (results.has(name)) return results.get(name);
  const r = spawnSync(process.execPath, [path.join(__dirname, `${name}.cjs`)], { encoding: "utf8", env: process.env });
  const out = (r.stdout || "") + (r.stderr || "");
  const fails = out.split("\n").filter((l) => /^FAIL/.test(l));
  const ok = r.status === 0 && fails.length === 0;
  results.set(name, { ok, fails, crashed: r.status !== 0 && fails.length === 0 });
  return results.get(name);
};
console.log("Happy paths, " + new Date().toISOString().slice(0, 10));
let bad = 0;
for (const p of PATHS) {
  if (!p.guards.length) { console.log(`${p.id}  phone  ${p.name}`); continue; }
  const rs = p.guards.map((g) => [g, run(g)]);
  const failed = rs.filter(([, r]) => !r.ok);
  if (!failed.length) console.log(`${p.id}  ok     ${p.name}${p.note ? ` (${p.note})` : ""}`);
  else { bad++; console.log(`${p.id}  FAIL   ${p.name}`); for (const [g, r] of failed) { console.log(`           ${g}: ${r.crashed ? "did not finish" : r.fails.join(" | ")}`); } }
}
console.log(bad ? `\n${bad} path(s) broken. A broken path goes back as a story.` : "\nEvery guarded path holds. P7, and the live-account parts of P1 and P8, are checked on the phone.");
process.exitCode = bad ? 1 : 0;
