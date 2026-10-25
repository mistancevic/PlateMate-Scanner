// Boards DT93 and DT94 (Milan 24 October 13:58 to 14:01, from his first real test of 0.2.87): the culinary gate, Fit in place,
// and three phases (Craft, Make, Feedback). Now: 0.2.87 with Milan's plate: a protein bar, active dry yeast, peanut butter.
// New: the same pages with the change drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3310", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join("/home/claude/platemate-scanner", "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, icon, brand = "estimate") => ({ ...seed.foods[0], id, name, brand, source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, icon, table: undefined });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, "🍫", "Clean"), YE = F("yeast", "Active dry yeast", 325, 40, 7, 41, "🍞"), PB = F("pb", "Peanut butter", 588, 25, 50, 20, "🥜");
seed.foods = [BAR, YE, PB, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 150, locked: false }, { id: "b", food: YE, grams: 10, locked: false }, { id: "c", food: PB, grams: 150, locked: false }];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const mark = `outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px`;
const NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const fresh = async (items = seed.items) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, items });
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1500);
    return p;
  };
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (p, name) => { await p.waitForTimeout(350); await flat(p); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot", name); };
  const note = (p, sel, html, where = "after") => p.evaluate(({ sel, html, where, NOTE }) => { const el = document.querySelector(sel); if (!el) return false; const d = document.createElement("div"); d.innerHTML = html; d.style.cssText = NOTE; el[where](d); return true; }, { sel, html, where, NOTE });
  const rowOf = (p, name) => p.evaluate((name) => { const e = [...document.querySelectorAll(".plate-card .name-link")].find((x) => x.textContent.trim() === name); let r = e; while (r && !r.classList.contains("row")) r = r.parentElement; if (r) r.setAttribute("data-draw", name); return !!r; }, name);
  // the three-phase bar in place of the five steps
  const phases = (p, on) => p.evaluate(({ on, mark }) => { const bar = document.querySelector(".step-bar"); if (!bar) return; const d = document.createElement("div"); d.style.cssText = "display:flex;gap:8px;margin:6px 0 2px;" + mark + ";padding:6px";
    d.innerHTML = ["Craft", "Make", "Feedback"].map((t, i) => `<div style="flex:1;text-align:center;font-weight:800;font-size:13px;color:${i <= on ? "#1f5fc7" : "#8a97ad"}"><div style="height:6px;border-radius:3px;background:${i <= on ? "#2e7be8" : "#d1dcf0"};margin-bottom:4px"></div>${t}</div>`).join(""); bar.replaceWith(d); }, { on, mark });
  try {
    const F2 = (id, name, calories, protein, fats, carbs, icon, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, icon, ...extra });
    const WH = F2("whey", "Whey protein powder, vanilla", 380, 78, 5, 7, "🥛", { serving: { grams: 30, name: "scoop" } });
    const items = [{ id: "a", food: PB, grams: 40, locked: false }, { id: "b", food: seed.foods.find((f) => /Butterkeks/.test(f.name)) || BAR, grams: 50, locked: false }, { id: "c", food: WH, grams: 60, locked: false }];
    let p = await fresh([]);
    await p.evaluate(({ extra, items }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = items; s.fromRecipe = undefined; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [WH], items });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Biscuits with peanut butter and a shake: a sweet lunch.", around: "Peanut butter", better_as: "" }) }));
    await p.reload(); await p.waitForTimeout(1800);
    await shot(p, "ngNow");
    await p.evaluate(({ NOTE, mark }) => {
      const g = document.querySelector(".gate-card"); if (!g) return;
      const d = document.createElement("div"); d.style.cssText = mark + ";border-radius:10px;padding:8px 10px;margin-top:6px;display:grid;gap:8px;font-size:14px;line-height:1.45";
      d.innerHTML = `<div><b style="color:#1b7f4b">✓ Culinary</b> · Biscuits with peanut butter and a shake: a sweet lunch.</div>
        <div><b style="color:#b3261e">✕ Nutrition</b> · <span style="font-family:ui-monospace,Menlo,monospace;font-weight:900">F c fi? P</span> · Most of this lunch's protein comes from the powder: 47 of 61 g. A shake with biscuits and a spread is not a lunch.
        <div style="margin-top:6px"><button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:#2e7be8;color:#fff;font-weight:800;font-size:13px;font-family:inherit;margin-right:8px">Add a protein base</button><button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:#fff;color:#1f5fc7;font-weight:800;font-size:13px;font-family:inherit;margin-right:8px">Make it a snack</button><button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:#fff;color:#1f5fc7;font-weight:800;font-size:13px;font-family:inherit">Keep it as it is</button></div></div>`;
      g.appendChild(d);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Version B from G3, the nutrition gate as its line in Chef Mealan's card. Three checks hold (Milan 09:55): fat over half the meal's energy; more than half the protein from a supplement; carbs under 10 percent for the meal before training only. Fibre waits for values. The line speaks in the letters and the numbers, by code, no model; the ways out are the ones the Plate already has. The readout keeps PD 8.7 and fits your plan: the numbers pass, the gate does not, and both are true. Fat here is 39 percent of the energy, under the half, so that check stays quiet.";
      g.parentElement.insertBefore(n, g.nextSibling);
    }, { NOTE, mark });
    await shot(p, "ngNew"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
