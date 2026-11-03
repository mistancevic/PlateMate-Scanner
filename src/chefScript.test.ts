// DT213 (0.3.74, board Stories172): Chef Mealan's lines live in src/chefScript.ts only. Every ChefLine in the app takes its words
// from say() (or a helper that calls it), so the screen and, later, the voice read the same script.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { CHEF, say } from "./chefScript";

const files = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(d, e.name)) : e.name.endsWith(".tsx") ? [path.join(d, e.name)] : []));
// helpers that build a line with say() inside: their own files are checked by name
const ALLOWED = [/^\{(say|chefSay)\(/, /^\{resumeLine\(/, /^\{carryDue\(f\) \|\| f\.carry \? say\(/, /^\{text\}$/];

test("every ChefLine takes its words from the script", () => {
  const bad: string[] = [];
  for (const f of files(path.resolve("src"))) {
    const s = fs.readFileSync(f, "utf8");
    for (const m of s.matchAll(/<ChefLine\b[^>]*?\btext=(\{[^\n]*?\}|"[^"]*")/g)) if (!ALLOWED.some((r) => r.test(m[1]))) bad.push(`${path.relative("src", f)}: ${m[1].slice(0, 80)}`);
  }
  assert.deepEqual(bad, [], "a ChefLine with its own words:\n" + bad.join("\n"));
  // the two places that pass a variable build it with say()
  assert.match(fs.readFileSync("src/components/BusyAsk.tsx", "utf8"), /text = say\("busy/);
  assert.match(fs.readFileSync("src/cooking.ts", "utf8"), /return say\("resume"/);
});

test("the script's lines read as he says them: one question, numbers filled in", () => {
  assert.equal(say("carryNow", 1), "How did it carry you? Answer now, or in 1 minute, when I ask.");
  assert.equal(say("plateAddOrNew", 2, "", "Skyr would join it.", false), "Your plate already has 2 foods. Skyr would join it. Start a new plate with it, or add it to yours?");
  assert.equal(say("busyLate", "18:30", "Dinner", "19:00", 30, "dinner", null), "Busy until 18:30. Dinner at 19:00 leaves 30 minutes to cook. A quick dinner?");
  for (const k of Object.keys(CHEF) as (keyof typeof CHEF)[]) assert.ok(k.length > 2);
});
