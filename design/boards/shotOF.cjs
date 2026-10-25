// Boards DT93 and DT94 (Milan 24 October 13:58 to 14:01, from his first real test of 0.2.87): the culinary gate, Fit in place,
// and three phases (Craft, Make, Feedback). Now: 0.2.87 with Milan's plate: a protein bar, active dry yeast, peanut butter.
// New: the same pages with the change drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3311", U = `http://127.0.0.1:${PORT}`;
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
    await p.clock.setFixedTime(new Date("2026-10-25T12:10:00"));
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
    const TU = F2("tuna-oil", "Tuna in olive oil, drained", 190, 25, 10, 0, "🐟", { brand: "Rio Mare", barcode: "8004030044012", serving: { grams: 52, name: "can" } });
    const TU2 = F2("tuna-sr", "Tunina v oljčnem olju / Tunjevina u maslinovom ulju", 402, 17, 36, 0, "🍽", { brand: "Rio mare", source: "Members' foods" });
    const TU3 = F2("tuna-w", "Thunfisch in Wasser", 116, 25.5, 0.8, 0, "🐟", { brand: "", source: "Reference table" });
    let p = await fresh([]);
    await p.evaluate(({ extra }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [TU, TU2, TU3] });
    await p.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [{ key: "b:3850102001234", name: "Tuna in brine, drained", brand: "Eva", barcode: "3850102001234", calories: 105, protein: 24, fats: 1, carbs: 0, fiber: 0, source: "label", seenIn: ["belgrade"], updatedAt: "2026-10-25T01:00:00Z" }, { key: "n:τονος σε νερο|trata", name: "Τόνος σε νερό", brand: "Trata", calories: 103, protein: 24, fats: 0.8, carbs: 0, fiber: 0, source: "label", seenIn: ["limassol"], updatedAt: "2026-10-25T01:00:00Z" }] }) }));
    await p.route("**/api/search**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ products: [{ code: "8004030044029", name: "Tonno al naturale", brand: "Rio Mare", quantity: "3 x 80 g", kcal: 103, protein: 25 }, { code: "4311501324103", name: "Thunfisch in eigenem Saft", brand: "Edeka", quantity: "195 g", kcal: 110, protein: 26 }] }) }));
    await p.goto(U + "/foods"); await p.waitForTimeout(1400);
    await p.getByLabel("Find a food").fill("tuna"); await p.waitForTimeout(1600);
    await shot(p, "ofNow");
    await p.evaluate(({ NOTE, mark }) => {
      const main = document.querySelector("main"); if (!main) return;
      // hide the four groups, draw the one list in their place
      for (const el of main.querySelectorAll(".rows, section.outside, .members-foods, .group-label, .also-seen, .end-add, .dupes, .hidden-by-chip")) el.style.display = "none";
      const row = (name, sub, right, mine, photo) => `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #d1dcf0"><span style="width:44px;height:44px;border-radius:12px;background:#eef3fc;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none">${photo}</span><div style="flex:1;min-width:0"><b style="font-size:15px">${name}</b><br><small style="color:#5b6b8a;font-size:12.5px">${sub}</small></div>${right}</div>`;
      const pill = (t, on) => `<span style="border:1.5px solid #2e7be8;border-radius:999px;padding:5px 12px;font-size:13px;font-weight:800;color:${on ? "#fff" : "#1f5fc7"};background:${on ? "#2e7be8" : "#fff"};flex:none">${t}</span>`;
      const d = document.createElement("div"); d.style.cssText = mark + ";border-radius:12px;padding:10px 12px;margin:8px 0;background:#fff";
      d.innerHTML = `<div style="font-size:13px;font-weight:800;color:#5b6b8a;letter-spacing:.04em;margin-bottom:4px">TUNA · 5 FOODS</div>`
        + row("Tuna in olive oil, drained", "Rio Mare · 190 kcal · 25 g protein · in your foods, 2 cans in a recipe", pill("Add to meal"), true, "🐟")
        + row("Tuna in water, drained", "Rio Mare · 99 kcal · 23 g protein · yours; also Tester 2's", pill("Add to meal"), true, "🐟")
        + row("Tuna in brine, drained", "Eva · 105 kcal · 24 g protein · a member's, seen in Belgrade", pill("Take it"), false, "🐟")
        + row("Tuna in water, Τόνος σε νερό", "Trata · 103 kcal · 24 g protein · a member's, seen in Limassol", pill("Take it"), false, "🐟")
        + row("Tuna, canned in water, drained", "basic food · 116 kcal · 25.5 g protein per 100 g · Thunfisch · tunjevina · τόνος", pill("Take it"), false, "📘")
        + `<div style="margin-top:10px;font-size:13px;color:#1f5fc7;font-weight:700">More from the product database ›</div>`;
      const x = main.querySelector(".clear-x"); if (x) x.style.display = "none";
      const cf = main.querySelector(".clear-field"); const anchor = cf ? cf.parentElement : main;
      if (cf) anchor.insertBefore(d, cf.nextSibling); else anchor.appendChild(d);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "One list for one word. Every source answers the same search and lands in one list, one row per food: yours first (and never twice: the Slovenian tin and your Rio Mare tin are the same barcode, so one row, with both names behind it), then members' foods, then the basic foods, then the product database behind a line. A row says where it comes from and what it costs you to take it. Names in every language hang off the food, so tuna, tunjevina, Thunfisch and τόνος are one search. The duplicates banner goes: a food with the same barcode, or the same basic food, is never created twice.";
      anchor.insertBefore(n, d.nextSibling);
    }, { NOTE, mark });
    await shot(p, "ofNew"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
