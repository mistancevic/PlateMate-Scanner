// Nutrition on the recipe page (0.2.21, canvas board IM, IM21 and IM21b; Milan 17 October 2026, 13:44 and 14:02). The stats say one
// serving; the table is worked out by code in the EU label order with exact counts (All 8, All 2), PD and a line by part; the
// recipe's own numbers sit under ours. A sweetener with no energy and carbohydrate (erythritol) is a real food, counted as
// polyols: read from a recipe, it never makes the stored data unreadable.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const it = (name, written, grams, role, calories, protein, part, extra = {}) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, optional: false, part, ...extra });
const read = { recipe: { title: "Protein cheesecake", source: "@highproteinbakes on Instagram", servings: 8, servingsUnit: "slices", servingsHow: "recipe", stated: null, steps: ["Crush the biscuits and mix with the melted butter.", "Beat the filling and bake at 320°F for 45 minutes.", "Top with raspberries."], items: [
  it("Digestive biscuits", "120g", 120, "base", 480, 7, "Base"), it("Butter", "40g", 40, "fat", 740, 0.7, "Base"),
  it("Low-fat quark", "500g", 500, "dairy", 67, 12, "Filling"), it("Cream cheese", "200g", 200, "cheese", 342, 6, "Filling"), it("Eggs", "2 large", 120, "protein", 143, 12.6, "Filling"), it("Vanilla whey protein powder", "30g", 30, "protein", 390, 78, "Filling"), it("Sweetener", "40g", 40, "sweet", 0, 0, "Filling"),
  it("Raspberries", "150g", 150, "fruit", 52, 1.2, "Topping"), it("Dark chocolate", "20g", 20, "sweet", 550, 7, "Topping", { optional: true, note: "to drizzle" })] } };
const F = (id, name, calories, protein, icon) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs: null, fats: null, fiber: null, photo: undefined, photos: undefined, icon });
const BOWL = [F("b1", "Basmati rice, cooked", 130, 2.7, "🍚"), F("b2", "Chicken breast, grilled", 165, 31, "🍗"), F("b3", "Black beans, cooked", 132, 8.9, "🫘"), F("b4", "Cheddar", 403, 25, "🧀"), F("b5", "Sour cream", 193, 2.4, "🥛")];
const U = "http://127.0.0.1:3213";
const sweet = { ...read, recipe: { ...read.recipe, title: "Protein cheesecake", stated: null, items: read.recipe.items.map((i) => (i.name === "Sweetener" ? { ...i, name: "Erythritol", calories: 0, protein: 0, fats: 0, carbs: 100 } : { ...i, fats: i.fats ?? 5, carbs: i.carbs ?? 5 })) } };
const cookie = { recipe: { title: "Choc chip cookie", source: "@christopherkaiyu on Instagram", servings: 2, servingsUnit: "cookies", servingsHow: "recipe", stated: { kcal: 234, protein: 15.5, fats: 6.75, carbs: 29.5 }, steps: [], items: [
  it("Light butter", "35g", 35, "fat", 360, 1, "", { fats: 40, carbs: 1 }), it("Egg", "50g", 50, "protein", 143, 12.6, "", { fats: 9.5, carbs: 0.7 }), it("All-purpose flour", "45g", 45, "base", 364, 10, "", { fats: 1, carbs: 76 }), it("Casein protein powder", "25g", 25, "protein", 360, 80, "", { fats: 1.5, carbs: 4 })] } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3213", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (state) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-17T14:10:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      localStorage.setItem("seeded", "1"); }, state);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    return page;
  };
  const text = (page, sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const readIn = async (page, rd) => {
    await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rd) }));
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    await page.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }]);
    await page.waitForTimeout(500); await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(800);
    await require("./put.cjs")(page); await page.waitForTimeout(1300);
    await page.unroute("**/api/recipe/read");
  };
  const openRecipe = async (page, title) => { await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700); await page.getByText(title, { exact: true }).last().click(); await page.waitForTimeout(900); };

  // the cheesecake with erythritol: read, kept, reloaded: the stored data reads back
  const page = await open(seed);
  await readIn(page, sweet);
  await page.reload(); await page.waitForTimeout(1300);
  ok(!/could not be read/.test(await text(page, "main")), "A sweetener with no energy and carbohydrate is a real food: the stored data reads back");
  await openRecipe(page, "Protein cheesecake");
  const stats = await text(page, ".rq-readout");
  ok(/One slice/.test(stats) && /kcal · [\d.]+ g protein · \d+ g/.test(stats), `RP2 (was IM21): the readout says one slice, with its weight (${stats})`);
  const head = (await page.locator('[aria-label="Nutrition"] .nt-th').first().textContent()).replace(/\s+/g, " ").trim();
  ok(/^1 SLICE\d+ gALL 8[\d,]+ g100 G$/.test(head), `IM21, RP2: columns: 1 slice, All 8, 100 g, each with its weight (${head})`);
  const labels = await page.locator('[aria-label="Nutrition"] .nt-row > span').allTextContents();
  ok(JSON.stringify(labels.filter(Boolean)) === JSON.stringify(["Energy", "Fat", "Carbohydrate", "of which polyols", "Protein"]), `IM21: the EU order, with the sweetener's polyols (${labels.filter(Boolean)})`);
  const poly = await text(page, '[aria-label="Nutrition"] .nt-sub');
  ok(/of which polyols\s*5 g\s*40 g/.test(poly.replace(/\s+/g, " ")), `IM21: 40 g erythritol, 5 g a slice (${poly})`);
  const nut = await text(page, '[aria-label="Nutrition"]');
  ok(/By part, 1 slice/.test(nut) && /Base/.test(nut) && /Filling/.test(nut) && /Topping/.test(nut), "IM21: a line by part, for one slice");
  ok(!/The recipe says/.test(nut) && !/no value for/.test(nut) && /PD/.test(await text(page, ".rq-readout")), "RP2: PD in the readout above, not in the table; no recipe numbers when it gives none; nothing missing");
  await page.close();

  // the cookie: All 2, the recipe's own numbers under ours
  const p2 = await open(seed);
  await readIn(p2, cookie);
  await openRecipe(p2, "Choc chip cookie");
  const h2 = (await p2.locator('[aria-label="Nutrition"] .nt-th').first().textContent()).replace(/\s+/g, " ").trim();
  ok(/^1 COOKIE\d+ gALL 2\d+ g100 G$/.test(h2), `IM21b, RP2: exact counts: 1 cookie, All 2, with their weights (${h2})`);
  const says = await text(p2, ".nt-says");
  ok(/The recipe says, per cookie: 234 kcal · 6.8 g fat · 29.5 g carbohydrate · 15.5 g protein · PD 6.6\./.test(says), `IM21b: the recipe's own numbers (${says})`);
  await p2.close();
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
