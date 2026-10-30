// DT174 (0.3.16, board Stories121; Coach Milan 30 October 16:39 Go): two doors on a recipe, Cook it as written straight to
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
const PORT = "3194", B = `http://127.0.0.1:${PORT}`;
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
    const say = async (t) => { const r = await page.evaluate((t) => window.__say(t), t); await page.waitForTimeout(250); return r; };
    const toRecipe = async () => { await page.goto(B + "/"); await page.waitForTimeout(900); await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500); await page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).click(); await page.waitForTimeout(500); };
    await toRecipe();
    ok(await page.getByRole("button", { name: "Cook it as written", exact: true }).count() === 1 && await page.getByRole("button", { name: "Change it first", exact: true }).count() === 1, "the recipe has two doors: Cook it as written and Change it first");
    ok(await page.getByRole("button", { name: "Make it", exact: true }).count() === 0, "Make it is now Change it first");
    // Change it first: the Plate, to edit
    await page.getByRole("button", { name: "Change it first", exact: true }).click(); await page.waitForTimeout(1000);
    ok(await page.getByRole("button", { name: "Fit to my target" }).count() > 0 && !/Make: /.test(await page.locator("h2").first().textContent().catch(() => "")), "Change it first opens the Plate to edit");
    // Cook it as written: straight to Make
    await toRecipe();
    await page.getByRole("button", { name: "Cook it as written", exact: true }).click(); await page.waitForTimeout(1000);
    // the plate still holds the foods from Change it first: the Plate asks first, as for any recipe
    ok(await page.getByRole("button", { name: "Start a new plate" }).count() === 1, "a plate with foods on it asks first");
    await page.getByRole("button", { name: "Start a new plate" }).click(); await page.waitForTimeout(1200);
    ok(/Make: Chicken rice bowl/.test(await page.locator("h2").first().textContent().catch(() => "")), "Cook it as written goes straight to Make");
    ok(await page.locator(".mk-check").count() === 6, "Make lists the recipe's 6 steps to tick");
    ok(/160 g chicken/.test(await page.locator(".mk-check").nth(1).textContent()), "with the recipe's amounts");
    await page.getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(500);
    const cm = page.locator(".cook-mode");
    ok(await cm.count() === 1 && /1 of 6/.test(await cm.locator(".cook-count").textContent()), "Start cooking opens cook mode on step 1 of 6");
    ok(await page.evaluate(() => window.__locks) >= 1, "cook mode asks the phone to keep the screen on");
    ok(/Cook hands free\?/.test(await cm.textContent()) && /Google does it in Chrome, Apple in Safari/.test(await cm.textContent()), "the first time, voice is asked for, with where the voice goes");
    ok((await page.evaluate(() => window.__spoken.length)) === 0, "nothing is read aloud before voice is on");
    ok(/Start 12 min timer/.test(await cm.textContent()), "a step that names minutes offers its timer");
    await cm.getByRole("button", { name: "Turn voice on" }).click(); await page.waitForTimeout(400);
    ok((await page.evaluate(() => window.__spoken.at(-1))) === "Step 1. Rinse 80 grams rice and bring it to the boil in 200 millilitres water. Cover and cook on low heat for 12 minutes.", "voice on: the step is read aloud, amounts in words");
    ok(await cm.locator(".cook-ask").count() === 0 && /Listening/.test(await cm.locator(".cook-listen").textContent()), "the ask goes, and the screen says it is listening");
    await say("next");
    ok(/2 of 6/.test(await cm.locator(".cook-count").textContent()) && /^Step 2\. Cut 160 grams chicken/.test(await page.evaluate(() => window.__spoken.at(-1))), "next: step 2, read aloud");
    await say("How much rice?");
    ok(/80 g rice\. In step 1\.|80 g basmati rice\. In step 1\./.test(await cm.locator(".cook-heard").textContent()), "how much rice: the amount cooked, and its step");
    await say("back");
    ok(/1 of 6/.test(await cm.locator(".cook-count").textContent()), "back: step 1");
    await say("what's left");
    ok(/5 steps after this one\. Next: Cut 160 g chicken/.test(await cm.locator(".cook-heard").textContent()), "what's left: how many, and the next step");
    await cm.getByRole("button", { name: /Start 12 min timer/ }).click(); await page.waitForTimeout(300);
    await say("timer 5 minutes");
    ok(await cm.locator(".cook-timer").count() === 2 && /Rice/.test(await cm.locator(".cook-timers").textContent()), "two timers run side by side, named after their step");
    await page.clock.runFor(5 * 60 * 1000 + 2000); await page.waitForTimeout(400);
    ok(/done/.test(await cm.locator(".cook-timer").nth(1).textContent()) && (await page.evaluate(() => window.__spoken)).some((x) => /timer is done/.test(x)), "a timer that ends shows done and says which");
    await say("the onions smell lovely");
    ok(/isn't something I can do yet/.test(await cm.locator(".cook-heard").textContent()), "something else said: what it heard, and what it can do");
    // close keeps the ticks
    await say("next"); await say("next");
    ok(/3 of 6/.test(await cm.locator(".cook-count").textContent()), "two steps on");
    await say("stop"); await page.waitForTimeout(300);
    ok(await page.locator(".cook-mode").count() === 0 && await page.locator(".mk-check.on").count() === 2, "stop closes cook mode; the two finished steps are ticked on Make");
    ok(await page.getByRole("button", { name: "Go on cooking", exact: true }).count() === 1, "Make says Go on cooking");
    await page.getByRole("button", { name: "Go on cooking", exact: true }).click(); await page.waitForTimeout(400);
    ok(/3 of 6/.test(await cm.locator(".cook-count").textContent()) && await cm.locator(".cook-ask").count() === 0, "it goes on at step 3, and voice is not asked again");
    for (let i = 0; i < 4; i++) { await cm.getByRole("button", { name: /^(Next ›|Done ✓)$/ }).click(); await page.waitForTimeout(200); }
    ok(/Done\. Enjoy your meal\./.test(await cm.textContent()), "the last step's Done: done");
    await cm.getByRole("button", { name: "Back to Make" }).click(); await page.waitForTimeout(400);
    ok(await page.locator(".cook-mode").count() === 0 && await page.locator(".mk-check.on").count() === 6, "Back to Make: every step ticked");
    ok(await page.getByRole("button", { name: "Rate it" }).count() > 0, "the rest of Make is as before");
    // a recipe that makes 4: as written means the whole pot, so the steps say the whole recipe's amounts
    await page.goto(B + "/"); await page.waitForTimeout(900); await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500); await page.locator(".recipe-tile").filter({ hasText: "Lentil soup" }).click(); await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Cook it as written", exact: true }).click(); await page.waitForTimeout(900);
    if (await page.getByRole("button", { name: "Start a new plate" }).count()) { await page.getByRole("button", { name: "Start a new plate" }).click(); await page.waitForTimeout(1200); }
    ok(/Make: Lentil soup/.test(await page.locator("h2").first().textContent().catch(() => "")) && /300 g lentils/.test(await page.locator(".mk-check").first().textContent()), "a recipe that makes 4, as written: the whole pot's amounts on Make");
    await page.getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(400);
    ok(/300 g lentils/.test(await cm.locator(".cook-text").textContent()), "and in cook mode");
    await say("stop");
    // a browser that can't listen: buttons steer, the voice can still read
    const two = await open(false); const p2 = two.page;
    await p2.goto(B + "/"); await p2.waitForTimeout(900); await p2.locator("nav button").filter({ hasText: "Recipes" }).click(); await p2.waitForTimeout(500); await p2.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).click(); await p2.waitForTimeout(500);
    await p2.getByRole("button", { name: "Cook it as written", exact: true }).click(); await p2.waitForTimeout(1200);
    await p2.getByRole("button", { name: "Start cooking", exact: true }).click(); await p2.waitForTimeout(400);
    const c2 = p2.locator(".cook-mode");
    ok(await c2.locator(".cook-ask").count() === 0 && /This browser can't listen/.test(await c2.textContent()), "no speech recognition: no ask, the buttons steer");
    await c2.getByRole("button", { name: "Next ›" }).click(); await p2.waitForTimeout(200);
    ok(/2 of 6/.test(await c2.locator(".cook-count").textContent()), "Next works without voice");
    await two.ctx.close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } catch (e) { console.log("FAIL " + e.message); fail++; }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok"); process.exit(fail ? 1 : 0);
})();
