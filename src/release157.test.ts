// 0.3.157, housekeeping (build brief, G2): six English lines no code refers to were kept in 0.3.156 for Coach Milan to
// decide. They are gone from English, Serbian and German, and nothing refers to them.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const GONE = ["plate.search", "served.aboutKcal", "photoask.ateAt", "craving.chefsIdea", "out.change", "langpanel.deutsch"];
const json = (p: string) => JSON.parse(readFileSync(p, "utf8"));
test("G2: the six lines are gone from English, Serbian and German", () => {
  const en = json("src/i18n/en.json"), sr = json("src/i18n/sr-Latn.json").screens, de = json("src/i18n/de.json").screens, made = json("src/i18n/made-for.json").lines;
  for (const k of GONE) {
    assert.ok(!(k in en), `${k} is still in English`);
    assert.ok(!(k in sr), `${k} is still in Serbian`);
    assert.ok(!(k in de), `${k} is still in German`);
    assert.ok(!(`screen.${k}` in made), `${k} is still in made-for`);
  }
});
test("G2: nothing refers to them", () => {
  const files: string[] = [];
  const walk = (d: string) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) { if (!/node_modules|i18n$/.test(p)) walk(p); } else if (/\.(ts|tsx|cjs|js)$/.test(f) && !/release157\.test\.ts$/.test(f) && !f.startsWith("_lane-")) files.push(p); } };
  for (const d of ["src", "scripts", "tests", "evals"]) walk(d);
  files.push("server.ts");
  for (const p of files) { const s = readFileSync(p, "utf8"); for (const k of GONE) assert.ok(!new RegExp(`["'\`]${k.replace(".", "\\.")}["'\`]`).test(s), `${p} refers to ${k}`); }
});
