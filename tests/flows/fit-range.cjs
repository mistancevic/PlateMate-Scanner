// DT337 (0.3.176, board Stories277; Go 22 November 2026, 23:44): Fit to my target lands in the target's range and adds what the
// meal is missing. One egg, PD 8.4, target 5.3, range 4.8 to 8.0. With no meal set and the AI on, Fit asks which meal first;
// a plate above the range goes to Chef Mealan's ideas; an idea above the range is never shown, he is asked once more; he is
// told what the meal is missing; each idea shows its weight; with the AI off, the quick fit adds a base, never protein.
// Chef Mealan's answers are fixed here (no AI in the walkthroughs).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const PORT = "3602", U = `http://127.0.0.1:${PORT}`;
const seed0 = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed0.meals = []; seed0.feedback = [];
const eggs = seed0.foods.find((f) => f.name === "Eggs");
seed0.goals = { ...seed0.goals, calories: 2000, protein: 106, fats: 67, carbs: 250 };
const lib = (n) => seed0.foods.find((f) => f.name === n);
const opt = (kitchen, title, adds) => ({ kitchen, title, why: "Fixed for the walkthrough.", adds: adds.map(([name, grams, base, v]) => ({ name, grams, base, ...(v ?? { calories: lib(name).calories, protein: lib(name).protein, fats: lib(name).fats ?? 0, carbs: lib(name).carbs ?? 0 }) })) });
const TOMATO = { calories: 18, protein: 0.9, fats: 0.2, carbs: 3.9 }, POTATO = { calories: 77, protein: 2, fats: 0.1, carbs: 17 }, AJVAR = { calories: 60, protein: 1.3, fats: 4, carbs: 5 }, CUCUMBER = { calories: 15, protein: 0.7, fats: 0.1, carbs: 3.6 };
const FIRST = { options: [
  opt("German", "Egg on wholegrain toast with tomato and cottage cheese", [["Wholegrain bread", 100, true], ["Tomato", 150, false, TOMATO], ["Cottage cheese (Hüttenkäse)", 80, false]]),
  opt("Mediterranean", "Egg with oat porridge, skyr and banana", [["Oats", 60, true], ["Banana", 100, false], ["Skyr, natural", 200, false]]),
  opt("Balkan", "Eggs with cottage cheese and skyr", [["Cottage cheese (Hüttenkäse)", 200, false], ["Skyr, natural", 200, false], ["Wholegrain bread", 50, true]]),
] };
const SECOND = { options: [opt("Balkan", "Egg with potatoes and ajvar", [["Potatoes, boiled", 300, true, POTATO], ["Ajvar", 60, false, AJVAR], ["Cottage cheese (Hüttenkäse)", 100, false]])] };
const SMALL1 = { options: [opt("German", "Eggs with cucumber", [["Cucumber", 100, true, CUCUMBER]])] };
const SMALL2 = { options: [opt("German", "Eggs with a banana", [["Banana", 100, true]])] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async ({ eggsN = 1, noMeal = false, aiOff = false, lowCarb = false, answers = [FIRST, SECOND] } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date("2026-11-22T08:00:00+01:00"));
    const asked = []; p.asked = asked;
    await p.route("**/api/meal", (r) => { const body = JSON.parse(r.request().postData() || "{}"); asked.push(body); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(answers[Math.min(asked.length, answers.length) - 1]) }); });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "" }) }));
    const seed = { ...seed0, items: [{ id: "e", food: eggs, grams: 52 * eggsN, locked: false }], ...(lowCarb ? { goals: { ...seed0.goals, carbs: 40, fats: 140 } } : {}) };
    await p.addInitScript(([s, aiOff, lowCarb]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1995, heightCm: 168, weightKg: 62, kitchens: ["German", "Balkan", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 }, ...(lowCarb ? { carbsFat: { split: "low", carbs: 40 } } : {}) }));
      localStorage.setItem("chefmealan-safety", JSON.stringify(aiOff ? { situations: [], flags: [], allergies: [], none: false, adultAt: "2026-10-06T09:00:00Z" } : { situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed, aiOff, lowCarb]);
    await require("./adult.cjs")(p);
    await p.goto(U + "/plate"); await p.waitForTimeout(1300);
    if (!noMeal) { await require("./set-meal.cjs")(p, "Breakfast"); await p.waitForTimeout(500); }
    return p;
  };
  const fit = async (p) => { await p.getByRole("button", { name: "Fit to my target" }).first().click(); await p.waitForTimeout(2500); };
  const pds = async (p) => (await p.locator(".mm-card:not(.mm-fail) .mm-nums").allInnerTexts()).map((t) => Number((t.match(/PD ([\d.]+)/) || [])[1]));
  const items = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.map((i) => i.food.name));
  try {
    // AC6: no meal set, the AI on: Fit asks which meal first; once Breakfast is picked, the ideas come for a breakfast
    let p = await open({ noMeal: true });
    await fit(p);
    ok(await p.locator(".meal-line-open").count() === 1, "DT337 AC6: with no meal set, Fit opens the meal line");
    ok(/Which meal is it\? Pick it, and Chef Mealan finds ideas for it\./.test(await p.locator("body").innerText()), "DT337 AC6: one line says Which meal is it? Pick it, and Chef Mealan finds ideas for it.");
    ok(p.asked.length === 0 && (await items(p)).join() === "Eggs", "DT337 AC6: nothing is asked and nothing added before the meal is picked");
    await require("./set-meal.cjs")(p, "Breakfast"); await p.waitForTimeout(3500);
    ok(p.asked.length >= 1 && p.asked[0].meal === "breakfast", "DT337 AC6: once Breakfast is picked, the ideas are asked for a breakfast: " + (p.asked[0] || {}).meal);
    // AC1, AC2: every idea shown is in the range; the one above it is not shown, he is asked once more, the new idea takes its place
    const shown = await pds(p);
    ok(shown.length === 3 && shown.every((x) => x >= 4.75 && x <= 8.05), "DT337 AC1: every idea shown lands in the range 4.8 to 8.0: " + shown.join(", "));
    ok(p.asked.length === 2 && /above your range/.test(JSON.stringify(p.asked[1].failed)), "DT337 AC2: the idea above the range goes back once, with the reason: " + JSON.stringify(p.asked[1] && p.asked[1].failed));
    const titles = (await p.locator(".mm-card .mm-title, .mm-card b").allInnerTexts()).join(" | ");
    ok(!/Eggs with cottage cheese and skyr/.test(titles) && /Egg with potatoes and ajvar/.test(titles), "DT337 AC2: the idea above the range is never shown; the new one takes its place");
    ok(await p.locator(".mm-fail").count() === 0, "DT337 AC2: no miss is shown for it");
    // AC3: he is told the plate has the protein and what the meal is missing
    const a0 = p.asked[0];
    ok(Math.round(a0.plate_pd * 10) / 10 === 8.4 && a0.target > 5.2 && a0.target < 5.4, `DT337 AC3: he is told the plate's PD and the target: ${a0.plate_pd} against ${a0.target}`);
    ok(a0.missing && a0.missing.missing.carbs > 60 && a0.missing.plate.carbs <= 1, "DT337 AC3: what the meal is missing: " + JSON.stringify(a0.missing));
    // AC9: each idea shows its weight next to kcal and PD, on the line with its kitchen
    const line = (await p.locator(".mm-card:not(.mm-fail) .mm-nums").first().innerText()).trim();
    ok(/^\d{3} kcal · \d{3} g · PD \d\.\d$/.test(line) && (await p.locator(".mm-card:not(.mm-fail) .mm-top").first().innerText()).includes("GERMAN"), "DT337 AC9: the kitchen's line says kcal, weight and PD: " + line);
    await p.locator(".mm-card").first().getByRole("button", { name: "Put it on the plate" }).click(); await p.waitForTimeout(900);
    const ro = (await p.locator(".readout").first().innerText()).replace(/\s+/g, " ");
    const pd = Number((ro.match(/PD ([\d.]+)/) || ro.match(/([\d.]+)/))[1]);
    ok(pd >= 4.75 && pd <= 8.05, "DT337 AC1: on the plate the breakfast lands in the range: " + ro.slice(0, 80));
    await p.context().close();
    // AC4: a very low carb day: what is missing is fat
    p = await open({ lowCarb: true });
    await fit(p);
    const l0 = p.asked[0] || {};
    ok(l0.very_low_carb === true && l0.missing && l0.missing.missing.fats > l0.missing.missing.carbs, "DT337 AC4: a very low carb day: he is told the missing part is fat: " + JSON.stringify(l0.missing));
    await p.context().close();
    // AC7: a plate near the meal's size but above the range goes to Chef Mealan, not the quick fit
    p = await open({ eggsN: 5, answers: [SECOND] });
    await fit(p);
    ok(p.asked.length === 1 && await p.locator(".mm-card").count() >= 1, "DT337 AC7: five eggs, near the meal's size, above the range: Chef Mealan's ideas come");
    ok(!(await items(p)).includes("Whey protein powder"), "DT337 AC7: not the quick fit");
    await p.context().close();
    // AC5: a plate that already fills the meal: Ideas anyway follows the range
    p = await open({ eggsN: 8, answers: [SMALL1, SMALL2] });
    await fit(p);
    const anyway = p.getByRole("button", { name: /Ideas anyway/ });
    ok(await anyway.count() === 1, "DT337 AC5: eight eggs fill the breakfast: Ideas anyway is offered");
    if (await anyway.count()) {
      await anyway.first().click(); await p.waitForTimeout(3000);
      const t5 = (await p.locator(".mm-card").allInnerTexts()).join(" | ");
      ok(p.asked.length === 2 && !/Eggs with cucumber/.test(t5) && /Eggs with a banana/.test(t5), "DT337 AC5: the small addition above the range is not shown; the one in it is: " + t5.replace(/\s+/g, " ").slice(0, 160));
    }
    await p.context().close();
    // AC8: the AI off: the quick fit adds a base, never whey
    p = await open({ aiOff: true });
    await fit(p);
    const q = await items(p);
    ok(q.includes("Wholegrain bread") && !q.includes("Whey protein powder"), "DT337 AC8: the quick fit adds wholegrain bread, never whey: " + q.join(", "));
    const r8 = (await p.locator(".readout").first().innerText()).replace(/\s+/g, " ");
    const pd8 = Number((r8.match(/([\d]+\.\d)/) || [])[1]);
    ok(pd8 >= 4.75 && pd8 <= 8.05, "DT337 AC8: the plate comes down into the range: " + r8.slice(0, 60));
    await p.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
