// DT155 (0.2.136, canvas Page 2, board Stories107; Coach Milan 29 October 15:30 and 15:41 "Go"): Explorer, Carbs, the same
// template as Protein and Fats. Carbohydrate the family, its members starch, sugars and fibre; one portion against one meal
// (the meal's share of the day's carbs); fibre against the meal's share of 25 g a day, green when covered; sugars; the members
// in grams, fibre in bold; GI with its band from Atkinson 2008 Table 1 and its row; GL calculated by the paper's method; the
// USDA SR row on every card; the sources at the end. Sorts: Lowest GI, Most of the meal.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3333", U = `http://127.0.0.1:${PORT}`;
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
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
  await page.goto(U + "/"); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(600);
  await page.locator(".ex-families").getByRole("radio", { name: "Carbs" }).click(); await page.waitForTimeout(300);
  ok(await text(page.locator(".ex-h")) === "Not all carbs are equal" && /^Carbohydrate is the family\. Its members are starch, sugars and fibre\./.test(await text(page.locator(".ex-intro"))), "DT155: Carbs, carbohydrate the family");
  const goals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).goals);
  const dayFat = goals.fats ?? Math.round(goals.calories * 0.3 / 9), dayCarb = goals.carbs ?? Math.max(0, Math.round((goals.calories - goals.protein * 4 - dayFat * 9) / 4)), mealCarb = Math.round(dayCarb / 3);
  const mealLine = await text(page.locator(".ex-meal"));
  ok(mealLine === `Your lunch: about ${mealCarb} g of carbs, from your ${dayCarb} g a day.`, "DT155: the lunch's share of the day's carbs: " + mealLine);
  const names = await page.locator(".ex-card .ex-title > b").allTextContents();
  ok(names.length === 8 && names[0] === "Lentils, boiled" && names[7] === "Potatoes, boiled", "DT155: lowest GI first, lentils to potatoes: " + names.join(", "));
  const len = page.getByRole("region", { name: "Lentils, boiled", exact: true });
  const heads = await len.locator(".ex-head > b").allTextContents();
  ok(heads.join("|") === "One portion|Carbs for your lunch|Fibre and sugar|The family members|Quality|How to use it" && await len.locator(".ex-head > small").count() === 6, "DT155: six sections, each with its goal: " + heads.join(" | "));
  const fibreMeal = Math.round(25 / 3 * 10) / 10;
  const rowsL = (await len.locator(".ex-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(rowsL.includes(`Carbs40.2 of ${mealCarb} g`) && rowsL.includes(`Fibre15.8 of ${fibreMeal} g`) && rowsL.includes("Sugars3.6 g"), "DT155: carbs against the lunch, fibre against its share, sugars in grams");
  ok(await len.locator(".ex-row.ex-ok", { hasText: "Fibre15.8" }).count() === 1 && /This portion covers the fibre\./.test(await text(len.locator(".ex-head > small").nth(2))), "DT155: lentils cover the lunch's fibre, green");
  ok(/This portion is mostly starch\./.test(await text(len.locator(".ex-head > small").nth(3))) && await len.locator(".ex-row.ex-strong", { hasText: /^Fibre15\.80 g$/ }).count() === 1, "DT155: mostly starch; fibre in bold among the members");
  const scoresL = (await len.locator(".ex-score").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(scoresL[0] === "GI32, lowAtkinson 2008, Table 1: Lentils" && scoresL[1] === "GL8For this portion, calculated by the same paper's method", "DT155: GI with its band and its row in the table, GL calculated: " + scoresL.join(" | "));
  ok(/^Source: USDA SR Legacy, FDC 172421, lentils, boiled\.$/.test(await text(len.locator(".ex-card-src"))), "DT155: the SR row on the card");
  const potato = page.getByRole("region", { name: "Potatoes, boiled", exact: true });
  ok((await potato.locator(".ex-score-val").allTextContents())[0] === "78, high", "DT155: potatoes, high GI");
  const apple = page.getByRole("region", { name: "Apple", exact: true });
  ok(/This portion is mostly sugars\./.test(await text(apple.locator(".ex-head > small").nth(3))) && /doesn't count as free/.test(await text(apple.locator(".ex-head > small").nth(2))), "DT155: the apple is mostly sugars, and fruit sugar isn't free sugar");
  ok(!/(GL|its GL)[^.]*\b(low|high)\b/.test(await text(page.locator(".explorer"))) || /GL is among the highest/.test(await text(page.locator(".explorer"))), "DT155: no GL band named, the paper gives none");
  await page.getByRole("radio", { name: "Most of the meal" }).click(); await page.waitForTimeout(200);
  const byMeal = await page.locator(".ex-card .ex-title > b").allTextContents();
  ok(byMeal[0] === "Pasta, cooked" && byMeal[7] === "Apple", "DT155: Most of the meal, pasta first: " + byMeal.join(", "));
  if (SHOTS) { await len.screenshot({ path: `${SHOTS}/carb-lentils.png` }); await page.getByRole("region", { name: "Pasta, cooked", exact: true }).screenshot({ path: `${SHOTS}/carb-pasta.png` }); }
  ok(/^Sources\. Carbs, fibre and sugars per 100 g: USDA FoodData Central, SR Legacy/.test(await text(page.locator(".ex-sources"))) && /Atkinson, Foster-Powell and Brand-Miller 2008/.test(await text(page.locator(".ex-sources"))), "DT155: the sources at the end");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
