// DT211 v9, DT212 v4 and DT214 v2 (0.3.53, boards Stories158, Stories159 and Stories162; Coach Milan 2 November 12:52 to
// 12:54, all as proposed, Go): one cook, from Start cooking to how it carried you. Start cooking sits in the recipe's Steps
// block and opens cook mode; Make has + Photo on each step, the final photo and How did the cooking go?, Chef Mealan's line;
// leaving keeps everything and a strip says where it stands; coming back, Chef Mealan asks to go on; Eat asks how much and
// how it tasted; 30 minutes on, the last answer closes the cook. A plate from earlier asks Did you eat it?, alone; Save for
// later waits at the top of the Plate with Continue; Start cooking never adds to a plate; a food while cooking asks where it goes.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🍽️", barcode: undefined, table: undefined, places: [] });
const items = [[160, food("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0)], [80, food("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3)], [120, food("s", "Spinach, fresh", 23, 2.9, 3.6, 0.4, 2.2)], [8, food("o", "Olive oil", 884, 0, 0, 100, 0)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Rinse [[i:r|rice]] and cook it 12 minutes.", "Cut [[i:c|chicken]] into strips.", "Fry the chicken in [[i:o|olive oil]] 6 minutes.", "Add [[i:s|spinach]] and stir 2 minutes."];
const skyr = food("k", "Skyr, natural", 63, 11, 4, 0.2, 0), peas = food("p", "Peas, green", 81, 5.4, 14.5, 0.4, 5.7);
seed.items = []; seed.feedback = [];
seed.foods = [...seed.foods.filter((f) => f.id !== "k" && f.id !== "p"), skyr, peas];
seed.meals = [{ id: "m-bowl", title: "Chicken rice bowl", items, portion: 368, steps: STEPS, stepsFor: items.map((i) => i.food.name), savedAt: "2026-10-28T10:00:00Z" },
  { id: "m-nos", title: "Skyr bowl", items: [{ id: "k", grams: 250, locked: false, food: skyr }], portion: 250, savedAt: "2026-10-28T10:00:00Z" }];
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const PORT = "3344", B = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (plate = {}, time = "2026-11-02T12:00:00") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date(time) });
    await page.addInitScript((s) => {
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); sessionStorage.setItem("seeded", "1"); }
      const synth = { speak: () => {}, cancel: () => {}, getVoices: () => [] };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
    }, { ...seed, ...plate });
    await require("./adult.cjs")(page);
    await page.goto(B + "/"); await page.waitForTimeout(900);
    return { ctx, page };
  };
  const nav = (page, t) => page.locator("nav button").filter({ hasText: t }).first().click();
  const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const toRecipe = async (page, t = "Chicken rice bowl") => { await nav(page, "Recipes"); await page.waitForTimeout(500); await page.locator(".recipe-tile").filter({ hasText: t }).first().click(); await page.waitForTimeout(600); };
  try {
    // ---- 1. the recipe: one Start cooking, in the Steps block; grey with why when there are no steps ----
    let { ctx, page } = await open();
    await toRecipe(page);
    const steps = page.locator(".rq-steps");
    ok(await steps.getByRole("button", { name: "Start cooking", exact: true }).count() === 1, "Start cooking sits at the end of the Steps block");
    ok(/4 steps, read aloud\. Say next, back or repeat\. A second phone can show them\./.test(await steps.textContent()), "its line says what it does");
    ok(await page.getByRole("button", { name: "Cook it as written" }).count() === 0, "Cook it as written is gone; Change it first stays");
    ok(await page.getByRole("button", { name: "Change it first" }).count() === 1, "Change it first is there");
    ok(/Photos for the steps come from cooking/.test(await steps.textContent()) && await steps.locator(".rq-step-pic").count() === 0, "no + slots on the recipe; photos come from cooking");
    ok(!/No picture yet|Draw a picture|\+ Picture/.test(await page.locator("main").textContent()), "Photo is the one word: no Picture on the recipe");
    await toRecipe(page, "Skyr bowl");
    const grey = page.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true });
    ok(await grey.isDisabled() && /It opens once the steps are here/.test(await page.locator(".rq-steps").textContent()), "no steps: Start cooking is grey, with why");
    // ---- 2. Start cooking opens cook mode; Make keeps every tick and photo ----
    await toRecipe(page);
    await steps.getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(1200);
    ok(await page.locator(".cook-mode").count() === 1, "Start cooking opens cook mode, the steps read aloud");
    await page.locator(".cook-mode button").filter({ hasText: "Close" }).first().click(); await page.waitForTimeout(400);
    const main = () => page.locator("main").textContent();
    ok(/Prep.*Make.*Eat/.test(await page.locator(".phase-bar").textContent()), "the steps are Prep, Make, Eat (DT230)");
    ok(/Tick each step when it is done/.test(await main()), "the steps block says what the ticks are for");
    ok(await page.locator(".mk-photo").count() === 4, "each step has + Photo beside its tick");
    await page.locator(".mk-check").nth(0).click(); await page.locator(".mk-check").nth(1).click();
    await page.locator(".mk-photo input").nth(1).setInputFiles({ name: "s.png", mimeType: "image/png", buffer: PNG }); await page.waitForTimeout(700);
    ok(await page.locator(".mk-photo img").count() === 1, "the photo shows on its step");
    ok(/The meal, the final look/.test(await main()) && /How did the cooking go\?/.test(await page.locator(".chef-line").first().textContent()), "the final photo, then Chef Mealan asks how the cooking went");
    ok(await page.getByRole("button", { name: /Cooked\. Next: Eat/ }).count() === 1 && await page.getByRole("button", { name: "Rate it" }).count() === 0, "Make ends on Cooked. Next: Eat");
    let st = await store(page);
    ok(st.cook && st.cook.inView && st.cook.ui.ticks.length === 2 && Object.keys(st.cook.ui.stepPhotos).length === 1 && st.cook.recipeId === "m-bowl", "the cook keeps the ticks and the photo from the first tap");
    ok(st.meals.find((m) => m.id === "m-bowl").stepPicMeta?.[1]?.by === "me", "the step photo is the recipe's step photo, the step had none");
    // ---- 3. leave: the Plate is free, the strip says where it stands ----
    await nav(page, "Today"); await page.waitForTimeout(700);
    ok(/Cooking now · Chicken rice bowl · step 3 of 4/.test(await page.locator(".cook-strip").textContent()), "Today: Cooking now, the dish, the step");
    const goal = await page.locator("section.plan").boundingBox(), strip = await page.locator(".cook-strip").boundingBox();
    ok(strip.y > goal.y + goal.height - 1, "the strip sits under the My goal block, never above the title");
    await nav(page, "Plate"); await page.waitForTimeout(700);
    st = await store(page);
    ok(st.items.length === 0 && st.cook.plate.items.length === 4, "the Plate is free; the dish waits with the cook");
    ok(/What are you craving\?/.test(await main()) && await page.locator(".cook-strip").count() === 1, "the Plate: the strip under What are you craving?");
    // ---- 4. a food while cooking asks where it goes ----
    await page.locator("main input").first().fill("Skyr"); await page.waitForTimeout(700);
    await page.locator("main button").filter({ hasText: /^Skyr, natural/ }).first().click(); await page.waitForTimeout(700);
    ok(/You are cooking Chicken rice bowl\. Shall I use this skyr in it, put it on the Plate, or keep it in your foods\?/.test(await main()), "Chef Mealan asks: use it in the dish, put it on the Plate, or keep it in your foods");
    await page.getByRole("button", { name: "Use it in Chicken rice bowl" }).click(); await page.waitForTimeout(900);
    ok(/what does it replace in Chicken rice bowl, or does it add to it\?/.test(await main()), "Use it: what it replaces, or Add it");
    await page.getByRole("button", { name: "In place of spinach" }).click(); await page.waitForTimeout(500);
    ok(/120 g skyr/.test(await page.locator(".mk-card").textContent()), "the steps follow: the skyr in the spinach's place");
    // ---- 5. coming back: Chef Mealan asks to go on ----
    await nav(page, "Recipes"); await page.waitForTimeout(500);
    ok(await page.locator(".cook-strip").count() === 0, "no strip on Recipes (Coach Milan 19:00: Today and the Plate only)");
    await nav(page, "Plan"); await page.waitForTimeout(500);
    ok(await page.locator(".cook-strip").count() === 0, "no strip on Plan either");
    await nav(page, "Today"); await page.waitForTimeout(500);
    await page.locator(".cook-strip").click(); await page.waitForTimeout(900);
    ok(/You were cooking Chicken rice bowl: 2 of 4 steps ticked, 1 photo\. Go on where you left off\?/.test(await main()), "Go on: Chef Mealan picks up where you left off");
    ok(await page.locator(".mk-check.on").count() === 2 && await page.locator(".mk-photo img").count() === 1, "the ticks and the photo are all there");
    await page.getByRole("button", { name: "Go on cooking" }).click(); await page.waitForTimeout(500);
    await page.locator(".cook-mode button").filter({ hasText: "Close" }).first().click(); await page.waitForTimeout(300);
    await page.reload(); await page.waitForTimeout(1200);
    if (process.env.DEBUG) { const x = await store(page); console.log("DEBUG", page.url(), JSON.stringify(x.cook && { inView: x.cook.inView, step: x.cook.ui.step, ticks: x.cook.ui.ticks }), (await main()).slice(0, 300)); }
    await page.locator(".cook-strip").first().click().catch(() => {}); await page.waitForTimeout(800);
    if (process.env.DEBUG) console.log("DEBUG2", (await main()).slice(0, 300));
    ok(await page.locator(".mk-check.on").count() === 2, "the app closed and opened again: nothing lost");
    await page.getByRole("button", { name: "Go on cooking" }).click().catch(() => {}); await page.waitForTimeout(400);
    await page.locator(".cook-mode button").filter({ hasText: "Close" }).first().click().catch(() => {}); await page.waitForTimeout(300);
    // ---- 6. Eat ----
    await page.getByRole("button", { name: /Cooked\. Next: Eat/ }).click(); await page.waitForTimeout(700);
    ok(/Eat: how was it\?/.test(await main()) && /Back to making it/.test(await main()), "Eat: how was it?, Back to making it");
    const lines = await page.locator(".chef-line").allTextContents();
    ok(lines.some((x) => /Enjoy it\. How much did you eat\?/.test(x)) && lines.some((x) => /And how did it taste\?/.test(x)), "Chef Mealan asks how much, then how it tasted");
    await page.getByRole("button", { name: "DaaM good" }).click();
    // DT225 v2 (0.3.61, board Stories166): Chef Mealan asks for your words; they go on the recipe, only for you
    ok(lines.length >= 2 && (await page.locator(".eat-words .chef-line").textContent()).includes("Anything you want to remember about it?") && /Kept on the recipe, only for you\. Your coach sees it when you share the meal\./.test(await page.locator(".eat-words").textContent()), "DT225: Eat asks for your words, kept on the recipe, only for you");
    await page.getByLabel("Anything you want to remember about it?").fill("I felt so energized.");
    await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(1000);
    st = await store(page);
    ok(st.cook && st.cook.stage === "carry" && st.cook.cardId === st.feedback[0].id && st.feedback[0].photoSteps?.[0] === 1, "eaten: the cook waits for the last question; the card keeps the step's photo with its step");
    await nav(page, "Today"); await page.waitForTimeout(600);
    ok(/Eaten 12:\d\d · Chicken rice bowl · Chef Mealan asks how it carried you in \d+ min/.test(await page.locator(".cook-strip").textContent()), "the strip says when Chef Mealan asks");
    // ---- DT218 (0.3.58, board Stories164): Go on opens the question on the meal's card at once; a ✕ on the strip; none on Explorer ----
    await nav(page, "Plate"); await page.waitForTimeout(500);
    const xb = await page.locator(".cook-strip .cs-end").boundingBox();
    ok(xb && xb.width >= 44 && xb.height >= 44, "DT218: after eating the strip has a ✕, 44 px");
    await page.locator(".cook-strip .cs-main").click(); await page.waitForTimeout(900);
    ok(/Today/.test(await page.locator("h1, .app-title, header").first().textContent()) && /How did it carry you\? Answer now, or in \d+ minutes, when I ask\./.test(await page.locator(".carry-in").first().textContent()), "DT218: Go on lands on Today with the question open on the meal's card");
    await nav(page, "Explorer"); await page.waitForTimeout(500);
    ok(await page.locator(".cook-strip").count() === 0, "no strip on Explorer (Coach Milan 18:30)");
    await nav(page, "Today"); await page.waitForTimeout(500);
    // ---- 7. 30 minutes on ----
    await page.clock.fastForward("31:00"); await page.reload(); await page.waitForTimeout(1200);
    ok(/About 30 minutes on: how did it carry you\?/.test(await page.locator(".carry-in").first().textContent()), "30 minutes on: his line on the meal's card");
    ok(/Your answer closes the cook/.test(await page.locator(".carry-in").first().textContent()), "the answer closes the cook, it says so");
    await page.locator(".carry-acts button").first().click(); await page.waitForTimeout(500);
    st = await store(page);
    ok(!st.cook && st.feedback[0].carry?.how === "light" && await page.locator(".cook-strip").count() === 0, "answered: the strip goes, the card keeps it all");
    await toRecipe(page);
    ok(/Your cooks/.test(await main()) && /As the steps say: 1 of 1/.test(await page.locator(".rq-cooks").textContent()), "the recipe collects its cooks");
    // DT225 v2: every time you ate it, at the end of the recipe, under its buttons
    const log = page.locator(".rq-eats"), logText = (await log.textContent()).replace(/\s+/g, " ");
    const editY = (await page.getByRole("button", { name: "Edit recipe" }).boundingBox()).y, logY = (await log.boundingBox()).y;
    ok(/Every time you ate it/.test(logText) && /Only you see this\./.test(logText) && /Today, 12:\d\d · cooked/.test(logText) && /DaaM good/.test(logText) && /carried you: light and awake/.test(logText) && /“I felt so energized\.”/.test(logText) && logY > editY, "DT225: the row of this meal, under Edit recipe: " + logText.slice(0, 200));
    await ctx.close();
    // ---- 8. a plate from yesterday asks, alone; Save for later; Continue ----
    const PLATE = { items: [{ id: "a", food: items[0].food, grams: 170, locked: false }, { id: "b", food: peas, grams: 150, locked: false }, { id: "c", food: items[1].food, grams: 80, locked: false }], title: "", plateAt: "2026-11-01T13:11:00" };
    ({ ctx, page } = await open(PLATE, "2026-11-02T00:42:00"));
    await nav(page, "Plate"); await page.waitForTimeout(800);
    ok(/Your plate from yesterday, 13:11\. Chicken breast, peas and basmati rice\. Did you eat it\?/.test(await main()), "a plate from earlier opens on one question, Chef Mealan's line");
    ok(await page.locator(".plate-card").count() === 0, "the question shows alone; the foods wait behind it");
    ok(await page.getByRole("button", { name: "Ate it" }).count() === 1 && await page.getByRole("button", { name: "Keep working on it" }).count() === 1 && await page.getByRole("button", { name: "Clear it" }).count() === 1, "Ate it, Save for later, Keep working on it, Clear it");
    await page.getByRole("button", { name: "Save for later" }).click(); await page.waitForTimeout(700);
    ok(/Saved for later/.test(await page.locator(".later-card").textContent()) && /yesterday, 13:11 · 3 foods/.test(await page.locator(".later-card").textContent()), "it waits at the top of the Plate, with Continue");
    ok(await page.locator(".plate-card").count() === 1 && (await store(page)).items.length === 0, "the Plate is free");
    // DT227 (0.3.61, board Stories167): Remove in sight, with one more tap
    ok(/Continue puts it back on the Plate\. It stays 7 days\./.test(await page.locator(".later-card").textContent()) && await page.locator(".later-card .lr-x").count() === 1, "DT227: a ✕ on the row; the hint about swiping is gone");
    await page.locator(".later-card .lr-x").click(); await page.waitForTimeout(200);
    ok(await page.getByRole("button", { name: "Tap again to remove" }).count() === 1 && await page.getByRole("button", { name: "Keep" }).count() === 1, "DT227: ✕ asks once more: Tap again to remove, or Keep");
    await page.getByRole("button", { name: "Keep" }).click(); await page.waitForTimeout(200);
    ok(await page.getByRole("button", { name: "Continue" }).count() === 1 && ((await store(page)).later ?? []).length === 1, "DT227: Keep keeps it");
    await page.getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(700);
    st = await store(page);
    ok(st.items.length === 3 && !(st.later ?? []).length, "Continue puts it back");
    ok(/Did you eat it\?/.test(await main()), "back as it was, from yesterday, so it asks again");
    await page.getByRole("button", { name: "Keep working on it" }).click(); await page.waitForTimeout(600);
    ok(await page.locator(".plate-card").count() === 1 && !/Did you eat it\?/.test(await main()), "Keep working on it opens it as it is");
    await nav(page, "Today"); await page.waitForTimeout(400); await nav(page, "Plate"); await page.waitForTimeout(600);
    ok(!/Your plate from yesterday/.test(await main()), "and that plate is not asked about again");
    // ---- 9. Start cooking never adds to a plate ----
    await toRecipe(page);
    await page.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(900);
    ok(/Chicken rice bowl starts on its own plate\. Shall I save yours for later, or clear it\?/.test(await main()), "Start cooking with foods on the Plate: save yours for later, or clear it");
    await page.getByRole("button", { name: "Save my plate for later" }).click(); await page.waitForTimeout(1200);
    st = await store(page);
    ok(st.cook && st.cook.inView && st.items.length === 4 && st.later?.length === 1 && await page.locator(".cook-mode").count() === 1, "the recipe on its own plate, cooking; your plate waits for later");
    await page.locator(".cook-mode button").filter({ hasText: "Close" }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Back to the plate|‹/ }).first().click().catch(() => {}); await page.waitForTimeout(500);
    ok(await page.locator(".later-card").count() === 0, "DT227: Saved for later stays off a Plate that is being worked on");
    await ctx.close();
    // ---- DT227: a recipe with a draft on the Plate points to it ----
    ({ ctx, page } = await open({ later: [{ id: "l-1", at: "2026-11-02T11:20:00", kind: "cook", cook: { id: "c-1", startedAt: "2026-11-02T11:00:00", title: "Chicken rice bowl", recipeId: "m-bowl", stage: "make", plate: { items, title: "Chicken rice bowl", fromRecipe: "m-bowl" }, ui: { ticks: ["s0"] }, steps: 4 } }] }));
    await toRecipe(page);
    ok(/Saved for later on the Plate/.test(await page.locator(".rq-saved").textContent()) && /Cooking, today, 11:00 · 1 of 4 steps ticked/.test(await page.locator(".rq-saved").textContent()), "DT227: the recipe says its draft waits on the Plate");
    await page.locator(".rq-saved").getByRole("button", { name: "Continue ›" }).click(); await page.waitForTimeout(900);
    st = await store(page);
    ok(st.cook?.recipeId === "m-bowl" && !(st.later ?? []).length, "DT227: Continue opens the draft on the Plate");
    await ctx.close();
    // ---- 10. the plate's question at 360 px: the buttons inside, one under the other ----
    ({ ctx, page } = await open({ ...PLATE, plateAt: "2026-11-02T11:40:00" }));
    await page.setViewportSize({ width: 360, height: 780 });
    await toRecipe(page);
    await page.getByRole("button", { name: "Change it first" }).click(); await page.waitForTimeout(900);
    ok(/Start a new plate with it, or add it to yours\?/.test(await page.locator(".chef-line").first().textContent()), "the plate question is Chef Mealan's line");
    const box = await page.locator(".plate-ask").boundingBox(), btns = await page.locator(".plate-ask .ca-go button").evaluateAll((bs) => bs.map((x) => { const r = x.getBoundingClientRect(); return [r.left, r.right, r.top]; }));
    ok(btns.length === 2 && btns.every(([l, r]) => l >= box.x - 1 && r <= box.x + box.width + 1) && btns[1][2] > btns[0][2], "its buttons stay inside, one under the other");
    ok(await page.locator(".plate-card").count() === 0, "and it shows alone");
    await ctx.close();
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok");
  process.exit(fail ? 1 : 0);
})();
