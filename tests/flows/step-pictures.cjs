// DT175a (0.3.18, board Stories123 v2; Coach Milan 30 October 20:16 Go): a picture per step, Beta. Added from the gallery
// (or the camera), who made it asked, the checks shown, Keep it; AI · Beta under the thumbnail; Watch the steps once every
// step has one, playing them with words under the picture, numbers to jump, Cook it as written; in cook mode the picture
// on top of the step with its label under it; six step buttons to jump (only Next ticks), and go to step N by voice.
// Pictures are files: they survive a reload and leave the saved data. Nothing goes to members.
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
const PORT = "3196", B = `http://127.0.0.1:${PORT}`;
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
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); sessionStorage.setItem("seeded", "1"); }
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
    const JPG = path.resolve(__dirname, "front.jpg");
    const say = async (t) => { const r = await page.evaluate((t) => window.__say(t), t); await page.waitForTimeout(300); return r; };
    const toRecipe = async () => { await page.goto(B + "/"); await page.waitForTimeout(900); await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500); await page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).click(); await page.waitForTimeout(500); };
    await toRecipe();
    ok(await page.locator(".rq-steps .rq-step-pic").count() === 6 && await page.getByRole("button", { name: /^Add a picture to step/ }).count() === 6, "each step has a place for a picture");
    ok(await page.locator(".watch-card").count() === 0, "no Watch the steps until every step has a picture");
    const addPic = async (k, who) => {
      await page.getByRole("button", { name: `Add a picture to step ${k}` }).click(); await page.waitForTimeout(300);
      const sh = page.locator(".sp-sheet");
      await sh.locator('input[type=file]:not([capture])').setInputFiles(JPG); await page.waitForTimeout(700);
      return sh;
    };
    let sh = await addPic(1);
    ok(/Picture for step 1/.test(await sh.textContent()) && /Rinse 80 g rice/.test(await sh.textContent()), "the sheet names the step");
    ok(await sh.locator("img.sp-preview").count() === 1 && /Before you keep it/.test(await sh.textContent()) && /Meat raw before cooking, cooked through after it/.test(await sh.textContent()), "the picture, and the checks before it is kept");
    ok(await sh.getByRole("button", { name: "Keep it" }).isDisabled(), "Keep it waits for who made it");
    await sh.getByRole("button", { name: "Drawn by AI" }).click(); await sh.getByRole("button", { name: "Keep it" }).click(); await page.waitForTimeout(500);
    ok(await page.locator(".sp-sheet").count() === 0 && await page.locator(".rq-step-pic img").count() === 1 && /AI · Beta/.test(await page.locator(".rq-step-pic").first().textContent()), "kept: the thumbnail beside step 1, AI · Beta under it");
    const sizes = await page.evaluate(() => [...document.querySelectorAll(".rq-step-pic button, .sp-sheet .pill")].map((b) => Math.round(b.getBoundingClientRect().height)));
    ok(sizes.every((h) => h >= 44), "every picture button is 44 px or more: " + sizes.join(","));
    const small = await page.evaluate(() => Math.min(...[...document.querySelectorAll(".rq-step-pic small")].map((x) => parseFloat(getComputedStyle(x).fontSize))));
    ok(small >= 12, "labels 12 px or more: " + small);
    for (let k = 2; k <= 6; k++) { sh = await addPic(k); await sh.getByRole("button", { name: k === 2 ? "My photo" : "Drawn by AI" }).click(); await sh.getByRole("button", { name: "Keep it" }).click(); await page.waitForTimeout(400); }
    ok(await page.locator(".rq-step-pic img").count() === 6 && /Yours/.test(await page.locator(".rq-step-pic").nth(1).textContent()), "six pictures; step 2 says Yours");
    if (process.env.SHOTS) await page.screenshot({ path: process.env.SHOTS + "/sp-recipe.png", fullPage: true });
    ok(await page.locator(".watch-card").count() === 1 && /6 steps, about 30 seconds · pictures drawn by AI, Beta/.test(await page.locator(".watch-card").textContent()), "Watch the steps appears, on the recipe");
    // the pictures are files: a reload brings them back from the photo store, and the saved data holds fingerprints
    await page.waitForTimeout(2500);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === "m-bowl"));
    ok(saved && !saved.stepPics && Array.isArray(saved.stepPicSigs) && saved.stepPicSigs.filter(Boolean).length === 6 && saved.stepPicMeta[1].by === "me", "saved data: fingerprints and who made each, not the pictures");
    await toRecipe();
    ok(await page.locator(".rq-step-pic img").count() === 6, "after a reload the six pictures are back");
    // Watch the steps
    await page.getByRole("button", { name: "Watch the steps" }).first().click(); await page.waitForTimeout(400);
    const pl = page.locator(".sp-player");
    ok(await pl.count() === 1 && /STEP 1 OF 6 · TIMER 12:00/.test(await pl.textContent()) && /Picture drawn by AI, Beta/.test(await pl.locator(".sp-words").textContent()), "it plays from step 1, the words, the timer and the label under the picture");
    await page.clock.runFor(5300); await page.waitForTimeout(300);
    if (process.env.SHOTS) await page.screenshot({ path: process.env.SHOTS + "/sp-player.png", fullPage: true });
    ok(/STEP 2 OF 6/.test(await pl.textContent()) && /Your photo/.test(await pl.locator(".sp-words").textContent()), "about 5 seconds later, step 2; Your photo under it");
    await pl.getByRole("tab", { name: "Step 5" }).click(); await page.waitForTimeout(200);
    ok(/STEP 5 OF 6/.test(await pl.textContent()), "a number jumps to its step");
    await pl.getByRole("button", { name: /Pause/ }).click(); await page.clock.runFor(8000); await page.waitForTimeout(200);
    ok(/STEP 5 OF 6/.test(await pl.textContent()), "Pause holds the step");
    await pl.getByRole("button", { name: "Cook it as written" }).click(); await page.waitForTimeout(1200);
    if (await page.getByRole("button", { name: "Start a new plate" }).count()) { await page.getByRole("button", { name: "Start a new plate" }).click(); await page.waitForTimeout(1200); }
    ok(/Make: Chicken rice bowl/.test(await page.locator("h2").first().textContent().catch(() => "")), "Cook it as written from the player goes straight to Make");
    // cook mode: the picture on top, step buttons
    await page.getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(400);
    const cm = page.locator(".cook-mode");
    await cm.getByRole("button", { name: "Turn voice on" }).click(); await page.waitForTimeout(200);
    ok(await cm.locator("img.cook-pic").count() === 1 && /Picture drawn by AI, Beta/.test(await cm.locator(".cook-pic-label").textContent()), "cook mode: the step's picture on top, its label under it");
    ok(await cm.locator(".cook-step-btn").count() === 6 && Math.min(...await cm.locator(".cook-step-btn").evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().height))) >= 44, "six step buttons, 44 px high");
    await cm.getByRole("tab", { name: "Step 4" }).click(); await page.waitForTimeout(300);
    ok(/4 of 6/.test(await cm.locator(".cook-count").textContent()) && /^Step 4\./.test(await page.evaluate(() => window.__spoken.at(-1))), "tap 4: step 4, read aloud");
    ok(await cm.locator(".cook-step-btn.done").count() === 0, "jumping ahead ticks nothing");
    await cm.getByRole("button", { name: "Next ›" }).click(); await page.waitForTimeout(200);
    ok(await cm.getByRole("tab", { name: "Step 4, done" }).count() === 1, "Next ticks step 4");
    await say("go to step 2");
    if (process.env.SHOTS) await page.screenshot({ path: process.env.SHOTS + "/sp-cook.png", fullPage: true });
    ok(/2 of 6/.test(await cm.locator(".cook-count").textContent()) && /Your photo/.test(await cm.locator(".cook-pic-label").textContent()), "go to step 2, by voice; Your photo under its picture");
    await say("go to step 9");
    ok(/This recipe has 6 steps/.test(await cm.locator(".cook-heard").textContent()), "a step that isn't there: says how many there are");
    await cm.getByRole("button", { name: "✕ Close" }).click(); await page.waitForTimeout(300);
    // removing a picture: Watch the steps goes
    await toRecipe();
    await page.getByRole("button", { name: "Change the picture of step 3" }).click(); await page.waitForTimeout(300);
    await page.locator(".sp-sheet").getByRole("button", { name: "Remove this picture" }).click(); await page.waitForTimeout(400);
    ok(await page.locator(".rq-step-pic img").count() === 5 && await page.locator(".watch-card").count() === 0, "a picture removed: five left, Watch the steps waits for the sixth");
    // a step rewritten loses its picture; the others follow their words
    await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(400);
    const f1 = page.getByRole("textbox", { name: "Step 1", exact: true });
    await f1.click(); await page.keyboard.press("End"); await page.keyboard.type(" Drain well."); await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(600);
    ok(await page.locator(".rq-step-pic img").count() === 4 && await page.getByRole("button", { name: "Add a picture to step 1" }).count() === 1 && await page.getByRole("button", { name: "Add a picture to step 3" }).count() === 1, "step 1 rewritten: its picture goes; the other four stay with their steps");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } catch (e) { console.log("FAIL " + e.message); fail++; }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok"); process.exit(fail ? 1 : 0);
})();
