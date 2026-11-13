// Board DT273 (Coach Milan 10 November 07:50 to 08:09, Go with your plan): ＋ Photo says what it does, and a cook left open
// for more than a day is asked about once. From his test: a restaurant pancake went in as one more photo of an old plate.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3711", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.meals = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "estimate", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(ROOT + "/tests/flows/plate.jpg").toString("base64");
const day = (d, h, m) => new Date(2026, 10, d, h, m).toISOString();
const items = [[200, "Liquid egg whites", 48, 10.5, 0.2, 0.7], [35, "Hazelnut cocoa spread", 540, 6, 31, 57], [5, "Butter", 717, 0.9, 81, 0.1]].map(([g, n, c, p, f, cb], k) => ({ id: "o" + k, grams: g, locked: false, fromPhoto: true, est: { low: Math.round(g * 0.8), high: Math.round(g * 1.25) }, food: F("of" + k, n, c, p, f, cb) }));
const cook = { id: "ck1", startedAt: new Date(2026, 9, 28, 13, 30).toISOString(), title: "Chicken rice bowl", stage: "make", plate: { items: [], title: "Chicken rice bowl" }, ui: { ticks: [] }, steps: 5 };
const state = { ...seed, cook, items, title: "Sweet egg white pancake", photo: { image: PHOTO, at: day(10, 7, 30), who: "now", unsure: null, which: null }, plateAt: day(10, 7, 30) };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date(2026, 10, 10, 7, 43));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, state);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/plate"); await p.waitForTimeout(1500); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, tall) => { if (tall) await p.setViewportSize({ width: 390, height: tall }); await p.evaluate((sel) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - 90 : 0); }, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  // a. now: the photo block with Retake and + Photo
  let p = await open();
  if (process.env.DBG) console.log(await p.evaluate(() => [...document.querySelectorAll("main button")].map((x) => x.className + ":" + x.innerText.replace(/\n/g, " ").slice(0, 30)).join(" | ")));
  const PHOTOBTN = await p.evaluate(({ mark }) => { const b = [...document.querySelectorAll("main button, main label")].find((x) => /＋ Photo|\+ Photo/.test(x.innerText)); if (!b) return null; b.style.cssText += ";" + mark; b.parentElement.classList.add("the-plus"); return true; }, { mark });
  await note(p, "Now (0.3.121), the Plate, under the photo: ＋ Photo adds one more photo of this same meal, and the photos are read together as one plate. It does not say so. A photo of a different meal goes into the old plate.", PHOTOBTN ? ".the-plus" : "main section", PHOTOBTN ? "afterend" : "afterbegin");
  await shot(p, "rdt273a", ".the-plus");
  // b. new: + Photo asks which
  p = await open();
  await p.evaluate(({ mark }) => { const b = [...document.querySelectorAll("main button, main label")].find((x) => /＋ Photo|\+ Photo/.test(x.innerText)); const row = b.parentElement; row.classList.add("the-plus"); const B = "border-radius:14px;padding:10px 12px;text-align:left;font:inherit;font-weight:800;font-size:15px;line-height:1.35;min-height:48px;cursor:pointer";
    row.insertAdjacentHTML("afterend", `<div class="plus-ask" style="${mark};background:#fff;padding:12px;margin-top:10px;display:flex;flex-direction:column;gap:8px"><b style="font-size:15px">What is the new photo?</b>
      <button style="${B};background:#2a72d9;color:#fff;border:1.5px solid #2a72d9">Another photo of this meal<small style="display:block;font-weight:600;font-size:12.5px;color:#fff !important">The inside, another side, the menu. Read together as one plate.</small></button>
      <button style="${B};background:#fff;color:#1f5fc7;border:1.5px solid #d1dcf0">A different meal<small style="display:block;font-weight:600;font-size:12.5px;color:#53627f">A new plate. This one is saved for later.</small></button>
      <button class="link" style="min-height:44px;align-self:flex-start">Cancel</button></div>`); }, { mark });
  await note(p, "New, the Plate: ＋ Photo asks first what the photo is. Another photo of this meal is as today. A different meal starts a new plate; the one on the Plate is saved for later, where Today and the Plate already show such plates.", ".plus-ask");
  await p.evaluate(() => { const x = document.querySelector(".plus-ask small"); x.style.setProperty("color", "#fff", "important"); }); await shot(p, "rdt273b", ".the-plus");
  // c. now: the strip of a cook left open
  p = await open();
  await note(p, "Now (0.3.121), the Plate: a cook started on 28 October and left at step 1 of 5 stays as a strip on Today and the Plate for good. Each new plate from a photo asks about it again.", ".cook-strip", "afterend");
  await shot(p, "rdt273c");
  // d. new: asked once after a day
  p = await open();
  await p.evaluate(({ mark }) => { const s = document.querySelector(".cook-strip"); s.insertAdjacentHTML("afterend", `<section class="card stale-cook" style="${mark};display:flex;flex-direction:column;gap:10px;padding:14px"><b style="font-size:16px">You started Chicken rice bowl on 28 October and stopped at step 1 of 5.</b><small style="font-size:14px;color:#53627f;line-height:1.45">That is 13 days ago. Go on with it, or end it?</small>
      <div style="display:flex;gap:8px"><button class="pill pill-small pill-primary" style="min-height:48px;flex:1">End it</button><button class="pill pill-small" style="min-height:48px;flex:1">Go on with it</button></div>
      <small style="font-size:13px;color:#53627f;line-height:1.45">End it keeps nothing of its steps. Your recipe stays as it is.</small></section>`); s.remove(); }, { mark });
  await note(p, "New, the Plate and Today: a cook left open for more than a day is asked about once, in place of the strip. End it is the first button. After Go on with it the strip is back and the question does not come again for that cook.", ".stale-cook");
  await shot(p, "rdt273d");
  await b.close(); server.kill();
})();
