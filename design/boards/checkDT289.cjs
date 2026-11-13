// Board DT289 (Coach Milan 12 November 14:22 to 15:00, 16:58 Draw): button rules across the app, one rule for every language.
// The main action on the right; actions are buttons (main filled blue, second white with a blue border, delete white with a red
// border, filled red on Sure?); text links only go somewhere or back out.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/platemate-scanner", PORT = "3491", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const F = (n) => seed.foods.find((x) => x.name === n);
seed.meals = [{ id: "sarma", title: "Sarma with skyr", savedAt: "2026-10-01T08:00:00Z", portion: 400, items: [["Rice, cooked", 150], ["Chicken breast, cooked", 150], ["Skyr, natural", 100]].map(([n, g], i) => ({ id: "s" + i, food: F(n), grams: g, locked: true })), steps: ["Cook the rice.", "Add the chicken.", "Serve with skyr."] }];
const planned = { "2026-11-11": { dinner: { title: "Sarma with skyr", kcal: 610, protein: 52, source: "mine", mealId: "sarma", items: seed.meals[0].items } } };
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const RED = "background:#fff;border:1.5px solid #b3261e;color:#b3261e;font-weight:800", REDFILL = "background:#b3261e;border:1.5px solid #b3261e;color:#fff;font-weight:800", WHITE = "background:#fff;border:1.5px solid #2a72d9;color:#1f5fc7;font-weight:800";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (path) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-12T12:40:00+01:00"));
    await p.addInitScript(({ s, planned }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-planned", JSON.stringify(planned));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { s: seed, planned });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1500);
    await p.evaluate(() => { const f = document.querySelector(".chat-fab"); if (f) f.style.visibility = "hidden"; });
    return p;
  };
  const noteAt = (p, t, sel, up = "section") => p.evaluate(({ t, NOTE, sel, up }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; const e = document.querySelector(sel); (e.closest(up) || e).insertAdjacentElement("beforebegin", d); }, { t, NOTE, sel, up });
  const markEl = (p, sel) => p.evaluate(({ sel, mark }) => { const e = document.querySelector(sel); e.style.cssText += ";" + mark; e.id = e.id || "marked"; }, { sel, mark });
  const shot = async (p, name, sel, off = 360) => { await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const plain = async (path, sel, name, off = 360, click) => { const p = await open(path); if (click) { await p.locator(click).click(); await p.waitForTimeout(500); } await shot(p, name, sel, off); };
  await plain("/today", ".ht-see", "v289a");
  await plain("/plan?day=2026-11-11", ".past-planned .button-row", "v289b", 300);
  await plain("/my-recipes/sarma", ".rq-delete", "v289c", 420);
  await plain("/my-recipes/sarma", ".dl-card .button-row", "v289d", 560, ".rq-delete");
  await b.close(); server.kill();
})();
