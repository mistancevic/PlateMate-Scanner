// DT256 and DT257 (0.3.111, boards Stories191 and Stories192; Coach Milan 8 November 00:06 and 00:09, Go). A recipe from a
// screenshot whose original steps work with your foods as they are: Start cooking cooks them as written, and the first cook
// makes them the recipe's own (one list, no Yours or Original). Foods that differ: Start cooking waits, as before. A step's
// photo asks Camera or Gallery; the gallery opens the phone's photos (no camera only), Cancel closes the choice.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const PORT = "3409", B = `http://127.0.0.1:${PORT}`;
const PHOTO = fs.readFileSync(path.join(__dirname, "plate.jpg"));
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[160, food("c", "Chicken breast", 120, 22.5, 0, 2.6)], [80, food("r", "Basmati rice", 356, 8.5, 78, 0.9)], [120, food("s", "Spinach", 23, 2.9, 3.6, 0.4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const ORIG = ["Rinse the rice and cook it in 200 ml water for 12 minutes.", "Fry the chicken 6 minutes.", "Add the spinach and stir 2 minutes."];
const meal = (foods) => ({ id: "m-b", title: "Chicken rice bowl", items, portion: 360, source: { name: "", from: "screenshot", at: "2026-11-07T22:58:00Z", steps: ORIG, foods }, savedAt: "2026-11-07T22:58:00Z" });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (m) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-08T12:00:00") });
    await page.addInitScript((s) => { if (sessionStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-cook-voice", "off");
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); sessionStorage.setItem("seeded", "1");
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true }); }, { ...seed, meals: [m] });
    await require("./adult.cjs")(page);
    await page.goto(B + "/my-recipes/m-b"); await page.waitForTimeout(1200);
    return page;
  };
  const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === "m-b"));
  try {
    let page = await open(meal(items.map((i) => i.food.name)));
    const start = page.locator(".rq-start button");
    ok(await start.isEnabled() && /pill-primary/.test(await start.getAttribute("class")), "the original works with your foods: Start cooking opens");
    ok(/3 steps, as the original writes them, read aloud/.test(await page.locator(".rq-start small").textContent()), "3 steps, as the original writes them");
    await start.click(); await page.waitForTimeout(1500);
    await require("./ready.cjs")(page);
    ok(await page.locator(".cook-mode").count() === 1 && /Rinse the rice and cook it in 200 ml water/.test(await page.locator(".cook-mode .cook-text").textContent()), "cook mode reads the original's step 1");
    const m1 = await saved(page);
    ok(JSON.stringify(m1.steps) === JSON.stringify(ORIG), "the first cook makes the original's steps the recipe's own");
    // DT257: Camera or Gallery
    await page.locator(".cook-add-pic").click(); await page.waitForTimeout(200);
    ok(await page.locator(".pp-row .pp-camera").count() === 1 && await page.locator(".pp-row .pp-gallery").count() === 1, "Add a photo of this step asks Camera or Gallery");
    ok(await page.locator(".pp-camera input").getAttribute("capture") === "environment" && await page.locator(".pp-gallery input").getAttribute("capture") === null, "Camera opens the camera; Gallery the phone's photos");
    for (const x of await page.locator(".pp-row .pp-opt, .pp-row .pp-cancel").all()) { const r = await x.boundingBox(); ok(r && r.height >= 44, "44 px: " + (await x.textContent()).trim()); }
    await page.locator(".pp-cancel").click(); await page.waitForTimeout(200);
    ok(await page.locator(".pp-row").count() === 0, "Cancel closes the choice");
    await page.locator(".cook-add-pic").click(); await page.locator(".pp-gallery input").setInputFiles({ name: "step1.jpg", mimeType: "image/jpeg", buffer: PHOTO }); await page.waitForTimeout(1500);
    ok(await page.locator(".cook-mode .cook-pic").count() === 1, "a picture from the gallery goes on step 1");
    await page.locator(".cook-mode .cook-top button").first().click(); await page.waitForTimeout(800);
    await page.goto(B + "/my-recipes/m-b"); await page.waitForTimeout(1200);
    ok(await page.locator(".rq-steps-seg").count() === 0 && /As the original writes them/.test(await page.locator(".rq-steps").textContent()), "one list, the original's line, no Yours or Original");
    await page.context().close();

    // the foods differ from the original's: Start cooking waits
    page = await open(meal(["Chicken thigh", "Basmati rice", "Spinach"]));
    ok(await page.locator(".rq-start button").isDisabled(), "foods that differ from the original's: Start cooking waits, as before");
    await page.context().close();
  } finally { await b.close(); server.kill(); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  if (fail) { console.log(`${fail} failed`); process.exit(1); }
  console.log("all passed");
})();
