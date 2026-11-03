// 0.3.69 (Coach Milan 3 November 13:31 to 13:34, Go): a food scanned while a cook runs. The question has three answers: use it in
// the dish, put it on the Plate (the Plate is free while you cook), or keep it in your foods. And Make shows only steps written
// for the foods it cooks: the Protein Pancake once read the steps Chef Mealan had drafted for a cucumber, feta and chicken plate.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🍽️", barcode: undefined, table: undefined, places: [] });
const pan = [[120, food("e", "Eggs, raw", 143, 12.6, 0.7, 9.5, 0)], [40, food("f", "Wheat flour, white", 364, 10, 76, 1, 2.7)], [100, food("m", "Milk, 1.5% fat", 46, 3.4, 4.8, 1.5, 0)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const skyr = food("k", "Skyr, natural", 63, 11, 4, 0.2, 0);
seed.items = []; seed.feedback = []; seed.meals = []; seed.title = "";
seed.foods = [...seed.foods.filter((f) => !["k", "e", "f", "m"].includes(f.id)), skyr, ...pan.map((i) => i.food)];
// the cook: Protein Pancake, no recipe; in memory, steps once drafted for another plate (cucumber, feta, chicken)
const other = { steps: ["Dice [[i:x|cucumber]] and mix it with [[i:y|feta]].", "Slice [[i:z|chicken breast]] thin."], sig: "x:100|y:40|z:220", foods: "x|y|z" };
seed.cook = { id: "ck1", startedAt: "2026-11-03T12:30:00Z", title: "Protein Pancake", stage: "make", inView: false, plate: { items: pan, title: "Protein Pancake", portion: null }, ui: { step: "made", ticks: [], stepPhotos: {}, plateSteps: other } };
const PORT = "3395", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-03T13:30:00") });
    await page.addInitScript((s) => {
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); sessionStorage.setItem("seeded", "1"); }
      const synth = { speak: () => {}, cancel: () => {}, getVoices: () => [] };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      delete window.SpeechRecognition; delete window.webkitSpeechRecognition;
    }, seed);
    await require("./adult.cjs")(page);
    await page.goto(U + "/"); await page.waitForTimeout(900);
    return { ctx, page };
  };
  const nav = (page, t) => page.locator("nav button").filter({ hasText: t }).first().click();
  const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const main = (page) => page.locator("main").textContent();
  const scanSkyr = async (page) => {
    await nav(page, "Plate"); await page.waitForTimeout(700);
    await page.locator("main input").first().fill("Skyr"); await page.waitForTimeout(700);
    await page.locator("main button").filter({ hasText: /^Skyr, natural/ }).first().click(); await page.waitForTimeout(700);
  };
  try {
    // ---- 1. the question has three answers; Put it on the Plate ----
    let { ctx, page } = await open();
    await scanSkyr(page);
    ok(/Shall I use this skyr in it, put it on the Plate, or keep it in your foods\?/.test(await main(page)), "Chef Mealan asks: use it, put it on the Plate, or keep it");
    for (const n of ["Use it in Protein Pancake", "Put it on the Plate", "Keep it in my foods"]) ok(await page.getByRole("button", { name: n }).count() === 1, `the answer ${n}`);
    await page.getByRole("button", { name: "Put it on the Plate" }).click(); await page.waitForTimeout(800);
    let st = await store(page);
    ok(st.items.length === 1 && /^Skyr/.test(st.items[0].food.name), "Put it on the Plate: the skyr is on the Plate");
    ok(st.cook && st.cook.plate.items.length === 3 && !st.cook.inView, "the cook goes on as it was, its three foods with it");
    ok(!/Shall I use this skyr/.test(await main(page)), "the question is gone; the Plate shows");
    await ctx.close();
    // ---- 2. Use it: Make never reads another plate's steps ----
    ({ ctx, page } = await open());
    await scanSkyr(page);
    await page.getByRole("button", { name: "Use it in Protein Pancake" }).click(); await page.waitForTimeout(1000);
    const t = await main(page);
    ok(/Protein Pancake/.test(t) && /what does it replace in Protein Pancake, or does it add to it\?/.test(t), "Use it: Make for Protein Pancake asks what the skyr replaces");
    ok(!/Dice|cucumber|Slice chicken/i.test(t), "no steps from the cucumber, feta and chicken plate");
    await page.getByRole("button", { name: /Add it/ }).first().click().catch(() => {}); await page.waitForTimeout(900);
    const t2 = await main(page);
    ok(!/Dice|cucumber|Slice chicken/i.test(t2), "after the answer, still none of them");
    // after the answer the dish is back in Craft: its Steps block offers to write them for these foods, none of the old ones show
    ok(/Write my own/.test(t2) && /Craft/.test(t2), "Craft for the dish: write the steps for these foods");
    await ctx.close();
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.slice(0, 2).join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all passed"); process.exit(fail ? 1 : 0);
})();
