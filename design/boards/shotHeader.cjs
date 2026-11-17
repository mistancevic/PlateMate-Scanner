// Board DT308, the header alone (Coach Milan 16 November 23:30 to 23:34: the header of the Plate is the heart of the system; six rules; draw it alone first).
// Board DT308, merged with B147 (Coach Milan 16 November 20:44: both topics in DT308).
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
    const NOW = "/tmp/pan-now.jpg"; fs.copyFileSync("/home/claude/boards/pan.jpg", NOW);
    const pickF = async (p, file) => { await plateLook(p); await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.locator(".camera-ui input[type=file]").setInputFiles(file); await p.waitForTimeout(1800); };
    // the new layout: one card; the photo on top, edge to edge; Chef Mealan's line plain; the title; the header; the field; the button
    const lay = (p, o) => p.evaluate(({ o, mark, TAP }) => {
      const main = document.querySelector("main"), card = document.querySelector(".plate-card"), pa = card.querySelector(".pa-screen");
      const img = card.querySelector(".chef-line-img"), top = card.querySelector(".pa-top"), txt = top.querySelector("p"), rm = top.querySelector(".pa-remove"), hat = top.querySelector(".bubble-tag");
      card.style.cssText += ";padding:0;overflow:hidden"; pa.style.cssText += ";padding:0;margin:0;border:0;background:none";
      img.style.cssText = "display:block;width:100%;height:250px;object-fit:cover;border-radius:0;margin:0";
      const rowE = document.createElement("div"); rowE.style.cssText = "display:flex;align-items:center;gap:10px;padding:10px 14px 4px";
      txt.style.cssText = "margin:0;flex:1;font-size:14px;line-height:1.4"; rm.style.cssText += ";flex:none;height:44px;min-height:44px;white-space:nowrap";
      const h = document.createElement("span"); h.innerHTML = hat.querySelector("svg").outerHTML; h.style.cssText = "flex:none;color:#2a72d9;display:flex"; rowE.append(h, txt, rm);
      const head = document.createElement("div"); head.style.cssText = "padding:0"; head.id = "hd";
      const sh = document.querySelector(".step-head"); head.append(sh);
      let e = document.querySelector(".plan-line"); const moved = []; while (e && e !== card) { moved.push(e); e = e.nextElementSibling; } moved.forEach((x) => head.append(x));
      const pl = head.querySelector(".plan-line");
      const rest = document.createElement("div"); rest.style.cssText = "padding:0 14px 14px"; [...pa.children].forEach((c) => { if (c !== top) rest.append(c); }); top.remove();
      pa.append(img, rowE, rest); card.insertAdjacentElement("beforebegin", head); rowE.style.paddingBottom = "10px";
      if (o.line) pl.querySelector("span").textContent = o.line; if (o.txt) txt.textContent = o.txt;
      if (o.open) {
        const kids = [...head.children]; const cut = kids.findIndex((x) => x.matches(".for-say")); kids.slice(cut).forEach((x) => (x.style.display = "none"));
        head.querySelector(".which-day-hint").style.display = "none";
        const from = document.createElement("p"); from.className = "small"; from.style.cssText = "margin:2px 0 8px;font-weight:700;color:#172742"; from.textContent = "From the photo: yesterday, 15:57. Is that right?"; pl.insertAdjacentElement("afterend", from);
        const set = (rowSel, name) => [...head.querySelectorAll(rowSel + " .choice")].forEach((b) => b.classList.toggle("on", b.textContent.trim() === name));
        set(".which-day", o.day); set(".for-row", o.meal);
        head.querySelector(".for-hint").textContent = o.hint;
        head.querySelectorAll("p.label, p.small, .moments").forEach((x) => { x.style.marginLeft = "12px"; x.style.marginRight = "12px"; });
        const tap = o.tap && [...head.querySelectorAll("button")].find((b) => b.textContent.trim() === o.tap); if (tap) tap.style.cssText += ";" + TAP;
        const dn = pl.querySelector(".plan-line-done"); const end = document.createElement("div"); end.style.cssText = "display:flex;justify-content:flex-end;margin:10px 12px 12px"; dn.style.cssText += ";height:44px;min-height:44px;padding:0 22px"; end.append(dn); head.append(end);
        const box = document.createElement("div"); box.id = "hbox"; box.style.cssText = mark + ";padding:2px 0;margin:0 0 12px"; pl.insertAdjacentElement("beforebegin", box); let n = pl; const grp = []; while (n) { grp.push(n); n = n.nextElementSibling; } grp.forEach((x) => box.append(x));
      } else if (o.markLine) pl.style.cssText += ";" + mark;
      if (o.tapRead) rest.querySelector(".pa-go .pill").style.cssText += ";" + TAP;
      if (o.markPhoto) img.style.cssText += ";outline:3px solid #2a72d9;outline-offset:-3px";
    }, { o, mark, TAP });
    const noteIn = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.style.cssText = NOTE + ";margin:10px 0"; d.textContent = t; document.querySelector(sel).insertAdjacentElement("beforebegin", d); }, { t, NOTE, sel });
    const older = async (name, o, text, where) => { const p = await open(); await pick(p); if (o.open) { await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); } await lay(p, o); await noteIn(p, text, o.open ? "#hbox" : ".plan-line"); await shot(p, name, null, "full"); };
    const HX = (o) => { const btn = (x) => `<button type="button" style="flex:${x.flex || 1};min-width:0;text-align:left;min-height:52px;padding:6px 12px;border-radius:14px;border:1.5px solid ${x.open ? "#2a72d9" : "#c9d6ee"};background:${x.open ? "#e3edff" : "#fff"};font:inherit;cursor:pointer;${x.tap ? TAP : ""}"><small style="display:block;font-size:12px;font-weight:700;color:#5b6b85">${x.label}</small><b style="display:block;font-size:15px;color:#1f4fa3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x.value}</b></button>`;
      const chips = o.chips ? `<div class="moments" style="margin:8px 0 0">${o.chips.items.map((t) => `<button type="button" class="choice${t === o.chips.on ? " on" : ""}" style="${t === o.chips.tap ? TAP : ""}">${t}</button>`).join("")}</div>` : "";
      return `<div id="hx" style="margin:0 12px 12px;padding:8px;${mark}"><div style="display:flex;gap:8px;flex-wrap:wrap">${o.parts.map(btn).join("")}</div>${chips}<p style="margin:8px 4px 2px;font-size:14px;line-height:1.4;color:#172742"><b>${o.does}</b>${o.guess ? ` <span style="color:#5b6b85">${o.guess}</span>` : ""}</p></div>`; };
    const put = (p, o) => p.evaluate((h) => { const pl = document.querySelector(".plan-line"); pl.insertAdjacentHTML("afterend", h); pl.style.display = "none"; }, HX(o));
    const top = (p) => p.evaluate(() => { const m = document.querySelector("main"); let cut = false; [...m.children].forEach((e) => { if (cut) e.style.display = "none"; if (e.matches(".crave-card")) cut = true; }); });
    const plateF = async (name, o, text, title) => { const p = await open(); await top(p); if (title) await p.evaluate((t) => { const sh = document.querySelector(".step-head"); sh.querySelector("h2").textContent = t; const q = sh.querySelector("p"); if (q) q.remove(); }, title); await put(p, o); await noteIn(p, text, "#hx"); await shot(p, name, null, "full"); };
    const photoF = async (name, o, text) => { const p = await open(); await pick(p); await lay(p, {}); await put(p, o); await noteIn(p, text, "#hx"); await shot(p, name, null, "full"); };
    const M = (v, x) => ({ label: "Meal", value: v, ...(x || {}) }), D = (v, x) => ({ label: "Day", value: v, ...(x || {}) });
    const MEALS = ["Just looking", "Breakfast", "Lunch", "Dinner", "Snack"], DAYS = ["Yesterday", "Today", "Tomorrow", "Another day"];
    // the states
    await plateF("h_s1", { parts: [M("Dinner"), D("Today")], does: "Counts toward today.", guess: "Guessed from the time. Tap to change." }, "New. Two named parts, each a button: Meal and Day. Under them one line: what the app does with this plate. Here both are guessed from the clock, and the line says so.");
    await plateF("h_s2", { parts: [M("Dinner, from your plan"), D("Today")], does: "Counts as today's planned dinner." }, "A plate you start from your plan: the Meal part says so. Nothing is guessed, so no note.", "Chicken with rice");
    await photoF("h_s3", { parts: [M("Lunch"), D("Yesterday, 15:57")], does: "Will be logged for yesterday.", guess: "From the photo. Tap to change." }, "An older photo: the photo fills both parts, and the line says where they come from. This replaces the wrong Dinner, 20:00 by the clock.");
    await plateF("h_s4", { parts: [M("Lunch"), D("Tomorrow")], does: "Goes into your plan for tomorrow." }, "A coming day: the line says the plate goes into the plan.");
    await plateF("h_s5", { parts: [{ label: "This plate", value: "Just looking" }], does: "Nothing is counted." }, "Just looking: one part. No meal and no day are needed.");
    await plateF("h_s6", { parts: [M("Dinner"), D("Today"), { label: "Moment", value: "Before training", flex: "1 0 100%" }], does: "Counts toward today." }, "The moment shows only when it is not a regular meal. Off the plan and A mix are gone from the header: they are not yours to set.");
    // changing the meal: tap, pick, closed
    await plateF("h_m1", { parts: [M("Dinner", { tap: true }), D("Today")], does: "Counts toward today.", guess: "Guessed from the time. Tap to change." }, "It is a late lunch, not dinner. Tap Meal.");
    await plateF("h_m2", { parts: [M("Dinner", { open: true }), D("Today")], chips: { items: MEALS, on: "Dinner", tap: "Lunch" }, does: "Counts toward today.", guess: "Guessed from the time. Tap to change." }, "Only the meals open, right under the part you tapped. No pencil, no long page. Tap Lunch.");
    await plateF("h_m3", { parts: [M("Lunch"), D("Today")], does: "Counts toward today." }, "One tap sets it and closes the choices. No Done button. The note about the guess is gone: you chose.");
    // an older photo: changing the day
    await photoF("h_d1", { parts: [M("Lunch"), D("Yesterday, 15:57", { tap: true })], does: "Will be logged for yesterday.", guess: "From the photo. Tap to change." }, "The photo is from yesterday, but it is an inspiration for today. Tap Day.");
    await photoF("h_d2", { parts: [M("Lunch"), D("Yesterday, 15:57", { open: true })], chips: { items: DAYS, on: "Yesterday", tap: "Today" }, does: "Will be logged for yesterday.", guess: "From the photo. Tap to change." }, "Only the days open. Tap Today.");
    await photoF("h_d3", { parts: [M("Dinner"), D("Today")], does: "Counts toward today.", guess: "Meal guessed from the time. Tap to change." }, "Set and closed. The meal follows today's clock, and the line says what the app will do now.");
  } finally { await b.close(); server.kill(); }
})();
