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
  const searches = []; await page.route("**/api/search**", (route) => { searches.push(route.request().url()); const u = new URL(route.request().url()); const q = u.searchParams.get("q"); route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ products: /skyr/i.test(q) ? [{ code: "4008452021131", name: "Skyr Natur", brand: "Milbona", quantity: "500 g", kcal: 63, protein: 11 }, { code: "5000000000001", name: "Skyr Vanilla", brand: "Arla", quantity: "450 g", kcal: 78, protein: 9.3 }] : [] }) }); });
  await page.addInitScript((s) => { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-region", "belgrade"); }, seed);
  await page.goto("http://127.0.0.1:3188/"); await page.waitForTimeout(900);
  await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(400);
  ok(/Find a food/.test(await page.locator(".find-head").textContent()) && /in your foods/.test(await page.locator(".find-head").textContent()), "Find a food on top, with the count");
  ok(await page.locator(".add-strip").count() === 0 && /Add/.test(await page.locator(".find-head .add-toggle").textContent()), "Add sits in the header, closed");
  await page.getByRole("button", { name: "Add a food", exact: true }).click(); await page.waitForTimeout(150);
  const ways = await page.locator(".add-strip .ways .pill").allTextContents();
  await page.getByRole("button", { name: "Add a food", exact: true }).click(); await page.waitForTimeout(150);
  ok(ways.length === 2 && /Type/.test(ways[0]) && /Scan/.test(ways[1]), "Add a food: one row, Type, Scan: " + ways.join(" | "));
  ok(await page.getByRole("button", { name: /Several products|^Add$/ }).count() === 0 && await page.getByPlaceholder("or type a barcode").count() === 0, "the old chips and the loose barcode field are gone");
  // find, by what was typed: one letter, my foods by word start, nothing else, no database call
  const before = (await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.length));
  await page.getByLabel("Find a food").fill("s"); await page.waitForTimeout(700);
  ok((await page.locator(".rows .row").count()) >= 1 && (await page.locator(".outside").count()) === 0 && searches.length === 0, "one letter: my foods by word start, nothing from outside");
  // two letters: plus foods without a label, still no database
  await page.getByLabel("Find a food").fill("ti"); await page.waitForTimeout(700);
  ok(await page.getByLabel("Without a label").count() === 1 && searches.length === 0, "two letters: foods without a label join, no database yet");
  // three letters: my foods, foods without a label, and the database, in three labelled groups
  await page.getByLabel("Find a food").fill("skyr"); await page.waitForTimeout(900);
  ok((await page.locator(".rows .row").count()) >= 1 && /In your foods/.test(await page.locator("main").textContent()), "three letters: my foods first, labelled");
  ok(searches.length === 1 && await page.getByLabel("In the product database").locator(".row").count() === 2, "and the database, up to five, labelled");
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.length)) === before, "finding added nothing by itself");
  ok(/Can't find what you want\?/.test(await page.locator(".end-add").textContent()), "with results, the end card asks in plain words");
  // a food without a label goes straight in
  await page.getByLabel("Find a food").fill("tikvice"); await page.waitForTimeout(900);
  await page.getByLabel("Without a label").getByRole("button", { name: /Add to my foods/ }).first().click(); await page.waitForTimeout(400);
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.some((f) => /Tikvice/.test(f.name)))), "Add to my foods puts a food without a label in my foods");
  // a food without a label saved under the shop's name is found by any of its names, and a chip never hides it in silence
  await page.evaluate(() => localStorage.setItem("chefmealan-region", "munich"));
  await page.getByLabel("Find a food").fill("kupus"); await page.waitForTimeout(900);
  await page.getByLabel("Without a label").locator(".row").filter({ hasText: "Weißkohl" }).getByRole("button", { name: /Add to my foods/ }).click().catch(async () => {
    await page.getByLabel("Without a label").getByRole("button", { name: /Add to my foods/ }).first().click(); });
  await page.waitForTimeout(400);
  await page.getByLabel("Find a food").fill(""); await page.getByLabel("Find a food").fill("Kupus"); await page.waitForTimeout(900);
  ok((await page.locator(".rows .row").filter({ hasText: /Weißkohl|Kupus|Kiseli/ }).count()) >= 1, "a food saved under its Munich name is found by its Serbian one: " + (await page.locator(".rows .row b").allTextContents()).join(", "));
  await page.locator(".chip-below").click(); await page.waitForTimeout(200);
  ok(/more in your foods under/.test(await page.locator(".hidden-by-chip").textContent().catch(() => "")), "a chip that hides the match says so, with Show all");
  await page.locator(".hidden-by-chip").getByRole("button", { name: "Show all" }).click(); await page.waitForTimeout(200);
  ok((await page.locator(".rows .row").count()) >= 1, "Show all brings the match back");
  // Add all on the Without a label group puts every row in my foods at once
  await page.getByLabel("Find a food").fill("pa"); await page.waitForTimeout(700);
  const nRows = await page.getByLabel("Without a label").locator(".row").count();
  const beforeAll = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.length);
  await page.getByLabel("Without a label").getByRole("button", { name: "Add all" }).click(); await page.waitForTimeout(400);
  ok(nRows > 1 && (await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.length)) === beforeAll + nRows, "Add all adds every food without a label in the group: " + nRows);
  // a database product opens the sheet titled by the button
  await page.getByLabel("Find a food").fill("skyr"); await page.waitForTimeout(900);
  await page.getByLabel("In the product database").getByRole("button", { name: /Add to my foods/ }).first().click(); await page.waitForTimeout(800);
  ok(lookups.some((u) => /4008452021131/.test(u)), "a database product is fetched by its barcode");
  // nothing anywhere: says so, and names what Type keeps
  await page.getByRole("button", { name: "Close dialog" }).click().catch(() => {});
  await page.getByLabel("Find a food").fill("zzqx"); await page.waitForTimeout(900);
  ok(/Nothing found for "zzqx"/.test(await page.locator(".end-add").textContent()) && /"zzqx" comes with you/.test(await page.locator(".end-add").textContent()), "nothing anywhere: the end card says so, in plain words");
  await page.getByLabel("Find a food").fill("tikvice"); await page.waitForTimeout(300);
  // add: Type carries the search, the sheet is titled Type under Add a food, and a food without a label is suggested
  await page.getByRole("button", { name: "Add a food", exact: true }).click(); await page.waitForTimeout(150); await page.locator(".add-strip").getByRole("button", { name: /^Type/ }).click(); await page.waitForTimeout(400);
  const sheet = page.locator(".modal").last();
  ok(/Add a food/.test(await sheet.locator(".eyebrow-line").textContent()) && (await sheet.locator("h2").textContent()) === "Type", "the sheet is titled Type, under Add a food");
  ok(/From your search: tikvice/.test(await sheet.locator(".sheet-line").textContent()), "the search text rides along");
  ok((await sheet.locator("input").first().inputValue()) === "tikvice" && await sheet.locator(".ref-row").count() >= 1, "the name is filled and the food without a label is suggested");
  await sheet.getByRole("button", { name: "Close dialog" }).click(); await page.waitForTimeout(200);
  // digits: Type carries the number into its barcode field, and Look up asks the database from there
  await page.getByLabel("Find a food").fill("4311501670408"); await page.waitForTimeout(300);
  await page.waitForTimeout(700);
  ok(/the number comes with you/.test(await page.locator(".end-add").textContent().catch(() => "")), "digits found nowhere: the number comes with you");
  await page.getByRole("button", { name: "Add a food", exact: true }).click(); await page.waitForTimeout(150); await page.locator(".add-strip").getByRole("button", { name: /^Type/ }).click(); await page.waitForTimeout(300);
  const sheetB = page.locator(".modal").last();
  ok((await sheetB.locator("h2").textContent()) === "Type" && (await sheetB.locator(".barcode-row input").inputValue()) === "4311501670408", "the Type sheet holds the number in its barcode field");
  await sheetB.getByRole("button", { name: /^Look up$/ }).click(); await page.waitForTimeout(800);
  ok(lookups.some((u) => /4311501670408/.test(u)), "Look up asks the database");
  // the camera header says Scan under Add a food
  await page.getByRole("button", { name: "Close dialog" }).click().catch(() => {}); await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Add a food", exact: true }).click(); await page.waitForTimeout(150); await page.locator(".add-strip").getByRole("button", { name: /^Scan/ }).click(); await page.waitForTimeout(1500);
  ok(await page.getByLabel("Add a food: Scan").count() === 1, "the camera header reads Add a food, Scan");
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
