// DT178 (0.3.21, board Stories126; Coach Milan 31 October 00:08 Go): Chef Mealan's own calendar in Google. Me > Google
// Calendar, off at first: what goes in (Weigh in and Check-in off), what an event says, Connect. On: the calendar Chef
// Mealan is made and the next 14 days go in, names and times and a link, no numbers. A change goes across within seconds;
// Plan says so once; a shopping list gets Shop on; without a token one tap updates; a calendar link opens that day on Plan;
// Turn off removes the calendar or keeps it. Google is a stand-in here: an in-memory calendar answering the same API.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[160, food("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0)], [80, food("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
seed.items = []; seed.feedback = [];
seed.meals = [{ id: "m-bowl", title: "Chicken rice bowl", items, portion: 240, steps: ["Cook [[i:r|rice]] 12 minutes.", "Fry [[i:c|chicken]] 6 minutes."], stepsFor: items.map((i) => i.food.name), savedAt: "2026-10-28T10:00:00Z" }];
const LIFE = { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, wake: "early", bed: "mid", where: ["Cook at home"], diet: "Everything", alcohol: "Occasionally" };
const PORT = "3198", B = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  // the stand-in Google Calendar
  const cals = new Map(); let n = 0; const auths = new Set();
  const google = async (route) => {
    const req = route.request(), u = new URL(req.url()), m = req.method(), body = req.postData() ? JSON.parse(req.postData()) : null;
    auths.add(req.headers()["authorization"]);
    const send = (status, j) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: status === 204 ? "" : JSON.stringify(j) });
    if (m === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type", "access-control-allow-methods": "GET,POST,PUT,DELETE" } });
    if (m === "POST" && u.pathname.endsWith("/calendars")) { const id = `cal${++n}@group.calendar.google.com`; cals.set(id, { summary: body.summary, events: new Map() }); return send(200, { id }); }
    const parts = u.pathname.split("/").map(decodeURIComponent), cal = cals.get(parts[4]);
    if (!cal) return send(404, { error: { message: "Not Found" } });
    if (m === "DELETE" && parts.length === 5) { cals.delete(parts[4]); return send(204); }
    const eid = parts[6];
    if (m === "GET") return send(200, { items: [...cal.events.values()].filter((e) => e.status !== "cancelled") });
    if (m === "POST") { if (cal.events.has(body.id)) return send(409, { error: { message: "exists" } }); cal.events.set(body.id, body); return send(200, body); }
    if (m === "PUT") { cal.events.set(eid, body); return send(200, body); }
    if (m === "DELETE") { const e = cal.events.get(eid); if (!e) return send(404, {}); e.status = "cancelled"; return send(204); }
    return send(400, {});
  };
  const live = () => { const c = [...cals.values()][0]; return c ? [...c.events.values()].filter((e) => e.status !== "cancelled") : []; };
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route("https://www.googleapis.com/calendar/v3/**", google);
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-10-30T18:40:00") });
    await page.addInitScript(([s, life]) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-region", "munich");
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z", aiConfirmedAt: "2026-10-05T08:00:00Z" }));
        localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T08:00:00Z", source: "profile" }));
        localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: life,
          plan: [{ work: true, kind: "strength", intensity: "hard", at: "17:30", minutes: 60 }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: false, kind: "rest" }, { work: false, kind: "rest" }] }));
        localStorage.setItem("chefmealan-planned", JSON.stringify({ "2026-11-02": { dinner: { title: "Chicken rice bowl", kcal: 520, protein: 46, source: "mine", mealId: "m-bowl", items: s.meals[0].items, portion: 240 } } }));
        sessionStorage.setItem("seeded", "1");
      }
      if (!sessionStorage.getItem("no-token")) window.__cmCalendarToken = "test-token";
    }, [seed, LIFE]);
    await require("./adult.cjs")(page);
    const me = async () => { await page.goto(B + "/"); await page.waitForTimeout(900); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300); await page.getByRole("button", { name: /^Me\b/ }).first().click(); await page.waitForTimeout(500); };
    const personal = () => page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal") || "{}"));
    await me();
    const row = page.locator(".menu-row").filter({ hasText: "Google Calendar" });
    ok(await row.count() === 1 && /Off\./.test(await row.textContent()), "Me: Google Calendar, off");
    const order = await page.locator(".me-rows .menu-row b").allTextContents();
    ok(order.indexOf("Google Calendar") === order.indexOf("Training week") + 1, "under Training week: " + order.join(", "));
    await row.click(); await page.waitForTimeout(500);
    ok(/\/me\/calendar$/.test(page.url()), "its own address, /me/calendar");
    const sw = async (name) => (await page.getByRole("switch", { name: new RegExp(`^${name}`) }).getAttribute("aria-checked")) === "true";
    ok(await sw("Meals") && await sw("Cooking") && await sw("Training") && await sw("Shopping") && !(await sw("Weigh in")) && !(await sw("Check-in")) && await sw("The dish's name"), "what goes in: meals, cooking, training, shopping on; weigh in and check-in off; the dish's name on");
    ok(/Never kcal, protein, your goal/.test(await page.locator("main").textContent()), "what an event says");
    const hs = await page.locator(".cal-kind, .cal-connect").evaluateAll((bs) => bs.map((x) => Math.round(x.getBoundingClientRect().height)));
    ok(hs.every((h) => h >= 44), "every control 44 px or more: " + hs.join(","));
    await page.getByRole("button", { name: "Connect Google Calendar" }).click(); await page.waitForTimeout(1500);
    const p1 = await personal();
    ok(p1.calendar && p1.calendar.on === true && /^cal1@/.test(p1.calendar.id), "on, with the calendar's id kept");
    ok([...cals.values()][0]?.summary === "Chef Mealan", "a calendar of its own, called Chef Mealan");
    ok([...auths].every((a) => a === "Bearer test-token"), "every call carries the token");
    const ev = live(), names = ev.map((e) => `${e.start.dateTime || e.start.date} ${e.summary}`);
    ok(names.some((x) => /^2026-10-30T\d\d:\d\d:00 Dinner$/.test(x)), "tonight's dinner is in: " + names.filter((x) => x.startsWith("2026-10-30")).join(" | "));
    ok(names.includes("2026-11-02T17:30:00 Strength") || names.some((x) => x.startsWith("2026-11-02T17:30:00")), "Monday's training at 17:30");
    ok(names.some((x) => /^2026-11-02T\d\d:\d\d:00 Dinner · Chicken rice bowl$/.test(x)) && names.some((x) => /^2026-11-02T\d\d:\d\d:00 Cook dinner · Chicken rice bowl$/.test(x)), "Monday: dinner with its dish, and cooking before it");
    ok(!names.some((x) => /Weigh in|check-in/i.test(x)), "no weigh in, no check-in");
    ok(ev.every((e) => /^Open in Chef Mealan: http:\/\/127\.0\.0\.1:\d+\/plan\?day=\d{4}-\d{2}-\d{2}$/.test(e.description) && !/kcal|protein/i.test(e.summary + e.description)), "each event: a link to the day, no numbers");
    const days = new Set(ev.map((e) => (e.start.dateTime || e.start.date).slice(0, 10)));
    ok(days.size === 14 && days.has("2026-10-30") && days.has("2026-11-12") && !days.has("2026-11-13"), "the next 14 days: " + days.size);
    ok(/On/.test(await page.locator(".cal-on").textContent()) && /The next 14 days are in it/.test(await page.locator(".cal-on").textContent()), "the page says on, 14 days");
    // a change goes across within seconds
    const before = live().length;
    await page.getByRole("switch", { name: /^The dish's name/ }).click(); await page.waitForTimeout(2500);
    ok(live().some((e) => e.summary === "Dinner" && e.start.dateTime.startsWith("2026-11-02")) && live().some((e) => e.summary === "Cook dinner"), "the dish's name off: Dinner and Cook dinner, within seconds");
    await page.getByRole("switch", { name: /^Weigh in/ }).click(); await page.waitForTimeout(2500);
    ok(live().filter((e) => e.summary === "Weigh in").length === 14 && live().length === before + 14, "weigh in on: one a day, before breakfast");
    await page.getByRole("switch", { name: /^Weigh in/ }).click(); await page.waitForTimeout(2500);
    ok(live().filter((e) => e.summary === "Weigh in").length === 0, "weigh in off again: taken out");
    // Plan says it once, at the top
    await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(600);
    ok(await page.locator(".cal-line").count() === 1 && /Also in your Google Calendar, 14 days ahead/.test(await page.locator(".cal-line").textContent()), "Plan: also in your Google Calendar");
    // a shopping list gets Shop on
    await page.locator(".plan-shop").click(); await page.waitForTimeout(600);
    const make = page.locator(".shop-make");
    if (await make.count()) { await make.click(); await page.waitForTimeout(600); }
    const shopOn = page.getByLabel(/Shop on, shopping list 1/);
    ok(await shopOn.count() === 1, "the list has Shop on");
    if (await shopOn.count()) {
      await shopOn.fill("2026-11-07T10:00"); await page.waitForTimeout(2500);
      ok(live().some((e) => e.summary === "Shopping list 1" && e.start.dateTime === "2026-11-07T10:00:00"), "Shopping list 1, Saturday 10:00, in the calendar");
    }
    // a link from the calendar opens that day on Plan
    await page.goto(B + "/plan?day=2026-11-02"); await page.waitForTimeout(900);
    ok(/Monday, 2 November/.test(await page.locator(".plan-day-head").first().textContent()), "the calendar's link opens Monday on Plan");
    // the hour is over: one tap brings it up to date
    await page.evaluate(() => sessionStorage.setItem("no-token", "1"));
    await me(); await page.locator(".menu-row").filter({ hasText: "Google Calendar" }).click(); await page.waitForTimeout(500);
    await page.getByRole("switch", { name: /^Training/ }).click(); await page.waitForTimeout(2500);
    ok(live().some((e) => e.start.dateTime === "2026-11-02T17:30:00"), "without a token nothing goes across by itself");
    await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(600);
    const up = page.getByRole("button", { name: "Update Google Calendar" });
    ok(await up.count() === 1 && /One tap brings the next 14 days up to date/.test(await page.locator(".cal-line").textContent()), "Plan: Update Google Calendar");
    ok(Math.round((await up.boundingBox()).height) >= 44, "the button is 44 px or more");
    await page.evaluate(() => { window.__cmCalendarToken = "test-token"; });
    await up.click(); await page.waitForTimeout(1500);
    ok(!live().some((e) => e.start.dateTime === "2026-11-02T17:30:00") && /Also in your Google Calendar/.test(await page.locator(".cal-line").textContent()), "one tap: training taken out, the line is back");
    // Turn off: remove the calendar (a new hour: the token is back)
    await page.evaluate(() => sessionStorage.removeItem("no-token"));
    await me(); await page.locator(".menu-row").filter({ hasText: "Google Calendar" }).click(); await page.waitForTimeout(500);
    await page.locator(".cal-off").getByRole("button", { name: "Turn off" }).click(); await page.waitForTimeout(300);
    ok(await page.getByRole("button", { name: "Remove the Chef Mealan calendar" }).count() === 1 && await page.getByRole("button", { name: "Keep it as it is" }).count() === 1, "Turn off asks: remove, or keep");
    await page.getByRole("button", { name: "Remove the Chef Mealan calendar" }).click(); await page.waitForTimeout(1200);
    const p2 = await personal();
    ok(cals.size === 0 && p2.calendar.on === false && !p2.calendar.id, "removed from Google; off");
    ok(p2.calendar.kinds && p2.calendar.kinds.training === false, "the kinds you chose are kept for next time");
    await me();
    ok(/Off\./.test(await page.locator(".menu-row").filter({ hasText: "Google Calendar" }).textContent()), "Me says off again");
    await page.goto(B + "/privacy"); await page.waitForTimeout(700);
    ok(/Google Calendar, only if you connect it/.test(await page.locator("main, body").first().textContent()), "the privacy notice says it");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } catch (e) { console.log("FAIL " + e.message); fail++; }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok"); process.exit(fail ? 1 : 0);
})();
