// JOURNEY (0.2.131, DT150, rule C52, board Stories102; Coach Milan 29 October 00:19 to 00:24, Go at 08:33): a dish keeps its
// proportions. A baked cheesecake cup of your own, no parts: the Plate asks Is this one dish?, with the parts suggested (base:
// oats, butter; filling: quark, eggs, honey; topping: strawberries). Grouped, Fit sizes the filling as a whole, quark to egg
// kept, the base and the topping stay; Undo puts the grams back. The steps, written for quark, say so when quark is swapped
// for Greek yogurt, with Redraft; a change of amounts keeps them. The culinary gate reads the dish with its amounts and parts
// and says when it won't hold.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const F2 = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "typical values", source: "estimate", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, table: undefined, icon: undefined });
const BU = F2("butter", "Butter", 741, 0.7, 82, 0.6), ST = F2("straw", "Strawberries", 32, 0.7, 0.3, 7.7);
seed.foods = [...seed.foods, BU, ST];
const id = (re) => seed.foods.find((f) => re.test(f.name)).id;
const PORT = "3323", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  try {
    const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-29T19:40:00"));
    await page.addInitScript(([s]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, kitchens: ["Balkan"], lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 4 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed]);
    await require("./adult.cjs")(page);
    let dishBody = null;
    await page.route("**/api/dish", async (r) => { dishBody = JSON.parse(r.request().postData() || "{}"); const q = dishBody.foods.find((f) => /Quark/.test(f.name)); r.fulfill({ json: { makesIt: true, why: "A baked cheesecake cup: a base, a filling, fruit on top.", around: "", betterAs: "dessert", holds: q && q.grams >= 300 ? "The filling will not set: 380 g of quark with one egg stays soft. Use two eggs, or 200 g of quark." : "" } }); });
    await page.route("**/api/steps", (r) => r.fulfill({ json: { steps: ["Heat the oven to 180 °C. Melt {2} and mix it with {1}; press it into two cups.", "Whisk {3}, {4} and {5} smooth and pour it over the base.", "Bake for 25 minutes, until set at the edge.", "Top with {6}."] } }));
    const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
    const put = async (its, title) => { await page.goto(U + "/"); await page.waitForTimeout(600); await page.evaluate(([its, title]) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = its.map(([id, g, part], k) => ({ id: "i" + k, food: s.foods.find((f) => f.id === id), grams: g, locked: false, ...(part ? { part } : {}) })); s.title = title; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, [its, title]); await page.reload(); await page.waitForTimeout(800); await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(1200); };
    const cup = [[id(/^Oats/), 80], [BU.id, 20], [id(/^Quark/), 100], [id(/^Eggs/), 50], [id(/^Honey/), 15], [ST.id, 80]];
    await put(cup, "Baked cheesecake cup");
    // Is this one dish?
    const q = page.getByRole("group", { name: "Is this one dish?" });
    ok(await q.count() === 1, "a cooked plate of your own with no parts asks: Is this one dish?");
    const sug = (await q.locator(".one-dish-parts").textContent()).replace(/\s+/g, " ");
    ok(/Base: oats, butter/.test(sug) && /Filling: quark, eggs, honey/i.test(sug) && /Topping: strawberries/.test(sug), "the parts suggested: " + sug);
    await q.getByRole("button", { name: "Group it like this" }).click(); await page.waitForTimeout(500);
    let s = await st();
    const partOf = (re) => s.items.find((i) => re.test(i.food.name))?.part;
    ok(partOf(/^Oats/) === "Base" && partOf(/^Butter/) === "Base" && partOf(/^Quark/) === "Filling" && partOf(/^Eggs/) === "Filling" && partOf(/^Honey/) === "Filling" && partOf(/^Straw/) === "Topping", "grouped: base, filling, topping");
    ok(await page.getByRole("group", { name: "Is this one dish?" }).count() === 0, "the question goes once it is answered");
    // Fit sizes the filling as a whole
    const g = (re) => s.items.find((i) => re.test(i.food.name)).grams;
    const q0 = g(/^Quark/), e0 = g(/^Eggs/);
    await page.getByRole("button", { name: /Fit to my target/ }).click(); await page.waitForTimeout(1200);
    s = await st();
    ok(g(/^Oats/) === 80 && g(/^Butter/) === 20 && g(/^Straw/) === 80, "the base and the topping stay");
    ok(g(/^Quark/) > q0 && Math.abs(g(/^Quark/) / g(/^Eggs/) - q0 / e0) < 0.25, `the filling grows as a whole, quark to egg kept: ${g(/^Quark/)} to ${g(/^Eggs/)}`);
    const note = (await page.locator(".fit-note").textContent()).replace(/\s+/g, " ");
    ok(/Fit sized the filling as a whole/.test(note) && /keep their proportions/.test(note) && /The base and topping stay/.test(note), "the line says what Fit did: " + note);
    await page.locator(".fit-note").getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(400);
    s = await st();
    ok(g(/^Quark/) === q0 && g(/^Eggs/) === e0, "Undo puts the filling back");
    // the culinary gate read the dish with its amounts and parts
    ok(dishBody && dishBody.cooked === true && dishBody.foods.some((f) => f.part === "Filling"), "Chef Mealan reads the dish with its parts and amounts");
    // the steps: drafted, then out of date when a food changes; a change of amounts keeps them
    const draft = page.getByRole("button", { name: /Draft the steps with Chef Mealan/ });
    if (await draft.count()) { await draft.click(); await page.waitForTimeout(800); }
    ok(/Heat the oven to 180 °C/.test(await page.locator(".plate-steps").textContent()), "the steps are on the Plate, for a dish in parts too");
    await page.getByRole("button", { name: /Fit to my target/ }).click(); await page.waitForTimeout(1000);
    ok(await page.locator(".steps-stale").count() === 0 && /Heat the oven/.test(await page.locator(".plate-steps").textContent()), "a change of amounts keeps the steps");
    // swap quark for Greek yogurt
    const row = page.locator(".swipe-fg").filter({ hasText: "Quark" }).first(); const bb = await row.boundingBox();
    // the swipe starts on the food's line: the name and the amount are a button and a field
    await row.scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
    const line = await row.locator(".row-text small").first().boundingBox();
    const x0 = line.x + line.width - 10, y0 = line.y + line.height / 2;
    await page.mouse.move(x0, y0); await page.mouse.down();
    for (let k = 1; k <= 10; k++) await page.mouse.move(x0 - k * 11, y0);
    await page.mouse.up(); await page.waitForTimeout(800);
    await page.locator(".sheet .row-button").filter({ hasText: "Greek yogurt" }).first().click(); await page.waitForTimeout(700);
    const stale = page.locator(".steps-stale");
    ok(await stale.count() === 1 && /Quark.* out/.test(await stale.textContent()) && /Greek yogurt/.test(await stale.textContent()), "the steps say the foods changed: " + (await stale.textContent()));
    ok(await page.getByRole("button", { name: "Redraft for these foods" }).count() === 1 && await page.getByRole("button", { name: "Keep them" }).count() === 1, "Redraft for these foods, or Keep them");
    await page.getByRole("button", { name: "Keep them" }).click(); await page.waitForTimeout(300);
    ok(await page.locator(".steps-stale").count() === 0, "Keep them: the steps stand for these foods");
    // the dish that won't hold
    await put([[id(/^Oats/), 80, "Base"], [BU.id, 20, "Base"], [id(/^Quark/), 380, "Filling"], [id(/^Eggs/), 50, "Filling"], [id(/^Honey/), 15, "Filling"], [ST.id, 80, "Topping"]], "Baked cheesecake cup");
    await page.waitForTimeout(800);
    ok(/The dish won't hold/.test(await page.locator(".gate-card").textContent()) && /The filling will not set/.test(await page.locator(".gate-card").textContent()), "Chef Mealan says the filling won't set, and how to fix it");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
