// DT248 and DT249 (0.3.98, board Stories184; Coach Milan 7 November 05:54 to 06:14, Go).
// DT248: cook mode in Srpski with an English recipe: what it says of its own is in Srpski, with a Srpski voice; the step's own
// words in the recipe's language; it listens in Srpski. In English nothing changes: one utterance, Step 1. and the step.
// Say what you have on the Plate listens in the app's language.
// DT249: the photo of the meal as it is, nothing over it; every photo of the meal under it, a tap swaps it with the big one;
// the foods under the photos.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const PORT = "3403", B = `http://127.0.0.1:${PORT}`;
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const salmon = [[180, F("sa", "Salmon fillet, raw", 208, 20, 13, 0)], [150, F("rc", "Basmati rice, dry", 356, 8.5, 0.9, 78)]].map(([g, f]) => ({ id: f.id, grams: g, food: f, locked: false }));
const recipe = { id: "m-sa", title: "Salmon and rice", items: salmon, portion: 330, steps: ["Cook the rice in salted water for 12 minutes.", "Bake the salmon at 200 °C for 12 minutes."], savedAt: "2026-11-01T18:00:00Z" };
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "plate.jpg")).toString("base64");
const SECOND = "data:image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "front.jpg")).toString("base64");
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (state, lang) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-07T18:40:00") });
    await page.addInitScript(([s, lang]) => {
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); if (lang) localStorage.setItem("chefmealan-lang", lang);
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
        sessionStorage.setItem("seeded", "1"); }
      // the stand-in voice keeps what it says and in which language; the stand-in ears keep the language they listen in
      window.__spoken = [];
      const synth = { speak: (u) => { window.__spoken.push([u.text, u.lang]); queueMicrotask(() => u.onend && u.onend()); }, cancel: () => {}, getVoices: () => [] };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
      window.SpeechSynthesisUtterance = function (t) { this.text = t; this.lang = ""; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      window.__recs = [];
      window.SpeechRecognition = function () { const me = this; window.__recs.push(me); me.start = () => { me.on = true; }; me.stop = () => { me.on = false; }; };
    }, [state, lang]);
    await require("./adult.cjs")(page);
    await page.route("**/api/status", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ai: true, airtable: false, accessRequired: false }) }));
    return page;
  };
  const toCook = async (page, start) => {
    await page.goto(B + "/my-recipes"); await page.waitForTimeout(1000);
    await page.getByText("Salmon and rice").first().click(); await page.waitForTimeout(800);
    await page.locator("button").filter({ hasText: start }).first().click(); await page.waitForTimeout(1200);
  };
  try {
    // DT248: Srpski, an English recipe
    let page = await open({ ...seed, meals: [recipe] }, "sr-Latn");
    await toCook(page, "Počni da kuvaš");
    await page.locator(".cook-mode button").filter({ hasText: "Uključi glas" }).click(); await page.waitForTimeout(600);
    let spoken = await page.evaluate(() => window.__spoken);
    // a Srpski line waiting for Coach Milan's Confirm is still English, so it takes an English voice; once confirmed, Srpski
    const srOn = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/i18n/sr-Latn.json"), "utf8")).screens["cookmode.sayStep"].checked;
    if (srOn) {
      ok(spoken[0]?.[0] === "Korak 1." && /^sr/.test(spoken[0][1]), "Korak 1., with a Srpski voice: " + JSON.stringify(spoken[0]));
      ok(/^Cook the rice/.test(spoken[1]?.[0]) && /^en/.test(spoken[1][1]), "the step's own words in the recipe's language, English: " + JSON.stringify(spoken[1]));
    } else ok(/^Step 1\. Cook the rice/.test(spoken[0]?.[0]) && /^en/.test(spoken[0][1]), "until it is confirmed, Step 1. stays English, in an English voice: " + JSON.stringify(spoken[0]));
    ok(await page.evaluate(() => window.__recs.some((r) => r.lang === "sr-RS")), "it listens in Srpski");
    await page.context().close();

    // Deutsch (Beta, its lines are in): what cook mode says of its own is German
    page = await open({ ...seed, meals: [recipe] }, "de");
    await toCook(page, "Kochen starten");
    await page.locator(".cook-mode button").filter({ hasText: /Stimme an|Stimme einschalten/ }).first().click(); await page.waitForTimeout(600);
    spoken = await page.evaluate(() => window.__spoken);
    ok(spoken[0]?.[0] === "Schritt 1." && /^de/.test(spoken[0][1]) && /^Cook the rice/.test(spoken[1]?.[0]) && /^en/.test(spoken[1][1]), "Schritt 1., German voice; the English recipe's step, English voice: " + JSON.stringify(spoken.slice(0, 2)));
    const hearDe = (t) => page.evaluate((t) => { const r = window.__recs.filter((x) => x.on).at(-1); r.onresult({ results: [{ 0: { transcript: t }, isFinal: true, length: 1 }] }); }, t);
    await hearDe("banana split"); await page.waitForTimeout(400);
    spoken = await page.evaluate(() => window.__spoken);
    ok(spoken.at(-1)[0] === "Entschuldige, sag das noch mal?" && /^de/.test(spoken.at(-1)[1]), "not caught: in German");
    await hearDe("weiter"); await page.waitForTimeout(500);
    spoken = await page.evaluate(() => window.__spoken);
    ok(spoken.at(-2)?.[0] === "Schritt 2." && /^Bake the salmon/.test(spoken.at(-1)?.[0]), "weiter: Schritt 2., then the step in English");
    await page.context().close();

    // English: as before, one utterance
    page = await open({ ...seed, meals: [recipe] }, null);
    await toCook(page, "Start cooking");
    await page.locator(".cook-mode button").filter({ hasText: /^Voice on|Turn voice on/ }).first().click().catch(() => {}); await page.waitForTimeout(600);
    spoken = await page.evaluate(() => window.__spoken);
    ok(spoken.length >= 1 && /^Step 1\. Cook the rice/.test(spoken[0][0]), "in English: Step 1. and the step, as one: " + JSON.stringify(spoken[0]));
    await page.context().close();

    // Say what you have, in Srpski, listens in Srpski
    page = await open(seed, "sr-Latn");
    await page.goto(B + "/plate"); await page.waitForTimeout(1200);
    await page.locator("button").filter({ hasText: /Reci šta imaš/ }).first().click(); await page.waitForTimeout(500);
    ok(await page.evaluate(() => window.__recs.at(-1)?.lang) === "sr-RS", "Say what you have listens in Srpski");
    await page.context().close();

    // DT249: two photos of the meal
    const items = salmon.map((i) => ({ ...i, est: { low: i.grams * 0.8, high: i.grams * 1.25 }, fromPhoto: true }));
    page = await open({ ...seed, items, title: "Salmon and rice", photo: { image: PHOTO, at: "2026-11-07T18:30:00", who: "now", more: [SECOND] }, plateAt: "2026-11-07T18:30:00" }, null);
    await page.goto(B + "/plate"); await page.waitForTimeout(1500);
    if (await page.locator(".mp-line").count()) { await page.locator(".mp-line").click(); await page.waitForTimeout(300); }
    const big = page.locator(".mp-big");
    ok(await big.locator(".mp-big-img .mp-tags").count() === 0 && await big.locator(".mp-big-img span").count() === 0, "nothing is drawn over the photo");
    ok(await page.evaluate(() => { const i = document.querySelector(".mp-big-img img"); return getComputedStyle(i).objectFit === "contain"; }), "the photo is shown as it is, not cut");
    const shots = big.locator(".mp-shots button");
    ok(await shots.count() === 2, "both photos of the meal are under it");
    const bx = await shots.nth(1).boundingBox(); ok(bx && bx.width >= 44 && bx.height >= 44, "the small photos are 44 px or more");
    ok(await big.locator(".mp-tags span").count() === 2 && /Salmon/.test(await big.locator(".mp-tags").textContent()), "the foods are under the photos, each with its amount");
    await shots.nth(1).click(); await page.waitForTimeout(300);
    ok(await page.evaluate((S) => document.querySelector(".mp-big-img img").src === S, SECOND) && await shots.nth(1).getAttribute("aria-pressed") === "true", "a tap swaps the second photo in, big");
    await shots.nth(0).click(); await page.waitForTimeout(300);
    ok(await page.evaluate((S) => document.querySelector(".mp-big-img img").src === S, PHOTO), "and back");
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "nothing scrolls sideways");
    await page.context().close();
  } finally { await b.close(); server.kill(); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  if (fail) { console.log(`${fail} failed`); process.exit(1); }
  console.log("all passed");
})();
