// DT250 (0.3.99, board Stories185; Coach Milan 7 November 06:14 to 08:05, Go): a recipe in your language. The app in English, a
// recipe written in Srpski: its page offers once (Show it in English, or Keep it in Srpski); translated, it shows in English
// with a switch to the original; Start cooking asks once and cook mode reads the version picked; a recipe that just came in
// from a link is read into English by itself, with Original ›. Chef Mealan's translation is stubbed; what the app sends and
// keeps is checked.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const PORT = "3404", B = `http://127.0.0.1:${PORT}`;
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const items = [[250, F("be", "Pasulj, kuvan", 127, 8.7, 0.5, 23)], [120, F("on", "Crni luk", 40, 1.1, 0.1, 9)]].map(([g, f], k) => ({ id: "i" + k, grams: g, food: f, locked: false }));
const SR = ["Iseci luk na tanke polukrugove i propržite ga na ulju 10 minuta, dok ne omekša.", "Dodaj pasulj, sve stavi u vatrostalnu posudu i peci 40 minuta na 200 °C."];
const EN = ["Slice the onion into thin half rings and fry it in the oil for 10 minutes, until soft.", "Add the beans, put it all in a baking dish and bake for 40 minutes at 200 °C."];
const recipe = (x = {}) => ({ id: "m-pr", title: "Prebranac", items, portion: 370, steps: SR, savedAt: "2026-11-03T18:00:00Z", ...x });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (state) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-07T08:20:00") });
    await page.addInitScript((s) => {
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
        sessionStorage.setItem("seeded", "1"); }
      const synth = { speak: () => {}, cancel: () => {}, getVoices: () => [] };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
    }, state);
    await require("./adult.cjs")(page);
    await page.route("**/api/status", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ai: true, airtable: false, accessRequired: false }) }));
    page.asked = [];
    await page.route("**/api/recipe/translate", (r) => { page.asked.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ title: "Prebranac (baked beans)", steps: EN, foods: [{ id: "i0", name: "Beans, cooked" }, { id: "i1", name: "Onion" }] }) }); });
    await page.goto(B + "/my-recipes/m-pr"); await page.waitForTimeout(1500);
    return page;
  };
  const steps = (page) => page.locator(".rq-steps .rp-steps").innerText();
  const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === "m-pr"));
  try {
    // the offer on the page, then the translation with its switch
    let page = await open({ ...seed, meals: [recipe()] });
    const offer = page.locator(".rq-lang-offer");
    ok(await offer.count() === 1 && /This recipe is in Srpski\. Show it in English\?/.test(await offer.innerText()), "the page offers once: Show it in English?");
    await offer.getByRole("button", { name: "Show it in English" }).click(); await page.waitForTimeout(1200);
    ok(page.asked.length === 1 && page.asked[0].to === "en" && page.asked[0].steps.length === 2 && page.asked[0].foods.length === 2, "Chef Mealan gets the steps and the foods, to English");
    ok(/Slice the onion/.test(await steps(page)) && /Prebranac \(baked beans\)/.test(await page.locator("main").innerText()), "the recipe shows in English");
    ok(/Translated by Chef Mealan/.test(await page.locator(".rq-lang").innerText()), "Translated by Chef Mealan");
    const m1 = await saved(page);
    ok(m1.steps[0] === SR[0] && m1.tr && m1.tr.steps[0] === EN[0], "the original is kept, the translation with it");
    await page.locator(".rq-lang-switch button").filter({ hasText: "Original, Srpski" }).click(); await page.waitForTimeout(400);
    ok(/Iseci luk/.test(await steps(page)), "Original, Srpski: as written");
    await page.locator(".rq-lang-switch button").filter({ hasText: /^English$/ }).click(); await page.waitForTimeout(400);
    ok(/Slice the onion/.test(await steps(page)), "and back to English");
    for (const c of await page.locator(".rq-lang-switch button").all()) { const r = await c.boundingBox(); ok(r && r.height >= 44, "the switch is 44 px"); break; }
    // translated: Start cooking asks nothing; cook mode reads English
    await page.locator(".rq-start button").filter({ hasText: "Start cooking" }).click(); await page.waitForTimeout(1500);
    ok(await page.locator(".cook-mode").count() === 1 && /Slice the onion/.test(await page.locator(".cook-mode").innerText()), "cook mode shows the English steps");
    ok(page.asked.length === 1, "translated once");
    await page.context().close();

    // Start cooking asks once; Cook it as written
    page = await open({ ...seed, meals: [recipe()] });
    await page.locator(".rq-start button").filter({ hasText: "Start cooking" }).click(); await page.waitForTimeout(600);
    const ask = page.locator(".rq-lang-cook");
    ok(await ask.count() === 1 && /This recipe is in Srpski\. Cook it in English\?/.test(await ask.innerText()), "Start cooking asks once: Cook it in English?");
    await ask.getByRole("button", { name: "Cook it as written" }).click(); await page.waitForTimeout(1500);
    ok(await page.locator(".cook-mode").count() === 1 && /Iseci luk/.test(await page.locator(".cook-mode").innerText()), "Cook it as written: cook mode in Srpski");
    ok((await saved(page)).trNo?.includes("en") && page.asked.length === 0, "it is kept as written, nothing translated");
    await page.goto(B + "/my-recipes/m-pr"); await page.waitForTimeout(1200);
    ok(await page.locator(".rq-lang-offer").count() === 0, "and the page does not offer again");
    await page.context().close();

    // Start cooking: Cook it in English
    page = await open({ ...seed, meals: [recipe()] });
    await page.locator(".rq-start button").filter({ hasText: "Start cooking" }).click(); await page.waitForTimeout(600);
    await page.locator(".rq-lang-cook").getByRole("button", { name: "Cook it in English" }).click(); await page.waitForTimeout(2000);
    ok(page.asked.length === 1 && await page.locator(".cook-mode").count() === 1 && /Slice the onion/.test(await page.locator(".cook-mode").innerText()), "Cook it in English: translated, and cook mode in English");
    await page.context().close();

    // Keep it in Srpski on the page
    page = await open({ ...seed, meals: [recipe()] });
    await page.locator(".rq-lang-offer").getByRole("button", { name: "Keep it in Srpski" }).click(); await page.waitForTimeout(500);
    ok(await page.locator(".rq-lang-offer").count() === 0 && /Iseci luk/.test(await steps(page)), "Keep it in Srpski: as written, no offer");
    await page.context().close();

    // a recipe that just came in from a link: read into English by itself, Original ›
    page = await open({ ...seed, meals: [recipe({ source: { name: "recepti.rs", url: "https://recepti.rs/prebranac", from: "link", at: "2026-11-07T08:19:00Z" } })] });
    await page.waitForTimeout(1500);
    const came = page.locator(".rq-lang-came");
    ok(page.asked.length === 1 && /Slice the onion/.test(await steps(page)), "it came in already in English");
    ok(await came.count() === 1 && /From a link, in English\. The page is in Srpski; Chef Mealan read it in your language\./.test(await came.innerText()), "and says so: " + (await came.count() ? await came.innerText() : "none"));
    await came.getByRole("button", { name: "Original ›" }).click(); await page.waitForTimeout(400);
    ok(/Iseci luk/.test(await steps(page)) && await page.locator(".rq-lang-switch").count() === 1, "Original ›: as written, with the switch");
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "nothing scrolls sideways");
    await page.context().close();
  } finally { await b.close(); server.kill(); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  if (fail) { console.log(`${fail} failed`); process.exit(1); }
  console.log("all passed");
})();
