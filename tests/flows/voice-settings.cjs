// DT215 v3 (0.3.66, board Stories162b; Coach Milan 2 November 23:22 to 23:37, Go): Settings in the Menu, a list like Me: Voice
// while cooking (its line says what is set), Language and Units Coming soon. Voice while cooking: Read aloud, the phone's voices
// with ▶ Sample, Speed, Cut in. Cook mode reads with the voice and speed chosen, and its Voice › opens the same page; Back to
// cooking returns to the step. The phone's voices are stand-ins here.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🍽️", barcode: undefined, table: undefined, places: [] });
const crepes = [[104, food("eg", "Eggs", 143, 12.6, 0.7, 9.5, 0)], [100, food("mi", "Milk 1.5%", 47, 3.4, 4.9, 1.5, 0)], [35, food("wf", "Wheat flour, white", 364, 10, 76, 1, 2.7)], [180, food("qu", "Quark, low fat", 67, 12, 4, 0.2, 0)], [81, food("ba", "Banana", 89, 1.1, 22.8, 0.3, 2.6)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const g = (i) => `${i.grams} g ${i.food.name}`;
const BOWL = [`Put ${g(crepes[3])} in a bowl.`, `Add ${[0, 1, 2, 4].map((k) => g(crepes[k])).join(" and ")} and stir until it's one colour.`];
const bowlItems = [[160, food("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0)], [80, food("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3)], [120, food("s", "Spinach, fresh", 23, 2.9, 3.6, 0.4, 2.2)]].map(([gr, f]) => ({ id: f.id, grams: gr, locked: false, food: f }));
seed.items = []; seed.feedback = [];
seed.meals = [{ id: "m-cr", title: "Protein crepes", items: crepes, portion: 500, steps: BOWL, stepsFor: crepes.map((i) => i.food.name), way: "All in one", savedAt: "2026-11-02T10:00:00Z" },
  { id: "m-bowl", title: "Chicken rice bowl", items: bowlItems, portion: 360, steps: ["Cook [[i:r|rice]] 12 minutes.", "Fry [[i:c|chicken]] 6 minutes.", "Put [[i:r|rice]], [[i:c|chicken]] and [[i:s|spinach]] in a bowl and stir."], stepsFor: bowlItems.map((i) => i.food.name), savedAt: "2026-10-28T10:00:00Z" }];
const PORT = "3394", B = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.install({ time: new Date("2026-11-02T12:00:00") });
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-cook-voice", "on"); sessionStorage.setItem("seeded", "1"); }
    window.__spoken = [];
    const voices = [["v-sam", "Samantha", "en-US"], ["v-dan", "Daniel", "en-GB"], ["v-ser", "Serena", "en-GB"], ["v-de", "Anna", "de-DE"], ["v-moira", "Moira", "en-IE"], ["v-karen", "Karen", "en-AU"], ["v-sr", "Milena", "sr-RS"]].map(([voiceURI, name, lang]) => ({ voiceURI, name, lang }));
    Object.defineProperty(window, "speechSynthesis", { value: { speak: (u) => { window.__spoken.push({ text: u.text, rate: u.rate, voice: u.voice ? u.voice.name : null }); queueMicrotask(() => u.onend && u.onend()); }, cancel: () => {}, getVoices: () => voices, addEventListener: () => {}, removeEventListener: () => {} }, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
    delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
  }, seed);
  await require("./adult.cjs")(page);
  try {
    await page.goto(B + "/"); await page.waitForTimeout(1000);
    await page.locator("header button").last().click(); await page.waitForTimeout(500);
    const row = page.locator(".menu-row", { hasText: "Settings" });
    ok(/Voice while cooking · Language and Units coming soon/.test(await row.textContent()), "the Menu has Settings under Foods, its line says what is in it");
    await row.click(); await page.waitForTimeout(400);
    ok(await page.locator(".settings-rows .menu-row").filter({ hasNotText: "Dev data" }).count() === 3 && (await page.locator(".settings-soon").allTextContents()).every((x) => /Coming soon/.test(x)) && /Read aloud · the phone's voice · normal speed · cut in on/.test(await page.locator(".settings-rows .menu-row").first().textContent()), "Settings: Voice while cooking with its line; Language and Units Coming soon");
    await page.locator(".settings-rows .menu-row", { hasText: "Voice while cooking" }).click(); await page.waitForTimeout(400);
    const names = (await page.locator(".vs-voice .choice b").allTextContents());
    ok(names.length === 5 && names[0] === "Daniel" && !names.includes("Anna") && /Show all 7 voices/.test(await page.locator(".vs-all").textContent()), "the phone's voices, English first, five then Show all: " + names.join(", "));
    await page.getByRole("button", { name: "Sample Serena" }).click(); await page.waitForTimeout(200);
    let sp = await page.evaluate(() => window.__spoken);
    ok(sp.length === 1 && sp[0].voice === "Serena" && /^Step 1\./.test(sp[0].text), "▶ Sample reads one step with that voice");
    await page.locator(".vs-voice .choice", { hasText: "Serena" }).click();
    await page.getByRole("radiogroup", { name: "Speed" }).getByRole("button", { name: "Faster" }).click();
    await page.getByRole("switch").uncheck(); await page.waitForTimeout(200);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-voice-settings")));
    ok(saved.voice === "v-ser" && saved.speed === "faster" && saved.cutIn === false, "the choice is kept on this phone: Serena, faster, cut in off");
    await page.locator(".menu-head .link").first().click(); await page.waitForTimeout(400);
    ok(/Read aloud · Serena, English \(UK\) · faster speed · cut in off/.test(await page.locator(".settings-rows .menu-row").first().textContent()), "back on Settings, the line says what is set");
    // ---- cook mode reads with them; Voice › opens the same page ----
    await page.locator(".menu-head .link", { hasText: "Close" }).click().catch(() => {}); await page.waitForTimeout(300);
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
    await page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).first().click(); await page.waitForTimeout(500);
    await page.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(900);
    const cm = page.locator(".cook-mode");
    await cm.getByRole("button", { name: /Next/ }).click(); await page.waitForTimeout(300);
    sp = await page.evaluate(() => window.__spoken);
    const last = sp[sp.length - 1];
    ok(last && last.voice === "Serena" && last.rate === 1.15, "cook mode reads with Serena, faster: " + JSON.stringify(last));
    await cm.getByRole("button", { name: "Voice ›" }).click(); await page.waitForTimeout(300);
    ok(/Voice while cooking/.test(await cm.locator(".cook-title").textContent()) && await cm.locator(".voice-settings").count() === 1, "Voice › opens Voice while cooking over the cook");
    await cm.getByRole("button", { name: "‹ Back to cooking" }).click(); await page.waitForTimeout(300);
    ok(/2 of 3/.test(await cm.locator(".cook-count").textContent()), "Back to cooking: the same step");
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  await ctx.close(); await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok");
  process.exit(fail ? 1 : 0);
})();
