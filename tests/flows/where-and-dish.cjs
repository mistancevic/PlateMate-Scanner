// 0.2.5 (canvas S "Plan decides, purpose two: the store" and "Plate makes", H9, H12): Where does this go after a scan from
// Today (on the plate now, into a planned meal with what it does to its PD, a new meal in an empty slot, keep); a dish as
// one row on the Plate with its portions, the recipe never moved, a side as the lever; a dish eaten as it stands is its recipe.
// Changed by story R19 (Milan 06:04 to 06:41, board RS18): the lunch row opens the meal, with its slot on top; Change it on
// the Plate there opens the Plate for the slot, as the row did. Everything after is unchanged.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const f = (re) => seed.foods.find((x) => re.test(x.name));
// sarma for 8: 2,200 g of foods, a portion of 275 g
seed.meals = [{ id: "m4", title: "Sarma", items: [{ id: "s1", food: f(/chicken/i), grams: 800, locked: true }, { id: "s2", food: f(/^rice/i), grams: 1200, locked: true }, { id: "s3", food: f(/^oats/i), grams: 200, locked: true }], portion: 275, savedAt: "2026-10-01T08:00:00Z" }];
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3194" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 2 });
  // today from 16:00, as when it was written: the walkthrough reads the same at any hour (after 21:00 the eating window turned the plate into a snack)
  await page.clock.install({ time: new Date(new Date().setHours(16, 0, 0, 0)) }); await page.clock.resume();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const click = async (re) => { await page.getByRole("button", { name: re }).first().click({ timeout: 5000 }); await page.waitForTimeout(400); };
  await page.route("**/api/product/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ product_name: "Tofu block", brand: "Testers", calories: 98, protein: 12, fats: 4.3, carbs: 3.3, fiber: 0, source: "Open Food Facts · review required" }) }));
  const key = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  await page.addInitScript(([s, key]) => { if (!localStorage.getItem("seeded")) {
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }), lifestyle: { meals: 3, window: { from: "07:30", to: "20:00" } } }));
    // lunch holds the sarma, dinner is empty
    localStorage.setItem("chefmealan-planned", JSON.stringify({ [key]: { lunch: { title: "Sarma", kcal: 454, protein: 38, source: "mine", mealId: "m4", items: s.meals[0].items, portion: 275 } } }));
    localStorage.setItem("seeded", "1"); } }, [seed, key]);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3194/"); await page.waitForTimeout(900);
  // the dish: lunch opens the Plate with sarma as one row, 1 of 8
  await page.getByRole("button", { name: /Lunch at .*Sarma/ }).click(); await page.waitForTimeout(600);
  if (await page.locator(".rq-slot").count()) { await page.locator(".rq-slot").getByRole("button", { name: "Change it on the Plate" }).click(); await page.waitForTimeout(600); }
  ok(await page.locator(".dish-row").count() === 1 && /1 of 8/.test(await page.locator(".dish-portions").textContent()), "the recipe is one row, 1 of 8 portions");
  ok(/A dish/.test(await page.locator(".plan-line").textContent()), "the line says A dish");
  const kcalOf = async () => { const t = await page.locator(".readout-mid small").first().textContent(); const m = t.match(/([\d,.]+)\s*kcal/); if (!m) throw new Error("no kcal in: " + t); return Number(m[1].replace(/[,.]/g, "")); };
  const kcal1 = await kcalOf();
  await page.getByRole("button", { name: "One portion more" }).click(); await page.waitForTimeout(300);
  const kcal2 = await kcalOf();
  ok(/2 of 8/.test(await page.locator(".dish-portions").textContent()) && kcal2 > kcal1 * 1.8, `two portions double the plate: ${kcal1} to ${kcal2} kcal`);
  await page.getByRole("button", { name: "One portion less" }).click(); await page.waitForTimeout(300);
  // eaten as it stands: the card points at the recipe, no copy
  await click(/^(Keep it as it is|Lock the recipe)$/);
  if (await page.locator(".way").count()) { await page.locator(".way").first().click(); await page.waitForTimeout(200); await click(/I'm making it this way|Lock the recipe, this way/i); } else await click(/^Continue$/);
  await click(/On to How was it|Rate it/i);
  ok(/Sarma is in My recipes already/.test(await page.locator("main").textContent()), "the after step says the recipe exists");
  await click(/DaaM good/i); await click(/^Save$/); await page.waitForTimeout(600);
  const meals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.map((m) => m.title));
  ok(meals.length === 1, "no second Sarma: " + meals.join(", "));
  // from Recipes, Make it (0.2.5+r11, R10): the dish again, a side next to it; Fit moves the side, never the recipe
  await page.getByRole("button", { name: /^Recipes$/ }).first().click(); await page.waitForTimeout(500);
  await page.locator(".recipe-tile").first().click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Change it first", exact: true }).click(); await page.waitForTimeout(600);
  await page.locator(".row-food", { hasText: "Skyr" }).getByRole("button").click(); await page.waitForTimeout(300);
  await click(/^(Fit to my target|Make it an? \w+)$/); await page.waitForTimeout(1200);
  ok(await page.locator(".dish-row").count() === 1 && /Fit set \d+ g skyr|Already above your target/.test(await page.locator(".plate-card").textContent()), "after Fit (in place, 0.2.88) the dish is still one row and the side is what Fit moved");
  const sarmaGrams = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.filter((i) => i.dish).map((i) => i.grams));
  ok(sarmaGrams.join(",") === "100,150,25", "the recipe's amounts stay one portion: " + sarmaGrams.join(", "));
  // Where does this go: Scan on the Plate (0.2.25, RP5: Today has no camera), a barcode, the sheet
  // Changed by story DS rule E (Milan 07:30, board DS2): Back sits top left and says where it goes, Back to the plate
  // 0.2.88: Fit stays on the Plate, so no Back to tap
  if (await page.getByRole("button", { name: /^Back/ }).count()) { await page.getByRole("button", { name: /^Back/ }).first().click(); await page.waitForTimeout(500); }
  await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(1500);
  ok(await page.locator(".cam-title").count() === 1, "Scan on the Plate opens the camera");
  await page.getByRole("button", { name: /^Barcode$/ }).click(); await page.waitForTimeout(400);
  const field = page.locator('input[aria-label="Type the barcode"]');
  await field.fill("4260345270123"); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Use the code only" }).click(); await page.waitForTimeout(1200);
  await page.getByLabel(/I checked the values/).check();
  await page.getByRole("button", { name: /Confirm & save food/ }).click(); await page.waitForTimeout(800);
  // 0.2.25 (RP5): Today has no camera, so Where does this go? (the question after a scan from Today) is not asked; Scan on the
  // Plate puts the food on the plate, and keeps it in My foods
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.some((x) => x.name === "Tofu block")), "the food is in My foods");
  // Changed by story DT82 (Milan 23 October 2026, after Tester 3's call): the check reads the plate's rows, not the whole screen;
  // the food list under the Plate also shows the name, so the old check passed while the plate stayed empty
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.some((i) => i.food.name === "Tofu block")), "Scan on the Plate puts the food on the plate");
  ok(errs.length === 0, errs.length ? "page errors: " + errs.join(" | ") : "no page errors");
  await b.close(); server.kill();
  process.exit(fail ? 1 : 0);
})();
