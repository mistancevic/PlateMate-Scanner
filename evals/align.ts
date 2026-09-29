// Human versus judge: how often does the judge agree with the coach? A judge score of 4 or 5 counts as pass.
import fs from "node:fs";
import path from "node:path";
const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "results");
const file = process.argv[2] || fs.readdirSync(dir).filter((f) => f.endsWith(".csv")).sort().pop();
if (!file) { console.log("No results yet. Run npm run eval:model first."); process.exit(0); }
const lines = fs.readFileSync(path.join(dir, path.basename(file)), "utf8").trim().split("\n").slice(1);
const cells = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
let n = 0, agree = 0;
for (const l of lines) {
  const c = cells(l); const judge = Number(c[10]); const coach = (c[12] || "").trim().toLowerCase();
  if (!coach || !judge) continue;
  n++; const same = (judge >= 4) === (coach === "pass"); agree += same ? 1 : 0;
  if (!same) console.log(`disagree ${c[0]}: judge ${judge}, coach ${coach} (${c[13] || "no reason"})`);
}
console.log(n ? `\nagreement ${agree}/${n} (${Math.round((agree / n) * 100)} %)` : "No coach labels yet: fill the coach_label column with pass or fail.");
