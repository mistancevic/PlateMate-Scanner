// Story DT327 (0.3.164, board DT327; Coach Milan 19 November, Go 15:29 for AC1 to AC7, Go 15:34 for AC8): the home page
// videos and their lines show the app as it is today. The twelve videos are recorded on the release they ship in by
// scripts/record-home-clips.cjs, which checks HC1 to HC13 on every video and writes public/landing/clips.json only when all
// pass. Three lines follow the app (Then you decide, Cook it's first line, the cook video's name), in three languages. The
// note under the videos names the version they were recorded on, and says the packs are made up and the meals real.
// The checks name the acceptance criteria of the board (DT327 AC1 to AC8).
// Changed by story DT328 (0.3.165, board DT328; Coach Milan, Go 19 November 17:16): label and group are on the page again, so all twelve videos are
// The label video is one photo of the nutrition table (DT328 AC2), so the recorder's check of it is HC3b one photo
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const PORT = "3581", U = `http://127.0.0.1:${PORT}`;
const VIDEOS = ["barcode", "label", "group", "meal", "plate", "recipes", "shop", "cook", "situation", "explorer", "coach", "languages"];
const lines = (f) => { const j = JSON.parse(fs.readFileSync(path.join(ROOT, `src/i18n/${f}.json`), "utf8")); return (k) => (f === "en" ? j[k] : j.screens[k].text); };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (where) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "en-GB" }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message)); await p.goto(U + where); await p.waitForTimeout(1500); return p; };
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  try {
    const version = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
    const clips = JSON.parse(fs.readFileSync(path.join(ROOT, "public/landing/clips.json"), "utf8"));
    const rec = fs.readFileSync(path.join(ROOT, "scripts/record-home-clips.cjs"), "utf8");
    // AC1 and AC4: recorded on this release, all twelve, written only after every rule passed
    ok(clips.version === version && VIDEOS.every((v) => clips.clips.includes(v)), `DT327 AC1: the twelve videos were recorded on ${clips.version}, the release they ship in (${version})`);
    ok(/fs\.writeFileSync\(path\.join\(OUT, "clips\.json"\)/.test(rec) && rec.indexOf('writeFileSync(path.join(OUT, "clips.json")') > rec.indexOf("no clip was replaced"), "DT327 AC4: the recorder writes clips.json after its rules, and a rule that fails replaces no video");
    // AC2 and AC3: the recorder walks those paths and checks them
    ok(/\.cam-analyze/.test(rec) && /\.pa-go \.pill/.test(rec) && /the read of the photo, its foods named/.test(rec), "DT327 AC2: the meal video goes camera, Use this photo, Read the plate, the read with its foods named");
    ok(/Timer 6 minutes/.test(rec) && /1 of 6/.test(rec), "DT327 AC3: the cook video moves by voice through Get it ready to step 1 and its 6 minute timer");
    // every video is on the page and served
    let p = await open("/?home");
    const vids = await p.locator("video source[type='video/mp4']").evaluateAll((xs) => xs.map((x) => x.getAttribute("src")));
    for (const v of VIDEOS) { const r = await fetch(U + `/landing/way-${v}.mp4`, { method: "HEAD" }); ok(r.ok && vids.includes(`/landing/way-${v}.mp4`), `the ${v} video is on the page and served`); }
    // AC5, AC6, AC8 in English
    const en = lines("en");
    const main = clean(await p.locator("main, body").first().innerText());
    ok(main.includes(clean(en("home.decideText"))) && /save it, plan it, or log what you ate of it, all of it or a part\. Or let Chef Mealan fit it to your target\./.test(main), "DT327 AC5: Then you decide says save it, plan it, or log what you ate of it, all of it or a part, or let Chef Mealan fit it");
    ok(!/eat one portion, add a protein side/.test(main), "DT327 AC5: the old line is gone");
    const cookLabel = await p.locator("video[aria-label^='Cook mode']").first().getAttribute("aria-label").catch(() => "");
    ok(main.includes("First the foods you need, then one step at a time, read aloud.") && cookLabel === "Cook mode: the foods first, then one step at a time, read aloud", "DT327 AC6: Cook it's first line and the video's name put the foods first. Got: " + cookLabel);
    const notes = (await p.locator(".l-ways-note").allInnerTexts()).map(clean);
    ok(notes.includes(`Clips of the app, version ${version}, on test data. The packs in them are made up, the meals are real.`), `DT327 AC8: the note under the videos names ${version}, made-up packs and real meals. Got: ${notes.join(" | ")}`);
    ok(notes.includes(`Clips of the app, version ${version}, on test data. The names in them are made up.`) && notes.every((n) => n.includes(clips.version)), "DT327 AC8: every note names the version from the recording");
    // AC7 and AC8 in Serbian and German
    for (const [where, f] of [["/sr?home", "sr-Latn"], ["/de?home", "de"]]) {
      const l = lines(f); p = await open(where);
      const t = clean(await p.locator("body").innerText());
      const lab = await p.locator("video[aria-label]").evaluateAll((xs) => xs.map((x) => x.getAttribute("aria-label")));
      ok(t.includes(clean(l("home.decideText"))) && t.includes(clean(l("home.cook1"))) && lab.includes(l("home.videoCook")), `DT327 AC7: ${where} shows the three lines in its language`);
      const ns = (await p.locator(".l-ways-note").allInnerTexts()).map(clean);
      ok(ns.includes(clean(l("home.clipsPacks").replace("{version}", version))), `DT327 AC8: ${where} names the version in the note: ${ns[0]}`);
    }
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough stopped: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} failed` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
