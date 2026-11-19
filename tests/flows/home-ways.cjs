// Story DT328 (0.3.165, board DT328; Coach Milan 19 November 16:40 to 17:16, Go 17:16 for B): label and group come back on
// the home page. Start from anything shows four ways in, as the camera has them: A barcode, A label, A few packs at once, A
// photo of your meal. Two by two on a phone, four in a row on a computer. The label video is one photo of the nutrition
// table (Coach Milan 17:03: a label scan is the nutrition label), the group video the fronts and then the backs.
// The checks name the acceptance criteria of the board (DT328 AC1 to AC7).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const PORT = "3583", U = `http://127.0.0.1:${PORT}`;
const lines = (f) => { const j = JSON.parse(fs.readFileSync(path.join(ROOT, `src/i18n/${f}.json`), "utf8")); return (k) => (f === "en" ? j[k] : j.screens[k].text); };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (where, width) => { const ctx = await b.newContext({ viewport: { width, height: 900 }, locale: "en-GB" }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message)); await p.goto(U + where); await p.waitForTimeout(1500); return p; };
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const ways = (p) => p.locator(".l-ways-grid .l-way").evaluateAll((xs) => xs.map((x) => { const r = x.getBoundingClientRect(); const v = x.querySelector("video"); return { title: x.querySelector("h3").textContent.trim(), line: x.querySelector("p").textContent.trim(), src: x.querySelector("source").getAttribute("src"), left: Math.round(r.left), top: Math.round(r.top + scrollY), vw: Math.round(v.closest("figure").getBoundingClientRect().width), cw: Math.round(r.width) }; }));
  try {
    const en = lines("en");
    // AC1 and AC4
    let p = await open("/?home", 390); let w = await ways(p);
    ok(w.map((x) => x.title).join("|") === "A barcode|A label|A few packs at once|A photo of your meal", "DT328 AC1: four ways in, in the camera's order: " + w.map((x) => x.title).join(", "));
    ok(w.map((x) => x.src).join("|") === ["barcode", "label", "group", "meal"].map((v) => `/landing/way-${v}.mp4`).join("|"), "DT328 AC1: each way has its own video");
    const want = [["home.way.barcode", "home.way.barcodeLine"], ["home.way.label", "home.way.labelLine"], ["home.way.group", "home.way.groupLine"], ["home.way.meal", "home.way.mealLine"]];
    ok(want.every(([t, l], i) => w[i].title === en(t) && w[i].line === en(l)), "DT328 AC4: each title and line are the words of the board");
    ok(!/or a label/.test(w[0].title) && !/label/.test(w[0].line), "DT328 AC4: the barcode's line no longer speaks for the label: " + w[0].line);
    ok(clean(await p.locator(".l-ways-lead").innerText()) === en("home.waysLead"), "DT328 AC4: the lead names the four ways");
    // AC5: two by two on a phone, no taller than before (1,382 px)
    const h = await p.locator(".l-ways").evaluate((e) => { const one = e.querySelector(".l-one"); return Math.round(one.getBoundingClientRect().top - e.getBoundingClientRect().top); });
    ok(w[0].top === w[1].top && w[2].top === w[3].top && w[2].top > w[0].top && w[0].left < w[1].left && w[0].left === w[2].left, "DT328 AC5: on a phone the four ways sit two by two");
    ok(w.every((x) => x.vw >= x.cw - 2 && x.vw <= 172), "DT328 AC5: each video as wide as its column, at most 172 px with its frame: " + w.map((x) => `${x.vw} of ${x.cw}`).join(", "));
    ok(h <= 1382, `DT328 AC5: the section is no taller than before: ${h} px (was 1,382)`);
    // AC6: a computer, one row
    p = await open("/?home", 1280); w = await ways(p);
    ok(new Set(w.map((x) => x.top)).size === 1 && w.length === 4, "DT328 AC6: on a computer the four ways sit in one row");
    // AC7: Serbian and German
    for (const [where, f] of [["/sr?home", "sr-Latn"], ["/de?home", "de"]]) {
      const l = lines(f); p = await open(where, 390); w = await ways(p);
      ok(want.every(([t, ln], i) => w[i].title === l(t) && w[i].line === l(ln)) && clean(await p.locator(".l-ways-lead").innerText()) === l("home.waysLead"), `DT328 AC7: ${where} shows the four ways in its language: ${w.map((x) => x.title).join(", ")}`);
    }
    // AC2 and AC3: the recorder's paths
    const rec = fs.readFileSync(path.join(ROOT, "scripts/record-home-clips.cjs"), "utf8");
    ok(/Fjell Skyr natural · 450 g/.test(rec) && /\}, HC3b: one \};\n    \}, \{ feed: "label" \}\);/.test(rec), "DT328 AC2: the label video takes one photo, the nutrition table with the name above it");
    ok(/sides: \[path\.join\(ASSETS, "group\.jpg"\), path\.join\(ASSETS, "group-back\.jpg"\)\]/.test(rec) && /values read from|calories: 588/.test(rec), "DT328 AC3: the group video takes the fronts, then the backs, and reads the values from the tables");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough stopped: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} failed` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
