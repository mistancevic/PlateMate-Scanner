// DT154 (0.2.135, canvas Page 2, board Stories106; Coach Milan 29 October 14:47 to 15:04 "Go"): Explorer, Fats, the same
// template as Protein. The family chip Fats; fat the family, its members saturated, monounsaturated, polyunsaturated, omega-6
// and omega-3; one portion against one meal (the meal's share of the day's fat and energy); saturated fat against the meal's
// share of 10 % of energy, red when a portion goes over; EPA and DHA against 250 mg a day; the members in grams, omega-3 in bold;
// two ratios; the USDA SR row on every card; the sources at the end.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3331", U = `http://127.0.0.1:${PORT}`;
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
  await page.locator(".ex-families").getByRole("radio", { name: "Fats" }).click(); await page.waitForTimeout(300);
  ok(await text(page.locator(".ex-h")) === "Not all fats are equal" && /^Fat is the family\. Its members are saturated, monounsaturated and polyunsaturated fats/.test(await text(page.locator(".ex-intro"))), "DT154: Fats, fat the family");
  const goals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).goals);
  const dayFat = goals.fats ?? Math.round(goals.calories * 0.3 / 9), mealFat = Math.round(dayFat / 3), mealKcal = Math.round(goals.calories / 3);
  const mealLine = await text(page.locator(".ex-meal"));
  ok(mealLine === `Your lunch: about ${mealFat} g of fat and ${mealKcal.toLocaleString("en-GB")} kcal, from your ${dayFat} g and ${goals.calories.toLocaleString("en-GB")} kcal a day.`, "DT154: the lunch's share of the day's fat and energy: " + mealLine);
  const names = await page.locator(".ex-card .ex-title > b").allTextContents();
  ok(names.length === 8 && names[0] === "Almonds" && names[7] === "Cheddar", "DT154: by fat quality, almonds first, cheddar last: " + names.join(", "));
  const olive = page.getByRole("region", { name: "Olive oil", exact: true });
  const heads = await olive.locator(".ex-head > b").allTextContents();
  ok(heads.join("|") === "One portion|Fat for your lunch|Heart health|The family members|Quality|What a label could say|How to use it" && await olive.locator(".ex-head > small").count() === 7, "DT154: seven sections (DT156: What a label could say), each with its goal: " + heads.join(" | "));
  // DT156 (0.3.0, board Stories108): what a label could say, by EU rules
  ok(new RegExp("^By EU rules, a food may only claim these when it meets them per 100 g\\. This one could say: High\ unsaturated\ fat\\.$").test(await text(olive.locator(".ex-head > small").nth(5))) && /^Regulation \(EC\) No 1924\/2006, Annex, as the European Commission lists it\.$/.test(await text(olive.locator(".ex-claim-src"))), "DT156: the claims it could carry, and the regulation: High unsaturated fat");
  const satMeal = Math.round(mealKcal * 0.1 / 9 * 10) / 10;
  const rowsO = (await olive.locator(".ex-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(rowsO.includes(`Fat14 of ${mealFat} g`) && rowsO.includes(`Saturated fat1.9 of ${satMeal} g`) && rowsO.includes("Omega-3, EPA + DHA0 of 250 mg") && rowsO.includes("Transnot reported"), "DT154: fat, saturated against the meal's share, EPA and DHA against the day; trans not reported for olive oil");
  ok(/This portion is mostly monounsaturated\./.test(await text(olive.locator(".ex-head > small").nth(3))) && await olive.locator(".ex-row.ex-strong", { hasText: "of them, omega-3" }).count() === 1 && await olive.locator(".ex-row.ex-under").count() === 2, "DT154: mostly monounsaturated; omega-6 and omega-3 under polyunsaturated, omega-3 in bold");
  const salmon = page.getByRole("region", { name: "Salmon", exact: true });
  ok(await salmon.locator(".ex-row.ex-ok", { hasText: "Omega-3, EPA + DHA2,940 of 250 mg" }).count() === 1 && /covers the omega-3/.test(await text(salmon.locator(".ex-head > small").nth(2))) && /depends on the feed/.test(await text(salmon)), "DT154: salmon covers the omega-3, and says the feed matters");
  ok((await page.getByRole("region", { name: "Almonds", exact: true }).locator(".ex-score-val").allTextContents())[1] === "almost no omega-3", "DT154: almonds, almost no omega-3");
  const cheddar = page.getByRole("region", { name: "Cheddar", exact: true });
  ok(/This portion is mostly saturated\./.test(await text(cheddar.locator(".ex-head > small").nth(3))) && (await cheddar.locator(".ex-score-val").allTextContents())[0] === "0.5 : 1", "DT154: cheddar mostly saturated, 0.5 to 1");
  ok(/^Source: USDA SR Legacy, FDC 173414, cheese, cheddar\.$/.test(await text(cheddar.locator(".ex-card-src"))), "DT154: the SR row on the card");
  ok(/This one could claim none of them\./.test(await text(cheddar.locator(".ex-head > small").nth(5))) && await cheddar.locator(".ex-claim-ok").count() === 0, "DT156: cheddar could claim none of them");
  const wal = page.getByRole("region", { name: "Walnuts", exact: true });
  ok((await wal.locator(".ex-claim-ok b:first-child").allTextContents()).join() === "High unsaturated fat,Source of omega-3,High omega-3", "DT156: walnuts could say high omega-3");
  // another meal, the other order (a portion over its saturated share turns red: the unit test explorerFats.test.ts)
  await page.locator(".ex-chips[aria-label=\"Which meal\"]").getByRole("radio").first().click(); await page.waitForTimeout(200);
  await page.getByRole("radio", { name: "Most of the meal" }).click(); await page.waitForTimeout(200);
  const byMeal = await page.locator(".ex-card .ex-title > b").allTextContents();
  ok(byMeal[0] === "Salmon" && byMeal[1] === "Walnuts", "DT154: Most of the meal, salmon then walnuts: " + byMeal.join(", "));
  if (SHOTS) { await olive.screenshot({ path: `${SHOTS}/fat-olive.png` }); await salmon.screenshot({ path: `${SHOTS}/fat-salmon.png` }); }
  ok(/^Sources\. Fats per 100 g: USDA FoodData Central, SR Legacy/.test(await text(page.locator(".ex-sources"))) && /WHO 2023/.test(await text(page.locator(".ex-sources"))) && /EFSA/.test(await text(page.locator(".ex-sources"))), "DT154: the sources at the end");
  await page.locator(".ex-families").getByRole("radio", { name: "Protein" }).click(); await page.waitForTimeout(200);
  ok(await text(page.locator(".ex-h")) === "Not all proteins are equal", "DT154: back to Protein");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
