// Human versus judge: how often does the judge agree with the coach? A judge score of 4 or 5 counts as pass.
import fs from "node:fs";
import path from "node:path";
const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "results");
const file = process.argv[2] || fs.readdirSync(dir).filter((f) => f.endsWith(".csv")).sort().pop();
if (!file) { console.log("No results yet. Run npm run eval:model first."); process.exit(0); }
const all = fs.readFileSync(path.join(dir, path.basename(file)), "utf8").trim().split("\n");
const lines = all.slice(1);
const cells = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
// the columns by name, so the plate questions (eval:model) and the meal photos (eval:photo) both align
const head = cells(all[0]); const col = (n: string, d: number) => (head.indexOf(n) >= 0 ? head.indexOf(n) : d);
const J = col("judge_score", 10), L = col("coach_label", 12), W = col("coach_reason", 13);
let n = 0, agree = 0;
for (const l of lines) {
  const c = cells(l); const judge = Number(c[J]); const coach = (c[L] || "").trim().toLowerCase();
  if (!coach || !judge) continue;
  n++; const same = (judge >= 4) === (coach === "pass"); agree += same ? 1 : 0;
  if (!same) console.log(`disagree ${c[0]}: judge ${judge}, coach ${coach} (${c[W] || "no reason"})`);
}
console.log(n ? `\nagreement ${agree}/${n} (${Math.round((agree / n) * 100)} %)` : "No coach labels yet: fill the coach_label column with pass or fail.");
