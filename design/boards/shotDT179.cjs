// DT179 (Coach Milan 31 October 00:08): calendar in. Busy times move meal suggestions; events moved in Google come back.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/pm178";   // 0.3.21, as built; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3382", U = `http://127.0.0.1:${PORT}`;
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

  // a, now: Plan knows meal times, not meetings
  await toDay("Today");
  await noteTop("Now, 0.3.21: your plan goes out to Google Calendar, but nothing comes back. Lunch at 13:15 sits in a meeting from 13:00 to 14:30, and Plan does not know.");
  await shot("r179a");
  // b, new: the second right, on the Calendar page
  await page.goto(U + "/me/calendar"); await page.waitForTimeout(1200);
  await page.evaluate(([mark, sw]) => { const k = document.querySelector(".cal-kinds"); k.insertAdjacentHTML("beforebegin", `<section class="card" style="${mark};display:flex;flex-direction:column;gap:6px"><b>From your calendar to the app</b>
    <button type="button" class="cal-kind" style="border-bottom:0"><span><b>Read when I'm busy</b><small>Busy and free times only. Never the titles, the people or the places of your events.</small></span>${sw}</button>
    <small style="font-weight:600;line-height:1.5">With it, Plan suggests: a meal moved out of a meeting, a quick dinner after a late evening, a lunch to carry on a full day, and asks when training sits in a busy block. It suggests; your times change only when you tap.</small>
    <small class="muted" style="line-height:1.5">Turning it on asks Google once more, for one more right: see when you are busy (calendar.freebusy). Busy times stay on your phone: not on our server, not with your coach, not with Chef Mealan's AI.</small></section>`); }, [mark, sw(false)]);
  await page.evaluate(() => { const t = [...document.querySelectorAll(".cal-kind b")].find((b) => b.textContent === "Read when I'm busy"); });
  await note("New: one more switch on the Google Calendar page, off at first. On asks Google for a second right, busy times only. They stay on your phone.");
  await shot("r179b");
  // c, new: a meal in a meeting
  await toDay("Today");
  await before("Lunch, 13:15", BUSY("13:00<br>to 14:30"));
  await after("Lunch, 13:15", ASK("Lunch at 13:15 is in a busy block, 13:00 to 14:30. Move it for today?", ["12:30", "14:30", "Keep 13:15"]));
  await noteTop("New: a busy block shows on Plan as Busy, nothing more. A meal inside one asks: before, after, or keep. One tap moves it for this date, as a hand-set time does, with Back to 13:15.");
  await shot("r179c");
  // d, new: a late evening
  await toDay("Wed");
  await before("Dinner, 20:00", BUSY("17:00<br>to 19:30"));
  await after("Dinner, 20:00", ASK("Busy until 19:30. Dinner at 20:00 leaves 30 minutes to cook. A quick dinner, or cook on Tuesday and warm it up?", ["Quick dinner ideas", "Cook ahead on Tuesday", "Keep it"]));
  await noteTop("New: a late evening. Plan sees the time left to cook before dinner and offers a quick dinner from Chef Mealan, or cooking the day before. Nothing changes unless you tap.");
  await shot("r179d");
  // e, new: a full day, and training in a busy block
  await toDay("Thu");
  await after("Breakfast, 06:30", BUSY("08:00<br>to 20:00"));
  await after("Lunch, 13:15", ASK("Booked from 08:00 to 20:00. Take lunch along?", ["Lunch to carry", "Keep it"]));
  await after("Cardio", ASK("Training at 17:30 is in a busy block. Move it for Thursday?", ["Move to 20:30", "Rest day", "Keep it"]));
  await noteTop("New: a full day. Lunch can become a lunch to carry, made the evening before. Training in a busy block asks once: move it, make the day a rest day, or keep it.");
  await shot("r179e");
  // f, new: moved in Google, back in the app
  await toDay("Fri");
  await page.evaluate((mark) => { const w = [...document.querySelectorAll(".plan-slot-wrap")].find((x) => x.textContent.includes("Dinner, 20:00")); const s = w.querySelector("small"); s.textContent = "Dinner, 21:00"; w.style.cssText += ";" + mark; w.insertAdjacentHTML("beforeend", `<div style="padding:4px 14px 10px"><small style="display:block;font-weight:700;color:#0f6b4e">Moved in Google Calendar, from 20:00</small><button class="link" style="min-height:44px">Back to 20:00</button></div>`); }, mark);
  await noteTop("New: you drag Friday's dinner from 20:00 to 21:00 in Google Calendar. Chef Mealan reads its own calendar, and Friday's dinner is at 21:00 here too, with Back to 20:00. Moving it there is the same as changing it here.");
  await shot("r179f");
  await b.close(); server.kill();
})();
