// JOURNEY INVARIANT (DT82, Milan 23 October 2026, 19:37 to 20:00, after Marko's call): what you scan on the Plate lands
// on the plate, and stays in My foods, as decided in 0.2.25 (RP5); a code for a food you already have puts that food on the
// plate. A food the pack sells as one piece goes on as one: 1 pot, 1 can, never 0.9 cans. A can in oil counts as its
// drained weight, with the label's values per 100 g drained; the oil you pour off sits with the can's row, outside the
// numbers until set: None, A spoon, All. It goes when the can goes, and Fit never moves it. Never rewrite these lines to
// fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const swipe = require("./swipe.cjs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = [];
seed.foods.push({ id: "f-pudding", name: "Protein pudding", brand: "Ehrmann", barcode: "4006040000001", basis: "100g", source: "label", notes: "", reviewedAt: "2026-10-01T00:00:00.000Z", readyToEat: true, calories: 75, protein: 10, fats: 1.5, carbs: 5, fiber: 0, serving: { grams: 200, name: "pot" }, icon: "🍮" });
const tuna = { success: true, product_name: "Thunfisch in Olivenöl", brand: "Rio Mare", basis: "100g", calories: 190, protein: 26, fats: 9.5, carbs: 0, fiber: 0, notes: "", error_reason: "", front_image: 1, serving: { grams: 160, name: "can" }, pack: { net: 160, drained: 120, liquid: "olive oil", per: "drained" }, table: [] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3246", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"] })).newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.route("**/api/scan", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(tuna) }));
  await page.route("**/api/product/**", (r) => r.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not in the database" }) }));
  await page.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); sessionStorage.setItem("seeded", "1"); } localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-camera-auto", "manual"); }, seed);
  const items = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.map((i) => ({ name: i.food.name, grams: i.grams, locked: i.locked, from: i.from ?? null, id: i.id })));
  const rows = () => page.locator(".rows").first().textContent();
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3246/"); await page.waitForTimeout(800);
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(500);

    // + Add on a food the pack sells as one piece
    await page.getByLabel("Search all my foods").fill("pudding"); await page.waitForTimeout(300);
    await page.locator(".row-food", { hasText: "Protein pudding" }).getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(600);
    let it = await items();
    ok(it.length === 1 && it[0].grams === 200, "+ Add puts one pot on the plate, 200 g: " + JSON.stringify(it));
    ok(/1 pot/.test(await rows()), "the row says 1 pot");
    await page.getByLabel("Search all my foods").fill(""); await swipe(page, page.locator(".swipe-fg", { hasText: "Protein pudding" }).locator(".thumb"), "right");
    ok((await items()).length === 0, "a swipe takes it off");

    // a code for a food you have, scanned on the Plate: on the plate, not off to My foods
    await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /^Barcode$/ }).click(); await page.waitForTimeout(400);
    await page.locator('input[aria-label^="Type t"]').fill("4006040000001"); await page.keyboard.press("Enter"); await page.waitForTimeout(1200);
    it = await items();
    ok(it.length === 1 && it[0].name === "Protein pudding" && it[0].grams === 200, "a code you have puts the food on the plate, one pot: " + JSON.stringify(it));
    ok(await page.locator(".readout").count() === 1, "the Plate stays open");
    await swipe(page, page.locator(".swipe-fg", { hasText: "Protein pudding" }).locator(".thumb"), "right");

    // a new can, its label read on the Plate
    await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /^Label$/ }).click(); await page.waitForTimeout(400);
    await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(600);
    await page.getByRole("button", { name: /Analyze 1 photo/ }).click(); await page.waitForTimeout(1500);
    const line = (await page.locator(".pack-line").textContent()) || "";
    ok(/In olive oil: 160 g, 120 g drained\. The values are per 100 g drained, so one can counts as 120 g\./.test(line), "the label check says what one can counts as: " + line);
    ok(await page.getByLabel("Serving grams").inputValue() === "120", "the serving is the drained weight, 120 g");
    await page.getByLabel(/I checked the values/).check();
    await page.getByRole("button", { name: /Confirm & save food/ }).click(); await page.waitForTimeout(1200);
    it = await items();
    ok(it.length === 1 && /Thunfisch/.test(it[0].name) && it[0].grams === 120, "Scan on the Plate puts the can on the plate, 120 g drained: " + JSON.stringify(it));
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.some((f) => /Thunfisch/.test(f.name))), "and keeps it in My foods");
    ok(/1 can/.test(await rows()) && !/0\.9/.test(await rows()), "the row says 1 can");
    const kcal0 = await page.evaluate(() => Number(document.querySelector(".readout").textContent.match(/([\d,]+)\s*kcal\s*·/)[1].replace(",", "")));
    ok(kcal0 === 228, "the numbers count 120 g of tuna: " + kcal0 + " kcal");

    // the oil from the can
    const oil = page.getByRole("group", { name: "Olive oil from the can" });
    ok(await oil.count() === 1 && /Up to 40 g in the can\. Not in the numbers\./.test(await oil.textContent()), "the oil sits with the can, outside the numbers");
    ok(await oil.getByRole("button", { name: "None" }).getAttribute("aria-pressed") === "true", "None to start: most people drain the can");
    await oil.getByRole("button", { name: "A spoon, 10 g" }).click(); await page.waitForTimeout(400);
    it = await items();
    const can = it.find((x) => /Thunfisch/.test(x.name)), o = it.find((x) => x.from);
    ok(o && o.grams === 10 && o.locked && o.from === can.id, "A spoon puts 10 g of olive oil on, held with the can: " + JSON.stringify(o));
    ok(/10\s*g\s*·\s*88\s*kcal, in the numbers/.test(await oil.textContent()), "the line says what it adds");
    ok(await page.locator(".swipe-fg", { hasText: "from the can" }).count() === 0, "the oil has no row of its own");
    await oil.getByRole("button", { name: "All, 40 g" }).click(); await page.waitForTimeout(400);
    ok((await items()).find((x) => x.from).grams === 40, "All is the 40 g in the can");
    await oil.getByRole("button", { name: "None" }).click(); await page.waitForTimeout(400);
    ok(!(await items()).some((x) => x.from), "None takes it off");

    // the oil goes when the can goes
    await oil.getByRole("button", { name: "All, 40 g" }).click(); await page.waitForTimeout(400);
    await swipe(page, page.locator(".swipe-fg", { hasText: "Thunfisch" }).locator(".row-text small").first(), "right");
    it = await items();
    ok(it.length === 0, "taking the can off takes its oil: " + JSON.stringify(it.map((x) => x.name)));

    // Fit never moves the oil
    await page.getByLabel("Search all my foods").fill("Thunfisch"); await page.waitForTimeout(300);
    await page.locator(".row-food", { hasText: "Thunfisch" }).getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(500);
    ok((await items())[0]?.grams === 120, "+ Add on the can is one can too, 120 g");
    await oil.getByRole("button", { name: "All, 40 g" }).click(); await page.waitForTimeout(400);
    await page.getByLabel("Search all my foods").fill("rice"); await page.waitForTimeout(300);
    await page.locator(".row-food", { hasText: "Rice, cooked" }).getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(500);
    await page.getByRole("button", { name: /^(Fit to my target|Make it an? \w+)$/ }).first().click(); await page.waitForTimeout(1200);
    it = await items();
    ok(it.find((x) => x.from)?.grams === 40 && it.find((x) => /Thunfisch/.test(x.name)).grams % 120 === 0, "Fit moves the can in whole cans and leaves the oil at 40 g: " + JSON.stringify(it.map((x) => [x.name, x.grams])));
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
