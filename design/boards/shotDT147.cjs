// DT147 (Marko, Tester 3, 28 October: Canadian working hours from Cyprus): your own work hours, and meals and training around them
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3315", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-28T21:55:00"));
  const plan = [0, 1, 2, 3, 4, 5, 6].map((i) => ([1, 3].includes(i) ? { work: i < 5, kind: "strength", intensity: "moderate", minutes: 55, when: "evening" } : { work: i < 5, kind: "rest" }));
  await page.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, plan, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-28T16:00:00Z", consentBodyAt: "2026-10-28T16:00:00Z", declaredAt: "2026-10-28T16:00:00Z", aiConfirmedAt: "2026-10-28T16:00:00Z" }));
    localStorage.setItem("chefmealan-region", "limassol"); localStorage.setItem("seeded", "1"); }, [seed, plan]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name) => { await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const note = (el, text) => page.evaluate(({ el, text, NOTE }) => { const x = [...document.querySelectorAll(".setting, .seg, section, div")].find((n) => n.querySelector(":scope > .setting-name, :scope > b, :scope > small") && new RegExp(el).test((n.firstElementChild?.textContent || "").trim())); if (!x) return; const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = text; x.before(d); }, { el, text, NOTE });
  const markSetting = (re) => page.evaluate(({ re, mark }) => { for (const n of document.querySelectorAll(".setting")) if (new RegExp(re).test((n.firstElementChild?.textContent || "").trim())) n.style.cssText += ";" + mark; }, { re, mark });
  // DT147a, now
  await page.goto(U + "/me/lifestyle"); await page.waitForTimeout(1300);
  await markSetting("^Working hours"); await markSetting("^Meal times");
  await note("^Meal times", "Now (0.2.127): Marko works Canadian hours from Cyprus, 16:00 to 23:00. Working hours offers 9 to 5, 8 to 4, 7 to 3. And whatever is picked changes nothing: meal times stay 07:30, 13:45, 20:00, and training stays evening.");
  await shot("r147a");
  // DT147b, new: My hours, and meal times that fit around them
  await page.goto(U + "/me/lifestyle"); await page.waitForTimeout(1300);
  await page.evaluate(({ mark }) => {
    const wh = [...document.querySelectorAll(".setting")].find((n) => /^Working hours/.test(n.firstElementChild?.textContent || "")); if (!wh) return;
    const chipRows = wh.querySelectorAll(".chips, .chip-row, .moments"); const row = chipRows[chipRows.length - 1];
    if (row) { for (const c of row.querySelectorAll("button")) c.classList.remove("on"); const my = document.createElement("button"); my.className = "choice on"; my.textContent = "My hours"; row.appendChild(my); }
    const f = document.createElement("div"); f.style.cssText = "margin-top:8px;padding:8px;" + mark;
    f.innerHTML = '<div class="field-row"><label class="field field-on"><span>From</span><input type="time" value="16:00"></label><label class="field field-on"><span>To</span><input type="time" value="23:00"></label></div><small style="display:block;margin-top:4px">16:00 to 23:00, your time. Meals and training fit around it.</small>';
    wh.appendChild(f); wh.style.cssText += ";" + mark;
    const mt = [...document.querySelectorAll(".setting")].find((n) => /^Meal times/.test(n.firstElementChild?.textContent || ""));
    if (mt) { const ins = mt.querySelectorAll("input[type=time]"); const v = ["10:00", "15:00", "19:30"]; ins.forEach((x, i) => { if (v[i]) x.value = v[i]; }); const s = document.createElement("small"); s.style.cssText = "display:block;margin-top:4px;color:#123a7a;font-weight:700"; s.textContent = "From your work hours, 16:00 to 23:00: breakfast late morning, the main meal an hour before work, a small one at the break. Change any time and yours stays."; mt.appendChild(s); mt.style.cssText += ";" + mark; }
    const w = document.querySelector(".window-line"); if (w) w.textContent = "Eating window: 10:00 to 19:30. From your first and last meal.";
  }, { mark });
  await note("^Meal times", "New: a fourth chip, My hours, with From and To; it works past midnight too. The three common ones stay first. Meal times you have not set yourself fit around work; times you set win.");
  await shot("r147b");
  // DT147c, new: training is not suggested when you work
  await page.goto(U + "/me/training-week"); await page.waitForTimeout(1300);
  await page.locator(".agenda-row").nth(1).click(); await page.waitForTimeout(500);
  await page.evaluate(({ mark }) => {
    const st = [...document.querySelectorAll(".setting")].find((n) => /^When/.test(n.firstElementChild?.textContent || "")); if (!st) return;
    for (const c of st.querySelectorAll("button")) { if (/Evening/.test(c.textContent)) { c.classList.remove("on"); c.style.opacity = "0.45"; c.textContent = "Evening · you work then"; } if (/Morning/.test(c.textContent)) c.classList.add("on"); }
    for (const n of document.querySelectorAll("small, p, div")) if (n.childElementCount === 0 && /From Lifestyle: fixed hours, 9 to 5/.test(n.textContent)) n.textContent = n.textContent.replace("fixed hours, 9 to 5", "your hours, 16:00 to 23:00");
    for (const n of document.querySelectorAll(".agenda-row *")) if (n.childElementCount === 0 && /· evening/.test(n.textContent)) n.textContent = n.textContent.replace("· evening", "· morning");
    const s = document.createElement("small"); s.style.cssText = "display:block;margin-top:4px"; s.textContent = "Training is suggested outside your work hours, 16:00 to 23:00. You can still pick any time."; st.appendChild(s); st.style.cssText += ";" + mark;
  }, { mark });
  await note("^When", "New on Training week and in setup: the time a training day is suggested at keeps out of work. Marko's Tuesday moves to the morning; evening says you work then.");
  await shot("r147c");
  await b.close(); server.kill();
})();
