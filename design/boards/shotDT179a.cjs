// DT179a (Coach Milan 31 October 09:00): a setting to put only the planned meals in the Chef Mealan calendar.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/pm178b";   // 0.3.22, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3383", U = `http://127.0.0.1:${PORT}`;
const LIFE = { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, wake: "early", bed: "mid", where: ["Cook at home", "Canteen at work"], diet: "Everything", alcohol: "Occasionally", travel: "sometimes" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" });
  // Google is a stand-in: every call answers, nothing is kept
  await ctx.route("https://www.googleapis.com/calendar/v3/**", (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: r.request().method() === "GET" ? "{\"items\":[]}" : "{\"id\":\"c1\"}" }));
  const page = await ctx.newPage();
  await page.addInitScript(() => { window.__cmCalendarToken = "t"; });
  await page.clock.setFixedTime(new Date("2026-11-02T08:10:00"));
  await page.addInitScript(([s, life]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-30T08:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: life, calendar: { on: true, id: "c1" }, plan: [{ work: true, kind: "strength", intensity: "hard", at: "17:30", minutes: 60 }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: true, kind: "cardio", intensity: "easy", at: "17:30", minutes: 45 }, { work: true, kind: "rest" }, { work: false, kind: "rest" }, { work: false, kind: "rest" }] }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed, LIFE]);
  const toMe = async () => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300); await page.getByRole("button", { name: /^Me\b/ }).first().click(); await page.waitForTimeout(500); };
  const note = (t) => page.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; (document.querySelector(".menu-title") || document.querySelector(".step-head") || document.querySelector("main") || document.body.firstElementChild).before(d); window.scrollTo(0, 0); }, { t, NOTE });
  // replace what is under the page title with drawn content
  const draw = (title, html) => page.evaluate(({ title, html }) => { const h = document.querySelector(".menu-title"); h.textContent = title; let n = h.nextElementSibling; while (n) { const x = n.nextElementSibling; n.remove(); n = x; } h.insertAdjacentHTML("afterend", html); }, { title, html });
  const CK = "background:var(--surface,#fff);border:1px solid var(--line);border-radius:16px;padding:14px";
  const toRow = async (name) => { await toMe(); await page.locator(".menu-row").filter({ hasText: name }).first().click(); await page.waitForTimeout(600); };
  const toTab = async (t) => { await page.goto(U + "/"); await page.waitForTimeout(1000); if (t !== "Today") { await page.locator("nav button").filter({ hasText: t }).click(); await page.waitForTimeout(800); } };
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const sw = (on) => `<span class="cal-switch ${on ? "on" : ""}"><span></span></span>`;
  const BUSY = (t) => `<div style="display:flex;align-items:center;gap:10px;min-height:44px;padding:6px 14px;background:repeating-linear-gradient(135deg,#eef1f6 0 8px,#e3e8f0 8px 16px);border-radius:10px;margin:6px 0"><small style="width:62px;font-weight:800;color:#5b6b8a">${t}</small><small style="font-weight:700;color:#5b6b8a">Busy in your calendar</small></div>`;
  const ASK = (text, buttons, back = "") => `<div style="${mark};background:#fff8d6;border-radius:12px;padding:10px 12px;margin:6px 0 10px"><small style="display:block;font-weight:700;line-height:1.45;color:#172742">${text}</small><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${buttons.map((b, i) => `<button class="pill pill-small ${i === 0 ? "pill-primary" : ""}" style="height:44px">${b}</button>`).join("")}</div>${back}</div>`;
  const toDay = async (label) => { await toTab("Plan"); await page.locator(".day-strip .choice").filter({ hasText: label }).first().click(); await page.waitForTimeout(600); };
  const after = (slotText, html) => page.evaluate(([s, html]) => { const w = [...document.querySelectorAll(".plan-slot-wrap, .plan-training")].find((x) => x.textContent.includes(s)); w.insertAdjacentHTML("afterend", html); }, [slotText, html]);
  const before = (slotText, html) => page.evaluate(([s, html]) => { const w = [...document.querySelectorAll(".plan-slot-wrap, .plan-training")].find((x) => x.textContent.includes(s)); w.insertAdjacentHTML("beforebegin", html); }, [slotText, html]);
  const noteTop = (t) => page.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; const a = document.querySelector(".cal-line") || document.querySelector(".week-arrows"); a.before(d); window.scrollTo(0, 0); }, { t, NOTE });

  const ev = (t, name, h, col, m = "") => `<div style="display:flex;gap:10px;align-items:stretch;margin-bottom:6px"><small style="width:44px;flex:none;font-weight:700;color:var(--muted);padding-top:4px">${t}</small><div style="flex:1;min-height:${h}px;border-radius:8px;background:${col};padding:6px 9px;${m}"><b style="font-size:14px">${name}</b></div></div>`;
  const GREY = "#e6e9ef", CM = "#d9f0e6";
  const plan = { "2026-11-02": { dinner: { title: "Chicken rice bowl", kcal: 520, protein: 46, source: "mine" } } };
  await page.goto(U + "/"); await page.waitForTimeout(800);
  await page.evaluate((pl) => localStorage.setItem("chefmealan-planned", JSON.stringify(pl)), plan);
  const toCal = async () => { await page.goto(U + "/me/calendar"); await page.waitForTimeout(1200); };
  const mealsRow = () => page.evaluate(() => [...document.querySelectorAll(".cal-kind")].find((b) => /^Meals/.test(b.textContent)));
  // a, now: every meal slot, every day
  await toCal();
  await page.evaluate((mark) => { const r = [...document.querySelectorAll(".cal-kind")].find((b) => /^Meals/.test(b.textContent)); r.style.cssText += ";" + mark; }, mark);
  await note("Now, 0.3.22: Meals puts every meal slot of every day in the calendar, planned or not. Five slots a day are 70 events in 14 days, most of them only a slot's name.");
  await shot("r179aa");
  // b, new: which meals
  await toCal();
  await page.evaluate((mark) => { const r = [...document.querySelectorAll(".cal-kind")].find((b) => /^Meals/.test(b.textContent)); r.style.borderBottom = "0";
    r.insertAdjacentHTML("afterend", `<div style="${mark};padding:4px 0 12px;border-bottom:1px solid var(--line)"><small style="display:block;font-weight:700;color:var(--muted);margin-bottom:6px">Which meals</small><div class="moments" role="radiogroup"><button class="choice" style="height:44px">Every meal slot</button><button class="choice on" style="height:44px">Only meals I planned</button></div><small class="muted" style="display:block;margin-top:6px;line-height:1.45">Only meals I planned: a slot with a meal on Plan goes in; an open slot stays out. Plan a meal, and it shows within seconds.</small></div>`); }, mark);
  await note("New: under Meals, one choice: Every meal slot, or Only meals I planned. Cooking already follows the planned meals.");
  await shot("r179ab");
  // c, new: the calendar with only planned meals
  await toCal();
  await draw("Monday 2 November", `<p class="small muted page-why">Drawn as a plain day, not Google's own look. Green: the Chef Mealan calendar. Grey: your own events.</p>
    <section style="${CK}">
      <small style="display:block;font-weight:800;color:var(--muted);margin-bottom:8px">Every meal slot</small>
      ${ev("06:30", "Breakfast", 28, CM)}${ev("09:00", "Team meeting", 36, GREY)}${ev("13:15", "Lunch", 28, CM)}${ev("17:30", "Strength", 40, CM)}${ev("19:30", "Cook dinner · Chicken rice bowl", 28, CM)}${ev("20:00", "Dinner · Chicken rice bowl", 28, CM)}
    </section>
    <section style="${CK};${mark};margin-top:12px">
      <small style="display:block;font-weight:800;color:var(--muted);margin-bottom:8px">Only meals I planned</small>
      ${ev("09:00", "Team meeting", 36, GREY)}${ev("17:30", "Strength", 40, CM)}${ev("19:30", "Cook dinner · Chicken rice bowl", 28, CM)}${ev("20:00", "Dinner · Chicken rice bowl", 28, CM)}
    </section>`);
  await note("New: with Only meals I planned, Monday shows the dinner you planned and its cooking. Breakfast and lunch are open on Plan, so they stay out. Training and shopping are not meals: they follow their own switches.");
  await shot("r179ac");
  await b.close(); server.kill();
})();
