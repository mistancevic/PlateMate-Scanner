// JOURNEY INVARIANT (Milan, 19 October 2026, 05:00 to 06:41, story R19 on canvas board RS18): one rule for meals on Today
// and Plan. A tap on a meal shows the meal: the next meal's card, today's and tomorrow's planned meals, Plan's slots, today's
// meals. A meal opened from a slot says which slot, with its buttons on top, and the way back (‹ Today, ‹ Plan). Actions are
// buttons on the card (I ate it, Change it) or a swipe, as on the Plate: left to Swap, right to Skip (on Plan: Empty); the
// swipe's actions are also buttons a screen reader reaches. A planned row has its photo, the slot and time in its line, the
// title as the link. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (n) => seed.foods.find((f) => f.name.startsWith(n));
const meal = (id, title, parts, n, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(from ? { from } : {}) }; };
const crepes = meal("m1", "DaaM good protein crêpes", [["Eggs", 240], ["Milk", 500], ["Oats", 120], ["Whey", 60]], 4);
const pudding = meal("m2", "Chocolate quark pudding", [["Quark", 250], ["Whey", 25], ["Nutella", 15], ["Milk", 50]], 1, "coach");
seed.items = []; seed.feedback = []; seed.meals = [crepes, pudding];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const planned = (m, source) => { const w = m.items.reduce((s, i) => s + i.grams, 0), r = Math.min(1, m.portion / w); const k = m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0) * r, p = m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0) * r; return { title: m.title, kcal: Math.round(k), protein: Math.round(p), source, mealId: m.id, items: m.items, portion: m.portion }; };
const U = "http://127.0.0.1:3236";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3236", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (plan) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-19T07:00:00"));
    await page.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      localStorage.setItem("chefmealan-planned", JSON.stringify(plan));
      localStorage.setItem("seeded", "1"); }, [seed, plan]);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    return page;
  };
  const text = (page, sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const at = async (page, t) => { await page.clock.setFixedTime(new Date(t)); await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(300); await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(500); };
  const swipe = require("./swipe.cjs");
  try {
    const page = await open({ "2026-10-19": { breakfast: planned(crepes, "mine"), lunch: planned(pudding, "coach") }, "2026-10-20": { breakfast: planned(crepes, "mine"), lunch: planned(pudding, "coach") } });
    await page.goto(U + "/"); await page.waitForTimeout(1300);
    // the next meal is a card: its buttons on it; a tap shows the meal, with its slot on top, and the way back
    const card = page.locator(".next-planned");
    ok(await card.getByRole("button", { name: "I ate it" }).count() === 1 && await card.getByRole("button", { name: "Change it", exact: true }).count() === 1 && await page.locator(".next-meal > .pill-wide").count() === 0, "the next meal's card carries I ate it and Change it; no wide button under it");
    await card.locator(".next-planned-text b").click(); await page.waitForTimeout(800);
    ok(/Breakfast, 07:30 · by the plan · today/.test(await text(page, ".rq-slot")) && await page.getByRole("button", { name: /Today$/ }).first().count() === 1 && /DaaM good protein crêpes/.test(await text(page, "main")), "a tap on the card shows the meal, its slot on top, ‹ Today");
    await page.locator(".rq-back").click(); await page.waitForTimeout(600);
    ok(/Next: breakfast/.test(await text(page, "main")), "‹ Today goes back to Today");
    // today's rows: photo, the slot in the line, the title; swipe actions also reachable as buttons
    const row = page.getByRole("button", { name: /Breakfast at 07:30, DaaM good protein crêpes/ });
    ok(await page.locator("section.cooking .plan-meal-row .meal-thumb").count() === 2 && await page.locator("section.cooking .plan-skip").count() === 0, "today's planned rows have their photo; Skip is not on the row");
    ok(await page.getByRole("button", { name: "Skip lunch on purpose", exact: true }).count() === 1 && await page.getByRole("button", { name: "Swap lunch", exact: true }).count() === 1, "a swipe's actions are also buttons a screen reader reaches");
    await row.click(); await page.waitForTimeout(800);
    await page.locator(".rq-slot").getByRole("button", { name: "I ate it" }).click(); await page.waitForTimeout(800);
    ok(/1 of 2 by the plan so far/.test(await text(page, ".logged-line")), "the row shows the meal; I ate it there logs it by the plan and comes back to Today");
    // today's meals: a tap on the card shows the recipe
    await page.locator(".log-card-open .card-top span").first().click(); await page.waitForTimeout(800);
    ok(/DaaM good protein crêpes/.test(await text(page, "main")) && /Today/.test(await text(page, ".rq-back")) && await page.locator(".rq-slot").count() === 0, "a meal eaten: a tap shows its recipe, ‹ Today, no slot");
    await page.locator(".rq-back").click(); await page.waitForTimeout(600);
    // a swipe right skips; it never opens the meal
    await swipe(page, page.getByRole("button", { name: /Lunch at 13:45, Chocolate quark pudding/ }), "right");
    ok(/Skipped on purpose/.test(await text(page, "section.cooking")) && /Next:/.test(await text(page, "main")), "swipe right skips lunch, and Today stays");
    // tomorrow: the meal with Swap it and Empty the slot; Empty goes back to Today
    await page.getByRole("button", { name: /Lunch tomorrow, Chocolate quark pudding/ }).click(); await page.waitForTimeout(800);
    ok(/Tuesday's lunch, 13:45 · in the plan/.test(await text(page, ".rq-slot")) && await page.locator(".rq-slot").getByRole("button", { name: "Swap it" }).count() === 1, "tomorrow's meal shows its slot: Swap it, Empty the slot");
    await page.locator(".rq-slot").getByRole("button", { name: "Empty the slot" }).click(); await page.waitForTimeout(700);
    ok(/Lunch, 13:45 ?Pick a meal/.test(await text(page, ".tomorrow-plan")), "Empty the slot: back on Today, tomorrow's lunch is open");
    // a swipe left swaps: Plan on that day, Pick a meal open for the slot
    await swipe(page, page.getByRole("button", { name: /Breakfast tomorrow, DaaM good protein crêpes/ }), "left");
    ok(await page.locator(".pick-sheet").count() === 1 && /Breakfast, 07:30/.test(await text(page, ".pick-sheet")) && /Tuesday, 20 October/.test(await text(page, "main")), "swipe left: Plan on Tuesday, Pick a meal open for breakfast");
    await page.locator(".pick-sheet").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(300);
    // Plan: the time in the line; a tap shows the meal, ‹ Plan; a swipe right empties
    ok(await page.locator(".plan-slot .plan-time").count() === 0 && /Breakfast, 07:30/.test(await text(page, ".plan-slot-set")), "Plan: the slot's time is in its line, no column");
    await page.locator(".plan-slot-set").first().click(); await page.waitForTimeout(800);
    ok(/Tuesday's breakfast, 07:30 · in the plan/.test(await text(page, ".rq-slot")) && /Plan/.test(await text(page, ".rq-back")), "a tap on Plan shows the meal, its slot, ‹ Plan");
    await page.locator(".rq-back").click(); await page.waitForTimeout(600);
    await swipe(page, page.locator(".plan-slot-set").first(), "right");
    // Changed by story SL2 (Milan 16:03 to 16:11, board SL2): the open slots are in the day's line in the head card at the top
    ok(await page.locator(".plan-slot-set").count() === 0 && /3 slots open/.test(await text(page, ".plan-head .plan-day-head small")), "swipe right on Plan empties the slot");
    await page.context().close();
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
