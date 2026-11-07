// DT251 (0.3.104, board Stories186; Coach Milan 7 November 08:07 to 12:28, Go): Get it ready. Cook mode opens on the foods
// before step 1: each with its amount, read aloud one at a time; next ticks it and reads the next, repeat says it again, a tap
// ticks one too. All ticked: All ready. Step 1 next. Then step 1. Step 1 › skips it at any time.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const PORT = "3405", B = `http://127.0.0.1:${PORT}`;
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const items = [[180, F("sa", "Salmon fillet, raw", 208, 20, 13, 0)], [150, F("rc", "Basmati rice, dry", 356, 8.5, 0.9, 78)], [120, F("br", "Broccoli", 34, 2.8, 0.4, 7)], [10, F("oo", "Olive oil", 884, 0, 100, 0)]].map(([g, f]) => ({ id: f.id, grams: g, food: f, locked: false }));
const recipe = { id: "m-sa", title: "Salmon and rice", items, portion: 460, steps: ["Cook the rice in salted water for 12 minutes.", "Bake the salmon at 200 °C for 12 minutes."], savedAt: "2026-11-01T18:00:00Z" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang, width = 390) => {
    const ctx = await b.newContext({ viewport: { width, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-07T18:40:00") });
    await page.addInitScript(([s, lang]) => {
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); if (lang) localStorage.setItem("chefmealan-lang", lang);
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
        sessionStorage.setItem("seeded", "1"); }
      window.__spoken = [];
      const synth = { speak: (u) => { window.__spoken.push([u.text, u.lang]); queueMicrotask(() => u.onend && u.onend()); }, cancel: () => {}, getVoices: () => [] };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
      window.SpeechSynthesisUtterance = function (t) { this.text = t; this.lang = ""; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      window.__recs = [];
      window.SpeechRecognition = function () { const me = this; window.__recs.push(me); me.start = () => { me.on = true; }; me.stop = () => { me.on = false; }; };
    }, [{ ...seed, meals: [recipe] }, lang]);
    await require("./adult.cjs")(page);
    await page.goto(B + "/my-recipes"); await page.waitForTimeout(1000);
    await page.getByText("Salmon and rice").first().click(); await page.waitForTimeout(800);
    await page.locator(".rq-steps button, .rq-start button").filter({ hasText: /Start cooking|Kochen starten|Počni da kuvaš/ }).first().click(); await page.waitForTimeout(1200);
    const ask = page.locator(".rq-lang-cook"); if (await ask.count()) { await ask.locator(".ca-go button").nth(1).click(); await page.waitForTimeout(1200); }
    return page;
  };
  const hear = (page, t) => page.evaluate((t) => { const r = window.__recs.filter((x) => x.on).at(-1); r.onresult({ results: [{ 0: { transcript: t }, isFinal: true, length: 1 }] }); }, t);
  const spoken = (page) => page.evaluate(() => window.__spoken.map((x) => x[0]));
  try {
    let page = await open(null);
    const cm = page.locator(".cook-mode"), card = cm.locator(".cook-ready");
    ok(await card.count() === 1 && await cm.locator(".cook-step").count() === 0, "cook mode opens on Get it ready, before step 1");
    ok(/Get it ready/.test(await cm.locator(".cook-count").textContent()) && await cm.locator(".cook-step-btn.on").count() === 0, "the top says Get it ready; no step is current yet");
    ok(/GET IT READY · 1 OF 4/.test(await card.textContent()) && /Put out what you need/.test(await card.textContent()), "Get it ready · 1 of 4, Put out what you need");
    const foods = card.locator(".cook-ready-food");
    ok(await foods.count() === 4 && /180 g salmon fillet/.test(await foods.nth(0).textContent()) && /150 g basmati rice/.test(await foods.nth(1).textContent()) && /10 g olive oil/.test(await foods.nth(3).textContent()), "every food with its amount: 180 g salmon fillet … 10 g olive oil");
    for (const x of [foods.nth(0), card.locator(".cook-ready-skip")]) { const r = await x.boundingBox(); ok(r && r.height >= 44, "44 px or more: " + (await x.textContent()).trim().slice(0, 20)); }
    await cm.getByRole("button", { name: "Turn voice on" }).click(); await page.waitForTimeout(400);
    ok((await spoken(page))[0] === "Get it ready. 180 grams salmon fillet", "voice on: Get it ready, then the first food, in words: " + JSON.stringify((await spoken(page))[0]));
    await hear(page, "next"); await page.waitForTimeout(300);
    ok(await foods.nth(0).getAttribute("aria-pressed") === "true" && (await spoken(page)).at(-1) === "150 grams basmati rice" && /2 OF 4/.test(await card.textContent()), "next: the first is ticked, the second read");
    await hear(page, "repeat"); await page.waitForTimeout(300);
    ok((await spoken(page)).at(-1) === "150 grams basmati rice", "repeat says it again");
    await foods.nth(2).click(); await page.waitForTimeout(200);
    ok(await foods.nth(2).getAttribute("aria-pressed") === "true" && await foods.nth(1).getAttribute("aria-current") === "step", "a tap ticks another food; the one being read stays");
    await hear(page, "next"); await page.waitForTimeout(300);
    ok((await spoken(page)).at(-1) === "10 grams olive oil" && await foods.nth(3).getAttribute("aria-current") === "step", "next skips the ticked one: olive oil");
    await hear(page, "next"); await page.waitForTimeout(300);
    ok((await spoken(page)).at(-1) === "All ready. Step 1 next." && /All ready\. Step 1 next\./.test(await card.textContent()), "all ticked: All ready. Step 1 next.");
    ok(await card.getByRole("button", { name: "Step 1 ›" }).count() === 1 && /Step 1 ›/.test(await cm.locator(".cook-buttons .pill-primary").textContent()), "Step 1 › to go on");
    await hear(page, "next"); await page.waitForTimeout(400);
    ok(await cm.locator(".cook-ready").count() === 0 && /1 of 2/.test(await cm.locator(".cook-count").textContent()) && /^Step 1\. Cook the rice/.test((await spoken(page)).at(-1)), "next: step 1, read aloud as before");
    await page.context().close();

    // Step 1 › skips it at any time
    page = await open(null);
    await page.locator(".cook-ready-skip").click(); await page.waitForTimeout(300);
    ok(await page.locator(".cook-ready").count() === 0 && /1 of 2/.test(await page.locator(".cook-mode .cook-count").textContent()), "Step 1 › skips it: step 1");
    await page.context().close();

    // Deutsch at 360: the head and the voice in German, the food in the recipe's language
    page = await open("de", 360);
    ok(await page.locator(".cook-ready-food").count() === 4 && /180 g/.test(await page.locator(".cook-ready-food").first().textContent()), "Deutsch: the same four foods");
    await page.locator(".cook-mode button").filter({ hasText: /Stimme an|Stimme einschalten/ }).first().click(); await page.waitForTimeout(400);
    const s = await page.evaluate(() => window.__spoken);
    ok(/^de/.test(s[0]?.[1]) && s[0][0] !== "Get it ready." && /^180 grams salmon fillet$/.test(s[1]?.[0]) && /^en/.test(s[1][1]), "Deutsch: the head in German, German voice; the English recipe's food in English: " + JSON.stringify(s.slice(0, 2)));
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "nothing scrolls sideways at 360");
    await page.context().close();
  } finally { await b.close(); server.kill(); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  if (fail) { console.log(`${fail} failed`); process.exit(1); }
  console.log("all passed");
})();
