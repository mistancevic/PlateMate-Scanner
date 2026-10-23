// JOURNEY INVARIANT (DT83, Milan 23 October 2026, 16:49 and 20:00): a food in a recipe can be swapped, and the new one takes
// the old one's place with an amount the person chooses: The same energy or The same weight, both with their grams. The same
// food in another state (cooked rice to raw rice) leads with the same energy; a different food leads with the same weight.
// While editing, one line says what changed for one portion, before and after, and Undo takes back the last change; more
// than a fifth apart turns it amber. Add right after a Remove asks whether the new food takes the removed one's place; a food
// of its own asks for its grams and the recipe is not saved without them. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = []; seed.feedback = [];
const ref = (id, name, kcal, protein, fats, carbs) => ({ id, name, brand: "", basis: "100g", calories: kcal, protein, fats, carbs, fiber: 0, readyToEat: false, source: "Reference table", notes: "", reviewedAt: "2026-10-01T08:00:00Z" });
// test data: a sarma written with cooked rice, 8 sarmas
seed.meals = [{ id: "sarma", title: "Sarma", savedAt: "2026-10-01T08:00:00Z", makes: { n: 8, unit: "sarmas" }, portion: 219,
  items: [[ref("cab", "Cabbage, raw", 25, 1.3, 0.1, 3.3), 800], [ref("min", "Beef mince, 15 % fat, raw", 215, 18.6, 15, 0), 500], [seed.foods.find((x) => x.name === "Rice, cooked"), 300], [ref("oni", "Onion, raw", 40, 1.1, 0.1, 7.6), 150]].map(([food, g], i) => ({ id: "s" + i, food, grams: g, locked: true })) }];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3247", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) {
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "profile" }));
    localStorage.setItem("seeded", "1"); } }, seed);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ");
  const grams = (name) => page.getByLabel(`Grams of ${name}`).inputValue();
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3247/"); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
    await page.getByText("Sarma", { exact: true }).last().click(); await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(400);
    ok(await page.locator(".rq-change").count() === 0, "nothing changed yet, no line");

    // cooked rice to raw rice: the same energy first
    await page.getByRole("button", { name: "Swap Rice, cooked" }).click(); await page.waitForTimeout(200);
    ok(/Swap Rice, cooked for:/.test(await txt(".rq-find")), "the search says what it swaps");
    await page.getByLabel("Search my foods").fill("raw rice"); await page.waitForTimeout(300);
    await page.locator(".rq-find-row", { hasText: "Rice, white, raw" }).click(); await page.waitForTimeout(300);
    const box = page.getByRole("group", { name: "In place of Rice, cooked" });
    const ways = await box.getByRole("button").allTextContents();
    ok(/^The same energy: 105 g Rice, white, raw$/.test(ways[0]) && /^The same weight: 300 g Rice, white, raw$/.test(ways[1]), "raw for cooked: the same energy first, both with grams: " + ways.join(" | "));
    ok(/The same food, raw or cooked/.test(await box.textContent()), "it says why");
    await box.getByRole("button", { name: /^The same energy/ }).click(); await page.waitForTimeout(300);
    ok(await grams("Rice, white, raw") === "105" && await page.getByLabel("Grams of Rice, cooked").count() === 0, "raw rice takes its place, 105 g");
    let line = await txt(".rq-change");
    ok(/Out: Rice, cooked, 300 g\. In: Rice, white, raw, 105 g\./.test(line) && /One sarma: 216 to 215 kcal, 14 to 14 g protein, PD 6\.5 to 6\.5\./.test(line), "the line says what changed for one sarma: " + line);
    await page.locator(".rq-change").getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(300);
    ok(await grams("Rice, cooked") === "300" && await page.locator(".rq-change").count() === 0, "Undo takes it back");

    // a different food: the same weight first; more than a fifth apart turns the line amber
    await page.getByRole("button", { name: "Swap Beef mince, 15 % fat, raw" }).click(); await page.waitForTimeout(200);
    await page.getByLabel("Search my foods").fill("chicken"); await page.waitForTimeout(300);
    await page.locator(".rq-find-row", { hasText: "Chicken breast, cooked" }).first().click(); await page.waitForTimeout(300);
    const box2 = page.getByRole("group", { name: "In place of Beef mince, 15 % fat, raw" });
    ok(/^The same weight: 500 g Chicken breast, cooked$/.test((await box2.getByRole("button").allTextContents())[0]) && /A different food/.test(await box2.textContent()), "a different food: the same weight first");
    await box2.getByRole("button", { name: /^The same weight/ }).click(); await page.waitForTimeout(300);
    ok(await page.locator(".rq-change-big").count() === 0, "within a fifth: not amber");
    await page.getByLabel("Grams of Chicken breast, cooked").fill("1000"); await page.waitForTimeout(300);
    ok(await page.locator(".rq-change-big").count() === 1 && /More than a fifth apart/.test(await txt(".rq-change")), "more than a fifth apart: amber, and it says to check");
    await page.getByLabel("Grams of Chicken breast, cooked").fill("500"); await page.waitForTimeout(200);

    // Remove, then Add: in place of it, or a food of its own with its grams
    await page.getByRole("button", { name: "Remove Onion, raw" }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Add a food" }).click(); await page.getByLabel("Search my foods").fill("oats"); await page.waitForTimeout(300);
    await page.locator(".rq-find-row", { hasText: "Oats" }).first().click(); await page.waitForTimeout(300);
    const box3 = page.getByRole("group", { name: "In place of Onion, raw" });
    ok(/removed just now\?/.test(await box3.textContent()) && await box3.getByRole("button", { name: "No, a food of its own" }).count() === 1, "Add after Remove asks if it takes the onion's place");
    await box3.getByRole("button", { name: "No, a food of its own" }).click(); await page.waitForTimeout(300);
    ok(await grams("Oats") === "", "a food of its own comes without grams, not 100 g");
    await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(300);
    ok(/Set the grams of Oats, or remove it\./.test(await txt(".rq-need")) && await page.locator(".rq-editing").count() === 1, "Save waits for the grams");
    await page.getByLabel("Grams of Oats").fill("40"); await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(600);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === "sarma").items.map((i) => `${i.food.name} ${i.grams}`));
    ok(saved.join(" | ") === "Cabbage, raw 800 | Chicken breast, cooked 500 | Rice, cooked 300 | Oats 40", "saved in place: " + saved.join(" | "));
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
