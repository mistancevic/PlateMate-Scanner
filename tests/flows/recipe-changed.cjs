// B160 (0.3.187, board Stories287; Coach Milan, Go 23 November 2026, 20:03): a recipe changed after a meal was logged from it.
// Cheese pie, eaten tonight at 18:00 (and at lunch, for the once-for-all case), or on Friday. Save changes with the foods
// changed asks once for all the meals from it today or yesterday; Update gives each the new foods at the share it had; Keep
// leaves them; older meals are not asked and one line says how many keep their foods; a change of the steps alone asks
// nothing; Save as a new recipe keeps this one as it is. The clock is Monday 23 November 2026, 19:00.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined });
const Q = food("q", "Grainy cream cheese", 100, 12, 3, 4.5), P = food("p", "Puff pastry", 400, 6, 36, 25), S = food("s", "Salt", 0, 0, 0, 0), E = food("e", "Eggs", 143, 12.6, 0.7, 9.5);
const it = (id, f, g) => ({ id, food: f, grams: g, locked: false });
const recipe = { id: "m-pie", title: "Cheese pie", items: [it("a", Q, 500), it("b", P, 375), it("c", S, 3), it("d", E, 122)], makes: { n: 4, unit: "portions" }, portion: 250, steps: ["Mix the cheese, salt and eggs.", "Bake at 200 °C for 25 minutes."], savedAt: "2026-11-23T16:00:00Z" };
const eaten = (id, at, slot) => ({ id, meal: { ...recipe, items: [it(id + "a", Q, 125), it(id + "b", P, 94), it(id + "c", S, 1), it(id + "d", E, 31)], portion: 251 }, recipeId: "m-pie", status: "eaten", taste: "", notes: "", createdAt: at, slot });
const DINNER = eaten("c1", "2026-11-23T17:00:00.000Z", { date: "2026-11-23", slotId: "dinner", name: "Dinner", time: "18:00" });
const LUNCH = eaten("c0", "2026-11-23T12:00:00.000Z", { date: "2026-11-23", slotId: "lunch", name: "Lunch", time: "13:00" });
const FRIDAY = eaten("c9", "2026-11-20T17:00:00.000Z", { date: "2026-11-20", slotId: "dinner", name: "Dinner", time: "18:00" });
const PORT = "3612", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (cards) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1000 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-23T19:00:00+01:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, Q, P, S, E], meals: [recipe], feedback: cards });
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + "/my-recipes/m-pie"); await page.waitForTimeout(1500);
    return page;
  };
  const st = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const grams = (c) => c.meal.items.map((i) => `${i.food.id}${Math.round(i.grams)}`).join(" ");
  const cheese = async (page, g) => { await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(400); const f = page.getByLabel("Grams of Grainy cream cheese", { exact: true }); await f.fill(String(g)); await f.blur(); await page.waitForTimeout(200); };
  try {
    // AC1, AC2: tonight's dinner, asked once, Update it
    let page = await open([DINNER]);
    await cheese(page, 250);
    await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(500);
    const ask = page.locator(".recipe-ask");
    ok(/The meal of Monday,? 23 November, 18:00 was made from this recipe\. Was it made this way\?/.test(await ask.innerText()), "AC1: asked once: " + (await ask.innerText()).split("\n")[0]);
    ok((await st(page)).meals[0].items[0].grams === 500, "AC1: nothing saved before the answer");
    await page.getByRole("button", { name: "Update it" }).click(); await page.waitForTimeout(600);
    let s = await st(page);
    ok(s.meals[0].items[0].grams === 250 && grams(s.feedback[0]) === "q63 p94 s1 e31", "AC2: the recipe is saved; the dinner takes the new foods at its share: " + grams(s.feedback[0]));
    ok(/The meal of Monday,? 23 November, 18:00 follows the change\./.test(await page.locator(".recipe-saved-line").innerText()), "AC2: one line says it follows the change");
    await page.context().close();
    // AC3, and once for all: lunch and dinner, Keep them as they were
    page = await open([LUNCH, DINNER]);
    await cheese(page, 250);
    await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(500);
    ok(/The meals of Monday,? 23 November, 13:00 and Monday,? 23 November, 18:00 were made from this recipe\. Were they made this way\?/.test(await page.locator(".recipe-ask").innerText()), "once for all: " + (await page.locator(".recipe-ask").innerText()).split("\n")[0]);
    await page.getByRole("button", { name: "Keep them as they were" }).click(); await page.waitForTimeout(600);
    s = await st(page);
    ok(s.meals[0].items[0].grams === 250 && s.feedback.every((c) => grams(c) === "q125 p94 s1 e31"), "AC3: the recipe is saved; both meals keep their foods");
    ok(/keep their foods, as you ate them\./.test(await page.locator(".recipe-saved-line").innerText()), "AC3: one line says so");
    await page.context().close();
    // AC4: Friday, not asked
    page = await open([FRIDAY]);
    await cheese(page, 250);
    await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(600);
    s = await st(page);
    ok(await page.locator(".recipe-ask").count() === 0 && s.meals[0].items[0].grams === 250 && grams(s.feedback[0]) === "q125 p94 s1 e31", "AC4: an older meal is not asked about and keeps its foods");
    ok(/^1 meal eaten before keeps its foods/.test(await page.locator(".recipe-saved-line").innerText()), "AC4: one line: " + await page.locator(".recipe-saved-line").innerText());
    await page.context().close();
    // AC5: the steps alone ask nothing
    page = await open([DINNER]);
    await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(400);
    const step = page.locator(".rq-steps textarea, .rq-step textarea, .rq-steps input").first();
    if (await step.count()) { await step.fill("Mix the cheese, the salt and the eggs."); await step.blur(); }
    await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(500);
    ok(await page.locator(".recipe-ask").count() === 0 && await page.getByRole("button", { name: "Edit recipe" }).count() === 1, "AC5: a change of the steps alone asks nothing");
    await page.context().close();
    // AC6: Save as a new recipe
    page = await open([DINNER]);
    await cheese(page, 250);
    await page.getByRole("button", { name: "Save as a new recipe" }).click(); await page.waitForTimeout(800);
    s = await st(page);
    const fresh = s.meals.find((m) => m.id !== "m-pie"), first = s.meals.find((m) => m.id === "m-pie");
    ok(s.meals.length === 2 && fresh && fresh.items[0].grams === 250 && first.items[0].grams === 500 && grams(s.feedback[0]) === "q125 p94 s1 e31" && await page.locator(".recipe-ask").count() === 0, "AC6: a new recipe with the change; the first stays; no meal asked about: " + (fresh?.title ?? ""));
    await page.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
