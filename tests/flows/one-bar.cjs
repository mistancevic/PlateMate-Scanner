// One bar on the plate (0.2.91, canvas Page 2, board Stories63, DT101 to DT103; Milan 24 October 20:28, "This is culinary
// disaster"): one protein bar, and the tip offered a spoon of oil; yeast and flour sat in Quick picks; the cooking chips of a
// dinner he had taken off were still under the bar. Checked: the tip asks the rules module (skyr or an apple, never oil, yeast
// or a drink, each at its start amount), Quick picks hold no ingredient while the list still does, the chips go with the dish
// (Take it off, an emptied plate) and never carry over to the next plate. Chef Mealan's read of the plate is a stand-in (no AI).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, favorite: false, ...extra });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, { serving: { grams: 50, name: "bar" } });
const YE = F("yeast", "Active dry yeast", 325, 40, 7, 41, { favorite: true }), FL = F("flour", "Wheat flour, type 405", 364, 10, 1, 76), OIL = F("oil", "Olive oil", 884, 0, 100, 0);
const SKYR = F("skyr", "Skyr, natural", 63, 11, 0.2, 4), COLA = F("cola", "Cola", 42, 0, 0, 10.6), WHEY = F("whey", "Whey protein powder, vanilla", 380, 78, 5, 7, { serving: { grams: 30, name: "scoop" } });
seed.foods = [BAR, YE, FL, OIL, SKYR, COLA, WHEY, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 50, locked: false }];
seed.cooking = ["dried oregano", "lemon zest"]; // left behind by a dinner, as on Milan's phone
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const U = "http://127.0.0.1:3263";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3263", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-24T20:28:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { week: 5 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: false, why: "One bar is a snack, not a dinner.", around: "Clean Protein Bar Peanut Love", better_as: "snack" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const text = async (sel = "main") => (await page.locator(sel).first().textContent()).replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  await page.goto(U + "/plate"); await page.waitForTimeout(1800);
  // DT102: the chips of a dinner that is gone are not under the bar; the state is clean too
  ok(await page.locator(".pt-cook").count() === 0, "DT102: no cooking chips under one bar");
  // DT101: the tip offers foods that go with a bar, at their start amounts; never oil, yeast, flour or a drink
  const tip = page.locator(".chef-tip").first();
  ok(await tip.count() === 1 && /Your plate is .* under/.test(await tip.textContent()), "DT101: the tip is there, the plate is under the target");
  const rows = await page.locator(".tip-row .tip-text b").allTextContents();
  const amounts = await page.locator(".tip-row .tip-text small").allTextContents();
  ok(rows.length >= 1 && rows.every((n) => !/oil|yeast|flour|cola/i.test(n)), "DT101: the tip names no oil, yeast, flour or drink: " + rows.join(", "));
  ok(rows.includes("Skyr, natural") || rows.includes("Whey protein powder, vanilla"), "DT101: it names skyr or whey, foods that go with a bar: " + rows.join(", "));
  ok(amounts.every((a) => !/^100 g/.test(a)) && amounts.some((a) => /^(150|30) g/.test(a)), "DT101: each at its own start amount, none at 100 g: " + amounts.join(" | "));
  // DT103: Quick picks hold no ingredient; the list and the search still do
  const picks = await page.locator(".rows .row-food b").allTextContents();
  ok(picks.length > 0 && picks.every((n) => !/yeast|flour|oil/i.test(n)), "DT103: no yeast, flour or oil in Quick picks: " + picks.join(", "));
  await page.getByLabel("Search all my foods").fill("yeast"); await page.waitForTimeout(400);
  ok((await page.locator(".rows .row-food b").allTextContents()).some((n) => /yeast/i.test(n)), "DT103: the search still finds the yeast");
  await page.getByLabel("Search all my foods").fill(""); await page.waitForTimeout(300);
  // the tip's Add puts the food on the plate at that amount
  const first = page.locator(".tip-row").first(); const name = await first.locator(".tip-text b").textContent(); const g = parseInt(await first.locator(".tip-text small").textContent(), 10);
  await first.getByRole("button", { name: "+ Add" }).click(); await page.waitForTimeout(600);
  const s1 = await st();
  ok(s1.items.length === 2 && s1.items[1].food.name === name && s1.items[1].grams === g, `DT101: Add puts ${g} g ${name} on the plate`);
  // DT102: a dish with cooking foods, then Take it off the plate: the chips go with it
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const f = (id) => s.foods.find((x) => x.id === id);
    s.items = [{ id: "a", food: f("bar"), grams: 50, locked: false }, { id: "d1", food: f("skyr"), grams: 150, locked: false, dish: { id: "dish1", title: "Skyr bowl", portions: 1, of: 1 } }];
    s.cooking = ["ground cinnamon"]; s.cookingFor = ["bar", "skyr"]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(1500);
  ok(await page.locator(".pt-cook .pt-chip").count() === 1, "DT102: the dish's cooking chip is shown while the dish is on the plate");
  await page.locator(".dish-fold summary").first().click(); await page.getByRole("button", { name: "Take it off the plate" }).click(); await page.waitForTimeout(500);
  ok(await page.locator(".pt-cook").count() === 0 && !(await st()).cooking, "DT102: Take it off the plate takes the chip with it");
  // DT102: a plate emptied food by food drops them too
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.cooking = ["ground cinnamon"]; s.cookingFor = ["bar"]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(1500);
  ok(await page.locator(".pt-cook .pt-chip").count() === 1, "DT102: one chip while the bar the list was written for is on the plate");
  await require("./swipe.cjs")(page, page.locator(".swipe-fg", { hasText: "Clean Protein Bar" }).locator(".thumb"), "right"); await page.waitForTimeout(600);
  const s2 = await st();
  ok(!s2.cooking && !s2.cookingFor && await page.locator(".pt-cook").count() === 0, "DT102: the bar gone, the cooking foods gone with it: items " + s2.items.length + ", cooking " + JSON.stringify(s2.cooking));
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
