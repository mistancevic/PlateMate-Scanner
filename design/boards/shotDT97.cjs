// Boards DT93 and DT94 (Milan 24 October 13:58 to 14:01, from his first real test of 0.2.87): the culinary gate, Fit in place,
// and three phases (Craft, Make, Feedback). Now: 0.2.87 with Milan's plate: a protein bar, active dry yeast, peanut butter.
// New: the same pages with the change drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3299", U = `http://127.0.0.1:${PORT}`;
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
    const QU = seed.foods.find((f) => f.id === "f-quark"), AP = seed.foods.find((f) => f.id === "f-apple");
    const PLATE = [{ id: "a", food: BAR, grams: 50, locked: false }, { id: "c", food: PB, grams: 30, locked: false }, { id: "q", food: QU, grams: 200, locked: false }, { id: "p", food: AP, grams: 182, locked: false }];
    const VERDICT = { makesIt: true, why: "Quark with apple and the bar crumbled over it: a sweet lunch, light and quick.", around: "Quark, low fat (Magerquark)", betterAs: "meal" };
    // ---- DT97 Now: before the answer (nothing), after (a card drops in) ----
    let p = await fresh(PLATE);
    let release; await p.route("**/api/dish", (r) => { release = () => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(VERDICT) }); });
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.title = "Balkan Low-Fat Quark Toast Plate"; s.cooking = ["ground cinnamon", "lemon zest"]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
    await p.reload(); await p.waitForTimeout(1500);
    await shot(p, "dt97NowWait");
    release(); await p.waitForTimeout(1200); await shot(p, "dt97NowCard");
    // ---- DT97 New: one Chef Mealan place from the second food on ----
    await p.evaluate(({ mark }) => {
      const ok = document.querySelector(".gate-ok"); const ways = document.querySelector(".ways-out");
      const d = document.createElement("section"); d.className = "card gate-card"; d.style.cssText = mark + ";min-height:96px";
      d.innerHTML = `<b style="display:flex;align-items:center;gap:6px">Chef Mealan</b><small>Reading your plate.</small><div class="bubble mealan thinking" style="margin:0"><span></span><span></span><span></span></div>`;
      if (ok) ok.replaceWith(d); else if (ways) ways.before(d);
      const n = document.createElement("div"); n.style.cssText = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742"; n.textContent = "One place for Chef Mealan, above the buttons, from the second food on. It is there while he reads, so nothing below it moves when his answer comes."; d.after(n);
    }, { mark });
    await shot(p, "dt97NewWait");
    await p.evaluate(() => { const d = document.querySelector(".gate-card"); if (d) d.innerHTML = `<b style="display:flex;align-items:center;gap:6px">Chef Mealan</b><small>Quark with apple and the bar crumbled over it: a sweet lunch, light and quick.</small>`; });
    await shot(p, "dt97NewCard");
    await p.getByRole("button", { name: "Fit to my target" }).click(); await p.waitForTimeout(1500);
    await p.evaluate(({ mark }) => {
      const cards = [...document.querySelectorAll(".gate-card")]; const first = cards[0]; for (const c of cards.slice(1)) c.remove();
      if (first) { first.style.cssText += ";" + mark; first.innerHTML = `<b style="display:flex;align-items:center;gap:6px">Chef Mealan</b><small>Quark with apple and the bar crumbled over it: a sweet lunch, light and quick.</small><small><b>Fit</b> set 168 g quark (was 200 g): the plate lands on your 6.5. Nothing else moved. <u>Undo</u></small>`; }
      for (const f of document.querySelectorAll(".fit-line")) f.remove();
      const n = document.createElement("div"); n.style.cssText = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742"; n.textContent = "Fit's result goes into the same place, one line under his verdict. No new card, the buttons stay where they were."; if (first) first.after(n);
    }, { mark });
    await shot(p, "dt97NewFit"); await p.close();
    // ---- DT98: For cooking as chips with x ----
    p = await fresh(PLATE);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(VERDICT) }));
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.title = "Balkan Low-Fat Quark Toast Plate"; s.cooking = ["ground cinnamon", "lemon zest"]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
    await p.reload(); await p.waitForTimeout(1500);
    await p.evaluate(() => { const c = document.querySelector(".pt-cook"); if (c) c.scrollIntoView({ block: "center" }); });
    await shot(p, "dt98NowLine");
    await p.evaluate(({ mark }) => {
      const c = document.querySelector(".pt-cook"); if (!c) return;
      c.innerHTML = `<b>For cooking, not counted:</b> <span class="pt-chips" style="display:inline-flex;gap:6px;flex-wrap:wrap;vertical-align:middle"><button type="button" class="pt-chip on">ground cinnamon ✕</button><button type="button" class="pt-chip on">lemon zest ✕</button></span>`; c.style.cssText += ";" + mark;
      const n = document.createElement("div"); n.style.cssText = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742"; n.textContent = "Chef Mealan suggests, you decide. ✕ takes one out before you lock the recipe; the steps are drafted without it. Taken out stays out for this recipe."; c.after(n);
    }, { mark });
    await shot(p, "dt98NewChips"); await p.close();
    // ---- DT99: the Make button ----
    p = await fresh(PLATE);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(VERDICT) }));
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.title = "Quark toast with apple"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
    await p.reload(); await p.waitForTimeout(1500);
    await p.getByRole("button", { name: "Lock the recipe" }).click(); await p.waitForTimeout(900);
    await p.locator(".way").first().click(); await p.getByRole("button", { name: "Lock the recipe, this way" }).click(); await p.waitForTimeout(900);
    await shot(p, "dt99NowMake");
    await p.evaluate(({ mark }) => { for (const b of document.querySelectorAll("button")) if (b.textContent.trim() === "On to How was it?") { b.textContent = "Rate it"; b.style.cssText += ";" + mark; } }, { mark });
    await shot(p, "dt99NewMake"); await p.close();
    // ---- DT100: the title in a cook's words ----
    p = await fresh([]);
    await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const F = (id) => s.foods.find((x) => x.id === id);
      s.meals = [{ id: "m1", title: "Balkan Low-Fat Quark Toast Plate", savedAt: "2026-10-24T16:50:00Z", portion: 462, items: [{ id: "a", food: F("bar"), grams: 50, locked: true }, { id: "c", food: F("pb"), grams: 30, locked: true }, { id: "q", food: F("f-quark"), grams: 200, locked: true }, { id: "p", food: F("f-apple"), grams: 182, locked: true }], cooking: ["ground cinnamon", "lemon zest"], kitchen: "Balkan", byChef: { kitchen: "Balkan", meal: "dinner", around: "foods", at: "2026-10-24T16:50:00Z" } }];
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
    await p.goto(U + "/"); await p.waitForTimeout(1000); await p.locator("nav button").filter({ hasText: "Recipes" }).click(); await p.waitForTimeout(900);
    await p.getByText("Balkan Low-Fat Quark Toast Plate").first().click(); await p.waitForTimeout(1200);
    await shot(p, "dt100NowTitle");
    await p.evaluate(({ mark }) => { const t = document.querySelector(".rq-name"); if (t) { t.textContent = "Quark toast with apple"; t.style.cssText += ";" + mark; }
      const n = document.createElement("div"); n.style.cssText = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742"; n.textContent = "A title as a cook says it: sentence case, no Plate or Bowl at the end, no Low-Fat or High-Protein from a label. Code cleans it; the prompt gets two examples."; if (t) t.after(n); }, { mark });
    await shot(p, "dt100NewTitle"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
