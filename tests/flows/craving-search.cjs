// JOURNEY INVARIANT (Milan, 18 October 2026, 23:04 to 23:34, story R17 on canvas board RS16): find what you crave. On an empty
// Plate, What are you craving? has its box. You type in your words: crêpes, sarma, chocolate PD 7+, tiramisu. The app looks
// first, at once: your recipes, Coach's, the members' and Chef Mealan's starters, and your foods, by name, food, part and taste;
// PD 7+ is a filter shown as a chip with ✕, and a dish under it is named, not hidden. A tap puts a dish on the plate. When
// nothing fits, Ask Chef Mealan for one, only on your tap: his idea, every number worked out by the app from its foods, is
// kept in My recipes as an idea, not made yet, at the top of Mine, until it is made once. Never rewrite these lines to fit a
// change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (n) => seed.foods.find((f) => f.name.startsWith(n));
const meal = (id, title, parts, n, unit, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(n > 1 ? { makes: { n, unit } } : {}), ...(from ? { from } : {}) }; };
seed.items = []; seed.feedback = [];
seed.meals = [meal("m1", "DaaM good protein crêpes", [["Eggs", 120], ["Milk", 250], ["Oats", 60], ["Whey", 30]], 4, "crêpes"), meal("m2", "Chocolate quark pudding", [["Quark", 250], ["Whey", 25], ["Nutella", 15], ["Milk", 50]], 1, "bowl", "coach"), meal("m3", "Chocolate banana oat bowl", [["Oats", 60], ["Milk", 250], ["Banana", 100], ["Nutella", 20]], 1, "bowl")];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const sf = (f) => ({ name: f.name, brand: f.brand, calories: f.calories, protein: f.protein, fats: f.fats, carbs: f.carbs, fiber: f.fiber, readyToEat: true });
const MEMBER = { id: "r1", title: "Chocolate protein mug cake", items: [{ id: "a", grams: 40, food: sf(F("Whey")) }, { id: "b", grams: 60, food: sf(F("Eggs")) }, { id: "c", grams: 10, food: sf(F("Nutella")) }], steps: [], kitchen: null, name: "Ana", cover: null, coverKind: "photo", sharedAt: "2026-10-15T10:00:00Z", updatedAt: "2026-10-15T10:00:00Z", made: 2 };
const IDEA = { title: "Protein tiramisu", why: "Coffee-soaked biscuits and a quark cream, like the real one.", items: [{ name: "Quark, low fat (Magerquark)", grams: 250, calories: 67, protein: 12, fats: 0.2, carbs: 4 }, { name: "Leibniz Butterkeks", grams: 30, calories: 470, protein: 7.6, fats: 14, carbs: 74 }, { name: "Whey protein powder", grams: 20, calories: 370, protein: 80, fats: 5, carbs: 5 }, { name: "Cocoa powder", grams: 5, calories: 228, protein: 20, fats: 14, carbs: 58 }] };
const U = "http://127.0.0.1:3234";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3234", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const asked = [];
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-18T15:30:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipes: [MEMBER] }) }));
    await page.route("**/api/crave", async (r) => { asked.push(JSON.parse(r.request().postData() || "{}")); const c = asked[asked.length - 1].craving; await new Promise((ok) => setTimeout(ok, 600)); return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ idea: /sarma/i.test(c) ? { ...IDEA, title: "Lean sarma", items: IDEA.items.slice(0, 2) } : IDEA }) }); });
    return page;
  };
  const state = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const text = (page, sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const group = (page, title) => page.locator(".crave > div").filter({ has: page.locator(".crave-group", { hasText: title }) });
  try {
    const page = await open();
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    const box = page.getByLabel("What are you craving?");
    ok(await box.count() === 1 && await box.getAttribute("placeholder") === "Crêpes, sarma, chocolate PD 7+…" && /Add PD 7\+ to keep only dishes at PD 7 or more/.test(await text(page, ".crave")), "an empty Plate: the box under What are you craving?, and what it finds");
    // crêpes: your own, with PD against your 6.4
    await box.fill("crepes"); await page.waitForTimeout(400);
    const mine = await text(page, ".crave");
    ok(/Your recipes/i.test(mine) && /DaaM good protein crêpes/.test(mine) && /fits/.test(mine) && asked.length === 0, "crepes finds your crêpes, accents or not, with PD and fits; Chef Mealan is not asked");
    // chocolate PD 7+: the chip; Coach's and the members'; the oat bowl named under the filter; foods under it said
    await box.fill("chocolate PD 7+"); await page.waitForTimeout(800);
    let t = await text(page, ".crave");
    ok(await page.getByRole("button", { name: "Remove the filter PD 7 and up" }).count() === 1, "PD 7+ is a filter, shown as a chip with ✕");
    ok(/Coach's recipes/i.test(t) && /Chocolate quark pudding/.test(t) && /Members' recipes/i.test(t) && /Chocolate protein mug cake/.test(t), "chocolate PD 7+: Coach's pudding and a member's mug cake");
    ok(/Under PD 7: 1 more dish, Chocolate banana oat bowl, PD 3\.\d/.test(t) && !/Chocolate banana oat bowl\d/.test(t), "the oat bowl under the filter is named, not hidden");
    ok(/No food of yours at PD 7 or more\. Nutella is PD 1\.2/.test(t), "no chocolate food reaches PD 7: said, with Nutella's PD");
    await page.getByRole("button", { name: "Show it" }).click(); await page.waitForTimeout(200);
    ok(await page.locator(".crave .pick-row").filter({ hasText: "Chocolate banana oat bowl" }).count() === 1, "Show it lists the dish under the filter");
    await page.getByRole("button", { name: "Remove the filter PD 7 and up" }).click(); await page.waitForTimeout(300);
    ok(await box.inputValue() === "chocolate" && await page.locator(".crave .pick-row").filter({ hasText: "Chocolate banana oat bowl" }).count() === 1, "✕ drops the filter: chocolate, every chocolate dish");
    // a member's recipe on the plate, at your portion
    await page.locator(".crave .pick-row").filter({ hasText: "Chocolate protein mug cake" }).click(); await page.waitForTimeout(800);
    const onPlate = (await state(page)).items.map((x) => x.food.name);
    ok(onPlate.length === 3 && onPlate.includes("Whey protein powder") && onPlate.includes("Nutella"), "a tap puts the member's dish on the plate, at your portion, as Make it does in Members: " + onPlate.join(", "));
    ok(await page.getByLabel("What are you craving?").count() === 0, "with a dish on the plate, the box steps aside");
    await page.context().close();

    // ---- sarma: Chef Mealan's starter; a tap asks him to make it from your foods ----
    const p2 = await open();
    await p2.goto(U + "/plate"); await p2.waitForTimeout(1300);
    await p2.getByLabel("What are you craving?").fill("sarma"); await p2.waitForTimeout(400);
    t = await text(p2, ".crave");
    ok(/Chef Mealan's starters/i.test(t) && /Sarma/.test(t) && /410 kcal · 21 g protein/.test(t) && /1\.3 under/.test(t), "sarma: Chef Mealan's starter, under your PD, still shown");
    // 0.2.46 (Milan 00:12): taps while Chef Mealan is thinking make no second idea; he says he is working
    const sarmaRow = p2.locator(".crave .pick-row").filter({ hasText: "Sarma" });
    await sarmaRow.click(); await p2.waitForTimeout(100);
    ok(/Chef Mealan is making an idea for Sarma/.test(await text(p2, ".crave")) && await sarmaRow.count() === 0, "while he thinks: Chef Mealan is making an idea for Sarma, and the rows are gone");
    await sarmaRow.click({ timeout: 300 }).catch(() => {}); await sarmaRow.click({ timeout: 300 }).catch(() => {});
    await p2.waitForTimeout(1200);
    ok(asked.length === 1 && asked[0].craving === "Sarma", "a starter has no foods: the tap asks Chef Mealan for it, once, however many taps");
    ok((await state(p2)).meals.filter((m) => m.idea).length === 1, "one idea kept, not one per tap");
    // tiramisu: nothing found; Chef Mealan only on the tap; the idea kept
    await p2.getByLabel("What are you craving?").fill("tiramisu"); await p2.waitForTimeout(400);
    t = await text(p2, ".crave");
    ok(/Nothing found/i.test(t) && /Nothing in your recipes, Coach's, the members' or your foods is tiramisu\./.test(t) && asked.length === 1, "tiramisu: nothing found, said plainly; nothing asked yet");
    await p2.getByRole("button", { name: "Ask Chef Mealan for one" }).click(); await p2.waitForTimeout(800);
    t = await text(p2, ".crave-idea");
    let st = await state(p2);
    const idea = st.meals.find((m) => m.title === "Protein tiramisu");
    const kcal = Math.round(idea.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0));
    ok(asked.length === 2 && asked[1].craving === "tiramisu" && Array.isArray(asked[1].library), "Ask Chef Mealan for one sends the craving and your foods");
    ok(!!idea?.idea && /Kept in My recipes as an idea, not made yet\./.test(t) && new RegExp(`One serving: ${kcal.toLocaleString("en")} kcal`).test(t), "the idea is kept as an idea; its numbers are worked out from its foods: " + kcal + " kcal");
    ok(idea.items.find((i) => /Quark/.test(i.food.name)).food.id === F("Quark").id && idea.items.find((i) => /Cocoa/.test(i.food.name)).food.brand === "estimate", "your own foods where you have them; the rest Chef Mealan's estimate");
    await p2.locator("nav button").filter({ hasText: "Recipes" }).click(); await p2.waitForTimeout(700);
    const first = await text(p2, ".recipe-tile");
    ok(/Protein tiramisu/.test(first) && /Chef Mealan's idea, not made yet/.test(first), "Recipes: the idea waits at the top of Mine, marked");
    // made once, it is a recipe like any other
    await p2.locator("nav button").filter({ hasText: "Plate" }).click(); await p2.waitForTimeout(500);
    await p2.getByLabel("What are you craving?").fill("tiramisu"); await p2.waitForTimeout(400);
    await p2.locator(".crave .pick-row").filter({ hasText: "Protein tiramisu" }).click(); await p2.waitForTimeout(800);
    await p2.getByRole("button", { name: /^Keep it as it is$/ }).first().click(); await p2.waitForTimeout(500);
    if (await p2.locator(".way").count()) { await p2.locator(".way").first().click(); await p2.waitForTimeout(200); await p2.getByRole("button", { name: /I'm making it this way/i }).click(); }
    else await p2.getByRole("button", { name: /^Continue$/ }).click();
    await p2.waitForTimeout(400);
    await p2.getByRole("button", { name: /On to How was it/i }).click(); await p2.waitForTimeout(300);
    await p2.getByRole("button", { name: /DaaM good/i }).click();
    await p2.getByRole("button", { name: /^Save$/ }).click(); await p2.waitForTimeout(700);
    st = await state(p2);
    ok(st.meals.filter((m) => m.title === "Protein tiramisu").length === 1 && !st.meals.find((m) => m.title === "Protein tiramisu").idea && st.feedback.some((f) => f.status === "eaten" && f.meal.title === "Protein tiramisu"), "made once: logged, and no longer an idea");
    await p2.context().close();
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
