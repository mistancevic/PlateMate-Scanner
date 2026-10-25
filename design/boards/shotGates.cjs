// Boards DT93 and DT94 (Milan 24 October 13:58 to 14:01, from his first real test of 0.2.87): the culinary gate, Fit in place,
// and three phases (Craft, Make, Feedback). Now: 0.2.87 with Milan's plate: a protein bar, active dry yeast, peanut butter.
// New: the same pages with the change drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3308", U = `http://127.0.0.1:${PORT}`;
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
    await p.clock.setFixedTime(new Date("2026-10-25T23:10:00"));
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
    const EG = F2("eggs", "Eggs", 143, 13, 10, 1, "🥚", { serving: { grams: 52, name: "egg" } }), AP = F2("apples", "Apples", 52, 0.3, 0.2, 14, "🍎"), CH = F2("chicken", "Chicken breast, cooked", 165, 31, 3.6, 0, "🍗"), RI = F2("rice", "Rice, cooked", 130, 2.7, 0.3, 28, "🍚");
    const items = [{ id: "a", food: CH, grams: 180, locked: false }, { id: "b", food: RI, grams: 100, locked: false }, { id: "c", food: EG, grams: 52, locked: false }, { id: "d", food: AP, grams: 182, locked: false }];
    let p = await fresh([]);
    await p.evaluate(({ extra, items }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = items; s.fromRecipe = undefined; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [EG, AP, CH, RI], items });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Chicken with rice, an egg and an apple: a plain plate.", around: "Chicken breast, cooked", better_as: "" }) }));
    await p.reload(); await p.waitForTimeout(1800);
    await shot(p, "gatesNow");
    const marks = `<div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
      <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.22);border-radius:999px;padding:4px 10px;font-size:13px;font-weight:700">✓ Culinary</span>
      <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.22);border-radius:999px;padding:4px 10px;font-size:13px;font-weight:700">✓ Nutrition</span>
      <span style="display:inline-flex;align-items:center;gap:6px;background:#fff;color:#b3261e;border-radius:999px;padding:4px 10px;font-size:13px;font-weight:700">✕ Lifestyle · 23:10, your window ends 21:00</span></div>`;
    // Version A: the three marks on the readout, under the letters
    await p.evaluate(({ NOTE, mark, marks }) => {
      const ro = document.querySelector(".readout"); if (!ro) return;
      const d = document.createElement("div"); d.style.cssText = mark + ";border-radius:10px;padding:2px"; d.innerHTML = marks; ro.appendChild(d);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Version A: the three gates on the readout, under the number and the letters, where every plate is read in one glance: PD, the four letters, the three gates. A tick is a word; a cross says why in a few words. The sweet spot is named only when all three hold: the readout's top line reads DaaM Good spot instead of fits your plan. Chef Mealan's card keeps his sentence and the ways out.";
      ro.parentElement.insertBefore(n, ro.nextSibling);
    }, { NOTE, mark, marks });
    await shot(p, "gatesA");
    await p.reload(); await p.waitForTimeout(1800);
    // Version B: the three gates in Chef Mealan's card
    await p.evaluate(({ NOTE, mark }) => {
      const g = document.querySelector(".gate-card"); if (!g) return;
      const d = document.createElement("div"); d.style.cssText = mark + ";border-radius:10px;padding:8px 10px;margin-top:6px;display:grid;gap:6px;font-size:14px;line-height:1.4";
      d.innerHTML = `<div><b style="color:#1b7f4b">✓ Culinary</b> · Chicken with rice, an egg and an apple: a plain plate.</div><div><b style="color:#1b7f4b">✓ Nutrition</b> · PD 10.9 against your 6.5; f c- fi? P+.</div><div><b style="color:#b3261e">✕ Lifestyle</b> · 23:10, and your eating window ends at 21:00 on a rest day. A full plate now sits on tomorrow.</div><div style="margin-top:4px"><button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:#2e7be8;color:#fff;font-weight:800;font-size:13px;font-family:inherit;margin-right:8px">Make it a small snack</button><button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:#fff;color:#1f5fc7;font-weight:800;font-size:13px;font-family:inherit">Keep it as it is</button></div>`;
      g.appendChild(d);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Version B: the three gates as three lines in Chef Mealan's card, each with its reason in a sentence, and the ways out under the one that fails. The readout stays as it is (PD and the letters). The sweet spot is a fourth line, DaaM Good spot, when all three hold. More words, one place, nothing on the readout changes.";
      g.parentElement.insertBefore(n, g.nextSibling);
    }, { NOTE, mark });
    await shot(p, "gatesB"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
