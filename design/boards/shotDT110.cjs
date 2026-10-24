// Boards DT93 and DT94 (Milan 24 October 13:58 to 14:01, from his first real test of 0.2.87): the culinary gate, Fit in place,
// and three phases (Craft, Make, Feedback). Now: 0.2.87 with Milan's plate: a protein bar, active dry yeast, peanut butter.
// New: the same pages with the change drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3307", U = `http://127.0.0.1:${PORT}`;
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
    await p.clock.setFixedTime(new Date("2026-10-25T08:25:00"));
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
    const QU = F2("quark", "Quark, low fat (Magerquark)", 67, 12, 0.2, 4, "🥣"), AP = F2("apples", "Apples", 52, 0.3, 0.2, 14, "🍎"), KE = F2("keks", "Leibniz Butterkeks", 460, 7, 14, 73, "🍪");
    const plate = [{ id: "a", food: BAR, grams: 90, locked: false }, { id: "b", food: PB, grams: 40, locked: false }, { id: "c", food: QU, grams: 400, locked: false }, { id: "d", food: AP, grams: 182, locked: false }, { id: "e", food: KE, grams: 50, locked: false }];
    const card = (title, body, buttons) => `<div style="margin:10px 0;padding:12px 14px;border-radius:14px;background:#eef3fc;${mark}"><div style="font-weight:800;color:#1f5fc7;font-size:14px;margin-bottom:6px">⌂ Chef Mealan</div><div style="font-size:14px;line-height:1.45">${body}</div>${buttons.map((t, i) => `<button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:${i === 0 ? "#2e7be8" : "#fff"};color:${i === 0 ? "#fff" : "#1f5fc7"};font-weight:800;font-size:13px;margin:8px 8px 0 0;font-family:inherit">${t}</button>`).join("")}</div>`;
    // DT110 Now: the plate at breakfast, two breakfasts on it, the gate offers Make it a breakfast
    let p = await fresh(plate);
    await p.evaluate(({ extra }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [QU, AP, KE] });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: false, why: "A bar, peanut butter, quark, an apple and biscuits: a big bowl, not yet a breakfast.", around: "Quark, low fat (Magerquark)", better_as: "" }) }));
    await p.reload(); await p.waitForTimeout(1800);
    await shot(p, "dt110Now");
    await p.evaluate(({ NOTE, mark, card }) => {
      const g = document.querySelector(".gate-card"); if (!g) return;
      const d = document.createElement("div"); d.innerHTML = card("", "Your plate is already about two breakfasts: 1,232 kcal of 619 to 757. Nothing can be added to make it one.", ["Make it two breakfasts", "Shrink it to one breakfast", "Keep it as it is"]);
      g.parentElement.insertBefore(d.firstChild, g);
      g.style.display = "none";
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "A plate over its meal (more than 1.4 times the meal's energy, C31) never goes to Chef Mealan's ideas: no wait, no three failures. Code says what it is and offers three ways. Make it two breakfasts saves the plate as a recipe that makes 2, one portion eaten now, the other on Plan for tomorrow. Shrink it to one breakfast scales every amount down to the meal's range, each food within its portion (C10), so the bar becomes one bar and the quark 200 g. Keep it as it is takes the plate as it stands and says so on Today.";
      g.parentElement.insertBefore(n, g);
    }, { NOTE, mark, card: card.toString() }).catch(() => {});
    await p.evaluate(({ NOTE, mark }) => {
      const g = document.querySelector(".gate-card"); if (!g) return;
      const c = document.createElement("div"); c.style.cssText = "margin:10px 0;padding:12px 14px;border-radius:14px;background:#eef3fc;" + mark;
      c.innerHTML = `<div style="font-weight:800;color:#1f5fc7;font-size:14px;margin-bottom:6px">⌂ Chef Mealan</div><div style="font-size:14px;line-height:1.45">Your plate is already about two breakfasts: 1,232 kcal of 619 to 757. Nothing can be added to make it one.</div>` + ["Make it two breakfasts", "Shrink it to one breakfast", "Keep it as it is"].map((t, i) => `<button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:${i === 0 ? "#2e7be8" : "#fff"};color:${i === 0 ? "#fff" : "#1f5fc7"};font-weight:800;font-size:13px;margin:8px 8px 0 0;font-family:inherit">${t}</button>`).join("");
      g.parentElement.insertBefore(c, g); g.style.display = "none";
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "A plate over its meal (more than 1.4 times the meal's energy, C31) never goes to Chef Mealan's ideas: no wait, no three failures. Code says what it is and offers three ways. Make it two breakfasts saves the plate as a recipe that makes 2: one portion eaten now, the other on Plan for tomorrow. Shrink it to one breakfast scales every amount down into the meal's range, each food within its portion (C10): the bar becomes one bar, the quark 200 g. Keep it as it is takes the plate as it stands.";
      c.parentElement.insertBefore(n, c.nextSibling);
    }, { NOTE, mark });
    await shot(p, "dt110New");
    // DT112: the search field with peanut typed
    await p.getByLabel("Search all my foods").fill("peanut"); await p.waitForTimeout(400);
    await p.evaluate(() => { const q = document.querySelector("input.search"); q.scrollIntoView(); });
    await shot(p, "dt112Now");
    await p.evaluate(({ NOTE, mark }) => {
      const q = document.querySelector("input.search"); if (!q) return;
      const w = document.createElement("div"); w.style.cssText = "position:relative;" + mark; q.parentElement.insertBefore(w, q); w.appendChild(q);
      const x = document.createElement("button"); x.textContent = "✕"; x.setAttribute("aria-label", "Clear the search"); x.style.cssText = "position:absolute;right:10px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:999px;border:0;background:#dae6fb;color:#1f5fc7;font-weight:800;font-size:13px"; w.appendChild(x);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "An ✕ at the right of the field while it has text: one tap empties it and the list is back. The same ✕ in the chat's field and in Find a food. A text field that is empty shows none.";
      w.parentElement.insertBefore(n, w.nextSibling);
    }, { NOTE, mark });
    await shot(p, "dt112New"); await p.close();
    // DT111: the wait, with the real steps
    p = await fresh([{ id: "a", food: BAR, grams: 50, locked: false }, { id: "c", food: QU, grams: 150, locked: false }]);
    await p.evaluate(({ extra }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [QU, AP, KE] });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: false, why: "A bar and quark: a start, not a breakfast.", around: "Quark, low fat (Magerquark)", better_as: "" }) }));
    await p.route("**/api/meal", async (r) => { await new Promise((x) => setTimeout(x, 60000)); r.fulfill({ status: 503, body: "{}" }); });
    await p.reload(); await p.waitForTimeout(1800);
    await p.getByRole("button", { name: /^Make it a breakfast/ }).click(); await p.waitForTimeout(1500);
    await shot(p, "dt111Now");
    await p.evaluate(({ NOTE, mark }) => {
      const w = document.querySelector(".mm-working"); if (!w) return;
      const d = document.createElement("div"); d.style.cssText = "margin:10px 0;padding:10px 14px;border-radius:14px;background:#fff;border:1px solid #d1dcf0;font-size:14px;line-height:1.6;" + mark;
      d.innerHTML = `<div style="color:#5b6b8a">✓ Read your plate: 50 g bar, 150 g quark, 283 kcal</div><div style="color:#5b6b8a">✓ Asked Chef Mealan for three breakfasts from your kitchens, Balkan and Italian</div><div style="color:#1f5fc7;font-weight:700">● Checking his ideas against 619 to 757 kcal and PD 6.5</div><div style="color:#8a97ad">○ Asking again for an idea that missed</div>`;
      w.parentElement.insertBefore(d, w.nextSibling);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "The dots stay; under them the real steps as they happen, each ticked when done: the plate read (code), the ask (the model, 10 to 20 seconds), the checks (code: the range, the portions, the allergies), the second ask when an idea missed. The lines come from the code's own stages, so they are never decoration. The chat gets the same for its wait: Asked Chef Mealan; Matching the foods he names to yours.";
      d.parentElement.insertBefore(n, d.nextSibling);
    }, { NOTE, mark });
    await shot(p, "dt111New"); await p.close();
    // DT113: the recipe page
    p = await fresh([]);
    await p.evaluate(({ extra }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; const F = (id) => s.foods.find((x) => x.id === id);
      s.meals = [{ id: "mix1", title: "Topped mix Kekse and Apple", items: [["bar", 90], ["pb", 40], ["quark", 400], ["apples", 182], ["keks", 50]].map(([id, g], k) => ({ id: "m" + k, food: F(id), grams: g, locked: false })), portion: 762, savedAt: "2026-10-25T00:28:00Z", kind: "meal" }];
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [QU, AP, KE] });
    await p.goto(U + "/"); await p.waitForTimeout(1200);
    await p.locator("nav button").filter({ hasText: "Recipes" }).click(); await p.waitForTimeout(800);
    await p.getByText("Topped mix Kekse and Apple", { exact: true }).first().click(); await p.waitForTimeout(1200);
    await shot(p, "dt113Now");
    await p.evaluate(({ NOTE, mark }) => {
      const ro = document.querySelector(".readout"); if (!ro) return;
      const d = document.createElement("div"); d.style.cssText = mark + ";margin:8px 0 0;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.22);font-size:16px;color:#fff;display:flex;gap:14px;align-items:baseline;font-family:ui-monospace,Menlo,monospace;font-weight:900;letter-spacing:.06em"; d.innerHTML = `<span>F</span><span>C</span><span>fi?</span><span>P</span><small style="font-size:12px;font-weight:600;opacity:.9;margin-left:auto;font-family:Nunito,sans-serif;letter-spacing:0">against your day</small>`;
      ro.appendChild(d);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "The recipe page gets the same four letters as the Plate, under the PD of the readout, for what the readout shows (all of it, or one portion; the letters are the same, they are rates). A tap opens the line per letter. The recipe tiles in Recipes get them later, small, after the PD.";
      ro.parentElement.insertBefore(n, ro.nextSibling);
    }, { NOTE, mark });
    await shot(p, "dt113New"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
