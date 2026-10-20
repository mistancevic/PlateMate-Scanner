// JOURNEY INVARIANT (Milan, 18 October 2026, 23:22 to 19 October 00:05, story R18 on canvas board RS17): Today says which
// day it is, Today: Monday, October 19, in What's in the plan. Under today's meals, the same card for tomorrow: Tomorrow:
// Tuesday, October 20, with its slots and meals. When tomorrow is planned it says Check tomorrow, else Plan tomorrow; so does
// the main button when the day is done; both open Plan on tomorrow. Today went by the plan, and the day's record, only when
// no slot of today is still to come; until then: Breakfast eaten, by the plan, and the open slots. Never rewrite these lines
// to fit a change.
// Changed by story R24 (Milan 00:06 to 00:16, board RS24): the day is said in its band, Today or Tomorrow with the date, not
// as a line inside the card. Everything else is unchanged.
// Changed by story DS rule D (Milan 07:06 to 07:30, boards DS1 and DS2): Today has no wide button, so there is no main
// button when the day is done; the Tomorrow card's row says Check tomorrow or Plan tomorrow and opens Plan on tomorrow.
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
const U = "http://127.0.0.1:3235";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3235", GEMINI_API_KEY: "" }, stdio: "ignore" });
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
  try {
    const page = await open({ "2026-10-19": { breakfast: planned(crepes, "mine") }, "2026-10-20": { breakfast: planned(crepes, "mine"), lunch: planned(pudding, "coach") } });
    await page.goto(U + "/"); await page.waitForTimeout(1300);
    ok(/^TodayMonday, October 19$/.test((await page.locator(".day-band").first().textContent()).trim()), "Today says which day, in its band: Today, Monday, October 19");
    const tm = await text(page, ".tomorrow-plan");
    ok(/^TomorrowTuesday, October 20$/.test((await page.locator(".day-band").nth(1).textContent()).trim()) && /Breakfast, 07:30 ?DaaM good protein crêpes/.test(tm) && /Lunch, 13:45 ?Chocolate quark pudding/.test(tm) && /Dinner, 20:00 ?Pick a meal ?One slot open/.test(tm), "the Tomorrow card: its slots and meals, an open slot as Pick a meal: " + tm.slice(0, 160));
    ok(/Check tomorrow ?2 of 3 planned · Plan, Tuesday/.test(tm), "tomorrow is planned: Check tomorrow");
    ok(await page.evaluate(() => { const meals = [...document.querySelectorAll("p.label")].find((x) => x.textContent === "Today's meals"), t = document.querySelector(".tomorrow-plan"); return !!meals && !!t && Boolean(meals.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING); }), "the Tomorrow card sits under today's meals");
    // 10:00, breakfast eaten: lunch and dinner still to come, so the day has not gone by the plan yet
    await page.getByRole("button", { name: "I ate it", exact: true }).click(); await page.waitForTimeout(600);
    await at(page, "2026-10-19T10:00:00");
    let today = await text(page, "section.cooking");
    ok(/Breakfast eaten, by the plan\./.test(today) && /Lunch, Dinner ?Pick a meal/.test(today) && !/went/.test(today), "10:00: Breakfast eaten, by the plan; the open slots; not Today went by the plan");
    ok(await page.locator(".day-record").count() === 0 && /1 of 1 by the plan so far/.test(await text(page, ".logged-line")), "no record yet; the line says so far");
    // 23:00, the day is done
    await at(page, "2026-10-19T23:00:00");
    today = await text(page, "section.cooking");
    ok(/Today went by the plan/.test(today) && !/Tomorrow is/.test(today) && await page.locator(".day-record").count() === 1, "23:00: Today went by the plan, the record; the small tomorrow line is gone");
    ok(await page.locator(".next-meal .pill-wide").count() === 0 && await page.locator(".tomorrow-plan").getByRole("button", { name: /Check tomorrow/ }).count() === 1, "no wide button; the Tomorrow card: Check tomorrow");
    await page.locator(".tomorrow-plan").getByRole("button", { name: /Check tomorrow/ }).click(); await page.waitForTimeout(700);
    ok(/Tuesday, 20 October/.test(await text(page, "main")) && /Chocolate quark pudding/.test(await text(page, "main")), "it opens Plan on Tuesday");
    await page.context().close();
    // nothing planned for tomorrow
    const p2 = await open({ "2026-10-19": { breakfast: planned(crepes, "mine") } });
    await p2.goto(U + "/"); await p2.waitForTimeout(1300);
    ok(/^TomorrowTuesday, October 20$/.test((await p2.locator(".day-band").nth(1).textContent()).trim()) && /Plan tomorrow ?Nothing planned so far · Set Tuesday's meals/.test(await text(p2, ".tomorrow-plan")) && await p2.locator(".tomorrow-plan .plan-slot-row").count() === 0, "nothing planned tomorrow: Plan tomorrow, no slots");
    await at(p2, "2026-10-19T23:00:00");
    ok(await p2.locator(".next-meal .pill-wide").count() === 0 && await p2.locator(".tomorrow-plan").getByRole("button", { name: /Plan tomorrow/ }).count() === 1, "no wide button; the Tomorrow card says Plan tomorrow");
    await p2.locator(".tomorrow-plan").getByRole("button", { name: /Plan tomorrow/ }).click(); await p2.waitForTimeout(700);
    ok(/Tuesday, 20 October/.test(await text(p2, "main")), "Plan tomorrow opens Plan on Tuesday");
    await p2.context().close();
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
