// DT160 and DT161 (0.3.3, canvas Page 2, boards Stories112 version 2 and Stories113; Coach Milan 29 October 19:30 "Both DT160
// and 161 can go. Double check the impact from profile setup. Makes no sense that it is there set but no influence. Also, take
// into account selected kitchen dishes"). The goal setup has 3. Carbs and fat: Balanced by default, More fat moves fat to 35 %
// and the day table with it, Very low carb takes typed carbs and fat the rest; the Explorer says Calculated for you, names the
// pick, and opens each family with Your day; What you eat has Paleo, Meat only and Other; the kitchens' dishes follow the diet;
// every request that asks Chef Mealan for food carries how the person eats.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3335", U = `http://127.0.0.1:${PORT}`;
const SHOTS = process.env.SHOTS;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SHOTS ? 2 : 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-29T11:00:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, kitchens: ["Balkan", "Italian", "Indian"], sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
  await page.goto(U + "/"); await page.waitForTimeout(1200);
  // the goal setup: 3. Carbs and fat
  await page.goto(U + "/me/goal"); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Change the goal" }).click(); await page.waitForTimeout(1200);
  const cf = page.locator(".carbs-fat");
  ok((await cf.locator(".section-title").textContent()).trim() === "3. Carbs and fat" && (await cf.locator(".activity b").allTextContents()).join("|") === "Balanced|More carbs|More fat|Very low carb", "DT161: 3. Carbs and fat, four chips");
  ok(await cf.locator('.activity[aria-pressed="true"]').count() === 1 && /^Balanced/.test(await text(cf.locator('.activity[aria-pressed="true"]'))) && /^83 gof fat a day/.test(await text(cf.locator(".fat-card"))), "DT161: Balanced by default, 83 g of fat, as before");
  ok(/56 to 97 g on your week's 2,500 kcal\. Yours is 30 %: Balanced\. Carbs take the rest, 228 to 366 g, up and down with your training\. On Wednesday, Friday, Saturday and Sunday your carbs are below 45 % of the energy/.test(await text(cf.locator(".fat-card"))), "DT161: the range, the carbs' span, the days below 45 %");
  await cf.getByRole("button", { name: /^More fat/ }).click(); await page.waitForTimeout(400);
  ok(/^97 gof fat a day/.test(await text(cf.locator(".fat-card"))) && /On every day but Monday your carbs are below 45 %/.test(await text(cf.locator(".fat-card"))), "DT161: More fat, 97 g, every day but Monday below 45 %");
  const monday = (await page.locator(".dt-row").first().locator(".dt-cells > *").allTextContents()).map((x) => x.trim());
  ok(monday.slice(-3).join("|") === "160|97|334", "DT161: the day table follows the chip: Monday " + monday.join(" "));
  await cf.getByRole("button", { name: /^Very low carb/ }).click(); await page.waitForTimeout(300);
  ok(/Until then your days stay Balanced/.test(await text(cf.locator(".fat-card"))), "DT161: Very low carb waits for the carbs to be typed");
  await page.locator("#low-carbs").fill("50"); await page.waitForTimeout(400);
  ok(/^Your carbs a day, g162 to 223 gof fat a dayYour carbs stay at 50 g every day; fat takes the rest and goes up and down with your training\. That is 63 to 70 % of your energy from fat, above the 20 to 35 % range, and carbs below the 45 to 60 % range \(EFSA\)\. Your choice/.test(await text(cf.locator(".fat-card"))), "DT161: Very low carb, fat the rest of each day, said against both ranges: " + (await text(cf.locator(".fat-card"))).slice(0, 60));
  await cf.getByRole("button", { name: /^More fat/ }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Apply from/ }).click(); await page.waitForTimeout(1200);
  // the Explorer: Calculated for you, Your day
  const openEx = async (fam) => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(600); if (fam !== "Protein") { await page.locator(".ex-families").getByRole("radio", { name: fam }).click(); await page.waitForTimeout(300); } };
  await openEx("Protein");
  const calc = await text(page.locator(".ex-calc"));
  ok(/^Calculated for you\. Ranges and meal amounts here come from your goal and setup: Maintain, More fat, 85 kg, three meals\. Today: strength, moderate, 2,600 kcal\. Numbers marked for you change when they change\. Change them ›$/.test(calc), "DT160: Calculated for you names the goal, the pick and today: " + calc);
  ok(await text(page.locator(".ex-yourday .ex-range")) === "Protein135 to 185 g · yours 160 g1.6 to 2.2 g per kg of your 85 kg, because you train. The same every day. ISSN 2017.", "DT160: protein, one range every day, yours in it");
  await openEx("Fats");
  ok(/^Fat56 to 97 g · yours 97 g20 to 35 % of your week's average, 2,500 kcal, the same way your fat is set\. Yours is 35 %: More fat\./.test(await text(page.locator(".ex-yourday .ex-range").first())) && /^Saturated fatunder 28 g/.test(await text(page.locator(".ex-yourday .ex-range").nth(1))), "DT160: fat on the week's average, saturated fat under 10 %");
  await openEx("Carbs");
  const cr = (await page.locator(".ex-yourday .ex-range").allTextContents()).map((x) => x.replace(/\s+/g, " ").trim());
  ok(/^Carbohydrate today293 to 390 g · yours 272 g45 to 60 % of today's 2,600 kcal\. Yours is 42 %/.test(cr[0]) && /^Your week197 to 334 g · today 272 gCarbs move with the day: 197 g on Wednesday, your lightest day, 334 g on Monday, your hardest\./.test(cr[1]), "DT160: carbs today, and the week from the lightest day to the hardest: " + cr[1].slice(0, 40));
  ok(await text(page.locator(".ex-yourday .ex-warn")) === "On every day but Monday your carbs are below 45 % of the energy, the bottom of EFSA's range: that is what More fat means.", "DT160: the days below 45 % named, and why");
  ok(/^Fibreat least 25 g/.test(cr[2]) && /^Free sugarsunder 65 g/.test(cr[3]), "DT160: fibre at least 25 g, free sugars under 10 % of today");
  // What you eat
  await page.goto(U + "/me/lifestyle"); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Meat only", exact: true }).click(); await page.waitForTimeout(300);
  ok(/^Meat, fish and eggs\. They bring almost no carbs, so your carbs come close to zero\. Very low carb fits your numbers: set it under Goal ›$/.test(await text(page.locator(".diet-hint"))), "DT161: Meat only says what it means for the numbers, with a way to Goal");
  await page.getByRole("button", { name: "Other", exact: true }).click(); await page.waitForTimeout(300);
  await page.getByLabel("How you eat, in your words").fill("Mediterranean, no gluten"); await page.waitForTimeout(300);
  ok(await page.locator(".diet-other input").inputValue() === "Mediterranean, no gluten" && await page.getByText("Chef Mealan reads this with every plate and recipe it suggests.").count() === 1, "DT161: Other, in your words; Chef Mealan reads it");
  ok(/Chef Mealan knows how often you drink: when you mention a drink or an evening out, it counts it and leaves room in the day\./.test(await text(page.locator("main"))), "audit: the alcohol line says what Chef Mealan does with it");
  // what goes to Chef Mealan: every request that asks for food carries how they eat
  const bodies = [];
  await page.route("**/api/out", (r) => { bodies.push(r.request().postDataJSON()); r.fulfill({ status: 200, contentType: "application/json", body: "{}" }); });
  await page.route("**/api/scan", (r) => { bodies.push(r.request().postDataJSON()); r.fulfill({ status: 200, contentType: "application/json", body: "{}" }); });
  await page.evaluate(async () => { await fetch("/api/out", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "dinner?" }) }); await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ x: 1 }) }); });
  await page.waitForTimeout(300);
  ok(JSON.stringify(bodies[0]?.eats) === JSON.stringify({ what_they_eat: "Other", in_their_words: "Mediterranean, no gluten", carbs_and_fat: "More fat" }) && bodies[0]?.text === "dinner?", "DT161: a request to Chef Mealan carries how they eat: " + JSON.stringify(bodies[0]?.eats));
  ok(bodies[1] && bodies[1].eats === undefined, "DT161: a request that doesn't ask for food carries nothing more");
  // the kitchens' dishes follow the diet
  await page.goto(U + "/me/lifestyle"); await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Vegan", exact: true }).click(); await page.waitForTimeout(300);
  await page.goto(U + "/me/shop"); await page.waitForTimeout(1200);
  const kt = (await page.locator(".kt").allTextContents()).map((x) => x.replace(/\s+/g, " ").trim());
  ok(/No Balkan dish we list fits Vegan\. Chef Mealan cooks the kitchen your way/.test(kt[0]), "DT161: Balkan, no dish we list fits Vegan, said plainly");
  ok(/Two dishes Chef Mealan would cook you, all Vegan:MinestronePasta e fagioli/.test(kt[1]) && /Three dishes Chef Mealan would cook you, all Vegan:Dal with riceChana masalaRajma with rice/.test(kt[2]), "DT161: Italian and Indian show only Vegan dishes");
  if (SHOTS) await page.locator(".kitchens").screenshot({ path: `${SHOTS}/kitchens-vegan.png` });
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
