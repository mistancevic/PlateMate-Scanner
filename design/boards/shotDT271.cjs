// Board DT271 (Coach Milan 10 November 19:02 to 20:12): whose plate is it. A kept plate says whose it is, and a tap changes it.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3714", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.meals = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "estimate", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(ROOT + "/tests/flows/plate.jpg").toString("base64");
const at = new Date(2026, 10, 10, 13, 0).toISOString();
const mk = (rows, pre) => rows.map(([g, n, c, p, f, cb], k) => ({ id: pre + k, grams: g, locked: false, fromPhoto: true, est: { low: Math.round(g * 0.8), high: Math.round(g * 1.25) }, food: F(pre + "f" + k, n, c, p, f, cb) }));
const meat = mk([[150, "Meatballs, beef and pork", 240, 17, 17, 5], [95, "Mashed potato", 110, 2, 4, 16]], "a");
const ques = mk([[90, "Flour tortilla", 310, 8, 8, 50], [80, "Chicken, grilled", 165, 31, 3.6, 0]], "b");
const served = [{ id: "s2", name: "Chicken quesadilla", dish: "main", mine: true, at, visit: "v1", items: ques, photo: PHOTO }, { id: "s1", name: "Meatballs in tomato sauce", dish: "main", mine: true, at, visit: "v1", items: meat, photo: PHOTO }];
const state = { ...seed, served, items: ques, title: "Chicken quesadilla", pick: "exploring", plateAt: at, photo: { image: PHOTO, at, who: "idea", unsure: null, which: null, served: { id: "s2", mine: true, visit: "v1", dish: "main" } } };
const WHOSE = (on) => `<div class="whose" style="${mark};padding:8px;margin:2px 0"><small style="display:block;font-size:12.5px;font-weight:800;color:#53627f;text-transform:uppercase;letter-spacing:.04em">Whose plate</small><div style="display:flex;gap:6px;margin-top:6px">${["Mine", "Someone else's"].map((t, i) => `<button class="pill pill-small" style="min-height:44px;${i === on ? "background:#172742;color:#fff;border-color:#172742" : ""}">${t}</button>`).join("")}</div></div>`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (st, tab) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date(2026, 10, 10, 13, 20));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, st);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", better_as: "" }) }));
    await p.goto(U + "/"); await p.waitForTimeout(900); await p.locator("nav button").filter({ hasText: tab }).click(); await p.waitForTimeout(1300); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel) => { await p.evaluate((sel) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - 90 : 0); }, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  // a. now: the Plate's Served card
  let p = await open(state, "Plate");
  await note(p, "Now (0.3.123), the Plate, the Served card: nothing says whose plate it is. The first plate you scan counts as yours. A friend's plate scanned first lands in your meal.", ".sv-plate");
  await shot(p, "rdt271a", ".bnote");
  // b. new: the Plate's Served card says whose
  p = await open(state, "Plate");
  await p.evaluate((html) => { document.querySelector(".sv-plate .sv-head").insertAdjacentHTML("afterend", html); }, WHOSE(1));
  await note(p, "New, the Plate, the Served card: Whose plate, Mine or Someone else's, right under the head. One tap changes it. Here it was set to Someone else's.", ".sv-plate");
  await shot(p, "rdt271b", ".bnote");
  // c. new: Recipes, the visit after the change
  const moved = { ...state, items: [], photo: undefined, title: "", served: [{ ...served[0], mine: false, name: "Marko's quesadilla" }, served[1]] };
  p = await open(moved, "Recipes");
  await p.evaluate(({ mark }) => { const v = document.querySelector(".sv-visit"); if (v) v.style.cssText += ";" + mark; }, { mark });
  await note(p, "New, Recipes, the same visit: the plate moved from Mine to Others at the table, and Mine's total went down with it. Nothing else changed.", ".sv-visit");
  await shot(p, "rdt271c", ".bnote");
  // d. new: a Served plate open says whose
  p = await open(moved, "Recipes");
  await p.locator(".sv-row").filter({ hasText: "Marko" }).click(); await p.waitForTimeout(500);
  await p.evaluate((html) => { document.querySelector(".sv-one .sv-tags").insertAdjacentHTML("afterend", html); }, WHOSE(1));
  await note(p, "New, a Served plate opened from Recipes: the same two choices under its name. You can set it right days later.", ".sv-one .whose");
  await shot(p, "rdt271d", ".sv-back");
  await b.close(); server.kill();
})();
