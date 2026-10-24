// Boards DT93 and DT94 (Milan 24 October 13:58 to 14:01, from his first real test of 0.2.87): the culinary gate, Fit in place,
// and three phases (Craft, Make, Feedback). Now: 0.2.87 with Milan's plate: a protein bar, active dry yeast, peanut butter.
// New: the same pages with the change drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3300", U = `http://127.0.0.1:${PORT}`;
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
    const F2 = (id, name, calories, protein, fats, carbs, icon) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, icon });
    const TEA = F2("tea", "ISOCLEAR Eistee Pfirsich", 30, 7, 0, 0.5, "🥤"), FL = F2("flour", "all-purpose flour", 364, 10, 1, 76, "🍽"), SU = F2("sugar", "Granulated sugar", 400, 0, 0, 100, "🍽"), BU = F2("butter", "Unsalted butter", 717, 0.9, 81, 0.1, "🧈"), VA = F2("vanilla", "vanilla extract", 288, 0.1, 0.1, 12.7, "🍽"), CI = F2("cinnamon", "Ground cinnamon", 247, 4, 1.2, 81, "🍽");
    const extra = [TEA, FL, SU, BU, VA, CI];
    let p = await fresh([{ id: "a", food: BAR, grams: 50, locked: false }]);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.evaluate(({ extra }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.cooking = ["ground cinnamon", "lemon zest"];
      const F = (id) => s.foods.find((x) => x.id === id);
      // the fritters, made three times: flour, sugar, butter and vanilla count as used
      const fr = { id: "fr", title: "Fritters", items: [["flour", 200], ["sugar", 50], ["butter", 60], ["vanilla", 5], ["f-egg", 120]].map(([id, g], k) => ({ id: "f" + k, food: F(id), grams: g, locked: true })), portion: 435, savedAt: "2026-10-20T08:00:00Z" };
      s.meals = [fr]; s.feedback = [1, 2, 3].map((k) => ({ id: "fb" + k, meal: fr, status: "eaten", taste: "Good", notes: "", createdAt: `2026-10-2${k}T12:00:00Z` }));
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra });
    await p.reload(); await p.waitForTimeout(1600);
    await shot(p, "dt101Now");
    // DT101 New: the tip follows the rules; DT102: no cooking chips on a plate without his dish; DT103: no ingredients in Quick picks
    await p.evaluate(({ mark }) => {
      const tip = document.querySelector(".chef-tip");
      if (tip) { const rows = tip.querySelectorAll(".tip-row"); const want = [["Skyr, natural", "200 g · PD 17.5", "9.6"], ["Quark, low fat (Magerquark)", "200 g · PD 17.9", "9.7"], ["Greek yogurt 2%", "200 g · PD 13.7", "8.1"]];
        rows.forEach((r, k) => { const w = want[k]; if (!w) { r.remove(); return; } r.querySelector(".tip-text b").textContent = w[0]; r.querySelector(".tip-text small").textContent = w[1]; r.querySelector(".tip-to b").textContent = w[2]; });
        tip.style.cssText += ";" + mark;
        const n = document.createElement("div"); n.style.cssText = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742"; n.textContent = "The tip offers only foods that go with what is on the plate, by the same rule as a swap: a bar is sweet, so dairy, fruit, nuts, never chicken; a drink never; an ingredient never. When nothing passes, it says so and offers Chef Mealan."; tip.after(n); }
      const cook = document.querySelector(".pt-cook"); if (cook) { const n = document.createElement("div"); n.style.cssText = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742"; n.textContent = "No For cooking here: the cinnamon and lemon zest belonged to the quark dinner and leave with it. The chips show only while Chef Mealan's dish is on the plate."; cook.replaceWith(n); }
      for (const r of document.querySelectorAll(".row-food")) { if (/flour|sugar|butter|vanilla|cinnamon/i.test(r.textContent)) r.remove(); }
      const qp = [...document.querySelectorAll("small, p, b")].find((e) => e.textContent.trim() === "Quick picks"); if (qp) { const n = document.createElement("div"); n.style.cssText = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742"; n.textContent = "Quick picks never offers an ingredient (flour, sugar, butter, vanilla, yeast, baking powder, oil), however often a recipe used it. They stay in My foods and come with their recipes."; qp.after(n); }
    }, { mark });
    await shot(p, "dt101New"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
