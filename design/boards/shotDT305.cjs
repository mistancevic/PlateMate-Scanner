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
        const said = c.querySelector(".mp-said"); said.innerHTML = `<small class="mp-said-top">${o.said}</small>` + (o.you ? `<small class="muted">You said: ${o.you}</small>` : "");
        let html = o.extra || "";
        if (o.main) html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:14px 0 0;flex-wrap:wrap;${m}">${o.left === "" ? "<span></span>" : `<button type="button" class="pill pill-small pill-action" style="${BTN}">${o.left || "Correct the read"}</button>`}<span style="display:flex;gap:8px">${o.second ? `<button type="button" class="pill pill-small pill-action" style="${BTN}">${o.second}</button>` : ""}<button type="button" class="pill pill-small pill-primary" style="${BTN}">${o.main}</button></span></div>`;
        c.insertAdjacentHTML("beforeend", html); }, { o, m: mark, BTN });
      if (o.meal) await mealLine(p, o.meal, false); if (o.swap) await swapMeal(p, o.swap);
      await note(p, o.note, ".plate-card"); await shot(p, name, null, "full"); };
    const CORRECT = `<div style="margin-top:14px;padding:12px;border:1.5px solid #c9d6ee;border-radius:14px;${mark}"><b style="display:block;font-size:15px;margin-bottom:10px">What is wrong or missing?</b><div style="display:flex;gap:8px;margin-bottom:10px"><button type="button" class="pill pill-small pill-action" style="${BTN};flex:1">📷 Add another photo</button><button type="button" class="pill pill-small pill-action" style="${BTN};flex:1">🎙 Say it</button></div><textarea rows="4" style="width:100%;box-sizing:border-box;border:1.5px solid #c9d6ee;border-radius:12px;padding:10px;font:inherit;font-size:15px">It is a blended soup: mushrooms, carrots, onion, garlic, white carrot, sour cream, chicken bouillon, parsley, pepper, vlašac</textarea><div style="display:flex;justify-content:space-between;margin-top:12px"><button type="button" class="pill pill-small pill-action" style="${BTN}">Back</button><button type="button" class="pill pill-small pill-primary" style="${BTN}">Read it again</button></div></div>`;

    const YOU = "buckwheat pancakes, fried in butter";
    const TAP = "outline:4px solid #f0a81c;outline-offset:2px";
    const LINE0 = "Dinner, 20:00 by the clock · Off the plan · Regular meal · A mix";
    const setLine = (p, text, outline) => p.evaluate(({ text, m, outline }) => { const pl = document.querySelector(".plan-line"); pl.querySelector("span").textContent = text; if (outline) pl.style.cssText += ";" + m; }, { text, m: mark, outline });
    // c. the photo screen
    const pscreen = async (name, o) => { G.nophoto = false; G.img = PANIMG; G.read = null; const p = await open();
      await p.evaluate(({ o, m, BTN, YOU }) => { const sh = document.querySelector(".step-head"); sh.innerHTML = `<input class="title-input" aria-label="Name of the meal" placeholder="Chef Mealan names it">`;
        const pa = document.querySelector(".pa"); const top = pa.querySelector(".pa-top"); const rowE = top.querySelector(".chef-line-row"), im = rowE.querySelector("img"), tx = rowE.querySelector("p"); tx.textContent = o.photoLine || "A photo taken now.";
        im.style.cssText += ";width:104px;height:104px;border-radius:14px;object-fit:cover;flex:none"; rowE.style.cssText += ";align-items:stretch;gap:12px";
        const col = document.createElement("div"); col.style.cssText = "display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;flex:1;min-width:0"; rowE.appendChild(col); col.appendChild(tx); col.insertAdjacentHTML("beforeend", `<button type="button" class="pill pill-small pill-danger-line" style="height:44px;min-height:44px;padding:0 12px;white-space:nowrap">Remove the photo</button>`);
        pa.querySelectorAll(".pa-chips, .pa-dish, .pa-share").forEach((e) => e.remove()); [...pa.children].forEach((e) => { if (e.tagName === "SMALL") e.remove(); });
        const nt = pa.querySelector(".pa-note"); nt.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:16px 0 8px"><b style="font-size:14px;font-weight:700">Anything Chef Mealan should know?</b><button type="button" class="pill pill-small pill-action" style="${BTN};flex:none">🎙 Say it</button></div><textarea class="pa-words" rows="3" placeholder="What is in it, how it was cooked. You can leave it empty." style="width:100%;box-sizing:border-box;border:1.5px solid #c9d6ee;border-radius:12px;padding:10px;font:inherit;font-size:15px">${YOU}</textarea>`;
        const go = pa.querySelector(".pa-go"); go.querySelector(".pill-danger-line").remove(); go.style.cssText += ";display:flex;justify-content:flex-end;margin-top:16px"; go.querySelector(".pill-primary").style.cssText += ";" + BTN + (o.tapRead ? ";outline:4px solid #f0a81c;outline-offset:2px" : ""); }, { o, m: mark, BTN, YOU });
      if (o.pen) { await p.locator(".plan-line-pen").click(); await p.waitForTimeout(600); await p.locator(".moments.which-day .choice", { hasText: "Tomorrow" }).click(); await p.waitForTimeout(500);
        await p.evaluate(({ m, BTN, TAP }) => { const main = document.querySelector("main"); let after = false; [...main.children].forEach((e) => { if (e.matches(".crave-card")) e.style.display = "none"; if (after) e.style.display = "none"; if (e.matches(".plate-card")) { after = true; e.style.display = "none"; } });
          const d = document.querySelector(".plan-line button"); d.outerHTML = `<button type="button" class="pill pill-small pill-primary" style="${BTN};flex:none;${TAP}">Done</button>`; document.querySelector(".plan-line").style.cssText += ";align-items:center;gap:10px"; document.querySelector(".moments.which-day").style.cssText += ";" + m; document.querySelector(".plan-line span").textContent = "Dinner, tomorrow, 20:00 · Regular meal · A mix"; }, { m: mark, BTN, TAP });
        await note(p, o.note, ".plan-line"); await shot(p, name, null); return; }
      await only(p, [".step-head", ".plan-line", ".plate-card"], [".pa"]); if (o.line) await setLine(p, o.line, true);
      if (o.tapPen) await p.evaluate((TAP) => { document.querySelector(".plan-line-pen").style.cssText += ";" + TAP; }, TAP);
      if (o.note) await note(p, o.note, ".plate-card"); await shot(p, name, null, "full"); };
    // d. the read: always the result; under it you tick what applies, then Done
    const rd = async (name, o) => { G.nophoto = false; G.img = PANIMG; G.read = PAN; const p = await open();
      await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500);
      await only(p, [".step-head", ".plan-line", ".plate-card"], [".mp-big", ".mp-said", ".readout"]);
      await p.evaluate(({ o, m, BTN, YOU, TAP }) => { const h = document.querySelector(".step-head p"); if (h) h.textContent = "Read from your photo. Tap an amount to correct it.";
        const c = document.querySelector(".plate-card"); c.querySelectorAll(".mp-big-row button").forEach((x) => (x.style.display = "none"));
        const ro = c.querySelector(":scope > .readout"); c.querySelector(".mp-big").insertAdjacentElement("afterend", ro); ro.style.cssText += ";margin-top:12px";
        const said = c.querySelector(".mp-said"); said.innerHTML = `<small class="mp-said-top">Main dish of your dinner</small><small class="muted">You said: ${YOU}</small>`;
        c.querySelector(".mp-big-row").insertAdjacentHTML("afterend", `<div style="display:flex;justify-content:flex-end;padding:0 10px 12px"><button type="button" class="pill pill-small pill-action" style="${BTN};${m};${o.tap === "Change the foods" ? TAP : ""}">Change the foods</button></div>`);
        const ring = (t) => (o.tap === t ? TAP : "");
        const tick = (label, on, key) => `<div role="checkbox" class="pa-chip${on ? " on" : ""}" style="height:44px;display:inline-flex;align-items:center;padding:0 16px;flex:none;${ring(key)}">${on ? "✓ " : ""}${label}</div>`;
        const small = (label, on) => `<div role="radio" class="pa-chip${on ? " on" : ""}" style="height:44px;display:inline-flex;align-items:center;padding:0 14px;flex:none;${ring(label)}">${on ? "✓ " : ""}${label}</div>`;
        let html = "";
        if (o.chef) html += `<div class="bubble mealan chef-line" style="margin-top:12px"><p style="margin:0"><b>Chef Mealan:</b> About 300 to 550 kcal and 12 g protein. With it your day is at PD 2.8, under your 4.8.</p></div>`;
        html += `<div style="margin-top:14px;padding:12px;border:1.5px solid #c9d6ee;border-radius:14px;${m}"><b style="display:block;font-size:14px;font-weight:700;margin:0 0 10px">${o.q || "Did you eat it?"}</b><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">`
          + (o.plan ? tick(o.plan, Boolean(o.ate), "Plan") : small("All of it", o.ate === "all") + small("Half", o.ate === "half") + small("Part of it", o.ate === "part"))
          + (o.ate && !o.plan ? `<span style="flex-basis:100%;height:0"></span><span style="display:inline-flex;align-items:center;justify-content:center;width:84px;height:44px;border:1.5px solid #c9d6ee;border-radius:12px;font-weight:800;font-size:17px;background:#fff">${o.ate === "half" ? 105 : o.ate === "part" ? 70 : 210}</span><small class="muted">g of 210 g. Tap to correct it.</small>` : "")
          + `</div></div><div style="display:flex;gap:8px;margin-top:16px;${m}"><button type="button" class="pill pill-small pill-action" style="${BTN};flex:1;padding:0 8px;${ring("Save in My recipes")}">${o.saved ? "✓ Saved in My recipes" : "Save in My recipes"}</button><button type="button" class="pill pill-small pill-primary" style="${BTN};flex:1;${ring("Done")}">Done</button></div>`;
        c.insertAdjacentHTML("beforeend", html); }, { o, m: mark, BTN, YOU, TAP });
      if (o.line) await setLine(p, o.line, false);
      if (o.note) await note(p, o.note, ".plate-card"); await shot(p, name, null, "full"); };
    const toastShot = async (name, tab, text) => { G.nophoto = false; G.img = PANIMG; G.read = PAN; const p = await open(); await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500); await p.locator(".mp-say button", { hasText: "Ate it" }).click(); await p.waitForTimeout(1500);
      if (tab) { await p.getByText(tab, { exact: true }).last().click(); await p.waitForTimeout(1500); }
      if (text) await p.evaluate((text) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (/Logged at/.test(n.nodeValue)) n.nodeValue = text; }, text);
      await p.evaluate(() => document.querySelectorAll(".chat-fab").forEach((x) => (x.style.visibility = "hidden"))); await p.screenshot({ path: R + "/" + name + ".png" }); await p.context().close(); console.log("shot", name); };

    // a: the Plate; new: the hat on Find ideas. The tile to tap carries the ring.
    { G.nophoto = true; const p = await open();
      await p.evaluate(({ m, TAP, NOTE }) => { const fit = [...document.querySelectorAll("button")].find((x) => /Fit to my target/.test(x.textContent)); const hat = fit && fit.querySelector("svg"); const fi = [...document.querySelectorAll("button")].find((x) => /Find ideas/.test(x.textContent));
        if (hat && fi) { const h2 = hat.cloneNode(true); h2.style.cssText += ";margin-right:8px;vertical-align:-3px;fill:#fff;color:#fff"; fi.insertBefore(h2, fi.firstChild); fi.style.cssText += ";" + m; }
        const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New on the Plate: Find ideas carries Chef Mealan's hat, because he comes up with the ideas. Everything else as today."; document.querySelector(".crave-card").insertAdjacentElement("beforebegin", d);
        const t = [...document.querySelectorAll("button")].find((x) => /Photo of my meal/.test(x.textContent)); t.style.cssText += ";" + TAP; }, { m: mark, TAP, NOTE });
      await shot(p, "z_a", null, "full"); }
    { G.nophoto = true; const p = await open(); await p.locator(".mp-button").click(); await p.waitForTimeout(1500); await p.evaluate((TAP) => { const bs = [...document.querySelectorAll(".camera-ui button")]; const sh = bs.find((x) => { const r = x.getBoundingClientRect(); return r.width > 60 && r.width < 110 && Math.abs(r.width - r.height) < 4 && r.top > 600; }); if (sh) sh.style.cssText += ";" + TAP; }, TAP); await p.screenshot({ path: R + "/z_b.png" }); await p.context().close(); console.log("shot z_b"); }
    await pscreen("z_c", { tapRead: true, note: "New: the photo screen. The meal's title takes the place of the question, still empty. The meal line as today. The photo with Remove the photo, the box for what he should know, Read the plate. Nothing else." });
    const T = { chef: true };
    await rd("z1d", { ...T, tap: "Done", markBtns: true, note: "New: the read alone, always with the result. Under it the question Did you eat it? in its own block, with three chips: All of it, Half, Part of it. At the foods: Change the foods. Then, for the whole read, the two buttons side by side: Save in My recipes, Done. Nothing chosen: nothing is kept." });
    await rd("z2d", { ...T, tap: "Save in My recipes", note: "Tap: Save in My recipes." });
    await rd("z2e", { ...T, saved: true, tap: "Done", note: "The button says Saved in My recipes: it is kept as a recipe, with its foods, amounts and photo. Nothing counts." });
    await rd("z3d", { ...T, tap: "All of it", note: "The chips are white until you choose one. Tap: All of it." });
    await rd("z3e", { ...T, ate: "all", tap: "Done", note: "Chosen, blue with the check mark. The weight shows below: the whole meal, 210 g. Done counts it." });
    await toastShot("z3f", null, null);
    await rd("z4d", { ...T, tap: "Half", note: "You ate half. Tap: Half." });
    await rd("z4f", { ...T, ate: "half", tap: "Done", note: "The field says 105 g. For another amount: Part of it, and type the grams. Done counts it." });
    await pscreen("z5c", { tapPen: true, note: "The meal is for tomorrow. Tap: the pencil on the meal line." });
    await pscreen("z5c2", { pen: true, note: "The questions that exist. Tap: Tomorrow. The meal line follows. Then Done, and Read the plate." });
    const TL = "Dinner, tomorrow, 20:00 · Regular meal · A mix";
    await rd("z5d", { q: "Is it for the plan?", plan: "Plan it for tomorrow's dinner", tap: "Plan", line: TL, note: "The meal line says tomorrow, so the question is Is it for the plan? and the answer Plan it for tomorrow's dinner. No word about today." });
    await rd("z5e", { q: "Is it for the plan?", plan: "Planned for tomorrow's dinner", ate: "all", tap: "Done", line: TL, note: "Chosen. Done puts it on the plan." });
    await toastShot("z5f", "Plan", "Planned for tomorrow's dinner. It's on Plan.");
    const YL = "Dinner, yesterday at 19:40 · Off the plan · Regular meal · A mix";
    await pscreen("z6c", { tapRead: true, photoLine: "A photo from yesterday, 19:40, from Your photos.", line: YL, note: "A photo from Your photos carries its day and time. It fills in the meal line: Dinner, yesterday at 19:40." });
    await rd("z6d", { tap: "All of it", line: YL, note: "Tap: All of it." });
    await rd("z6e", { ate: "all", tap: "Done", line: YL, note: "Chosen. Done counts it for yesterday." });
    await toastShot("z6f", null, "Logged for yesterday, 19:40.");
    await rd("z7d", { ...T, tap: "Change the foods", note: "A food is wrong or missing, or you want Chef Mealan to fit the meal. The button sits at the foods it changes. Tap: Change the foods." });
  } finally { await b.close(); server.kill(); }
})();
