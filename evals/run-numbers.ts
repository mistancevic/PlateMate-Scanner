// Numbers evals: run the ten people, print each answer and its checks. With --update, record today's numbers in
// number-snapshot.json, after a change to the calculation that the coach has looked at.
import { readFileSync, writeFileSync } from "node:fs";
import { numbersOf, numberChecks, snapshotOf, type NumberCase, type Snapshot } from "../src/numbersEval";

const cases: NumberCase[] = JSON.parse(readFileSync(new URL("./number-cases.json", import.meta.url), "utf8")).cases;
const snapPath = new URL("./number-snapshot.json", import.meta.url);
let snap: Snapshot = {};
try { snap = JSON.parse(readFileSync(snapPath, "utf8")); } catch { /* first run */ }
const update = process.argv.includes("--update");
let failed = 0;
const next: Snapshot = {};
for (const c of cases) {
  const o = numbersOf(c);
  if (!o) { console.log(`${c.id} could not be calculated`); failed++; continue; }
  next[c.id] = snapshotOf(o);
  const checks = numberChecks(c, o, update ? undefined : snap[c.id]);
  const bad = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  if (bad.length) failed++;
  console.log(`${bad.length ? "FAIL" : "ok  "} ${c.id} ${o.kcal} kcal, ${o.protein} g protein, ${o.fats} g fat, ${o.carbs} g carbs${o.days.length ? ` · days ${o.days.map((d) => d.kcal).join("/")}` : ""}${bad.length ? ` · ${bad.join("; ")}` : ""}`);
}
if (update) { writeFileSync(snapPath, JSON.stringify(next, null, 1) + "\n"); console.log("Recorded in number-snapshot.json"); }
process.exit(failed && !update ? 1 : 0);
