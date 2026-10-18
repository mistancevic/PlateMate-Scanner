// JOURNEY INVARIANT (Milan, 18 October 2026, 14:17 to 14:36, story R3 on canvas board RS2): oil is counted, but never more
// than the food takes up. A recipe that fries keeps its whole pot of oil listed, as it needs it; the numbers count what the
// fried food takes up, 15% of its weight, and every place that shows it says it is an estimate: the read, the plate, the
// recipe page. A splash of oil in a pan is counted in full, with no note. Never rewrite these lines to fit a change.
// Changed by story R3, the fix (Milan 15:12 and 15:15, board RS10): the recipe follows the original, so the read card and the
// recipe page show the pot as the amount, and the counted oil as the small line; the steps are in cook-with-the-pot.cjs.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const it = (name, written, grams, role, calories, protein, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, optional: false, ...(part ? { part } : {}) });
const fritters = { url: "https://sallysbakingaddiction.com/homemade-apple-fritters/", recipe: { title: "Homemade apple fritters", source: "Sally's Baking Addiction", servings: 12, servingsUnit: "fritters", servingsHow: "recipe", stated: null,
  steps: ["Make the dough and let it rise.", "Heat the oil to 350°F (177°C).", "Fry 2 to 3 fritters at a time for 2 minutes a side.", "Dip each fritter in the glaze."], items: [
  it("Whole milk", "1 cup (240g)", 240, "dairy", 61, 3.2, "Dough"), it("Unsalted butter", "6 Tablespoons (85g)", 85, "fat", 717, 0.9, "Dough"), it("All-purpose flour", "4 1/2 cups (563g)", 563, "base", 364, 10, "Dough"),
  it("Apples, peeled and diced", "3 cups (360g)", 360, "fruit", 52, 0.3, "Filling"), it("Brown sugar", "1/2 cup (100g)", 100, "sweet", 380, 0, "Filling"),
  it("All-purpose flour", "1/4 cup (31g)", 31, "base", 364, 10, "For shaping and frying"), it("Vegetable oil", "1 to 2 quarts (1 to 1.9 L)", 1380, "fat", 884, 0, "For shaping and frying"),
  it("Confectioners' sugar", "3 cups (360g)", 360, "sweet", 389, 0, "Glaze"), it("Milk", "6 Tablespoons (90g)", 90, "dairy", 61, 3.2, "Glaze")] } };
const pan = { url: "https://example.com/pan-chicken/", recipe: { title: "Pan chicken", source: "Example", servings: 1, servingsUnit: "plates", servingsHow: "recipe", stated: null, steps: ["Fry the chicken in the oil, 5 minutes a side."], items: [
  it("Chicken breast, raw", "200g", 200, "protein", 120, 22.5), it("Olive oil", "a splash", 5, "fat", 884, 0)] } };
// the fried food: everything but the oil and the glaze, 1,379 g; 15% of it is 207 g
const CAP = Math.round((240 + 85 + 563 + 360 + 100 + 31) * 0.15);
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3224", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
  let next = fritters;
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(next) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const read = async (x) => { next = x; await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(500);
    await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
    await page.getByLabel("Link to a recipe").fill(x.url); await page.getByRole("button", { name: /^Read/ }).first().click(); await page.waitForTimeout(1200); };
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3224/"); await page.waitForTimeout(900);
    await read(fritters);
    const oilRow = page.locator(".in-card .row").filter({ hasText: "Vegetable oil" });
    const oilText = (await oilRow.textContent()).replace(/\s+/g, " ");
    ok(new RegExp(`Counted: ${CAP} g`).test(oilText) && /1,380 g$/.test(oilText.trim()), `the read shows the 1,380 g pot and counts ${CAP} g of oil: ` + oilText);
    ok(/1 to 2 quarts .* on the recipe/.test(oilText) && /for frying/.test(oilText) && /Counted: \d+ g, taken up in frying, an estimate/.test(oilText), "the row keeps the recipe's pot, says for frying, and that the amount is an estimate");
    ok(/an estimate, 15% of the fried food/.test(await page.locator(".in-fry").textContent()), "a line under the foods says the oil counted is an estimate, and where it comes from");
    const one = Number((await page.locator(".in-card .in-per").textContent()).match(/([\d,]+) kcal/)[1].replace(",", ""));
    ok(one > 400 && one < 750, "one fritter is no longer 1,486 kcal: " + one);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1200);
    const plateOil = page.locator(".plate-card .row").filter({ hasText: "Vegetable oil" });
    ok(/An estimate: taken up in frying/.test(await plateOil.textContent()), "the plate says the oil is an estimate, first");
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
    await page.locator(".recipe-tile").filter({ hasText: "Homemade apple fritters" }).click(); await page.waitForTimeout(600);
    const rq = (await page.locator(".rq-food").filter({ hasText: "Vegetable oil" }).textContent()).replace(/\s+/g, " ");
    ok(new RegExp(`1 to 2 quarts \\(1 to 1\\.9 L\\), for frying\\. Counted: ${CAP} g, taken up in frying, an estimate\\.`).test(rq) && /1,380 g/.test(rq), "the recipe page shows the pot as written, and counts what is taken up: " + rq);
    // a splash in a pan: counted in full, no note
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(400);
    const empty = page.getByRole("button", { name: /Empty plate/ }); if (await empty.count()) { await empty.click(); await page.waitForTimeout(200); const again = page.getByRole("button", { name: /Tap again/ }); if (await again.count()) await again.click(); await page.waitForTimeout(400); }
    await read(pan);
    const panOil = (await page.locator(".in-card .row").filter({ hasText: "Olive oil" }).textContent()).replace(/\s+/g, " ");
    ok(/5 g/.test(panOil) && !/for frying|estimate/.test(panOil) && (await page.locator(".in-fry").count()) === 0, "a splash in a pan is counted in full, with no note: " + panOil);
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
