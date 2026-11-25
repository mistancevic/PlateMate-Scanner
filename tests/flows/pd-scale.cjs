// DT338 (0.3.179, board Stories279; Go 23 November 2026, 10:42): what the PD colours mean. One scale, five colours with
// their names and ranges in the person's own numbers, under the PD target on Me, Goal (AC1); on the Plate a tap on the PD
// number opens it with a mark where the plate sits (AC2), a second tap closes it (AC3); the words under the number say
// the band above On plan (AC4); the ranges follow the goal: Recomposition and Build muscle, Steady (AC5).
// changed by DT349 (0.3.193, AC13, design rule D14): the PD card has two columns; Energy, Weight and Protein are .rd-rows, the words against the target .pd-short or .pd-line
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.meals = []; seed.feedback = [];
const eggs = seed.foods.find((f) => f.name === "Eggs");
const PORT = "3604", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (g, grams = 52) => {
    const s = { ...seed, items: [{ id: "e", food: eggs, grams, locked: false }], goals: { ...seed.goals, calories: g.calories, protein: g.protein } };
    const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date("2026-11-23T08:00:00+01:00"));
    await p.addInitScript(([s, band]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band, setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1995, heightCm: 168, weightKg: 62, kitchens: ["German"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [s, g.band]);
    await require("./adult.cjs")(p);
    return p;
  };
  const scaleOf = (p, root) => p.locator(root + " .pd-scale").first().evaluate((e) => ({
    names: [...e.querySelectorAll(".pd-scale-seg")].map((x) => x.textContent.trim()),
    ranges: [...e.querySelectorAll(".pd-scale-range")].map((x) => x.textContent.trim()),
    here: e.querySelector(".pd-scale-seg.here")?.textContent.trim() ?? null, mark: !!e.querySelector(".pd-scale-mark") }));
  const plate = async (p) => {
    await p.goto(U + "/plate"); await p.waitForTimeout(1300);
    await require("./set-meal.cjs")(p, "Breakfast"); await p.waitForTimeout(400);
  };
  const words = (p) => p.locator(".readout .pd-short, .readout .pd-line").first().innerText();
  try {
    // AC1: the scale on the Goal page, target 5.3 (106 g protein in 2000 kcal)
    let p = await open({ band: "maintain", calories: 2000, protein: 106 });
    await p.goto(U + "/me/goal"); await p.waitForTimeout(1300);
    let s = await scaleOf(p, ".goal-head");
    ok(s.names.join() === "Low−,Low,On plan,High,High+", "DT338 AC1: five colours with their names: " + s.names.join(", "));
    ok(s.ranges.join(" | ") === "under 3.2 | 3.2 to 4.8 | 4.8 to 8.0 | 8.0 to 13.3 | 13.3 and up", "DT338 AC1: the ranges in my numbers: " + s.ranges.join(" | "));
    ok(/for your target 5\.3$/.test((await p.locator(".goal-head .pd-scale-title").innerText()).trim()), "DT338 AC1: the scale says it is for my target 5.3");
    ok(!s.mark && s.here === null, "DT338 AC1: on the Goal page there is no mark");
    // AC2 to AC4: one egg for breakfast, PD 8.4
    await plate(p);
    ok((await p.locator(".readout .pd-scale").count()) === 0, "DT338 AC2: the scale is closed until I tap");
    ok((await words(p)).trim() === "High, above your plan", "DT338 AC4: at PD 8.4 the words say High, above your plan: " + (await words(p)));
    const num = p.locator(".readout .pd-tap").first();
    ok((await num.innerText()).trim() === "8.4", "DT338 AC2: the PD number is 8.4");
    await num.click(); await p.waitForTimeout(300);
    s = await scaleOf(p, ".readout");
    ok(s.mark && s.here === "High", "DT338 AC2: the scale opens with a mark over High: " + s.here);
    ok(await p.locator(".readout .pd-scale-range").first().evaluate((e) => getComputedStyle(e).color) === "rgb(23, 39, 66)" && await p.locator(".readout .pd-scale-title").evaluate((e) => getComputedStyle(e).color) === "rgb(23, 39, 66)", "DT338 AC2: inside the PD block the title and ranges are dark on white, readable");
    ok(/This plate: 8\.4\.$/.test((await p.locator(".readout .pd-scale-title").innerText()).trim()), "DT338 AC2: it says This plate: 8.4.");
    ok((await num.getAttribute("aria-expanded")) === "true", "DT338 AC2: the number tells a screen reader it is open");
    await num.click(); await p.waitForTimeout(300);
    ok((await p.locator(".readout .pd-scale").count()) === 0, "DT338 AC3: a second tap closes it");
    await num.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
    ok((await p.locator(".readout .pd-scale").count()) === 1, "DT338 AC2: Enter on the number opens it too");
    await p.context().close();
    // AC4: the same egg with a low target, 3.1, where PD 8.4 is far above: High+
    p = await open({ band: "maintain", calories: 2600, protein: 80 }); await plate(p);
    ok((await words(p)).trim() === "High+, far above your plan", "DT338 AC4: far above, the words say High+, far above your plan: " + (await words(p)));
    await p.context().close();
    // AC4: On plan keeps fits your plan
    p = await open({ band: "recomp", calories: 2300, protein: 145 }); await plate(p);
    ok((await words(p)).trim() === "fits your plan", "DT338 AC4: on plan the words say fits your plan, as before: " + (await words(p)));
    // AC5: Recomposition, target 6.3
    await p.locator(".readout .pd-tap").first().click(); await p.waitForTimeout(300);
    s = await scaleOf(p, ".readout");
    ok(s.here === "On plan", "DT338 AC5: Recomposition, the egg at PD 8.4 is On plan: " + s.here);
    await p.goto(U + "/me/goal"); await p.waitForTimeout(1300);
    s = await scaleOf(p, ".goal-head");
    ok(s.ranges[2] === "5.7 to 9.5" && /target 6\.3$/.test((await p.locator(".goal-head .pd-scale-title").innerText()).trim()), "DT338 AC5: Recomposition, target 6.3, On plan 5.7 to 9.5: " + s.ranges.join(" | "));
    await p.context().close();
    // AC5: Build muscle, Steady, target 5.0
    p = await open({ band: "gainsteady", calories: 2600, protein: 130 });
    await p.goto(U + "/me/goal"); await p.waitForTimeout(1300);
    s = await scaleOf(p, ".goal-head");
    ok(s.ranges[2] === "4.5 to 7.5" && /target 5\.0$/.test((await p.locator(".goal-head .pd-scale-title").innerText()).trim()), "DT338 AC5: Build muscle, target 5.0, On plan 4.5 to 7.5: " + s.ranges.join(" | "));
    await plate(p);
    await p.locator(".readout .pd-tap").first().click(); await p.waitForTimeout(300);
    s = await scaleOf(p, ".readout");
    ok(s.here === "High", "DT338 AC5: Build muscle, the same egg is High: " + s.here);
    await p.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
