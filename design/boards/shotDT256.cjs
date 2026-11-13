// Board DT256 (Coach Milan 7 November 23:59 to 8 November 00:01): a recipe from a screenshot or a link, whose original steps
// work with your foods as they are, cooks those steps: Start cooking opens without Chef Mealan's way first. "Now": 0.3.110.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3484", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[160, food("c", "Chicken breast", 120, 22.5, 0, 2.6)], [80, food("r", "Basmati rice", 356, 8.5, 78, 0.9)], [120, food("s", "Spinach", 23, 2.9, 3.6, 0.4)], [8, food("o", "Olive oil", 884, 0, 0, 100)], [6, food("g", "Garlic", 149, 6.4, 33, 0.5)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const ORIG = ["Rinse the rice and bring it to the boil in 200 ml water. Cover and cook on low heat for 12 minutes.", "Cut the chicken into strips. Season with salt and pepper.", "Slice the garlic thin.", "Heat the olive oil in a pan on medium high heat. Fry the chicken 6 minutes, turning once, until no pink is left inside.", "Add the spinach and the garlic. Stir 2 minutes, until the spinach wilts.", "Put the rice in a bowl and the chicken and spinach on top."];
const COVER = "data:image/png;base64," + fs.readFileSync("/mnt/user-data/attachments/a3625ff7-4226-57ca-879e-055f53d2dca0/899dfca2-image.png").toString("base64");
const PICS = [1, 2, 3, 4, 5, 6].map((n) => "data:image/jpeg;base64," + fs.readFileSync(`${R}/dt254_step${n}.jpg`).toString("base64"));
const base = { id: "m-b", title: "Chicken rice bowl", items, portion: 374, photos: [COVER], source: { name: "", from: "screenshot", at: "2026-11-07T22:58:00Z", steps: ORIG, foods: items.map((i) => i.food.name) }, savedAt: "2026-11-07T22:58:00Z" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (meal) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-07T23:30:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { ...seed, meals: [meal] });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/status", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ai: true, airtable: false, accessRequired: false }) }));
    await p.goto(U + "/my-recipes/m-b"); await p.waitForTimeout(1800);
    return p;
  };
  const note = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const e = document.querySelector(sel); e.before(d); }, { t, NOTE, sel });
  const shot = async (p, name, sel, off = 70) => { const top = await p.evaluate(({ sel, off }) => Math.max(0, document.querySelector(sel).getBoundingClientRect().top + window.scrollY - off), { sel, off }); await p.evaluate((y) => window.scrollTo(0, y), top); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };

  let p = await open(base);
  await note(p, "Now (0.3.110): from a screenshot. The original's six steps work with your foods as they are, and still Start cooking is grey: it reads only steps written by Chef Mealan or by you.", ".rq-start");
  await shot(p, "r256a", ".rq-start", 560);
  p = await open(base);
  await p.evaluate((mark) => { const s = document.querySelector(".rq-start"); const btn = s.querySelector("button"); btn.disabled = false; btn.className = "pill pill-wide pill-primary"; btn.style.cssText = mark; s.querySelector("small").textContent = "6 steps, read aloud one at a time, as the original writes them."; }, mark);
  await note(p, "New: the original works with your foods, so Start cooking opens and cooks the original's steps as written. Chef Mealan's way stays, for steps with your amounts and your kitchen.", ".rq-start");
  await shot(p, "r256b", ".rq-steps", 20);
  p = await open({ ...base, steps: ORIG, stepPics: PICS, stepPicMeta: ORIG.map((t) => ({ by: "ai", step: t })), stepsFor: items.map((i) => i.food.name) });
  await note(p, "New: after the first cook the steps are the recipe's own, as the original wrote them, each with the picture you added in cook mode. Every step has one, so the cover plays them (0.3.105). The steps are the original's, so no Yours or Original to pick: one list.", ".rq-steps");
  await p.evaluate(() => { const s = document.querySelector(".rq-steps-seg"); if (s) s.remove(); });
  await shot(p, "r256c", ".bnote");
  await b.close(); server.kill();
})();
