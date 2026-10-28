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
  const b = await chromium.launch({ args: ["--lang=en-GB"], env: { ...process.env, LANG: "en_GB.UTF-8", LANGUAGE: "en_GB" } });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
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
    const line = (n, v) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e3e8f2"><span style="font-weight:700">${n}</span><input type="time" value="${v}" style="width:auto;max-width:132px;min-width:0;padding:8px 12px;border:1.5px solid #2e7be8;border-radius:12px;background:#eaf1fd;font-weight:800;color:#123a7a;-webkit-appearance:none;appearance:none"></div>`;
    const f = document.createElement("div"); f.style.cssText = "margin-top:8px;padding:4px 8px;" + mark;
    f.innerHTML = line("From", "16:00") + line("To", "23:00") + '<small style="display:block;margin-top:6px">16:00 to 23:00, your time. Meals and training fit around it.</small>';
    wh.appendChild(f); wh.style.cssText += ";" + mark;
    const mt = [...document.querySelectorAll(".setting")].find((n) => /^Meal times/.test(n.firstElementChild?.textContent || ""));
    if (mt) {
      const grid = mt.querySelector(".slot-times, .field-row");
      const box = document.createElement("div"); box.innerHTML = line("Breakfast", "10:00") + line("Lunch", "15:00") + line("Dinner", "19:30");
      if (grid) grid.replaceWith(box);
      const s = document.createElement("small"); s.style.cssText = "display:block;margin-top:6px;color:#123a7a;font-weight:700"; s.textContent = "From your work hours, 16:00 to 23:00: breakfast late morning, the main meal an hour before work, a small one at the break. Change any time and yours stays."; mt.appendChild(s); mt.style.cssText += ";" + mark; }
    const w = document.querySelector(".window-line"); if (w) w.textContent = "Eating window: 10:00 to 19:30. From your first and last meal.";
    const he = [...document.querySelectorAll(".setting")].find((n) => /^How you eat/.test(n.firstElementChild?.textContent || ""));
    if (he) { he.firstElementChild.textContent = "What you eat"; he.style.cssText += ";" + mark; }
  }, { mark });
  await note("^Meal times", "New: a fourth chip, My hours, with From and To; it works past midnight too. The three common ones stay first. Meal times you have not set yourself fit around work; times you set win. Every time is one line, the name left and the time right, so it never runs past the card on an iPhone. How you eat is now What you eat.");
  await shot("r147b");
  // DT147c, now: Training week opens the day below the whole week
  await page.goto(U + "/me/training-week"); await page.waitForTimeout(1300);
  await page.locator(".agenda-row").nth(1).click(); await page.waitForTimeout(500);
  await page.evaluate((mark) => { const r = document.querySelectorAll(".agenda-row")[1]; if (r) r.style.cssText += ";" + mark; const h = document.querySelector(".seg-head"); if (h) h.style.cssText += ";" + mark; }, mark);
  await page.evaluate((NOTE) => { const wc = document.querySelector(".week-card"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "Now: tap Tuesday and it opens below the whole week, after Sunday. On a phone that is off screen, so the tap seems to do nothing. How hard is three big cards."; wc.after(d); }, NOTE);
  await shot("r147c");
  // DT147d, new: the day opens right under itself
  await page.goto(U + "/me/training-week"); await page.waitForTimeout(1300);
  await page.locator(".agenda-row").nth(1).click(); await page.waitForTimeout(500);
  await page.evaluate(({ mark, NOTE }) => {
    const rows = document.querySelectorAll(".agenda-row"), tue = rows[1];
    const head = document.querySelector(".seg-head"), seg = document.querySelector(".card.seg");
    if (!tue || !seg) return;
    for (const n of document.querySelectorAll(".agenda-what")) if (/· evening/.test(n.textContent)) n.textContent = n.textContent.replace("· evening", "· morning");
    const box = document.createElement("div"); box.style.cssText = "margin:-2px 0 8px;padding:10px 12px;background:#fff;border-radius:0 0 14px 14px;border:1px solid #d9e2f2;border-top:0;" + mark;
    tue.style.cssText += ";border-radius:14px 14px 0 0;margin-bottom:0";
    const why = document.createElement("small"); why.className = "muted"; why.style.display = "block"; why.style.marginBottom = "12px"; why.textContent = "Every Tuesday. To change one date, open that day on Plan. Tap Tuesday again to close."; box.appendChild(why);
    while (seg.firstChild) box.appendChild(seg.firstChild);
    tue.after(box); seg.remove(); if (head) head.remove();
    // How hard: three chips, the zones of the one picked
    const hh = [...box.querySelectorAll(".setting")].find((n) => /^How hard/.test(n.firstElementChild?.textContent || ""));
    if (hh) { const list = hh.querySelector(".activity-list"); const c = document.createElement("div"); c.className = "chip-row";
      c.innerHTML = ["Light", "Moderate", "Hard"].map((x) => `<button class="choice ${x === "Moderate" ? "on" : ""}">${x}</button>`).join("");
      const z = document.createElement("small"); z.className = "setting-hint"; z.innerHTML = "<b>Zone 2</b> easy, you talk in full sentences · <b>Zone 3</b> steady, you talk in short sentences. <span style='color:#2e7be8;font-weight:700'>What the zones are ›</span>";
      if (list) { list.replaceWith(c); c.after(z); } }
    const st = [...box.querySelectorAll(".setting")].find((n) => /^When/.test(n.firstElementChild?.textContent || ""));
    if (st) { for (const c of st.querySelectorAll("button")) { if (/Evening/.test(c.textContent)) { c.classList.remove("on"); c.innerHTML = 'Evening <small style="font-weight:400;opacity:.75">· in work hours</small>'; } if (/Morning/.test(c.textContent)) c.classList.add("on"); }
      const s = document.createElement("small"); s.style.cssText = "display:block;margin-top:4px"; s.textContent = "Chef Mealan suggests training outside your work hours, 16:00 to 23:00. Every time stays open: a break at work can be gym time."; st.appendChild(s); st.style.cssText += ";" + mark; }
    for (const n of box.querySelectorAll("small, p, div")) if (n.childElementCount === 0 && /From Lifestyle: fixed hours, 9 to 5/.test(n.textContent)) n.textContent = n.textContent.replace("fixed hours, 9 to 5", "your hours, 16:00 to 23:00");
    // Day off shows at the right end, like Work
    for (const r of document.querySelectorAll(".agenda-row")) { const sm = r.querySelector("small"); if (sm && !sm.textContent.trim()) { sm.textContent = "Day off"; sm.className = "work"; } }
    // Your day: say what it is for
    const yd = [...box.querySelectorAll(".setting")].find((n) => /^Your day/.test(n.firstElementChild?.textContent || ""));
    if (yd) { yd.firstElementChild.textContent = "Work or day off"; for (const n of yd.querySelectorAll("small")) if (/From Lifestyle/.test(n.textContent)) n.remove();
      const h = document.createElement("small"); h.className = "setting-hint"; h.style.display = "block"; h.textContent = "Not your training: how the rest of the day goes. A work day counts how you move at work, mostly sitting; your training comes on top. Your work hours, 16:00 to 23:00, keep training suggestions out of work."; yd.appendChild(h); yd.style.cssText += ";" + mark; }
    // Move and Copy: one line at the bottom
    const mv = box.querySelector(".move-to"); if (mv) mv.remove();
    const cp = [...box.querySelectorAll("button")].find((b) => /^Copy Tuesday/.test(b.textContent || ""));
    if (cp) { const l = document.createElement("div"); l.style.cssText = "display:flex;gap:18px;flex-wrap:wrap;padding:10px 2px 4px;border-top:1px solid #e3e8f2;margin-top:6px;" + mark; l.innerHTML = '<button class="link" style="font-weight:800">Move to another day ›</button><button class="link" style="font-weight:800">Copy to other days ›</button>'; cp.replaceWith(l); }
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New: Tuesday opens right under Tuesday, as in setup. Tap Tuesday again and it closes. Tap Thursday and Thursday opens too; Tuesday stays open until you tap it. How hard is three chips, with the zones of the one picked. Evening stays open, marked in work hours. Your day is now Work or day off, with what it does. Move and Copy are one line at the end; each opens its day chips there. Day off shows on the right, like Work.";
    document.querySelector(".week-card").before(d);
  }, { mark, NOTE });
  await shot("r147d");
  await b.close(); server.kill();
})();
