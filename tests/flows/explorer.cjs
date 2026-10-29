// DT151 (0.2.133, canvas Page 2, board Stories103 version 11; Coach Milan 29 October 09:41 to 12:04 "Build it"): Explorer, Not
// all proteins are equal, in the Menu below Foods. Each food is one portion against one meal: the meal's protein from the day
// (120 g a day, three meals: 40 g a lunch), Closes N %, muscle building and repair (about 10 g of essential amino acids, 2.5 g
// of them leucine), the family of nine in grams with leucine in bold and its lowest marked only when it is close, PDCAAS and
// DIAAS with their sources, How to use it, the source of the numbers; Worthy Numbers at the end, counted as Explorer.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3329", U = `http://127.0.0.1:${PORT}`;
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
  // the row below Foods
  const rows = (await page.locator(".menu-list .menu-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  const fi = rows.findIndex((r) => /^Foods/.test(r));
  ok(fi >= 0 && rows[fi + 1] === "ExplorerNot all proteins are equal", "DT151: Explorer, right below Foods: " + rows[fi + 1]);
  await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(600);
  ok(await text(page.locator(".menu-title")) === "Explorer" && await text(page.locator(".ex-h")) === "Not all proteins are equal", "DT151: the page, Not all proteins are equal");
  // DT154 (0.2.135): the families at the top, Protein first, Carbs next
  const fams = (await page.locator(".ex-families button").allTextContents()).join();
  // Changed by story DT155 (0.2.136, board Stories107): Carbs is a family of its own
  ok(fams === "Protein,Fats,Carbs" && await text(page.locator(".ex-families .choice.on")) === "Protein", "DT154, DT155: Protein, Fats, Carbs, Protein first: " + fams);
  // Changed by Milan 12:32 and 12:33: protein is the family, the amino acids its members
  ok(/^Protein is the family\. Its members are the amino acids: leucine, lysine, methionine/.test(await text(page.locator(".ex-intro"))), "DT151: protein the family, the amino acids its members");
  // the meal: the next by the clock, its protein from the day
  const meals = await page.locator(".ex-chips[aria-label=\"Which meal\"]").locator("button").allTextContents();
  ok(meals.join() === "Breakfast,Lunch,Dinner" && await text(page.locator(".ex-chips[aria-label=\"Which meal\"]").locator(".choice.on")) === "Lunch", "DT151: the person's meals, the next one picked: " + meals.join());
  const mealLine = await text(page.locator(".ex-meal"));
  const m = mealLine.match(/^Your lunch: about (\d+) g of protein, from your (\d+) g a day\.$/);
  ok(m && Number(m[1]) === Math.round(Number(m[2]) / 3), "DT151: the lunch's protein is a third of the day: " + mealLine);
  const mealP = Number(m?.[1] ?? 40);
  // the cards, by PD
  const names = await page.locator(".ex-card .ex-title > b").allTextContents();
  ok(names.length === 8 && names[0] === "Whey protein powder" && names[7] === "Oats, dry", "DT151: eight foods by PD, whey first, oats last: " + names.join(", "));
  const whey = page.locator(".ex-card").first();
  const heads = await whey.locator(".ex-head > b").allTextContents();
  ok(heads.join("|") === "One portion|Protein for your lunch|Muscle building and repair|The family members: nine essential amino acids|Quality|How to use it", "DT151: six sections, each a heading: " + heads.join(" | "));
  ok((await whey.locator(".ex-head > small").count()) === 6, "DT151: every section says its goal under the heading");
  const closes = Math.round(100 * 27 / mealP);
  ok(new RegExp(`^Your lunch needs about ${mealP} g of protein\\. This portion closes ${closes} % of it\\.$`).test(await text(whey.locator(".ex-head > small").nth(1))), "DT151: the portion against the lunch, " + closes + " %");
  const rowsW = (await whey.locator(".ex-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(rowsW.includes(`Protein27 of ${mealP} g`) && rowsW.includes("Essential amino acids14.3 of 10 g") && rowsW.includes("of them, leucine3.3 of 2.5 g"), "DT151: protein, essential amino acids and leucine in grams against the meal");
  ok(/A meal switches on muscle protein synthesis, how the body builds and repairs muscle, .* This portion brings both\./.test(await text(whey.locator(".ex-head > small").nth(2))), "DT151: muscle protein synthesis, named once, explained");
  const fam = whey.locator(".ex-row").filter({ hasText: /^(Histidine|Isoleucine|Leucine|Lysine|Methionine|Phenylalanine|Threonine|Tryptophan|Valine)/ });
  ok(await fam.count() === 9 && await whey.locator(".ex-row.ex-strong", { hasText: /^Leucine3\.30 g$/ }).count() === 1, "DT151: the nine in grams, leucine in bold");
  ok(await whey.locator(".ex-low").count() === 0 && /each with room to spare/.test(await text(whey.locator(".ex-head > small").nth(3))), "DT151: whey covers all nine with room to spare");
  const scores = (await whey.locator(".ex-score").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(scores.length === 2 && /^PDCAAS1\.00The older score/.test(scores[0]) && /Hertzler 2020, adults$/.test(scores[0]) && /^DIAAS0\.90The newer score.*Hertzler 2020$/.test(scores[1]), "DT151: PDCAAS and DIAAS, one below another, from the one paper read in full (Milan 12:36)");
  ok(/Scores vary by study: whey from 0\.85 to 1\.09 in the papers we read, so we take them from one\./.test(await text(whey.locator(".ex-head > small").nth(4))), "DT151: Quality says the scores vary by study");
  ok(/^Source: a typical whey label/.test(await text(whey.locator(".ex-card-src"))), "DT151: the source of the numbers on the card");
  // lentils: its lowest; salmon: no score yet
  const len = page.locator(".ex-card", { hasText: "Lentils, boiled" });
  ok(await len.locator(".ex-low").count() === 1 && /^Methionine \+ cysteine · its lowest/.test(await text(len.locator(".ex-low"))), "DT151: lentils, its lowest marked");
  ok(/its lowest, methionine \+ cysteine, falls just short of the need per gram/.test(await text(len.locator(".ex-head > small").nth(3))), "DT154: on the SR row lentils fall just short, and the card says so");
  ok(/^Source: USDA SR Legacy, FDC 171287, egg, whole, raw\.$/.test(await text(page.locator(".ex-card", { hasText: "Egg" }).locator(".ex-card-src"))), "DT154: the egg from the SR row it names");
  const sal = page.locator(".ex-card", { hasText: "Salmon" });
  ok((await sal.locator(".ex-score-val").allTextContents()).join() === "none yet,none yet" && /No score we could check in a paper yet/.test(await text(sal)), "DT151: salmon says it has no score yet");
  ok((await page.locator(".ex-card", { hasText: "Chicken breast" }).locator(".ex-score-val").allTextContents()).join() === "none yet,none yet", "DT151: chicken too, until a paper we can read");
  if (SHOTS) { await whey.screenshot({ path: `${SHOTS}/ex-whey.png` }); await len.screenshot({ path: `${SHOTS}/ex-lentils.png` }); }
  // another meal, another sort
  await page.locator(".ex-chips[aria-label=\"Which meal\"]").getByRole("radio", { name: "Breakfast" }).click(); await page.waitForTimeout(200);
  ok(/^Your breakfast: about \d+ g of protein/.test(await text(page.locator(".ex-meal"))) && /^Protein for your breakfast$/i.test(await text(whey.locator(".ex-head > b").nth(1))), "DT151: Breakfast changes the meal on every card");
  await page.getByRole("radio", { name: "Most of the meal" }).click(); await page.waitForTimeout(200);
  const byMeal = await page.locator(".ex-card .ex-title > b").allTextContents();
  ok(byMeal.slice(0, 4).join() === "Chicken breast,Salmon,Soybeans\, boiled,Whey protein powder" && byMeal[7] === "Oats, dry", "DT151: Most of the meal, chicken first: " + byMeal.join(", "));
  // the book
  const book = page.locator(".ex-book");
  ok(await book.getByRole("link", { name: "Read the book" }).getAttribute("href") === "/worthy-numbers?from=ex" && /The why behind these numbers/.test(await text(book)), "DT151: Worthy Numbers at the end, counted as Explorer");
  ok(/^Sources\. Amino acids, protein and energy: USDA FoodData Central/.test(await text(page.locator(".ex-sources"))), "DT151: every source named at the end");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/ex-full.png`, fullPage: true });
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
