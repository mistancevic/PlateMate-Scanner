// Boards DT131 (the Plate asks: a new plate or add), DT132 (on the edge), DT133 (portions). Milan 27 October 13:52 and 14:12.


// Drawn in the browser; nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3326", U = `http://127.0.0.1:${PORT}`;
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
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const fresh = async (items = seed.items) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ["camera"] });
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
  const PH = dataUrl("photo-chicken.jpg");
  try {
    const F2 = (id, name, calories, protein, fats, carbs, icon, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, icon, ...extra });
    const QU = F2("quark", "Quark, low fat", 67, 12, 0.3, 4, "🥛"), OA = F2("oats", "Oats", 372, 13.5, 7, 58.7, "🌾", { fiber: 10 }), AP = F2("apple", "Apple", 52, 0.3, 0.2, 14, "🍎", { fiber: 2.4 }), PBt = F2("pb2", "Peanut butter", 588, 25, 50, 20, "🥜", { fiber: 6 });
    const items = [{ id: "a", food: QU, grams: 250, locked: false }, { id: "b", food: OA, grams: 40, locked: false }, { id: "c", food: AP, grams: 150, locked: false }, { id: "d", food: PBt, grams: 15, locked: false }];
    const setup = async (its = items, title = "Quark bowl") => { const p = await fresh([]);
      await p.evaluate(({ extra, items, title }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = items; s.fromRecipe = undefined; s.title = title; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [QU, OA, AP, PBt], items: its, title });
      await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Quark, oats, apple and peanut butter: a breakfast bowl.", around: "", better_as: "" }) }));
      await p.reload(); await p.waitForTimeout(1800); return p; };
    const crop = async (p, name, sel = ".plate-card") => { await p.waitForTimeout(300); await flat(p); const el = p.locator(sel).first(); await el.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
    const CH = F2("chk", "Chicken breast, grilled", 165, 31, 3.6, 0, "🍗"), RI = F2("rice", "Rice, cooked", 130, 2.7, 0.3, 28, "🍚", { fiber: 0.4 }),
      SA = F2("sal", "Mixed salad, dressed", 60, 1.2, 4.5, 3.5, "🥗", { fiber: 1.5 }), FE = F2("feta", "Feta", 264, 14, 21, 4, "🧀"),
      SM = F2("salmon", "Salmon, baked", 208, 20, 13, 0, "🐟"), AV = F2("avo", "Avocado", 160, 2, 15, 9, "🥑", { fiber: 7 }), OL = F2("oil", "Olive oil", 884, 0, 100, 0, "🫒"),
      PA = F2("pasta", "Pasta, cooked", 158, 5.8, 0.9, 31, "🍝", { fiber: 1.8 }), CS = F2("gouda", "Gouda cheese", 356, 25, 27, 2.2, "🧀"), TS = F2("tsauce", "Tomato sauce", 50, 1.5, 2, 7, "🍅", { fiber: 1.5 });
    const EXTRA = [CH, RI, SA, FE, SM, AV, OL, PA, CS, TS];
    const est = (g) => ({ low: Math.round(g * 0.75), high: Math.round(g * 1.25) });
    const plateWith = async (its, title, x = {}) => { const p = await fresh([]);
      await p.evaluate(({ extra, its, title, x }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = its; s.fromRecipe = undefined; s.title = title; if (x.photo) s.photo = x.photo;
        localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
        if (x.meals) { const pe = JSON.parse(localStorage.getItem("chefmealan-personal")); pe.lifestyle.meals = x.meals; localStorage.setItem("chefmealan-personal", JSON.stringify(pe)); } }, { extra: EXTRA, its, title, x });
      await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A plain lunch plate.", around: "", better_as: "" }) }));
      await p.reload(); await p.waitForTimeout(1800); return p; };
    const card = (p, html) => p.evaluate(({ html, mark }) => { const c = document.querySelector(".plate-card"); if (!c) return; const d = document.createElement("section"); d.className = "pa"; d.style.cssText = mark; d.innerHTML = html; c.insertBefore(d, c.firstChild); }, { html, mark });
    const btns = (a, b, link) => `<div class="pa-go" style="flex-wrap:wrap"><button class="pill pill-primary">${a}</button><button class="pill">${b}</button></div>${link ? `<button class="link" style="align-self:flex-start">${link}</button>` : ""}`;

    // DT131 Now: a plate with foods; a photo read replaces them
    let p = await plateWith([{ id: "a", food: CH, grams: 180, locked: false }, { id: "b", food: RI, grams: 150, locked: false }], "Chicken and rice");
    await note(p, ".plate-card", "Now (0.2.112): you are building lunch, chicken and rice. You take a photo of the salad bowl from the buffet. The read replaces your two foods with the salad and feta, without asking. A recipe made from Recipes, a slot from Plan, a screenshot and a link do the same.", "before");
    await shot(p, "r131now"); await p.close();
    // DT131 New: the Plate asks
    p = await plateWith([{ id: "a", food: CH, grams: 180, locked: false }, { id: "b", food: RI, grams: 150, locked: false }], "Chicken and rice");
    await card(p, `<div class="pa-top"><img src="${PH}" alt=""><span><b>Your plate already has 2 foods: Chicken and rice.</b><br>The photo read 2 foods: mixed salad ~120 g, feta ~40 g.</span></div>` + btns("Add to my plate", "Start a new plate", "Drop the photo") + `<small>Add to my plate: the salad and the feta join the chicken and rice, marked ~. Start a new plate: only the photo's foods.</small>`);
    await note(p, ".pa", "New: before anything lands on a plate that has foods, one question. The foods that wait are named, so you see what comes. Nothing changes until you tap. The first button is the likely one: Add for a photo of a side or a second plate. For a recipe, a slot, a screenshot or a link, Start a new plate comes first.");
    await shot(p, "r131ask"); await p.close();
    // DT131 New: the same for a recipe
    p = await plateWith([{ id: "a", food: CH, grams: 180, locked: false }, { id: "b", food: RI, grams: 150, locked: false }], "Chicken and rice");
    await card(p, `<div class="pa-top"><span><b>Your plate already has 2 foods: Chicken and rice.</b><br>Lentil soup from your recipes has 5 foods.</span></div>` + btns("Start a new plate", "Add to my plate", "Keep my plate") );
    await note(p, ".pa", "New: the same question for Make it from Recipes, a meal from Plan, a screenshot and a link. Keep my plate: nothing changes and you stay here. No question when the plate is empty, and none for one food (Add, a scan, a member's food): one food is always added, as today. Chef Mealan's own meal (Make it a lunch) still replaces the plate: you asked him for it.");
    await shot(p, "r131recipe"); await p.close();
    // DT131 New: after Add to my plate
    p = await plateWith([{ id: "a", food: CH, grams: 180, locked: false }, { id: "b", food: RI, grams: 150, locked: false }, { id: "c", food: SA, grams: 120, locked: false, est: est(120) }, { id: "d", food: FE, grams: 40, locked: false, est: est(40) }], "Chicken and rice", { photo: { image: PH, at: "2026-10-25T13:05:00", unsure: null } });
    await note(p, ".plate-card", "New, after Add to my plate: four foods. Yours keep their grams; the photo's two are marked ~ as estimates, a tap corrects them. The name stays Chicken and rice. The photo stays in the line on top, for the foods it read.", "before");
    await shot(p, "r131added"); await p.close();

    // DT132 Now: 51 percent fat reads as a plain fail
    const edgePlate = [{ id: "a", food: SM, grams: 200, locked: false }, { id: "b", food: RI, grams: 80, locked: false }, { id: "c", food: AV, grams: 60, locked: false }];
    p = await plateWith(edgePlate, "Salmon bowl");
    await p.evaluate(({ mark }) => { const g = [...document.querySelectorAll(".gate-line-row")].find((x) => /Nutrition/.test(x.textContent)); if (g) g.style.cssText += ";" + mark; }, { mark });
    await note(p, ".gate-card", "Now: salmon, rice and avocado. Fat is 51.5 percent of the energy, and the rule's line is more than half. The plate fails like a plate at 74 percent, and the line says 51 percent under More than half. 50.2 percent read as 50.");
    await shot(p, "r132now"); await p.close();
    // DT132 New: on the edge
    p = await plateWith(edgePlate, "Salmon bowl");
    await p.evaluate(({ mark }) => { const g = [...document.querySelectorAll(".gate-line-row")].find((x) => /Nutrition/.test(x.textContent)); if (!g) return;
      g.className = "gate-line-row"; g.style.cssText = mark + ";background:#fff4dc;border-radius:10px;padding:8px 10px";
      g.innerHTML = '<b style="color:#9a5b00">~ Nutrition, on the edge</b><small>Fat is about half of this lunch\'s energy: 51 percent, and the line is 50. A plate this close passes, with this note.</small><small style="color:#5b6b8a">To be clear of it: a little less avocado, or a protein side.</small>'; }, { mark });
    await note(p, ".gate-card", "New: a value within 2 points of a rule's line is on the edge: amber, a ~, the number and the line, no buttons. It passes, so nothing blocks you, but the DaaM Good spot waits for a clear pass. The edges: fat 48 to 52 percent; protein from a supplement 48 to 52 percent; carbs before training 8 to 12 percent; before training 570 to 630 kcal; after training 13 to 17 g protein; the plate's size 1.3 to 1.5 portions.");
    await shot(p, "r132edge"); await p.close();
    // DT132: well over the line stays a fail
    p = await plateWith([{ id: "a", food: SM, grams: 200, locked: false }, { id: "b", food: AV, grams: 150, locked: false }, { id: "c", food: OL, grams: 15, locked: false }], "Salmon and avocado");
    await note(p, ".gate-card", "As today: 74 percent fat is well over the line, a plain fail with its ways. The edge is narrow on purpose: it only takes the cases where rounding and a label's error decide.");
    await shot(p, "r132clear"); await p.close();

    // DT133 Now: three lunches, eat half
    const big = [{ id: "a", food: PA, grams: 1000, locked: false, est: est(1000) }, { id: "b", food: CS, grams: 150, locked: false, est: est(150) }, { id: "c", food: TS, grams: 400, locked: false, est: est(400) }];
    p = await plateWith(big, "Pasta with tomato sauce and cheese", { photo: { image: PH, at: "2026-10-25T13:05:00", unsure: null } });
    await p.evaluate(({ mark }) => { const s = document.querySelector(".mp-say"); if (s) s.style.cssText += ";" + mark; }, { mark });
    await note(p, ".mp-say", "Now: a family pasta dish, 2,314 kcal. Your lunch is about 917 kcal, so the plate is about 3 lunches, counted by energy, not by weight. The line says eat half, and half is a lunch: true only for 2. Two more things: the card above says three lunches too, and it shows the DaaM Good spot on a plate of three lunches, which is wrong.");
    await shot(p, "r133now"); await p.close();
    // DT133 New: portions
    p = await plateWith(big, "Pasta with tomato sauce and cheese", { photo: { image: PH, at: "2026-10-25T13:05:00", unsure: null } });
    await p.evaluate(({ mark }) => { const s = document.querySelector(".mp-say"); if (!s) return; s.style.cssText += ";" + mark;
      const t = s.querySelector("small"); if (t) t.innerHTML = "<b>Chef Mealan:</b> Be aware: this plate is about 3 portions of your lunch, about 1,740 to 2,890 kcal for a lunch of about 917. Eat one portion and keep the rest.";
      const row = s.querySelector(".button-row"); if (row) row.innerHTML = '<button class="pill pill-small pill-primary">Ate one portion</button><button class="pill pill-small">Ate it all</button><button class="pill pill-small">Add a food</button><button class="link">Not mine</button>'; }, { mark });
    await note(p, ".mp-say", "New: portions, not lunches. A portion is your lunch's share of your day, from your plan: your goal, how many meals, what you ate before. Ate one portion logs a third and keeps the other 2 portions on Today. The card above says the same: Your plate is already about 3 lunch portions, with Make it 3 portions, Shrink it to one portion, Keep it as it is; and no DaaM Good spot on a plate over its meal. For 2 portions it reads as today, with Ate one portion in place of Ate half.");
    await shot(p, "r133new"); await p.close();
    // DT133: one meal a day, the same plate is one portion
    p = await plateWith(big, "Pasta with tomato sauce and cheese", { photo: { image: PH, at: "2026-10-25T13:05:00", unsure: null }, meals: 2 });
    await p.evaluate(({ mark }) => { const s = document.querySelector(".mp-say"); if (s) s.style.cssText += ";" + mark; }, { mark });
    await note(p, ".mp-say", "The context counts, today already: the same plate at 13:05 for someone who eats 2 meals a day. Their meal ahead is dinner, about 1,375 kcal, so the plate is about 2 portions. The portion comes from the plan (the goal, meals a day, what is eaten and what is still to come), never from a fixed number. One meal a day is not a choice yet: Lifestyle offers 2 to 5 meals.");
    await shot(p, "r133one"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
