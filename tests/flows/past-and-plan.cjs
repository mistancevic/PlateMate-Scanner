// JOURNEY (0.2.130, DT149, board Stories101 version 2; Tester 3, UX4; Coach Milan 29 October 00:14 and 00:58 Go): "The past is
// recording what I ate. The future is planning what I will eat. In the moment is what I eat." A meal for tomorrow from Plan is
// planning: the bar says Planning Friday's dinner, the line says Planning, the main button is Put it in Friday's dinner before
// Fit and after it, there is no Make it, nothing is logged or rated. A recipe planned for Friday says Change it on the Plate. A
// day gone by on Plan lists each meal: a planned one is I ate it, at its time; Add what you ate opens the Plate, Adding
// Wednesday's lunch: no Fit, one button puts it in at the meal's time, no rating. Which day? behind the Plate's pencil makes a
// plate tomorrow's lunch.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = [];
const F = (re) => seed.foods.find((f) => re.test(f.name));
const bowl = { id: "m-bowl", title: "Skyr bowl", items: [{ id: "b1", food: F(/^Skyr/), grams: 250, locked: true }, { id: "b2", food: F(/^Oats/), grams: 40, locked: true }, { id: "b3", food: F(/^Banana/), grams: 100, locked: true }], portion: 390, savedAt: "2026-10-20T08:00:00Z", steps: ["Stir the skyr smooth.", "Top with the oats and the sliced banana."] };
seed.meals = [bowl];
const k = (m) => ({ kcal: Math.round(m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0)), protein: Math.round(m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0)) });
const held = { title: "Skyr bowl", source: "mine", mealId: "m-bowl", items: bowl.items, portion: 390, ...k(bowl) };
const planned = { "2026-10-28": { dinner: held }, "2026-10-30": { breakfast: held } };
const PORT = "3322", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  try {
    const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-29T12:10:00"));
    await page.addInitScript(([s, planned]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-planned", JSON.stringify(planned));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed, planned]);
    await require("./adult.cjs")(page);
    const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
    const plannedNow = () => page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned")));
    const toPlan = async () => { await page.goto(U + "/"); await page.waitForTimeout(800); await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(900); };
    const day = async (re) => { await page.getByRole("tab").filter({ hasText: re }).first().click(); await page.waitForTimeout(600); };
    const addTwo = async () => { for (let i = 0; i < 2; i++) { await page.locator(".row-food").filter({ hasNot: page.locator(".pill-done") }).getByRole("button", { name: "Add", exact: true }).first().click(); await page.waitForTimeout(400); } };
    // planning: tomorrow's dinner
    await toPlan(); await day(/30/);
    await page.getByRole("button", { name: /^Dinner at .*pick a meal/ }).click(); await page.waitForTimeout(500);
    await page.getByRole("button", { name: /Create a new meal on the Plate/ }).click(); await page.waitForTimeout(1000);
    const bar = () => page.locator(".phase-bar").first().textContent();
    ok(/^Planning Friday's dinner$/.test((await bar()).trim()), "the bar says Planning Friday's dinner, no Make, no Feedback: " + (await bar()).trim());
    ok(/Friday's dinner, 20:00 · Planning/.test(await page.locator(".plan-line").textContent()), "the line says the day and Planning");
    await addTwo();
    const primary = async () => (await page.locator(".pill-primary").allTextContents()).map((x) => x.trim());
    ok((await primary()).includes("Put it in Friday's dinner"), "the main button: Put it in Friday's dinner, before Fit");
    await page.getByRole("button", { name: /Fit to my target/ }).click(); await page.waitForTimeout(1200);
    ok((await primary()).some((x) => x === "Put it in Friday's dinner") && await page.getByRole("button", { name: /^Make it$/ }).count() === 0, "after Fit: still Put it in, no Make it");
    ok(/Planned, not eaten\./.test(await page.locator("main").first().textContent()), "the plate says it is planned, not eaten");
    await page.getByRole("button", { name: "Put it in Friday's dinner" }).first().click(); await page.waitForTimeout(800);
    ok(!!(await plannedNow())["2026-10-30"]?.dinner && (await st()).feedback.length === 0, "Friday's dinner is planned; nothing logged, nothing to rate");
    // a recipe planned for Friday: Change it on the Plate
    await toPlan(); await day(/30/);
    await page.locator(".plan-slot-set").first().click(); await page.waitForTimeout(900);
    ok(await page.getByRole("button", { name: /^Make it$/ }).count() === 0 && await page.getByRole("button", { name: "Change it on the Plate" }).count() === 1, "a recipe for Friday: Change it on the Plate, no Make it");
    await page.getByRole("button", { name: "Change it on the Plate" }).click(); await page.waitForTimeout(1000);
    ok(/^Planning Friday's breakfast$/.test((await bar()).trim()), "it opens as Planning Friday's breakfast");
    // a day gone by
    await toPlan(); await day(/28/);
    const past = page.locator(".past-add");
    ok(/What you ate/.test(await past.textContent()) && await past.getByRole("button", { name: "Add what you ate" }).count() === 2 && await past.getByRole("button", { name: "I ate it" }).count() === 1, "yesterday: each meal can be added; the planned dinner is I ate it");
    await past.getByRole("button", { name: "I ate it" }).click(); await page.waitForTimeout(600);
    let fb = (await st()).feedback;
    const at = new Date(fb[0]?.createdAt);
    ok(fb.length === 1 && fb[0].slot?.date === "2026-10-28" && fb[0].slot?.slotId === "dinner" && at.getDate() === 28 && at.getHours() === 20 && !fb[0].taste, "I ate it adds it on Wednesday at 20:00, nothing rated");
    ok(/Skyr bowl/.test(await page.locator(".plan-past").textContent()) && /Dinner, 20:00/.test(await page.locator(".plan-past").textContent()), "the day shows it as eaten at dinner");
    await page.locator(".past-add .past-plate").filter({ hasText: "Lunch" }).getByRole("button", { name: "Add what you ate" }).click(); await page.waitForTimeout(1000);
    ok(/^Adding Wednesday's lunch$/.test((await bar()).trim()) && /Wednesday's lunch, 13:45 · Eaten/.test(await page.locator(".plan-line").textContent()), "Adding Wednesday's lunch; the line says Eaten");
    await addTwo();
    ok(await page.getByRole("button", { name: /Fit to my target/ }).count() === 0 && await page.getByRole("button", { name: /^Make it$|Lock the recipe/ }).count() === 0, "no Fit, no Make: it is what you ate");
    await page.getByRole("button", { name: "Put it in Wednesday's lunch, eaten" }).click(); await page.waitForTimeout(800);
    fb = (await st()).feedback;
    const lunch = fb.find((f) => f.slot?.slotId === "lunch"), la = new Date(lunch?.createdAt);
    ok(!!lunch && lunch.slot.date === "2026-10-28" && la.getDate() === 28 && la.getHours() === 13 && la.getMinutes() === 45 && !lunch.taste, "added on Wednesday at 13:45, nothing rated");
    // Which day? behind the Plate's pencil
    await page.goto(U + "/"); await page.waitForTimeout(700); await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(800);
    await page.locator(".plan-line").click(); await page.waitForTimeout(300);
    ok(await page.getByRole("radiogroup", { name: "Which day" }).count() === 1, "Which day? sits behind the pencil");
    await page.getByRole("radiogroup", { name: "Which day" }).getByRole("button", { name: "Tomorrow" }).click(); await page.waitForTimeout(300);
    ok(/plans what you will eat/.test(await page.locator(".which-day-hint").textContent()), "tomorrow plans");
    await page.getByRole("radiogroup", { name: /Friday, which meal/ }).getByRole("button", { name: /^Lunch/ }).click(); await page.waitForTimeout(500);
    ok(/^Planning Friday's lunch$/.test((await bar()).trim()), "the plate is now Planning Friday's lunch");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
