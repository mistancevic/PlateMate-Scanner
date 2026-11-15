// Board B144 (Coach Milan 15 November 19:04 to 19:12, Draw): a photo of a pot of soup read as one food, 1,400 g, as his dinner; his
// words (what is in it) did not turn into foods. New: the same form before the read, with choices that adapt (how much of it is
// yours, which dish of the meal, what is in it); the read gives the dish in its foods; his words stay in view.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/platemate-scanner", PORT = "3531", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const SOUP = "/home/claude/boards/soup.jpg";
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const WORDS = "mushrooms, carrots, onion, garlic, white carrot, sour cream, chicken bouillon, parsley, pepper, vlašac";
const f = (name, grams, calories, protein, fats, carbs, fiber) => ({ name, grams, low: Math.round(grams * 0.7), high: Math.round(grams * 1.3), calories, protein, fats, carbs, fiber, confidence: "medium" });
const ONE = { dish: "Creamy mushroom vegetable soup", foods: [f("Cream of mushroom and vegetable soup", 1400, 65, 1.8, 4.2, 5, 0.8)], unsure: null, which: null, course: "main" };
const MANY = { dish: "Creamy mushroom vegetable soup", foods: [f("Mushrooms", 400, 22, 3.1, 0.3, 3.3, 1), f("Carrots", 200, 41, 0.9, 0.2, 9.6, 2.8), f("Onion", 120, 40, 1.1, 0.1, 9.3, 1.7), f("Parsnip", 120, 75, 1.2, 0.3, 18, 4.9), f("Garlic", 10, 149, 6.4, 0.5, 33, 2.1), f("Sour cream, 20 %", 200, 193, 2.4, 20, 2.9, 0)], unsure: null, which: null, course: "starter" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const open = async (read) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin", permissions: ["camera"] }); const p = await ctx.newPage(); p.on("pageerror", (e) => console.log("ERR", e.message));
    await p.clock.install({ time: new Date("2026-11-15T18:00:00+01:00") });
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }));
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", betterAs: "meal", holds: "" }) }));
    await p.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1400);
    return p;
  };
  const hide = (p) => p.evaluate(() => document.querySelectorAll(".chat-fab, .toast").forEach((x) => (x.style.visibility = "hidden")));
  const note = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement("beforebegin", d); d.id = "nt"; }, { t, NOTE, sel });
  const shot = async (p, name, sel, off = 120) => { await hide(p); await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const toForm = async (p) => { await p.locator(".mp-button").click(); await p.waitForTimeout(1500); await p.locator(".camera-ui input[type=file]").setInputFiles(SOUP); await p.waitForTimeout(1300); };
  const readIt = async (p, words) => { if (words) await p.locator(".pa-note input").fill(words); await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2200); };
  // the new rows of the form, in the form's own chips
  const newForm = (p, words) => p.evaluate(({ words, mark }) => {
    const pa = document.querySelector(".pa"), chips = pa.querySelector(".pa-chips"), noteL = pa.querySelector(".pa-note");
    const chip = (t, on) => `<div role="radio" aria-checked="${on}" class="pa-chip${on ? " on" : ""}">${on ? '<span aria-hidden="true">✓</span>' : ""}${t}</div>`;
    const row = (id, label, list) => `<div id="${id}" style="${mark};margin:10px 0;padding:4px 0"><small style="display:block;font-weight:700;color:var(--ink);margin-bottom:6px">${label}</small><div class="pa-chips" role="radiogroup">${list.map(([t, on]) => chip(t, on)).join("")}</div></div>`;
    noteL.insertAdjacentHTML("beforebegin", row("howmuch", "It looks like a pot. How much of it is yours?", [["The whole pot", true], ["My portion", false]]) + row("course", "Which dish of your dinner is it?", [["Starter", true], ["Main dish", false], ["Side", false], ["Dessert", false]]));
    noteL.querySelector("span").textContent = "Tell Chef Mealan what is in it, if you like";
    const inp = noteL.querySelector("input"); const ta = document.createElement("textarea"); ta.className = inp.className; ta.rows = 3; ta.value = words; ta.textContent = words; ta.placeholder = "Type what it is, or the foods in it"; ta.style.cssText = "width:100%;box-sizing:border-box;font:inherit;padding:10px 12px;line-height:1.4"; inp.replaceWith(ta);
    noteL.style.cssText += ";display:block;" + mark;
  }, { words, mark });
  try {
    // NOW 1: the form after a photo from Your photos
    let p = await open(ONE); await toForm(p);
    await p.evaluate((m) => { document.querySelector(".pa").style.cssText += ";" + m; }, mark);
    await note(p, "1. Now: Plate, Photo of my meal, a photo of the pot from Your photos. The form asks whose plate and when, and what it is.", ".pa");
    await shot(p, "b144a", "#nt", 100);
    // NOW 2: the read: one food, 1,400 g, as dinner
    p = await open(ONE); await toForm(p); await readIt(p, "");
    await p.evaluate((m) => { const r = document.querySelector(".plate-card .rows") || document.querySelector(".swipe-fg"); r.style.cssText += ";" + m; r.id = "rows"; }, mark);
    await note(p, "2. Now: the read gives one food, the soup, 1,400 g, counted as your dinner. You open Wrong foods? Help Chef Mealan read it.", "#rows");
    await shot(p, "b144b", "#nt", 300);
    // NOW 3: help: the words, Read it again
    p = await open(ONE); await toForm(p); await readIt(p, "");
    await p.locator(".mp-again-link").click(); await p.waitForTimeout(300);
    await p.locator(".mp-help-note input").fill(WORDS);
    await p.evaluate((m) => { document.querySelector(".mp-help").style.cssText += ";" + m; }, mark);
    await note(p, "3. Now: you type what is in the pot, and tap Read it again with this.", ".mp-help");
    await shot(p, "b144c", "#nt", 140);
    // NOW 4: still one food; the words are folded away
    p = await open(ONE); await toForm(p); await readIt(p, "");
    await p.locator(".mp-again-link").click(); await p.waitForTimeout(300); await p.locator(".mp-help-note input").fill(WORDS);
    await p.locator(".mp-help .pill-primary").click(); await p.waitForTimeout(2200);
    await p.evaluate((m) => { const r = document.querySelector(".plate-card .rows") || document.querySelector(".swipe-fg"); r.style.cssText += ";" + m; r.id = "rows"; const l = document.querySelector(".mp-again-link"); if (l) l.style.cssText += ";" + m; }, mark);
    await note(p, "4. Now: still one food, 1,400 g. No list from your words, and your words are folded away behind the link.", "#rows");
    await shot(p, "b144d", "#nt", 300);
    // NEW 1: the same form, with choices that adapt
    p = await open(MANY); await toForm(p); await newForm(p, WORDS);
    await note(p, "1. New: the same form. Two more rows when they apply: how much of it is yours (a pot, a tray), and which dish of the meal it is, with Chef Mealan's guess ticked. Your words in a box with room for a list.", ".pa");
    await shot(p, "b144e", "#howmuch", 330);
    // NEW 2: the read gives the dish in its foods; the words stay in view
    p = await open(MANY); await toForm(p); await readIt(p, WORDS);
    await p.evaluate(({ m, WORDS }) => { const r = document.querySelector(".plate-card .rows") || document.querySelector(".swipe-fg").parentElement; r.style.cssText += ";" + m; r.id = "rows";
      r.insertAdjacentHTML("afterend", `<small id="cookline" class="muted" style="display:block;margin:10px 0 0;${m}">For cooking, not counted: chicken bouillon, parsley, pepper, chives.</small>`); }, { m: mark, WORDS });
    await note(p, "2. New: the read gives the soup in its foods, from your words, each with an amount you can correct (~). The cooking foods are named and not counted.", "#rows");
    await shot(p, "b144f", "#nt", 100);
    // NEW 3: under the photo: your words, and what the plate is
    p = await open(MANY); await toForm(p); await readIt(p, WORDS);
    await p.evaluate(({ m, WORDS }) => { const l = document.querySelector(".mp-again-link"); l.insertAdjacentHTML("beforebegin", `<div id="said" style="${m};margin:8px 0;padding:8px 10px;background:var(--surface);border:1.5px solid var(--line);border-radius:12px"><small style="display:block;font-weight:700;color:var(--ink)">The whole pot · Starter of your dinner</small><small class="muted" style="display:block;margin-top:4px">You said: ${WORDS}</small></div>`); }, { m: mark, WORDS });
    await note(p, "3. New: under the photo, what you chose and what you said stay in view. Wrong foods? Help Chef Mealan read it opens the same form again.", "#said");
    await shot(p, "b144g", "#nt", 330);
  } finally { await b.close(); server.kill(); }
})();
