// The save check at the end of every walkthrough (Coach Milan 2 November 18:19, Go; rule S1 in docs/rules/storage.md).
// run-flows.cjs loads this before each walkthrough (node --import tsx --require scripts/save-check.cjs). It wraps Playwright:
// before a page's context or the browser closes, it reads the page's storage; at the browser's close it builds what that phone
// would send to the account (src/saveShape.ts, the app's own code) and prints one check: ok, or FAIL with the path.
const pw = require("playwright");
const dumps = new Map();
const grab = async (ctx) => {
  for (const p of ctx.pages()) {
    try { const d = await p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; }); if (d["platemate-pilot-v1"]) dumps.set(JSON.stringify(d), d); } catch {}
  }
};
const report = () => {
  if (!dumps.size) return;
  const { saveCheck } = require("../src/saveShape.ts");
  let writes = 0; const problems = new Set();
  for (const d of dumps.values()) { const r = saveCheck(d); writes += r.writes; r.problems.forEach((x) => problems.add(x)); }
  if (problems.size) for (const x of [...problems].slice(0, 5)) console.log("FAIL save check: the account would refuse " + x);
  else console.log(`ok   save check: ${writes} account writes from ${dumps.size} phone ${dumps.size === 1 ? "state" : "states"}, nothing the account refuses`);
  dumps.clear();
};
const wrapCtx = (ctx) => { if (ctx.__sc) return ctx; ctx.__sc = 1; const close = ctx.close.bind(ctx); ctx.close = async (...a) => { await grab(ctx); return close(...a); }; return ctx; };
for (const type of [pw.chromium, pw.firefox, pw.webkit]) {
  const launch = type.launch.bind(type);
  type.launch = async (...a) => {
    const b = await launch(...a);
    const nc = b.newContext.bind(b), np = b.newPage.bind(b), close = b.close.bind(b);
    b.newContext = async (...x) => wrapCtx(await nc(...x));
    b.newPage = async (...x) => { const p = await np(...x); wrapCtx(p.context()); return p; };
    b.close = async (...x) => { for (const c of b.contexts()) await grab(c); try { report(); } catch (e) { console.log("FAIL save check could not run: " + (e && e.message)); } return close(...x); };
    return b;
  };
}
