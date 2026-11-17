// Board B147, fourth drawing (Coach Milan 16 November 20:01 and 20:33: the bug fix alone, in the layout of 0.3.152).
// Board B147, third drawing (Coach Milan 16 November 19:14 to 19:20: the header does the whole job; the photo on top; one card, no boxes inside).
// Board B147, the two ways to ask what an older photo is for (Coach Milan 16 November 18:52 to 19:01).
// Board B147 (Coach Milan 16 November 17:39: the meal line bug is its own card, B147; every step connected to the next).
// The one board after the test of 0.3.151 (Coach Milan 16 November 17:04: point by point, resolved onto one separate board). Part 1: B146.
// Board DT307 and B146 (Coach Milan 16 November 15:49 to 16:03, after his test of 0.3.151): the photo screen shows the name of the plate
// that was there (B146); a way back; the pot question as agreed on 15 November 22:11.
// Board DT305, fifth drawing (Coach Milan 16 November 09:43 and 09:52: Find ideas with the hat; the tap from a to b visible; Ate it is ticked, not a filled button; the amount as a field with chips; no crowd of buttons).
// Board DT305 (Coach Milan 16 November 08:26: park DT303, finish one flow properly; 08:32 Draw): you photograph the meal in front of you and log it.
// Board DT303, fourth drawing (Coach Milan 16 November 07:39 to 07:51: no drop-downs; keep the meal line that exists, the photo fills it in; three screens, four scenarios).
// Boards DT303 and B145 (Coach Milan 15 November 20:57 to 21:04: the flow from a photo to the plate is overwhelming; reconstruct it).
// DT303: one step on the screen at a time: the form alone, the read alone, Chef Mealan's question alone, then the plate; every
// action a button. B145: no dish row for a snack; the cooking line carries only foods the person named.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const ROOT = process.env.ROOT || "/home/claude/platemate-scanner", PORT = "3542", U = `http://127.0.0.1:${PORT}`, O = "/home/claude/scratch";
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const WORDS = "mushrooms, carrots, onion, garlic, white carrot, sour cream, chicken bouillon, parsley, pepper, vlašac";
const f = (name, grams, calories, protein, fats, carbs, fiber) => ({ name, grams, low: Math.round(grams * 0.7), high: Math.round(grams * 1.3), calories, protein, fats, carbs, fiber, confidence: "medium" });
const MANY = (portion) => ({ dish: "Creamy mushroom vegetable soup", foods: [f("Mushrooms", 400, 22, 3.1, 0.3, 3.3, 1), f("Carrots", 200, 41, 0.9, 0.2, 9.6, 2.8), f("Onion", 120, 40, 1.1, 0.1, 9.3, 1.7), f("Parsnip", 120, 75, 1.2, 0.3, 18, 4.9), f("Garlic", 10, 149, 6.4, 0.5, 33, 2.1), f("Sour cream, 20 %", 200, 193, 2.4, 20, 2.9, 0)].map((x) => portion ? { ...x, grams: Math.round(x.grams / 4), low: Math.round(x.low / 4), high: Math.round(x.high / 4) } : x), unsure: null, which: null, course: "starter", vessel: "pot", serves: 4, cooking: ["chicken bouillon", "parsley", "pepper", "chives"] });
const G = { img: "/home/claude/boards/soup.jpg", read: null };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const sent = [];
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin", permissions: ["camera"] }); const p = await ctx.newPage(); p.on("pageerror", (e) => console.log("ERR", e.message));
    await p.clock.install({ time: new Date("2026-11-15T18:00:00+01:00") });
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/plate-look", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ vessel: "pot", course: "starter" }) }));
    await p.route("**/api/plate-photo", (r) => { const q = r.request().postDataJSON(); sent.push({ share: q.share, course: q.course, note: q.note }); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(G.read || MANY(q.share === "portion")) }); });
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", betterAs: "meal", holds: "" }) }));
    await p.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1400);
    if (!G.nophoto) { await p.locator(".mp-button").click(); await p.waitForTimeout(1500); await p.locator(".camera-ui input[type=file]").setInputFiles(G.img); await p.waitForTimeout(1500); }
    return p;
  };
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
  const note = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement("beforebegin", d); d.id = "nt"; }, { t, NOTE, sel });
  const shot = async (p, name, sel, off = 110) => { await p.evaluate(() => document.querySelectorAll(".chat-fab,.toast").forEach((x) => (x.style.visibility = "hidden"))); await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off }); if (off === "full") await p.evaluate(() => { [...document.querySelectorAll("body *")].forEach((e) => { if (getComputedStyle(e).position === "fixed") e.style.display = "none"; }); document.querySelector("main").style.paddingBottom = "24px"; }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png`, fullPage: off === "full" }); console.log("shot", name); await p.context().close(); };
  // keep only these on the screen: the direct children of main and of the plate card that match
  const only = (p, mainKeep, cardKeep) => p.evaluate(({ mainKeep, cardKeep }) => { const m = document.querySelector("main"); [...m.children].forEach((e) => { if (!mainKeep.some((s) => e.matches(s))) e.style.display = "none"; }); const c = document.querySelector(".plate-card"); if (c) { [...c.children].forEach((e) => { if (!cardKeep.some((s) => e.matches(s))) e.style.display = "none"; }); } }, { mainKeep, cardKeep });
  const full = async (p, name) => { await p.evaluate(() => document.querySelectorAll(".chat-fab,.toast").forEach((x) => (x.style.visibility = "hidden"))); await p.screenshot({ path: `${O}/${name}.png`, fullPage: true }); };
  try {
    const TAP = "outline:4px solid #f0a81c;outline-offset:2px", RED = "outline:3px solid #c0392b;outline-offset:3px;border-radius:10px";
    const OLD = "/tmp/pan-yesterday.jpg"; fs.copyFileSync("/home/claude/boards/pan.jpg", OLD); const d0 = new Date("2026-11-14T15:57:00+01:00"); fs.utimesSync(OLD, d0, d0);
    const food = { ...seed.foods[0], id: "soup", name: "Cream of mushroom soup", brand: "estimate", source: "estimate", calories: 78, protein: 1.8, fats: 5, carbs: 6, fiber: 1, photo: undefined, photos: undefined };
    const withOld = () => { seed.items = [{ id: "a", grams: 350, locked: false, est: { low: 250, high: 450 }, food }]; seed.title = "Cream of mushroom soup"; seed.plateAt = "2026-11-15T17:40:00+01:00"; seed.plateAsked = new Date("2026-11-15T17:40:00+01:00").toISOString(); };
    const noOld = () => { seed.items = []; seed.title = ""; delete seed.plateAt; delete seed.plateAsked; };
    const plateLook = async (p) => { await p.unroute("**/api/plate-look"); await p.route("**/api/plate-look", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ vessel: "plate", course: "main" }) })); };
    const pick = async (p) => { await plateLook(p); await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.locator(".camera-ui input[type=file]").setInputFiles(OLD); await p.waitForTimeout(1800); };
    const setTitle = (p, v) => p.evaluate((v) => { const i = document.querySelector(".step-head input.title-input"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, v); }, v);
    G.nophoto = true; noOld();
    const EVE = "/tmp/pan-evening.jpg"; fs.copyFileSync("/home/claude/boards/pan.jpg", EVE); const d1 = new Date("2026-11-14T19:40:00+01:00"); fs.utimesSync(EVE, d1, d1);
    const pickE = async (p) => { await plateLook(p); await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.locator(".camera-ui input[type=file]").setInputFiles(EVE); await p.waitForTimeout(1800); };
    const Q = (on, tap, m, q) => `<div id="askfor" class="pa-row rv-q" style="margin:0 12px 12px;${m || ""}"><small class="pa-row-q">${q}</small><div class="pa-chips" style="flex-wrap:wrap">${["I ate it then", "I will eat it", "Just looking"].map((t, k) => `<button type="button" class="pa-opt${k === on ? " on" : ""}" style="flex:none;padding:0 14px;${k === tap ? TAP : ""}">${t}</button>`).join("")}</div></div>`;
    const setLine = (p, text, m) => p.evaluate(({ m, text }) => { const pl = document.querySelector(".plan-line"); pl.querySelector("span").textContent = text; if (m) pl.style.cssText += ";" + m; }, { m, text });
    const tapRead = (p) => p.evaluate((TAP) => { document.querySelector(".pa-go .pill").style.cssText += ";" + TAP; }, TAP);
    const hdr = (p, o) => p.evaluate(({ o, mark, TAP }) => {
      const pl = document.querySelector(".plan-line"); pl.querySelector("span").textContent = o.line; pl.style.cssText += ";" + mark;
      if (!o.open) return;
      const from = document.createElement("p"); from.className = "small"; from.style.cssText = "margin:8px 12px;font-weight:700;color:#172742;" + mark; from.textContent = "From the photo: yesterday, 15:57. Is that right?"; pl.insertAdjacentElement("afterend", from);
      const set = (rowSel, name) => { const r = document.querySelector(rowSel); [...r.querySelectorAll(".choice")].forEach((b) => b.classList.toggle("on", b.textContent.trim() === name)); r.style.cssText += ";" + mark; };
      set(".which-day", o.day); set(".for-row", o.meal); document.querySelector(".for-hint").textContent = o.hint;
      { const kids = [...document.querySelector("main").children]; const a0 = kids.findIndex((x) => x.matches(".for-say")), a1 = kids.findIndex((x) => x.matches(".moment-hint")); kids.slice(a0, a1 + 1).forEach((x) => (x.style.display = "none")); const ph = document.createElement("p"); ph.style.cssText = "margin:10px 12px;padding:8px 10px;border:1.5px dashed #b8c4dc;border-radius:10px;color:#5b6b85;font-size:13px"; ph.textContent = "No change, left out of this drawing: the explanation of Just looking and A meal, What is it?, What kind of moment?"; kids[a0].insertAdjacentElement("beforebegin", ph); }
      const tap = [...document.querySelectorAll("main button")].find((b) => b.textContent.trim() === o.tap); if (tap) tap.style.cssText += ";" + TAP;
    }, { o, mark, TAP });
    const fr = async (name, o, text) => { const p = await open(); await pick(p); if (o.open) { await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); } await hdr(p, o); if (o.tapRead) await p.evaluate((TAP) => { document.querySelector(".pa-go .pill").style.cssText += ";" + TAP; }, TAP); await note(p, text, ".plan-line"); await shot(p, name, null, "full"); };
    const L = "Lunch, yesterday at 15:57, later than planned · Off the plan · Regular meal · A mix", S = "Snack, yesterday at 15:57 · Off the plan · Regular meal · A mix", T = "Dinner, 20:00 by the clock · Off the plan · Regular meal · A mix", J = "Just looking · A mix";
    const HL = "Lunch, later than planned: 15:57 is after lunch's time, and lunch is not eaten on that day.", HS = "Snack: 15:57 is between meals, and lunch is already eaten on that day.", HT = "Dinner, by the clock: today's next meal.", HJ = "Just looking: nothing is counted.";
    await fr("q1c", { open: true, line: L, day: "Yesterday", meal: "Lunch", hint: HL, tap: "Done" }, "New: the line is built from the photo's day and time, not from today's clock. For an older photo the header opens by itself, with that guess ticked: Yesterday, Lunch. Right as it is: tap Done.");
    await fr("q1d", { line: L, tapRead: true }, "The header is closed and says what the read will be logged as.");
    await fr("q2c", { open: true, line: S, day: "Yesterday", meal: "Snack", hint: HS, tap: "Done" }, "New: yesterday's lunch is already eaten, so the guess is Snack. Right as it is: tap Done.");
    await fr("q2d", { line: S, tapRead: true }, "The header is closed and says what the read will be logged as.");
    await fr("q3c", { open: true, line: L, day: "Yesterday", meal: "Lunch", hint: HL, tap: "Today" }, "The same open header. This photo is an inspiration for today, so the guess is not right: tap Today.");
    await fr("q3d", { open: true, line: T, day: "Today", meal: "Dinner", hint: HT, tap: "Done" }, "Today is ticked and the meal follows today's clock. Tomorrow or Another day works the same way. Tap Done.");
    await fr("q3e", { line: T, tapRead: true }, "Closed: a dinner for today.");
    await fr("q4c", { open: true, line: L, day: "Yesterday", meal: "Lunch", hint: HL, tap: "Just looking" }, "The same open header. Not to eat, only to look at or to talk over: tap Just looking.");
    await fr("q4d", { open: true, line: J, day: "", meal: "Just looking", hint: HJ, tap: "Done" }, "Just looking is ticked. Nothing will be counted. Tap Done.");
    await fr("q4e", { line: J, tapRead: true }, "Closed: Just looking.");
  } finally { await b.close(); server.kill(); }
})();
