// DT178 (Coach Milan 30 October 23:58): Chef Mealan's own calendar in Google. Meals, cooking, shopping and training as events; names and a link only.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.20, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3381", U = `http://127.0.0.1:${PORT}`;
const LIFE = { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, wake: "early", bed: "mid", where: ["Cook at home", "Canteen at work"], diet: "Everything", alcohol: "Occasionally", travel: "sometimes" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-30T10:10:00"));
  await page.addInitScript(([s, life]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-30T08:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: life }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed, LIFE]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const toMe = async () => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300); await page.getByRole("button", { name: /^Me\b/ }).first().click(); await page.waitForTimeout(500); };
  const note = (t) => page.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; (document.querySelector(".menu-title") || document.querySelector(".step-head") || document.querySelector("main") || document.body.firstElementChild).before(d); window.scrollTo(0, 0); }, { t, NOTE });
  // replace what is under the page title with drawn content
  const draw = (title, html) => page.evaluate(({ title, html }) => { const h = document.querySelector(".menu-title"); h.textContent = title; let n = h.nextElementSibling; while (n) { const x = n.nextElementSibling; n.remove(); n = x; } h.insertAdjacentHTML("afterend", html); }, { title, html });
  const CK = "background:var(--surface,#fff);border:1px solid var(--line);border-radius:16px;padding:14px";
  const toRow = async (name) => { await toMe(); await page.locator(".menu-row").filter({ hasText: name }).first().click(); await page.waitForTimeout(600); };
  const toTab = async (t) => { await page.goto(U + "/"); await page.waitForTimeout(1000); if (t !== "Today") { await page.locator("nav button").filter({ hasText: t }).click(); await page.waitForTimeout(800); } };
  const sw = (on) => `<span role="switch" aria-checked="${on}" style="flex:none;width:50px;height:30px;border-radius:15px;background:${on ? "var(--brand,#2e7be8)" : "#c9d2e3"};position:relative"><span style="position:absolute;top:3px;${on ? "right" : "left"}:3px;width:24px;height:24px;border-radius:50%;background:#fff"></span></span>`;
  const kind = (name, ex, on, why = "") => `<div style="display:flex;align-items:center;gap:12px;min-height:52px;padding:6px 0;border-bottom:1px solid var(--line)"><div style="flex:1;min-width:0"><b style="display:block">${name}</b><small class="muted" style="font-weight:600">${ex}</small>${why ? `<small style="display:block;color:#8a4b00;font-weight:600;margin-top:2px">${why}</small>` : ""}</div>${sw(on)}</div>`;
  const KINDS = (st) => `<section style="${CK};${st}"><b>What goes in</b><small class="muted" style="display:block;margin:4px 0 4px">Each kind is on or off. Change it any time.</small>
    ${kind("Meals", "Breakfast 06:30, Lunch 13:15, Dinner 20:00", true)}
    ${kind("Cooking", "Cook dinner, 19:30, when the planned meal has steps", true)}
    ${kind("Training", "Strength training, Monday 17:30", true)}
    ${kind("Shopping", "Shopping list 1, on the day you pick", true)}
    ${kind("Weigh in", "Weigh in, before breakfast", false, "Off at first: a shared calendar would show it.")}
    ${kind("Check-in with Coach Milan", "Check-in, 27 November", false, "Off at first, for the same reason.")}
    <div style="display:flex;align-items:center;gap:12px;min-height:52px;padding:6px 0"><div style="flex:1;min-width:0"><b style="display:block">The dish's name</b><small class="muted" style="font-weight:600">Lunch · Chicken rice bowl, or just Lunch</small></div>${sw(true)}</div></section>`;
  const RULE = `<section style="${CK};margin-top:12px"><b>What an event says</b><small style="display:block;margin-top:6px;font-weight:600;line-height:1.5">The name, the time, and a link that opens that day on Plan. Never kcal, protein, your goal or anything about your health. Calendars get shared with family and colleagues, so the numbers stay in the app.</small></section>`;

  // a, now: the plan lives only in the app
  await toTab("Plan");
  await note("Now, 0.3.20: your meal times, your training and your shopping list live only in the app. Your day lives in your calendar. To see lunch next to your meetings you open two apps.");
  await shot("r178a");
  // b, new: a row on Me
  await toMe();
  await page.evaluate((mark) => { const r = [...document.querySelectorAll(".menu-row")].find((x) => /Training week/.test(x.textContent)); r.insertAdjacentHTML("afterend", `<button class="menu-row" style="${mark}"><span class="menu-icon">📅</span><span class="menu-row-text"><b>Google Calendar</b><small>Off. Your meals, cooking and training in your own calendar</small></span><span aria-hidden="true">›</span></button>`); }, mark);
  await note("New: Google Calendar on Me, under Training week. Off until you turn it on.");
  await shot("r178b");
  // c, new: the page, off
  await toMe(); await draw("Google Calendar", `<p class="small muted page-why">Chef Mealan writes your plan into a calendar of its own, called Chef Mealan, in your Google Calendar. It never reads or changes your other events.</p>
    ${KINDS(mark)}
    ${RULE}
    <button class="pill pill-wide pill-primary" style="height:52px;margin-top:14px;${mark}">Connect Google Calendar</button>
    <small class="muted" style="display:block;margin-top:8px;line-height:1.5">Google asks you once for one right: to create the Chef Mealan calendar and manage the events in it. Nothing else. You can take it back in your Google account at any time.</small>`);
  await note("New: the page, before you connect. You pick what goes in. Weigh in and Check-in start off. Then Connect: Google shows its own screen once, asking for the one right.");
  await shot("r178c");
  // d, new: the page, on
  await toMe(); await draw("Google Calendar", `<section style="${CK};${mark};display:flex;gap:12px;align-items:center;background:#e9f5ef;border-color:#bfe3d2"><span style="font-size:26px">📅</span><div style="flex:1;min-width:0"><b style="display:block">On</b><small style="font-weight:600;color:#0f6b4e;line-height:1.45">The Chef Mealan calendar in your Google account. The next 14 days are in it. Updated 18:40.</small></div></section>
    <p class="small muted" style="margin:10px 0">When you change a time, a slot or a meal here, it changes in Google Calendar within seconds, while the app is open. When you open the app, it brings the next 14 days up to date.</p>
    ${KINDS("margin-top:4px")}
    ${RULE}
    <section style="${CK};${mark};margin-top:12px"><b>Turn off</b><small class="muted" style="display:block;margin:4px 0 10px">Chef Mealan stops writing. What about the calendar?</small><div style="display:flex;flex-direction:column;gap:8px"><button class="pill pill-wide" style="height:48px">Remove the Chef Mealan calendar</button><button class="pill pill-wide" style="height:48px">Keep it as it is</button></div><small class="muted" style="display:block;margin-top:8px">Deleting your account also removes the Chef Mealan calendar.</small></section>`);
  await note("New: on. One line says where and how far ahead. Changes go across while the app is open. Turn off asks one thing: remove the calendar, or keep it as it is.");
  await shot("r178d");
  // e, new: what your Google Calendar shows (drawn, not Google's own look)
  await toMe();
  const ev = (t, name, h, col, m = "") => `<div style="display:flex;gap:10px;align-items:stretch;margin-bottom:6px"><small style="width:44px;flex:none;font-weight:700;color:var(--muted);padding-top:4px">${t}</small><div style="flex:1;min-height:${h}px;border-radius:8px;background:${col};padding:6px 9px;${m}"><b style="font-size:14px">${name}</b></div></div>`;
  const GREY = "#e6e9ef", CM = "#d9f0e6";
  await draw("Monday 2 November", `<p class="small muted page-why">Drawn as a plain day, not Google's own look. Green: the Chef Mealan calendar. Grey: your own events, which Chef Mealan never sees in DT178.</p>
    <section style="${CK}">
      ${ev("06:30", "Breakfast", 32, CM)}
      ${ev("09:00", "Team meeting", 44, GREY)}
      ${ev("13:15", "Lunch · Canteen", 32, CM, mark)}
      ${ev("15:00", "Call with the bank", 32, GREY)}
      ${ev("17:30", "Strength training", 56, CM)}
      ${ev("19:30", "Cook dinner · Chicken rice bowl", 32, CM)}
      ${ev("20:00", "Dinner · Chicken rice bowl", 32, CM)}
    </section>
    <section style="${CK};${mark};margin-top:12px"><small class="muted" style="font-weight:700">Opened in Google Calendar</small><b style="display:block;font-size:18px;margin-top:4px">Lunch · Canteen</b><small style="display:block;font-weight:600;margin-top:4px">Monday 2 November, 13:15 to 13:45</small><small style="display:block;font-weight:600;margin-top:2px">Calendar: Chef Mealan</small><small style="display:block;font-weight:600;margin-top:8px;line-height:1.45">Open in Chef Mealan:<br><a href="#">chefmealan.com/plan?day=2026-11-02</a></small></section>
    <section style="${CK};margin-top:12px"><b>Shopping</b><small style="display:block;margin-top:6px;font-weight:600;line-height:1.5">A kept shopping list gets a day when you pick one: Shopping list 1, Saturday 7 November, 10:00. No list, no event.</small></section>`);
  await note("New: what Google Calendar shows. Your meals, cooking and training next to your own events. An event has a name, a time and a link to that day on Plan. No numbers.");
  await shot("r178e");
  // f, new: Plan says it is in the calendar; a list gets a day
  await toTab("Plan");
  await page.evaluate(([mark]) => { const s = document.querySelector(".plan-shop"); const head = document.querySelector("main") ? document.querySelector("main").firstElementChild : document.querySelector("header").nextElementSibling;
    head.insertAdjacentHTML("beforebegin", `<div style="${mark};display:flex;align-items:center;gap:10px;background:#e9f5ef;border-radius:12px;padding:8px 12px;margin:0 0 12px"><span style="font-size:18px">📅</span><small style="flex:1;font-weight:700;color:#0f6b4e">Also in your Google Calendar, 14 days ahead. A time you change here changes there.</small></div>`);
    if (s) s.insertAdjacentHTML("afterend", `<div style="${mark};display:flex;align-items:center;gap:10px;background:var(--surface,#fff);border:1px solid var(--line);border-radius:12px;padding:8px 12px;margin-top:8px"><div style="flex:1"><b style="display:block">Shop on</b><small class="muted" style="font-weight:600">Optional. Puts Shopping list 1 in your calendar.</small></div><button class="pill pill-small" style="height:44px">Sat 7 Nov, 10:00</button></div>`); }, [mark]);
  await note("New: Plan says once, at the top, that the plan is also in your calendar. A shopping list can get a day: Shop on. Nothing else on Plan changes.");
  await shot("r178f");
  await b.close(); server.kill();
})();
