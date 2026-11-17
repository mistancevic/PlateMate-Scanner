// Board DT308, the three frames the meal model still missed (Coach Milan 17 November 22:33 and 23:41):
// the calendar behind the pencil with What is it? and the occasion under the meals; Fit to my target with no meal set;
// Plan it on a plate without a photo. Drawn on the app as built in 0.3.156: a plate with no meal set is drawn on
// Just looking, the mode in which nothing is counted today.
const ROOT = process.env.ROOT || "/home/claude/platemate-scanner";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const PORT = "3553", U = `http://127.0.0.1:${PORT}`, R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs";
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.items = []; seed.meals = []; seed.feedback = []; seed.title = "";
seed.foods.push({ id: "f-pudding", name: "Protein pudding", brand: "Ehrmann", barcode: "4006040000001", basis: "100g", source: "label", notes: "", reviewedAt: "2026-10-01T00:00:00.000Z", readyToEat: true, calories: 75, protein: 10, fats: 1.5, carbs: 5, fiber: 0, serving: { grams: 200, name: "pot" }, icon: "🍮" });
const RSRC = fs.readFileSync(ROOT + "/tests/flows/recipe-import.cjs", "utf8"), ra = RSRC.indexOf("const read = "), RECIPE = eval("(" + RSRC.slice(ra + 13, RSRC.indexOf("\nconst ", ra + 10)).trim().replace(/;$/, "") + ")");
const PHOTO = { dish: "Grilled chicken with rice", foods: [{ name: "Chicken breast, grilled", grams: 180, low: 140, high: 240, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" }, { name: "Rice, cooked", grams: 150, low: 120, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "medium" }], unsure: null, which: null, course: "main", vessel: "plate", serves: 1 };
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", TAP = "outline:4px solid #f0a81c;outline-offset:2px";
const NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`;
const PEN = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
const day = (d) => `<button type="button" style="flex:none;min-height:44px;padding:0 12px;border-radius:12px;border:1.5px solid ${d.on ? "#2a72d9" : "#c9d6ee"};background:${d.on ? "#e3edff" : "#fff"};color:${d.on ? "#1f4fa3" : "#3a4a66"};font:inherit;font-size:14px;font-weight:700;white-space:nowrap">${d.t}</button>`;
const rw = (r) => `<button type="button" style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:48px;padding:0 12px;margin:0;border:0;border-top:1px solid #dfe7f5;background:${r.on ? "#e3edff" : "#fff"};font:inherit;text-align:left;${r.tap ? "box-shadow:inset 0 0 0 4px #f0a81c" : ""}"><b style="font-size:15px;color:#172742;white-space:nowrap">${r.on ? "✓ " : ""}${r.m}</b><span style="font-size:13px;color:#5b6b85;text-align:right">${r.s}</span></button>${r.under || ""}`;
const cal = (days, rows) => `<div style="margin:10px 0 0"><div style="display:flex;gap:6px;overflow:hidden">${days.map(day).join("")}</div><div style="margin:10px 0 0;border:1.5px solid #c9d6ee;border-radius:14px;overflow:hidden;background:#fff">${rows.map(rw).join("").replace("border-top:1px solid #dfe7f5", "border-top:0")}</div></div>`;
const DAYS = (on) => [["Sat 14", "sat"], ["Sun 15, today", "sun"], ["Mon 16", "mon"], ["Tue 17", "tue"], ["More", "more"]].map(([t, k]) => ({ t, on: k === on }));
const SUN = (tap, on) => [{ m: "Breakfast", s: "07:30 · not eaten" }, { m: "Lunch", s: "13:45 · not eaten" }, { m: "Dinner", s: "20:00 · next" }, { m: "Snack", s: "now" }].map((r) => ({ ...r, tap: r.m === tap, on: r.m === on }));
const MON = (tap, held, under) => [{ m: "Breakfast", s: "07:30 · nothing planned" }, { m: "Lunch", s: held ? "13:45 · planned: " + held : "13:45 · nothing planned", on: !!under, under }, { m: "Dinner", s: "20:00 · nothing planned" }, { m: "Snack", s: "" }].map((r) => ({ ...r, tap: r.m === tap }));
// the meal line as drawn in DT308.1: grey with a pencil when not set; dark with an X once set
const HX = (o) => `<div id="hx" style="margin:0 0 12px;padding:2px 0;${mark}"><div style="display:flex;align-items:center;gap:10px"><div style="flex:1;min-width:0"><b style="display:block;font-size:${o.grey ? 17 : 19}px;line-height:1.3;color:${o.grey ? "#8f9bb0" : "#172742"}">${o.line}</b>${o.l2 ? `<div style="font-size:15px;line-height:1.4;color:#172742">${o.l2}</div>` : ""}${o.small ? `<div style="font-size:13px;line-height:1.4;color:#5b6b85">${o.small}</div>` : ""}</div><span style="flex:none;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;color:#3a4a66;font-size:22px;${o.open ? "background:#e3edff;" : ""}${o.tapPen ? TAP : ""}">${o.x ? "✕" : PEN}</span></div>${o.open || ""}</div>`;
const UNSET = { line: "Meal and day not set", grey: true };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const want = (n) => !process.env.ONLY || new RegExp("^(" + process.env.ONLY + ")$").test(n);
  const choice = async (p, t) => { await p.locator("main .choice").filter({ hasText: new RegExp("^\\s*(✓\\s*)?" + t + "(,.*)?\\s*$") }).first().click(); await p.waitForTimeout(400); };
  // the Plate with foods from the list; looking: no meal set (Just looking today)
  const open = async (o = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin", permissions: ["camera"] }); const p = await ctx.newPage(); p.on("pageerror", (e) => console.log("ERR", e.message));
    await p.clock.install({ time: new Date("2026-11-15T18:00:00+01:00") });
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", betterAs: "meal", holds: "" }) }));
    await p.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/plate-look", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ vessel: "plate", course: "main" }) }));
    await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PHOTO) }));
    await p.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(RECIPE) }));
    await p.route("**/api/product/**", (r) => r.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not in the database" }) }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1500);
    for (const n of o.foods || ["Skyr", "Oats", "Banana"]) { await (await require(ROOT + "/tests/flows/more.cjs")(p)).fill(n); await p.waitForTimeout(400); await p.locator(".row-food").filter({ hasText: n }).first().getByRole("button", { name: /Add/ }).click(); await p.waitForTimeout(700); }
    const x = p.locator(".add-more-top button, .add-more .icon").first(); if (await x.count()) { await x.click(); await p.waitForTimeout(300); }
    if (o.looking !== false) { await p.locator(".plan-line-pen").click(); await choice(p, "Just looking"); await p.locator(".plan-line-done").click(); await p.waitForTimeout(300); }
    if (o.set) { const inp = p.locator(".plate-card .rows .swipe, .plate-card .rows .row").filter({ hasText: o.set[0] }).first().locator("input").first(); await inp.fill(String(o.set[1])); await inp.blur(); await p.waitForTimeout(600); }
    return p;
  };
  const put = (p, o) => p.evaluate((h) => { const pl = document.querySelector(".plan-line"); pl.insertAdjacentHTML("afterend", h); pl.style.display = "none"; }, HX(o));
  // with no meal set the result says This plate
  const thisPlate = (p) => p.evaluate(() => { const e = [...document.querySelectorAll(".readout-top *, .readout-top")].find((x) => x.childElementCount === 0 && x.textContent.trim() === "As it stands"); if (e) e.textContent = "This plate"; else console.log("no As it stands"); });
  const noteAt = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const tapSel = (p, sel) => p.evaluate(({ sel, TAP }) => { document.querySelector(sel).style.cssText += ";" + TAP; }, { sel, TAP });
  const shot = async (p, name, keepToast) => { await p.evaluate((keepToast) => { document.querySelectorAll(".chat-fab" + (keepToast ? "" : ",.toast")).forEach((x) => (x.style.visibility = "hidden")); window.scrollTo(0, 0);
      [...document.querySelectorAll("body *")].forEach((e) => { if (getComputedStyle(e).position === "fixed" && !(keepToast && e.matches(".toast, .toast *"))) e.style.display = "none"; }); document.querySelector("main").style.paddingBottom = "24px"; }, keepToast);
    await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot", name); await p.context().close(); };
  try {
    // the two questions behind the pencil, as the app draws them today
    let ASK = "";
    if (want("m_1")) { const p = await open({ looking: false }); await p.locator(".plan-line-pen").click(); await p.waitForTimeout(400);
      ASK = await p.evaluate(() => { const ps = [...document.querySelectorAll("main > p.label")]; const from = ps.find((x) => x.textContent.trim() === "What is it?"); const out = []; let e = from; while (e && !e.matches("section, .plate-card")) { out.push(e.outerHTML); e = e.nextElementSibling; } return out.join(""); });
      console.log("ASK", ASK.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 400)); await p.context().close(); }
    const ask = (moment, hint, tap) => { let h = ASK.replace(/(<button[^>]*class="choice) on("[^>]*>)(?:<[^>]*>\s*)*✓?\s*/g, "$1$2"); 
      return `<div id="ask" style="margin:14px 0 0;padding-top:4px;border-top:1px solid #dfe7f5;${mark}">${h}</div><script></script>`; };
    const dress = (p, moment, hint, tap) => p.evaluate(({ moment, hint, tap, TAP }) => { const a = document.getElementById("ask"); const bs = [...a.querySelectorAll("button.choice")];
      const real = bs.find((x) => x.classList.contains("on") && /Regular meal/.test(x.textContent)); const tick = real ? real.innerHTML.replace(/Regular meal/, "").trim() : "✓ ";
      bs.forEach((x) => { const name = x.textContent.replace("✓", "").trim(); const isMoment = !["Savoury", "Sweet, a DaaM", "Both"].includes(name); if (isMoment) { const on = name === moment; x.classList.toggle("on", on); x.innerHTML = (on ? tick + " " : "") + name; } if (name === tap) x.style.cssText += ";" + TAP; });
      const hs = [...a.querySelectorAll("p.small")]; if (hint) hs[hs.length - 1].textContent = hint; }, { moment, hint, tap, TAP });

    // DT308.9: the calendar behind the pencil, with What is it? and the occasion under the meals
    { const p = await open(); await thisPlate(p); await put(p, { ...UNSET, tapPen: true }); await noteAt(p, "No meal is set. Here you tap the pencil of the meal line.", "#hx"); await shot(p, "m_1"); }
    if (want("m_2")) { const p = await open(); await thisPlate(p); await put(p, { ...UNSET, open: cal(DAYS("sun"), SUN("")) + ask() }); await dress(p, "Regular meal", null, "Before training");
      await noteAt(p, "Your calendar opens: the days, then today's meals. New: under the meals stand the two questions that are behind the pencil today, What is it? and Chef Mealan's What kind of moment?, as they are. A tap on a meal sets it and closes. A tap on one of these chips keeps the calendar open. Here you tap Before training.", "#hx"); await shot(p, "m_2"); }
    if (want("m_3")) { const p = await open(); await thisPlate(p); await put(p, { ...UNSET, open: cal(DAYS("sun"), SUN("Dinner")) + ask() }); await dress(p, "Before training", "Energy that's easy to take in. Keep fat and fibre low.", null);
      await noteAt(p, "Before training is chosen, and the calendar is still open. Here you tap Dinner.", "#hx"); await shot(p, "m_3"); }
    if (want("m_4")) { const p = await open({ looking: false }); await p.locator(".plan-line-pen").click(); await choice(p, "Dinner"); await choice(p, "Before training"); await p.locator(".plan-line-done").click(); await p.waitForTimeout(500);
      await put(p, { line: "Dinner", l2: "Sunday, 15 November, 20:00", small: "Before training", x: true });
      await noteAt(p, "Set and closed. The line says the meal, the day and the time, and under it the moment. The plate below is now sized for this dinner before training, as in 0.3.156. X clears the meal and the day.", "#hx"); await shot(p, "m_4"); }

    // DT308.10: Fit to my target with no meal set
    if (want("f_1")) { const p = await open({ foods: ["Oats", "Banana", "Skyr"], set: ["Skyr", 30] }); await thisPlate(p); await put(p, UNSET); await tapSel(p, ".fit-top");
      await noteAt(p, "No meal is set. The plate is under your PD target, so Fit to my target is filled. Here you tap it.", ".fit-top"); await shot(p, "f_1"); }
    if (want("f_2")) { const p = await open({ foods: ["Oats", "Banana", "Skyr"], set: ["Skyr", 30] }); await p.locator(".fit-top").click(); await p.waitForTimeout(1200); await thisPlate(p); await put(p, UNSET);
      await p.evaluate((mark) => { const n = document.querySelector(".fit-note"); const d = document.createElement("p"); d.id = "aim"; d.className = n.className; d.style.cssText = "margin:0 0 10px;" + mark; d.textContent = "No meal is set, so Fit aimed at your PD target only: 4.8 or more. The energy is what your foods give."; n.insertAdjacentElement("beforebegin", d); }, mark);
      await noteAt(p, "Fit raised the skyr and kept your other foods. The result says This plate.", ".fit-top");
      await noteAt(p, "New: Chef Mealan's line says first what Fit aimed at with no meal set. Under it, as today, what Fit did, with Undo.", "#aim"); await shot(p, "f_2"); }

    // DT308.11: Plan it on a plate without a photo
    const END = (o) => `<div id="endq" class="pa-row rv-q" style="margin:14px 0 0;${mark}"><small class="pa-row-q">What do you do with it?</small><div style="display:flex;gap:${o.saved ? 6 : 8}px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px">${[o.saved ? "✓ Saved in My recipes" : "Save it", "Plan it", "Ate it"].map((t) => `<button type="button" class="pill pill-small" ${/^✓/.test(t) ? "disabled" : ""} style="height:44px;min-height:44px;padding:0 ${o.saved ? 9 : 16}px;${o.saved ? "font-size:13px;" : ""}white-space:nowrap;${o.tap === t ? TAP : ""}${o.on === t ? "background:#e3edff;border-color:#2a72d9;" : ""}">${t}</button>`).join("")}</div>${o.saved ? `<div style="margin:8px 0 0;font-size:13.5px;line-height:1.4;color:#172742;${mark}">Saved as <b>Skyr, Oats &amp; Banana</b>, the foods' name. A name you type on top renames it.</div>` : ""}${o.cal ? `<div style="margin:10px 0 0"><div style="font-size:14px;font-weight:700;color:#172742">${o.q || "Which day and meal?"}</div>${o.cal}</div>` : ""}</div>`;
    const end = (p, o) => p.evaluate((h) => { document.querySelector(".prepare-it").insertAdjacentHTML("afterend", h); }, END(o));
    if (want("p_1")) { const p = await open(); await thisPlate(p); await put(p, UNSET); await end(p, { tap: "Plan it" });
      await noteAt(p, "New: a plate without a photo ends with the same question as a read: What do you do with it? Here you tap Plan it.", "#endq"); await shot(p, "p_1"); }
    if (want("p_2")) { const p = await open(); await thisPlate(p); await put(p, UNSET); await end(p, { on: "Plan it", cal: cal(DAYS("mon"), MON("Lunch")) });
      await noteAt(p, "Your calendar opens right under the button, on tomorrow, with nothing marked. Here you tap Lunch.", "#endq"); await shot(p, "p_2"); }
    if (want("p_3")) { const p = await open({ looking: false }); await p.locator(".plan-line-pen").click(); await choice(p, "Tomorrow"); await choice(p, "Lunch"); await p.locator(".plan-line-done").click(); await p.waitForTimeout(400);
      await p.locator("main button").filter({ hasText: /^Put it in/ }).first().click(); await p.waitForTimeout(1200);
      console.log("plate after planning:", await p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.length), "foods"); await p.locator("main button").filter({ hasText: /^Mon 16/ }).first().click(); await p.waitForTimeout(700);
      await p.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE + ";margin:64px 0 10px"; d.textContent = t; document.querySelector("main").insertAdjacentElement("afterbegin", d); }, { t: "Planned with that one tap: you are on Plan, on Monday, and the plate is its lunch. The message and the screen are those of 0.3.156. New: Plan opens on the day you planned for, not on today. Marked for your decision: today's extra button, Put it in Monday's lunch, falls away. Nothing is counted, and no Did you eat it? is asked. The Plate is empty again.", NOTE });
      await shot(p, "p_3", true); }
    // DT308.11, a meal that already holds something
    const HELD = "Rice & Chicken breast";
    const ASKHELD = `<div style="padding:10px 12px 12px;background:#f3f7ff;border-top:1px solid #dfe7f5;${mark};border-radius:0"><div style="font-size:14px;line-height:1.4;color:#172742">Monday's lunch has <b>${HELD.replace("&", "&amp;")}</b>. Add this plate as another dish, or replace it?</div><div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px"><button type="button" class="pill pill-small" style="height:44px;min-height:44px;padding:0 12px">Cancel</button><button type="button" class="pill pill-small" style="height:44px;min-height:44px;padding:0 12px">Replace it</button><button type="button" class="pill pill-small pill-primary" style="height:44px;min-height:44px;padding:0 12px;${TAP}">Add as another dish</button></div></div>`;
    if (want("p_5")) { const p = await open(); await thisPlate(p); await put(p, UNSET); await end(p, { on: "Plan it", cal: cal(DAYS("mon"), MON("Lunch", HELD)) });
      await noteAt(p, "Your calendar, on tomorrow. Monday's lunch already holds a meal, and its row says which. Here you tap Lunch all the same.", "#endq"); await shot(p, "p_5"); }
    if (want("p_6")) { const p = await open(); await thisPlate(p); await put(p, UNSET); await end(p, { on: "Plan it", cal: cal(DAYS("mon"), MON("", HELD, ASKHELD)) });
      await noteAt(p, "New: nothing is replaced without a word. The question opens right under the row, with three answers. Add as another dish: the meal then holds both. Replace it: the plate takes its place. Cancel closes the question and changes nothing; the calendar stays open. Here you tap Add as another dish.", "#endq"); await shot(p, "p_6"); }
    if (want("p_7")) { const p = await open({ looking: false, foods: ["Rice", "Chicken"] });
      const planIt = async () => { await p.locator(".plan-line-pen").click(); await choice(p, "Tomorrow"); await choice(p, "Lunch"); await p.locator(".plan-line-done").click(); await p.waitForTimeout(400); await p.locator("main button").filter({ hasText: /^Put it in/ }).first().click(); await p.waitForTimeout(1200); };
      const block = () => p.evaluate(() => { const leaf = [...document.querySelectorAll("main *")].find((e) => e.childElementCount === 0 && /^(Rice & Chicken breast|Skyr, Oats & Banana)$/.test(e.textContent.trim())); let e = leaf; while (e.parentElement && !/Lunch, 13:45/.test(e.parentElement.textContent)) e = e.parentElement; e.setAttribute("data-dish", "1"); return e.outerHTML; });
      await planIt(); await p.locator("main button").filter({ hasText: /^Mon 16/ }).first().click(); await p.waitForTimeout(700); const first = await block();
      await p.locator("nav button").filter({ hasText: "Plate" }).click(); await p.waitForTimeout(700);
      for (const n of ["Skyr", "Oats", "Banana"]) { await (await require(ROOT + "/tests/flows/more.cjs")(p)).fill(n); await p.waitForTimeout(400); await p.locator(".row-food").filter({ hasText: n }).first().getByRole("button", { name: /Add/ }).click(); await p.waitForTimeout(700); }
      const x = p.locator(".add-more-top button, .add-more .icon").first(); if (await x.count()) { await x.click(); await p.waitForTimeout(300); }
      await planIt(); await p.locator("main button").filter({ hasText: /^Mon 16/ }).first().click(); await p.waitForTimeout(700); await block();
      await p.evaluate(({ first, mark }) => { const now = document.querySelector("[data-dish]"); now.insertAdjacentHTML("beforebegin", first); const both = document.querySelectorAll("[data-dish]"); both[0].style.cssText += ";margin-bottom:10px"; const box = now.parentElement; box.style.cssText += ";" + mark;
        const t = document.querySelector(".toast"); if (t) { const w = document.createTreeWalker(t, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (/is Monday's lunch/.test(n.nodeValue)) n.nodeValue = "Skyr, Oats & Banana is in Monday's lunch, with Rice & Chicken breast. Saved to My recipes too."; } }, { first, mark });
      await p.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE + ";margin:64px 0 10px"; d.textContent = t; document.querySelector("main").insertAdjacentElement("afterbegin", d); }, { t: "Added: Monday's lunch now holds two dishes, the one that was there and the plate. The day's numbers on top count both (drawn here with the plate's numbers only). Nothing is counted as eaten. The Plate is empty again.", NOTE });
      await shot(p, "p_7", true); }

    // DT308.11, Ate it on a plate without a photo
    if (want("a_1")) { const p = await open(); await thisPlate(p); await put(p, UNSET); await end(p, { tap: "Ate it" });
      await noteAt(p, "The same end. You ate this plate: here you tap Ate it.", "#endq"); await shot(p, "a_1"); }
    if (want("a_2")) { const p = await open(); await thisPlate(p); await put(p, UNSET); await end(p, { on: "Ate it", q: "Which meal? Based on the current time, 18:00:", cal: cal(DAYS("sun"), SUN("Dinner", "Dinner")) });
      await noteAt(p, "Your calendar opens under the button, on today. The app marks its guess and says why: it is 18:00, so dinner. Here you tap Dinner.", "#endq"); await shot(p, "a_2"); }
    if (want("a_3")) { const p = await open(); await p.waitForTimeout(800);
      await p.evaluate(() => { const k = "platemate-pilot-v1", s = JSON.parse(localStorage.getItem(k)); const at = new Date("2026-11-15T18:00:00+01:00").toISOString();
        s.feedback = [{ id: "ate1", meal: { id: "m-ate1", title: "Skyr, Oats & Banana", items: s.items.map((i) => ({ ...i, est: undefined })), portion: s.items.reduce((n, i) => n + i.grams, 0), savedAt: at }, status: "eaten", taste: "", notes: "", createdAt: at, slot: { date: "2026-11-15", slotId: "dinner", name: "Dinner", time: "20:00" }, moment: "regular" }, ...(s.feedback || [])];
        s.items = []; s.title = ""; s.portion = null; localStorage.setItem(k, JSON.stringify(s)); });
      await p.reload(); await p.waitForTimeout(1500); await p.locator("nav button").filter({ hasText: "Today" }).click(); await p.waitForTimeout(900);
      console.log("today:", (await p.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 500));
      await p.evaluate(({ t, NOTE, mark }) => { const d = document.createElement("div"); d.style.cssText = NOTE + ";margin:64px 0 10px"; d.textContent = t; document.querySelector("main").insertAdjacentElement("afterbegin", d);
        const acts = document.querySelector(".meal-row-acts"); acts.insertAdjacentHTML("afterbegin", `<button type="button" class="pill pill-small meal-undo" style="${mark}">Undo</button>`);
        const top = document.createElement("div"); top.className = "toast"; top.setAttribute("role", "status"); top.style.cssText = "position:fixed;top:56px;left:12px;right:12px;z-index:60;background:#dae6fb;color:#123a7a;border-radius:14px;padding:12px 16px;font-size:14px;line-height:1.4;box-shadow:0 6px 18px rgba(23,39,66,.18);" + mark; top.textContent = "Logged: Skyr, Oats & Banana is today's dinner, 563 kcal. It's on Today."; document.body.append(top); },
        { t: "Logged with that one tap: you are on Today. New: the message on top says what was logged and where. On the meal's card stands Undo, as for a meal logged on Today; it takes the meal out of Today and puts the plate back on the Plate, with no meal set. The rest of the screen is that of 0.3.156. No amount is asked: the amounts on the plate are yours.", NOTE, mark });
      await shot(p, "a_3", true); }

    // DT308.11, Save it on a plate without a photo
    if (want("s_1")) { const p = await open(); await thisPlate(p); await put(p, UNSET); await end(p, { tap: "Save it" });
      await p.evaluate((mark) => { document.querySelector(".step-head").style.cssText += ";" + mark; }, mark);
      await noteAt(p, "No name is typed. With foods on the plate the top no longer says Meal title: it shows the foods' name in grey, Skyr, Oats & Banana.", ".step-head");
      await noteAt(p, "The same end. You want to keep this plate: here you tap Save it.", "#endq"); await shot(p, "s_1"); }
    if (want("s_2")) { const p = await open(); await thisPlate(p); await put(p, UNSET); await end(p, { saved: true });
      await p.evaluate((TAP) => { const nav = document.querySelector("nav"); nav.style.cssText += ";position:static;margin:16px -16px 0;width:auto"; document.querySelector("main").insertAdjacentElement("afterend", nav); const b = [...nav.querySelectorAll("button")].find((x) => /Recipes/.test(x.textContent)); b.style.cssText += ";" + TAP; }, TAP);
      await noteAt(p, "Saved in My recipes. You typed no name, so the recipe takes the foods' name, the one the top shows in grey. The button says so, as it does on a read. The plate stays as it is, with no meal set, so you can still tap Plan it or Ate it. Nothing is counted. To see where it went, here you tap Recipes in the bottom bar.", "#endq"); await shot(p, "s_2"); }
    if (want("s_3")) { const p = await open(); await p.waitForTimeout(800);
      await p.evaluate(() => { const k = "platemate-pilot-v1", s = JSON.parse(localStorage.getItem(k)); const at = new Date("2026-11-15T18:00:00+01:00").toISOString();
        s.meals = [{ id: "m-saved1", title: "Skyr, Oats & Banana", items: s.items.map((i) => ({ ...i, est: undefined })), portion: s.items.reduce((n, i) => n + i.grams, 0), savedAt: at, steps: [] }, ...(s.meals || [])]; localStorage.setItem(k, JSON.stringify(s)); });
      await p.reload(); await p.waitForTimeout(1500); await p.locator("nav button").filter({ hasText: "Recipes" }).click(); await p.waitForTimeout(900);
      await p.evaluate(({ t, NOTE, mark }) => { const d = document.createElement("div"); d.style.cssText = NOTE + ";margin:8px 0 10px"; d.textContent = t; document.querySelector("main").insertAdjacentElement("afterbegin", d);
        const c = [...document.querySelectorAll("main *")].filter((e) => e.childElementCount === 0 && e.textContent.trim() === "Skyr, Oats & Banana")[0]; if (c) { let e = c; for (let i = 0; i < 6 && e.parentElement && !e.matches("section, article, li, .card, button"); i++) e = e.parentElement; e.style.cssText += ";" + mark; } }, { t: "Recipes, Made by me: the plate is here as a recipe, with its foods and amounts. The screen is that of 0.3.156.", NOTE, mark });
      await shot(p, "s_3"); }

    // ---- helpers for the rows below
    const noteTop = (p, t, mt = 8) => p.evaluate(({ t, NOTE, mt }) => { const d = document.createElement("div"); d.style.cssText = NOTE + `;margin:${mt}px 0 10px`; d.textContent = t; document.querySelector("main").insertAdjacentElement("afterbegin", d); }, { t, NOTE, mt });
    const tapBtn = (p, re, scope = "main") => p.evaluate(({ re, TAP, scope }) => { const r = new RegExp(re); const e = [...document.querySelectorAll(scope + " button, " + scope + " .way")].filter((x) => x.offsetParent && r.test((x.innerText || x.getAttribute("aria-label") || "").split("\n")[0].trim())).pop(); if (e) e.style.cssText += ";" + TAP; else console.log("no button", re); }, { re, TAP, scope });
    const camShot = async (p, name) => { await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
    const clickBtn = async (p, re) => { await p.locator("main button, main .way").filter({ hasText: re }).last().click(); await p.waitForTimeout(1300); };
    const SETD = { line: "Dinner", l2: "Sunday, 15 November, 20:00", x: true };
    const openMore = async (p) => { await p.locator(".add-more-open").click(); await p.waitForTimeout(400); };
    const toCam = async (p) => { await openMore(p); await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); };
    const OLD = "/tmp/plate-old.jpg"; fs.copyFileSync(ROOT + "/tests/flows/plate.jpg", OLD); { const d0 = new Date("2026-11-14T15:57:00+01:00"); fs.utimesSync(OLD, d0, d0); }
    const toPhoto = async (p, old) => { await toCam(p); if (old) { await p.locator(".camera-ui input[type=file]").setInputFiles(OLD); await p.waitForTimeout(1800); } else { await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(700); await p.locator(".cam-analyze").click(); await p.waitForTimeout(1500); } };
    const toAsk = async (p, old) => { await toPhoto(p, old); await p.locator(".pa-go .pill").click(); await p.waitForTimeout(2500); };
    // the question, with what Start a new plate does with the old plate
    const askSays = (p) => p.evaluate((mark) => { const w = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (/Start a new plate: only the new foods\./.test(n.nodeValue)) { const sp = document.createElement("span"); sp.style.cssText = mark + ";display:inline-block;padding:1px 3px"; sp.textContent = " Skyr, Oats & Banana goes to Saved for later, so nothing is lost."; n.parentElement.append(sp); break; } }, mark);
    // five foods on the landing: the plate's three, and the photo's two as estimates
    const joined = async (o) => { const p = await open({ ...o, foods: ["Skyr", "Oats", "Banana", "Chicken", "Rice"] }); await p.waitForTimeout(800);
      await p.evaluate(() => { const k = "platemate-pilot-v1", s = JSON.parse(localStorage.getItem(k)); s.items.forEach((i) => { if (/Chicken/.test(i.food.name)) { i.grams = 180; i.est = { low: 140, high: 240 }; } if (/Rice/.test(i.food.name)) { i.grams = 150; i.est = { low: 120, high: 200 }; } }); localStorage.setItem(k, JSON.stringify(s)); });
      await p.reload(); await p.waitForTimeout(1500); await p.evaluate(() => document.querySelectorAll(".toast").forEach((x) => x.remove())); return p; };

    // DT308.11, Prepare it with no meal set
    const prep = async (upTo) => { const p = await open(); if (upTo >= 1) await p.locator(".prepare-it").click(), await p.waitForTimeout(1200); if (upTo >= 2) await clickBtn(p, /^Protein first/); if (upTo >= 3) await clickBtn(p, /^Make it this way/); if (upTo >= 4) await clickBtn(p, /^Cooked\. Next: Eat/); if (upTo >= 5) { await clickBtn(p, /^All of it$/); await clickBtn(p, /^Good$/); } return p; };
    if (want("r_1")) { const p = await prep(0); await thisPlate(p); await put(p, UNSET); await tapSel(p, ".prepare-it"); await noteAt(p, "No meal is set. You want to cook this plate: here you tap Prepare it.", ".prepare-it"); await shot(p, "r_1"); }
    if (want("r_2")) { const p = await prep(1); await tapBtn(p, "^Protein first"); await noteTop(p, "Prep, as in 0.3.156: how do you want to eat it? No meal is asked here. Here you tap Protein first."); await shot(p, "r_2"); }
    if (want("r_3")) { const p = await prep(2); await tapBtn(p, "^Make it this way"); await noteTop(p, "Protein first is picked. Here you tap Make it this way."); await shot(p, "r_3"); }
    if (want("r_4")) { const p = await prep(3); await tapBtn(p, "^Cooked\\. Next: Eat"); await noteTop(p, "Make, as in 0.3.156. You cook and tick the steps. No meal is asked here. Here you tap Cooked. Next: Eat."); await shot(p, "r_4"); }
    if (want("r_5")) { const p = await prep(5); await tapBtn(p, "^Save$"); await noteTop(p, "Eat, as in 0.3.156. You have answered how much you ate and how it tasted (All of it, Good). Still no meal is set. Here you tap Save."); await shot(p, "r_5"); }
    if (want("r_6")) { const p = await prep(5);
      await p.evaluate(({ h, mark }) => { const b = [...document.querySelectorAll("main button")].filter((x) => x.innerText.trim() === "Save").pop(); b.style.cssText += ";background:#e3edff;color:#1f4fa3;border:1.5px solid #2a72d9"; b.insertAdjacentHTML("afterend", `<div id="rcal" style="margin:10px 0 0;padding:8px;border-radius:14px;background:#fff;${mark}"><div style="font-size:14px;font-weight:700;color:#172742">Which meal? Based on the current time, 18:00:</div>${h}</div>`); }, { h: cal(DAYS("sun"), SUN("Dinner", "Dinner")), mark });
      await noteAt(p, "New: this is where the meal is asked, at the moment you say you ate it. The same calendar opens under Save, on today, with the guess from the clock marked. Here you tap Dinner.", "#rcal"); await shot(p, "r_6"); }
    if (want("r_7")) { const p = await prep(5); await clickBtn(p, /^Save$/); await p.waitForTimeout(800); await p.evaluate(() => document.querySelectorAll(".toast").forEach((x) => x.remove()));
      await noteTop(p, "Logged, and you land on the recipe, as in 0.3.156. What is logged: the meal as today's dinner on Today, eaten at 18:00, all of it, 563 kcal; your taste, Good; and the cook on the recipe (Your cooks, Every time you ate it). The Plate is empty again."); await shot(p, "r_7"); }

    // DT308.12: something is on the plate, and a new scan, photo or recipe comes
    if (want("x_a")) { const p = await open(); await thisPlate(p); await put(p, UNSET); await tapSel(p, ".add-more-open"); await noteAt(p, "The Plate with foods, as in 0.3.155. Here you tap + Add more to your plate.", ".add-more-open"); await shot(p, "x_a"); }
    if (want("x_b")) { const p = await open(); await openMore(p); await thisPlate(p); await put(p, UNSET); await tapSel(p, ".mp-button"); await noteAt(p, "Every way in sits here, as in 0.3.155. Here you tap Photo or scan.", ".add-more"); await shot(p, "x_b"); }
    if (want("x_c")) { const p = await open({ looking: false }); await toCam(p); await p.evaluate((TAP) => { document.querySelector("#camera-shutter-button").style.cssText += ";" + TAP; }, TAP); await camShot(p, "x_c"); }
    if (want("x_d")) { const p = await open({ looking: false }); await toCam(p); await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(700); await p.evaluate((TAP) => { document.querySelector(".cam-analyze").style.cssText += ";" + TAP; }, TAP); await camShot(p, "x_d"); }
    if (want("x_e")) { const p = await open({ looking: false }); await toPhoto(p); await put(p, UNSET); await tapSel(p, ".pa-go .pill"); await noteAt(p, "The photo screen with its warning, as in 0.3.152. The question comes after the read, because only then the app can say what would join. The meal line does not change. Here you tap Read the plate.", ".warn-box"); await shot(p, "x_e"); }
    if (want("x_f")) { const p = await open({ looking: false }); await toAsk(p); await askSays(p); await tapBtn(p, "^Add to my plate$"); await noteTop(p, "The one question, on a screen of its own, as in 0.3.152: what is on your plate, what the photo holds, Add to my plate or Start a new plate. New: the last line says where the old plate goes. Here you tap Add to my plate."); await shot(p, "x_f"); }
    if (want("x_g")) { const p = await joined({}); await thisPlate(p); await put(p, UNSET); await noteAt(p, "New: you land on the Plate with foods, the one landing, not on a read. The photo's foods joined yours, marked ~ as estimates. The top shows the foods' name, now with the new foods. The meal line is as it was: not set. No Did you eat it?.", "#hx", "afterend"); await shot(p, "x_g"); }
    // an older photo, on a plate whose meal is set
    if (want("x_h")) { const p = await open({ looking: false }); await openMore(p); await put(p, SETD); await tapSel(p, ".mp-button"); await noteAt(p, "This plate has its meal set: Sunday's dinner. Here you tap Photo or scan.", ".add-more"); await shot(p, "x_h"); }
    if (want("x_i")) { const p = await open({ looking: false }); await toCam(p); await p.evaluate((TAP) => { const b = [...document.querySelectorAll("button")].find((x) => /Your photos/.test(x.innerText || x.getAttribute("aria-label") || "")); b.style.cssText += ";" + TAP; }, TAP); await camShot(p, "x_i"); }
    if (want("x_j")) { const p = await open({ looking: false }); await toPhoto(p, true); await put(p, SETD); await tapSel(p, ".pa-go .pill"); await noteAt(p, "An older photo, from Saturday 15:57. New: the photo's day and time do not move the meal line. The plate keeps the meal you set. Here you tap Read the plate.", ".warn-box"); await shot(p, "x_j"); }
    if (want("x_k")) { const p = await open({ looking: false }); await toAsk(p, true); await askSays(p); await tapBtn(p, "^Add to my plate$"); await noteTop(p, "The same question. Here you tap Add to my plate."); await shot(p, "x_k"); }
    if (want("x_l")) { const p = await joined({ looking: false }); await put(p, SETD); await noteAt(p, "The fault of 0.3.152, solved: the photo's time did not take the plate over. The meal line still says Sunday's dinner, and nothing asks Did you eat it? for Saturday. The photo's foods joined, marked ~.", "#hx", "afterend"); await shot(p, "x_l"); }
    // Start a new plate
    if (want("x_m")) { const p = await open({ looking: false }); await toAsk(p); await askSays(p); await tapBtn(p, "^Start a new plate$"); await noteTop(p, "The same question. This photo is another meal: here you tap Start a new plate."); await shot(p, "x_m"); }
    if (want("x_n")) { const p = await open({ looking: false }); await toAsk(p); await p.getByRole("button", { name: "Start a new plate" }).click(); await p.waitForTimeout(900); await put(p, UNSET);
      await p.evaluate(({ mark }) => { const w = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT); const ns = []; let n; while ((n = w.nextNode())) ns.push(n);
        ns.forEach((n) => { if (n.parentElement.closest("#hx")) return; const t = n.nodeValue; if (t.trim() === "Dinner") n.nodeValue = "This plate"; else if (/Main dish of your dinner/.test(t)) { let e = n.parentElement; e.style.display = "none"; } else n.nodeValue = t.replace("a full dinner for your day", "a full meal for your day"); });
        const q = document.querySelector(".rv-q.rv-eat"), go = document.querySelector(".rv-go"); if (go) go.style.display = "none";
        q.innerHTML = `<small class="pa-row-q">What do you do with it?</small><div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px">${["Save it", "Plan it", "Ate it"].map((t) => `<button type="button" class="pill pill-small" style="height:44px;min-height:44px;padding:0 16px">${t}</button>`).join("")}</div>`;
        const m = document.createElement("div"); m.id = "parked"; m.style.cssText = "background:#dae6fb;color:#123a7a;border-radius:14px;padding:12px 16px;font-size:14px;line-height:1.4;margin:0 0 12px;" + mark; m.textContent = "Skyr, Oats & Banana is in Saved for later."; document.querySelector("#hx").insertAdjacentElement("afterend", m); }, { mark });
      await noteAt(p, "New: the old plate is not thrown away. It is parked in Saved for later, and the message says so. The new plate holds only the photo's foods and starts with no meal set. It is a photo, so you are on its read, which ends with What do you do with it? (DT308.4).", "#parked", "afterend"); await shot(p, "x_n"); }
    if (want("x_o")) { const p = await open({ looking: false }); await p.waitForTimeout(600);
      await p.clock.setSystemTime(new Date("2026-11-15T23:30:00+01:00")).catch((e) => console.log("clock", String(e).slice(0, 80))); await p.reload(); await p.waitForTimeout(1800);
      const sv = p.locator("main button").filter({ hasText: /^Save for later$/ }).first(); console.log("save for later button:", await sv.count());
      if (await sv.count()) { await sv.click(); await p.waitForTimeout(1000); }
      console.log("later:", (await p.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 300));
      await p.evaluate((mark) => { document.querySelectorAll(".toast").forEach((x) => x.remove()); const l = document.querySelector(".later-list"); if (l) (l.closest("section") || l).style.cssText += ";" + mark; }, mark);
      await put(p, UNSET); await noteTop(p, "Where it is: Saved for later, on the empty Plate, as in 0.3.156. Continue puts it back on the Plate."); await shot(p, "x_o"); }
    // a barcode or a label
    if (want("x_q")) { const p = await open(); await toCam(p); await p.evaluate((TAP) => { const b = [...document.querySelectorAll("button")].find((x) => (x.innerText || "").trim() === "Barcode"); b.style.cssText += ";" + TAP; }, TAP); await camShot(p, "x_q"); }
    if (want("x_r")) { const p = await open(); await toCam(p); await p.getByRole("button", { name: /^Barcode$/ }).click(); await p.waitForTimeout(500); await p.locator('input[aria-label^="Type t"]').fill("4006040000001"); await p.evaluate((TAP) => { const b = [...document.querySelectorAll("button")].find((x) => (x.innerText || "").trim() === "Look up"); b.style.cssText += ";" + TAP; }, TAP); await camShot(p, "x_r"); }
    if (want("x_s")) { const p = await open(); await toCam(p); await p.getByRole("button", { name: /^Barcode$/ }).click(); await p.waitForTimeout(500); await p.locator('input[aria-label^="Type t"]').fill("4006040000001"); await p.keyboard.press("Enter"); await p.waitForTimeout(1500);
      await thisPlate(p); await put(p, UNSET); await noteAt(p, "As today: a barcode or a label brings one food, and it joins the plate. No question is asked for one food. The message says what was added. The meal line does not change.", "#hx", "afterend"); await shot(p, "x_s", true); }
    // a recipe from Recipe photo or Recipe link
    const toLink = async (p, upTo) => { await openMore(p); if (upTo >= 1) { await p.locator(".add-more").getByRole("button", { name: "Recipe link" }).click(); await p.waitForTimeout(500); await p.locator("main input[type=url]").fill("https://www.kitchenstories.com/en/recipes/margherita-pizza"); } if (upTo >= 2) { await p.getByRole("button", { name: "Read it" }).click(); await p.waitForTimeout(1500); } };
    if (want("x_t")) { const p = await open(); await toLink(p, 0); await thisPlate(p); await put(p, UNSET); await tapBtn(p, "^Recipe link$"); await noteAt(p, "Here you tap Recipe link. Recipe photo goes the same way.", ".add-more"); await shot(p, "x_t"); }
    if (want("x_u")) { const p = await open(); await toLink(p, 1); await put(p, UNSET); await tapBtn(p, "^Read it$"); await noteTop(p, "The link is in, as in 0.3.155. Here you tap Read it."); await shot(p, "x_u"); }
    if (want("x_v")) { const p = await open(); await toLink(p, 2); await put(p, UNSET); await tapBtn(p, "^Put it on my plate$"); await noteTop(p, "What Chef Mealan read, as in 0.3.155. Here you tap Put it on my plate."); await shot(p, "x_v"); }
    if (want("x_w")) { let ASKQ = ""; { const q = await open({ looking: false }); await toAsk(q); ASKQ = await q.evaluate(() => { const m = document.querySelector("main"); return [...m.children].filter((e) => !e.matches(".step-head, .plan-line, nav")).map((e) => e.outerHTML).join(""); }); await q.context().close(); }
      const p = await open(); await toLink(p, 2);
      await p.evaluate(({ h, mark, TAP }) => { const m = document.querySelector("main"); [...m.children].forEach((e) => { if (!e.matches("nav")) e.remove(); }); m.insertAdjacentHTML("afterbegin", `<div id="rask" style="${mark};padding:2px">${h}</div>`);
        const box = document.getElementById("rask"); box.querySelectorAll("img").forEach((x) => x.remove());
        const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT); let n; const rep = [[/and your photo brings new foods/, "and the recipe brings its own foods"], [/The photo holds .*/, "The recipe is Margherita pizza: 5 foods, for 2 pizzas."], [/^Remove the photo$/, "Cancel"], [/Add them to your plate, or start a new plate\?/, "Add it to your plate, or start a new plate?"], [/Add to my plate: the new foods join yours, marked ~, and the plate keeps its name\./, "Add to my plate: the recipe joins your foods as one dish, and the plate keeps its name."], [/Start a new plate: only the new foods\./, "Start a new plate: only the recipe. Skyr, Oats & Banana goes to Saved for later, so nothing is lost."]];
        while ((n = w.nextNode())) for (const [a, b] of rep) if (a.test(n.nodeValue.trim())) n.nodeValue = n.nodeValue.trim().replace(a, b);
        const bt = [...box.querySelectorAll("button")].find((x) => x.innerText.trim() === "Add to my plate"); if (bt) bt.style.cssText += ";" + TAP; }, { h: ASKQ, mark, TAP });
      await noteTop(p, "New: today the recipe takes the plate's place with no question. Now it asks the same question, in the same look as for a photo. Here you tap Add to my plate."); await shot(p, "x_w"); }
    if (want("x_x")) { const p = await open({ foods: [] , looking: false }); 
      await p.locator(".plate-card").getByRole("button", { name: "Recipe link" }).click(); await p.waitForTimeout(500); await p.locator("main input[type=url]").fill("https://www.kitchenstories.com/en/recipes/margherita-pizza"); await p.getByRole("button", { name: "Read it" }).click(); await p.waitForTimeout(1500); await p.getByRole("button", { name: "Put it on my plate" }).click(); await p.waitForTimeout(1200);
      for (const n of ["Skyr", "Oats", "Banana"]) { await (await require(ROOT + "/tests/flows/more.cjs")(p)).fill(n); await p.waitForTimeout(400); await p.locator(".row-food").filter({ hasText: n }).first().getByRole("button", { name: /Add/ }).click(); await p.waitForTimeout(700); }
      const x = p.locator(".add-more-top button, .add-more .icon").first(); if (await x.count()) { await x.click(); await p.waitForTimeout(300); }
      await p.evaluate(() => { const k = "platemate-pilot-v1", s = JSON.parse(localStorage.getItem(k)); const mine = (i) => /^(Skyr|Oats|Banana)/.test(i.food.name); const m = (s.meals || []).find((x) => x.title === "Margherita pizza"); const id = m ? m.id : "mz";
        s.items = [...s.items.filter(mine).map((i) => ({ ...i, dish: undefined })), ...s.items.filter((i) => !mine(i)).map((i) => ({ ...i, dish: { id, title: "Margherita pizza", of: 1, n: 1, base: i.grams } }))]; s.title = ""; s.fromRecipe = undefined; s.openRecipe = undefined; localStorage.setItem(k, JSON.stringify(s)); });
      await p.reload(); await p.waitForTimeout(1500); await p.locator(".plan-line-pen").click(); await choice(p, "Just looking"); await p.locator(".plan-line-done").click(); await p.waitForTimeout(400);
      await p.evaluate(() => { document.querySelectorAll(".toast").forEach((x) => x.remove()); const e = [...document.querySelectorAll("main section, main .card")].filter((x) => /Olive oil is an ingredient/.test(x.textContent)).pop(); if (e) e.style.display = "none"; }); await thisPlate(p); await put(p, UNSET);
      console.log("x_x:", (await p.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 500));
      await noteAt(p, "You land on the Plate with foods. Your three foods stay, and the recipe joined as one dish, one row with its name and weight and its foods under it (as built in 0.3.155). The meal line is as it was: not set.", "#hx", "afterend"); await shot(p, "x_x"); }
  } finally { await b.close(); server.kill(); }
})();
