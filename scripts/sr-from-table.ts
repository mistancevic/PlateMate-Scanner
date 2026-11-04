// DT203 (0.3.76, board Stories175 v2): before each release Claude reads Coach Milan's table on claude.ai (ArtifactData list of
// "lines" with out_dir) and runs: npx tsx scripts/sr-from-table.ts <out_dir>/lines
// Every line's Serbian text comes over; a line is "checked" only if Milan ticked it. A ticked line whose slots do not match stops
// the release. The safety lines must all be ticked before Serbian can be offered to anyone but Milan (said, not enforced here).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { slotProblems } from "../src/chefScript";
import { screenProblems } from "../src/words";
const dir = process.argv[2];
if (!dir) { console.error("usage: npx tsx scripts/sr-from-table.ts <dir with lines/*.json> [<dir with packs/*.json>]"); process.exit(2); }
const file = new URL("../src/i18n/sr-Latn.json", import.meta.url);
const sr = JSON.parse(readFileSync(file, "utf8"));
const bad: string[] = []; let ticked = 0, n = 0;
// 0.3.81: lines also come packed, many to a document (collection "packs", one per area); a line's own document wins.
// Give the folders of both: npx tsx scripts/sr-from-table.ts <out_dir>/lines <out_dir>/packs
const own = new Map<string, any>(), packed = new Map<string, any>();
for (const dir of process.argv.slice(2)) {
  let files: string[] = []; try { files = readdirSync(dir).filter((x) => x.endsWith(".json")); } catch { continue; }
  for (const f of files) {
    const raw = JSON.parse(readFileSync(join(dir, f), "utf8")); const d = raw.data ?? raw;
    if (Array.isArray(d?.rows)) for (const r of d.rows) packed.set(r.id ?? `${r.kind}.${r.key}`, r);
    else if (d && typeof d.key === "string") own.set(raw.id ?? `${d.kind}.${d.key}`, d);
  }
}
for (const [id, r] of own) packed.set(id, r);
for (const d of packed.values()) {
  if (!d || typeof d.key !== "string" || typeof d.sr !== "string") continue; // not a line
  // DT203 release 2 (0.3.77): the screens' words too, by key
  const part = d.kind === "safety" ? sr.safety : d.kind === "screen" ? sr.screens : sr.chef;
  if (!part || !(d.key in part)) { bad.push(`${d.kind}.${d.key}: not in the app's file`); continue; }
  const p = d.kind === "chef" ? slotProblems(d.key, d.sr) : d.kind === "screen" ? screenProblems(d.key, d.sr) : [];
  if (d.checked && p.length) bad.push(`${d.key}: ${p.join("; ")}`);
  part[d.key] = { text: d.sr, checked: !!d.checked && !p.length }; n++; if (d.checked && !p.length) ticked++;
}
writeFileSync(file, JSON.stringify(sr, null, 2) + "\n");
const safeOk = Object.values(sr.safety as Record<string, { checked: boolean }>).filter((l) => l.checked).length;
console.log(`${n} lines read, ${ticked} ticked; safety ${safeOk} of ${Object.keys(sr.safety).length} ticked`);
if (bad.length) { console.error("STOP:\n" + bad.join("\n")); process.exit(1); }
