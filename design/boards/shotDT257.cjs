// Board DT257 (Coach Milan 8 November 00:04 to 00:06): a step's photo and the meal's photo from the camera or the gallery.
// "Now": 0.3.110, Android opens the camera only. "New": a tap offers Camera and Gallery, drawn in by DOM.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3483", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[190, food("c", "Chicken breast", 120, 22.5, 0, 2.6)], [95, food("r", "Basmati rice", 356, 8.5, 78, 0.9)], [145, food("s", "Spinach", 23, 2.9, 3.6, 0.4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Rinse [[i:r|basmati rice]] and cook it in 200 ml water for 12 minutes.", "Cut [[i:c|chicken breast]] into strips and fry 6 minutes.", "Add [[i:s|spinach]] and stir 2 minutes."];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-07T23:30:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-cook-voice", "off");
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); },
      { ...seed, meals: [{ id: "m-b", title: "Chicken rice bowl", items, portion: 430, steps: STEPS, savedAt: "2026-11-07T22:58:00Z" }] });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/my-recipes/m-b"); await p.waitForTimeout(1200);
    await p.locator(".rq-steps button").filter({ hasText: "Start cooking" }).first().click(); await p.waitForTimeout(1200);
    const sk = p.locator(".cook-ready-skip"); if (await sk.count()) { await sk.click(); await p.waitForTimeout(400); }
    return p;
  };
  const note = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).before(d); }, { t, NOTE, sel });
  const shot = async (p, name) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const choice = `<div class="bnew" style="${mark};display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px;padding:4px">
    <button class="pill pill-small" style="min-height:44px">📷 Camera</button><button class="pill pill-small" style="min-height:44px">🖼 Gallery</button><button class="link" style="min-height:44px">Cancel</button></div>`;
  let p = await open();
  await note(p, "Now (0.3.110): Add a photo of this step opens the camera straight away on Android. A picture made in ChatGPT or Gemini, or an older photo, cannot be picked.", ".cook-step");
  await p.evaluate((mark) => { const a = document.querySelector(".cook-add-pic"); if (a) a.style.cssText += ";" + mark; }, mark);
  await shot(p, "r257a");
  p = await open();
  await p.evaluate((html) => { const a = document.querySelector(".cook-add-pic"); a.insertAdjacentHTML("afterend", html); a.style.opacity = ".45"; }, choice);
  await note(p, "New: a tap asks Camera or Gallery, under the button, on every phone. Camera opens the camera as now; Gallery opens the phone's photos. Cancel closes the choice. The same for Take it again under a step's photo.", ".cook-step");
  await shot(p, "r257b");
  p = await open();
  for (let i = 0; i < 3; i++) { await p.locator(".cook-buttons .pill-primary").click(); await p.waitForTimeout(300); }
  await p.evaluate((html) => { const a = document.querySelector(".cook-meal-take") || document.querySelector(".cook-done"); a.insertAdjacentHTML("afterend", html); }, choice);
  await note(p, "New: the meal's photo at the end of cooking, and on Make, asks the same: Camera or Gallery.", ".cook-done");
  await shot(p, "r257c");
  await b.close(); server.kill();
})();
