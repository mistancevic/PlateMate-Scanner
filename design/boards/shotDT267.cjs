// Board DT267 (Coach Milan 9 November 21:31 to 21:35; Tester 2: "I can't find the picture, the sandwich's values stayed"):
// a past day on Plan shows each eaten meal's picture, a tap opens the meal with its photo and foods, and Cook again is only
// for a meal that came from a recipe.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3496", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.items = []; seed.meals = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = "font-family:Nunito,system-ui,sans-serif;color:#172742";
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const FOODS = [[120, food("b", "Sourdough bread", 250, 9, 48, 1.5)], [60, food("h", "Cooked ham", 115, 20, 1, 3.5)], [50, food("g", "Gruyère", 413, 30, 0.4, 32)], [55, food("e", "Fried egg", 196, 13.6, 0.8, 15)], [90, food("s", "Green salad with dressing", 60, 1.2, 3, 5)]];
const items = FOODS.map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const PIC = "/landing/hero/curry-m.webp";
seed.feedback = [{ id: "f1", meal: { id: "m-out", title: "Croque madame with salad", items, portion: 375, savedAt: "2026-11-07T11:05:00.000Z" }, status: "eaten", taste: "", notes: "", createdAt: "2026-11-07T11:05:00.000Z", photo: PIC, which: "Breakfast" }];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-09T14:42:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 62, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/"); await p.waitForTimeout(900); await p.locator("nav button").filter({ hasText: "Plan" }).click(); await p.waitForTimeout(900);
    const prev = p.getByRole("tab").filter({ hasText: /Sat 7/ }); if (!(await prev.count())) { await p.locator(".week-arrow").first().click(); await p.waitForTimeout(600); }
    await p.getByRole("tab").filter({ hasText: /Sat 7/ }).first().click(); await p.waitForTimeout(700); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, tall) => { if (tall) { await p.setViewportSize({ width: 390, height: tall }); } await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  // a. now
  let p = await open();
  await note(p, "Now (0.3.116), Plan, a past day: the meal read from a photo is a line of text. No picture, a tap does nothing, and the button says Cook again for a breakfast eaten out. After that day the photo cannot be found anywhere.", ".past-plate");
  await shot(p, "rdt267a");
  // b. new: the row with its picture
  p = await open();
  await p.evaluate(({ PIC, mark }) => { const r = document.querySelector(".past-plate"); r.style.cssText = `${mark};display:flex;gap:10px;align-items:center;cursor:pointer`; r.insertAdjacentHTML("afterbegin", `<img src="${PIC}" style="width:56px;height:56px;object-fit:cover;border-radius:10px;flex:none">`); const b = r.querySelector("button"); b.textContent = "Open ›"; }, { PIC, mark });
  await note(p, "New, Plan, a past day: each eaten meal shows its picture, as on Today. The whole row opens the meal. Cook again stays only on a meal that came from a recipe; a meal read from a photo says Open.", ".past-plate");
  await shot(p, "rdt267b");
  // c. new: the meal open
  const rows = FOODS.map(([g, f]) => `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #e3eaf7;font-size:15px"><span>${f.name}</span><b>${g} g</b></div>`).join("");
  const OPEN = `<div style="padding:12px;${F}"><button class="link" style="min-height:44px">‹ Saturday, 7 November</button>
    <b style="font-size:22px;display:block">Croque madame with salad</b><small style="font-size:14px;color:#53627f">Breakfast, 12:05 · read from your photo</small>
    <img src="${PIC}" style="${mark};width:100%;aspect-ratio:4/3;object-fit:cover;display:block;margin-top:12px">
    <div style="display:flex;gap:8px;margin-top:8px"><img src="${PIC}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;filter:hue-rotate(20deg)"><img src="${PIC}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;filter:hue-rotate(40deg)"></div>
    <div style="display:flex;gap:18px;margin-top:14px;font-size:15px"><span><b style="font-size:20px">737</b> kcal</span><span><b style="font-size:20px">46 g</b> protein</span><span><b style="font-size:20px">PD 6.3</b></span></div>
    <div style="margin-top:10px;background:#fff;border-radius:12px;padding:4px 12px">${rows}</div>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="pill pill-small pill-primary" style="min-height:44px">Put it on the Plate again</button><button class="pill pill-small" style="min-height:44px">Save in My recipes</button></div></div>`;
  p = await open(); await p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.innerHTML = `<div>${html}</div>`; window.scrollTo(0, 0); }, OPEN);
  await note(p, "New: the meal, opened from Plan. The photo large, the other photos of that meal under it, the numbers, the foods with their grams as they were read. Put it on the Plate again, or Save in My recipes.", "main > div", "afterbegin");
  await shot(p, "rdt267c", 1120);
  await b.close(); server.kill();
})();
