// Board DT284 and its prototype (Coach Milan 12 November 07:55; a tester's meal recorded twice when she wanted to change it).
// A past meal can be changed and deleted; the rows of Every time you ate it open their meal. Writes rs/rdt284*.png and,
// for the prototype, proto284/<screen>.png with the tappable places in proto284/spots.json.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", PR = "/home/claude/boards/proto284", ROOT = "/home/claude/platemate-scanner", PORT = "3797", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const W = (n) => "data:image/webp;base64," + fs.readFileSync(`${ROOT}/public/landing/hero/${n}-m.webp`).toString("base64");
const PH = W("quesadilla");
const F = (id) => seed.foods.find((f) => f.id === id);
const it = (id, food, grams) => ({ id, food: F(food), grams, locked: false });
const meal = { id: "m-s", title: "Egg sandwiches", items: [it("a", "f-bread", 100), it("b", "f-egg", 184), it("c", "f-chicken", 40)], portion: 324, steps: ["Toast the bread.", "Slice the eggs.", "Fill the sandwiches."], savedAt: "2026-11-05T10:00:00Z", photo: PH, photos: [] };
const logged = { id: "c1", meal: { ...meal, items: [it("a1", "f-bread", 100), it("b1", "f-egg", 250), it("c1x", "f-chicken", 93)], portion: 443 }, recipeId: "m-s", status: "eaten", taste: "", notes: "", createdAt: "2026-11-11T09:08:00.000Z", photo: PH, coverAsk: "used" };
const twice = { id: "c2", meal: { ...meal, items: [it("a2", "f-bread", 50), it("b2", "f-egg", 92), it("c2x", "f-chicken", 20)], portion: 162 }, recipeId: "m-s", status: "eaten", taste: "DaaM good", notes: "", createdAt: "2026-11-11T20:13:00.000Z", photo: PH, prep: { went: "as" }, coverAsk: "used" };
const fixed = { ...logged, meal: { ...logged.meal, items: [it("a1", "f-bread", 50), it("b1", "f-egg", 92), it("c1x", "f-chicken", 20)], portion: 162 }, taste: "DaaM good", notes: "Changed on the call: half a portion." };
const spots = {};
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (cards, height = 844) => {
    const ctx = await b.newContext({ viewport: { width: 390, height }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-12T07:50:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { ...seed, meals: [meal], feedback: cards });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-s"); await p.waitForTimeout(1500); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const scrollTo = (p, sel, off = 90) => p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off });
  const shot = async (p, name, sel, tall) => { if (tall) await p.setViewportSize({ width: 390, height: tall }); await scrollTo(p, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
  // a prototype screen: scrolled to sel, the places named in hot (css selector -> next screen) recorded
  const proto = async (p, name, sel, hot, off = 90) => {
    await p.evaluate(() => document.querySelectorAll(".bnote").forEach((x) => x.remove()));
    await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
    const top = await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); return e ? Math.max(0, Math.round(e.getBoundingClientRect().top + window.scrollY - off)) : 0; }, { sel, off });
    const list = [];
    for (const [s, to] of hot) { const bb = await p.locator(s).first().boundingBox(); if (bb) list.push({ x: Math.round(bb.x), y: Math.round(bb.y), w: Math.round(bb.width), h: Math.round(bb.height), to }); else console.log("no spot", name, s); }
    await p.screenshot({ path: `${PR}/${name}.png`, fullPage: true });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    spots[name] = { top, h: H, spots: list }; console.log("proto", name, list.length, H);
  };
  // rows of Every time you ate it as buttons
  const rowsTap = (p) => p.evaluate((mark) => document.querySelectorAll(".rq-eats .re-row").forEach((r, i) => { r.style.cssText += ";cursor:pointer;" + mark; r.id = "eatrow" + i;
    const c = document.createElement("span"); c.textContent = "›"; c.style.cssText = "margin-left:auto;font-size:26px;font-weight:800;color:#1f5fc7;padding:0 6px"; r.appendChild(c); r.style.display = "flex"; r.style.alignItems = "center"; }), mark);
  // the meal page with Change it and Delete this meal
  const BTN = (sure) => `<div id="pm-new" style="display:flex;flex-direction:column;gap:10px;margin-top:14px;${mark};padding:8px">
    <button id="b-change" class="pill pill-primary pill-wide" style="min-height:48px">Change it</button>
    ${sure ? `<button id="b-sure" class="pill pill-wide" style="min-height:48px;background:#b3261e;color:#fff;border-color:#b3261e">Sure? Delete this meal</button><button id="b-keep" class="link" style="min-height:44px">Keep it</button>
      <small style="font-size:13px;color:#53627f;line-height:1.45">It leaves Wednesday, 11 November in Plan, this recipe's list and your coach's view. It can't be undone.</small>`
    : `<button id="b-del" class="link link-danger" style="min-height:44px">Delete this meal</button>`}</div>`;
  const mealPage = async (p, n, sure) => { await p.locator(".rc-photos .rc-photo").nth(n).click(); await p.waitForTimeout(700);
    await p.evaluate((html) => { const a = document.querySelector(".past-meal .pm-actions"); a.insertAdjacentHTML("afterend", html); }, BTN(sure)); };
  // the form: Change it
  const FORM = `<div id="pm-form" style="display:flex;flex-direction:column;gap:12px;${mark};padding:10px;font-family:Nunito,system-ui,sans-serif;color:#172742">
    <b style="font-size:18px">Change this meal</b><small style="font-size:13px;color:#53627f;line-height:1.45">Same meal, same time. Plan, this list and your coach see the change.</small>
    <b>How much did you eat?</b><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="choice on" style="min-height:44px;height:auto">Half a portion, 162 g</button><button class="choice" style="min-height:44px;height:auto">One portion, 324 g</button><button class="choice" style="min-height:44px;height:auto">As logged, 443 g</button></div>
    <b>How was it?</b><div style="display:flex;flex-wrap:wrap;gap:8px"><button class="choice on" style="min-height:44px;height:auto">DaaM good</button><button class="choice" style="min-height:44px;height:auto">Good</button><button class="choice" style="min-height:44px;height:auto">Not really</button></div>
    <b>Your words</b><textarea rows="2" style="font:inherit;font-size:15px;border:1.5px solid #c9d6ee;border-radius:12px;padding:8px">Changed on the call: half a portion.</textarea>
    <b>Photo</b><div style="display:flex;gap:10px;align-items:center"><img src="${PH}" style="width:64px;height:64px;object-fit:cover;border-radius:10px"><button class="pill pill-small" style="min-height:44px">Change the photo</button></div>
    <button id="b-save" class="pill pill-primary pill-wide" style="min-height:48px">Save changes</button><button id="b-cancel" class="link" style="min-height:44px">Cancel</button></div>`;
  const formPage = async (p, n = 0) => { await mealPage(p, n, false); await p.evaluate((html) => { document.querySelector("#pm-new").remove(); const a = document.querySelector(".past-meal .pm-actions"); a.style.display = "none"; document.querySelector(".pm-foods").insertAdjacentHTML("beforebegin", html); }, FORM); };

  // ---------- board ----------
  let p = await open([logged, twice], 1300); await scrollTo(p, ".rq-eats");
  await note(p, "Now, Recipes, the recipe page: the same meal twice. 10:08 was logged from a photo; 21:13 is the change she wanted, made through Cook it again. The rows can't be tapped.", ".rq-eats");
  await shot(p, "rdt284a", ".bnote", 1000); await p.context().close();
  p = await open([logged, twice], 1300); await p.locator(".rc-photos .rc-photo").nth(0).click(); await p.waitForTimeout(700);
  await note(p, "Now, a past meal opened from Your cooks (from Plan it says Cook it again). No way to change it or delete it.", ".past-meal", "afterbegin");
  await shot(p, "rdt284b", null, 1100); await p.context().close();
  p = await open([logged, twice], 1300); await rowsTap(p);
  await note(p, "New, the recipe page: each row of Every time you ate it opens its meal.", ".rq-eats");
  await shot(p, "rdt284c", ".bnote", 1000); await p.context().close();
  p = await open([logged, twice], 1300); await mealPage(p, 0, false);
  await note(p, "New, the past meal (from Plan, Your cooks or Every time you ate it): Change it, and Delete this meal.", ".past-meal", "afterbegin");
  await shot(p, "rdt284d", null, 1250); await p.context().close();
  p = await open([logged, twice], 1300); await formPage(p, 1);
  await note(p, "New, Change it: the amount, the taste, your words, the photo. Saved into the same meal at its own time: one record.", ".past-meal", "afterbegin");
  await shot(p, "rdt284e", null, 1750); await p.context().close();
  p = await open([logged, twice], 1300); await mealPage(p, 0, true);
  await note(p, "New, Delete this meal: Sure? first. The meal leaves its day in Plan, the recipe's lists and the coach's view together.", ".past-meal", "afterbegin");
  await shot(p, "rdt284f", null, 1450); await p.context().close();

  // ---------- prototype: Tester 2's case. Delete the double, then change the first one ----------
  p = await open([logged, twice]); await rowsTap(p); await proto(p, "p1-two", ".rq-eats", [["#eatrow0", "p2-meal2113"], ["#eatrow1", "p5-meal1008"]]); await p.context().close();
  p = await open([logged, twice]); await mealPage(p, 0, false); await proto(p, "p2-meal2113", null, [["#b-del", "p3-sure"], ["#b-change", "p6-form"], [".pm-back", "p1-two"]]); await p.context().close();
  p = await open([logged, twice]); await mealPage(p, 0, true); await proto(p, "p3-sure", "#pm-new", [["#b-sure", "p4-one"], ["#b-keep", "p2-meal2113"]], 300); await p.context().close();
  p = await open([logged]); await rowsTap(p); await proto(p, "p4-one", ".rq-eats", [["#eatrow0", "p5-meal1008"]]); await p.context().close();
  p = await open([logged]); await mealPage(p, 0, false); await proto(p, "p5-meal1008", null, [["#b-change", "p6-form"], [".pm-back", "p4-one"]]); await p.context().close();
  p = await open([logged]); await formPage(p); await proto(p, "p6-form", "#pm-form", [["#b-save", "p7-saved"], ["#b-cancel", "p5-meal1008"]], 70); await p.context().close();
  p = await open([fixed]); await mealPage(p, 0, false); await proto(p, "p7-saved", null, [[".pm-back", "p8-list"], ["#b-change", "p6-form"]]); await p.context().close();
  p = await open([fixed]); await rowsTap(p); await proto(p, "p8-list", ".rq-eats", [["#eatrow0", "p7-saved"]]); await p.context().close();
  fs.writeFileSync(`${PR}/spots.json`, JSON.stringify(spots, null, 1));
  await b.close(); server.kill();
})();
