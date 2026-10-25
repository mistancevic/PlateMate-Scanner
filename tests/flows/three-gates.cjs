// The three gates (0.2.98, canvas Page 2, boards G3 and Stories69, DT116; Milan 25 October 01:24 to 10:52): culinary,
// nutrition, your day, each a line in Chef Mealan's card, the sweet spot when all three hold. Checked: a shake with biscuits
// and peanut butter as a lunch fails nutrition (most protein from the powder) while PD fits; Add a protein base puts one on;
// chicken and rice at 23:10 fail your day (the eating window); a plain lunch at 13:00 is the DaaM Good spot; the grams line
// under the letters. Chef Mealan's read is a stand-in (no AI).
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
const U = "http://127.0.0.1:3268";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3268", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
  const WH = F("whey", "Whey protein powder, vanilla", 380, 78, 5, 7, { serving: { grams: 30, name: "scoop" } }), PB2 = F("pb", "Peanut butter", 588, 25, 50, 20), KE = F("keks", "Leibniz Butterkeks", 460, 7, 14, 73);
  const CH = F("chicken", "Chicken breast, cooked", 165, 31, 3.6, 0), RI = F("rice", "Rice, cooked", 130, 2.7, 0.3, 28), SK = F("skyr2", "Skyr, natural", 63, 11, 0.2, 4);
  seed.foods = [WH, PB2, KE, CH, RI, SK, ...seed.foods]; seed.cooking = undefined; seed.meals = [];
  seed.items = [{ id: "a", food: PB2, grams: 40, locked: false }, { id: "b", food: KE, grams: 50, locked: false }, { id: "c", food: WH, grams: 60, locked: false }];
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { week: 5, window: { from: "08:00", to: "21:00" } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A plain plate.", around: "", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
  const text = async (sel = "main") => (await page.locator(sel).first().textContent()).replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  await page.goto(U + "/plate"); await page.waitForTimeout(1800);
  const gate = page.locator(".gate-card").first();
  // the grams under the letters
  const cells = await page.locator(".readout .letter-cell").allTextContents();
  ok(cells.length === 4 && cells.every((c) => /^[A-Za-z]+[+?-]?(\d+g|\?)$/.test(c.replace(/\s+/g, ""))), "0.2.99: each letter with its grams under it, one block: " + cells.join(" | "));
  ok(await page.locator(".readout .readout-extra").count() === 0, "0.2.99: sugars, saturates and salt are not a line in the readout");
  // N28: a shake with biscuits as a lunch
  let lines = await gate.locator(".gate-line-row").allTextContents();
  ok(lines.length === 3 && /^✓ Culinary/.test(lines[0]) && /^✕ Nutrition/.test(lines[1]) && /^✓ Your day/.test(lines[2]), "DT116: three lines, culinary and your day pass, nutrition fails: " + lines.map((l) => l.slice(0, 14)).join(" | "));
  ok(/Most of this lunch's protein comes from the powder: 47 of 6\d g\./.test(lines[1]) && !/[FfCc][+?-]? [Ff]i/.test(lines[1]), "N28: the sentence in words and numbers, no letters: " + lines[1].slice(0, 120));
  ok(/fits your plan/.test(await text(".readout")), "the readout keeps fits your plan: the numbers pass, the gate does not");
  ok(await gate.getByRole("button", { name: "Add a protein base" }).count() === 1 && await gate.getByRole("button", { name: "Make it a snack" }).count() === 1 && await gate.getByRole("button", { name: "Keep it as it is" }).count() >= 1, "DT116: the ways out under the line that fails");
  ok(await page.locator(".gate-sweet").count() === 0, "no sweet spot while a gate fails");
  // Add a protein base: the best protein base that goes with the plate, through the rules
  await gate.getByRole("button", { name: "Add a protein base" }).click(); await page.waitForTimeout(900);
  let s = await st();
  ok(s.items.length === 4 && /Skyr|Quark|Cottage|Chicken/.test(s.items[3].food.name), "DT116: a protein base on the plate: " + s.items[3]?.food.name);
  // N27: fat over half a meal's energy
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const f = (id) => s.foods.find((x) => x.id === id); s.items = [{ id: "a", food: f("pb"), grams: 70, locked: false }, { id: "b", food: f("keks"), grams: 40, locked: false }]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(1800);
  lines = await page.locator(".gate-card .gate-line-row").allTextContents();
  ok(lines.some((l) => /^✕ Nutrition.*More than half of this lunch's energy is fat: \d\d percent, \d+ g\./.test(l)), "N27: fat over half the lunch's energy: " + (lines.find((l) => /Nutrition/.test(l)) || "").slice(0, 110));
  // Your day: chicken and rice at 23:10, outside the window
  await page.clock.setFixedTime(new Date("2026-10-25T23:10:00"));
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const f = (id) => s.foods.find((x) => x.id === id); s.items = [{ id: "a", food: f("chicken"), grams: 180, locked: false }, { id: "b", food: f("rice"), grams: 200, locked: false }]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(1800);
  lines = await page.locator(".gate-card .gate-line-row").allTextContents();
  ok(lines.some((l) => /^✓ Nutrition/.test(l)) && lines.some((l) => /^✕ Your day.*23:10, and your eating window is 08:00 to 21:00\. A full plate now sits on tomorrow\./.test(l)), "Your day: a full plate outside the window: " + (lines.find((l) => /Your day/.test(l)) || "").slice(0, 120));
  // the sweet spot: the same plate at 13:05
  await page.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
  await page.reload(); await page.waitForTimeout(1800);
  lines = await page.locator(".gate-card .gate-line-row").allTextContents();
  ok(lines.length === 3 && lines.every((l) => /^✓/.test(l)) && /DaaM Good spot: a dish, the numbers, and your day, all three\./.test(await text(".gate-card")), "DT116: all three hold: the DaaM Good spot");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
