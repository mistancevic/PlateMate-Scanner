// Board DT283 (Coach Milan 12 November 07:08, "draw on the board"): Drawn by AI as a choice under the gallery. A photo picked in
// the gallery says who made it; a picture drawn by AI says so on the step and in cook mode, as a step picture does today.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3714", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.items = []; seed.feedback = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const W = (n) => "data:image/webp;base64," + fs.readFileSync(`${ROOT}/public/landing/hero/${n}-m.webp`).toString("base64");
const P = { curry: W("curry"), ques: W("quesadilla"), sq: W("squares") };
const F = (id) => seed.foods.find((f) => f.id === id);
const steps = ["Toast the bread.", "Fry the eggs.", "Fill the sandwiches with the eggs and the chicken."];
const meal = { id: "m-s", title: "Egg and turkey sandwiches", items: [{ id: "a", food: F("f-bread"), grams: 100, locked: false }, { id: "b", food: F("f-egg"), grams: 208, locked: false }, { id: "c", food: F("f-chicken"), grams: 60, locked: false }], portion: 368, steps, savedAt: "2026-11-10T10:00:00Z",
  photo: P.ques, photos: [], stepPics: [null, null, P.sq], stepPicMeta: [null, null, { by: "ai", step: steps[2] }] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { ...seed, meals: [meal] });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-s"); await p.waitForTimeout(1500); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, tall) => { if (tall) await p.setViewportSize({ width: 390, height: tall }); await p.evaluate((sel) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - 90 : 0); }, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name, sel && await p.locator(sel).count()); await p.context().close(); };
  const pick = async (p, n) => { await p.locator(".rq-thumbs .publish-photo").nth(n).click(); await p.waitForTimeout(400); };
  // a. now: a photo picked in the gallery
  let p = await open(); await pick(p, 1);
  await note(p, "Now (0.3.136), the recipe page: a photo picked in the gallery offers the cover, its step and Delete. Nothing says who made it. This one was drawn by AI on its step, and the gallery does not show that. A photo added here counts as yours.", ".rq-thumbs");
  await shot(p, "rdt283a", ".bnote", 1000);
  // b. new: Who made it? under the picked photo
  p = await open(); await pick(p, 1);
  await p.evaluate(({ mark }) => {
    const g = document.querySelector(".rq-gal-pick"), del = g.querySelector(".rq-gal-del");
    const d = document.createElement("div"); d.style.cssText = mark + ";padding:6px";
    d.innerHTML = `<b>Who made it?</b><div class="sp-grid" style="margin-top:6px"><button class="choice">My photo</button><button class="choice on" aria-pressed="true">Drawn by AI</button></div><small class="muted" style="display:block;margin-top:6px">Drawn by AI says so under the picture, in cook mode and in Watch the steps. The step's words and amounts stay what counts.</small>`;
    g.insertBefore(d, del);
    const th = document.querySelectorAll(".rq-thumbs .rq-thumb")[1]; const t = document.createElement("span");
    t.textContent = "AI"; t.style.cssText = "position:absolute;left:4px;bottom:4px;background:#172742;color:#fff;font-size:12px;font-weight:800;border-radius:6px;padding:1px 6px;" + mark; th.style.position = "relative"; th.appendChild(t);
  }, { mark });
  await note(p, "New, the recipe page: the picked photo asks Who made it? My photo or Drawn by AI. A photo drawn by AI carries a small AI tag in the gallery.", ".rq-thumbs");
  await shot(p, "rdt283b", ".bnote", 1150);
  // c. as it is: a step picture drawn by AI, on the step
  p = await open();
  await note(p, "As it is today, and the same for a gallery photo marked Drawn by AI once it is on a step: the step shows AI · Beta under its picture, and cook mode says Picture drawn by AI, Beta.", ".rp-step-col, .rq-steps", "afterbegin");
  await shot(p, "rdt283c", ".bnote", 1000);
  await b.close(); server.kill();
})();
