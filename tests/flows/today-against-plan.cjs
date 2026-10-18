// JOURNEY INVARIANT (Milan, 18 October 2026, 17:23 to 19:00, story R5 on canvas board RS13): Today is the day against the plan.
// On top, today against your goal: PD, kcal and protein eaten of the target (fat and carbs say at least when a food has no value).
// Under it, by time and importance: what comes next, with its one main action (the next meal, or Plan tomorrow when the day's
// meals are done); the batch as a way to eat it, where I ate one asks which meal it is; the plan; today's meals newest first, each
// with which meal it was, its numbers and its recipe, no foods. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const it = (name, written, grams, role, calories, protein, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, optional: false, part });
const read = { recipe: { title: "Protein cheesecake", source: "@highproteinbakes on Instagram", servings: 8, servingsUnit: "slices", servingsHow: "recipe", stated: null, steps: ["Crush the biscuits and mix with the melted butter.", "Beat the filling and bake at 320°F for 45 minutes."], items: [
  it("Digestive biscuits", "120g", 120, "base", 480, 7, "Base"), it("Butter", "40g", 40, "fat", 740, 0.7, "Base"),
  it("Low-fat quark", "500g", 500, "dairy", 67, 12, "Filling"), it("Cream cheese", "200g", 200, "cheese", 342, 6, "Filling"), it("Eggs", "2 large", 120, "protein", 143, 12.6, "Filling")] } };
const U = "http://127.0.0.1:3231";
const errsAll = [];
let b;
const open = async (state, at = "2026-10-18T12:20:00") => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errsAll.push(e.message));
  await page.clock.setFixedTime(new Date(at));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
    localStorage.setItem("seeded", "1"); }, state);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  return page;
  };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3231", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = errsAll;
  const page = await open(seed, "2026-10-18T12:30:00");
  const text = (sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const at = async (t) => { await page.clock.setFixedTime(new Date(t)); await page.goto(U + "/"); await page.waitForTimeout(1200); };
  try {
    await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }));
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    await page.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }]);
    await page.waitForTimeout(500); await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
    await page.locator(".in-portion").getByRole("button", { name: "One slice, as the recipe makes it" }).click(); await page.waitForTimeout(500);
    await page.getByRole("button", { name: /^Make it( as it is)?$/ }).click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: "I'm making it", exact: true }).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "On to How was it?" }).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "DaaM good" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(700);
    await at("2026-10-18T16:00:00");
    const goal = await text("section.plan");
    ok(/Today so far, against your goal/.test(goal) && /of 2,800 kcal/.test(goal) && /of 180 g protein/.test(goal) && /at least \d+ ?of \d+ g fat/.test(goal), "the goal card: today against it, fat and carbs at least when a food has no value: " + goal.slice(0, 200));
    const next = await text(".next-meal");
    ok(/^Next: /.test(await page.locator("p.label").filter({ hasText: /^Next: / }).first().textContent()) && /Make your /.test(next) && /Log a meal/.test(next), "what comes next: the next meal, its main action, Log a meal: " + next);
    const meal = page.locator(".log-card").filter({ hasText: "Protein cheesecake" }).filter({ has: page.locator(".meal-which") }).first();
    const mt = (await meal.textContent()).replace(/\s+/g, " ");
    ok(/Open the recipe/.test(mt) && /kcal · \d+ g protein/.test(mt) && !/Digestive biscuits/.test(mt) && !/In My recipes/.test(mt), "a meal: which meal, its numbers, its recipe; no foods: " + mt);
    ok(await page.locator("p.label").filter({ hasText: "Or one from your batch" }).count() === 1, "the batch is a way to eat the next meal");
    const prep = page.locator(".log-card").filter({ hasText: "7 left" });
    ok(/Each one slice: \d+ kcal · \d+ g protein/.test((await prep.textContent()).replace(/\s+/g, " ")) && !/Digestive/.test(await prep.textContent()), "the batch card: each one slice with its numbers, no foods");
    await prep.getByRole("button", { name: "I ate one" }).click(); await page.waitForTimeout(300);
    ok(await prep.getByText("Which meal is it?").count() === 1 && await prep.getByRole("button", { name: "Snack" }).count() === 1, "I ate one asks which meal it is, with Snack");
    await prep.getByRole("button", { name: "Snack" }).click(); await prep.getByRole("button", { name: "Log it" }).click(); await page.waitForTimeout(600);
    const first = (await page.locator(".log-card").filter({ has: page.locator(".meal-which") }).first().textContent()).replace(/\s+/g, " ");
    ok(/^Protein cheesecake04:00 PM ?Snack/.test(first) || /Snack/.test(await page.locator(".log-card .meal-which").first().textContent()), "the newest meal comes first and says Snack: " + first.slice(0, 80));
    await page.locator(".log-card .meal-which").first().getByRole("button", { name: /Open the recipe/ }).click(); await page.waitForTimeout(800);
    ok(/Protein cheesecake/.test(await text(".rq")) && await page.locator(".rq-landed").count() === 0, "Open the recipe opens its page, with no saved line");
    await at("2026-10-18T23:30:00");
    ok(/Next: tomorrow/.test(await text("main")) && await page.getByRole("button", { name: "Plan tomorrow" }).count() === 1 && /For tomorrow, from your batch/.test(await text("main")), "late in the day, what comes next is tomorrow: Plan tomorrow, the batch for tomorrow");
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
