// Boards DT93 and DT94 (Milan 24 October 13:58 to 14:01, from his first real test of 0.2.87): the culinary gate, Fit in place,
// and three phases (Craft, Make, Feedback). Now: 0.2.87 with Milan's plate: a protein bar, active dry yeast, peanut butter.
// New: the same pages with the change drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3309", U = `http://127.0.0.1:${PORT}`;
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
    const TU = F2("tuna-oil", "Tuna in olive oil, drained", 190, 25, 10, 0, "🐟", { brand: "Rio Mare", barcode: "8004030044005", serving: { grams: 52, name: "can" } });
    const RI = F2("rice", "Rice, cooked", 130, 2.7, 0.3, 28, "🍚");
    const members = `<section class="outside" aria-label="Members' foods" style="${mark};border-radius:12px;padding:6px 8px;margin:8px 0">
      <p class="label group-label" style="margin:4px 0 6px">Members' foods <small>your market first</small></p>
      <div class="row outside-row"><span class="thumb">🐟</span><div class="row-text"><b class="name-plain">Tuna in water, drained</b><small>Rio Mare · 99 kcal · 23 g protein per 100 g · seen in Munich</small></div><button class="pill pill-small">Add to my foods</button></div>
      <div class="row outside-row"><span class="thumb">🐟</span><div class="row-text"><b class="name-plain">Tuna in brine, drained</b><small>Eva · 105 kcal · 24 g protein per 100 g · seen in Belgrade</small></div><button class="pill pill-small">Add to my foods</button></div>
      <div class="row outside-row"><span class="thumb">🐟</span><div class="row-text"><b class="name-plain">Tuna steak, fresh</b><small>no barcode · 130 kcal · 28 g protein per 100 g · seen in Cyprus</small></div><button class="pill pill-small">Add to my foods</button></div>
    </section>`;
    // Find a food, Now and New
    let p = await fresh([]);
    await p.evaluate(({ extra }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [TU, RI] });
    await p.route("**/api/off/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ products: [{ code: "8004030044012", name: "Tonno all'olio di oliva", brand: "Rio Mare", quantity: "80 g", kcal: 190, protein: 25 }] }) }));
    await p.route("**/api/products**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ products: [{ code: "8004030044012", name: "Tonno all'olio di oliva", brand: "Rio Mare", quantity: "80 g", kcal: 190, protein: 25 }] }) }));
    await p.goto(U + "/foods"); await p.waitForTimeout(1400);
    const field = p.getByLabel("Find a food");
    if (await field.count()) { await field.fill("tuna"); await p.waitForTimeout(1500); }
    await shot(p, "mfNow");
    await p.evaluate(({ NOTE, members }) => {
      const mine = [...document.querySelectorAll(".group-label")].find((e) => /In your foods/.test(e.textContent)) || document.querySelector("input.search");
      const anchor = document.querySelector("section.outside") || (mine ? mine.parentElement.lastElementChild : null);
      const host = anchor ? anchor.parentElement : document.querySelector("main");
      const d = document.createElement("div"); d.innerHTML = members; host.insertBefore(d.firstChild, anchor);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "A new group between your foods and the product database: Members' foods. Every reviewed scan by a member goes to one shared catalogue: name, brand, barcode, the numbers, the source, where it was seen (the member's market). No photo and no name of who scanned it. Your own market first, the rest marked. One entry per barcode; a food without a barcode by name and brand. Add to my foods puts a copy in your library with the values; the coach searches the same catalogue.";
      host.insertBefore(n, anchor);
      // the line under your own tuna
      const row = [...document.querySelectorAll(".row")].find((r) => /olive oil/i.test(r.textContent));
      if (row) { const l = document.createElement("div"); l.style.cssText = "margin:2px 0 10px 56px;color:#1f5fc7;font-weight:700;font-size:13px;outline:3px solid #2e7be8;outline-offset:3px;border-radius:8px;display:inline-block"; l.textContent = "Also seen by members: Tuna in water, Rio Mare, 99 kcal ›"; row.parentElement.insertBefore(l, row.nextSibling); }
    }, { NOTE, members });
    await shot(p, "mfNew"); await p.close();
    // the swap list on the plate: tuna in oil with rice
    p = await fresh([{ id: "a", food: TU, grams: 104, locked: false }, { id: "b", food: RI, grams: 200, locked: false }]);
    await p.evaluate(({ extra }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [TU, RI] });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Tuna with rice: a plain lunch.", around: "Tuna in olive oil, drained", better_as: "" }) }));
    await p.reload(); await p.waitForTimeout(1600);
    await require("/home/claude/platemate-scanner/tests/flows/swipe.cjs")(p, p.locator(".swipe-fg", { hasText: "Tuna" }).locator(".name-link, .thumb").first(), "left"); await p.waitForTimeout(800);
    await shot(p, "mfSwapNow");
    await p.evaluate(({ NOTE, mark }) => {
      const list = document.querySelector(".swap-list, .swaps, .sheet .rows") || [...document.querySelectorAll(".row-button")].map((e) => e.parentElement)[0];
      if (!list) return;
      const r = document.createElement("button"); r.className = "row row-food row-button"; r.style.cssText = mark;
      r.innerHTML = `<span class="thumb thumb-sm">🐟</span><div class="row-text"><b>Tuna in water, drained</b><small>Rio Mare · PD 23.2 · the same tuna, another state · 95 kcal less per can, the same protein · a member's food, seen in Munich</small></div><span class="pdpill pdpill-high">104 g</span>`;
      list.insertBefore(r, list.firstChild);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "The swap list reaches the members' catalogue too, after your own foods: the same food in another state leads (DT83), with the difference per portion said plainly. Only foods seen in your market or in the open database are offered; Tester 3 in Cyprus never gets a Munich tin. Taking the swap copies the food into your library.";
      list.insertBefore(n, r.nextSibling);
    }, { NOTE, mark });
    await shot(p, "mfSwapNew"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
