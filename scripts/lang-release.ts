// DT239 (0.3.95, board Stories181; Go 6 November 12:24): languages in every release.
//   npx tsx scripts/lang-release.ts                 what this release brings: docs/i18n/release-todo.json (new lines, and lines
//                                                   whose English changed since their translation)
//   npx tsx scripts/lang-release.ts apply <drafts>  drafts: {"<id>": {"sr": "...", "de": "..."}} for every line of the todo.
//     Srpski goes in as a draft, not confirmed: the app shows the English until Coach Milan confirms it in his table.
//     German goes in as Beta. The English each was made for is kept in src/i18n/made-for.json. The tables' group
//     "New in <version>" comes from docs/i18n/release-pack.json, published as a file of both table pages (release-pack.json).
// A line with a wrong slot or form stops it, and nothing is written.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { englishRows, releaseLines, areaOf, type MadeForFile } from "../src/langRelease";
import { slotProblems } from "../src/chefScript";
import { screenProblems } from "../src/words";

const root = new URL("../", import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const write = (p: string, v: unknown) => writeFileSync(new URL(p, root), JSON.stringify(v, null, 2) + "\n");
const version: string = read("package.json").version;
const madeFile: MadeForFile = read("src/i18n/made-for.json");
const made = madeFile.lines;
const todo = releaseLines(made);
mkdirSync(new URL("docs/i18n/", root), { recursive: true });

if (process.argv[2] !== "apply") {
  write("docs/i18n/release-todo.json", todo.map(({ row, enBefore }) => ({ ...row, ...areaOf(row, made), ...(enBefore !== undefined ? { enBefore } : {}) })));
  const gone = Object.keys(made).filter((id) => !englishRows().some((r) => r.id === id));
  console.log(`${version}: ${todo.filter((t) => t.enBefore === undefined).length} new lines, ${todo.filter((t) => t.enBefore !== undefined).length} with changed English${gone.length ? `, ${gone.length} gone` : ""}. Draft them into a file and run apply.`);
  process.exit(0);
}

const drafts: Record<string, { sr?: string; de?: string }> = JSON.parse(readFileSync(process.argv[3], "utf8"));
const sr = read("src/i18n/sr-Latn.json"), de = read("src/i18n/de.json");
const partOf = (file: any, kind: string) => (kind === "safety" ? file.safety : kind === "chef" ? file.chef : file.screens);
const bad: string[] = [];
const rows: any[] = [];
let order = 900000;
for (const { row, enBefore } of todo) {
  const d = drafts[row.id];
  if (!d?.sr?.trim() || !d?.de?.trim()) { bad.push(`${row.id}: needs both a Srpski and a German draft`); continue; }
  for (const [l, t] of [["sr-Latn", d.sr], ["de", d.de]] as const) {
    const p = row.kind === "chef" ? slotProblems(row.key, t) : row.kind === "screen" ? screenProblems(row.key, t, l) : [];
    if (p.length) bad.push(`${row.id} (${l}): ${p.join("; ")}`);
    if (/[–—]| - /.test(t)) bad.push(`${row.id} (${l}): a dash as punctuation`);
  }
  rows.push({ ...row, ...areaOf(row, made), ...(enBefore !== undefined ? { enBefore } : {}), sr: d.sr, de: d.de, checked: false, beta: true, release: version, order: order++ });
}
if (bad.length) { console.error("STOP, nothing written:\n" + bad.join("\n")); process.exit(1); }
for (const r of rows) {
  partOf(sr, r.kind)[r.key] = { text: r.sr, checked: false };
  partOf(de, r.kind)[r.key] = { text: r.de, checked: true };
  made[r.id] = { en: r.en, area: r.area, where: r.where, release: version };
}
// a line gone from the English is gone from every file
const live = new Set(englishRows().map((r) => r.id));
for (const id of Object.keys(made)) if (!live.has(id)) {
  const [kind, ...k] = id.split("."); const key = k.join(".");
  delete made[id]; delete partOf(sr, kind)[key]; delete partOf(de, kind)[key];
}
write("src/i18n/sr-Latn.json", sr); write("src/i18n/de.json", de);
// one line per id, so a release's diff shows what changed
writeFileSync(new URL("src/i18n/made-for.json", root), '{\n  "about": ' + JSON.stringify(madeFile.about) + ',\n  "lines": {\n' +
  Object.entries(made).map(([k, v]) => "    " + JSON.stringify(k) + ": " + JSON.stringify(v)).join(",\n") + "\n  }\n}\n");
// earlier releases' lines stay in the pack, so a line nobody confirmed yet stays in the tables; only the newest release is the group
let before: any = null; try { before = read("docs/i18n/release-pack.json"); } catch { /* the first release with a pack */ }
const at = new Date().toISOString();
const keep = (before?.rows ?? []).filter((r: any) => !rows.some((x) => x.id === r.id) && live.has(r.id));
write("docs/i18n/release-pack.json", { release: version, at, rows: [...keep, ...rows.map((r) => ({ ...r, at }))] });
write("docs/i18n/release-todo.json", []);
console.log(`${version}: ${rows.length} lines in. Srpski waits for Coach Milan's Confirm; German is in as Beta. Publish docs/i18n/release-pack.json to both tables.`);
