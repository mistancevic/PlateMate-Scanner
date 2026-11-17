// Board DT308, the three frames the meal model still missed (Coach Milan 17 November 22:33 and 23:41):
// the calendar behind the pencil with What is it? and the occasion under the meals; Fit to my target with no meal set;
// Plan it on a plate without a photo. Drawn on the app as built in 0.3.156: a plate with no meal set is drawn on
// Just looking, the mode in which nothing is counted today.
const ROOT = process.env.ROOT || "/home/claude/platemate-scanner";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const PORT = "3553", U = `http://127.0.0.1:${PORT}`, R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs";
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.items = []; seed.meals = []; seed.feedback = []; seed.title = "";
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", TAP = "outline:4px solid #f0a81c;outline-offset:2px";
const NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`;
const PEN = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
const day = (d) => `<button type="button" style="flex:none;min-height:44px;padding:0 12px;border-radius:12px;border:1.5px solid ${d.on ? "#2a72d9" : "#c9d6ee"};background:${d.on ? "#e3edff" : "#fff"};color:${d.on ? "#1f4fa3" : "#3a4a66"};font:inherit;font-size:14px;font-weight:700;white-space:nowrap">${d.t}</button>`;
const rw = (r) => `<button type="button" style="display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:48px;padding:0 12px;margin:0;border:0;border-top:1px solid #dfe7f5;background:#fff;font:inherit;text-align:left;${r.tap ? "box-shadow:inset 0 0 0 4px #f0a81c" : ""}"><b style="font-size:15px;color:#172742">${r.m}</b><span style="font-size:13px;color:#5b6b85">${r.s}</span></button>`;
const cal = (days, rows) => `<div style="margin:10px 0 0"><div style="display:flex;gap:6px;overflow:hidden">${days.map(day).join("")}</div><div style="margin:10px 0 0;border:1.5px solid #c9d6ee;border-radius:14px;overflow:hidden;background:#fff">${rows.map(rw).join("").replace("border-top:1px solid #dfe7f5", "border-top:0")}</div></div>`;
const DAYS = (on) => [["Sat 14", "sat"], ["Sun 15, today", "sun"], ["Mon 16", "mon"], ["Tue 17", "tue"], ["More", "more"]].map(([t, k]) => ({ t, on: k === on }));
const SUN = (tap) => [{ m: "Breakfast", s: "07:30 · not eaten" }, { m: "Lunch", s: "13:45 · not eaten" }, { m: "Dinner", s: "20:00 · next" }, { m: "Snack", s: "now" }].map((r) => ({ ...r, tap: r.m === tap }));
const MON = (tap) => [{ m: "Breakfast", s: "07:30 · nothing planned" }, { m: "Lunch", s: "13:45 · nothing planned" }, { m: "Dinner", s: "20:00 · nothing planned" }, { m: "Snack", s: "" }].map((r) => ({ ...r, tap: r.m === tap }));
// the meal line as drawn in DT308.1: grey with a pencil when not set; dark with an X once set
const HX = (o) => `<div id="hx" style="margin:0 0 12px;padding:2px 0;${mark}"><div style="display:flex;align-items:center;gap:10px"><div style="flex:1;min-width:0"><b style="display:block;font-size:${o.grey ? 17 : 19}px;line-height:1.3;color:${o.grey ? "#8f9bb0" : "#172742"}">${o.line}</b>${o.l2 ? `<div style="font-size:15px;line-height:1.4;color:#172742">${o.l2}</div>` : ""}${o.small ? `<div style="font-size:13px;line-height:1.4;color:#5b6b85">${o.small}</div>` : ""}</div><span style="flex:none;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;color:#3a4a66;font-size:22px;${o.open ? "background:#e3edff;" : ""}${o.tapPen ? TAP : ""}">${o.x ? "✕" : PEN}</span></div>${o.open || ""}</div>`;
const UNSET = { line: "Meal and day not set", grey: true };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const choice = async (p, t) => { await p.locator("main .choice").filter({ hasText: new RegExp("^\\s*(✓\\s*)?" + t + "(,.*)?\\s*$") }).first().click(); await p.waitForTimeout(400); };
  // the Plate with foods from the list; looking: no meal set (Just looking today)
  const open = async (o = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage(); p.on("pageerror", (e) => console.log("ERR", e.message));
    await p.clock.install({ time: new Date("2026-11-15T18:00:00+01:00") });
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", betterAs: "meal", holds: "" }) }));
    await p.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
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
    { const p = await open({ looking: false }); await p.locator(".plan-line-pen").click(); await p.waitForTimeout(400);
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
    { const p = await open(); await thisPlate(p); await put(p, { ...UNSET, open: cal(DAYS("sun"), SUN("")) + ask() }); await dress(p, "Regular meal", null, "Before training");
      await noteAt(p, "Your calendar opens: the days, then today's meals. New: under the meals stand the two questions that are behind the pencil today, What is it? and Chef Mealan's What kind of moment?, as they are. A tap on a meal sets it and closes. A tap on one of these chips keeps the calendar open. Here you tap Before training.", "#hx"); await shot(p, "m_2"); }
    { const p = await open(); await thisPlate(p); await put(p, { ...UNSET, open: cal(DAYS("sun"), SUN("Dinner")) + ask() }); await dress(p, "Before training", "Energy that's easy to take in. Keep fat and fibre low.", null);
      await noteAt(p, "Before training is chosen, and the calendar is still open. Here you tap Dinner.", "#hx"); await shot(p, "m_3"); }
    { const p = await open({ looking: false }); await p.locator(".plan-line-pen").click(); await choice(p, "Dinner"); await choice(p, "Before training"); await p.locator(".plan-line-done").click(); await p.waitForTimeout(500);
      await put(p, { line: "Dinner", l2: "Sunday, 15 November, 20:00", small: "Before training", x: true });
      await noteAt(p, "Set and closed. The line says the meal, the day and the time, and under it the moment. The plate below is now sized for this dinner before training, as in 0.3.156. X clears the meal and the day.", "#hx"); await shot(p, "m_4"); }

    // DT308.10: Fit to my target with no meal set
    { const p = await open({ foods: ["Oats", "Banana", "Skyr"], set: ["Skyr", 30] }); await thisPlate(p); await put(p, UNSET); await tapSel(p, ".fit-top");
      await noteAt(p, "No meal is set. The plate is under your PD target, so Fit to my target is filled. Here you tap it.", ".fit-top"); await shot(p, "f_1"); }
    { const p = await open({ foods: ["Oats", "Banana", "Skyr"], set: ["Skyr", 30] }); await p.locator(".fit-top").click(); await p.waitForTimeout(1200); await thisPlate(p); await put(p, UNSET);
      await noteAt(p, "Fit aimed only at your PD target, 4.8: it raised the skyr and kept your other foods. With no meal set there is no meal size to reach, so the energy is what the foods give. The result says This plate. Chef Mealan's line says what Fit did, with Undo.", ".fit-top"); await shot(p, "f_2"); }

    // DT308.11: Plan it on a plate without a photo
    const END = (o) => `<div id="endq" class="pa-row rv-q" style="margin:14px 0 0;${mark}"><small class="pa-row-q">What do you do with it?</small><div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px">${["Save it", "Plan it", "Ate it"].map((t) => `<button type="button" class="pill pill-small" style="height:44px;min-height:44px;padding:0 16px;${o.tap === t ? TAP : ""}${o.on === t ? "background:#e3edff;border-color:#2a72d9;" : ""}">${t}</button>`).join("")}</div>${o.cal ? `<div style="margin:10px 0 0"><div style="font-size:14px;font-weight:700;color:#172742">Which day and meal?</div>${o.cal}</div>` : ""}</div>`;
    const end = (p, o) => p.evaluate((h) => { document.querySelector(".prepare-it").insertAdjacentHTML("afterend", h); }, END(o));
    { const p = await open(); await thisPlate(p); await put(p, UNSET); await end(p, { tap: "Plan it" });
      await noteAt(p, "New: a plate without a photo ends with the same question as a read: What do you do with it? Here you tap Plan it.", "#endq"); await shot(p, "p_1"); }
    { const p = await open(); await thisPlate(p); await put(p, UNSET); await end(p, { on: "Plan it", cal: cal(DAYS("mon"), MON("Lunch")) });
      await noteAt(p, "Your calendar opens right under the button, on tomorrow, with nothing marked. Here you tap Lunch.", "#endq"); await shot(p, "p_2"); }
    { const p = await open({ looking: false }); await p.locator(".plan-line-pen").click(); await choice(p, "Tomorrow"); await choice(p, "Lunch"); await p.locator(".plan-line-done").click(); await p.waitForTimeout(400);
      await p.locator("main button").filter({ hasText: /^Put it in/ }).first().click(); await p.waitForTimeout(1200);
      console.log("plate after planning:", await p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.length), "foods"); await p.locator("main button").filter({ hasText: /^Mon 16/ }).first().click(); await p.waitForTimeout(700);
      await p.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE + ";margin:64px 0 10px"; d.textContent = t; document.querySelector("main").insertAdjacentElement("afterbegin", d); }, { t: "Planned with that one tap: you are on Plan, on Monday, and the plate is its lunch. The message and the screen are those of 0.3.156. New: Plan opens on the day you planned for, not on today. Nothing is counted, and no Did you eat it? is asked. The Plate is empty again.", NOTE });
      await shot(p, "p_3", true); }
  } finally { await b.close(); server.kill(); }
})();
