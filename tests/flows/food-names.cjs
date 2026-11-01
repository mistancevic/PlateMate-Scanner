// DT204 (0.3.47, board Stories151; Coach Milan 1 November 17:57 to 18:44 Go; Tester 2's lunch photo of 30 October): food names
// in the app's language with the market's name under them on Foods and the food's card; Tester 2's Spanać becomes Spinach, raw;
// the pasta icon on tortellini; one decimal point on a phone set to Serbian; no portion lines on the parts of a dish read from a
// photo, while a food added by hand keeps its line.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const PORT = "3341", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8"));
const base = { ...seed.foods[0], photo: undefined, photos: undefined, table: undefined, icon: undefined, barcode: undefined };
const EST = (id, name, calories, protein, fats, carbs, fiber) => ({ ...base, id, name, brand: "estimate", source: "estimate", calories, protein, fats, carbs, fiber, readyToEat: true });
const TORT = { ...EST("tort", "Tortellini", 290, 12, 9, 40, 2), brand: "", source: "label" };
const PESTO = EST("pesto", "Creamy pesto sauce", 260, 4, 25, 6, 1), MUSH = EST("mush", "Mushrooms, sliced", 28, 3, 0.5, 3, 1);
const SPIN = { ...base, id: "spin", name: "Spanać", brand: "", basis: "100g", refId: "spinach", aliases: ["Spinach, raw", "Spinat, roh", "Спанаћ"], calories: 23, protein: 2.9, fats: 0.4, carbs: 1.4, fiber: 2.2, source: "Reference table", readyToEat: true, places: ["belgrade"] };
const TUNA = { ...base, id: "tunj", name: "Tunjevina", brand: "", source: "label", calories: 116, protein: 25.5, fats: 0.8, carbs: 0, fiber: 0, places: ["belgrade"] };
const PB = EST("pb", "Peanut butter", 588, 25, 50, 20, 6);
seed.foods = [TORT, PESTO, MUSH, SPIN, TUNA, PB].map((f) => ({ ...f, places: f.places ?? [] })); seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: TORT, grams: 130, locked: false, fromPhoto: true }, { id: "b", food: PESTO, grams: 90, locked: false, est: { low: 60, high: 120 }, fromPhoto: true },
  { id: "c", food: MUSH, grams: 75, locked: false, est: { low: 50, high: 100 }, fromPhoto: true }, { id: "d", food: SPIN, grams: 30, locked: false, fromPhoto: true }];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "sr-RS" });
  const page = await ctx.newPage();
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-region", "belgrade");
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Tortellini in a creamy spinach pesto: one dish.", around: "", better_as: "" }) }));
    await page.goto(U + "/plate"); await page.waitForTimeout(2200);
    const names = await page.locator(".plate-card .name-link").allTextContents();
    ok(names.map((n) => n.trim()).join("|") === "Tortellini|Creamy pesto sauce|Mushrooms, sliced|Spinach", "the plate in one language: " + names.join(", "));
    const lib = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.find((f) => f.id === "spin"));
    ok(lib.name === "Spinach, raw" && lib.aliases.includes("Spanać"), "Spanać in the library became Spinach, raw, and keeps Spanać as another name");
    const tortRow = page.locator(".plate-card .row").filter({ hasText: "Tortellini" }).first();
    ok(/🍝/.test(await tortRow.locator(".thumb, .icon, span").first().textContent()) || /🍝/.test(await tortRow.textContent()), "tortellini has the pasta icon");
    ok(!/🍰/.test(await page.locator(".plate-card").textContent()), "no cake on the plate");
    ok(await page.locator(".plate-card .gate-line").filter({ hasText: /portion of/ }).count() === 0, "no portion lines on the parts of a dish read from a photo");
    const under = ((await page.locator(".plate-card").textContent()).match(/\d[.,]\d under your \d+[.,]\d/) || [""])[0];
    ok(/^\d\.\d under your \d+\.\d$/.test(under), "one decimal point on a phone set to Serbian: " + under);
    // a food added by hand keeps its portion line
    await page.evaluate((pb) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items.push({ id: "e", food: s.foods.find((f) => f.id === "pb"), grams: 150, locked: false }); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
    await page.reload(); await page.waitForTimeout(2000);
    ok(await page.locator(".plate-card .gate-line").filter({ hasText: /150 g is over a portion of peanut butter/ }).count() === 1, "peanut butter added by hand keeps its portion line");
    // Foods: the market's name under the app's
    await page.goto(U + "/foods"); await page.waitForTimeout(1800);
    const spRow = page.locator(".row").filter({ hasText: "Spinach, raw" }).first();
    ok(/In shops in Serbia: Spanać/.test(await spRow.textContent()), "Foods: Spinach, raw, In shops in Serbia: Spanać");
    ok(!/In shops in/.test(await page.locator(".row").filter({ hasText: "Tunjevina" }).first().textContent()), "Tunjevina, a name she typed, stays as it is, no line");
    ok(!/In shops in/.test(await page.locator(".row").filter({ hasText: "Peanut butter" }).first().textContent()), "an estimate that shares a table name gets no line");
    await spRow.locator(".name-link").click(); await page.waitForTimeout(700);
    ok(await page.locator(".shelf-name").filter({ hasText: "In shops in Serbia: Spanać" }).count() >= 1, "the food's card says it too");
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
