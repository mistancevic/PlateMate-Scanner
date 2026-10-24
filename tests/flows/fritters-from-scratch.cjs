// The fritters from scratch (0.2.93, canvas Page 2, board Stories66, DT109; Milan 24 October 23:34, testing 0.2.92: chicken,
// rice, an egg and an apple locked as the Apple fritters, with the fritters' fourteen steps). Checked: a recipe opened on the
// Plate keeps its link while at least half of its foods are there, a swap keeps it, and the link goes with a toast when the
// foods go; Lock the recipe then gives the plate's own way, not the original's steps; Save makes a recipe of its own.
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
const U = "http://127.0.0.1:3265";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3265", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-24T23:34:00"));
  const FL2 = F("flour", "all-purpose flour", 364, 10, 1, 76), SU = F("sugar", "Granulated sugar", 400, 0, 0, 100), BU = F("butter", "Unsalted butter", 717, 1, 81, 0), EG = F("eggs", "Eggs", 143, 13, 10, 1, { serving: { grams: 52, name: "egg" } }), AP = F("apples", "Apples", 52, 0.3, 0.2, 14), SO = F("soil", "Sunflower oil", 884, 0, 100, 0);
  const CH = F("chicken", "Chicken breast, cooked", 165, 31, 3.6, 0), RI = F("rice", "Rice, cooked", 130, 2.7, 0.3, 28);
  seed.foods = [FL2, SU, BU, EG, AP, SO, CH, RI, ...seed.foods];
  const fr = { id: "fr", title: "Apple fritters", items: [[FL2, 500], [SU, 100], [BU, 60], [EG, 104], [AP, 300], [SO, 200], [YE, 7]].map(([food, grams], k) => ({ id: "f" + k, food, grams, locked: true })), portion: 1271, savedAt: "2026-10-23T12:00:00Z", steps: ["Whisk the warm milk, yeast, and sugar in the bowl of your stand mixer. Cover and let it sit for 5 minutes.", "Add the remaining sugar, butter, eggs, vanilla, salt, and flour. Beat until the dough comes together.", "Shape the fritters, fry in the oil at 177 °C for 2 minutes a side, glaze, and cool on a rack."], makes: { n: 12, unit: "fritters" } };
  seed.meals = [fr]; seed.items = []; seed.cooking = undefined; seed.openRecipe = "fr";
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { week: 5 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Chicken with rice, an egg and an apple: a plain plate.", around: "Chicken breast, cooked", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const swipe = require("./swipe.cjs");
  const text = async (sel = "main") => (await page.locator(sel).first().textContent()).replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  await page.goto(U + "/plate"); await page.waitForTimeout(2000);
  let s = await st();
  ok(s.fromRecipe === "fr" && s.items.length === 7 && JSON.stringify(s.recipeFoods) === JSON.stringify(["flour", "sugar", "butter", "eggs", "apples", "soil", "yeast"]), "the fritters open on the Plate, linked, with their seven foods noted: " + JSON.stringify(s.recipeFoods));
  ok((await page.locator(".title-input").inputValue().catch(() => "")) === "Apple fritters" || /Apple fritters/.test(await text()), "the plate carries the recipe's name");
  const off = async (name) => { await swipe(page, page.locator(".swipe-fg", { hasText: name }).locator(".name-link, .thumb").first(), "right"); await page.waitForTimeout(700); };
  // three of seven off: four left, still the fritters
  await off("all-purpose flour"); await off("Granulated sugar"); await off("Unsalted butter");
  s = await st();
  ok(s.fromRecipe === "fr" && s.items.length === 4 && await page.locator(".toast, .notice").filter({ hasText: /No longer/ }).count() === 0, "DT109: four of seven foods left, still the fritters");
  // the fourth off: three of seven, under half, the link goes with a toast
  await off("Sunflower oil");
  await page.waitForTimeout(600);
  s = await st();
  ok(!s.fromRecipe && !s.recipeFoods && s.items.length === 3, "DT109: three of seven left, the link is gone: fromRecipe " + s.fromRecipe);
  ok(/No longer Apple fritters: its foods are gone\. The plate is yours\./.test(await text("body")), "DT109: the toast says so");
  ok(!/Apple fritters/.test(await page.locator(".title-input").inputValue().catch(() => "")) , "DT109: the recipe's name left the plate with it");
  // chicken and rice on, like Milan: Lock the recipe gives the plate's own way, never the fritters' steps
  await page.getByLabel("Search all my foods").fill("chicken"); await page.waitForTimeout(400);
  await page.locator(".rows .row-food", { hasText: "Chicken breast" }).first().getByRole("button", { name: "Add" }).click(); await page.waitForTimeout(500);
  await page.getByLabel("Search all my foods").fill("rice"); await page.waitForTimeout(400);
  await page.locator(".rows .row-food", { hasText: "Rice, cooked" }).first().getByRole("button", { name: "Add" }).click(); await page.waitForTimeout(800);
  await page.getByLabel("Search all my foods").fill("");
  ok(await page.getByRole("button", { name: "Just your plate" }).count() === 0 && !/How to make it/.test(await text()), "DT109: no whole-recipe choice on a plate that is no recipe");
  await page.getByRole("button", { name: "Lock the recipe" }).click(); await page.waitForTimeout(1000);
  ok(!/Whisk the warm milk/.test(await text()) && !/12 fritters|fritters are left/.test(await text()), "DT109: Lock the recipe never shows the fritters' steps: " + (await text()).slice(0, 120));
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
