// Board DT286 and DT287 (Coach Milan with Tester 2, 12 November 13:28 to 13:55; brainstorm 15:00 to 15:35): Chef Mealan's
// suggestions on the Plate and Fill the open slots on Plan. Now: the same three, a general line, a second chat. New: on the goal by
// default, on the plate's weak layer, with the amount and what it changes; chips choose the direction; one conversation.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/pm139", PORT = "3490", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.meals = [];
const salad = { id: "f-orijenta", name: "Orijenta salad", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-01T10:00:00Z", readyToEat: true, fiber: 1.5, calories: 19, protein: 1.3, fats: 0.4, carbs: 2.6 };
seed.foods = [...seed.foods, salad, { id: "f-roggen", name: "Roggen Vollkornbrot", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-01T10:00:00Z", readyToEat: true, fiber: 8, calories: 205, protein: 6.5, fats: 1.4, carbs: 38 }];
seed.items = [{ id: "i1", food: salad, grams: 150, locked: false }];
const NOW = { reply: "Light protein and a little crunchy bread go well with Orijenta salad. That makes a fresh, balanced and complete meal.", ms: 900, suggestions: [
  { action: "add", food: "Chicken breast, cooked", why: "A mild, juicy protein that goes well with the fresh salad.", known: true, calories: 165, protein: 31, fats: 3.6, carbs: 0 },
  { action: "add", food: "Cottage cheese (Hüttenkäse)", why: "A creamy texture that ties the crunchy vegetables together.", known: true, calories: 98, protein: 12, fats: 4, carbs: 3 },
  { action: "add", food: "Roggen Vollkornbrot", why: "Adds fullness and crunch to every bite.", known: true, calories: 205, protein: 6.5, fats: 1.4, carbs: 38 }] };
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (path = "/plate") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-12T12:40:00+01:00"));
    await p.addInitScript(({ s }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { s: seed });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/plate", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(NOW) }));
    await p.goto(U + path); await p.waitForTimeout(1500);
    return p;
  };
  const shot = async (p, name, full = false) => { await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot", name); };
  let p = await open("/plan");
  await p.locator("button.plan-fill").click(); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${R}/r287probe.png`, fullPage: true });
  console.log(await p.evaluate(() => (document.querySelector(".fill-rows")?.closest("div.turn, .turn, section, div") || document.body).outerHTML.slice(0, 2500)));
  await p.context().close();
  await b.close(); server.kill();
})();
