// DT143 to DT146 (Anna's two blind runs, 22 October; renumbered 28 October; Coach Milan 1 November 09:47 "Draw Anna"):
// redrawn on 0.3.37. Anna as she set up: female, 1998, 168 cm, 60 kg, sitting work, three moderate evenings of 45 to 60
// minutes, Build muscle, each day its own, Munich. Monday 2 November, 11:00, her first day.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.foods = []; seed.meals = []; seed.feedback = [];
const PORT = "3395", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-11-02T11:00:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1998, heightCm: 168, weightKg: 60, lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-11-02T09:00:00Z", consentBodyAt: "2026-11-02T09:00:00Z", declaredAt: "2026-11-02T09:00:00Z", aiConfirmedAt: "2026-11-02T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); for (const t of document.querySelectorAll(".toast")) t.style.display = "none"; }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const note = (t, sel = "main") => page.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.className = "drawn-note"; d.style.cssText = NOTE; d.textContent = t; const m = document.querySelector(sel); m.insertBefore(d, m.firstElementChild); window.scrollTo(0, 0); }, { t, NOTE, sel });
  const hide = (sel) => page.evaluate((sel) => { for (const el of document.querySelectorAll(sel)) el.style.display = "none"; }, sel);

  // setup, as Anna did it
  await page.goto(U + "/"); await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /^Edit$/ }).first().click(); await page.waitForTimeout(400);
  const setDay = async (day) => { await page.getByRole("button", { name: new RegExp(`^${day}:`) }).click(); await page.waitForTimeout(150); await page.getByRole("group", { name: `${day}, how hard` }).getByRole("button", { name: "Moderate", exact: true }).click(); await page.waitForTimeout(150);
    await page.getByRole("group", { name: `${day}, how long` }).getByRole("button", { name: "45 to 60 min" }).click(); await page.getByRole("group", { name: `${day}, when` }).getByRole("button", { name: "Evening" }).click(); await page.waitForTimeout(150); };
  for (const d of ["Monday", "Wednesday", "Friday"]) await setDay(d);
  await page.locator(".calc-way").getByRole("button", { name: /^Done$/ }).last().click(); await page.waitForTimeout(400);
  await page.locator(".goal-pick").nth(3).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Each day its own" }).click(); await page.waitForTimeout(400);

  // DT144 a and b: the setup's day table
  const table = page.locator(".day-table").first();
  await table.scrollIntoViewIfNeeded();
  await table.screenshot({ path: `${R}/r144a.png` }); console.log("shot r144a");
  await page.evaluate(({ mark }) => {
    const t = document.querySelector(".day-table");
    for (const r of t.querySelectorAll(".dt-row")) {
      const k = Number(r.querySelector(".dt-num").textContent.replace(/,/g, "")), p = Number(r.querySelectorAll(".dt-num")[1].textContent);
      const s = r.querySelector(".dt-day small"); s.insertAdjacentHTML("afterend", `<b style="display:block;white-space:nowrap;color:#1f5fc7;font-size:14px;margin-top:2px">PD ${(100 * p / k).toFixed(1)}</b>`);
    }
    t.style.cssText += mark;
  }, { mark });
  await table.screenshot({ path: `${R}/r144b.png` }); console.log("shot r144b");

  await page.getByRole("button", { name: /^Apply from today/ }).click(); await page.waitForTimeout(800);
  const step = page.locator(".shop-step");
  await step.getByRole("group", { name: "Where do you live and shop?" }).getByRole("button", { name: "Munich", exact: true }).click(); await page.waitForTimeout(600);
  await step.getByRole("button", { name: /^Done: to Today/ }).click(); await page.waitForTimeout(3500);

  // DT143 a: Today on day one, as it is
  await note("Now: her first day, nothing planned, nothing eaten. Three cards each say nothing: Next (nothing planned yet), What's in the plan (nothing planned so far), Today's meals (nothing logged yet). Earlier shows Sunday and Saturday, the two days before she joined.");
  await shot("r143a");
  // DT143 b: one card for an empty day; Earlier starts on her first day
  await page.evaluate(() => document.querySelector(".drawn-note")?.remove());
  await page.evaluate(({ mark }) => {
    const next = document.querySelector(".next-meal"); next.style.display = "none";
    const plan = [...document.querySelectorAll("section.card.cooking")].find((s) => /What's in the plan/.test(s.textContent) && /Nothing planned so far/.test(s.textContent) && !s.closest(".tomorrow, [aria-label*='Tomorrow']"));
    const cards = [...document.querySelectorAll("section.card.cooking")]; cards[0].style.display = "none";
    const meals = document.querySelector("section.meals-card"); meals.style.display = "none";
    next.insertAdjacentHTML("afterend", `<section class="card next-planned next-open" style="${mark}">
      <p class="label next-head">Your first day</p>
      <div class="next-planned-text"><b>Nothing planned or eaten yet today</b><small>Lunch is next, at 13:45. About 2,050 kcal and 115 g protein for the whole day.</small></div>
      <div class="button-row next-planned-acts" style="margin-top:10px">
        <button type="button" class="pill pill-small pill-primary" style="min-height:44px">Pick a meal for lunch</button>
        <button type="button" class="pill pill-small" style="min-height:44px">Plan the day</button>
        <button type="button" class="pill pill-small" style="min-height:44px">Log what you ate</button>
      </div></section>`);
    // Earlier: nothing before her first day
    const band = [...document.querySelectorAll(".day-band")].find((x) => /Earlier/.test(x.textContent)); band.style.display = "none";
    const days = document.querySelector(".days"); days.style.display = "none";
  }, { mark });
  await note("New: one card while the day is empty, with its three ways: pick lunch, plan the day, log what you ate. The cards come back as soon as there is something in them. Earlier starts on her first day: on day one there is no Earlier; on day two it shows yesterday only.");
  await shot("r143b");

  // DT144 c and d, DT146: Plan, today
  await page.goto(U + "/plan"); await page.waitForTimeout(1500);
  await note("Now: Today says 2,050 kcal for Monday. Plan says 1,850 to 2,250 kcal for the same Monday: the range a planned day may land in, without saying so. The training row says 55 min; she picked 45 to 60 min.");
  await shot("r144c");
  await page.evaluate(() => document.querySelector(".drawn-note")?.remove());
  await page.evaluate(({ mark }) => {
    const sm = [...document.querySelectorAll("small")].find((s) => /^of 1,850 to 2,250 kcal$/.test(s.textContent.trim()));
    sm.innerHTML = `of 2,050 kcal today<br><span style="font-weight:600">a planned day fits from 1,850 to 2,250</span>`; sm.parentElement.style.cssText += mark;
    const tr = [...document.querySelectorAll(".menu-row-text b")].find((x) => /55 min/.test(x.textContent));
    tr.textContent = tr.textContent.replace("55 min", "45 to 60 min"); tr.style.cssText += mark;
  }, { mark });
  await note("New: the kcal says its target and its day, the same 2,050 as on Today; the range is said in words under it. The training row keeps the range she picked: 45 to 60 min (DT146).");
  await shot("r144d");

  // DT146: the toast over the button
  await page.evaluate(() => { document.querySelector(".drawn-note")?.remove(); location.reload(); }); await page.waitForTimeout(1500);
  const showToast = (top) => page.evaluate(({ top, mark }) => {
    const t = document.createElement("div"); t.className = "success toast"; t.setAttribute("role", "status"); t.textContent = "Lunch is in Monday's plan.";
    if (top) { t.style.cssText = `bottom:auto;top:calc(64px + env(safe-area-inset-top, 0px));${mark}`; }
    document.body.appendChild(t);
    const fill = [...document.querySelectorAll("button")].find((x) => /Fill the open slots/.test(x.textContent));
    const y = fill.getBoundingClientRect().top + window.scrollY; window.scrollTo(0, y - (844 - 96 - 70));
  }, { top, mark });
  await showToast(false); await page.waitForTimeout(300);
  await page.screenshot({ path: `${R}/r146a.png` }); console.log("shot r146a");
  await page.evaluate(() => document.querySelectorAll(".toast").forEach((t) => t.remove()));
  await showToast(true); await page.waitForTimeout(300);
  await page.screenshot({ path: `${R}/r146b.png` }); console.log("shot r146b");

  // DT144 e and f: Me
  await page.goto(U + "/me"); await page.waitForTimeout(1500);
  await hide(".travel-card, .weigh-card");
  await note("Now: the top says 1,950 kcal, average day. The Goal row under it says 1,950 kcal and 115 g protein a day, as if every day were the same. Her Monday is 2,050, her Tuesday 1,850.");
  await shot("r144e");
  await page.evaluate(() => document.querySelector(".drawn-note")?.remove());
  await page.evaluate(({ mark }) => {
    const row = [...document.querySelectorAll(".menu-row-text small")].find((x) => /kcal and 115 g protein a day/.test(x.textContent));
    row.textContent = "1,950 kcal on an average day, 115 g protein every day"; row.parentElement.parentElement.style.cssText += mark;
  }, { mark });
  await note("New: the row says which day its number is for, like the top. Protein is the same every day, so it says so.");
  await shot("r144f");

  await b.close(); server.kill();
})();
