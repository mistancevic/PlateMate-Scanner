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
    await p.route("**/api/plate-photo", (r) => { const q = r.request().postDataJSON(); sent.push({ share: q.share, course: q.course, note: q.note }); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MANY(q.share === "portion")) }); });
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", betterAs: "meal", holds: "" }) }));
    await p.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1400);
    await p.locator(".mp-button").click(); await p.waitForTimeout(1500); await p.locator(".camera-ui input[type=file]").setInputFiles("/home/claude/boards/soup.jpg"); await p.waitForTimeout(1500);
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
    const WHICH = { name: "Creamy vegetable soup", question: "Is this cream of vegetable soup, a rich cheese-leek soup, or cream of potato soup?", options: [{ name: "Creamy vegetable soup", calories: 78, protein: 1.8, fats: 5, carbs: 6, fiber: 1 }, { name: "Cheese and leek soup", calories: 110, protein: 4, fats: 8, carbs: 5, fiber: 0.5 }, { name: "Cream of potato soup", calories: 85, protein: 1.7, fats: 4, carbs: 10, fiber: 1 }] };
    const ONE = { dish: "Creamy vegetable soup", foods: [f("Creamy vegetable soup", 350, 78, 1.8, 5, 6, 1)], unsure: null, which: WHICH, course: "starter", vessel: "pot", serves: 4 };
    // ---------- DT303, new ----------
    // 1. the form alone
    let p = await open(); await p.locator(".pa-share .pa-opt").nth(1).click(); await p.locator(".pa-note textarea").fill(WORDS);
    await only(p, [".plate-card"], [".pa"]);
    await p.evaluate((m) => { const go = document.querySelector(".pa-go"); const read = go.querySelector(".pill-primary"), drop = go.querySelector(".pill-danger-line"); go.style.cssText += ";display:flex;justify-content:space-between;align-items:center;" + m; go.insertBefore(drop, read); [read, drop].forEach((b) => (b.style.cssText += ";height:44px;min-height:44px;padding:0 18px")); }, mark);
    await note(p, "1. New: the photo is picked, and Chef Mealan's form shows alone. Nothing else is on the screen. Drop the photo on the left, Read the plate, the main button, on the right.", ".plate-card");
    await shot(p, "d303a", null, "full");
    // 2. the read alone
    p = await open(); await p.locator(".pa-share .pa-opt").nth(1).click(); await p.locator(".pa-note textarea").fill(WORDS);
    await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500);
    await only(p, [".step-head", ".plate-card"], [".mp-big", ".mp-said", ".pt-cook"]);
    await p.evaluate((m) => { const h = document.querySelector(".step-head"); const sub = [...h.querySelectorAll("p, small, span")].find((x) => /Read from your photo/.test(x.textContent)); if (sub) sub.textContent = "Read from your photo. Check the foods; tap an amount to correct it.";
      const c = document.querySelector(".plate-card"); c.querySelectorAll(".mp-big-row .pill, .mp-big-row button, .mp-big-row label").forEach((x) => (x.style.display = "none"));
      c.insertAdjacentHTML("beforeend", `<div class="button-row" id="readgo" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin:14px 0 0;${m}"><button type="button" class="pill pill-small pill-action" style="height:44px;padding:0 18px">Read it again</button><button type="button" class="pill pill-small pill-primary" style="height:44px;padding:0 18px">Use these foods</button></div>`); }, mark);
    await note(p, "2. New: the read shows alone: the photo, the foods with their amounts, the cooking foods, what you chose and said. Read it again opens the form with your answers. Use these foods goes on.", ".plate-card");
    await shot(p, "d303b", null, "full");
    // 3. Chef Mealan's question alone, only when he has one
    p = await open(); await p.unroute("**/api/plate-photo"); await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ONE) }));
    await p.locator(".pa-share .pa-opt").nth(1).click(); await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500);
    await only(p, [".step-head", ".plate-card"], [".mp-which"]);
    await p.evaluate((m) => { const h = document.querySelector(".step-head"); const sub = [...h.querySelectorAll("p, small, span")].find((x) => /Read from your photo/.test(x.textContent)); if (sub) sub.style.display = "none"; const q = document.querySelector(".mp-which"); q.style.cssText += ";" + m; }, mark);
    await note(p, "3. New: only when Chef Mealan cannot tell something, his question shows alone, one at a time, with Skip. (Here: the read with no words.)", ".plate-card");
    await shot(p, "d303c", null);
    // 4. the plate: one Chef Mealan card; ways behind + Add a food; Empty plate a button
    p = await open(); await p.locator(".pa-share .pa-opt").nth(1).click(); await p.locator(".pa-note textarea").fill(WORDS);
    await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500);
    await p.evaluate((m) => { const c = document.querySelector(".plate-card");
      c.querySelectorAll(":scope > .mp-big, :scope > .mp-again-link, :scope > .ways, :scope > .gate-card, :scope > .ms-ask, :scope > .chef-tip").forEach((x) => (x.style.display = "none"));
      const e = [...c.querySelectorAll(".card-top button, .card-top .link")].find((x) => /Empty plate/.test(x.textContent)); if (e) { e.className = "pill pill-small pill-danger-line"; e.style.cssText += ";height:44px;padding:0 14px;" + m; }
      const say = c.querySelector(".mp-say"); if (say) { say.insertAdjacentHTML("afterbegin", '<small style="display:block;color:var(--top);font-weight:700;margin-bottom:6px">✓ Nutrition · ✓ Your day</small>'); say.style.cssText += ";" + m; say.id = "onecard"; }
      [...document.querySelector("main").children].forEach((x) => { if (!x.matches(".step-head, .plan-line, .plate-card")) x.style.display = "none"; }); const fit = [...c.querySelectorAll("button")].find((x) => /Fit to my target/.test(x.textContent)); if (fit) { fit.classList.remove("pill-primary"); fit.classList.add("pill-action"); } const add = c.querySelector(".add-here-open"); if (add) { add.style.cssText += ";" + m; add.id = "addbtn"; } }, mark);
    await note(p, "4. New: the plate. Empty plate is a button. The four ways to add sit behind + Add a food. Quick picks open with it too. Chef Mealan speaks once: one card with his checks, his line and the buttons. One filled button: Fit to my target gets the blue border.", "#addbtn");
    await shot(p, "d303d", null, "full");
    // 5. Did you eat it?: only for a plate left open, never right after a read
    { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const q = await ctx.newPage();
      const food = { ...seed.foods[0], id: "soup", name: "Creamy vegetable soup", brand: "estimate", source: "estimate", calories: 78, protein: 1.8, fats: 5, carbs: 6, fiber: 1, photo: undefined, photos: undefined };
      const img = "data:image/jpeg;base64," + fs.readFileSync("/home/claude/boards/soup.jpg").toString("base64");
      const s2 = { ...seed, title: "Creamy vegetable soup", items: [{ id: "a", grams: 350, locked: false, est: { low: 250, high: 450 }, food }], photo: { image: img, at: "2026-11-15T15:57:00+01:00", who: "ate" } };
      await q.clock.install({ time: new Date("2026-11-15T20:52:00+01:00") });
      await q.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
        localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
        localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, s2);
      await require(ROOT + "/tests/flows/adult.cjs")(q);
      await q.goto(U + "/plate"); await q.waitForTimeout(1500);
      const has = await q.evaluate((m) => { const k = [...document.querySelectorAll("main button, main a")].find((x) => /Keep working on it/.test(x.textContent)); if (!k) return false; k.className = "pill pill-small pill-action"; k.style.cssText += ";height:44px;padding:0 18px;" + m; k.id = "keepbtn"; return true; }, mark);
      console.log("old plate ask:", has);
      if (has) { await note(q, "Another time: Did you eat it? shows only when you come back to a plate you saved for later. Keep working on it is a button.", "#keepbtn"); await shot(q, "d303e", null); } else { await q.screenshot({ path: R + "/d303e.png" }); await ctx.close(); } }
    // ---------- B145, new ----------
    { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin", permissions: ["camera"] }); await ctx.close(); }
    p = await open(); await p.evaluate((m) => { const d = document.querySelector(".pa-dish"); if (d) d.remove(); const w = document.createTreeWalker(document.querySelector(".pa"), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) n.nodeValue = n.nodeValue.replace("19:13", "15:57"); const sm = [...document.querySelectorAll(".pa > small")][0]; if (sm) sm.textContent = "Logged at 15:57, as snack. Tap the time to change it."; const t = document.querySelector(".pa-time-text"); if (t) t.textContent = "15:57"; const sh = document.querySelector(".pa-share"); sh.style.cssText += ";" + m; }, mark);
    await note(p, "1. New: a snack has no dishes, so the form does not ask which dish it is. The row shows for breakfast, lunch and dinner only.", ".pa-share");
    await shot(p, "b145a", ".pa", 110);
    p = await open(); await p.unroute("**/api/plate-photo"); await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...ONE, which: null }) }));
    await p.locator(".pa-share .pa-opt").nth(1).click(); await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500);
    await p.evaluate((m) => { const a = document.querySelector(".add-here-open"); a.style.cssText += ";" + m; a.id = "addbtn"; }, mark);
    await note(p, "2. New: no words from you, so no For cooking line. The line carries only cooking foods you named, never a method (simmered, pureed).", "#addbtn");
    await shot(p, "b145b", "#nt", 330);
  } finally { await b.close(); server.kill(); }
})();
