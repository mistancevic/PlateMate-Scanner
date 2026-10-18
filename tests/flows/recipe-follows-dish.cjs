// JOURNEY INVARIANT (Milan, 18 October 2026, 10:31 to 10:59, story R9 on canvas boards RS4 and RS5): what you add follows
// the dish. The whole dish decides, never one layer: a dish is sweet or savoury by the foods that define it, basics fit
// both, and a food the dish's taste rejects is not offered, with one line saying why. The food goes into the part you add
// it to. Chef Mealan's own offers follow the rule on any plate; on a plate of your own, what you search for and add stays
// yours. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const it = (name, written, grams, role, calories, protein, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, optional: false, ...(part ? { part } : {}) });
const fritters = { url: "https://sallysbakingaddiction.com/homemade-apple-fritters/", recipe: { title: "Homemade apple fritters", source: "Sally's Baking Addiction", servings: 12, servingsUnit: "fritters", servingsHow: "recipe", stated: null, steps: ["Make the dough.", "Make the filling.", "Fry.", "Glaze."], items: [
  it("Whole milk", "1 cup (240g)", 240, "dairy", 61, 3.2, "Dough"), it("Unsalted butter", "6 Tablespoons (85g)", 85, "fat", 717, 0.9, "Dough"), it("All-purpose flour", "4 1/2 cups (563g)", 563, "base", 364, 10, "Dough"),
  it("Apples, peeled and diced", "3 cups (360g)", 360, "fruit", 52, 0.3, "Filling"), it("Brown sugar", "1/2 cup (100g)", 100, "sweet", 380, 0, "Filling"),
  it("Ground cinnamon", "1 teaspoon (3g)", 3, "other", 247, 4, "For shaping and frying"),
  it("Confectioners' sugar", "3 cups (360g)", 360, "sweet", 389, 0, "Glaze"), it("Milk", "6 Tablespoons (90g)", 90, "dairy", 61, 3.2, "Glaze")] } };
//
const oneList = { url: "https://example.com/bowl/", recipe: { title: "Skyr bowl", source: "Example", servings: 1, servingsUnit: "bowls", servingsHow: "recipe", stated: null, steps: [], items: [
  it("Skyr, natural", "250 g", 250, "dairy", 63, 11), it("Oats", "40 g", 40, "base", 372, 13)] } };
const tacos = { url: "https://example.com/chicken-tacos/", recipe: { title: "Chicken tacos", source: "Example Kitchen", servings: 4, servingsUnit: "tacos", servingsHow: "recipe", stated: null, steps: [], items: [
  it("Chicken breast, raw", "500g", 500, "protein", 120, 22.5, "Filling"), it("Olive oil", "1 tbsp (14g)", 14, "fat", 884, 0, "Filling"),
  it("Tomatoes", "300g", 300, "veg", 18, 0.9, "Salsa"), it("Red onion", "100g", 100, "veg", 40, 1.1, "Salsa"), it("Corn tortillas", "200g", 200, "base", 218, 5.7, "To serve")] } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3221", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async () => {
    const page = await b.newPage({ viewport: { width: 390, height: 900 } }); page.on("pageerror", (e) => errs.push(e.message));
    // the clock of the evening this was written (19 October 2026, 00:20: after midnight the plate is sized for breakfast, the page
    // grows, and a row scrolled into view sits under the sticky bar, so the swipe missed it; the journey is unchanged)
    await page.clock.setFixedTime(new Date("2026-10-18T19:00:00"));
    await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
    page.next = fritters;
    await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(page.next) }));
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3221/"); await page.waitForTimeout(900);
    return page;
  };
  const read = async (page, x) => { page.next = x; await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(500);
    await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
    await page.getByLabel("Link to a recipe").fill(x.url); await page.getByRole("button", { name: /^Read/ }).first().click(); await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1200); };
  const search = async (page, q) => { await page.getByLabel("Search all my foods").fill(q); await page.waitForTimeout(400); };
  const offered = (page, name) => page.locator(".row-food").filter({ hasText: name }).count();
  const line = (page) => page.locator(".held-back").textContent().catch(() => "");
  try {
    // the fritters: Glaze emptied, + Add a food to Glaze, chicken typed
    let page = await open(); await read(page, fritters);
    const glaze = () => page.locator(".plate-card .pt-group").filter({ has: page.locator('[aria-label="Part: Glaze"]') });
    for (let k = 0; k < 2; k++) { const row = glaze().locator(".swipe-fg").first(); await row.scrollIntoViewIfNeeded(); const th = await row.locator(".thumb").first().boundingBox();
      await page.mouse.move(th.x + th.width / 2, th.y + th.height / 2); await page.mouse.down();
      for (let s = 1; s <= 10; s++) await page.mouse.move(th.x + th.width / 2 + s * 15, th.y + th.height / 2);
      await page.mouse.up(); await page.waitForTimeout(500); }
    await glaze().getByRole("button", { name: "+ Add a food to Glaze" }).click(); await page.waitForTimeout(400);
    await search(page, "chicken");
    ok(await offered(page, "Chicken breast") === 0, "the dessert doesn't offer chicken, though it is in your foods");
    ok(await line(page) === "Chicken breast, cooked is in your foods, but it doesn't go with this dessert.", "one line says why: " + await line(page));
    await search(page, "egg");
    ok(await offered(page, "Eggs") === 1 && (await page.locator(".held-back").count()) === 0, "a basic, eggs, is offered, with no line");
    await page.locator(".row-food").filter({ hasText: "Eggs" }).getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(700);
    ok(/Eggs/.test(await glaze().textContent()), "the food goes into the part it was added to: Glaze");
    await search(page, "");
    ok(await page.locator(".row-food").filter({ hasText: "Chicken breast" }).count() === 0, "the quick picks hold chicken back too, while the fritters are on the plate");
    // chicken tacos: savoury, Nutella held back
    page = await open(); await read(page, tacos);
    await search(page, "nutella");
    ok(await offered(page, "Nutella") === 0 && await line(page) === "Nutella is in your foods, but it doesn't go with this dish.", "the savoury dish holds Nutella back, and says why");
    await search(page, "cottage");
    ok(await offered(page, "Cottage cheese") === 1, "a basic, cottage cheese, is offered for the tacos");
    // a plate of your own: Nutella alone
    page = await open(); await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(500);
    await page.locator(".row-food").filter({ hasText: "Nutella" }).getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(700);
    const tip = page.locator(".chef-tip");
    ok(await tip.count() === 1, "Chef Mealan's tip shows under your own plate");
    const tipText = await tip.textContent();
    ok(!/Chicken|Salmon|Tuna/.test(tipText), "his offers for Nutella hold back chicken, salmon and tuna: " + tipText.replace(/\s+/g, " ").slice(0, 160));
    await search(page, "chicken");
    ok(await offered(page, "Chicken breast") === 1 && (await page.locator(".held-back").count()) === 0, "on your own plate your search still offers chicken: your choice");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n")[0]); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
