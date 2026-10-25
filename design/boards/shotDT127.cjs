// Board DT127 (Milan 25 October 14:26 "snapping photo of a meal to check what to do about it"; 15:14 "Draw DT127"): a photo of
// the meal in front of you, read onto the Plate as estimates, the three gates at once, one line what to do, and the buttons.
// Now: 0.2.106, Today and the Plate as they are. New: drawn in the browser; nothing in the repo changes.
// 16:20: the photo itself shows on the Plate, so you know what the read is about; a tap opens it full width.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3320", U = `http://127.0.0.1:${PORT}`;
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
  const dataUrl = (f) => "data:image/jpeg;base64," + fs.readFileSync(`${R}/${f}`).toString("base64");
  const PH_CH = dataUrl("photo-chicken.jpg"), PH_SC = dataUrl("photo-schnitzel.jpg");
  try {
    const F2 = (id, name, calories, protein, fats, carbs, icon, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, icon, ...extra });
    const CH = F2("chicken", "Chicken breast, grilled", 165, 31, 3.6, 0, "🍗"), RI = F2("rice", "Rice, cooked", 130, 2.7, 0.3, 28, "🍚"), SA = F2("salad", "Mixed salad, dressed", 60, 1.2, 4.5, 3.5, "🥗"), OL = F2("oil", "Olive oil", 884, 0, 100, 0, "🫒");
    const SC = F2("schnitzel", "Pork schnitzel, breaded, fried", 290, 20, 18, 12, "🍖"), FR = F2("fries", "Fries", 312, 3.4, 15, 41, "🍟");
    const items = [{ id: "a", food: CH, grams: 180, locked: false }, { id: "b", food: RI, grams: 150, locked: false }, { id: "c", food: SA, grams: 90, locked: false }, { id: "d", food: OL, grams: 8, locked: false }];
    const big = [{ id: "a", food: SC, grams: 300, locked: false }, { id: "b", food: FR, grams: 250, locked: false }];
    const btn = (t, primary) => `<span style="flex:1;min-width:120px;text-align:center;border:1.5px solid #2e7be8;border-radius:999px;padding:9px 10px;font-weight:900;font-size:14px;color:${primary ? "#fff" : "#1f5fc7"};background:${primary ? "#2e7be8" : "#fff"}">${t}</span>`;
    const photoCard = (title, sub) => `<div style="${mark};background:#fff;border-radius:16px;padding:12px 14px;margin:10px 0;display:flex;gap:12px;align-items:center"><span style="width:56px;height:56px;border-radius:14px;background:#2e7be8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;flex:none">📷</span><div><b style="font-size:16px">${title}</b><br><small style="color:#5b6b8a">${sub}</small></div></div>`;
    // a: Now, Today as it is
    let p = await fresh([]);
    await p.goto(U + "/"); await p.waitForTimeout(1500);
    await shot(p, "r127nowToday");
    // b: New, Today: the camera button, one tap
    await p.evaluate(({ html, NOTE }) => { const main = document.querySelector("main"); const first = main.querySelector("section, .card"); const d = document.createElement("div"); d.innerHTML = html; const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "One tap at the table: Photo of my meal, on Today and on the Plate. The camera opens, one photo, nothing to type. The read lands on the Plate as estimates and the three gates answer at once."; (first ?? main).before(d.firstElementChild); d.firstElementChild?.after(n); main.insertBefore(n, main.children[1]); }, { html: photoCard("Photo of my meal", "At the table, before you eat. One photo, the verdict in seconds."), NOTE });
    await shot(p, "r127today"); await p.close();
    // c: New, the Plate after the read: estimates, the gates, one line, the buttons
    p = await fresh([]);
    await p.evaluate(({ extra, items }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = items; s.fromRecipe = undefined; s.title = "Grilled chicken with rice and salad"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [CH, RI, SA, OL], items });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Grilled chicken, rice and a dressed salad: a plain lunch plate.", around: "Chicken breast, grilled", better_as: "" }) }));
    await p.reload(); await p.waitForTimeout(1800);
    var BTNS = btn("Ate it", true) + btn("Ate half", false) + btn("Add a food", false) + btn("Not mine", false);
    await p.evaluate(({ mark, NOTE, BTNS, PH }) => {
      const card = document.querySelector(".plate-card"); if (!card) return;
      // the line on top: read from a photo, estimates
      const top = document.createElement("div"); top.style.cssText = mark + ";background:#eef3fc;padding:8px 10px;margin:4px 0 10px;font-size:13.5px;color:#172742;display:flex;gap:10px;align-items:center";
      top.innerHTML = '<img src="' + PH + '" style="width:72px;height:72px;border-radius:10px;object-fit:cover;flex:none;border:2px solid #2e7be8" alt=""><div><b>Your photo, 13:05.</b> Four foods read, amounts estimated (~). Tap the photo to see it large; tap an amount to correct it.</div>';
      card.insertBefore(top, card.firstChild);
      for (const inp of card.querySelectorAll("label.grams input")) { const w = document.createElement("span"); w.textContent = "~"; w.style.cssText = "font-weight:900;color:#2e7be8;margin-right:2px"; inp.before(w); inp.style.outline = "2px solid #2e7be8"; }
      // the gate card: the three lines, then one line from Chef Mealan, then the buttons
      const gate = document.querySelector(".gate-card");
      const say = document.createElement("div"); say.style.cssText = mark + ";background:#fff;padding:10px 12px;margin:10px 0 6px;font-size:14.5px;line-height:1.45;color:#172742";
      say.innerHTML = '<b>Chef Mealan:</b> Eat it as it is. About 620 to 760 kcal and 60 g protein, a full lunch for your day, and nothing on it argues with the dish. The oil is the only guess that moves the numbers much.';
      const row = document.createElement("div"); row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px"; row.innerHTML = BTNS;
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "The photo stays on the Plate, as a thumbnail in the line on top, so the foods and the verdict are read against it; a tap opens it full width with the foods listed over it. The read puts the foods on the Plate as estimates, each with a ~ and a tap to correct (pieces and servings as everywhere). The gate card reads them at once: culinary, nutrition, your day, the same three lines as any plate. Under it one line from Chef Mealan says what to do, in bands, not decimals: eat it as it is; eat half and keep the rest; add a protein side; this is a snack, not your lunch. Then the buttons: Ate it logs it now at this moment; Ate half logs half and keeps the rest on Today; Add a food; Not mine clears the plate.";
      if (gate) { gate.after(say); say.after(row); row.after(n); } else { card.after(say); say.after(row); row.after(n); }
    }, { mark, NOTE, BTNS, PH: PH_CH });
    await shot(p, "r127plate");
    // c2: the photo large, a tap on the thumbnail
    await p.evaluate(({ mark, NOTE, PH }) => {
      const card = document.querySelector(".plate-card"); if (!card) return;
      const big = document.createElement("div"); big.style.cssText = mark + ";background:#fff;border-radius:16px;overflow:hidden;margin:4px 0 10px";
      big.innerHTML = '<div style="position:relative"><img src="' + PH + '" style="width:100%;display:block;aspect-ratio:9/7;object-fit:cover" alt=""><div style="position:absolute;left:10px;bottom:10px;display:flex;gap:6px;flex-wrap:wrap">' + ["Chicken breast ~180 g", "Rice ~150 g", "Salad ~90 g", "Olive oil ~8 g"].map((t) => '<span style="background:rgba(23,39,66,.82);color:#fff;border-radius:999px;padding:4px 10px;font-size:12.5px;font-weight:800">' + t + '</span>').join("") + '</div></div><div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-size:13px;color:#5b6b8a"><span>13:05 · at the table</span><span style="color:#1f5fc7;font-weight:800">Retake</span><span style="color:#1f5fc7;font-weight:800">Close</span></div>';
      card.insertBefore(big, card.firstChild);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "The photo large: what the read saw, with each food named over it at its estimated amount, so a wrong read is caught by eye (that is not rice, that is couscous). Retake makes a new photo and reads again; a food named wrong is corrected on its row as any food, swap or remove. The photo is kept with the meal on Today and in the week, as the plate photos are.";
      big.after(n);
    }, { mark, NOTE, PH: PH_CH });
    await shot(p, "r127photo"); await p.close();
    // d: New, one question when the read is unsure
    p = await fresh([]);
    await p.evaluate(({ extra, items }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = items; s.fromRecipe = undefined; s.title = "Grilled chicken with rice and salad"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [CH, RI, SA, OL], items });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Grilled chicken, rice and a dressed salad: a plain lunch plate.", around: "Chicken breast, grilled", better_as: "" }) }));
    await p.reload(); await p.waitForTimeout(1800);
    await p.evaluate(({ mark, NOTE }) => {
      const card = document.querySelector(".plate-card"); if (!card) return;
      const q = document.createElement("div"); q.style.cssText = mark + ";background:#fff8d6;padding:10px 12px;margin:4px 0 10px;font-size:14.5px;color:#172742";
      q.innerHTML = '<b>One thing I cannot tell from the photo:</b> is the chicken one breast, about 180 g, or two, about 350 g?<div style="display:flex;gap:8px;margin-top:8px"><span style="border:1.5px solid #2e7be8;border-radius:999px;padding:7px 14px;font-weight:900;color:#1f5fc7">One, ~180 g</span><span style="border:1.5px solid #2e7be8;border-radius:999px;padding:7px 14px;font-weight:900;color:#1f5fc7">Two, ~350 g</span><span style="padding:7px 4px;font-weight:700;color:#5b6b8a">Skip</span></div>';
      card.insertBefore(q, card.firstChild);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "At most one question, and only when the read is unsure about the food that moves the numbers most (confidence low on the biggest energy or protein share). Two chips with the amounts, and Skip. Never a form. The gates wait for the answer only when it flips a line; otherwise they show at once and update.";
      card.after(n);
    }, { mark, NOTE });
    await shot(p, "r127ask"); await p.close();
    // e: New, a big plate: eat half
    p = await fresh([]);
    await p.evaluate(({ extra, items }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = items; s.fromRecipe = undefined; s.title = "Schnitzel with fries"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [SC, FR], items: big });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Schnitzel with fries: a dish, and a big one.", around: "Pork schnitzel, breaded, fried", better_as: "" }) }));
    await p.reload(); await p.waitForTimeout(1800);
    BTNS = btn("Ate half", true) + btn("Ate it", false) + btn("Add a food", false) + btn("Not mine", false);
    await p.evaluate(({ mark, NOTE, BTNS, PH }) => {
      const card = document.querySelector(".plate-card"); if (!card) return;
      const top = document.createElement("div"); top.style.cssText = mark + ";background:#eef3fc;padding:8px 10px;margin:4px 0 10px;font-size:13.5px;color:#172742;display:flex;gap:10px;align-items:center";
      top.innerHTML = '<img src="' + PH + '" style="width:72px;height:72px;border-radius:10px;object-fit:cover;flex:none;border:2px solid #2e7be8" alt=""><div><b>Your photo, 13:05.</b> Two foods read, amounts estimated (~). Tap the photo to see it large.</div>';
      card.insertBefore(top, card.firstChild);
      for (const inp of card.querySelectorAll("label.grams input")) { const w = document.createElement("span"); w.textContent = "~"; w.style.cssText = "font-weight:900;color:#2e7be8;margin-right:2px"; inp.before(w); }
      const gate = document.querySelector(".gate-card") ?? card;
      const say = document.createElement("div"); say.style.cssText = mark + ";background:#fff;padding:10px 12px;margin:10px 0 6px;font-size:14.5px;line-height:1.45;color:#172742";
      say.innerHTML = '<b>Chef Mealan:</b> Eat half and take the rest home. The whole plate is about 1,550 to 1,800 kcal, more than half your day, and most of it is fat. Half is a lunch; with a side salad it is a good one.';
      const row = document.createElement("div"); row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 10px"; row.innerHTML = BTNS;
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "The same three gates, the restaurant case. The nutrition gate fires (fat over half the energy, N27), the size line says about two lunches (C31), your day says lunch is about 900 kcal. Chef Mealan's line comes from the gates by code, in words: Eat half is the first button because it is the advice. Ate half logs half now and keeps the other half on Today as a prepared card, so dinner knows.";
      gate.after(say); say.after(row); row.after(n);
    }, { mark, NOTE, BTNS, PH: PH_SC });
    await shot(p, "r127big"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
