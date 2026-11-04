// DT203 release 2 (0.3.77): how many screen words are still written in the code, file by file. src/wordsGuard.test.ts fails
// when a file gains one: a new word goes into src/i18n/en.json. After an area moves its words, run this to lower the counts:
//   node scripts/words-baseline.cjs
const fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "..");
const files = () => ["src/App.tsx", ...["src/screens", "src/components"].flatMap((d) => fs.readdirSync(path.join(root, d)).filter((f) => f.endsWith(".tsx")).map((f) => `${d}/${f}`))].sort();
// words in JSX text (>Save for later<) and in quotes or backticks that read as a sentence or a label (a capital, then letters)
const count = (src) => {
  const s = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const jsx = (s.match(/>\s*[A-Za-z][A-Za-z ,.'’?!:;-]{2,}[^<>{}]*</g) || []).length;
  const lit = (s.match(/["`][A-Z][a-z]+[ ,.'’?!:][^"`\n]{2,}["`]/g) || []).length;
  return jsx + lit;
};
module.exports = { files, count };
if (require.main === module) {
  const out = {}; for (const f of files()) out[f] = count(fs.readFileSync(path.join(root, f), "utf8"));
  fs.writeFileSync(path.join(root, "docs/rules/words-baseline.json"), JSON.stringify(out, null, 1) + "\n");
  console.log("words still in the code:", Object.values(out).reduce((a, b) => a + b, 0));
}
