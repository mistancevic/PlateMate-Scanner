// JOURNEY INVARIANT (Milan, 23 October 2026, 23:27, after Sarma's live page still said Rice, cooked once rice was swapped for
// oats): the names a recipe's page gives its foods belong to the foods, not to their places in the list. A food that takes
// another's place gets its own name on the page, never the old food's; a name the person gave a food stays with that food.
// Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const food = (id, name, calories, protein) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs: 10, fats: 5, fiber: 0, photo: undefined, photos: undefined, icon: "🥬" });
seed.items = []; seed.feedback = [];
// test data: a sarma whose page draft was written when its third food was cooked rice; the third food is now oats
seed.meals = [{ id: "m-sarma", title: "Sarma", savedAt: "2026-10-01T08:00:00Z", portion: 250,
  items: [[800, food("cab", "Cabbage, raw", 25, 1.3)], [500, food("min", "Beef mince, raw", 215, 18.6)], [105, food("oat", "Oats", 375, 13)]].map(([g, f], i) => ({ id: "s" + i, food: f, grams: g, locked: true })),
  publish: { names: ["White cabbage", "Beef mince", "Rice, cooked"], savedAt: "2026-10-22T10:00:00Z" } }];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3248", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-coach", "1"); sessionStorage.setItem("seeded", "1"); } localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3248/"); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
    await page.locator(".recipe-tile").filter({ hasText: "Sarma" }).click(); await page.waitForTimeout(400);
    await page.locator(".rq-pub").getByRole("button", { name: /^(Publish|Continue)$/ }).click(); await page.waitForTimeout(400);
    const sheet = page.locator(".publish-sheet");
    const name = (k) => sheet.getByLabel(`Name of food ${k}`).inputValue();
    ok(await name(3) === "Oats", "the oats row is named Oats, not the rice it replaced: " + await name(3));
    ok(await name(1) === "White cabbage", "a name the person gave a food stays with it: " + await name(1));
    await sheet.getByLabel("Name of food 3").fill("Porridge oats"); await page.waitForTimeout(800);
    const d = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === "m-sarma").publish);
    ok(d.names[2] === "Porridge oats" && d.nameIds && d.nameIds[2] === "oat", "the draft keeps each name with its food's id: " + JSON.stringify([d.names, d.nameIds]));
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
