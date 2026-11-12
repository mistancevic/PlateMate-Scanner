// DT247 (0.3.96, board Stories183; Coach Milan 6 November, "Ok. A. We will test it", Go 12:24): two dishes in one meal.
// A second photo soon after a meal asks once: Dessert to your dinner, or its own snack; within an hour Dessert is the main
// button. One meal, two dishes: each keeps its own photo and foods; the meal adds them up; tap a dish to work on it, and a
// change goes to that dish only. Fit to my target works on the dish you are on and counts the other as it is.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/pm290", PORT = "3493", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync("/home/claude/pm290/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.meals = []; seed.items = [];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "estimate", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const CAKE = { dish: "Brownie cheesecake", foods: [{ name: "Brownie cheesecake", grams: 110, low: 90, high: 140, calories: 380, protein: 6, fats: 24, carbs: 36, fiber: 1, confidence: "medium" }], unsure: null };
const day = (h, m) => new Date(2026, 10, 6, h, m).toISOString();
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync("/home/claude/pm290/tests/flows/plate.jpg").toString("base64");
const SALAD = [["r1", F("ch", "Chicken thigh, grilled", 209, 26, 11, 0), 120], ["r2", F("cu", "Cucumber", 15, 0.7, 0.1, 3.6), 120], ["r3", F("fe", "Feta cheese", 264, 14, 21, 4), 40]].map(([id, food, grams]) => ({ id, food, grams, locked: false }));
const DINNER = { date: "2026-11-06", slotId: "dinner", name: "Dinner", time: "20:00" };
const salad = (at) => ({ id: "salad", meal: { id: "ms", title: "Chicken salad with feta", items: SALAD, portion: 280, savedAt: at }, status: "eaten", taste: "", notes: "", createdAt: at, slot: DINNER, photo: PHOTO, photos: [PHOTO] });
const cakeCard = { id: "cake", meal: { id: "mc", title: "Brownie cheesecake", items: [{ id: "k1", food: F("bc", "Brownie cheesecake", 380, 6, 24, 36), grams: 110, locked: false }], portion: 110, savedAt: day(19, 55) }, status: "eaten", taste: "", notes: "", createdAt: day(19, 55), slot: DINNER, course: "dessert" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"], ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (state, { clock = day(20, 0) } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "en-GB", timezoneId: "Europe/Berlin", permissions: ["camera"] });
    const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message)); await p.clock.setFixedTime(new Date(clock));
    await p.addInitScript(({ s }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { s: state });
    await require("/home/claude/pm290/tests/flows/adult.cjs")(p);
    for (const r of ["cover", "dish", "meal", "members/foods**"]) await p.route(`**/api/${r}`, (x) => x.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CAKE) }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1600);
    if (/could not be read/.test(await p.locator("body").innerText())) throw new Error("the seed is not a valid state");
    return p;
  };
  const photo = async (p) => { await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(400); if (await p.locator(".cam-analyze").count()) await p.locator(".cam-analyze").click(); await p.waitForTimeout(2500); };
  const saved = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1") || "{}"));
  const main = (p) => p.locator("main").innerText();
  const text = async (l) => ((await l.count()) ? (await l.first().innerText()).replace(/\s+/g, " ") : "none");
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
  const note = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement("beforebegin", d); }, { t, NOTE, sel });
  const markEl = (p, sel) => p.evaluate(({ sel, mark }) => { for (const e of document.querySelectorAll(sel)) e.style.cssText += ";" + mark; }, { sel, mark });
  const shot = async (p, name, sel, off = 300) => { await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); document.querySelectorAll(".chat-fab").forEach((x) => (x.style.visibility = "hidden")); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const W = "background:#fff;border:1.5px solid #2a72d9;color:#1f5fc7;font-weight:700", RED = "background:#fff;border:1.5px solid #b3261e;color:#b3261e;font-weight:700", BLUE = "background:#2a72d9;border:1.5px solid #2a72d9;color:#fff;font-weight:700";
  const F2 = "font-family:Nunito,system-ui,sans-serif;color:#172742";
  try {
    // a: now, the second photo asks two answers, both hers
    let p = await open({ ...seed, feedback: [salad(day(19, 59))] }); await photo(p);
    await markEl(p, ".dish-ask"); await note(p, "Now (0.3.144): a second photo right after a meal asks Dessert or its own snack. Both mean you ate it. A friend's plate has no answer.", ".dish-ask");
    await shot(p, "r278a", ".dish-ask", 260);
    // b: new, a third answer
    p = await open({ ...seed, feedback: [salad(day(19, 59))] }); await photo(p);
    await p.evaluate(({ W, BLUE }) => { const g = document.querySelector(".dish-ask .ca-go"); const bs = [...g.querySelectorAll("button")]; bs[1].style.cssText += ";" + W; g.insertAdjacentHTML("afterbegin", `<button class="pill" style="min-height:48px;${W}">Don't count it</button>`); g.appendChild(bs[0]); g.style.cssText += ";display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end";
      for (const e of document.querySelectorAll(".dish-ask *")) if (e.children.length === 0 && /or its own snack\?$/.test(e.textContent.trim())) e.textContent = e.textContent.replace(/, or its own snack\?$/, ", its own snack, or don't count it?"); }, { W, BLUE });
    await markEl(p, ".dish-ask"); await note(p, "New: a third answer, Don't count it: a plate that is not your meal, whoever ate it. Dessert, the main one when it comes soon after, stays on the right.", ".dish-ask");
    await shot(p, "r278b", ".dish-ask", 260);
    // c: now, the read plate: coached as hers, Not mine a small link that throws it away
    p = await open({ ...seed, feedback: [salad(day(19, 59))] }); await photo(p);
    await p.locator(".dish-ask .ca-go button").nth(1).click(); await p.waitForTimeout(1200);
    await p.evaluate((mark) => { const nm = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Not mine"); nm.id = "notmine"; nm.style.cssText += ";" + mark; const row = nm.parentElement; row.id = "eatrow"; }, mark);
    await note(p, "Now: Not mine is a small link. It empties the plate and says nothing. Above it, Chef Mealan coaches the plate as yours.", "#eatrow");
    await shot(p, "r278c", "#eatrow", 380);
    // d: new, someone else's plate: its numbers, whose, share; kept under Served; no coaching
    p = await open({ ...seed, feedback: [salad(day(19, 59))] }); await photo(p);
    await p.locator(".dish-ask .ca-go button").nth(1).click(); await p.waitForTimeout(1200);
    await p.evaluate(({ RED, BLUE, W, F2, mark }) => {
      const nm = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Not mine"); const row = nm.parentElement;
      // the coaching and Fit go: it is not your plate
      const coach = [...document.querySelectorAll("main *")].filter((e) => /Eat it as it is/.test(e.textContent) && e.children.length <= 2).pop(); if (coach) coach.innerHTML = "<b>Chef Mealan:</b> about 420 kcal and 7 g protein on this plate. Not counted in your day.";
      const fit = [...document.querySelectorAll("button")].find((x) => /Fit to my target/.test(x.textContent)); if (fit) { fit.style.display = "none"; const n = fit.nextElementSibling; if (n && n.tagName === "SMALL") n.style.display = "none"; }
      const up = [...document.querySelectorAll("main *")].find((e) => e.children.length === 0 && /^Your plate is .* under/.test(e.textContent.trim())); if (up) { let box = up.parentElement; while (box && !/Chicken breast/.test(box.innerText)) box = box.parentElement; if (box) box.style.display = "none"; }
      for (const e of document.querySelectorAll("main *")) if (e.children.length === 0 && /^One product: Chef Mealan looks/.test(e.textContent.trim())) e.style.display = "none";
      row.id = "eatrow"; row.innerHTML = `<div style="width:100%;${F2}"><div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><span style="background:#2a72d9;color:#fff;border-radius:999px;padding:2px 10px;font-weight:700;font-size:13px">Not counted in your day</span></div>
        <div style="display:flex;gap:10px;margin-top:8px"><button class="pill" style="flex:1;min-height:48px;${W}">Share the numbers</button><button class="pill" style="flex:1;min-height:48px;${BLUE}">Keep it ›</button></div>
        <button class="pill pill-wide" style="margin-top:10px;min-height:48px;${RED}">Don't keep it</button>
        <small style="display:block;margin-top:8px;font-size:13.5px;color:#53627f;line-height:1.45">Keep it saves it with the day, in Recipes under Served, and clears the Plate for your next one. A name is yours to add, never asked.</small></div>`;
      row.style.cssText += ";" + mark; }, { RED, BLUE, W, F2, mark });
    await note(p, "New: after Don't count it, the plate shows its numbers and says it is not counted. No coaching, no Fit. Keep it saves it with the day and clears the Plate; Don't keep it is its own button.", "#eatrow");
    await shot(p, "r278d", "#eatrow", 560);
    // e: new, the visit is found from the day
    p = await open({ ...seed, feedback: [salad(day(19, 30))] }, { clock: day(21, 0) }); await p.goto(U + "/today"); await p.waitForTimeout(1500);
    await p.evaluate(({ W, F2, mark }) => { const c = document.querySelector(".meals-card"); const add = [...c.querySelectorAll("button")].find((x) => /Log a meal/.test(x.textContent));
      const html = `<button id="visit" class="menu-row" style="display:flex;align-items:center;width:100%;min-height:56px;text-align:left;background:#eef4ff;border:1.5px solid #c9d6ee;border-radius:12px;padding:10px 12px;margin:8px 0;${F2}"><span style="flex:1"><b style="display:block;font-size:15px">Not counted: 2 plates</b><small style="font-size:13.5px;color:#53627f">Meatballs in tomato sauce · Chocolate cake</small></span><span style="font-size:22px;color:#1f5fc7">›</span></button>`;
      (add || c.lastElementChild).insertAdjacentHTML("beforebegin", html); document.querySelector("#visit").style.cssText += ";" + mark; }, { W, F2, mark });
    await note(p, "New: the plates you kept but did not count are on their day: Today here, and that day in Plan and in Earlier. A tap opens them.", "#visit");
    await shot(p, "r278e", "#visit", 340);
    // f: new, the Plate's own choice: Just looking, in place of Exploring
    p = await open({ ...seed, feedback: [] }); await p.locator(".plan-line").first().click(); await p.waitForTimeout(700);
    const ex = await p.evaluate((mark) => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Exploring"); if (!b) return false; b.textContent = "Just looking"; b.id = "justlooking"; b.style.cssText += ";" + mark; for (const e of document.querySelectorAll("b, strong")) if (/^Exploring:/.test(e.textContent.trim())) e.textContent = "Just looking:"; return true; }, mark);
    console.log("exploring found", ex);
    if (ex) { await note(p, "New: Exploring becomes Just looking (Samo gledam, Nur mal schauen): a dish you are curious about. It no longer sounds like the Explorer tab.", "#justlooking"); await shot(p, "r278f", "#justlooking", 380); } else await p.context().close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
