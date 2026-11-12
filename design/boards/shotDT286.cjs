// Board DT286 and DT287 (Coach Milan with Tester 2, 12 November 13:28 to 13:55; brainstorm 15:00 to 15:35): Chef Mealan's
// suggestions on the Plate and Fill the open slots on Plan. Now: the same three, a general line, a second chat. New: on the goal by
// default, on the plate's weak layer, with the amount and what it changes; chips choose the direction; one conversation.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/pm139", PORT = "3490", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.meals = [];
const salad = { id: "f-orijenta", name: "Orijenta salad", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-01T10:00:00Z", readyToEat: true, fiber: 1.5, calories: 19, protein: 1.3, fats: 0.4, carbs: 2.6 };
seed.foods = [...seed.foods, salad, { id: "f-roggen", name: "Roggen Vollkornbrot", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-01T10:00:00Z", readyToEat: true, fiber: 8, calories: 205, protein: 6.5, fats: 1.4, carbs: 38 }];
seed.items = [{ id: "i1", food: salad, grams: 150, locked: false }];
const NOW = { reply: "Light protein and a little crunchy bread go well with Orijenta salad. That makes a fresh, balanced and complete meal.", ms: 900, suggestions: [
  { action: "add", food: "Chicken breast, cooked", why: "A mild, juicy protein that goes well with the fresh salad.", known: true, calories: 165, protein: 31, fats: 3.6, carbs: 0 },
  { action: "add", food: "Cottage cheese (Hüttenkäse)", why: "A creamy texture that ties the crunchy vegetables together.", known: true, calories: 98, protein: 12, fats: 4, carbs: 3 },
  { action: "add", food: "Roggen Vollkornbrot", why: "Adds fullness and crunch to every bite.", known: true, calories: 205, protein: 6.5, fats: 1.4, carbs: 38 }] };
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (path = "/plate") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-12T12:40:00+01:00"));
    await p.addInitScript(({ s }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { s: seed });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/plate", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(NOW) }));
    await p.goto(U + path); await p.waitForTimeout(1500);
    return p;
  };
  const shot = async (p, name, full = false, h = 0) => { if (h) await p.setViewportSize({ width: 390, height: h }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot", name); };
  const sheetNote = (p, t) => p.evaluate(({ t, NOTE }) => { const h = document.querySelector(".helper"); const d = document.createElement("div"); d.style.cssText = NOTE + ";margin:6px 0 10px"; d.textContent = t; h.insertAdjacentElement("afterbegin", d); }, { t, NOTE });
  const sheet = (p, html) => p.evaluate(({ html }) => { const h = document.querySelector(".helper"); h.innerHTML = html; }, { html });
  const openHelper = async () => { const p = await open(); await p.locator(".chat-fab").click(); await p.waitForTimeout(800); return p; };
  const F = "font-family:Nunito,system-ui,sans-serif;color:#172742";
  const chips = (on) => `<div class="moments chips-start" style="${mark};padding:6px">${["Better for my goal", "Another protein", "Other carbs", "Crunchier", "Something I crave", "Something else entirely"].map((c) => `<button class="pill pill-small${c === on ? " pill-primary" : ""}" style="min-height:44px">${c}</button>`).join("")}</div>`;
  const sug = (name, nums, why, add) => `<div class="suggestion" style="align-items:center"><div><b>${name}</b><small style="display:block;font-weight:800;color:#13804f">${nums}</small><small>${why}</small></div><button class="pill" style="min-height:48px;white-space:nowrap;background:#2a72d9;color:#fff;border-color:#2a72d9">+ ${add}</button></div>`;
  const head = `<div class="card-top"><span>Chef Mealan, about this plate</span><button class="link">Close</button></div><small style="display:block;margin:2px 0 8px;color:#53627f;font-size:14px;line-height:1.4">Lunch, 13:45 · Orijenta salad, 150 g · PD 5.3 · 1,200 kcal and 64 g protein left today</small>`;
  const field = `<div class="chat-input"><div class="clear-field"><input placeholder="Ask about this plate…" value=""></div><button class="icon" aria-label="Ask">➤</button></div>`;
  // DT286a now
  let p = await openHelper();
  await p.locator(".helper button").filter({ hasText: /What goes with this/ }).first().click(); await p.waitForTimeout(1200);
  await p.evaluate((mark) => { for (const e of [...document.querySelectorAll(".helper .suggestion"), ...document.querySelectorAll(".helper > button.link")]) e.style.cssText += ";" + mark; }, mark);
  await sheetNote(p, "Now (0.3.141): every time the same three from the first foods of your list, a general line, a second chat (Something else? Talk to Chef Mealan), and no amount or what it changes.");
  await shot(p, "r286a"); await p.context().close();
  // DT286b new: the goal, by default, on the weak layer
  p = await openHelper();
  await sheet(p, head + `<p class="helper-reply" style="${mark};padding:6px"><b>Your plate is low on protein:</b> PD 5.3, your target 8.2. Three ways to get there:</p>`
    + sug("Turkey breast, cooked", "120 g · PD 5.3 → 8.4 · +130 kcal", "Mild and juicy beside the fresh salad.", "120 g")
    + sug("Eggs, boiled", "2 eggs · PD 5.3 → 7.9 · +140 kcal", "A classic with a vinegar salad.", "2 eggs")
    + sug("Tuna in water", "1 can, 110 g · PD 5.3 → 9.0 · +120 kcal", "Salty and quick, no cooking.", "1 can")
    + `<button class="pill pill-wide" style="min-height:44px;margin:8px 0;background:#fff;border:1.5px solid #2a72d9;color:#1f5fc7;font-weight:800">More like this</button>` + chips("Better for my goal") + field);
  await sheetNote(p, "New: it opens with the answer for your goal, on what the plate lacks (here protein), with the amount and what it does to PD and kcal. Chips pick another direction. One conversation: no second chat.");
  await shot(p, "r286b", false, 1010); await p.context().close();
  // DT286c new: a craving, asked for, with its cost and the way back
  p = await openHelper();
  await sheet(p, head + `<p class="helper-reply" style="${mark};padding:6px"><b>Something tasty, then.</b> Here is how each one changes your plate.</p>`
    + sug("Feta, crumbled", "50 g · PD 5.3 → 5.9 · +130 kcal", "Salty and creamy: the salad's best friend.", "50 g")
    + sug("Olive oil and toasted bread", "1 tbsp + 1 slice · PD 5.3 → 3.9 · +210 kcal", "Crunch and a rich taste.", "both")
    + `<p class="helper-reply" style="${mark};padding:6px;background:#eef8f1">To stay close to your goal: add 120 g turkey breast too, and PD lands at 8.0. Or keep dinner light: about 900 kcal left after this.</p>`
    + chips("Something I crave") + field);
  await sheetNote(p, "New: something tasty only when you ask. Chef Mealan shows how it changes your plate, and how to stay close to your goal.");
  await shot(p, "r286c", false, 960); await p.context().close();
  // DT287a now: Fill the open slots
  p = await open("/plan"); await p.locator("button.plan-fill").click(); await p.waitForTimeout(1500);
  await p.evaluate((mark) => { const f = document.querySelector(".fill-rows"); f.style.cssText += ";" + mark; }, mark);
  await p.evaluate(({ NOTE }) => { const f = document.querySelector(".fill-rows"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "Now (0.3.141): one pick per slot, the same every day: code ranks your recipes by PD and the slot's size, and never looks at what you ate this week. Dinner lands under your target."; f.closest(".turn, div").insertAdjacentElement("beforebegin", d); }, { NOTE });
  await shot(p, "r287a"); await p.context().close();
  // DT287b new: two or three choices per slot, each with a why; chips per slot; the protein rotates across the week
  p = await open("/plan"); await p.locator("button.plan-fill").click(); await p.waitForTimeout(1500);
  const choice = (on, name, nums, why) => `<button style="display:flex;gap:10px;align-items:flex-start;text-align:left;width:100%;min-height:56px;padding:10px;margin-top:6px;background:${on ? "#eef4ff" : "#fff"};border:${on ? "2px solid #2a72d9" : "1.5px solid #d1dcf0"};border-radius:12px;${F}"><span style="font-size:18px;color:#2a72d9">${on ? "●" : "○"}</span><span><b style="font-size:15px">${name}</b><small style="display:block;font-size:13px;color:#53627f">${nums}</small><small style="display:block;font-size:13px;color:#13804f;font-weight:700">${why}</small></span></button>`;
  const slotChips = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${["Another protein", "Lighter", "Something I crave"].map((c) => `<button class="pill pill-small" style="min-height:44px">${c}</button>`).join("")}</div>`;
  const slot = (t, cs) => `<div style="border-top:1px solid #e3eaf6;padding:10px 0"><small style="font-size:13px;color:#53627f">${t}</small>${cs.map((c) => choice(...c)).join("")}${slotChips}</div>`;
  await p.evaluate(({ html, mark }) => { const f = document.querySelector(".fill-rows"); f.innerHTML = html; f.style.cssText += ";" + mark; }, { mark, html:
    slot("Breakfast, 07:30", [[true, "Protein pancakes", "545 kcal · 41 g · PD 7.5", "Eggs and quark: no oats, you had them twice"], [false, "Skyr bowl with berries", "430 kcal · 38 g · PD 8.8", "Quick, no cooking"]])
    + slot("Lunch, 13:45", [[true, "Chicken, bulgur and roasted peppers", "610 kcal · 52 g · PD 8.5", "Chicken: once this week"], [false, "Oats, skyr and banana", "504 kcal · 35 g · PD 6.9", "Your usual; a little under PD"]])
    + slot("Dinner, 20:00", [[true, "Salmon, rice and greens", "620 kcal · 48 g · PD 7.7", "Fish: none yet this week"], [false, "Sarma with skyr", "560 kcal · 42 g · PD 7.5", "Your sarma, with skyr for protein"], [false, "Bean stew with feta", "540 kcal · 34 g · PD 6.3", "Legumes; under PD, so a lighter lunch"]])
    + `<div class="button-row" style="margin-top:8px;justify-content:flex-end"><button class="pill pill-primary" style="min-height:48px">Put them in the plan</button></div>` });
  await p.evaluate(() => { const t = [...document.querySelectorAll("*")].find((e) => e.children.length === 0 && /^Today, filled/.test(e.textContent.trim())); if (t) t.innerHTML = "Today, on your goal: the day lands at <b>2,180 kcal and 141 g protein</b>, PD 8.0. Fish is new this week; eggs and chicken twice already. Pick one per meal, or ask for another.";
    for (const e of document.querySelectorAll("body *")) { const cs = getComputedStyle(e); if ((cs.position === "fixed" || cs.position === "sticky") && !e.closest("header")) e.style.display = "none"; } });
  await p.evaluate(({ NOTE }) => { const f = document.querySelector(".fill-rows"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New: every slot on your goal, with two or three choices and why each one; the protein changes across the week. Chips per slot: Another protein, Lighter, Something I crave."; f.insertAdjacentElement("beforebegin", d); }, { NOTE });
  await shot(p, "r287b", true); await p.context().close();
  await b.close(); server.kill();
})();
