// npm run eval:advice: Eval 1 for Photo of my meal, the advice by code on 22 plates. Bar: all of them.
import { runAdvice } from "./advice";
const r = runAdvice();
for (const x of r) console.log(`${x.ok ? "ok  " : x.open ? "OPEN" : "FAIL"} ${x.id} ${x.title}${x.first ? ` [${x.first}]` : ""}\n     ${x.line}${x.misses.length ? `\n     ${x.misses.join("; ")}` : ""}${!x.ok && x.open ? `\n     ${x.open}` : ""}`);
const pass = r.filter((x) => x.ok).length, open = r.filter((x) => !x.ok && x.open).length;
console.log(`\nadvice by code: ${pass} of ${r.length} cases as the coach's rules say${open ? `, ${open} open (a decision waits)` : ""}`);
if (pass + open < r.length) process.exitCode = 1;
