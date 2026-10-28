// DT139 (Anna's DT118 with parts of DT120, DT122 and DT124, brought up to 0.2.123): the setup screen
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3308", U = `http://127.0.0.1:${PORT}`;
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
  const shot = async (name) => { await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const open = async () => { await page.goto(U + "/"); await page.waitForTimeout(1500); const e = page.getByRole("button", { name: "Edit" }).first(); if (await e.count()) { await e.click(); await page.waitForTimeout(400); } };
  const markText = (re) => page.evaluate(({ re, mark }) => { for (const el of document.querySelectorAll(".goal-screen *")) if (el.children.length < 3 && new RegExp(re).test(el.textContent || "") && (el.textContent || "").length < 140) el.style.cssText += ";" + mark; }, { re, mark });
  const note = (sel, text) => page.evaluate(({ sel, text, NOTE }) => { const el = document.querySelector(sel); if (!el) return; const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = text; el.after(d); }, { sel, text, NOTE });
  // DT139a, now
  await open();
  await markText("^2\\. The formula$|^3\\. What are you after\\?$|^Your everyday|four numbers");
  await page.evaluate((mark) => { const on = document.querySelector(".goal-pick.on"); if (on) on.style.cssText += ";" + mark; const f = document.querySelector(".formula-card, .formula"); if (f) f.style.cssText += ";" + mark; }, mark);
  await note(".hero", "Now (0.2.123), the first screen after the 18+ tap and the coach code. Anna: the formula block (Mifflin St Jeor, Katch McArdle, Schofield) on her first screen; the numbers skip (1, then 3); four numbers, but five shown; Maintain picked for her; Your everyday here, Lifestyle everywhere else.");
  await shot("r139a");
  // DT139b, new
  await open();
  await page.evaluate(({ mark }) => {
    const hero = document.querySelector(".hero p"); if (hero) { hero.textContent = "Your day in five numbers. Every plate is measured against them."; hero.style.cssText += ";" + mark; }
    for (const el of document.querySelectorAll(".calc-part b")) if (el.textContent === "Your everyday") { el.textContent = "Lifestyle"; el.parentElement.style.cssText += ";" + mark; }
    const steps = [...document.querySelectorAll(".calc-step, .section-title")];
    for (const el of steps) {
      if (/^2\. The formula$/.test(el.textContent)) { let n = el.nextElementSibling; if (n) n.remove(); el.outerHTML = '<p class="small" style="' + mark + ';padding:6px 8px">How we calculate › <span style="color:#5b6478">Automatic, from your body and your week. The formula names and the choice are behind this line.</span></p>'; }
    }
    for (const el of document.querySelectorAll(".calc-step, .section-title")) { if (/^3\. What are you after/.test(el.textContent)) { el.textContent = "2. What are you after?"; el.style.cssText += ";" + mark; } if (/^4\. Your days/.test(el.textContent)) { el.textContent = "3. Your days"; el.style.cssText += ";" + mark; } }
    const on = document.querySelector(".goal-pick.on"); if (on) { const s = document.createElement("small"); s.style.cssText = "display:block;margin:6px 0;color:#123a7a;font-weight:700;" + mark; s.textContent = "Nothing is picked for you: your numbers and Apply appear once you pick. Here Maintain, picked by you."; on.closest(".goal-cards")?.before(s); }
    const four = document.querySelector(".four"); if (four) { const s = document.createElement("small"); s.style.cssText = "display:block;margin:6px 0;" + mark; s.textContent = "PD: grams of protein per 100 kcal, the number that tells a food from a marketing claim."; four.after(s); }
    const apply = [...document.querySelectorAll("button")].find((x) => /^Apply from/.test(x.textContent)); if (apply) { const s = document.createElement("small"); s.style.cssText = "display:block;margin:6px 0;" + mark; s.textContent = "A coach can adjust these numbers later."; apply.after(s); }
  }, { mark });
  await note(".hero", "New: the formula is automatic and sits behind How we calculate ›; sections numbered as they show (1, 2, 3); five numbers, and PD said in one line where it first appears; no goal picked for you; Lifestyle, one name; one line about the coach under Apply.");
  await shot("r139b");
  await b.close(); server.kill();
})();
