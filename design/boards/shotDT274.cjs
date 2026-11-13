// Board DT274 (Coach Milan 10 November 08:52 to 09:42, draw and then we discuss): one Exploring. The pencil line and the
// photo's own answer can disagree today: the top says Exploring, the bottom offers Ate it, and Served does not engage.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3712", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.meals = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "estimate", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(ROOT + "/tests/flows/plate.jpg").toString("base64");
const at = new Date(2026, 10, 10, 8, 30).toISOString();
const items = [[200, "Liquid egg whites", 48, 10.5, 0.2, 0.7], [35, "Hazelnut cocoa spread", 540, 6, 31, 57], [5, "Butter", 717, 0.9, 81, 0.1]].map(([g, n, c, p, f, cb], k) => ({ id: "o" + k, grams: g, locked: false, fromPhoto: true, est: { low: Math.round(g * 0.8), high: Math.round(g * 1.25) }, food: F("of" + k, n, c, p, f, cb) }));
const base = { ...seed, items, title: "Sweet egg white pancake", plateAt: at };
const NOW = { ...base, pick: "exploring", photo: { image: PHOTO, at, who: "now", unsure: null, which: null } };
const NEW = { ...base, pick: "exploring", photo: { image: PHOTO, at, who: "idea", unsure: null, which: null, served: { id: "s1", mine: true, visit: "v1", dish: "dessert" } } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (state) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date(2026, 10, 10, 8, 52));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, state);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", better_as: "" }) }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1600); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel) => { await p.evaluate((sel) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - 90 : 0); }, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const outline = (p, sel) => p.evaluate(({ sel, mark }) => { const e = document.querySelector(sel); if (e) e.style.cssText += ";" + mark; }, { sel, mark });
  // a. now: the top says Exploring
  let p = await open(NOW);
  if (process.env.DBG) console.log(await p.evaluate(() => [...document.querySelectorAll("main section, main .plan-line, main .mp-say, main .mp-big-say")].map((x) => x.className).join(" | ")));
  await outline(p, ".plan-line");
  await note(p, "Now (0.3.121), the Plate, the top: the pencil line says Exploring, not sized for a meal. It was set with the pencil, after the photo was read as a meal of yours.", ".plan-line", "afterend");
  await shot(p, "rdt274a");
  // b. now: the bottom offers Ate it
  p = await open(NOW);
  await note(p, "Now (0.3.121), the same Plate, the bottom: the buttons are a meal's: Add a food, Ate it, Ate half, Not mine. The photo itself is not Exploring, so nothing is kept under Served. The two Explorings disagree.", ".mp-say");
  await outline(p, ".mp-say");
  await shot(p, "rdt274b", ".bnote");
  // c. new: the pencil on Exploring makes it an Exploring plate
  p = await open(NEW);
  await note(p, "New, the same Plate, the bottom: setting the pencil to Exploring makes the plate an Exploring plate. The Served card shows and the plate is kept; the buttons are an Exploring plate's: Fit it to my meal, Save as an idea, Put it in my plan.", ".sv-plate");
  await shot(p, "rdt274c", ".bnote");
  // d. new: the pencil's sheet says what each choice does
  p = await open(NEW);
  await p.locator(".plan-line-pen").click().catch(() => {}); await p.waitForTimeout(500);
  if (process.env.DBG) console.log(await p.evaluate(() => [...document.querySelectorAll("[role=radiogroup] button")].map((x) => x.className + ":" + x.innerText.replace(/\n/g, " ")).join(" | ")));
  await p.evaluate(({ mark }) => { const g = [...document.querySelectorAll('[role=radiogroup]')].find((x) => /Exploring/.test(x.innerText)); if (!g) return; const old = g.nextElementSibling; if (old && /nothing is sized/.test(old.innerText)) old.remove(); g.insertAdjacentHTML("afterend", `<div class="pen-say" style="${mark};background:#fff;padding:10px 12px;margin-top:10px;font-size:13.5px;line-height:1.5;color:#172742"><b>Exploring:</b> a plate you look at. Nothing is logged. With a photo it is kept in Recipes, under Served.<br><b>A meal (Breakfast, Lunch, Dinner):</b> your meal. It counts in your day when you tap Eat or Ate it. If it was under Served, it leaves Served.</div>`); }, { mark });
  await note(p, "New, the pencil's sheet: one line on what each choice does. Back to a meal makes the plate your meal again and takes it out of Served.", ".pen-say");
  await p.evaluate(() => { const g = [...document.querySelectorAll('[role=radiogroup]')].find((x) => /Exploring/.test(x.innerText)); g.classList.add("for-group"); });
  await shot(p, "rdt274d", ".for-group");
  await b.close(); server.kill();
})();
