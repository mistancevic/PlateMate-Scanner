// Board DT337 (Coach Milan 22 November 2026, 17:41 to 17:47; Draw 22:29): a plate of eggs, already above the range of the
// target, asks Fit to my target, and Chef Mealan adds more protein. The flow before on top (main, 0.3.175), new below. One
// scratch build of main (/home/claude/work/dt337, not committed); the flag board-new turns the range check on. Chef Mealan's
// answers are given in place of the AI: before, the kind of answer the tester got; new, the answer once he is told what
// the meal is missing, with one idea still above the range to show the check.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/dt337";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs337", PORT = "3700", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.meals = []; seed.feedback = [];
const eggs = seed.foods.find((f) => f.name === "Eggs");
seed.items = [{ id: "e", food: eggs, grams: 52, locked: false }]; // one egg, as in the test (Coach Milan 23:06)
seed.goals = { ...seed.goals, calories: 2000, protein: 106, fats: 67, carbs: 250 };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
const BEFORE = { options: [
  { kitchen: "German", title: "Scrambled eggs with a whey shake", why: "The shake brings the protein while the eggs stay soft.", adds: [{ name: "Whey protein powder", grams: 40, calories: 370, protein: 80, base: false }, { name: "Milk 1.5%", grams: 300, calories: 47, protein: 3.4, base: false }, { name: "Wholegrain bread", grams: 50, calories: 250, protein: 9, base: true }] },
  { kitchen: "Balkan", title: "Eggs with cottage cheese and skyr", why: "Fresh cheese and skyr round off the eggs.", adds: [{ name: "Cottage cheese (Hüttenkäse)", grams: 200, calories: 98, protein: 12, base: false }, { name: "Skyr, natural", grams: 200, calories: 63, protein: 11, base: false }, { name: "Wholegrain bread", grams: 50, calories: 250, protein: 9, base: true }] },
  { kitchen: "Mediterranean", title: "Eggs with quark and oats", why: "Quark and oats make a filling side.", adds: [{ name: "Quark, low fat (Magerquark)", grams: 250, calories: 67, protein: 12, base: false }, { name: "Oats", grams: 60, calories: 375, protein: 13, base: true }] },
] };
const NEW2 = { options: [
  { kitchen: "Balkan", title: "Egg with potatoes and ajvar", why: "Warm potatoes and ajvar make the egg a Balkan breakfast plate.", adds: [{ name: "Potatoes, boiled", grams: 300, calories: 77, protein: 2, fats: 0.1, carbs: 17, base: true }, { name: "Ajvar", grams: 60, calories: 60, protein: 1.3, fats: 4, carbs: 5, base: false }, { name: "Cottage cheese (Hüttenkäse)", grams: 100, calories: 98, protein: 12, base: false }] },
] };
const NEW = { options: [
  { kitchen: "German", title: "Egg on wholegrain toast with tomato and cottage cheese", why: "The toast carries the egg; tomato and a spoon of cottage cheese keep it fresh.", adds: [{ name: "Wholegrain bread", grams: 100, calories: 250, protein: 9, base: true }, { name: "Tomato", grams: 150, calories: 18, protein: 0.9, fats: 0.2, carbs: 3.9, base: false }, { name: "Cottage cheese (Hüttenkäse)", grams: 80, calories: 98, protein: 12, base: false }] },
  { kitchen: "Mediterranean", title: "Egg with oat porridge, skyr and banana", why: "A warm porridge with banana and a spoon of skyr carries the egg as a full breakfast.", adds: [{ name: "Oats", grams: 60, calories: 375, protein: 13, base: true }, { name: "Banana", grams: 100, calories: 89, protein: 1.1, base: false }, { name: "Skyr, natural", grams: 200, calories: 63, protein: 11, base: false }] },
  { kitchen: "Balkan", title: "Eggs with cottage cheese and skyr", why: "Fresh cheese and skyr round off the eggs.", adds: [{ name: "Cottage cheese (Hüttenkäse)", grams: 200, calories: 98, protein: 12, base: false }, { name: "Skyr, natural", grams: 200, calories: 63, protein: 11, base: false }, { name: "Wholegrain bread", grams: 50, calories: 250, protein: 9, base: true }] },
] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew, o = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-22T08:00:00+01:00"));
    let asks = 0; // new: the first answer has one idea above the range; the app asks again and he replaces it
    await p.route("**/api/meal", (r) => { asks++; r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(isNew ? (asks === 1 ? NEW : NEW2) : BEFORE) }); });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "" }) }));
    await p.addInitScript(([s, isNew, aiOff]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1995, heightCm: 168, weightKg: 62, kitchens: ["German", "Balkan", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify(aiOff ? { situations: [], flags: [], allergies: [], none: false, adultAt: "2026-10-06T09:00:00Z" } : { situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [seed, isNew, !!o.aiOff]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.goto(U + "/plate"); await p.waitForTimeout(1300);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    if (!o.noMeal) { await require(path.join(ROOT, "tests/flows/set-meal.cjs"))(p, "Breakfast"); await p.waitForTimeout(500); }
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) { const e = document.querySelector(m); if (e) e.style.cssText += ";" + MARK; }
    const t = document.querySelector(sel); const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; (t ?? document.body).insertAdjacentElement(t ? where : "afterbegin", n); }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
  const top = (p, sel, off = 70) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); if (!e) return; e.scrollIntoView({ block: "start" }); window.scrollBy(0, -off); }, [sel, off]);
  const shot = async (p, name) => { await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
  const fit = async (p) => { await p.getByRole("button", { name: "Fit to my target" }).first().click(); await p.waitForTimeout(2500); };
  const log = async (p, tag) => console.log(tag, (await p.locator(".readout").first().innerText().catch(() => "")).replace(/\s+/g, " "));
  const cards = async (p, n, isNew, missName) => { // missName: a tall picture of the whole list
    console.log("CARDS", (await p.locator(".mm-card").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").slice(0, 80)).join(" || "));
    await top(p, ".mm-card", 140);
    await note(p, ".mm-card", isNew ? "<b>New:</b> Chef Mealan is told the plate has the protein and the meal is missing carbs: toast, porridge, potatoes. Each lands in the range. An idea above the range is never shown: he is asked once more, and the new idea replaces it." : "Chef Mealan adds more protein: whey, cottage cheese, quark. The check only refuses an idea under the target, so ideas far above pass.", [".mm-card"], "beforebegin");
    if (missName) { await p.setViewportSize({ width: 390, height: 1330 }); await top(p, ".mm-card", 140); }
    await shot(p, n); await clean(p);
    if (missName) await p.setViewportSize({ width: 390, height: 844 });
    await p.locator(".mm-card").first().getByRole("button", { name: "Put it on the plate" }).click(); await p.waitForTimeout(900);
  };
  try {
    // DT337.1, main: no meal set, the quick fit adds whey (the path the tester took)
    let p = await open(false, { noMeal: true }); await log(p, "1a");
    await top(p, ".meal-line", 70);
    await note(p, ".readout", "One egg, no meal set. PD 8.4, above the range of the target 5.3 (4.8 to 8.0). I tap Fit to my target.", [".meal-line"]);
    await shot(p, "1a"); await clean(p);
    await fit(p); await log(p, "1b");
    await top(p, ".readout", 70); await note(p, ".readout", "No meal set: Fit uses the quick fit. It adds the food with the most protein in my foods: whey. PD far above, and it says fits your plan.", [".readout"]);
    await shot(p, "1b"); await clean(p); await p.context().close();
    // DT337.2, main: a meal set, Chef Mealan's ideas add protein
    p = await open(false); await log(p, "2a");
    await top(p, ".readout", 70); await note(p, ".readout", "Breakfast set. One egg, PD 8.4, above the range. I tap Fit to my target.", [".readout"]);
    await shot(p, "2a"); await clean(p);
    await fit(p); await cards(p, "2b", false); await log(p, "2c");
    await top(p, ".readout", 70); await note(p, ".readout", "On the plate: PD 10.1, a breakfast with protein and little else, and it says fits your plan.", [".readout"]);
    await shot(p, "2c"); await clean(p); await p.context().close();
    // DT337.3, new: no meal set, Fit asks which meal, then Chef Mealan's ideas in the range
    p = await open(true, { noMeal: true });
    await top(p, ".meal-line", 70); await note(p, ".readout", "<b>No change:</b> one egg, no meal set. I tap Fit to my target.", [".meal-line"]);
    await shot(p, "3a"); await clean(p);
    await fit(p);
    await top(p, ".meal-line-open", 250); await note(p, ".meal-line-open", "<b>New:</b> with no meal set, Fit asks which meal first, in the meal line, with one tap. A plate above the range goes to Chef Mealan's ideas.", [".meal-line-open"], "beforebegin");
    await shot(p, "3b"); await clean(p);
    await require(path.join(ROOT, "tests/flows/set-meal.cjs"))(p, "Breakfast"); await p.waitForTimeout(3000);
    await cards(p, "3c", true, true); await log(p, "3d");
    await top(p, ".readout", 70); await note(p, ".readout", "<b>New:</b> the breakfast lands in the range: fits your plan.", [".readout"]);
    await shot(p, "3d"); await clean(p); await p.context().close();
    // DT337.4, new: the AI off, the quick fit adds a base, never protein, to a plate above the range
    p = await open(true, { aiOff: true });
    await top(p, ".readout", 70); await note(p, ".readout", "<b>No change:</b> the AI is off for this account. Breakfast, one egg, PD 8.4. I tap Fit to my target.", [".readout"]);
    await shot(p, "4a"); await clean(p);
    await fit(p); await log(p, "4b");
    await top(p, ".readout", 70); await note(p, ".readout", "<b>New:</b> the quick fit adds a base from my foods, wholegrain bread, never a protein food: the plate comes down into the range.", [".readout"]);
    await shot(p, "4b"); await clean(p); await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
