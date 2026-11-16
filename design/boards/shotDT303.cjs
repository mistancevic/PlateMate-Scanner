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
    const SOUP = "/home/claude/boards/soup.jpg", PANIMG = "/home/claude/boards/pan.jpg";
    const PAN = { dish: "Pancakes with raspberries", foods: [f("Pancakes", 180, 227, 6.4, 9.7, 28, 1), f("Raspberries", 30, 52, 1.2, 0.7, 12, 6.5)], unsure: null, which: null, course: "main", vessel: "plate", serves: 1 };
    const ONE = { dish: "Creamy vegetable soup", foods: [f("Creamy vegetable soup", 350, 78, 1.8, 5, 6, 1)], unsure: null, which: null, course: "starter", vessel: "pot", serves: 4 };
    const BTN = "height:44px;min-height:44px;padding:0 16px";
    const TAILS = " · Off the plan · Regular meal · A mix";
    // the meal line that exists, under the title; its pencil becomes the button Change
    const mealLine = (p, text, outline = true) => p.evaluate(({ text, m, BTN, outline }) => { const pl = document.querySelector(".plan-line"); pl.style.display = ""; pl.querySelector("span").textContent = text; const pen = pl.querySelector("button"); pen.outerHTML = `<button type="button" class="pill pill-small pill-action" style="${BTN};flex:none">Change</button>`; pl.style.cssText += ";align-items:center;gap:10px;" + (outline ? m : ""); }, { text, m: mark, BTN, outline });
    const swapMeal = (p, meal) => p.evaluate((meal) => { const c = document.querySelector(".plate-card"); const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.nodeValue.trim() === "Dinner") n.nodeValue = meal; }, meal);
    // the photo screen
    const photo = async (name, o) => { G.nophoto = false; G.img = o.img || SOUP; G.read = null; const p = await open();
      await p.evaluate(({ o, m, BTN }) => { const sh = document.querySelector(".step-head"); sh.querySelector("h2").textContent = "Photo of my meal"; sh.querySelector("p").style.display = "none";
        const pa = document.querySelector(".pa"); const top = pa.querySelector(".pa-top"); const rowE = top.querySelector(".chef-line-row"), im = rowE.querySelector("img"), tx = rowE.querySelector("p"); tx.textContent = o.photoLine;
        im.style.cssText += ";width:104px;height:104px;border-radius:14px;object-fit:cover;flex:none"; rowE.style.cssText += ";align-items:stretch;gap:12px;" + m;
        const col = document.createElement("div"); col.style.cssText = "display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;flex:1;min-width:0"; rowE.appendChild(col); col.appendChild(tx); col.insertAdjacentHTML("beforeend", `<button type="button" class="pill pill-small pill-danger-line" style="height:44px;min-height:44px;padding:0 12px;white-space:nowrap">Remove the photo</button>`);
        pa.querySelectorAll(".pa-chips, .pa-dish, .pa-note").forEach((e) => e.remove()); [...pa.children].forEach((e) => { if (e.tagName === "SMALL") e.remove(); });
        const lab = (t) => `<b style="display:block;font-size:14px;font-weight:700;margin:14px 0 8px">${t}</b>`;
        const shr = pa.querySelector(".pa-share");
        if (!o.pot) shr.remove(); else { shr.innerHTML = lab("It looks like a pot. How much of it do you eat?") + `<div style="display:flex;gap:8px"><div role="radio" class="pa-opt" style="flex:1;text-align:center">All of it</div><div role="radio" class="pa-opt on" style="flex:1;text-align:center">✓ A part of it</div></div><div style="display:flex;align-items:center;gap:10px;margin-top:10px"><span style="display:inline-flex;align-items:center;justify-content:center;width:84px;height:44px;border:1.5px solid #c9d6ee;border-radius:12px;font-weight:800;font-size:17px;background:#fff">350</span><small class="muted" style="flex:1">g. Chef Mealan's estimate of one serving. Tap to correct it.</small></div>`; shr.style.cssText += ";" + m; }
        const go = pa.querySelector(".pa-go"); go.querySelector(".pill-danger-line").remove(); go.style.cssText += ";display:flex;justify-content:flex-end;margin-top:16px"; go.querySelector(".pill-primary").style.cssText += ";" + BTN; }, { o, m: mark, BTN });
      await only(p, [".step-head", ".plan-line", ".plate-card"], [".pa"]); await mealLine(p, o.meal);
      await note(p, o.note, ".plate-card"); await shot(p, name, null, "full"); };
    // the read
    const read = async (name, o) => { G.nophoto = false; G.img = o.img || SOUP; G.read = o.read || null; const p = await open();
      if (o.part) await p.locator(".pa-share .pa-opt").nth(1).click();
      if (o.words) await p.locator(".pa-note textarea").fill(WORDS);
      await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500);
      await only(p, [".step-head", ".plan-line", ".plate-card"], [".mp-big", ".mp-said", ".readout"].concat(o.cook ? [".pt-cook"] : []));
      await p.evaluate(({ o, m, BTN }) => { const h = document.querySelector(".step-head p"); if (h) h.textContent = "Read from your photo. Tap an amount to correct it.";
        const c = document.querySelector(".plate-card"); c.querySelectorAll(".mp-big-row button").forEach((x) => (x.style.display = "none"));
        const ro = c.querySelector(":scope > .readout"); if (ro) { c.querySelector(".mp-big").insertAdjacentElement("afterend", ro); ro.style.cssText += ";margin-top:12px;" + m; }
        const said = c.querySelector(".mp-said"); said.innerHTML = `<small class="mp-said-top">${o.said}</small>` + (o.words ? `<small class="muted">You said: it is a blended soup: mushrooms, carrots, onion, garlic, white carrot, sour cream, chicken bouillon, parsley, pepper, vlašac</small>` : "");
        let html = o.extra || "";
        if (o.main) html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:14px 0 0;flex-wrap:wrap;${m}"><button type="button" class="pill pill-small pill-action" style="${BTN}">Correct the read</button><span style="display:flex;gap:8px">${o.second ? `<button type="button" class="pill pill-small pill-action" style="${BTN}">${o.second}</button>` : ""}<button type="button" class="pill pill-small pill-primary" style="${BTN}">${o.main}</button></span></div>`;
        c.insertAdjacentHTML("beforeend", html); }, { o, m: mark, BTN });
      await mealLine(p, o.meal, false); if (o.swap) await swapMeal(p, o.swap);
      await note(p, o.note, ".plate-card"); await shot(p, name, null, "full"); };
    const CORRECT = `<div style="margin-top:14px;padding:12px;border:1.5px solid #c9d6ee;border-radius:14px;${mark}"><b style="display:block;font-size:15px;margin-bottom:10px">What is wrong or missing?</b><div style="display:flex;gap:8px;margin-bottom:10px"><button type="button" class="pill pill-small pill-action" style="${BTN};flex:1">📷 Add another photo</button><button type="button" class="pill pill-small pill-action" style="${BTN};flex:1">🎙 Say it</button></div><textarea rows="4" style="width:100%;box-sizing:border-box;border:1.5px solid #c9d6ee;border-radius:12px;padding:10px;font:inherit;font-size:15px">It is a blended soup: mushrooms, carrots, onion, garlic, white carrot, sour cream, chicken bouillon, parsley, pepper, vlašac</textarea><div style="display:flex;justify-content:space-between;margin-top:12px"><button type="button" class="pill pill-small pill-action" style="${BTN}">Back</button><button type="button" class="pill pill-small pill-primary" style="${BTN}">Read it again</button></div></div>`;

    // ---- 1. a photo from Your photos, of a lunch you ate ----
    { G.nophoto = true; const p = await open(); await mealLine(p, "Dinner, 20:00 by the clock" + TAILS); await p.evaluate((m) => { const b = [...document.querySelectorAll(".ways-tiles button, .ways button")].find((x) => /Photo of my meal/.test(x.textContent)); if (b) b.style.cssText += ";outline:3px solid #f0a81c;outline-offset:2px"; }, mark);
      await note(p, "The Plate, as today. The meal line under the title is the one that exists. New: its pencil is a button, Change.", ".plan-line"); await shot(p, "w1a", null); }
    { G.nophoto = true; const p = await open(); await p.locator(".mp-button").click(); await p.waitForTimeout(1500); await p.screenshot({ path: R + "/w1b.png" }); await p.context().close(); console.log("shot w1b"); }
    await photo("w1c", { img: PANIMG, photoLine: "A photo from 13:10 today, from Your photos.", meal: "Lunch, today at 13:10" + TAILS, note: "New: the photo screen. The photo fills in the meal line: it was taken at 13:10, so it is your lunch, and you ate it. Below: only the photo and Read the plate. No questions." });
    await read("w1d", { img: PANIMG, read: PAN, swap: "Lunch", meal: "Lunch, today at 13:10" + TAILS, said: "Main dish of your lunch", main: "Save it to my day", note: "New: the read alone, always with the result. The main button follows the meal line: you ate it, so Save it to my day." });
    { G.nophoto = false; G.img = PANIMG; G.read = PAN; const p = await open(); await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500); await p.locator(".mp-say button", { hasText: "Ate it" }).click(); await p.waitForTimeout(1500); await p.evaluate(() => { const t = document.querySelector(".toast, [role=status]"); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) n.nodeValue = n.nodeValue.replace("19:13", "13:10"); }); await p.screenshot({ path: R + "/w1e.png" }); await p.context().close(); console.log("shot w1e"); }
    // ---- 2. a photo taken now ----
    await photo("w2a", { img: PANIMG, photoLine: "A photo taken now.", meal: "Dinner, now" + TAILS, note: "A photo you take now: the meal line says Dinner, now. Nothing to answer." });
    await read("w2b", { img: PANIMG, read: PAN, meal: "Dinner, now" + TAILS, said: "Main dish of your dinner", main: "Put it on my plate", note: "You eat it now, so the main button is Put it on my plate." });
    { G.nophoto = false; G.img = PANIMG; G.read = PAN; const p = await open(); await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500); await p.evaluate(() => document.querySelectorAll(".chat-fab").forEach((x) => (x.style.visibility = "hidden"))); await p.screenshot({ path: R + "/w2c.png", fullPage: false }); await p.context().close(); console.log("shot w2c"); }
    // ---- 3. a pot, a part of it, the first read wrong ----
    await photo("w3a", { photoLine: "A photo taken now.", pot: true, meal: "Dinner, now" + TAILS, note: "A pot or a tray: the one question the photo screen keeps. A part of it shows grams you can correct." });
    await read("w3b", { read: ONE, meal: "Dinner, now" + TAILS, said: "A part of it, 350 g · Starter of your dinner", main: "Put it on my plate", note: "A blended soup reads as one food." });
    await read("w3c", { read: ONE, meal: "Dinner, now" + TAILS, said: "A part of it, 350 g · Starter of your dinner", extra: CORRECT, note: "New: Correct the read. Another photo, your voice, or typed. Then Read it again." });
    await read("w3d", { part: true, words: true, cook: true, meal: "Dinner, now" + TAILS, said: "A part of it, 350 g · Starter of your dinner", main: "Put it on my plate", note: "The read again, from the photo and your words: six foods, and the cooking foods you named." });
    // ---- 4. just looking ----
    { G.nophoto = true; const p = await open(); await p.locator(".plan-line-pen").click(); await p.waitForTimeout(600);
      await p.evaluate(({ m, BTN }) => { const pl = document.querySelector(".plan-line"); pl.querySelector("span").textContent = "Just looking · nothing is logged"; pl.querySelector("button").outerHTML = `<button type="button" class="pill pill-small pill-primary" style="${BTN};flex:none;${m}">Done</button>`; pl.style.cssText += ";align-items:center;gap:10px";
        const grp = [...document.querySelectorAll(".moments")].find((g) => /Just looking/.test(g.textContent)); grp.querySelectorAll(".choice").forEach((b) => b.classList.toggle("on", /Just looking/.test(b.textContent))); grp.style.cssText += ";" + m;
        const day = document.querySelector(".moments.which-day"); day.insertAdjacentHTML("afterend", `<p class="label">What time?</p><div class="moments" style="${m}"><button type="button" class="choice on">Now</button><button type="button" class="choice">At 18:00</button></div>`); }, { m: mark, BTN });
      await note(p, "The questions that exist, behind Change. Tap: Just looking. New here: What time? beside Which day?, and Done is a button.", ".plan-line"); await shot(p, "w4a", null); }
    await photo("w4b", { img: PANIMG, photoLine: "A photo taken now.", meal: "Just looking · nothing is logged", note: "The meal line says Just looking. The photo does not change it." });
    await read("w4c", { img: PANIMG, read: PAN, meal: "Just looking · nothing is logged", swap: "Just looking", said: "Main dish", main: "Done", second: "Put it on my plate", note: "The result, and Done. Put it on my plate, if you decide to eat it." });
  } finally { await b.close(); server.kill(); }
})();
