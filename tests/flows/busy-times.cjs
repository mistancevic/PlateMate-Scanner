// DT179 and DT179a (0.3.23, boards Stories127 and Stories128; Coach Milan 31 October 09:07 Go): from your calendar to the
// app, and which meals go in. Read when I'm busy, off at first: busy times only, kept on the phone. Plan shows a busy block
// and asks where it meets the day: a meal in a meeting, a late evening, a full day, training. A meal moved in Google comes
// back. Which meals: every slot, or only the planned ones. Google is a stand-in: an in-memory calendar with busy times.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[160, food("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0)], [80, food("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
seed.items = []; seed.feedback = [];
seed.meals = [{ id: "m-bowl", title: "Chicken rice bowl", items, portion: 240, steps: ["Cook [[i:r|rice]] 12 minutes.", "Fry [[i:c|chicken]] 6 minutes."], stepsFor: items.map((i) => i.food.name), savedAt: "2026-10-28T10:00:00Z" }];
const LIFE = { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, wake: "early", bed: "mid", where: ["Cook at home"], diet: "Everything", alcohol: "Occasionally" };
const PORT = "3199", B = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  // the stand-in Google Calendar
  const cals = new Map(); let n = 0; const auths = new Set(); let inFlight = 0, most = 0, slowMs = 0; const fb = [];
  const google = async (route) => {
    const req = route.request(), u = new URL(req.url()), m = req.method(), body = req.postData() ? JSON.parse(req.postData()) : null;
    auths.add(req.headers()["authorization"]);
    const send = (status, j) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: status === 204 ? "" : JSON.stringify(j) });
    if (m === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type", "access-control-allow-methods": "GET,POST,PUT,DELETE" } });
    // the stand-in busy times: Monday 13:00 to 14:30, Wednesday 17:00 to 19:30, Thursday 08:00 to 20:00
    if (m === "POST" && u.pathname.endsWith("/freeBusy")) { fb.push(body); const B = (d, a, z) => ({ start: new Date(`${d}T${a}:00`).toISOString(), end: new Date(`${d}T${z}:00`).toISOString() });
      return send(200, { calendars: { primary: { busy: [B("2026-11-02", "13:00", "14:30"), B("2026-11-04", "17:00", "19:30"), B("2026-11-05", "08:00", "20:00")] } } }); }
    if (m === "POST" && u.pathname.endsWith("/calendars")) { const id = `cal${++n}@group.calendar.google.com`; cals.set(id, { summary: body.summary, events: new Map() }); return send(200, { id }); }
    const parts = u.pathname.split("/").map(decodeURIComponent), cal = cals.get(parts[4]);
    if (!cal) return send(404, { error: { message: "Not Found" } });
    if (m === "DELETE" && parts.length === 5) { cals.delete(parts[4]); return send(204); }
    const eid = parts[6];
    if (m === "GET") return send(200, { items: [...cal.events.values()].filter((e) => e.status !== "cancelled") });
    // 0.3.22: Google on a phone, slow: each new event takes a while; the most at once is counted
    if (m === "POST") { inFlight++; most = Math.max(most, inFlight); await new Promise((r) => setTimeout(r, slowMs)); inFlight--; }
    if (m === "POST") { if (cal.events.has(body.id)) return send(409, { error: { message: "exists" } }); cal.events.set(body.id, body); return send(200, body); }
    if (m === "PUT") { cal.events.set(eid, body); return send(200, body); }
    if (m === "DELETE") { const e = cal.events.get(eid); if (!e) return send(404, {}); e.status = "cancelled"; return send(204); }
    return send(400, {});
  };
  const live = () => { const c = [...cals.values()][0]; return c ? [...c.events.values()].filter((e) => e.status !== "cancelled") : []; };
  const at = (summary, day) => live().filter((e) => e.summary === summary && (e.start.dateTime || "").startsWith(day)).map((e) => e.start.dateTime.slice(11, 16));
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route("https://www.googleapis.com/calendar/v3/**", google);
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-02T08:10:00") });
    await page.addInitScript(([s, life]) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-region", "munich");
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z", aiConfirmedAt: "2026-10-05T08:00:00Z" }));
        localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T08:00:00Z", source: "profile" }));
        localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: life, calendar: { on: true },
          plan: [{ work: true, kind: "strength", intensity: "hard", at: "17:30", minutes: 60 }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: true, kind: "cardio", intensity: "easy", at: "17:30", minutes: 45 }, { work: true, kind: "rest" }, { work: false, kind: "rest" }, { work: false, kind: "rest" }] }));
        const bowl = { title: "Chicken rice bowl", kcal: 520, protein: 46, source: "mine", mealId: "m-bowl", items: s.meals[0].items, portion: 240 };
        localStorage.setItem("chefmealan-planned", JSON.stringify({ "2026-11-02": { dinner: bowl }, "2026-11-04": { dinner: bowl }, "2026-11-06": { dinner: bowl } }));
        sessionStorage.setItem("seeded", "1");
      }
      window.__cmCalendarToken = "test-token";
    }, [seed, LIFE]);
    await require("./adult.cjs")(page);
    const me = async () => { await page.goto(B + "/me/calendar"); await page.waitForTimeout(1500); };
    const personal = () => page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal") || "{}"));
    const plan = async (day) => { await page.goto(B + `/plan?day=${day}`); await page.waitForTimeout(1500); };
    await me(); await page.waitForTimeout(1500);
    ok(cals.size === 1 && live().length > 40, "on, with a token: the calendar is made and filled: " + live().length);
    ok(await page.locator(".cal-line").count() === 0 && /Updated \d\d:\d\d/.test(await page.locator(".cal-on").textContent()), "the page says the time once (no second Up to date line)");
    // DT179a: which meals
    const which = page.getByRole("radiogroup", { name: "Which meals" });
    ok(await which.count() === 1 && (await page.getByRole("radio", { name: "Every meal slot" }).getAttribute("aria-checked")) === "true", "Which meals, under Meals: every meal slot at first");
    await page.getByRole("radio", { name: "Only meals I planned" }).click(); await page.waitForTimeout(2500);
    ok(at("Breakfast", "2026-11-02").length === 0 && at("Lunch", "2026-11-03").length === 0 && at("Dinner · Chicken rice bowl", "2026-11-02").length === 1 && at("Cook dinner · Chicken rice bowl", "2026-11-02").length === 1, "only meals I planned: open slots out, Monday's dinner and its cooking in");
    ok(live().some((e) => /^(Strength|Cardio)/.test(e.summary)), "training stays");
    await page.getByRole("radio", { name: "Every meal slot" }).click(); await page.waitForTimeout(2500);
    ok(at("Breakfast", "2026-11-02").length === 1, "every meal slot again");
    // DT179: Read when I'm busy
    const sw = page.getByRole("switch", { name: /^Read when I'm busy/ });
    ok(await sw.count() === 1 && (await sw.getAttribute("aria-checked")) === "false", "From your calendar to the app: Read when I'm busy, off at first");
    ok(/Never the titles, the people or the places/.test(await page.locator(".cal-busy").textContent()), "busy and free only, said");
    await sw.click(); await page.waitForTimeout(1200);
    ok((await personal()).calendar.busy === true && fb.length === 1 && fb[0].items[0].id === "primary", "on: busy times read once, for the main calendar");
    ok((await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-cal-busy") || "null")))?.list?.length === 3, "kept on the phone");
    // Monday: a meal in a meeting
    await plan("2026-11-02");
    ok(await page.locator(".busy-row").count() === 1 && /^13:00\s*to 14:30\s*Busy in your calendar$/.test((await page.locator(".busy-row").textContent()).trim()), "Monday: one busy row, 13:00 to 14:30, no title: " + await page.locator(".busy-row").textContent());
    const ask = page.locator(".busy-ask").first();
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT + "-mon.png", fullPage: true });
    ok(/Lunch at 13:15 is in a busy block, 13:00 to 14:30\. Move it for Monday\?/.test(await ask.textContent()), "lunch asks: " + await ask.textContent());
    const hs = await page.locator(".busy-ask .pill").evaluateAll((bs) => bs.map((x) => Math.round(x.getBoundingClientRect().height)));
    ok(hs.length === 3 && hs.every((h) => h >= 44), "12:30, 14:30, Keep 13:15, each 44 px or more: " + hs.join(","));
    await ask.getByRole("button", { name: "12:30" }).click(); await page.waitForTimeout(2500);
    const p1 = await personal();
    ok(p1.timesOn?.["2026-11-02"]?.lunch === "12:30" && !p1.lifestyle.slotTimes, "lunch at 12:30 on Monday only");
    ok(/At 12:30 on this date only/.test(await page.locator(".slot-notes").first().textContent()) && await page.getByRole("button", { name: "Back to 13:15" }).count() === 1, "Back to 13:15 under it");
    ok(at("Lunch", "2026-11-02")[0] === "12:30" && at("Lunch", "2026-11-03")[0] === "13:15", "Google: Monday's lunch at 12:30, Tuesday's as usual");
    ok(await page.locator(".busy-ask").count() === 0, "the question is gone once answered");
    // Wednesday: a late evening
    await plan("2026-11-04");
    const late = page.locator(".busy-ask").first();
    ok(/Busy until 19:30\. Dinner at 20:00 leaves 30 minutes to cook\. A quick dinner, or cook on Tuesday and warm it up\?/.test(await late.textContent()), "Wednesday asks: " + await late.textContent());
    await late.getByRole("button", { name: "Cook ahead on Tuesday" }).click(); await page.waitForTimeout(2500);
    ok(at("Cook ahead for Wednesday · Chicken rice bowl", "2026-11-03")[0] === "19:30" && at("Cook dinner · Chicken rice bowl", "2026-11-04").length === 0, "Google: cooking on Tuesday, none on Wednesday");
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT + "-wed.png", fullPage: true });
    ok(/Cooked ahead on Tuesday/.test(await page.locator(".slot-notes").first().textContent()), "Wednesday's dinner says cooked ahead on Tuesday");
    // Thursday: a full day, and training in a busy block
    await plan("2026-11-05");
    const asks = await page.locator(".busy-ask").allTextContents();
    ok(asks.some((t) => /Booked from 08:00 to 20:00\. Take lunch along\?/.test(t)), "a full day: take lunch along");
    ok(asks.some((t) => /Training at 17:30 is in a busy block, 08:00 to 20:00\. Move it for Thursday\?/.test(t)) && await page.getByRole("button", { name: "Move to 20:00" }).count() === 1, "training asks, Move to 20:00");
    await page.getByRole("button", { name: "Rest day" }).click(); await page.waitForTimeout(2500);
    ok(live().filter((e) => (e.start.dateTime || e.start.date || "").startsWith("2026-11-05") && /Cardio/.test(e.summary)).length === 0, "rest day: Thursday's training leaves the calendar");
    await page.getByRole("button", { name: "Lunch to carry" }).click(); await page.waitForTimeout(1200);
    ok(/A lunch to take along on Thursday: I am out from 08:00 to 20:00/.test(await page.locator("body").textContent()), "Lunch to carry asks Chef Mealan");
    // Friday: dinner moved in Google comes back
    const fri = [...[...cals.values()][0].events.values()].find((e) => e.summary === "Dinner · Chicken rice bowl" && e.start.dateTime.startsWith("2026-11-06"));
    fri.start = { dateTime: "2026-11-06T21:00:00", timeZone: fri.start.timeZone }; fri.end = { dateTime: "2026-11-06T21:30:00", timeZone: fri.end.timeZone };
    await plan("2026-11-06");
    await page.clock.fastForward(11 * 60 * 1000); await page.waitForTimeout(3500);
    const p2 = await personal();
    ok(p2.timesOn?.["2026-11-06"]?.dinner === "21:00" && p2.calendar.moved?.["2026-11-06|dinner"] === "20:00", "moved in Google: Friday's dinner at 21:00 here too");
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT + "-fri.png", fullPage: true });
    ok(/Moved in Google Calendar, from 20:00/.test(await page.locator(".slot-notes").first().textContent()), "Plan says it was moved in Google Calendar");
    await page.getByRole("button", { name: "Back to 20:00" }).click(); await page.waitForTimeout(2500);
    ok(at("Dinner · Chicken rice bowl", "2026-11-06")[0] === "20:00" && !(await personal()).timesOn?.["2026-11-06"], "Back to 20:00: here and in Google");
    // off
    await me();
    await page.getByRole("switch", { name: /^Read when I'm busy/ }).click(); await page.waitForTimeout(800);
    ok((await personal()).calendar.busy === false && (await page.evaluate(() => localStorage.getItem("chefmealan-cal-busy"))) === null, "off: the busy times are forgotten on the phone");
    await plan("2026-11-02");
    ok(await page.locator(".busy-row").count() === 0 && await page.locator(".busy-ask").count() === 0, "Plan without busy rows");
    await page.goto(B + "/privacy"); await page.waitForTimeout(700);
    ok(/busy and free only, never titles/.test(await page.locator("body").textContent()), "the privacy notice says it");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  } catch (e) { console.log("FAIL " + e.message); fail++; }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok"); process.exit(fail ? 1 : 0);
})();
