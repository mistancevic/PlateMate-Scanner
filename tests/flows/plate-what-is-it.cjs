// JOURNEY INVARIANT (Milan, 19 October 2026, 22:27 to 23:15, story R22 on canvas board RS21): What is it? on the Plate, in
// place of Meal or Dessert: Savoury, Sweet, a DaaM (Dessert as a Meal) or Both. Each is a full meal; a small thing is a Snack.
// Picked, the line says it, and what is offered follows it on a plate of your own too: Savoury holds sweet foods back, a DaaM
// savoury ones, Both nothing, and Both puts a main and a sweet finish on the plate as two parts. Nothing picked, everything is
// offered. Sweet or DaaM in a craving sets it. On Me, the taste is chips (Vanilla and Chocolate among them) and your own words;
// Chef Mealan gets the chips in their fixed words. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.feedback = []; seed.meals = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const U = "http://127.0.0.1:3239";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3239", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [], asked = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-19T17:30:00Z"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipes: [] }) }));
    await page.route("**/api/crave", (r) => { asked.push(JSON.parse(r.request().postData() || "{}")); return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ error: "no-idea", message: "Chef Mealan has no idea for that right now. Try other words." }) }); });
    await page.goto(U + "/"); await page.waitForTimeout(1500);

    // ---- Me: the taste as chips ----
    await page.getByRole("button", { name: "Menu" }).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: /^Me\b/ }).first().click(); await page.waitForTimeout(700);
    const card = page.locator(".taste-card");
    ok(await card.getByRole("group", { name: "I like" }).getByRole("button", { name: "Vanilla" }).count() === 1 && await card.getByRole("group", { name: "I like" }).getByRole("button", { name: "Chocolate" }).count() === 1, "Me: I like has Vanilla and Chocolate");
    for (const [g, c] of [["I like", "Vanilla"], ["I like", "Chocolate"], ["I like", "Spicy"], ["Rather not", "Sour"], ["Rather not", "Spicy"], ["How I eat", "Quick to make"]]) { await card.getByRole("group", { name: g }).getByRole("button", { name: c }).click(); await page.waitForTimeout(150); }
    const chips = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).tasteChips);
    ok(JSON.stringify(chips) === JSON.stringify({ like: ["Vanilla", "Chocolate"], not: ["Sour", "Spicy"], how: ["Quick to make"] }), "the chips are kept; Spicy rather not clears Spicy liked: " + JSON.stringify(chips));
    await card.getByLabel("Your taste in your own words").fill("keep the chocolate flavour"); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Close/ }).first().click().catch(() => {}); await page.waitForTimeout(300);

    // ---- the Plate: What is it? ----
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Change what this plate is" }).click(); await page.waitForTimeout(400);
    const what = page.getByRole("radiogroup", { name: "What is it?" });
    ok(await what.getByRole("button").allTextContents().then((t) => t.join("|")) === "Savoury|Sweet, a DaaM|Both", "What is it?: Savoury, Sweet, a DaaM, Both");
    ok(await page.getByRole("radiogroup", { name: "Kind of plate" }).count() === 0 && await page.locator("main button", { hasText: /^Dessert$/ }).count() === 0, "Meal or Dessert is gone; a small thing is a Snack");
    ok(/Nothing picked: everything is offered/.test(await page.locator(".taste-hint").textContent()), "nothing picked: everything is offered");
    const search = page.getByLabel("Search all my foods");
    const shown = async (q) => { await search.fill(q); await page.waitForTimeout(300); return page.locator(".rows .row-food").filter({ hasText: q }).count(); };
    ok(await shown("Nutella") > 0, "nothing picked: Nutella is offered");
    await what.getByRole("button", { name: "Savoury" }).click(); await page.waitForTimeout(300);
    const line = () => page.locator(".plan-line").textContent();
    ok(/· Savoury$/.test((await line()).trim().replace(/Done$/, "").trim()) || / · Savoury/.test(await line()), "the line says Savoury");
    ok(await shown("Nutella") === 0 && /Nutella is in your foods, but it doesn't go with this dish/.test(await page.locator(".held-back").textContent()), "Savoury holds Nutella back on a plate of your own, and says so");
    await what.getByRole("button", { name: "Sweet, a DaaM" }).click(); await page.waitForTimeout(300);
    ok(/ · Sweet, a DaaM/.test(await line()) && /tastes like dessert/.test(await page.locator(".taste-hint").textContent()), "Sweet, a DaaM: the line and the hint");
    ok(await shown("Chicken") === 0 && await shown("Nutella") > 0, "a DaaM holds chicken back and offers Nutella");
    await what.getByRole("button", { name: "Sweet, a DaaM" }).click(); await page.waitForTimeout(300);
    ok(!/DaaM/.test(await line()) && await shown("Chicken") > 0, "a tap on the one picked clears it: everything offered again");

    // ---- Both: a main and a sweet finish ----
    await what.getByRole("button", { name: "Both" }).click(); await page.waitForTimeout(300);
    ok(/ · Savoury and sweet/.test(await line()), "Both: the line says Savoury and sweet");
    await search.fill("Chicken"); await page.waitForTimeout(300);
    await page.locator(".rows .row-food").filter({ hasText: "Chicken" }).first().getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(600);
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(500);
    await page.getByLabel("Search all my foods").fill("Vanilla ice"); await page.waitForTimeout(300);
    await page.locator(".rows .row-food").filter({ hasText: "Vanilla ice cream" }).first().getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(600);
    const parts = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.map((i) => `${i.food.name}:${i.part}`));
    ok(parts.includes("Chicken breast, cooked:Main") && parts.includes("Vanilla ice cream:Sweet finish"), "Both: the chicken in Main, the ice cream in Sweet finish: " + parts.join(", "));

    // ---- a craving sets it; Chef Mealan gets the chips ----
    await page.locator(".plate-empty-link").click(); await page.waitForTimeout(200); await page.locator(".plate-empty-link").click(); await page.waitForTimeout(600);
    await page.getByLabel("What are you craving?").fill("chocolate daam"); await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Add Nutella" }).first().click(); await page.waitForTimeout(700);
    ok(/ · Sweet, a DaaM/.test(await page.locator(".plan-line").textContent()), "chocolate daam, Nutella taken: the plate is a DaaM");
    await page.locator(".plate-empty-link").click(); await page.waitForTimeout(200); await page.locator(".plate-empty-link").click(); await page.waitForTimeout(600);
    await page.getByLabel("What are you craving?").fill("tiramisu"); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Ask Chef Mealan for one" }).click(); await page.waitForTimeout(700);
    const t = asked[0]?.tastes;
    ok(t && JSON.stringify(t.likes) === JSON.stringify(["Vanilla", "Chocolate"]) && JSON.stringify(t.rather_not) === JSON.stringify(["Sour", "Spicy"]) && t.own_words === "keep the chocolate flavour", "Chef Mealan is asked with the chips and your words: " + JSON.stringify(t));
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "ran to the end: " + e.message.split("\n")[0]); }
  finally { await b.close(); server.kill(); }
  console.log(fails.length ? `${fails.length} failed` : "all passed");
  process.exit(fails.length ? 1 : 0);
})();
