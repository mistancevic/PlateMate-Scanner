// Boards DT93 and DT94 (Milan 24 October 13:58 to 14:01, from his first real test of 0.2.87): the culinary gate, Fit in place,
// and three phases (Craft, Make, Feedback). Now: 0.2.87 with Milan's plate: a protein bar, active dry yeast, peanut butter.
// New: the same pages with the change drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3304", U = `http://127.0.0.1:${PORT}`;
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
    await p.clock.setFixedTime(new Date("2026-10-24T21:55:00"));
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
    const H = (t) => `<div style="${NOTE}">${t}</div>`;
    const card = (inner) => `<div style="margin:10px 0;padding:12px 14px;border-radius:14px;background:#eef3fc;${mark}"><div style="font-weight:800;color:#1f5fc7;font-size:14px;margin-bottom:6px">⌂ Chef Mealan</div>${inner}</div>`;
    const pill = (t, primary) => `<button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:${primary ? "#2e7be8" : "#fff"};color:${primary ? "#fff" : "#1f5fc7"};font-weight:800;font-size:13px;margin:6px 8px 0 0;font-family:inherit">${t}</button>`;
    const YE7 = [{ id: "a", food: BAR, grams: 50, locked: false }, { id: "b", food: YE, grams: 7, locked: false }];
    // DT104 and DT105, Now: Milan's plate at 21:55, the read fails, nothing is said
    let p = await fresh(YE7);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.reload(); await p.waitForTimeout(1600);
    await shot(p, "dt104Now");
    // DT105 New: the yeast is caught by code before any read
    await p.evaluate(({ card, pill, H }) => {
      const ways = document.querySelector(".ways-out") || document.querySelector(".chef-tip");
      const d = document.createElement("div"); d.innerHTML = card(`<div style="font-size:14px;line-height:1.45">Active dry yeast is an ingredient, not a food. It needs a dish around it: a dough, a batter. On its own it is not a snack.</div>${pill("Take the yeast out")}${pill("Ask Chef Mealan for a dish around it")}`);
      ways.parentElement.insertBefore(d, ways);
      const n = document.createElement("div"); n.innerHTML = H("Code, not the AI: the C6 list (yeast, flour, baking powder, stock, oil, sugar, salt, spices) is checked before Chef Mealan reads the plate. An ingredient on the plate gets this line at once, offline too. The read still runs for the rest.");
      ways.parentElement.insertBefore(n, ways);
      const tip = document.querySelector(".chef-tip"); if (tip) tip.remove();
    }, { card: card.toString(), pill: pill.toString(), H: H.toString() }).catch(() => {});
    await p.evaluate(({ NOTE, mark }) => {
      // the helper strings above come as text; build the note by hand
      const ways = document.querySelector(".ways-out") || document.querySelector(".chef-tip");
      if (!ways) return;
      const card = document.createElement("div"); card.style.cssText = "margin:10px 0;padding:12px 14px;border-radius:14px;background:#eef3fc;" + mark;
      card.innerHTML = `<div style="font-weight:800;color:#1f5fc7;font-size:14px;margin-bottom:6px">⌂ Chef Mealan</div><div style="font-size:14px;line-height:1.45">Active dry yeast is an ingredient, not a food. It needs a dish around it: a dough, a batter. On its own it is not a snack.</div>` +
        `<button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:#2e7be8;color:#fff;font-weight:800;font-size:13px;margin:8px 8px 0 0;font-family:inherit">Take the yeast out</button><button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:#fff;color:#1f5fc7;font-weight:800;font-size:13px;margin:8px 0 0;font-family:inherit">Ask Chef Mealan for a dish around it</button>`;
      ways.parentElement.insertBefore(card, ways);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Code, not the AI: the C6 list (yeast, flour, baking powder, stock, oil, sugar, salt, spices) is checked before Chef Mealan reads the plate. An ingredient on the plate gets this line at once, offline too. The read still runs for the rest of the plate.";
      ways.parentElement.insertBefore(n, ways);
      const tip = document.querySelector(".chef-tip"); if (tip) tip.remove();
    }, { NOTE, mark });
    await shot(p, "dt105New"); await p.close();
    // DT104 New: a plate of food, the read fails, the card says so
    p = await fresh([{ id: "a", food: BAR, grams: 50, locked: false }, { id: "s", food: seed.foods.find((f) => /^Skyr, natural/.test(f.name)) || seed.foods[1], grams: 150, locked: false }]);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.reload(); await p.waitForTimeout(1600);
    await p.evaluate(({ NOTE, mark }) => {
      const ways = document.querySelector(".ways-out") || document.querySelector(".chef-tip");
      if (!ways) return;
      const card = document.createElement("div"); card.style.cssText = "margin:10px 0;padding:12px 14px;border-radius:14px;background:#eef3fc;" + mark;
      card.innerHTML = `<div style="font-weight:800;color:#1f5fc7;font-size:14px;margin-bottom:6px">⌂ Chef Mealan</div><div style="font-size:14px;line-height:1.45">Chef Mealan could not read your plate.</div><button style="height:34px;padding:0 14px;border-radius:999px;border:1.5px solid #2e7be8;background:#fff;color:#1f5fc7;font-weight:800;font-size:13px;margin:8px 0 0;font-family:inherit">Try again</button>`;
      ways.parentElement.insertBefore(card, ways);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Today a failed read (an error from the model, or an answer that is not the expected form) shows nothing, so a plate looks checked when it was not. Now it says so, with Try again. The pilot log keeps the failure.";
      ways.parentElement.insertBefore(n, ways);
    }, { NOTE, mark });
    await shot(p, "dt104New"); await p.close();
    // DT106 and DT107: the chat from the plate
    const REPLY = "Low-fat quark and an apple go well with your protein bar to bring your meal up to your protein target. You can skip the active dry yeast unless you are planning to bake. The nutritional numbers are estimates.";
    p = await fresh(YE7);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/out", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reply: REPLY, recognised: [], picks: [] }) }));
    await p.reload(); await p.waitForTimeout(1600);
    await p.getByRole("button", { name: "Ask Chef Mealan what to add" }).click(); await p.waitForTimeout(700);
    await p.getByRole("button", { name: "What goes with this?" }).click(); await p.waitForTimeout(1200);
    await shot(p, "dt106Now");
    await p.evaluate(({ NOTE, mark }) => {
      const b = [...document.querySelectorAll(".bubble.mealan")].pop(); if (!b) return;
      const rows = document.createElement("div"); rows.style.cssText = "margin-top:10px;" + mark;
      const row = (name, sub, btn, primary) => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #d1dcf0"><div style="flex:1"><b style="font-size:14px">${name}</b><br><small style="color:#5b6b8a;font-size:12.5px">${sub}</small></div><button style="height:32px;padding:0 12px;border-radius:999px;border:1.5px solid #2e7be8;background:${primary ? "#2e7be8" : "#fff"};color:${primary ? "#fff" : "#1f5fc7"};font-weight:800;font-size:13px;font-family:inherit">${btn}</button></div>`;
      rows.innerHTML = row("Quark, low fat (Magerquark)", "in your foods · 250 g · PD 17.9 · the plate reaches 9.7", "+ Add", true) + row("Apple", "basic food · 1 M, about 180 g · PD 0.6 · the plate stays at 4.6", "+ Add", false) + row("Active dry yeast", "on the plate · 7 g", "Take it out", false);
      b.appendChild(rows);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "His words stay his. Code reads the food names in the answer, matches them to your foods and to the basic foods table, and puts one row per match under the answer with its start amount and what the plate would reach: + Add puts it on the plate. A food he names that is in neither gets Scan it. A food he says to drop gets Take it out. Every row goes through the culinary rules first.";
      b.appendChild(n);
      const chips = document.createElement("div"); chips.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;" + mark;
      chips.innerHTML = ["Swap a food on my plate", "Make my plate a snack", "Better match for my target?"].map((t) => `<span style="border:1.5px solid #2e7be8;color:#1f5fc7;border-radius:999px;padding:5px 12px;font-size:13px;font-weight:700">${t}</span>`).join("");
      b.parentElement.appendChild(chips);
    }, { NOTE, mark });
    await shot(p, "dt106New");
    // DT107 Now: close, come back, silence
    await p.evaluate(() => { const c = [...document.querySelectorAll("button, a")].find((e) => e.textContent.trim() === "Close"); if (c) c.click(); }); await p.waitForTimeout(600);
    await p.getByRole("button", { name: "Ask Chef Mealan what to add" }).click(); await p.waitForTimeout(800);
    await shot(p, "dt107Now");
    await p.evaluate(({ NOTE, mark }) => {
      const list = document.querySelector(".bubble") ? document.querySelector(".bubble").parentElement : document.querySelector("main");
      const you = document.createElement("div"); you.className = "bubble you"; you.style.cssText = mark; you.innerHTML = "<p>What should I change on my plate so it makes a snack? 50 g Clean Protein Bar Peanut Love, 7 g Active dry yeast.</p>";
      list.appendChild(you);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Ask Chef Mealan from the Plate always asks: the plate goes in as a new question, every time, even when the chat has turns from before. The old turns stay above as history. The chips (Swap a food on my plate, Make my plate a snack, Better match for my target?) come back under every answer, not only in an empty chat.";
      list.appendChild(n);
    }, { NOTE, mark });
    await shot(p, "dt107New"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
