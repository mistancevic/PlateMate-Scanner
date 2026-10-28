// DT140 (Anna's DT117, brought up to 0.2.124): training days asked in setup, and a day moved keeps its time
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3310", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-28T17:00:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1990, heightCm: 170, weightKg: 66, steps: "7to10", plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-28T16:00:00Z", consentBodyAt: "2026-10-28T16:00:00Z", declaredAt: "2026-10-28T16:00:00Z", aiConfirmedAt: "2026-10-28T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const clip = async (name, sel) => { await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); const el = page.locator(sel).first(); const bb = await el.boundingBox(); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, bb.y - 60), width: 390, height: Math.min(1700, bb.height + 520) } }); console.log("shot " + name); };
  const note = (sel, text) => page.evaluate(({ sel, text, NOTE }) => { const el = document.querySelector(sel); if (!el) return; const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = text; el.before(d); }, { sel, text, NOTE });
  const setup = async () => { await page.goto(U + "/"); await page.evaluate(() => { const p = JSON.parse(localStorage.getItem("chefmealan-personal")); p.plan = Array(7).fill({ work: true, kind: "rest" }); localStorage.setItem("chefmealan-personal", JSON.stringify(p)); }); await page.reload(); await page.waitForTimeout(1500); await page.getByRole("button", { name: "Edit" }).first().click(); await page.waitForTimeout(300);
    for (let i = 0; i < 3; i++) { await page.getByRole("button", { name: "More Moderate days" }).click(); await page.waitForTimeout(120); } };
  // DT140a, now: the count only; the app picks the days
  await setup();
  await page.evaluate((mark) => { const t = document.querySelector(".train-week"); if (t) t.style.cssText += ";" + mark; }, mark);
  await note(".train-week", "Now (0.2.124): Anna taps + three times for Moderate. No days, no time: the app puts them on Monday, Thursday and Tuesday, in the evening, on a Training week she never sees. Her Friday class reads as a rest day.");
  await clip("r140a", ".train-week");
  // DT140b, new (version 2, Milan 28 October 17:39): the week itself is the source; tap a day, say how hard; the count follows
  await page.goto(U + "/"); await page.evaluate(() => { const p = JSON.parse(localStorage.getItem("chefmealan-personal")); p.plan = Array(7).fill({ work: true, kind: "rest" }); localStorage.setItem("chefmealan-personal", JSON.stringify(p)); }); await page.reload(); await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Edit" }).first().click(); await page.waitForTimeout(300);
  await page.evaluate(({ mark }) => {
    const tw = document.querySelector(".train-week"); if (!tw) return;
    const day = (d, what, on, open) => `<div style="border:1px solid ${on ? "#2e7be8" : "#d9e2f2"};border-left:6px solid ${on ? "#2e9d6a" : "#d9e2f2"};border-radius:12px;padding:10px 12px;margin:6px 0;background:#fff">
      <div style="display:flex;justify-content:space-between;font-weight:700"><span>${d}</span><span style="color:${on ? "#172742" : "#8a93a6"};font-weight:${on ? 700 : 400}">${what}</span></div>${open || ""}</div>`;
    const chip = (t, on) => `<button class="choice ${on ? "on" : ""}" style="min-width:0;padding:6px 10px">${t}</button>`;
    const fri = `<div style="margin-top:8px"><small class="setting-name">How hard</small><div class="chip-row" style="gap:6px">${chip("No training")}${chip("Light")}${chip("Moderate", true)}${chip("Hard")}</div>
      <small class="setting-name" style="display:block;margin-top:6px">How long</small><div class="chip-row" style="gap:6px">${chip("30 to 45 min")}${chip("45 to 60 min", true)}${chip("60 to 90 min")}</div>
      <small class="setting-name" style="display:block;margin-top:6px">When</small><div class="chip-row" style="gap:6px">${chip("Morning")}${chip("Midday")}${chip("Evening", true)}</div></div>`;
    tw.innerHTML = '<div style="padding:8px;' + mark + '"><small style="display:block;color:#5b6478;margin-bottom:4px">Tap the days you train. Each one says how hard, how long and when.</small>' +
      day("Mon", "Moderate · 45 to 60 min · evening", true) + day("Tue", "No training", false) + day("Wed", "Moderate · 45 to 60 min · evening", true) + day("Thu", "No training", false) +
      day("Fri", "Moderate · 45 to 60 min · evening", true, fri) + day("Sat", "No training", false) + day("Sun", "No training", false) +
      '<div style="display:flex;justify-content:space-between;margin-top:8px;font-weight:700"><span>3 training days</span><small>Mon, Wed, Fri · 4 without</small></div>' +
      '<small style="display:block;margin-top:4px;color:#5b6478">The same week you see in Me, Training week: one week, set here, changed there.</small></div>';
  }, { mark });
  await note(".train-week", "New, version 2: no count to type. The week is the source: tap a day, say how hard, how long and when. The count follows from the days (3 training days: Mon, Wed, Fri). Nothing is guessed; it is the same week as Training week.");
  await clip("r140b", ".train-week");
  // DT140c, new: Training week, Move to keeps the time
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem("chefmealan-personal")); p.plan = [0, 1, 2, 3, 4, 5, 6].map((i) => ([0, 1, 3].includes(i) ? { work: true, kind: "strength", intensity: "moderate", minutes: 55, when: "evening", at: "18:30" } : { work: true, kind: "rest" })); localStorage.setItem("chefmealan-personal", JSON.stringify(p)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" })); });
  await page.goto(U + "/me/training-week"); await page.waitForTimeout(1400);
  await page.locator(".agenda-row").nth(1).click(); await page.waitForTimeout(500);
  await page.evaluate(({ mark }) => {
    const copy = [...document.querySelectorAll("p, small, span")].find((x) => /^Every Tuesday\./.test((x.textContent || "").trim())); if (!copy) return;
    const d = document.createElement("div"); d.style.cssText = "margin:10px 0;padding:8px;" + mark;
    const chip = (t, on) => `<button class="choice ${on ? "on" : ""}" style="min-width:0;padding:6px 10px">${t}</button>`;
    d.innerHTML = '<small class="setting-name">Move Tuesday to</small><div class="chip-row" style="gap:6px">' + ["Mon", "Wed", "Thu", "Fri", "Sat", "Sun"].map((x) => chip(x, x === "Fri")).join("") + '</div><small style="display:block;margin-top:6px">Strength, 45 to 60 min, evening, 18:30, on Friday. Tuesday becomes a day without training. One tap.</small>';
    copy.after(d);
  }, { mark });
  await note(".agenda-row", "New on Training week: Move to, right under the day. The day goes as it is: what, how hard, how long, when, the start time. Today moving a day takes 5 to 7 taps and loses the time.");
  await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/r140c.png`, fullPage: true }); console.log("shot r140c");
  await b.close(); server.kill();
})();
