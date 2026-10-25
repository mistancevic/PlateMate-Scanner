// Board DT128 (Milan 25 October 15:51: "This is bad with broken lines and grams. Maybe text was better as explanation. Give both
// options."). The letters block under the readout number: A keeps the letters, grams on one line; B says it in a sentence.
// Drawn in the browser; nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3319", U = `http://127.0.0.1:${PORT}`;
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
    const SC = F2("schnitzel", "Pork schnitzel, breaded, fried", 290, 20, 18, 12, "🍖"), FR = F2("fries", "Fries", 312, 3.4, 15, 41, "🍟");
    const big = [{ id: "a", food: SC, grams: 300, locked: false }, { id: "b", food: FR, grams: 250, locked: false }];
    const setup = async () => { const p = await fresh([]);
      await p.evaluate(({ extra, items }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = items; s.fromRecipe = undefined; s.title = "Schnitzel with fries"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [SC, FR], items: big });
      await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Schnitzel with fries: a dish, and a big one.", around: "Pork schnitzel, breaded, fried", better_as: "" }) }));
      await p.reload(); await p.waitForTimeout(1800); return p; };
    const crop = async (p, name) => { await p.waitForTimeout(300); await flat(p); const el = p.locator(".plate-card").first(); await el.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
    // a: Now
    let p = await setup(); await crop(p, "r128now"); await p.close();
    // b: A, the letters kept, grams on one line, the note on its own line
    p = await setup();
    await p.evaluate(({ mark, NOTE }) => {
      const row = document.querySelector(".letters-row"); if (!row) return;
      row.style.cssText += ";display:block;" + mark;
      const grid = row.querySelector(".letters-grid"); grid.style.cssText = "display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:100%";
      for (const c of grid.querySelectorAll(".letter-cell")) { c.style.cssText = "display:flex;flex-direction:column;align-items:flex-start;gap:0;min-width:0"; const sm = c.querySelector("small"); if (sm) { sm.style.cssText = "white-space:nowrap;font-size:12.5px;font-weight:700;opacity:.95;margin:0"; } }
      const note = row.querySelector(".letters-note"); if (note) note.style.cssText = "display:block;margin:4px 0 0;font-size:12px;opacity:.9;text-align:right";
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Option A: the letters stay. Four equal columns, the letter on top, its grams under it on one line, never broken (92 g, 139 g, ?, 69 g). Against your day moves to its own line under the four. A tap still opens the four sentences. The same block on the food card and the recipe page.";
      row.closest(".plate-card").appendChild(n);
    }, { mark, NOTE });
    await crop(p, "r128a"); await p.close();
    // c: B, no letters, one sentence
    p = await setup();
    await p.evaluate(({ mark, NOTE }) => {
      const row = document.querySelector(".letters-row"); if (!row) return;
      const d = document.createElement("div"); d.style.cssText = "border:0;background:rgba(255,255,255,.22);color:inherit;border-radius:10px;padding:8px 10px;font-size:13.5px;line-height:1.45;" + mark;
      d.innerHTML = "Against your day: <b>fat high</b>, 92 g · <b>carbs under</b>, 139 g · <b>fibre unknown</b> · <b>protein under</b>, 69 g. <span style='opacity:.85'>Tap for the detail ›</span>";
      row.replaceWith(d);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Option B: no letters. One sentence under the number, the same four readings as words: fat high, carbs under, fibre unknown, protein under, each with its grams. Against your day leads the sentence. A tap opens the same four lines with the numbers per 100 kcal. Longer by one line, nothing to learn, nothing to wrap.";
      d.closest(".plate-card").appendChild(n);
    }, { mark, NOTE });
    await crop(p, "r128b"); await p.close();
    // d: the Plate's buttons with Photo of my meal, for DT127
    p = await setup();
    await p.evaluate(({ mark, NOTE }) => {
      const scan = [...document.querySelectorAll("button")].find((b) => /^Scan$/.test(b.textContent.trim())); if (!scan) return;
      const row = scan.parentElement; row.style.cssText += ";" + mark;
      const c = scan.cloneNode(true); c.textContent = "📷 Photo of my meal"; row.appendChild(c);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "DT127, the Plate: Photo of my meal next to Manual and Scan, the same button as on Today. Scan reads a pack; Photo of my meal reads the plate in front of you.";
      row.after(n);
    }, { mark, NOTE });
    await crop(p, "r127plateBtn"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
