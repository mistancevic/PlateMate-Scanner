// JOURNEY INVARIANT (Milan, 20 October 2026, 01:19 to 01:30, story R25 on canvas board RS25): a whole recipe is never logged as
// one meal by accident. With the whole recipe on the plate, How did making it go? counts: You made 12 fritters. How many did
// you eat?, starting on 1, with the kcal; the rest is said, not followed. All 12 stays a choice. A meal over 2,000 kcal, or
// over the whole day, is asked once before it is logged; nothing is blocked. Never rewrite these lines to fit a change.
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
const U = "http://127.0.0.1:3241";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3241", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-18T19:21:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fritters) }));
  const text = (sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const cards = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).feedback.filter((f) => f.status === "eaten").map((f) => Math.round(f.meal.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0))));
  const toMade = async () => {
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(500);
    await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
    await page.getByLabel("Link to a recipe").fill(fritters.url); await page.getByRole("button", { name: /^Read/ }).first().click(); await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1200);
    await page.getByRole("button", { name: /^Make it( as it is)?$/ }).first().click(); await page.waitForTimeout(900);
    await page.getByRole("button", { name: /^I'm making it|^Lock the recipe/ }).first().click(); await page.waitForTimeout(700);
  };
  try {
    await page.goto(U + "/"); await page.waitForTimeout(900);
    await toMade();
    const whole = Number((await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0))).toFixed(0));
    const one = Math.round(whole / 12);
    ok(/You made 12 fritters\. How many did you eat\?/.test(await text("main")) && await page.getByRole("button", { name: "All of it" }).count() === 0, "the whole recipe: You made 12 fritters. How many did you eat?; no All of it");
    const count = page.getByRole("group", { name: "How many did you eat?" });
    ok((await count.locator("b").textContent()) === "1" && (await count.textContent()).includes(`${one} kcal`), `starts on 1 fritter, ${one} kcal`);
    ok(/11 fritters left: to eat them on other days, put the recipe on Plan\./.test(await text("main")), "11 left, said");
    await count.getByRole("button", { name: "One more" }).click(); await page.waitForTimeout(200);
    const two = Math.round((whole * 2) / 12).toLocaleString("en");
    ok((await count.locator("b").textContent()) === "2" && (await count.textContent()).includes(`${two} kcal`), `+ makes it 2, with their kcal: ${two}`);
    await page.getByRole("button", { name: /^(On to How was it\?|Rate it)$/ }).click(); await page.waitForTimeout(500);
    await page.getByRole("button", { name: "DaaM good" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(900);
    const c1 = await cards();
    ok(c1.length === 1 && Math.abs(c1[0] - whole * 2 / 12) <= 2, `Today counts 2 fritters, ${c1[0]} kcal, not ${whole}`);
    ok(/You ate 2 fritters\./.test(await text("main")) && /10 fritters left/.test(await text("main")), "the landing says You ate 2 fritters, 10 fritters left");
    const meal = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => /fritters/.test(m.title)));
    ok(Math.round(meal.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0)) === whole, "the recipe is kept whole");
    await page.reload(); await page.waitForTimeout(1200);
    ok(!/could not be read/.test(await text("body")) && (await cards()).length === 1, "the record reads back after a reload: 2 of 12 is a meal the app can read");
    // ---- All 12: asked once ----
    await toMade();
    await page.getByRole("button", { name: "All 12" }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: /^(On to How was it\?|Rate it)$/ }).click(); await page.waitForTimeout(400);
    const ask = page.getByRole("alertdialog", { name: "A big meal" });
    ok(await ask.count() === 1 && new RegExp(`${whole.toLocaleString("en")} kcal in one meal\\?`).test(await ask.textContent()) && /more than your whole day/.test(await ask.textContent()), "All 12: asked once, " + (await ask.textContent()).slice(0, 90));
    await ask.getByRole("button", { name: "How many I ate" }).click(); await page.waitForTimeout(300);
    ok(await ask.count() === 0 && await page.getByRole("group", { name: "How many did you eat?" }).count() === 1, "How many I ate goes back to the count");
    await page.getByRole("button", { name: /^(On to How was it\?|Rate it)$/ }).click(); await page.waitForTimeout(400);
    await page.getByRole("alertdialog", { name: "A big meal" }).getByRole("button", { name: "Yes, all 12" }).click(); await page.waitForTimeout(400);
    ok(await page.getByRole("button", { name: "DaaM good" }).count() === 1, "Yes, all 12 goes on: nothing is blocked");
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "ran to the end: " + e.message.split("\n")[0]); }
  finally { await b.close(); server.kill(); }
  console.log(fails.length ? `${fails.length} failed` : "all passed");
  process.exit(fails.length ? 1 : 0);
})();
