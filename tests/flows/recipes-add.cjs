// JOURNEY INVARIANT (Milan, 18 October 2026, 19:45 to 19:58, story R6 on canvas board RS14): a recipe can be added on Recipes,
// with the same block as the Plate (Screenshot and Link). The read shows the Nutrition table after the foods, on both screens,
// with what the recipe says once, at the top. On Recipes it ends with Save in My recipes, which opens the recipe's page in
// Recipes and puts nothing on the Plate. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const it = (name, written, grams, role, calories, protein, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, optional: false, part });
const fritters = { url: "https://sallysbakingaddiction.com/homemade-apple-fritters/", recipe: { title: "Homemade apple fritters", source: "Sally's Baking Addiction", servings: 12, servingsUnit: "fritters", servingsHow: "recipe", stated: { kcal: 390, protein: 5, fats: 18, carbs: 52 },
  steps: ["Make the dough and let it rise.", "Heat the oil to 350°F (177°C).", "Fry 2 to 3 fritters at a time for 2 minutes a side.", "Dip each fritter in the glaze."], items: [
  it("Whole milk", "1 cup (240g)", 240, "dairy", 61, 3.2, "Dough"), it("Unsalted butter", "6 Tablespoons (85g)", 85, "fat", 717, 0.9, "Dough"), it("All-purpose flour", "4 1/2 cups (563g)", 563, "base", 364, 10, "Dough"),
  it("Apples, peeled and diced", "3 cups (360g)", 360, "fruit", 52, 0.3, "Filling"), it("Brown sugar", "1/2 cup (100g)", 100, "sweet", 380, 0, "Filling"),
  it("Cornstarch", "2 Tablespoons (16g)", 16, "base", 381, 0.3, "For shaping and frying"), it("Vegetable oil", "1 to 2 quarts (1 to 1.9 L)", 1380, "fat", 884, 0, "For shaping and frying"),
  it("Confectioners' sugar", "3 cups (360g)", 360, "sweet", 389, 0, "Glaze"), it("Milk", "6 Tablespoons (90g)", 90, "dairy", 61, 3.2, "Glaze")] } };
const STEPS = { steps: ["Mix {1}, {2} and {3} into a soft dough and let it rise.", "Cook {4} with {5} and let it cool.", "Dust with {6}; shape, fill and cut 12 fritters.", "Heat {7} in a deep pot to 177 °C and fry 2 to 3 fritters at a time.", "Whisk {8} with {9} and dip each fritter in the glaze."],
  marks: Array(5).fill({ kind: "same", why: "" }), parts: ["Dough", "Filling", "For shaping and frying", "For shaping and frying", "Glaze"] };
const POT = "1 to 2 quarts (1 to 1.9 L) vegetable oil";
const U = "http://127.0.0.1:3232";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3232", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-18T19:50:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fritters) }));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  try {
    await page.goto(U + "/"); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(600);
    const add = page.locator(".recipe-add");
    ok(await add.count() === 1 && await add.getByRole("button", { name: "Link" }).count() === 1 && /Screenshot/.test(await add.textContent()), "Recipes, Mine: Add a recipe with Screenshot and Link");
    await add.getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
    await page.getByLabel("Link to a recipe").fill(fritters.url); await page.getByRole("button", { name: /^Read/ }).first().click(); await page.waitForTimeout(1200);
    const card = page.locator(".in-card");
    const ct = (await card.textContent()).replace(/\s+/g, " ");
    ok(await card.locator(".nt-card").count() === 1 && /Energy/.test(await card.locator(".nt-card").textContent()) && await card.locator(".nt-card .nt-says").count() === 0, "the read shows the Nutrition table after the foods, without repeating the claim");
    ok(/The recipe says: 390 kcal/.test(ct), "what the recipe says, once, at the top");
    ok(await card.getByRole("button", { name: "Save in My recipes" }).count() === 1 && await card.getByRole("button", { name: "Put it on my plate" }).count() === 0, "on Recipes the read ends with Save in My recipes");
    await card.getByRole("button", { name: "Save in My recipes" }).click(); await page.waitForTimeout(1000);
    const st = await state();
    ok(st.meals.some((m) => m.title === "Homemade apple fritters" && m.stated?.kcal === 390) && st.items.length === 0, "saved in My recipes, with what it says; nothing on the Plate");
    ok(/Homemade apple fritters/.test(await page.locator(".rq").first().textContent()) && /Saved in My recipes/.test(await page.locator(".rq-landed").textContent()) && await page.locator(".rq-landed").getByRole("button", { name: "Recipes" }).count() === 1, "Save opens the recipe's page, in Recipes, with the way back to Recipes");
    // the Plate has the same block: the same table, its own last step
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600);
    await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
    await page.getByLabel("Link to a recipe").fill(fritters.url); await page.getByRole("button", { name: /^Read/ }).first().click(); await page.waitForTimeout(1200);
    ok(await page.locator(".in-card .nt-card").count() === 1 && await page.getByRole("button", { name: "Put it on my plate" }).count() === 1, "the Plate's read: the same Nutrition table, and Put it on my plate");
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
