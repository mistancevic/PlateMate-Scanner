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
    const QT = "This photo is from yesterday, 19:40. What is it for?";
    const TODAY = "Dinner, 20:00 by the clock · Off the plan · Regular meal · A mix";
    // way 1: the question stands in the header, in the place of the meal line
    { const p = await open(); await pickE(p); await p.evaluate((h) => { const pl = document.querySelector(".plan-line"); pl.insertAdjacentHTML("afterend", h); pl.style.display = "none"; document.getElementById("askfor").style.margin = "8px 12px 12px"; const b = document.querySelector(".pa-go .pill"); b.style.opacity = ".45"; }, Q(-1, 1, mark, QT)); await note(p, "Way 1: the question stands in the header, in the place of the meal line. Nothing is ticked: the app does not guess. Read the plate waits for your answer.", "#askfor"); await shot(p, "x1c", null, "full"); }
    { const p = await open(); await pickE(p); await setLine(p, TODAY, mark); await tapRead(p); await note(p, "Your answer becomes the meal line. I will eat it: today's next meal. The pencil changes the day, the meal and the answer.", ".plate-card"); await shot(p, "x1d", null, "full"); }
    // way 2: the line shows the guess; the question confirms it, beside the photo
    { const p = await open(); await pickE(p); await p.evaluate((h) => { document.querySelector(".pa-screen .chef-line").insertAdjacentHTML("afterend", h); const q = document.getElementById("askfor"); q.style.margin = "10px 0"; }, Q(0, 1, mark, "Did you eat it then?")); await p.evaluate((m) => { document.querySelector(".plan-line").style.cssText += ";" + m; }, mark); await note(p, "Way 2: the meal line says what the photo's time tells: yesterday's dinner. Under the photo the app asks if that is right, with its guess ticked. You can read at once.", ".plate-card"); await shot(p, "x2c", null, "full"); }
    { const p = await open(); await pickE(p); await p.evaluate((h) => { document.querySelector(".pa-screen .chef-line").insertAdjacentHTML("afterend", h); document.getElementById("askfor").style.margin = "10px 0"; }, Q(1, -1, mark, "Did you eat it then?")); await setLine(p, TODAY, mark); await tapRead(p); await note(p, "You tapped I will eat it: the tick moves and the meal line follows, to today's next meal.", ".plate-card"); await shot(p, "x2d", null, "full"); }
    { const p = await open(); await pickE(p); await p.evaluate((h) => { document.querySelector(".pa-screen .chef-line").insertAdjacentHTML("afterend", h); document.getElementById("askfor").style.margin = "10px 0"; }, Q(0, 2, mark, "Did you eat it then?")); await p.evaluate((m) => { document.querySelector(".plan-line").style.cssText += ";" + m; }, mark); await note(p, "The same screen as B147.Bc. This time you tap Just looking.", ".plate-card"); await shot(p, "x2c2", null, "full"); }
    { const p = await open(); await pickE(p); await p.evaluate((h) => { document.querySelector(".pa-screen .chef-line").insertAdjacentHTML("afterend", h); document.getElementById("askfor").style.margin = "10px 0"; }, Q(2, -1, mark, "Did you eat it then?")); await setLine(p, "Just looking · A mix", mark); await tapRead(p); await note(p, "Or Just looking: nothing is counted. For inspiration, or to talk it over, coach and client.", ".plate-card"); await shot(p, "x2e", null, "full"); }
  } finally { await b.close(); server.kill(); }
})();
