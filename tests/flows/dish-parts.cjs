// Dishes in parts, and optional foods inside them (0.2.19, canvas boards IM, IM15 to IM18; Milan 17 October 2026, 11:08 to 11:26).
// A protein cheesecake from Instagram, read by Chef Mealan (faked here: no AI key), in three parts with an optional chocolate
// in the topping: the plate in parts (IM15), Leave it out and Put it back (IM16b), Change one part (IM16), + Add inside a part,
// the steps part by part (IM17). Then a bowl of your own put into parts on the plate, kept with its parts (IM18, IM18b).
// Changed by story R21 (Milan 22:27, board RS20): one slice is the recipe divided by what it makes, from the exact grams, so
// the kcal read one lower (284, 175, 301). Everything else is unchanged.
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
const U = "http://127.0.0.1:3211";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3211", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (state) => {
    const page = await b.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-17T10:20:00"));
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
  const kcalOf = async (page) => Number((await text(page, ".plate-card .readout .readout-mid small")).match(/([\d,]+) kcal/)[1].replace(",", ""));
  const heads = (page) => page.locator(".plate-card .pt-h b").allTextContents();

  // ---- the cheesecake ----
  const page = await open(seed);
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }));
  let fit = null;
  await page.route("**/api/recipe/fit", (r) => {
    fit = JSON.parse(r.request().postData() || "{}");
    const c = (name, grams, change, role, calories, protein, extra = {}) => ({ name, grams, change, role, calories, protein, fats: null, carbs: null, ...extra });
    const g = Object.fromEntries(fit.items.map((i) => [i.name, i.grams]));
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ title: "Protein cheesecake", notes: ["Light cream cheese sets a little softer: chill the cake overnight."], items: [
      c("Digestive biscuits", g["Digestive biscuits"], "same", "base", 480, 7), c("Butter", g["Butter"], "same", "fat", 740, 0.7), c("Low-fat quark", g["Low-fat quark"], "same", "dairy", 67, 12),
      c("Cream cheese, light", g["Cream cheese"], "swap", "cheese", 150, 7.5, { was: "Cream cheese" }), c("Eggs", g["Eggs"], "same", "protein", 155, 13), c("Vanilla whey protein powder", g["Vanilla whey protein powder"], "same", "protein", 390, 78), c("Sweetener", g["Sweetener"], "same", "sweet", 0, 0), c("Raspberries", g["Raspberries"], "same", "fruit", 52, 1.2)] }) });
  });
  await page.goto(U + "/plate"); await page.waitForTimeout(1300);
  await page.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }]);
  await page.waitForTimeout(500); await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
  // R15 (Milan 15:55 to 16:16, board RS12): the plate now starts with the whole recipe; this journey picks the portion it had.
  await page.locator(".in-portion").getByRole("button", { name: "One slice, as the recipe makes it" }).click(); await page.waitForTimeout(500);
  ok(JSON.stringify(await heads(page)) === JSON.stringify(["Base", "Filling", "Topping"]), `IM15: the plate in the recipe's parts (${await heads(page)})`);
  const top = await text(page, '.plate-card [aria-label="Part: Topping"]');
  ok(/1 food, 1 optional/.test(top) && /Dark chocolate/.test(await text(page, ".plate-card .rows")) && await page.getByRole("button", { name: "Add Dark chocolate" }).count() === 1 && await page.locator(".pt-optlist").count() === 0, "IM15: the optional chocolate sits inside the topping, with + Add");
  const k0 = await kcalOf(page);
  ok(k0 === 284, `IM15: one slice, 284 kcal (${k0})`);
  // IM16b: Leave it out on the base, then Put it back
  await page.locator('.plate-card [aria-label="Part: Base"]').getByRole("button", { name: "Leave it out" }).click(); await page.waitForTimeout(400);
  ok(JSON.stringify(await heads(page)) === JSON.stringify(["Base, left out", "Filling", "Topping"]) && await kcalOf(page) === 175 && !/Digestive biscuits/.test(await text(page, ".plate-card .rows")), `IM16b: the base left out with its numbers: 175 kcal (${await kcalOf(page)})`);
  ok(await page.locator('.plate-card [aria-label="Part: Filling"]').getByRole("button", { name: "Leave it out" }).count() === 1, "IM16b: the filling can still go");
  await page.locator('.plate-card [aria-label="Part: Filling"]').getByRole("button", { name: "Leave it out" }).click(); await page.waitForTimeout(300);
  ok(await page.locator('.plate-card [aria-label="Part: Topping"]').getByRole("button", { name: "Leave it out" }).count() === 0, "IM16b: the last part with foods can't be left out");
  await page.getByRole("button", { name: "Put it back" }).first().click(); await page.getByRole("button", { name: "Put it back" }).first().click(); await page.waitForTimeout(400);
  ok(JSON.stringify(await heads(page)) === JSON.stringify(["Base", "Filling", "Topping"]) && await kcalOf(page) === k0, "IM16b: Put it back brings both back, as they were");
  // IM16: Change on the filling
  await page.locator('.plate-card [aria-label="Part: Filling"]').getByRole("button", { name: "Change" }).click(); await page.waitForTimeout(900);
  ok(fit && fit.part === "Filling" && fit.items.every((i) => i.part) && fit.servings === 1, "IM16: Chef Mealan gets the part to change and every food's part, at this plate's grams");
  ok((await heads(page))[1] === "Filling, changed" && /Cream cheese, light/.test(await text(page, ".plate-card .rows")) && /chill the cake overnight/.test(await text(page, ".plate-card .rows")) && await kcalOf(page) === 237, `IM16: the filling changed, with its note: 237 kcal (${await kcalOf(page)})`);
  ok(/Digestive biscuits/.test(await text(page, '.plate-card .pt-group:first-child')) && (await heads(page))[0] === "Base", "IM16: the base stays as the recipe makes it");
  await page.getByRole("button", { name: "Back to the original" }).first().click(); await page.waitForTimeout(400);
  ok(await kcalOf(page) === k0 && (await heads(page))[1] === "Filling", "IM16: Back to the original undoes it");
  // + Add inside a part: one slice's share
  await page.getByRole("button", { name: "Add Dark chocolate" }).click(); await page.waitForTimeout(400);
  ok(/Dark chocolate/.test(await text(page, '.plate-card .pt-group:nth-child(3)')) && /optional, added/.test(await text(page, ".plate-card .rows")) && await kcalOf(page) === 301, `IM12b: the chocolate in the topping, 3 g: 301 kcal (${await kcalOf(page)})`);
  // IM17: the steps part by part, on the recipe page
  let stepsReq = null;
  await page.route("**/api/steps", (r) => { stepsReq = JSON.parse(r.request().postData() || "{}"); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    steps: ["Crush {1} and mix with {2}, melted; press into a tin.", "Heat the oven to 160 °C.", "Beat {3}, {4}, {5}, {6} and {7} until smooth; pour over the base and bake 45 minutes.", "Chill 4 hours, then top with {8}. If you add the dark chocolate, melt it and drizzle it over."],
    marks: [{ kind: "same", why: "" }, { kind: "adapted", why: "320 °F in the original" }, { kind: "same", why: "" }, { kind: "added", why: "how long to chill it" }], parts: ["Base", "Filling", "Filling", "Topping"] }) }); });
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
  await page.getByText("Protein cheesecake", { exact: true }).last().click(); await page.waitForTimeout(900);
  ok(JSON.stringify(await page.locator(".rq-foods .rq-part").allTextContents()) === JSON.stringify(["Base", "Filling", "Topping"]), "IM15: the recipe page lists the foods in their parts");
  await page.getByRole("button", { name: /^(Draft the steps with Chef Mealan|Chef Mealan's way|Write the steps for my dish)$/ }).click(); await page.waitForTimeout(800);
  ok(stepsReq && stepsReq.items.every((i) => i.part) && stepsReq.optional?.[0]?.name === "Dark chocolate" && stepsReq.optional[0].part === "Topping", "IM17: Chef Mealan gets the parts and the optional chocolate in the topping");
  ok(JSON.stringify(await page.locator(".rq-steps .rp-step-part").allTextContents()) === JSON.stringify(["The base", "The filling", "The topping"]), "IM17: the steps part by part");
  await page.getByRole("button", { name: "Keep these steps" }).click(); await page.waitForTimeout(400);
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  ok(JSON.stringify(st.meals[0].stepParts) === JSON.stringify(["Base", "Filling", "Filling", "Topping"]) && st.meals[0].optional?.[0]?.part === "Topping", "IM17: the parts are kept with the steps; the optional chocolate with its part");
  await page.close();

  // ---- your own bowl, put into parts on the plate ----
  const items = [[0, 180], [1, 150], [2, 80], [3, 20], [4, 30]].map(([k, g]) => ({ id: `w${k}`, grams: g, locked: false, food: BOWL[k] }));
  const p2 = await open({ ...seed, foods: [...seed.foods, ...BOWL], items, title: "Burrito bowl" });
  await p2.goto(U + "/plate"); await p2.waitForTimeout(1300);
  const all = await kcalOf(p2);
  await p2.getByRole("button", { name: "Group into parts" }).click(); await p2.waitForTimeout(300);
  for (const name of ["Rice", "Chicken", "Toppings"]) { await p2.getByRole("button", { name: "New part" }).click(); await p2.getByLabel("Name of the new part").fill(name); await p2.getByLabel("Name of the new part").press("Enter"); await p2.waitForTimeout(150); }
  const pick = ["Rice", "Chicken", "Chicken", "Toppings", "Toppings"];
  for (let k = 0; k < 5; k++) { await p2.locator(".plate-card .rows select.pt-select").nth(k).selectOption(pick[k]); await p2.waitForTimeout(120); }
  await p2.locator(".plate-card .rows .swipe").nth(4).getByRole("button", { name: "Optional" }).click(); await p2.waitForTimeout(300);
  ok(await kcalOf(p2) === Math.round(all - 30 * 1.93), `IM18: Optional takes the sour cream out of the numbers (${await kcalOf(p2)})`);
  await p2.getByRole("button", { name: "Done" }).click(); await p2.waitForTimeout(400);
  ok(JSON.stringify(await heads(p2)) === JSON.stringify(["Rice", "Chicken", "Toppings"]) && /1 food, 1 optional/.test(await text(p2, '.plate-card [aria-label="Part: Toppings"]')) && await p2.getByRole("button", { name: "Add Sour cream" }).count() === 1, `IM18b: your bowl in its parts, the sour cream optional in Toppings (${await heads(p2)})`);
  // Keep it as it is, made, saved in My recipes with its parts
  await p2.getByRole("button", { name: /^(Keep it as it is|Lock the recipe)$/ }).click(); await p2.waitForTimeout(600);
  if (await p2.locator(".way").count()) await p2.locator(".way").first().click();
  await p2.getByRole("button", { name: /I'm making it|Lock the recipe|Continue/ }).click(); await p2.waitForTimeout(400);
  await p2.getByRole("button", { name: "On to How was it?" }).click(); await p2.waitForTimeout(400);
  await p2.getByRole("button", { name: "DaaM good" }).click();
  await p2.getByRole("button", { name: "Save", exact: true }).click(); await p2.waitForTimeout(600);
  const s2 = await p2.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const kept = s2.meals[0];
  ok(kept && JSON.stringify(kept.items.map((i) => i.part)) === JSON.stringify(["Rice", "Chicken", "Chicken", "Toppings"]) && kept.optional?.[0]?.name === "Sour cream" && kept.optional[0].part === "Toppings" && !s2.optional, "IM18b: the recipe keeps its parts and the optional sour cream; the plate is clear");
  await p2.locator("nav button").filter({ hasText: "Recipes" }).click(); await p2.waitForTimeout(700);
  await p2.getByText("Burrito bowl", { exact: true }).last().click(); await p2.waitForTimeout(900);
  await p2.getByRole("button", { name: "Make it", exact: true }).click(); await p2.waitForTimeout(1000);
  ok(JSON.stringify(await heads(p2)) === JSON.stringify(["Rice", "Chicken", "Toppings"]) && await p2.getByRole("button", { name: "Add Sour cream" }).count() === 1, "IM18b: next time it opens like this");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
