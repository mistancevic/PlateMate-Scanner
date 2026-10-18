// JOURNEY INVARIANT (Milan, 18 October 2026, 10:08, story R2 on canvas board RS): a read recipe shows its foods under the
// recipe's own groups (Dough, Filling, For shaping and frying, Glaze), each with the plate's part heading: its name, how
// many foods, kcal and PD; a recipe without groups is one list. On the plate, a part whose last food is taken off stays
// where it was, says No foods left in this part, and offers + Add a food to it; the next food put on the plate goes into
// it. Never rewrite these lines to fit a change.
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
const oneList = { url: "https://example.com/bowl/", recipe: { title: "Skyr bowl", source: "Example", servings: 1, servingsUnit: "bowls", servingsHow: "recipe", stated: null, steps: [], items: [
  it("Skyr, natural", "250 g", 250, "dairy", 63, 11), it("Oats", "40 g", 40, "base", 372, 13)] } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3220", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  // the clock of the evening this was written (19 October 2026, 00:20: after midnight the plate is sized for breakfast, the page
  // grows, and a row scrolled into view sits under the sticky bar, so the swipe missed it; the journey is unchanged)
  await page.clock.setFixedTime(new Date("2026-10-18T19:00:00"));
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
  let next = fritters;
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(next) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  try {
    await require("./adult.cjs")(page);
    const B = "http://127.0.0.1:3220";
    await page.goto(B + "/"); await page.waitForTimeout(900);
    const read = async (x) => { next = x; await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(500);
      await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
      await page.getByLabel("Link to a recipe").fill(x.url); await page.getByRole("button", { name: /^Read/ }).first().click(); await page.waitForTimeout(1200); };
    const heads = (sel) => page.locator(`${sel} .pt-h`).evaluateAll((l) => l.map((e) => e.innerText.replace(/\s+/g, " ").trim()));
    await read(fritters);
    const h = await heads(".in-card");
    ok(h.length === 4 && /^Dough/.test(h[0]) && /^Filling/.test(h[1]) && /^For shaping and frying/.test(h[2]) && /^Glaze/.test(h[3]), "the read shows the recipe's four groups, in its order: " + h.join(" | "));
    ok(/^Dough 3 foods · [\d,]+ kcal · PD [\d.]+/.test(h[0]), "a group heading has its foods, kcal and PD, as on the plate: " + h[0]);
    ok((await page.locator(".in-card .pt-group").nth(3).locator(".row").count()) === 2, "each food sits under its own group");
    ok(await page.getByRole("button", { name: "Put it on my plate" }).count() === 1, "the read still ends with Put it on my plate");
    await page.locator(".in-card").getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(400);
    await read(oneList);
    ok((await page.locator(".in-card .pt-h").count()) === 0 && (await page.locator(".in-card .row").count()) === 2, "a recipe without groups is one list");
    await page.locator(".in-card").getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(400);
    await read(fritters);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1200);
    ok((await heads(".plate-card")).some((x) => /^Glaze/.test(x)), "the plate has the Glaze part");
    // take the Glaze foods off, one by one, with a swipe to the right
    const glaze = () => page.locator(".plate-card .pt-group").filter({ has: page.locator('[aria-label="Part: Glaze"]') });
    for (let k = 0; k < 2; k++) {
      const row = glaze().locator(".swipe-fg").first(); await row.scrollIntoViewIfNeeded(); const th = await row.locator(".thumb").first().boundingBox();
      await page.mouse.move(th.x + th.width / 2, th.y + th.height / 2); await page.mouse.down();
      for (let s = 1; s <= 10; s++) await page.mouse.move(th.x + th.width / 2 + s * 15, th.y + th.height / 2);
      await page.mouse.up(); await page.waitForTimeout(500);
    }
    const gh = await glaze().locator(".pt-h").innerText().catch(() => "");
    ok(/Glaze/.test(gh) && /No foods left in this part/.test(gh), "Glaze stays after its last food goes, and says so: " + gh.replace(/\s+/g, " "));
    const after = await heads(".plate-card");
    ok(/^Glaze/.test(after[after.length - 1] || ""), "it keeps its place, after the other parts");
    const add = glaze().getByRole("button", { name: "+ Add a food to Glaze" });
    ok(await add.count() === 1, "it offers + Add a food to Glaze");
    await add.click(); await page.waitForTimeout(500);
    ok(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")) === "Search all my foods", "the tap goes to the foods to pick from");
    const pick = page.locator(".row").filter({ hasText: "Skyr, natural" }).getByRole("button", { name: /Add/ }).first();
    await pick.click(); await page.waitForTimeout(700);
    const g2 = await glaze().textContent();
    ok(/Skyr, natural/.test(g2) && /1 food/.test(g2), "the food picked goes into Glaze");
    ok(!/No foods left/.test(g2) && (await glaze().getByRole("button", { name: "+ Add a food to Glaze" }).count()) === 0, "Glaze is a part with a food again");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n")[0]); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
