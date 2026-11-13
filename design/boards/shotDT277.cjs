// Board DT277 (Coach Milan 10 November 21:54, a screenshot of Me, Training week): the day rows do not look tappable.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3714", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8"));
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const T = { work: true, kind: "hiit", intensity: "moderate", when: "day", minutes: 45 }, N = { work: true, kind: "rest" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript(({ s, plan }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, plan, lifestyle: { meals: 3, window: { from: "08:00", to: "19:00" } } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { s: seed, plan: [T, N, T, N, T, N, N] });
    await require(ROOT + "/tests/flows/adult.cjs")(p); await p.goto(U + "/"); await p.waitForTimeout(900);
    await require(ROOT + "/tests/flows/me.cjs")(p);
    await p.locator(".menu-row").filter({ hasText: /^Training week/ }).first().click(); await p.waitForTimeout(700); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name, await p.locator(".agenda-row").count()); await p.context().close(); };
  let p = await open();
  await note(p, "Now (0.3.126), Me, Training week: nothing on a day says it can be tapped. The only hint is the small line at the bottom, and the round chef button covers part of it.", ".week-card");
  await shot(p, "rdt277a");
  p = await open();
  await p.evaluate(({ mark }) => { [...document.querySelectorAll(".agenda-row")].forEach((r, i) => { const none = /No training/.test(r.textContent); r.style.display = "flex"; r.style.alignItems = "center";
      r.insertAdjacentHTML("beforeend", `<span style="margin-left:auto;flex:none;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:${none ? 22 : 17}px;color:#1f5fc7;${i < 2 ? mark : ""}">${none ? "＋" : "✏️"}</span>`); });
    const hint = [...document.querySelectorAll(".week-card small, .week-card p")].pop(); if (hint) hint.remove(); }, { mark });
  await note(p, "New, Me, Training week: a pencil on a day that has training, a ＋ on a day with none. The whole row still opens the day, as now. The line under the card goes: the icons say it.", ".week-card");
  await shot(p, "rdt277b");
  await b.close(); server.kill();
})();
