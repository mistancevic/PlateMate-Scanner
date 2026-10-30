// DT175 (0.3.17, board Stories122; Coach Milan 30 October 19:36 Go): Chef, ... in cook mode goes to Chef Mealan with the recipe,
// the step and the amounts cooked, answered under the step and read aloud; typed when voice is off; Say what you have on the
// Plate lands the foods named as estimates. Chef Mealan's answers are stubbed; what the app sends is checked.
// Earlier lines: DT174 (0.3.16, board Stories121; Coach Milan 30 October 16:39 Go): two doors on a recipe, Cook it as written straight to
// Make and Change it first through the Plate; Start cooking on Make opens cook mode: one big step, read aloud, steered by voice
// or by tap; timers from the step; how much from the amounts cooked; every finished step ticked on Make; voice asked once.
// The browser's speech is stood in for: a stand-in recognition hears what the walkthrough says, a stand-in voice records.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[160, food("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0)], [80, food("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3)], [120, food("s", "Spinach, fresh", 23, 2.9, 3.6, 0.4, 2.2)], [8, food("o", "Olive oil", 884, 0, 0, 100, 0)], [6, food("g", "Garlic", 149, 6.4, 33, 0.5, 2.1)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = [
  "Rinse [[i:r|rice]] and bring it to the boil in 200 ml water. Cover and cook on low heat for 12 minutes.",
  "Cut [[i:c|chicken]] into strips. Season with salt and pepper.",
  "Slice [[i:g|garlic]] thin.",
  "Heat [[i:o|olive oil]] in a pan on medium high heat. Fry the chicken 6 minutes, turning once, until no pink is left inside.",
  "Add [[i:s|spinach]] and the garlic. Stir 2 minutes, until the spinach wilts.",
  "Put the rice in a bowl and the chicken and spinach on top.",
];
seed.items = []; seed.feedback = [];
const lent = [[300, food("l", "Red lentils, dry", 352, 24.6, 63, 1.1, 10.7)], [1000, food("w", "Vegetable stock", 5, 0.2, 0.7, 0.1, 0)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
seed.meals = [{ id: "m-soup", title: "Lentil soup for four", items: lent, portion: 1300, makes: { n: 4, unit: "portions" }, steps: ["Rinse [[i:l|lentils]].", "Simmer them in [[i:w|stock]] for 25 minutes."], stepsFor: lent.map((i) => i.food.name), savedAt: "2026-10-27T10:00:00Z" }, { id: "m-bowl", title: "Chicken rice bowl", items, portion: 374, steps: STEPS, stepsFor: items.map((i) => i.food.name), savedAt: "2026-10-28T10:00:00Z" }];
const PORT = "3195", B = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (ears) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-10-30T18:40:00") });
    await page.addInitScript(([s, ears]) => {
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z" })); sessionStorage.setItem("seeded", "1"); }
      // the stand-in voice: what is read aloud is kept
      window.__spoken = [];
      const synth = { speak: (u) => window.__spoken.push(u.text), cancel: () => {}, getVoices: () => [] };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      // the stand-in screen lock
      window.__locks = 0;
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => { window.__locks++; return { release: async () => {} }; } }, configurable: true });
      // the stand-in ears: the walkthrough says something with __say
      if (ears) {
        window.__recs = [];
        window.SpeechRecognition = function () { const me = this; window.__recs.push(me); me.start = () => { me.on = true; }; me.stop = () => { me.on = false; }; };
        window.__say = (text) => { const r = window.__recs.filter((x) => x.on).at(-1); if (!r) return false; const res = [{ 0: { transcript: text }, isFinal: true, length: 1 }]; r.onresult({ results: res }); return true; };
      } else { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; }
    }, [seed, ears]);
    await require("./adult.cjs")(page);
    return { ctx, page };
  };
  try {
    const { page } = await open(true);
    let asked = null, saidReq = null;
    await page.route("**/api/status", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ai: true, airtable: false, accessRequired: false }) }));
    await page.route("**/api/cook-ask", (r) => { asked = JSON.parse(r.request().postData() || "{}"); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reply: "Fry them the same way; thinner strips may need only five minutes, until no pink is left. Your bowl then has about 27 g protein instead of 36." }) }); });
    await page.route("**/api/plate-said", (r) => { saidReq = JSON.parse(r.request().postData() || "{}"); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ dish: "Spinach feta eggs", foods: [
      { name: "Eggs", grams: 120, low: 120, high: 120, calories: 143, protein: 12.6, fats: 9.5, carbs: 0.7, fiber: 0, confidence: "high" },
      { name: "Spinach, fresh", grams: 100, low: 70, high: 130, calories: 23, protein: 2.9, fats: 0.4, carbs: 3.6, fiber: 2.2, confidence: "medium" },
      { name: "Feta", grams: 50, low: 35, high: 65, calories: 264, protein: 14, fats: 21, carbs: 4, fiber: 0, confidence: "medium" },
      { name: "Onion", grams: 55, low: 55, high: 55, calories: 40, protein: 1.1, fats: 0.1, carbs: 9.3, fiber: 1.7, confidence: "high" } ], unsure: null }) }); });
    const say = async (t) => { const r = await page.evaluate((t) => window.__say(t), t); await page.waitForTimeout(300); return r; };
    const toRecipe = async () => { await page.goto(B + "/"); await page.waitForTimeout(900); await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500); await page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).click(); await page.waitForTimeout(500); };
    await toRecipe();
    await page.getByRole("button", { name: "Cook it as written", exact: true }).click(); await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(500);
    const cm = page.locator(".cook-mode");
    await cm.getByRole("button", { name: "Turn voice on" }).click(); await page.waitForTimeout(300);
    await say("next"); await say("next"); await say("next");
    ok(/4 of 6/.test(await cm.locator(".cook-count").textContent()), "on step 4");
    // a question without Chef stays on the phone
    await say("I only have 120 g chicken");
    ok(asked === null && /isn't something I can do yet/.test(await cm.locator(".cook-heard").textContent()) && /Start with Chef/.test(await cm.locator(".cook-heard").textContent()), "said without Chef: nothing sent; the screen says to start with Chef");
    // Chef, ... goes to Chef Mealan with the recipe, the step and the amounts cooked
    await say("Chef, I only have 120 g chicken. What do I change?"); await page.waitForTimeout(400);
    ok(asked !== null, "Chef, ...: the question is sent");
    ok(asked && asked.question === "i only have 120 g chicken what do i change" && asked.step === 3 && asked.steps.length === 6 && /160 g chicken/.test(asked.steps[1]) && asked.items.some((i) => /Chicken/.test(i.name) && i.grams === 160) && Array.isArray(asked.equipment) && asked.title === "Chicken rice bowl", "with the question, step 4, the six steps at the cooked amounts, the items, the tools and the title");
    ok(asked && asked.eats !== undefined, "and how they eat, as every food request");
    const heard = await cm.locator(".cook-heard").textContent();
    ok(/YOU ASKED/.test(heard) && /CHEF MEALAN, ABOUT STEP 4/.test(heard) && /27 g protein instead of 36/.test(heard) && /Nothing on your plate changes/.test(heard), "the answer shows under the step, about step 4");
    ok((await page.evaluate(() => window.__spoken.at(-1))) === "Fry them the same way; thinner strips may need only five minutes, until no pink is left. Your bowl then has about 27 g protein instead of 36.", "and is read aloud");
    ok(/4 of 6/.test(await cm.locator(".cook-count").textContent()) && /160 g chicken/.test(await page.locator(".mk-check").nth(1).textContent()), "the step and the amounts stay as they were");
    // typed, with voice off
    await cm.getByRole("button", { name: "Voice off" }).click(); await page.waitForTimeout(200);
    asked = null;
    await cm.locator("#cook-ask-field").fill("Can I use frozen spinach?"); await cm.getByRole("button", { name: "Ask", exact: true }).click(); await page.waitForTimeout(400);
    ok(asked && asked.question === "Can I use frozen spinach?" && asked.history.length === 2 && asked.history[0].role === "cook", "typed: sent too, with the earlier question and answer as history");
    ok(/YOU ASKED/.test(await cm.locator(".cook-heard").textContent()), "answered under the step");
    await say("stop").catch(() => {}); await cm.getByRole("button", { name: "✕ Close" }).click(); await page.waitForTimeout(300);
    // Say what you have, on an empty Plate
    await page.goto(B + "/"); await page.waitForTimeout(900);
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = []; s.title = ""; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
    await page.reload(); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(800);
    if (await page.getByRole("button", { name: /Empty plate/ }).count()) { await page.getByRole("button", { name: /Empty plate/ }).click(); await page.waitForTimeout(400); const yes = page.getByRole("button", { name: /^(Empty it|Yes|Empty)/ }); if (await yes.count()) { await yes.first().click(); await page.waitForTimeout(400); } }
    ok(await page.getByRole("button", { name: "Say what you have" }).count() === 1, "an empty Plate offers Say what you have");
    await page.getByRole("button", { name: "Say what you have" }).click(); await page.waitForTimeout(400);
    const sh = page.locator(".say-have");
    ok(await sh.count() === 1 && /Listening/.test(await sh.textContent()), "it listens");
    await say("eggs, spinach"); await say("feta and half an onion");
    ok(/eggs, spinach, feta and half an onion/.test(await sh.locator(".say-words").textContent()), "the words show as they come");
    await sh.getByRole("button", { name: "Done" }).click(); await page.waitForTimeout(900);
    ok(saidReq && /eggs, spinach, feta and half an onion/.test(saidReq.text) && Array.isArray(saidReq.library), "Done sends the words and the names of your foods");
    const plateText = await page.textContent("body");
    ok(/Eggs/.test(plateText) && /Spinach/.test(plateText) && /Feta/.test(plateText) && /Onion/.test(plateText), "the four foods land on the plate");
    ok(await page.getByRole("button", { name: "Fit to my target" }).count() > 0 && await page.locator(".say-have").count() === 0, "Fit to my target is next; the listening card is gone");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } catch (e) { console.log("FAIL " + e.message); fail++; }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok"); process.exit(fail ? 1 : 0);
})();
