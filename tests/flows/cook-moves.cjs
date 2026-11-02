// DT216 and DT217 v2 (0.3.56, board Stories163; Coach Milan 2 November 15:54 to 16:38, Go): a plate with flour or a raw egg is
// cooked and never gets the bowl steps; a recipe that kept the bowl steps gets new ones, and Lock the recipe keeps them. Cook
// mode keeps the whole step on top and reads it one move at a time under it: one food, or one action; Next and Back go move
// by move, the last move ticks the step. The AI is off here: the steps are written by hand, the moves made in code.
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
const PORT = "3345", B = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (plate = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-02T12:00:00") });
    await page.addInitScript((s) => {
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-cook-voice", "off"); sessionStorage.setItem("seeded", "1"); }
      window.__spoken = [];
      Object.defineProperty(window, "speechSynthesis", { value: { speak: (u) => { window.__spoken.push(u.text); queueMicrotask(() => u.onend && u.onend()); }, cancel: () => {}, getVoices: () => [] }, configurable: true });
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
    }, { ...seed, ...plate });
    await require("./adult.cjs")(page);
    await page.goto(B + "/plate"); await page.waitForTimeout(1200);
    return { ctx, page };
  };
  const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  try {
    // ---- DT216: the crêpes, a recipe that kept the bowl steps ----
    let { ctx, page } = await open({ items: structuredClone(crepes), title: "Protein crepes", plateAt: "2026-11-02T11:50:00" });
    const main = () => page.locator("main").textContent();
    ok(await page.getByRole("button", { name: "How to make it ›", exact: true }).count() === 1 && await page.getByRole("button", { name: "Lock the recipe", exact: true }).count() === 0, "DT220: the Plate's white button says where it goes: How to make it ›");
    await page.getByRole("button", { name: "How to make it ›", exact: true }).click(); await page.waitForTimeout(900);
    ok(/How to make it/.test(await page.locator("h2").first().textContent()) && !/How do you want to eat it/.test(await main()), "flour and eggs: How to make it, never the bowl ways");
    if (process.env.DEBUG) console.log("DEBUG", (await main()).slice(0, 900));
    ok(!/stir until it's one colour/.test(await main()) && await page.getByRole("button", { name: "Write my own" }).count() === 1, "the bowl steps the recipe kept are not shown; Write my own is offered (the AI is off here)");
    await page.getByRole("button", { name: "Write my own" }).click(); await page.waitForTimeout(200);
    await page.getByLabel("Your steps, one per line").fill("Whisk 104 g eggs and 100 g milk and 35 g flour until smooth.\nHeat a pan and cook thin crêpes, 2 minutes a side.\nSpread 180 g quark and 81 g banana on top and roll them up.");
    await page.getByRole("button", { name: "Keep my steps" }).click(); await page.waitForTimeout(400);
    ok(/Your recipe had the bowl steps from an earlier save\. Lock it and cook keeps these new steps with it\./.test(await main()), "the line says the recipe had the bowl steps, and Lock it and cook keeps the new ones (DT220)");
    ok(await page.locator(".mk-steps-for").textContent() === "Make reads these steps aloud, one at a time, and you tick them as you go. Lock it and cook keeps them with the recipe." && await page.getByRole("button", { name: "Lock the recipe", exact: true }).count() === 0, "DT220: one line says what the steps are for; the button says what comes next");
    await page.getByRole("button", { name: "Lock it and cook ›", exact: true }).click(); await page.waitForTimeout(900);
    let r = (await store(page)).meals.find((m) => m.id === "m-cr");
    ok(r.steps.length === 3 && /Whisk 104 g eggs/.test(r.steps[0]) && !r.way, "Lock it and cook keeps the new steps with the recipe; the bowl way is gone");
    // ---- DT217 v2: the whole step on top, the moves under it ----
    await page.getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(600);
    const cm = page.locator(".cook-mode");
    ok(/Whisk 104 g eggs and 100 g milk and 35 g flour until smooth\./.test(await cm.locator(".cook-text").textContent()), "the whole step stays on top");
    ok(/READ ALOUD, ONE AT A TIME · 1 OF 4/.test(await cm.locator(".cook-moves-head").textContent()) && await cm.locator(".cook-move").count() === 4, "under it the moves: 1 of 4");
    ok(JSON.stringify(await cm.locator(".cook-move").allTextContents()) === JSON.stringify(["▶Add 104 g eggs.", "Add 100 g milk.", "Add 35 g flour.", "Whisk them until smooth."]), "one food a move, then the action: " + JSON.stringify(await cm.locator(".cook-move").allTextContents()));
    await cm.getByRole("button", { name: /Next/ }).click(); await page.waitForTimeout(200);
    ok(/2 OF 4/.test(await cm.locator(".cook-moves-head").textContent()) && await cm.locator(".cook-move.done").count() === 1 && /Add 100 g milk/.test(await cm.locator(".cook-move.on").textContent()), "Next: the next move; the one before ticked");
    await cm.getByRole("button", { name: /Back/ }).click(); await page.waitForTimeout(200);
    ok(/1 OF 4/.test(await cm.locator(".cook-moves-head").textContent()), "Back: the move before");
    for (let i = 0; i < 4; i++) { await cm.getByRole("button", { name: /Next/ }).click(); await page.waitForTimeout(150); }
    ok(await cm.locator(".cook-moves").count() === 0 && /Heat a pan/.test(await cm.locator(".cook-text").textContent()) && await cm.getByRole("tab", { name: "Step 1, done" }).count() === 1, "Next on the last move ticks step 1; step 2 has one move: the step itself");
    await cm.getByRole("button", { name: /Back/ }).click(); await page.waitForTimeout(200);
    ok(/4 OF 4/.test(await cm.locator(".cook-moves-head").textContent()), "Back from step 2 goes to step 1's last move");
    await cm.getByRole("tab", { name: /^Step 3/ }).click(); await page.waitForTimeout(200);
    ok(/1 OF 3/.test(await cm.locator(".cook-moves-head").textContent()) && await cm.getByRole("button", { name: /Next/ }).count() === 1, "a number button jumps to a step's first move; Next until its last move");
    await cm.getByRole("button", { name: /Next/ }).click(); await cm.getByRole("button", { name: /Next/ }).click(); await page.waitForTimeout(200);
    ok(/3 OF 3/.test(await cm.locator(".cook-moves-head").textContent()) && await cm.getByRole("button", { name: "Done ✓" }).count() === 1, "the last move of the last step says Done");
    await cm.getByRole("button", { name: "Done ✓" }).click(); await page.waitForTimeout(300);
    ok(/On Make: add photos to the steps and of the meal, say how the cooking went, then Cooked\. Next: Eat\./.test(await cm.textContent()), "the last screen says what is next on Make (Coach Milan 16:48)");
    await ctx.close();
    // ---- a recipe's steps with food chips: the moves from the chips, the timer on its move ----
    ({ ctx, page } = await open());
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
    await page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).first().click(); await page.waitForTimeout(500);
    await page.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(900);
    const c2 = page.locator(".cook-mode");
    ok(await c2.locator(".cook-moves").count() === 0 && await c2.getByRole("button", { name: /Start 12 min timer/ }).count() === 1, "step 1, one food: the step itself, with its timer");
    await c2.getByRole("button", { name: /Next/ }).click(); await c2.getByRole("button", { name: /Next/ }).click(); await page.waitForTimeout(200);
    const mv = await c2.locator(".cook-move").allTextContents();
    ok(mv.length === 4 && /Add 80 g rice/.test(mv[0]) && /Add 160 g chicken/.test(mv[1]) && /Add 120 g spinach/.test(mv[2]) && /Put them in a bowl and stir\./.test(mv[3]), "step 3, three foods from the recipe's chips: Add each, then the action: " + JSON.stringify(mv));
    await ctx.close();
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok");
  process.exit(fail ? 1 : 0);
})();
