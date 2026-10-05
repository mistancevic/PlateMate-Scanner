// JOURNEY INVARIANT (Milan, 5 October 2026): on Foods, finding and adding are two things. Find a food searches only my foods,
// letters or a saved barcode, and never adds. Add a food is one row, Type, Barcode, Scan; what was typed in Find rides along.
// The sheet's title is the word tapped, under a small ADD A FOOD line.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3188", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const lookups = []; await page.route("**/api/product/**", (route) => { lookups.push(route.request().url()); route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not in the database" }) }); });
  await page.addInitScript((s) => { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-region", "belgrade"); }, seed);
  await page.goto("http://127.0.0.1:3188/"); await page.waitForTimeout(900);
  await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(400);
  ok(/Find a food/.test(await page.locator(".find-head").textContent()) && /in your foods/.test(await page.locator(".find-head").textContent()), "Find a food on top, with the count");
  const ways = await page.locator(".add-strip .ways .pill").allTextContents();
  ok(ways.length === 2 && /Type/.test(ways[0]) && /Scan/.test(ways[1]), "Add a food: one row, Type, Scan: " + ways.join(" | "));
  ok(await page.getByRole("button", { name: /Several products|^Add$/ }).count() === 0 && await page.getByPlaceholder("or type a barcode").count() === 0, "the old chips and the loose barcode field are gone");
  // find: letters match my foods only, and never add
  await page.getByLabel("Find a food").fill("skyr"); await page.waitForTimeout(300);
  ok((await page.locator(".rows .row").count()) >= 1 && (await page.locator(".nolabel-row").count()) === 0, "letters find my foods, nothing from outside");
  const before = (await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.length));
  await page.getByLabel("Find a food").fill("tikvice"); await page.waitForTimeout(300);
  ok(await page.locator(".rows .row").count() === 0 && /Not in your foods/.test(await page.locator(".not-found").textContent()) && /Type keeps "tikvice"/.test(await page.locator(".not-found").textContent()), "nothing found says so, and names what Type keeps");
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.length)) === before, "finding added nothing");
  // add: Type carries the search, the sheet is titled Type under Add a food, and a food without a label is suggested
  await page.locator(".add-strip").getByRole("button", { name: /^Type/ }).click(); await page.waitForTimeout(400);
  const sheet = page.locator(".modal").last();
  ok(/Add a food/.test(await sheet.locator(".eyebrow-line").textContent()) && (await sheet.locator("h2").textContent()) === "Type", "the sheet is titled Type, under Add a food");
  ok(/From your search: tikvice/.test(await sheet.locator(".sheet-line").textContent()), "the search text rides along");
  ok((await sheet.locator("input").first().inputValue()) === "tikvice" && await sheet.locator(".ref-row").count() >= 1, "the name is filled and the food without a label is suggested");
  await sheet.getByRole("button", { name: "Close dialog" }).click(); await page.waitForTimeout(200);
  // digits: Type carries the number into its barcode field, and Look up asks the database from there
  await page.getByLabel("Find a food").fill("4311501670408"); await page.waitForTimeout(300);
  ok(/Type keeps the number/.test(await page.locator(".not-found").textContent().catch(() => "")), "digits not in my foods: Type keeps the number");
  await page.locator(".add-strip").getByRole("button", { name: /^Type/ }).click(); await page.waitForTimeout(300);
  const sheetB = page.locator(".modal").last();
  ok((await sheetB.locator("h2").textContent()) === "Type" && (await sheetB.locator(".barcode-row input").inputValue()) === "4311501670408", "the Type sheet holds the number in its barcode field");
  await sheetB.getByRole("button", { name: /^Look up$/ }).click(); await page.waitForTimeout(800);
  ok(lookups.length === 1 && /4311501670408/.test(lookups[0]), "Look up asks the database");
  // the camera header says Scan under Add a food
  await page.getByRole("button", { name: "Close dialog" }).click().catch(() => {}); await page.waitForTimeout(200);
  await page.locator(".add-strip").getByRole("button", { name: /^Scan/ }).click(); await page.waitForTimeout(1500);
  ok(await page.getByLabel("Add a food: Scan").count() === 1, "the camera header reads Add a food, Scan");
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
