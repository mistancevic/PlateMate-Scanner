// JOURNEY INVARIANT (Milan, 18 October 2026, 13:55 to 14:36, story R12 on canvas board RS9, the small part): no recipe numbers;
// the whole recipe is counted in your portions. The plate offers one bowl, as the recipe makes it, and says the whole recipe
// is chosen next. On How to make it, the whole recipe sized for your lunch is about N of your lunches; the rest is left, each
// the size of your lunch, and goes to Keep for later. The landing line and the Today card count lunches, not bowls.
// Who eats the rest stays open. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const it = (name, written, grams, role, calories, protein) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, optional: false });
const bowls = { recipe: { title: "Chicken, rice and broccoli bowls", source: "Example Kitchen", servings: 3, servingsUnit: "bowls", servingsHow: "recipe", stated: null,
  steps: ["Cook the rice.", "Sear the chicken in the oil, then add the soy sauce.", "Steam the broccoli.", "Fill the bowls and top with sesame."], items: [
  it("Chicken breast, raw", "900g", 900, "protein", 120, 22.5), it("Rice, dry", "500g", 500, "base", 360, 7), it("Broccoli", "500g", 500, "veg", 34, 2.8),
  it("Olive oil", "3 tbsp (45g)", 45, "fat", 884, 0), it("Soy sauce", "3 tbsp (45g)", 45, "sauce", 53, 8), it("Sesame seeds", "3 tbsp (45g)", 45, "nut", 573, 18)] } };
const U = "http://127.0.0.1:3226";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3226", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-18T12:30:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(bowls) }));
  const text = (sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const kcal = (items) => items.reduce((n, i) => n + (i.grams * i.food.calories) / 100, 0);
  try {
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    await page.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }]);
    await page.waitForTimeout(500); await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
    // R15 (Milan 15:55 to 16:16, board RS12): the plate now starts with the whole recipe; this journey picks the portion it had.
    await page.locator(".in-portion").getByRole("button", { name: "Sized for your lunch" }).click(); await page.waitForTimeout(500);
    // the plate: no recipe numbers
    const portion = await text(".in-portion");
    ok(/Sized for your lunch/.test(portion) && /One bowl, as the recipe makes it/.test(portion) && !/\d of 3/.test(portion), "the plate: sized for your lunch, or one bowl as the recipe makes it; no 1 of 3: " + portion.slice(0, 120));
    ok(/Next, on How to make it: the whole recipe, or just your plate\./.test(portion), "a line says the whole recipe is chosen next");
    let st = await state();
    const whole = kcal(st.meals.find((m) => m.title === bowls.recipe.title)?.items ?? []) || 3730, plate = kcal(st.items);
    const N = Math.round(whole / plate);
    ok(N >= 3, `the whole recipe is about ${N} of your lunches (${Math.round(whole)} kcal, a lunch ${Math.round(plate)} kcal)`);
    // How to make it: the whole recipe, in your lunches
    await page.getByRole("button", { name: /^Make it( as it is)?$/ }).click(); await page.waitForTimeout(800);
    await page.locator(".mk-card").getByRole("button", { name: "The whole recipe" }).click(); await page.waitForTimeout(300);
    const mk = await text(".mk-card");
    ok(new RegExp(`You make the whole recipe, about ${N} of your lunches`).test(mk) && /You eat one lunch/.test(mk) && !/3 bowls/.test(mk), "You make the whole recipe, about N of your lunches; you eat one lunch: " + mk.slice(0, 160));
    ok(new RegExp(`${N - 1} of your lunches are left, each the size of your lunch\\. They go to Keep for later`).test(mk), "the rest is left in lunches, each the size of your lunch");
    ok(new RegExp(`${N - 1} lunches go to Keep for later when you save`).test(await text("main")), "the bottom line counts lunches");
    await page.getByRole("button", { name: "I'm making it", exact: true }).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "On to How was it?" }).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "DaaM good" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(800);
    ok(new RegExp(`${N - 1} lunches left on Today\\.`).test(await text("main")), "the landing line: N lunches left on Today");
    st = await state();
    const kept = st.feedback.find((f) => f.status === "prepared");
    ok(kept && kept.left === N - 1 && kept.leftOf === "lunch" && Math.abs(kcal(kept.meal.items) - plate) < 2, "Keep for later holds lunches, each the size of yours");
    await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(800);
    const card = await text(".log-card:has(.left-tag)");
    // R5 (Milan 17:23 to 19:00, board RS13): the batch card says Each one lunch, with its numbers in place of its foods
    ok(new RegExp(`${N - 1} left`).test(card) && /Each one lunch: /.test(card), "the Today card: N left, one lunch each: " + card.slice(0, 120));
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
