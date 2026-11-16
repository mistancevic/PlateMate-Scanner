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
    const PAN2 = { dish: "Pancakes with raspberries", foods: [f("Pancakes", 180, 227, 6.4, 9.7, 28, 1), f("Raspberries", 30, 52, 1.2, 0.7, 12, 6.5)], unsure: null, which: null, course: "dessert", vessel: "plate", serves: 1 };
    G.read = PAN2;
    const EVE = "/tmp/pan-evening.jpg"; fs.copyFileSync("/home/claude/boards/pan.jpg", EVE); const d1 = new Date("2026-11-14T19:40:00+01:00"); fs.utimesSync(EVE, d1, d1);
    const setLine = (p, text, m) => p.evaluate(({ m, text }) => { const pl = document.querySelector(".plan-line"); if (!pl) return; pl.querySelector("span").textContent = text; if (m) pl.style.cssText += ";" + m; }, { m, text });
    const tapRead = (p) => p.evaluate((TAP) => { document.querySelector(".pa-go .pill").style.cssText += ";" + TAP; }, TAP);
    // now
    { const p = await open(); await pick(p); await p.evaluate((RED) => { document.querySelector(".plan-line").style.cssText += ";" + RED; }, RED); await tapRead(p); await note(p, "Wrong: the photo is from yesterday, 15:57, between lunch and dinner. The line falls back to the clock and says Dinner, 20:00.", ".plate-card"); await shot(p, "w_c", null, "full"); }
    { const p = await open(); await pick(p); await p.locator(".pa-screen .pa-go .pill").click(); await p.waitForTimeout(2500); console.log("LINE", await p.locator(".plan-line").count(), (await p.locator(".plan-line").first().innerText().catch(() => "")).replace(/\s+/g, " ")); await p.evaluate((RED) => { const pl = document.querySelector(".plan-line"); if (pl) pl.style.cssText += ";" + RED; }, RED); await note(p, "Wrong: the read carries the same wrong line: Dinner, 20:00 by the clock.", ".plate-card"); await shot(p, "w_d", null, "full"); }
    const tile = (p, meal) => p.evaluate((meal) => { const e = [...document.querySelectorAll("main *")].find((x) => !x.children.length && x.textContent.trim() === "Dinner" && !x.closest(".plan-line")); if (e) e.textContent = meal; else console.log("no tile"); }, meal);
    const two = async (k, meal, text, why, why2) => {
      { const p = await open(); await pick(p); await setLine(p, text, mark); await tapRead(p); await note(p, why, ".plate-card"); await shot(p, k + "c", null, "full"); }
      { const p = await open(); await pick(p); await p.locator(".pa-screen .pa-go .pill").click(); await p.waitForTimeout(2500); await setLine(p, text, mark); await tile(p, meal); await note(p, why2, ".plate-card"); await shot(p, k + "d", null, "full"); }
    };
    await two("w1", "Lunch", "Lunch, yesterday at 15:57, later than planned · Off the plan · Regular meal · A mix", "New: yesterday's lunch is not eaten yet, so a photo from 15:57 is that lunch, later than planned. The pencil changes it.", "New: the read carries the same line. Ate it logs it as yesterday's lunch at 15:57.");
    await two("w2", "Snack", "Snack, yesterday at 15:57 · Off the plan · Regular meal · A mix", "New: yesterday's lunch is already eaten, so a photo from 15:57 is a snack. The pencil changes it.", "New: the read carries the same line. Ate it logs it as a snack, yesterday at 15:57.");
    { const p = await open(); await plateLook(p); await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.locator(".camera-ui input[type=file]").setInputFiles(EVE); await p.waitForTimeout(1800); console.log("EVE", (await p.locator(".plan-line").first().innerText()).replace(/\s+/g, " ")); await tapRead(p); await note(p, "No change: 19:40 is inside dinner's time, so the line says dinner, as in 0.3.151.", ".plate-card"); await shot(p, "w3c", null, "full"); }
  } finally { await b.close(); server.kill(); }
})();
