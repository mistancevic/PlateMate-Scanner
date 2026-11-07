// Coach Milan 7 November 19:39: the Srpski table shows, per line, whether the app holds it as written. At every release this
// writes docs/i18n/app-sr.json (the app's Srpski: text and confirmed, per line, and the version); publish it to the Srpski table
// as app-sr.json with release-pack.json. Run after apply, from the release's checkout: node scripts/app-sr.cjs
const fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "..");
const sr = JSON.parse(fs.readFileSync(path.join(root, "src/i18n/sr-Latn.json"), "utf8"));
const version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
const lines = {};
for (const [sec, kind] of [["chef", "chef"], ["safety", "safety"], ["screens", "screen"]])
  for (const [k, x] of Object.entries(sr[sec] || {})) if (x && typeof x.text === "string") lines[`${kind}.${k}`] = [x.text, x.checked ? 1 : 0];
fs.writeFileSync(path.join(root, "docs/i18n/app-sr.json"), JSON.stringify({ version, at: new Date().toISOString(), lines }));
console.log(`app-sr.json: ${version}, ${Object.keys(lines).length} lines`);
