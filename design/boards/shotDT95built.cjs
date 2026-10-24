// Boards DT93 and DT94 (Milan 24 October 13:58 to 14:01, from his first real test of 0.2.87): the culinary gate, Fit in place,
// and three phases (Craft, Make, Feedback). Now: 0.2.87 with Milan's plate: a protein bar, active dry yeast, peanut butter.
// New: the same pages with the change drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3297", U = `http://127.0.0.1:${PORT}`;
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
    await p.clock.setFixedTime(new Date("2026-10-24T13:47:00"));
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
    const BUILT = [{ id: "a", food: BAR, grams: 150, locked: false }, { id: "b", food: YE, grams: 10, locked: false }, { id: "c", food: PB, grams: 150, locked: false }];
    let p = await fresh(BUILT);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: false, why: "A bar, yeast and peanut butter do not make a lunch: the yeast needs a dough, and the bar is a snack on its own.", around: "Clean Protein Bar Peanut Love", betterAs: "snack" }) }));
    await p.reload(); await p.waitForTimeout(1800); await shot(p, "dt95BuiltGate");
    await p.getByRole("button", { name: "Fit to my target" }).click(); await p.waitForTimeout(1500); await shot(p, "dt95BuiltFit");
    await p.close();
    const GOOD = [{ id: "a", food: BAR, grams: 50, locked: false }, { id: "d", food: seed.foods.find((f) => f.id === "f-bread"), grams: 80, locked: false }, { id: "e", food: seed.foods.find((f) => f.id === "f-banana"), grams: 120, locked: false }, { id: "c", food: PB, grams: 20, locked: false }];
    p = await fresh(GOOD);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A peanut banana toast with the bar on the side: a plain lunch.", around: "Wholegrain bread", betterAs: "meal" }) }));
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.title = "Peanut banana toast"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
    await p.reload(); await p.waitForTimeout(1800); await shot(p, "dt95BuiltCraft");
    await p.getByRole("button", { name: "Lock the recipe" }).click(); await p.waitForTimeout(900);
    await p.locator(".way").first().click(); await p.getByRole("button", { name: "Lock the recipe, this way" }).click(); await p.waitForTimeout(900); await shot(p, "dt95BuiltMake");
    await p.getByRole("button", { name: "On to How was it?" }).click(); await p.waitForTimeout(800); await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(300); await shot(p, "dt95BuiltFeedback");
    await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
