// HP3 stills: the app as it is in 0.3.38, for the new homepage sections. Cook mode, a situation, Explorer, the coach's view.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/pm194", R = "/home/claude/boards/rs";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[160, food("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0)], [80, food("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3)], [120, food("s", "Spinach, fresh", 23, 2.9, 3.6, 0.4, 2.2)], [8, food("o", "Olive oil", 884, 0, 0, 100, 0)], [6, food("g", "Garlic", 149, 6.4, 33, 0.5, 2.1)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Rinse [[i:r|rice]] and bring it to the boil in 200 ml water. Cover and cook on low heat for 12 minutes.", "Cut [[i:c|chicken]] into strips. Season with salt and pepper.", "Slice [[i:g|garlic]] thin.",
  "Heat [[i:o|olive oil]] in a pan on medium high heat. Fry the chicken 6 minutes, turning once, until no pink is left inside.", "Add [[i:s|spinach]] and the garlic. Stir 2 minutes, until the spinach wilts.", "Put the rice in a bowl and the chicken and spinach on top."];
seed.items = []; seed.feedback = [];
seed.meals = [{ id: "m-bowl", title: "Chicken rice bowl", items, portion: 374, steps: STEPS, stepsFor: items.map((i) => i.food.name), savedAt: "2026-10-27T10:00:00Z" }];
const PORT = "3397", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date("2026-11-04T18:40:00"));
    await page.addInitScript((s) => {
      if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
        localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1985, heightCm: 180, weightKg: 82, lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
        localStorage.setItem("seeded", "1"); }
      const synth = { speak: () => {}, cancel: () => {}, getVoices: () => [] };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      window.SpeechRecognition = function () { this.start = () => {}; this.stop = () => {}; };
    }, seed);
    await require(`${ROOT}/tests/flows/adult.cjs`)(page);
    return page;
  };
  const clean = (page) => page.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, .chat-fab")) t.style.display = "none"; });
  // cook mode, step 4 of 6, voice on
  let page = await open();
  await page.goto(U + "/"); await page.waitForTimeout(900);
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
  await page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Cook it as written", exact: true }).click(); await page.waitForTimeout(1200);
  if (await page.getByRole("button", { name: "Start a new plate" }).count()) { await page.getByRole("button", { name: "Start a new plate" }).click(); await page.waitForTimeout(1000); }
  await page.getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(500);
  const cm = page.locator(".cook-mode");
  await cm.getByRole("button", { name: "Turn voice on" }).click(); await page.waitForTimeout(400);
  for (let i = 0; i < 3; i++) { await cm.getByRole("button", { name: /^Next/ }).first().click(); await page.waitForTimeout(300); }
  await clean(page); await page.screenshot({ path: `${R}/hp3-cook.png` }); console.log("hp3-cook");
  // a situation: A late evening after work
  await page.goto(U + "/"); await page.waitForTimeout(900);
  await page.locator(".bottom-nav button").filter({ hasText: "Explorer" }).click(); await page.waitForTimeout(600);
  await page.locator(".ex-parts").getByRole("radio", { name: "Situations" }).click(); await page.waitForTimeout(400);
  await page.locator(".ex-map .menu-row").filter({ hasText: "A late evening" }).first().click(); await page.waitForTimeout(700);
  await clean(page); await page.screenshot({ path: `${R}/hp3-situation.png` }); console.log("hp3-situation");
  // Explorer: The body, its map
  await page.locator(".ex-parts").getByRole("radio", { name: "The body" }).click(); await page.waitForTimeout(500);
  await clean(page); await page.screenshot({ path: `${R}/hp3-explorer.png` }); console.log("hp3-explorer");
  // the coach's view: My clients, a client's Today
  page = await open();
  await page.goto(U + "/today?coachdemo"); await page.waitForTimeout(1200);
  await page.getByRole("radio", { name: "My clients" }).click(); await page.waitForTimeout(900);
  await clean(page); await page.screenshot({ path: `${R}/hp3-coach.png` }); console.log("hp3-coach");
  const first = page.locator(".client-row, .cl-row, .menu-row").first();
  await b.close(); server.kill();
})();
