// How to make it (0.2.20, canvas board IM, IM19, IM19b, IM19c, IM20; Milan 17 October 2026, 12:29 to 12:57). After Make it, a dish
// from a recipe gets its steps, not the ways to eat a mix: the cheesecake makes 8, so the whole cake is made, the steps are drafted
// on this step (faked here: no AI key), at the whole recipe's grams or your slice's, and the 7 slices left go to Keep for later,
// on Today day after day until eaten or removed. A cookie that makes 2 starts with just yours. Your own bowl in parts is a
// checklist. A mix of ready foods keeps How do you want to eat it?
// Changed by story R16 (Milan 21:56 to 22:11, board RS15): the slices left are not followed: no card for later, nothing on
// Today; to eat them on other days, the recipe goes on Plan.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const it = (name, written, grams, role, calories, protein, part, extra = {}) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, optional: false, part, ...extra });
const read = { recipe: { title: "Protein cheesecake", source: "@highproteinbakes on Instagram", servings: 8, servingsUnit: "slices", servingsHow: "recipe", stated: null, steps: ["Crush the biscuits and mix with the melted butter.", "Beat the filling and bake at 320°F for 45 minutes.", "Top with raspberries."], items: [
  it("Digestive biscuits", "120g", 120, "base", 480, 7, "Base"), it("Butter", "40g", 40, "fat", 740, 0.7, "Base"),
  it("Low-fat quark", "500g", 500, "dairy", 67, 12, "Filling"), it("Cream cheese", "200g", 200, "cheese", 342, 6, "Filling"), it("Eggs", "2 large", 120, "protein", 143, 12.6, "Filling"), it("Vanilla whey protein powder", "30g", 30, "protein", 390, 78, "Filling"), it("Sweetener", "40g", 40, "sweet", 0, 0, "Filling"),
  it("Raspberries", "150g", 150, "fruit", 52, 1.2, "Topping"), it("Dark chocolate", "20g", 20, "sweet", 550, 7, "Topping", { optional: true, note: "to drizzle" })] } };
const F = (id, name, calories, protein, icon) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs: null, fats: null, fiber: null, photo: undefined, photos: undefined, icon });
const BOWL = [F("b1", "Basmati rice, cooked", 130, 2.7, "🍚"), F("b2", "Chicken breast, grilled", 165, 31, "🍗"), F("b3", "Black beans, cooked", 132, 8.9, "🫘"), F("b4", "Cheddar", 403, 25, "🧀"), F("b5", "Sour cream", 193, 2.4, "🥛")];
const U = "http://127.0.0.1:3212";
const cookie = { recipe: { title: "Choc chip cookie", source: "@christopherkaiyu on Instagram", servings: 2, servingsUnit: "cookies", servingsHow: "recipe", stated: null, steps: ["Preheat oven to 350 degrees Fahrenheit.", "Mix wet, then dry. Bake 10-13 minutes."], items: [
  it("Light butter", "35g", 35, "fat", 360, 1, ""), it("Egg", "50g", 50, "protein", 143, 12.6, ""), it("All-purpose flour", "45g", 45, "base", 364, 10, ""), it("Casein protein powder", "25g", 25, "protein", 360, 80, "")] } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3212", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (state, at = "2026-10-17T10:20:00") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date(at));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      localStorage.setItem("seeded", "1"); }, state);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    return page;
  };
  const text = (page, sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const readIn = async (page, rd, pick) => {
    await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rd) }));
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    await page.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }]);
    await page.waitForTimeout(500); await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
    // R15 (Milan 15:55 to 16:16, board RS12): the plate now starts with the whole recipe; this journey picks the portion it had.
    if (pick) { await page.locator(".in-portion").getByRole("button", { name: pick }).click(); await page.waitForTimeout(500); }
    await page.unroute("**/api/recipe/read");
  };

  // ---- the cheesecake: the whole cake, steps drafted on this step, 7 slices for later ----
  const page = await open(seed);
  await readIn(page, read, "One slice, as the recipe makes it");
  await page.route("**/api/steps", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    steps: ["Crush {1} and mix with {2}, melted; press into a tin.", "Heat the oven to 160 °C.", "Beat {3}, {4}, {5}, {6} and {7} until smooth; pour over the base and bake 45 minutes.", "Chill 4 hours, then top with {8}."],
    marks: [{ kind: "same", why: "" }, { kind: "adapted", why: "320 °F in the original" }, { kind: "same", why: "" }, { kind: "added", why: "how long to chill it" }], parts: ["Base", "Filling", "Filling", "Topping"] }) }));
  await page.getByRole("button", { name: /^Make it( as it is)?$/ }).click(); await page.waitForTimeout(800);
  let t = await text(page, "main");
  ok(/How to make it/.test(t) && !/How do you want to eat it/.test(t), "IM19: after Make it, a recipe gets How to make it");
  ok(await page.locator('[aria-label="What you make"] .choice.on').textContent() === "The whole recipe" && /You eat 1 slice/.test(t) && /7 slices are left\. To eat them on other days, put the recipe on Plan\./.test(t), "IM19: it makes 8, so the whole cake is made; you eat 1 slice; R16: the other 7 go on Plan, not Today");
  ok(/The recipe's own steps/.test(t) && await page.locator(".mk-card .rp-orig li").count() > 0 && /Preheat|Crush the biscuits/.test(await text(page, ".mk-card .rp-orig")) && /The original works with your foods as they are/.test(t), "RP1 (was IM19b): the original is the steps, and a line says it works; no steps yet: the original open below, for you only");
  ok(await page.getByRole("button", { name: "Chef Mealan's way" }).count() === 1 && await page.getByRole("button", { name: /^(I'm making it|Lock the recipe)$/ }).count() === 1, "RP1: Chef Mealan's way on a tap; I'm making it");
  await page.getByRole("button", { name: "Chef Mealan's way" }).click(); await page.waitForTimeout(900);
  t = await text(page, "main");
  ok(JSON.stringify(await page.locator(".mk-card .rp-step-part").allTextContents()) === JSON.stringify(["The base", "The filling", "The topping"]) && /120 g digestive biscuits/.test(t) && /200 g cream cheese/.test(t) && /Adapted: 320 °F in the original/.test(t), "IM19: the steps drafted here, part by part, at the whole cake's grams, with the marks");
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")))).meals[0].steps.length === 4, "IM19b: the steps are kept with the recipe");
  await page.getByRole("button", { name: "Just your plate" }).click(); await page.waitForTimeout(300);
  ok(/15 g digestive biscuits/.test(await text(page, "main")) && /every amount at your portion/.test(await text(page, "main")), "IM20: just your slice: the steps at your plate's grams");
  await page.getByRole("button", { name: "The whole recipe" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^(I'm making it|Lock the recipe)$/ }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^(On to How was it\?|Rate it)$/ }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "DaaM good" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(600);
  let st = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  // R16 (0.2.44, Milan 21:56, board RS15): the rest of the cake is not followed: no card for later, nothing on Today
  ok(!st.feedback.some((f) => f.status === "prepared") && st.feedback.filter((f) => f.status === "eaten" && f.meal.title === "Protein cheesecake").length === 1, "R16: one slice logged; no card for the 7 left");
  await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(800);
  t = await text(page, "main");
  ok(!/from your batch/.test(t) && !/7 left/.test(t) && await page.getByRole("button", { name: "I ate one" }).count() === 0, "R16: Today shows no batch: what is left may go to the family or to work");
  await page.close();
  // the next day: Today still shows no batch; the cake reaches a day through the plan (batch-linked walks that)
  const p3 = await open({ ...st }, "2026-10-18T09:00:00");
  await p3.goto(U + "/"); await p3.waitForTimeout(1200);
  ok(await p3.locator(".left-tag").count() === 0 && !/from your batch/.test(await text(p3, "main")) && !/Protein cheesecake/.test(await text(p3, ".next-meal")), "R16: the next day, nothing from the cake waits on Today");
  await p3.close();

  // ---- the cookie: makes 2, so just yours first ----
  const p4 = await open(seed);
  await readIn(p4, cookie, "One cookie, as the recipe makes it");
  await p4.getByRole("button", { name: /^Make it( as it is)?$/ }).click(); await p4.waitForTimeout(800);
  ok(await p4.locator('[aria-label="What you make"] .choice.on').textContent() === "Just your plate" && /The recipe makes 2/.test(await text(p4, "main")), "IM20: a recipe that makes 2 starts with just your cookie");
  await p4.getByRole("button", { name: "The whole recipe" }).click(); await p4.waitForTimeout(200);
  // R16 (Milan 21:56 to 22:11, board RS15): the other cookie goes on Plan, not to Keep for later
  ok(/1 cookie is left\. To eat it on other days, put the recipe on Plan\./.test(await text(p4, "main")), "IM20: All 2 cookies, an exact count: the other one is left, for Plan");
  await p4.close();

  // ---- your own bowl in parts: a checklist; a mix of ready foods keeps the ways to eat it ----
  const bowl = [[0, 180, "Rice"], [1, 150, "Chicken"], [2, 80, "Chicken"], [3, 20, "Toppings"]].map(([k, g, pt]) => ({ id: `w${k}`, grams: g, locked: false, food: BOWL[k], part: pt }));
  const p5 = await open({ ...seed, foods: [...seed.foods, ...BOWL], items: bowl, title: "Burrito bowl" });
  await p5.goto(U + "/plate"); await p5.waitForTimeout(1300);
  await p5.getByRole("button", { name: /^(Keep it as it is|Lock the recipe)$/ }).click(); await p5.waitForTimeout(800);
  const checks = await p5.locator(".mk-check").allTextContents();
  ok(/How to make it/.test(await text(p5, "main")) && checks.length === 4 && /Rice: 180 g Basmati rice, cooked/.test(checks[0]) && /Put it together/.test(checks[3]), `IM19c: your bowl in parts as a checklist (${checks.join(" | ")})`);
  await p5.locator(".mk-check").first().click(); await p5.waitForTimeout(150);
  ok(await p5.locator(".mk-check.on").count() === 1, "IM19c: tick a part as you go");
  await p5.close();
  const yog = seed.foods.find((f) => /Skyr/.test(f.name)), nut = seed.foods.find((f) => /Nutella/.test(f.name));
  const p6 = await open({ ...seed, items: [{ id: "y", grams: 200, locked: false, food: yog }, { id: "n", grams: 15, locked: false, food: nut }], title: "" });
  await p6.goto(U + "/plate"); await p6.waitForTimeout(1300);
  await p6.getByRole("button", { name: /^(Keep it as it is|Lock the recipe)$/ }).click(); await p6.waitForTimeout(800);
  ok(/How do you want to eat it\?/.test(await text(p6, "main")), "A mix of ready foods keeps How do you want to eat it?");
  await p6.close();
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
