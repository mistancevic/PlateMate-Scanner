// JOURNEY INVARIANT (Milan, 18 October 2026, 02:08 and 02:22, story R8 on canvas board RS3): every recipe has its own
// page. Open a recipe and the address is /my-recipes/<its id>. A reload on that page stays on it; Back goes to the list;
// a saved link opens the recipe; an address with a recipe that isn't there opens the list; the Recipes tab, tapped on an
// open recipe, goes to the list (choice A, 02:38). Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🥣" });
const items = [[200, food("pf", "Protein flour", 357, 21, 59, 2.4)], [500, food("pm", "Protein milk", 51, 7.5, 5, 0.1)], [180, food("eg", "Eggs", 143, 12.6, 0.7, 9.5)]].map(([g, f], i) => ({ id: "i" + i, food: f, grams: g, locked: false }));
seed.items = [];
seed.meals = [
  { id: "m-crepes", title: "High protein crepes", items, portion: 880, savedAt: "2026-10-07T10:00:00Z" },
  { id: "m-bowl", title: "Breakfast bowl", items: items.slice(1), portion: 680, savedAt: "2026-10-06T10:00:00Z" }];
seed.feedback = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3219", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
  try {
    await require("./adult.cjs")(page);
    const B = "http://127.0.0.1:3219";
    const url = () => new URL(page.url()).pathname;
    const onPage = async (t) => (await page.locator(".rq").count()) > 0 && (await page.locator("h1, h2, .rq-title, .rq-name").filter({ hasText: t }).count()) > 0;
    await page.goto(B + "/"); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
    ok(url() === "/my-recipes", "Recipes is at /my-recipes");
    await page.locator(".recipe-tile").filter({ hasText: "High protein crepes" }).click(); await page.waitForTimeout(500);
    ok(url() === "/my-recipes/m-crepes", "an open recipe has its own address: " + url());
    await page.reload(); await page.waitForTimeout(1200);
    ok(url() === "/my-recipes/m-crepes" && await onPage("High protein crepes"), "a reload stays on the recipe");
    await page.goBack(); await page.waitForTimeout(600);
    ok(url() === "/my-recipes" && (await page.locator(".rq").count()) === 0 && (await page.locator(".recipe-tile").count()) === 2, "Back goes to the list");
    await page.locator(".recipe-tile").filter({ hasText: "Breakfast bowl" }).click(); await page.waitForTimeout(500);
    ok(url() === "/my-recipes/m-bowl" && await onPage("Breakfast bowl"), "another recipe, its own address");
    await page.goto(B + "/my-recipes/m-crepes"); await page.waitForTimeout(1200);
    ok(url() === "/my-recipes/m-crepes" && await onPage("High protein crepes"), "a saved link opens the recipe");
    await page.goBack(); await page.waitForTimeout(600);
    ok(url() === "/my-recipes" && (await page.locator(".rq").count()) === 0, "Back from a saved link goes to the list");
    await page.goto(B + "/my-recipes/not-there"); await page.waitForTimeout(1200);
    ok(url() === "/my-recipes" && (await page.locator(".recipe-tile").count()) === 2, "an address with no such recipe opens the list");
    // choice A (Milan 02:38): the Recipes tab, tapped on an open recipe, goes to the list
    await page.locator(".recipe-tile").filter({ hasText: "High protein crepes" }).click(); await page.waitForTimeout(500);
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
    ok(url() === "/my-recipes" && (await page.locator(".rq").count()) === 0 && (await page.locator(".recipe-tile").count()) === 2, "the Recipes tab on an open recipe goes to the list");
    await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(400);
    ok(url() === "/today", "the tabs keep their addresses");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
