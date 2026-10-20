// JOURNEY INVARIANT (Milan, 20 October 2026, 00:06 to 00:16, story R24 on canvas board RS24): Today keeps the day in sight:
// a band for Today, Tomorrow and Earlier, each with its date, on top while you scroll through that day. Today holds the goal,
// the next meal, the plan, the meals and Getting to know you; Tomorrow its plan; Earlier the last few days. A planned meal
// whose time has passed asks under its row: Did you have it? I ate it logs it as planned, Change it opens the Plate for it,
// Skipped it closes it on purpose. A recipe put on the Plate presets What is it? from its foods, a one-portion recipe too.
// Never rewrite these lines to fit a change.
// Changed by story R24, 01:02 to 01:30 (Milan: the band sticking to the top looks weird; then it looks like the Plan tomorrow
// button, board RS26): the day is a header with a blue line under it, in the page. Everything else is unchanged.
// Changed by story DS7 N (Milan 11:26, board DS7): Earlier says the last two days; two day cards with the exact day, each
// opens that day in Plan; older days are in Plan. Added: DS6 L and M checks, Next is always a card, the cards' headings inside.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(from ? { from } : {}) }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4);
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1, "coach");
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8);
seed.items = []; seed.feedback = []; seed.meals = [crepes, sarma, pudding];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const planned = (m, source) => { const w = m.items.reduce((s, i) => s + i.grams, 0), r = Math.min(1, m.portion / w); const k = m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0) * r, p = m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0) * r; return { title: m.title, kcal: Math.round(k), protein: Math.round(p), source, mealId: m.id, items: m.items, portion: m.portion }; };
const PLAN = { "2026-10-19": { breakfast: planned(crepes, "mine"), lunch: planned(sarma, "mine"), dinner: planned(pudding, "coach") }, "2026-10-20": { breakfast: planned(crepes, "mine") } };
const U = "http://127.0.0.1:3240";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3240", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (at) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date(at));
    await page.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-12T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z" }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      localStorage.setItem("chefmealan-planned", JSON.stringify(plan));
      localStorage.setItem("seeded", "1"); }, [seed, PLAN]);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipes: [] }) }));
    await page.goto(U + "/"); await page.waitForTimeout(1500);
    await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(700);
    return page;
  };
  try {
    // ---- 13:00: the bands, their order; breakfast has passed, lunch is next ----
    const page = await open("2026-10-19T11:00:00Z");
    const bands = await page.locator(".day-band").allTextContents();
    ok(JSON.stringify(bands) === JSON.stringify(["TodayMonday, October 19", "TomorrowTuesday, October 20", "Earlierthe last two days"]), "three bands: " + bands.join(" | "));
    ok(await page.locator(".plan-day").count() === 0, "no small blue day line inside the cards");
    const st = await page.locator(".day-band").first().evaluate((e) => { const c = getComputedStyle(e); return { pos: c.position, bg: c.backgroundColor, line: c.borderBottomColor, w: c.borderBottomWidth }; });
    ok(st.pos !== "sticky" && st.bg === "rgba(0, 0, 0, 0)" && st.line === "rgb(46, 123, 232)" && st.w === "3px", "the day is a header, not a button: no fill, a blue line under it, in the page");
    const order = await page.evaluate(() => { const at = (sel) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect().top + scrollY : -1; }; const bs = [...document.querySelectorAll(".day-band")].map((e) => e.getBoundingClientRect().top + scrollY); return { today: bs[0], plan: at("section.cooking"), know: at(".ft-know"), tomorrow: bs[1], tCard: at(".tomorrow-plan"), earlier: bs[2], days: at(".days .day-card") }; });
    ok(order.today < order.plan && order.plan < order.know && order.know < order.tomorrow && order.tomorrow < order.tCard && order.tCard < order.earlier && order.earlier < order.days, "Today (plan, Getting to know you), then Tomorrow, then Earlier (the last few days)");
    const asks = page.locator(".missed-ask");
    ok(await asks.count() === 1 && /07:30 has passed\. Did you have it\?/.test(await asks.first().textContent()), "breakfast, 07:30, has passed: Did you have it?; lunch, the next meal, does not ask");
    ok(JSON.stringify(await asks.first().getByRole("button").allTextContents()) === JSON.stringify([" I ate it", "Change it", "Skipped it"]) || /I ate it.*Change it.*Skipped it/.test((await asks.first().getByRole("button").allTextContents()).join("|")), "I ate it, Change it, Skipped it");
    await asks.first().getByRole("button", { name: /I ate it/ }).click(); await page.waitForTimeout(600);
    const log = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).feedback.map((f) => `${f.meal.title}:${f.slot?.slotId}`));
    ok(log.includes("DaaM good protein crêpes:breakfast") && await page.locator(".missed-ask").count() === 0, "I ate it logs breakfast as planned; the question goes");
    // ---- 21:40: dinner has passed; Skipped it closes it on purpose ----
    const p2 = await open("2026-10-19T19:40:00Z");
    const a2 = p2.locator(".missed-ask");
    ok(await a2.count() === 3, "21:40: breakfast, lunch and dinner ask");
    await p2.locator(".missed-ask").filter({ hasText: "20:00" }).getByRole("button", { name: "Skipped it" }).click(); await p2.waitForTimeout(500);
    ok(/Skipped on purpose/.test(await p2.locator(".plan-slot-skipped").first().textContent()) && await p2.locator(".missed-ask").count() === 2, "Skipped it: dinner is skipped on purpose, with Undo");
    // ---- DS6 L and M, DS7 N: Next stays a card when the day is done; the three cards; the two day cards open that day ----
    const nx = p2.locator(".next-meal .next-planned").first();
    ok(await nx.count() === 1 && /Next: /.test(await nx.textContent()) && await nx.locator(".button-row button").count() >= 1, "L: Next is a card with its heading inside and its buttons, at 21:40 too: " + (await nx.textContent()).replace(/\s+/g, " ").slice(0, 80));
    ok(await p2.locator(".meals-card .card-head").filter({ hasText: "Today's meals" }).count() === 1 && await p2.locator(".meals-card").getByRole("button", { name: /Log a meal/ }).count() === 1 && await p2.locator("section.cooking .card-head").count() === 1, "M: What's in the plan and Today's meals have their heading inside; Log a meal is the meals card's button");
    const dc = p2.locator(".days .day-card");
    ok(await dc.count() === 2 && /^Yesterday, Sunday 18 October/.test((await dc.first().locator(".card-head").textContent()).trim()) && /^Saturday 17 October/.test((await dc.nth(1).locator(".card-head").textContent()).trim()), "N: two day cards, each with its exact day");
    ok(await p2.locator(".days").getByRole("button", { name: /Older days are in Plan/ }).count() === 1, "N: older days are one link to Plan");
    await dc.first().locator(".plan-row-link").click(); await p2.waitForTimeout(800);
    ok(/18 October/.test(await p2.locator("main").textContent()), "N: Yesterday's row opens that day in Plan");
    await p2.locator("nav button").filter({ hasText: "Today" }).click(); await p2.waitForTimeout(700);
    // ---- a one-portion recipe presets What is it? ----
    await p2.locator("nav button").filter({ hasText: "Plate" }).click(); await p2.waitForTimeout(700);
    await p2.getByLabel("What are you craving?").fill("pudding"); await p2.waitForTimeout(500);
    await p2.locator(".pick-row").filter({ hasText: "pudding" }).first().click(); await p2.waitForTimeout(900);
    ok(/ · Sweet, a DaaM/.test(await p2.locator(".plan-line").textContent()), "the quark pudding on the Plate: Sweet, a DaaM, preset from its foods");
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "ran to the end: " + e.message.split("\n")[0]); }
  finally { await b.close(); server.kill(); }
  console.log(fails.length ? `${fails.length} failed` : "all passed");
  process.exit(fails.length ? 1 : 0);
})();
