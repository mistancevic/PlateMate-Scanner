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
    const BTN = "height:44px;min-height:44px;padding:0 16px", TAP = "outline:4px solid #f0a81c;outline-offset:2px";
    const OLD = "/tmp/soup-yesterday.jpg"; fs.copyFileSync("/home/claude/boards/soup.jpg", OLD); const d0 = new Date("2026-11-14T15:57:00+01:00"); fs.utimesSync(OLD, d0, d0);
    const food = { ...seed.foods[0], id: "soup", name: "Cream of mushroom soup", brand: "estimate", source: "estimate", calories: 78, protein: 1.8, fats: 5, carbs: 6, fiber: 1, photo: undefined, photos: undefined };
    const withOld = () => { seed.items = [{ id: "a", grams: 350, locked: false, est: { low: 250, high: 450 }, food }]; seed.title = "Cream of mushroom soup"; seed.plateAt = "2026-11-15T17:40:00+01:00"; seed.plateAsked = new Date("2026-11-15T17:40:00+01:00").toISOString(); };
    const pick = async (p) => { await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.locator(".camera-ui input[type=file]").setInputFiles(OLD); await p.waitForTimeout(1800); };
    // now: the plate that was there, the camera, the photo screen
    withOld(); G.nophoto = true;
    { const p = await open(); await p.evaluate((TAP) => { const t = document.querySelector(".mp-button"); if (t) t.style.cssText += ";" + TAP; }, TAP); await shot(p, "q_a", ".mp-button", 420); }
    { const p = await open(); await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.evaluate((TAP) => { const g = document.querySelector(".cam-gallery"); if (g) g.style.cssText += ";" + TAP; }, TAP); await p.screenshot({ path: R + "/q_b.png" }); await p.context().close(); console.log("shot q_b"); }
    { const p = await open(); await pick(p); console.log("TITLE", await p.locator(".step-head input.title-input").inputValue(), "|", await p.locator(".plan-line").innerText());
      await p.evaluate((m) => { document.querySelector(".step-head input.title-input").style.cssText += ";outline:3px solid #c0392b;outline-offset:3px;border-radius:10px"; const sh = document.querySelector(".pa-share"); if (sh) sh.style.cssText += ";outline:3px solid #c0392b;outline-offset:3px;border-radius:10px"; document.querySelector(".plan-line").style.cssText += ";outline:3px solid #c0392b;outline-offset:3px"; }, mark);
      await shot(p, "q_c", null, "full"); }
    // new: the same step, with the three changes
    { const p = await open(); await pick(p);
      await p.evaluate(({ m, BTN, TAP }) => { const sh = document.querySelector(".step-head"); const inp = sh.querySelector("input.title-input"); inp.value = ""; inp.setAttribute("value", ""); inp.style.cssText += ";" + m;
        sh.insertAdjacentHTML("afterbegin", `<button type="button" class="pill pill-small pill-action" style="${BTN};margin:0 0 10px;${m}">‹ Back to the camera</button>`);
        const pl = document.querySelector(".plan-line"); pl.querySelector("span").textContent = "Lunch, yesterday at 15:57, later than planned · Off the plan · Regular meal · A mix"; pl.style.cssText += ";" + m;
        const row = document.querySelector(".pa-share"); const lab = row.querySelector(".pa-row-q"); lab.textContent = "It looks like a pot. How much of it do you eat?";
        const opts = row.querySelectorAll(".pa-opt"); opts[0].classList.remove("on"); opts[0].textContent = "All of it"; opts[1].classList.add("on"); opts[1].innerHTML = '<span aria-hidden="true">✓</span>A part of it';
        row.insertAdjacentHTML("beforeend", `<div style="display:flex;align-items:center;gap:10px;margin-top:10px"><span style="display:inline-flex;align-items:center;justify-content:center;width:84px;height:44px;border:1.5px solid #c9d6ee;border-radius:12px;font-weight:800;font-size:17px;background:#fff">350</span><small class="muted" style="flex:1">g. Chef Mealan's estimate of one serving. Tap to correct it.</small></div>`); row.style.cssText += ";" + m; }, { m: mark, BTN, TAP });
      await p.evaluate(() => { const i = document.querySelector(".step-head input.title-input"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, ""); });
      await shot(p, "q_d", null, "full"); }
    // ---- the pot: count what you eat; keep the pot as a recipe on Save in My recipes ----
    seed.items = []; seed.title = ""; delete seed.plateAt; delete seed.plateAsked;
    const POT = { dish: "Creamy mushroom vegetable soup", foods: [f("Mushrooms", 135, 22, 3.1, 0.3, 3.3, 1), f("Carrots", 65, 41, 0.9, 0.2, 9.6, 2.8), f("Onion", 40, 40, 1.1, 0.1, 9.3, 1.7), f("Parsnip", 40, 75, 1.2, 0.3, 18, 4.9), f("Garlic", 5, 149, 6.4, 0.5, 33, 2.1), f("Sour cream, 20 %", 65, 193, 2.4, 20, 2.9, 0)], unsure: null, which: null, course: "starter", vessel: "pot", serves: 4 };
    const NOWF = "/tmp/soup-now.jpg"; fs.copyFileSync("/home/claude/boards/soup.jpg", NOWF); const d1 = new Date("2026-11-15T17:55:00+01:00"); fs.utimesSync(NOWF, d1, d1);
    const pickNow = async (p) => { await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.locator(".camera-ui input[type=file]").setInputFiles(NOWF); await p.waitForTimeout(1800); };
    const potRow = (p) => p.evaluate(({ m, BTN }) => { const sh = document.querySelector(".step-head");
      sh.insertAdjacentHTML("afterbegin", `<button type="button" class="pill pill-small pill-action" style="${BTN};margin:0 0 10px">‹ Back to the camera</button>`);
      const row = document.querySelector(".pa-share"); row.querySelector(".pa-row-q").textContent = "It looks like a pot. How much of it do you eat?";
      const opts = row.querySelectorAll(".pa-opt"); opts[0].classList.remove("on"); opts[0].textContent = "All of it"; opts[1].classList.add("on"); opts[1].innerHTML = '<span aria-hidden="true">✓</span>A part of it';
      row.insertAdjacentHTML("beforeend", `<div style="display:flex;align-items:center;gap:10px;margin-top:10px"><span style="display:inline-flex;align-items:center;justify-content:center;width:84px;height:44px;border:1.5px solid #c9d6ee;border-radius:12px;font-weight:800;font-size:17px;background:#fff">350</span><small class="muted" style="flex:1">g. Chef Mealan's estimate of one serving. Tap to correct it.</small></div>`); row.style.cssText += ";" + m;
      document.querySelector(".pa-go .pill").style.cssText += ";outline:4px solid #f0a81c;outline-offset:2px"; }, { m: mark, BTN });
    withOld();
    // the meal line when that day's lunch is already eaten
    { const p = await open(); await pick(p);
      await p.evaluate(({ m }) => { const inp = document.querySelector(".step-head input.title-input"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(inp, "");
        const pl = document.querySelector(".plan-line"); pl.querySelector("span").textContent = "Snack, yesterday at 15:57 · Off the plan · Regular meal · A mix"; pl.style.cssText += ";" + m; }, { m: mark });
      await potRow(p); await shot(p, "q_e", null, "full"); }
    seed.items = []; seed.title = ""; delete seed.plateAt; delete seed.plateAsked;
    G.read = POT;
    { const p = await open(); await pickNow(p); await potRow(p); await shot(p, "q_f", null, "full"); }
    const potRead = async (name, saved) => { const p = await open(); await pickNow(p); await p.locator(".pa-share .pa-opt").nth(1).click(); await p.locator(".pa-screen .pa-go .pill").click(); await p.waitForTimeout(2500);
      if (saved) { await p.locator(".rv-save").click(); await p.waitForTimeout(600); }
      await p.evaluate(({ m, TAP, saved }) => { const top = document.querySelector(".mp-said-top"); top.textContent = "A part of it, 350 g of a pot of about 1,400 g · Starter of your dinner"; document.querySelector(".mp-said").style.cssText += ";" + m;
        if (!saved) document.querySelector(".rv-save").style.cssText += ";" + TAP;
        else document.querySelector(".rv-go").insertAdjacentHTML("afterend", `<small class="muted" style="display:block;margin-top:10px;${m};padding:8px 10px">Saved as the whole pot: Creamy mushroom vegetable soup, 1,400 g, 4 portions of 350 g.</small>`); }, { m: mark, TAP, saved });
      await shot(p, name, null, "full"); };
    await potRead("q_g", false); await potRead("q_h", true);
    // ---- the three decisions, two ways (Coach Milan 16:25 to 16:39): Back top left stays; a second Back at the bottom; Cancel ----
    const W44 = "height:44px;min-height:44px";
    const topRow = (v, backTo) => `<div id="toprow" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 10px"><button type="button" class="pill pill-small pill-action" style="${W44};padding:0 14px">‹ ${backTo}</button>${v === "A" ? `<button type="button" class="pill pill-small pill-action" style="${W44};padding:0 16px">Cancel</button>` : ""}</div>`;
    const bottomRow = (v, main) => v === "A"
      ? `<div id="botrow" style="display:flex;gap:8px;margin-top:16px"><button type="button" class="pill pill-small pill-action" style="${W44};padding:0 16px;flex:none">‹ Back</button><button type="button" class="pill pill-small pill-primary" style="${W44};flex:1">${main}</button></div>`
      : `<div id="botrow" style="display:flex;gap:8px;margin-top:16px"><button type="button" class="pill pill-small pill-action" style="${W44};padding:0 14px;flex:none">Cancel</button><button type="button" class="pill pill-small pill-action" aria-label="Back" style="${W44};width:44px;padding:0;flex:none">‹</button><button type="button" class="pill pill-small pill-primary" style="${W44};flex:1">${main}</button></div>`;
    const decPhoto = async (name, v) => { const p = await open(); await pickNow(p);
      await p.evaluate(({ m, top, bot }) => { const sh = document.querySelector(".step-head"); sh.insertAdjacentHTML("afterbegin", top); document.querySelector("#toprow").style.cssText += ";" + m;
        document.querySelector(".pa-remove")?.remove();
        const row = document.querySelector(".pa-share"); row.querySelector(".pa-row-q").textContent = "It looks like a pot. How much of it do you eat?";
        const opts = row.querySelectorAll(".pa-opt"); opts[0].classList.remove("on"); opts[0].textContent = "All of it"; opts[1].classList.add("on"); opts[1].innerHTML = '<span aria-hidden="true">✓</span>A part of it';
        row.insertAdjacentHTML("beforeend", `<div style="display:flex;align-items:center;gap:10px;margin-top:10px"><span style="display:inline-flex;align-items:center;justify-content:center;width:84px;height:44px;border:1.5px solid #c9d6ee;border-radius:12px;font-weight:800;font-size:17px;background:#fff">350</span><small class="muted" style="flex:1">g. Chef Mealan's estimate of one serving. Tap to correct it.</small></div>`);
        const go = document.querySelector(".pa-go"); go.outerHTML = bot; document.querySelector("#botrow").style.cssText += ";" + m; }, { m: mark, top: topRow(v, "Back to the camera"), bot: bottomRow(v, "Read the plate") });
      await shot(p, name, null, "full"); };
    const decRead = async (name, v) => { const p = await open(); await pickNow(p); await p.locator(".pa-share .pa-opt").nth(1).click(); await p.locator(".pa-screen .pa-go .pill").click(); await p.waitForTimeout(2500);
      await p.locator(".rv-eat .pa-opt").nth(0).click(); await p.waitForTimeout(300);
      await p.evaluate(({ m, top, bot }) => { document.querySelector(".step-head").insertAdjacentHTML("afterbegin", top); document.querySelector("#toprow").style.cssText += ";" + m;
        document.querySelector(".mp-said-top").textContent = "A part of it, 350 g of a pot of about 1,400 g · Starter of your dinner";
        document.querySelector(".rv-eat").insertAdjacentHTML("afterend", `<div class="pa-row rv-q" style="${m}"><small class="pa-row-q">Keep it for another time?</small><div class="pa-chips"><div role="checkbox" class="pa-opt on"><span aria-hidden="true">✓</span>Save in My recipes</div></div><small class="muted" style="display:block;margin-top:8px">As the whole pot: 1,400 g, 4 portions of 350 g.</small></div>`);
        document.querySelector(".rv-go").outerHTML = bot; document.querySelector("#botrow").style.cssText += ";" + m; }, { m: mark, top: topRow(v, "Back to the photo"), bot: bottomRow(v, "Done") });
      await shot(p, name, null, "full"); };
    await decPhoto("r_a1", "A"); await decRead("r_a2", "A"); await decPhoto("r_b1", "B"); await decRead("r_b2", "B");
    // ---- the light top row, fewer boxes, the photo as wide as the card (Coach Milan 16:47 and 16:50) ----
    const FOLD = () => { const d = document.createElement("div"); d.style.cssText = "position:absolute;left:0;right:0;top:774px;border-top:2px dashed #c0392b;z-index:50;pointer-events:none"; d.innerHTML = '<span style="position:absolute;right:6px;top:-18px;font:700 11px Nunito,sans-serif;color:#c0392b;background:#fff;padding:0 4px">end of the first screen</span>'; document.body.style.position = "relative"; document.body.appendChild(d); };
    const LNK = "background:none;border:0;padding:0;height:44px;font:inherit;font-weight:800;font-size:15px;color:#1f5fc7;cursor:pointer";
    const lightTop = (backTo) => `<div id="toprow" style="display:flex;justify-content:space-between;align-items:center;margin:-6px 0 2px"><button type="button" style="${LNK}">‹ ${backTo}</button><button type="button" style="${LNK}">Cancel</button></div>`;
    // now, 0.3.151, as it is
    { const p = await open(); await pickNow(p); await p.evaluate(FOLD); await shot(p, "t_n1", null, "full"); }
    { const p = await open(); await pickNow(p); await p.locator(".pa-share .pa-opt").nth(1).click(); await p.locator(".pa-screen .pa-go .pill").click(); await p.waitForTimeout(2500); await p.evaluate(FOLD); await shot(p, "t_n2", null, "full"); }
    // new
    { const p = await open(); await pickNow(p);
      await p.evaluate(({ m, top, bot }) => { const sh = document.querySelector(".step-head"); sh.insertAdjacentHTML("afterbegin", top); document.querySelector("#toprow").style.cssText += ";" + m;
        const pa = document.querySelector(".pa"); pa.style.cssText += ";border:0;padding:0;background:transparent;margin:0";
        const bub = pa.querySelector(".chef-line"); bub.style.cssText += ";border:0;padding:0;background:transparent;box-shadow:none";
        const rowE = bub.querySelector(".chef-line-row"); rowE.style.cssText += ";flex-direction:column;gap:8px"; const im = rowE.querySelector("img"); im.style.cssText += ";width:100%;height:auto;aspect-ratio:4/3;border-radius:14px;" + m;
        document.querySelector(".pa-remove")?.remove();
        const row = document.querySelector(".pa-share"); row.querySelector(".pa-row-q").textContent = "It looks like a pot. How much of it do you eat?";
        const opts = row.querySelectorAll(".pa-opt"); opts[0].classList.remove("on"); opts[0].textContent = "All of it"; opts[1].classList.add("on"); opts[1].innerHTML = '<span aria-hidden="true">✓</span>A part of it';
        row.insertAdjacentHTML("beforeend", `<div style="display:flex;align-items:center;gap:10px;margin-top:10px"><span style="display:inline-flex;align-items:center;justify-content:center;width:84px;height:44px;border:1.5px solid #c9d6ee;border-radius:12px;font-weight:800;font-size:17px;background:#fff">350</span><small class="muted" style="flex:1">g. Chef Mealan's estimate of one serving. Tap to correct it.</small></div>`);
        document.querySelector(".pa-go").outerHTML = bot; document.querySelector("#botrow").style.cssText += ";" + m; }, { m: mark, top: lightTop("Back to the camera"), bot: bottomRow("A", "Read the plate") });
      await p.evaluate(FOLD); await shot(p, "t_1", null, "full"); }
    { const p = await open(); await pickNow(p); await p.locator(".pa-share .pa-opt").nth(1).click(); await p.locator(".pa-screen .pa-go .pill").click(); await p.waitForTimeout(2500);
      await p.locator(".rv-eat .pa-opt").nth(0).click(); await p.waitForTimeout(300);
      await p.evaluate(({ m, top, bot }) => { document.querySelector(".step-head").insertAdjacentHTML("afterbegin", top); document.querySelector("#toprow").style.cssText += ";" + m;
        const card = document.querySelector(".read-view"), cs = getComputedStyle(card), big = card.querySelector(".mp-big");
        big.style.cssText += `;border:0;padding:0;background:transparent;margin:-${cs.paddingTop} -${cs.paddingRight} 0 -${cs.paddingLeft};border-radius:0`;
        const iw = big.querySelector(".mp-big-img"); iw.style.cssText += ";border-radius:" + cs.borderTopLeftRadius + " " + cs.borderTopRightRadius + " 0 0;overflow:hidden;" ; iw.querySelector("img").style.cssText += ";display:block;width:100%;border-radius:0"; big.style.outline = "3px solid #2a72d9"; big.style.outlineOffset = "-3px";
        big.querySelectorAll(".mp-tags, .mp-big-row, .rv-change").forEach((x) => (x.style.paddingLeft = cs.paddingLeft, x.style.paddingRight = cs.paddingRight));
        const said = card.querySelector(".mp-said"); said.style.cssText += ";border:0;background:transparent;padding:0;margin:12px 0 4px"; card.querySelector(".mp-said-top").textContent = "A part of it, 350 g of a pot of about 1,400 g · Starter of your dinner";
        const chef = card.querySelector(".rv-chef"); chef.style.cssText += ";border:0;background:transparent;padding:0;box-shadow:none;margin:4px 0 0";
        card.querySelector(".rv-eat").insertAdjacentHTML("afterend", `<div class="pa-row rv-q"><small class="pa-row-q">Keep it for another time?</small><div class="pa-chips"><div role="checkbox" class="pa-opt on"><span aria-hidden="true">✓</span>Save in My recipes</div></div><small class="muted" style="display:block;margin-top:8px">As the whole pot: 1,400 g, 4 portions of 350 g.</small></div>`);
        card.querySelector(".rv-go").outerHTML = bot; document.querySelector("#botrow").style.cssText += ";" + m; }, { m: mark, top: lightTop("Back to the photo"), bot: bottomRow("A", "Done") });
      await p.evaluate(FOLD); await shot(p, "t_2", null, "full"); }
  } finally { await b.close(); server.kill(); }
})();
