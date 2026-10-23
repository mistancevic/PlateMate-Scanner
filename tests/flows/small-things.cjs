// JOURNEY INVARIANT (Milan, 19 October 2026, 19:07 to 22:27, story R21 on canvas board RS20): four small things. A recipe's
// tile says what one portion is (One fritter · kcal · protein · PD · makes 12), not every food. One portion is the recipe
// divided by what it makes, the same number on the tile, Plan, the Plate and Today, a recipe planned before included. The
// day's record keeps its line only; the numbers are on the goal card. After day 14, Getting to know you says THE LAST 14
// DAYS and its squares are those days, today last. Never rewrite these lines to fit a change.
// Changed by story DS6 K (Milan 10:21 to 11:26, board DS6): the record box goes; the plan card's row says how the day went
// (Today went by the plan) and Today's meals says the extras.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const items = [[/^Oats/, 1200], [/^Milk/, 896], [/^Eggs/, 246]].map(([re, g], k) => ({ id: `fr${k}`, food: F(re), grams: g, locked: true }));
const fritters = { id: "fr", title: "Homemade apple fritters", items, portion: 195, makes: { n: 12, unit: "fritters" }, savedAt: "2026-10-12T10:00:00Z" };
const whole = items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0), N = Math.round(whole / 12);
const old = Math.round(whole * 195 / items.reduce((s, i) => s + i.grams, 0));
seed.items = []; seed.feedback = []; seed.meals = [fritters];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const T = "2026-10-19";
const PLAN = { [T]: { dinner: { title: fritters.title, kcal: old, protein: 7, source: "mine", mealId: "fr", items, portion: 195 } } };
const U = "http://127.0.0.1:3238";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3238", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-19T18:30:00Z"));
    await page.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-05T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z" }));
      localStorage.setItem("chefmealan-planned", JSON.stringify(plan));
      localStorage.setItem("seeded", "1"); }, [seed, PLAN]);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + "/"); await page.waitForTimeout(1500);
    ok(old !== N, `the test recipe tells the two apart: ${old} kcal from the 195 g saved, ${N} as the recipe divided by 12`);

    // ---- 1. the tile ----
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
    const tile = (await page.locator(".recipe-tile").filter({ hasText: "fritters" }).first().locator(".recipe-tile-body > small").first().textContent()) ?? "";
    ok(new RegExp(`^One fritter · ${N} kcal · \\d+ g protein · PD [\\d.]+ · makes 12`).test(tile) && !/g Oats/.test(tile), `the tile: ${tile}`);

    // ---- 2. one number: Plan, the plan made before, the Plate ----
    await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(700);
    await page.evaluate(() => [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Swap dinner")?.click()); await page.waitForTimeout(600);
    const row = (await page.locator(".pick-row").filter({ hasText: "fritters" }).first().textContent()) ?? "";
    // Changed by story DT79 (Milan 23 October 11:15, board DT79): a recipe that makes several comes in the pieces that fit the
    // slot, so the row says how many and their kcal: one number per fritter, times the count
    const cnt = Number((row.match(/(\d+) fritters?/) || [])[1]);
    ok(cnt >= 1 && row.includes(`${(N * cnt).toLocaleString("en")} kcal`), `Pick a meal: ${cnt} fritters at ${N} kcal each (${row.slice(0, 80)})`);
    await page.getByRole("dialog").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(400);
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
    await page.locator(".recipe-tile").filter({ hasText: "fritters" }).first().click(); await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Make it" }).first().click(); await page.waitForTimeout(900);
    const one = page.getByRole("button", { name: /One fritter, as the recipe makes it/ }); if (await one.count()) { await one.click(); await page.waitForTimeout(700); }
    const plate = (await page.locator("main").textContent()) ?? "";
    ok(new RegExp(`One fritter is ${N} kcal`).test(plate), `the Plate: one fritter is ${N} kcal`);
    const shown = await page.locator('input[aria-label^="Grams of"]').evaluateAll((xs) => xs.map((x) => x.value));
    ok(shown.every((v) => !/\.\d\d/.test(v)), `the Plate shows its grams to a tenth at most: ${shown.join(", ")}`);

    // ---- 3. Today: I ate it, the same number; the record keeps its line ----
    await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(700);
    await page.locator(".next-planned").getByRole("button", { name: /I ate it/ }).click(); await page.waitForTimeout(700);
    const meal = (await page.locator(".log-card").filter({ hasText: "fritters" }).first().textContent()) ?? "";
    ok(meal.includes(`${N} kcal`), `Today, I ate it on the dinner planned before 0.2.49: ${N} kcal, not ${old}`);
    ok(await page.locator(".day-record").count() === 0 && /Today went by the plan/.test(await page.locator("section.cooking").textContent()) && /1 of 1 by the plan/.test(await page.locator(".logged-line").textContent()), "the day's record is the plan card's row and Today's meals' line: 1 of 1 by the plan");

    // ---- 4. after day 14 ----
    const know = page.locator(".ft-know");
    const kt = (await know.textContent()) ?? "";
    const ends = await know.locator(".ft-ends span").allTextContents();
    ok(/GETTING TO KNOW YOU · THE LAST 14 DAYS/.test(kt) && !/OF 14/.test(kt), "day 15: GETTING TO KNOW YOU · THE LAST 14 DAYS");
    ok(/19 Oct/.test(ends[1] ?? "") && /6 Oct/.test(ends[0] ?? ""), `the squares are the last 14 days, today last: ${ends.join(" to ")}`);
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "ran to the end: " + e.message.split("\n")[0]); }
  finally { await b.close(); server.kill(); }
  console.log(fails.length ? `${fails.length} failed` : "all passed");
  process.exit(fails.length ? 1 : 0);
})();
