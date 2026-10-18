// JOURNEY INVARIANT (Milan, 18 October 2026, 15:55 to 16:16, story R15 on canvas board RS12): the plate starts with the whole
// recipe, as mapped, from a link and with Make it from Recipes. Then you pick what you eat: one fritter, as the recipe makes it,
// or sized for your meal. One fritter is one share of the recipe: the line and the card give one number; a tiny amount keeps
// its tenth of a gram. With the whole recipe on the plate, How to make it makes all of it and asks nothing.
// Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const it = (name, written, grams, role, calories, protein, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, optional: false, part });
const fritters = { url: "https://sallysbakingaddiction.com/homemade-apple-fritters/", recipe: { title: "Homemade apple fritters", source: "Sally's Baking Addiction", servings: 12, servingsUnit: "fritters", servingsHow: "recipe", stated: null,
  steps: ["Make the dough and let it rise.", "Heat the oil to 350°F (177°C).", "Fry 2 to 3 fritters at a time for 2 minutes a side.", "Dip each fritter in the glaze."], items: [
  it("Whole milk", "1 cup (240g)", 240, "dairy", 61, 3.2, "Dough"), it("Unsalted butter", "6 Tablespoons (85g)", 85, "fat", 717, 0.9, "Dough"), it("All-purpose flour", "4 1/2 cups (563g)", 563, "base", 364, 10, "Dough"),
  it("Apples, peeled and diced", "3 cups (360g)", 360, "fruit", 52, 0.3, "Filling"), it("Brown sugar", "1/2 cup (100g)", 100, "sweet", 380, 0, "Filling"),
  it("Ground nutmeg", "1/4 teaspoon (1g)", 1, "other", 525, 5.8, "Filling"), it("Vegetable oil", "1 to 2 quarts (1 to 1.9 L)", 1380, "fat", 884, 0, "For shaping and frying"),
  it("Confectioners' sugar", "3 cups (360g)", 360, "sweet", 389, 0, "Glaze"), it("Milk", "6 Tablespoons (90g)", 90, "dairy", 61, 3.2, "Glaze")] } };
const STEPS = { steps: ["Mix {1}, {2} and {3} into a soft dough and let it rise.", "Cook {4} with {5} and let it cool.", "Dust with {6}; shape, fill and cut 12 fritters.", "Heat {7} in a deep pot to 177 °C and fry 2 to 3 fritters at a time.", "Whisk {8} with {9} and dip each fritter in the glaze."],
  marks: Array(5).fill({ kind: "same", why: "" }), parts: ["Dough", "Filling", "For shaping and frying", "For shaping and frying", "Glaze"] };
const POT = "1 to 2 quarts (1 to 1.9 L) vegetable oil";
const U = "http://127.0.0.1:3229";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3229", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-18T16:21:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fritters) }));
  const text = (sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const card = async () => ({ title: (await text(".plate-card .readout-top")).trim(), kcal: Number((await text(".plate-card .readout-mid small")).match(/([\d,]+) kcal/)[1].replace(/,/g, "")) });
  const chipOn = () => page.locator(".in-portion .choice.on").textContent();
  try {
    await page.goto(U + "/"); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(500);
    await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
    await page.getByLabel("Link to a recipe").fill(fritters.url); await page.getByRole("button", { name: /^Read/ }).first().click(); await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1200);
    let c = await card(), line = await text(".in-portion");
    ok((await chipOn()).includes("The whole recipe") && /^The whole recipe/.test(c.title) && c.kcal > 6000, "from a link, the plate starts with the whole recipe, and the card says so: " + JSON.stringify(c));
    ok(/The whole recipe, as you mapped it: 12 fritters\./.test(line) && /Pick what you eat\./.test(line) && !/Next, on How to make it/.test(line), "the line: the whole recipe as mapped, pick what you eat: " + line);
    const one = Number(line.match(/One fritter is ([\d,]+) kcal/)[1].replace(/,/g, ""));
    await page.locator(".in-portion").getByRole("button", { name: "One fritter, as the recipe makes it" }).click(); await page.waitForTimeout(500);
    c = await card();
    ok(c.kcal === one && Number((await text(".in-portion")).match(/One fritter is ([\d,]+) kcal/)[1].replace(/,/g, "")) === one, `one fritter: the line and the card give one number, ${one} kcal (card ${c.kcal})`);
    const nutmeg = await page.locator(".plate-card .row").filter({ hasText: "Ground nutmeg" }).locator("input[type=number]").inputValue();
    ok(nutmeg === "0.1", "a tiny amount keeps its tenth of a gram: nutmeg " + nutmeg + " g");
    await page.locator(".in-portion").getByRole("button", { name: "The whole recipe" }).click(); await page.waitForTimeout(500);
    await page.getByRole("button", { name: /^Make it( as it is)?$/ }).first().click(); await page.waitForTimeout(900);
    const mk = await text(".mk-card");
    ok(await page.locator(".mk-card").getByRole("button", { name: "Just your plate" }).count() === 0 && /You make the whole recipe/.test(mk) && /You eat the whole recipe/.test(mk) && /nothing is left/.test(mk), "the whole recipe on the plate: How to make it makes all of it and asks nothing: " + mk.slice(0, 200));
    // Make it from Recipes starts whole too
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(600);
    await page.locator(".recipe-tile").filter({ hasText: "Homemade apple fritters" }).click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Make it", exact: true }).click(); await page.waitForTimeout(1200);
    c = await card();
    ok((await chipOn()).includes("The whole recipe") && /^The whole recipe/.test(c.title), "Make it from Recipes starts with the whole recipe too");
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
