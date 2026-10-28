// The first two weeks and the measured burn (0.2.7, canvas board FT): Today, Me, Goal, the calculator and the coach, from real
// meals and weigh-ins, with the clock on day 6 (Thursday 15 October) and day 14 (Friday 23 October). The example person of
// the board: male, 1981, 182 cm, 95 kg, the first goal on Saturday 10 October.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const U = "http://127.0.0.1:3201";
const START = "2026-10-10";
const add = (k) => { const d = new Date(`${START}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
const BASE = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")).foods[0];
const food = (id, name, kcal, protein) => ({ ...BASE, id, name, calories: kcal, protein });
const card = (id, title, kcal, protein, at, slot) => ({ id, status: "eaten", taste: "", notes: "", createdAt: at, slot, meal: { id: "m" + id, title, savedAt: at, portion: 100, items: [{ id: id + "i", food: food(id + "f", title, kcal, protein), grams: 100, locked: true }] } });
const MEALS = [["breakfast", "Oats, skyr and banana", 793, 50, "07:00"], ["lunch", "Chicken, rice and greens", 793, 60, "12:30"], ["dinner", "Salmon and potatoes", 794, 60, "19:00"]];
// days 1 to N-1 finished; day 3 has its dinner missing; every other day all three meals by the plan
function seedFor(day) {
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = [];
  const planned = {};
  for (let i = 1; i < day; i++) {
    const k = add(i - 1); planned[k] = {};
    for (const [slot, title, kcal, protein, time] of MEALS) {
      planned[k][slot] = { title, kcal, protein, source: "mine", mealId: "m" + `${k}${slot}` };
      if (i === 3 && slot === "dinner") continue;
      seed.feedback.push(card(`${k}${slot}`, title, kcal, protein, new Date(`${k}T${time}:00`).toISOString(), { date: k, slotId: slot }));
    }
  }
  const per = -0.25 / 14, kg = (d) => Math.round((95 + per * (d - 1)) * 1000) / 1000;
  const wdays = day === 6 ? [2, 3, 5, 6] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  return { seed, planned, weighIns: wdays.map((d) => ({ date: add(d - 1), kg: kg(d) })) };
}
const personal = (w) => ({ sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, dayMode: "each", pdUnit: "pd", weighIns: w,
  plan: [{ work: true, kind: "strength", intensity: "hard", minutes: 60 }, { work: true, kind: "rest" }, { work: true, kind: "cardio", intensity: "moderate", when: "morning", minutes: 40 }, { work: true, kind: "rest" }, { work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }, { work: false, kind: "walk", intensity: "easy", when: "day", minutes: 60 }, { work: false, kind: "rest" }],
  lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } });

(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3201", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok  " : "FAIL") + " " + m); if (!c) fails.push(m); };
  async function open(day, now, situations = []) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date(now));
    const { seed, planned, weighIns } = seedFor(day);
    await page.addInitScript(([s, pl, p, start, sit]) => { if (localStorage.getItem("seeded")) return;
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-planned", JSON.stringify(pl));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: `${start}T08:00:00`, source: "profile" }));
      localStorage.setItem("chefmealan-goal-log", JSON.stringify([{ at: `${start}T08:00:00`, band: "recomp", kcal: 2400, protein: 180, source: "profile", weightKg: 95 }]));
      localStorage.setItem("chefmealan-personal", JSON.stringify(p));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: sit, flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed, planned, personal(weighIns), START, situations]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
    return { ctx, page };
  }
  const go = async (page, p) => { await page.goto(U + p); await page.waitForTimeout(1400); await page.evaluate(() => document.querySelectorAll(".toast").forEach((x) => x.remove())); };
  const hide = (page) => page.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav").forEach((x) => (x.style.display = "none")));
  const markHnw = (page) => page.evaluate(() => { const l = [...document.querySelectorAll("p.label")].find((x) => x.textContent === "How your numbers work"); l.id = "hnw"; });

  // day 6
  { const { ctx, page } = await open(6, "2026-10-15T10:00:00");
    await page.setViewportSize({ width: 390, height: 1040 });
    await go(page, "/today");
    const know = page.locator(".ft-know");
    ok(await know.count() === 1, "FT1: Today has the getting to know you card");
    const t = await know.textContent();
    ok(/DAY 6 OF 14/.test(t) && /4 full days and 4 weigh-ins so far/.test(t), "FT1: day 6 of 14, 4 full days, 4 weigh-ins");
    const states = await know.locator(".ft-sq").evaluateAll((xs) => xs.map((x) => x.className.replace("ft-sq", "").trim()));
    ok(states.slice(0, 7).join("|") === "full|full weighed|part weighed|full|full weighed|today weighed|todo", "FT1: the squares: " + states.slice(0, 7).join("|"));
    await page.evaluate(() => document.querySelectorAll(".chat-fab").forEach((x) => (x.style.display = "none")));
    await page.setViewportSize({ width: 390, height: 3400 });
    await go(page, "/me/goal"); await hide(page); await markHnw(page);
    const burn = await page.locator(".ft-burn").textContent();
    ok(/DAY 6 OF 14/.test(burn) && /Not enough data yet/.test(burn) && /4 of 10 needed/.test(burn) && /2 of 7 needed/.test(burn) && /Ready on Friday 23 October at the earliest/.test(burn), "FT3: measuring, 4 of 10 full days, 2 of 7 weigh-ins from day 4, ready on 23 October");
    ok(/Automatic: Mifflin St Jeor now · 2,650 kcal a day to stay the same/.test(await page.locator(".formula-line").textContent()), "FT3: the formula line with its number");
    const fl = await page.locator(".formula-line").evaluate((e) => { const s = e.querySelector("span").getBoundingClientRect(), c = e.querySelector(".link").getBoundingClientRect(), r = e.getBoundingClientRect(); return { left: Math.round(s.left - r.left), same: Math.abs(c.top - s.top) < 30 }; });
    ok(fl.left <= 20 && fl.same, "FT0 fixed: the formula text starts at the left, Change on the same line " + JSON.stringify(fl));
    await page.setViewportSize({ width: 390, height: 3000 });
    await go(page, "/me/goal"); await page.getByRole("button", { name: /Change the goal/ }).first().click(); await page.waitForTimeout(800);
    // DT139 (0.2.124): the formula sits behind How we calculate ›
    await page.locator(".how-calc").click(); await page.waitForTimeout(300);
    const wide = page.locator(".formula-card .opt-wide");
    ok(await wide.isDisabled() && /Not enough data yet/.test(await wide.textContent()), "FT5: From your data is greyed until day 14");
    await ctx.close(); }

  // day 14
  { const { ctx, page } = await open(14, "2026-10-23T10:00:00");
    await page.setViewportSize({ width: 390, height: 1040 });
    await go(page, "/today");
    ok(await page.locator(".ft-know").count() === 0, "FT2: the getting to know you card is gone on day 14");
    const ready = await page.locator(".ft-ready").textContent();
    ok(/2,520kcal a day/.test(ready) && /Give or take 75/.test(ready) && /12 full days and 11 weigh-ins/.test(ready) && /The formula said 2,650/.test(ready), "FT2: 2,520 kcal a day, give or take 75, 12 full days, 11 weigh-ins: " + ready.slice(0, 160));
    await page.evaluate(() => document.querySelectorAll(".chat-fab").forEach((x) => (x.style.display = "none")));
    await page.getByRole("button", { name: "Got it" }).click(); await page.waitForTimeout(300);
    ok(await page.locator(".ft-ready").count() === 0, "FT2: Got it takes the card away");
    await go(page, "/today"); ok(await page.locator(".ft-ready").count() === 0, "FT2: and it stays away");
    await page.setViewportSize({ width: 390, height: 3400 });
    await go(page, "/me/goal"); await hide(page); await markHnw(page);
    const burn = await page.locator(".ft-burn").textContent();
    ok(/10 TO 23 OCTOBER/.test(burn) && /Somewhere between 2,445 and 2,595\. The formula says 2,650/.test(burn) && /2,380 kcal a day on average, on 12 full days/.test(burn) && /down 0\.25 kg in 14 days, from the line through 11 weigh-ins/.test(burn) && /0\.25 kg × 7,700 kcal ÷ 14 days = about 140 kcal a day more than you ate/.test(burn), "FT4: the measured burn, its range, the three steps");
    await page.locator(".ft-burn").getByRole("button", { name: "Use my data" }).click(); await page.waitForTimeout(900);
    const wide = page.locator(".formula-card .opt-wide");
    ok(await wide.getAttribute("aria-pressed") === "true" && /2,520 kcal a day, all in/.test(await wide.textContent()) && /10 to 23 October/.test(await wide.textContent()), "FT5: Use my data opens the calculator with From your data picked");
    ok(/Your data gives 130 kcal a day less than Mifflin St Jeor/.test(await page.locator(".formula-card").textContent()), "FT5: 130 kcal a day less than Mifflin St Jeor");
    await hide(page);
    await page.evaluate(() => { const c = document.querySelector(".formula-card"); c.previousElementSibling.id = "fhead"; document.querySelector(".day-table").id = "dtab"; });
    const dt = await page.locator(".day-table").textContent();
    ok(/Your week averages 2,250 kcal/.test(dt) && /From your data: 150 kcal less than with the formula/.test(dt) && /Sources: your own 14 days, 10 Oct to 23 Oct/.test(dt), "FT5: the days, 2,250 on average (2,520 × 0.9), 150 less, the source: " + dt.slice(-330));
    const mon = await page.locator(".day-table .dt-row").first().locator(".dt-num").first().textContent();
    const days = await page.locator(".day-table .dt-row").evaluateAll((rs) => rs.map((r) => r.querySelector(".dt-num").textContent.trim()));
    ok(days.join(" ") === "2,450 2,100 2,400 2,100 2,450 2,300 2,100", "FT5: each day about 130 less, to the nearest 50: " + days.join(" "));
    // Apply from today: the numbers follow, the formula line says From your data, the number stays fixed
    const apply = page.getByRole("button", { name: /^Apply from today|^Set my day|^Save/ }).first();
    await apply.click(); await page.waitForTimeout(1000);
    const p = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")));
    ok(p.formula === "data" && p.measuredUse && p.measuredUse.kcal === 2520 && p.measuredUse.from === "2026-10-10", "applied: From your data, 2,520 fixed with its dates");
    const goals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).goals);
    ok(goals.calories === 2250, "applied: the week's average is 2,250: " + goals.calories);
    await go(page, "/me/goal");
    ok(/From your data · 2,520 kcal a day to stay the same/.test(await page.locator(".formula-line").textContent()), "Goal: the formula line says From your data, 2,520");
    ok(/In use since/.test(await page.locator(".ft-burn").textContent()), "Goal: the card says which number is in use");
    await ctx.close(); }

  // a hard relationship with eating declared: no weigh-ins, so no first two weeks and no measured burn
  { const { ctx, page } = await open(6, "2026-10-15T10:00:00", ["eating"]);
    await go(page, "/today"); ok(await page.locator(".ft-know, .ft-ready").count() === 0, "eating declared: nothing on Today");
    await go(page, "/me/goal"); ok(await page.locator(".ft-burn").count() === 0, "eating declared: no measured burn on Goal");
    await ctx.close(); }

  // the coach (FT6, FT7), with the example clients
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date("2026-10-15T10:00:00"));
    const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-09-01T08:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { meals: 3 } }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
    await go(page, "/today?coachdemo"); await page.getByRole("button", { name: /^Clients$/ }).first().click(); await page.waitForTimeout(900);
    const lena = page.locator(".cw-row").filter({ hasText: "Lena" });
    const lt = await lena.textContent();
    ok(/first two weeks, day 6 of 14/.test(lt) && /4 full days · 2 weigh-ins · ready 23 Oct/.test(lt) && await lena.locator(".ft-sq").count() === 14 && await lena.locator(".cw-bar").count() === 0, "FT6: Lena in her first two weeks: squares, not bars");
    await page.evaluate(() => document.querySelectorAll(".chat-fab").forEach((x) => (x.style.display = "none")));
    await page.setViewportSize({ width: 390, height: 4600 });
    await page.locator(".cw-row").first().click(); await page.waitForTimeout(700); await hide(page);
    const cb = await page.locator(".ft-burn").textContent();
    ok(/DAVORKA'S BURN, MEASURED · LAST 14 DAYS/.test(cb) && /The formula says 2,000/.test(cb) && /Davorka ate/.test(cb) && /more than the formula/.test(cb) && /To use it, pick From Davorka's data under Formula/.test(cb), "FT7: Davorka's burn on her page, with the gap line");
    const pin = page.getByRole("button", { name: "From Davorka's data" });
    ok(await pin.count() === 1, "FT7: From Davorka's data as a formula pin");
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "From Davorka's data"); b.parentElement.id = "fgrp"; });
    await ctx.close(); }
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
