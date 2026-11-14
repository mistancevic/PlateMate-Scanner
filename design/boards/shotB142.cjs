// Board B142 (Coach Milan 14 November 17:16, Draw): the review card on Clients names the day of each kept line.
// Now: two lines "Kept on purpose: carbs are low for a training day" with no day. New: "Moderate day, kept on purpose: ...".
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/platemate-scanner", PORT = "3512", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = []; seed.meals = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const PERSONAL = { dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, life: "desk", week: { passive: 2, active: 1, easy: 2, hard: 2 }, easyMin: 60, hardMin: 75,
  ownDays: { passive: { kcal: 2350, protein: 185, fats: 80, carbs: 222 }, active: { kcal: 2400, protein: 190, fats: 80, carbs: 230 }, easy: { kcal: 2500, protein: 190, fats: 80, carbs: 255 }, hard: { kcal: 2600, protein: 190, fats: 80, carbs: 280 } },
  plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } };
const LINE = (title, body) => `<div class="finding"><b>${title}</b><span>${body}</span><small>AND, DC and ACSM joint position, 2016</small></div>`;
const REVIEW = (lines) => `<section class="card review-card" id="rev" style="margin:6px 0 10px;${mark}"><b>Nina set new numbers</b><small class="muted">Maintain · each day its own · 2,470 kcal · 14 November</small>
  ${lines}
  <label class="field"><span>A note to Client Nina, if you ask for a change</span><textarea rows="2" placeholder="Add 60 g of carbs on hard days, rice or oats after training."></textarea></label>
  <div class="button-row"><button class="pill pill-small">Ask to change</button><button class="pill pill-small pill-primary">Approve</button></div>
  <button class="link">Open Client Nina's numbers ›</button></section>`;
const MOD = "2.7 g per kg here. An hour of training a day usually needs 5 to 7.", HARD = "2.9 g per kg here. Heavy or long training usually needs 6 to 10.";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const ctxOf = async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage(); p.on("pageerror", (e) => console.log("ERR", e.message)); return p; };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, off = 120) => { await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const client = async () => { const p = await ctxOf();
    await p.addInitScript(({ s, per }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify(per));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { s: seed, per: PERSONAL });
    await require(ROOT + "/tests/flows/adult.cjs")(p); await p.goto(U + "/me/goal"); await p.waitForTimeout(1500);
    await p.getByRole("button", { name: /Change the goal/ }).click(); await p.waitForTimeout(600);
    await p.evaluate(() => document.querySelectorAll(".chat-fab").forEach((x) => (x.style.visibility = "hidden"))); return p; };
  const coach = async (lines, txt) => { const p = await ctxOf();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1500);
    await p.locator(".bottom-nav button").filter({ hasText: "Clients" }).click(); await p.waitForTimeout(1200);
    await p.evaluate(() => { const f = document.querySelector(".chat-fab"); if (f) f.style.visibility = "hidden"; });
    await p.evaluate((html) => { document.querySelector("main section.card.waiting small.muted").insertAdjacentHTML("afterend", html); }, REVIEW(lines));
    await note(p, txt, "#rev"); await shot(p, lines.includes("Moderate day") ? "r142c2" : "r142c1", "#rev", 150); };
  try {
    // 1. the client's Goal screen: the two findings, each under its own day
    let p = await client();
    await p.evaluate((mark) => { const fs = [...document.querySelectorAll(".finding")].filter((f) => /Carbs are low/.test(f.textContent)); fs.forEach((f) => (f.style.cssText += ";" + mark)); fs[0].id = "f1"; }, mark);
    await note(p, "1. The client opens Goal, Change the goal, own numbers. Under the Moderate row and under the Hard row: Carbs are low for a training day. Each sits under its own day.", "#f1");
    await shot(p, "r142a", "#f1", 330);
    // 2. kept on purpose, then Apply: the lines stay under their days; the kept lines go to the coach
    p = await client();
    for (let i = 0; i < 2; i++) { await p.locator(".finding").filter({ hasText: "Carbs are low" }).first().getByRole("button", { name: /Keep, on purpose/ }).click(); await p.waitForTimeout(300); }
    await p.evaluate((mark) => { const ks = [...document.querySelectorAll(".finding-kept")].filter((f) => /carbs are low/.test(f.textContent)); ks.forEach((f) => (f.style.cssText += ";" + mark)); ks[0].id = "k1"; }, mark);
    await note(p, "2. Keep, on purpose on both. Each row now says Kept on purpose: carbs are low for a training day. Apply sends the kept lines to the coach.", "#k1");
    await shot(p, "r142b", "#k1", 300);
    // 3. the coach's review card, now and new
    await coach(LINE("Kept on purpose: carbs are low for a training day", MOD) + LINE("Kept on purpose: carbs are low for a training day", HARD),
      "3. Now: Clients, Waiting for you. Two lines with the same title and no day. They read like the same thing twice.");
    await coach(LINE("Moderate day, kept on purpose: carbs are low for a training day", MOD) + LINE("Hard day, kept on purpose: carbs are low for a training day", HARD),
      "3. New: each kept line starts with its day. A line about the whole week (energy, protein, fat) stays as it is.");
  } finally { await b.close(); server.kill(); }
})();
