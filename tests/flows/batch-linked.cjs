// JOURNEY INVARIANT (Milan, 18 October 2026, 14:30 to 14:36, story R4 on canvas board RS2): a portion eaten from a batch stays
// linked to its recipe. You make the whole cheesecake; the slices left wait in Prepared for later, and that card knows its
// recipe. I ate one logs a meal that is In My recipes, never Save in My recipes, which would make a one-slice copy. A card from
// before this change finds its recipe by the recipe's name. A plate that is no recipe can still be saved from Today.
// Never rewrite these lines to fit a change.
// Changed by story R5 (Milan 17:23 to 19:00, board RS13): a linked meal shows Open the recipe in place of In My recipes, and I ate one asks which meal it is.
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
const U = "http://127.0.0.1:3225";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3225", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (state, at = "2026-10-18T12:20:00") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
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
  const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const cardOf = (page, title) => page.locator(".log-card").filter({ hasText: title }).filter({ hasNot: page.locator(".left-tag") }).filter({ hasNotText: "I ate one" });
  try {
    // ---- the whole cheesecake made, one slice eaten, 7 for later ----
    const page = await open(seed);
    await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }));
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    await page.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }]);
    await page.waitForTimeout(500); await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
    // R15 (Milan 15:55 to 16:16, board RS12): the plate now starts with the whole recipe; this journey picks the portion it had.
    await page.locator(".in-portion").getByRole("button", { name: "One slice, as the recipe makes it" }).click(); await page.waitForTimeout(500);
    await page.getByRole("button", { name: /^Make it( as it is)?$/ }).click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: "I'm making it", exact: true }).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "On to How was it?" }).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "DaaM good" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(700);
    let st = await state(page);
    const recipe = st.meals.find((m) => m.title === "Protein cheesecake");
    const kept = st.feedback.find((f) => f.status === "prepared");
    ok(!!recipe && kept && kept.left === 7 && kept.recipeId === recipe.id, "the 7 slices left wait for later, and the card knows its recipe");
    await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: "I ate one" }).click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Log it" }).click(); await page.waitForTimeout(600);
    st = await state(page);
    const eaten = st.feedback.filter((f) => f.status === "eaten" && f.meal.title === "Protein cheesecake");
    ok(eaten.length === 2 && eaten.every((f) => f.recipeId === recipe.id), "I ate one logs a slice linked to the cheesecake");
    const cards = cardOf(page, "Protein cheesecake");
    const n = [await cards.count(), await cards.getByRole("button", { name: /Open the recipe/ }).count(), await cards.getByRole("button", { name: "Save in My recipes" }).count()];
    ok(n[0] === 2 && n[1] === 2 && await cards.getByRole("button", { name: "Save in My recipes" }).count() === 0, "both cheesecake meals on Today say In My recipes; no Save in My recipes " + JSON.stringify(n));
    ok(st.meals.filter((m) => m.title === "Protein cheesecake").length === 1, "no one-slice copy in My recipes");
    await page.context().close();

    // ---- a card from before: no link, but the recipe's name; and a plate that is no recipe ----
    const at = "2026-10-18T09:00:00.000Z";
    const old = { ...st.feedback.find((f) => f.status === "eaten"), id: "old1", createdAt: at }; delete old.recipeId;
    const mine = { ...old, id: "own1", meal: { ...old.meal, id: "plate1", title: "My lunch bowl" } };
    const p2 = await open({ ...seed, meals: st.meals, feedback: [old, mine] });
    await p2.goto(U + "/"); await p2.waitForTimeout(1200);
    ok(await cardOf(p2, "Protein cheesecake").getByRole("button", { name: /Open the recipe/ }).count() === 1, "a card from before finds its recipe by name: In My recipes");
    ok(await cardOf(p2, "My lunch bowl").getByRole("button", { name: "Save in My recipes" }).count() === 1, "a plate that is no recipe can still be saved from Today");
    await p2.context().close();
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
