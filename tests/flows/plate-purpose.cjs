// JOURNEY INVARIANT (Milan, 18 October 2026, 12:52 to 13:06, story R11 on canvas board RS8): what the plate is for, in the
// line's section. With nothing picked, the line names the meal the clock is in, as a guess, off the plan. What is it for
// offers Exploring, the day's meals and a snack; Exploring sizes nothing; a meal picked sizes the plate for it, the line
// gives its numbers, and the meal counts as that meal by the plan on Today. The whole line opens the section; Done closes
// it. The old When is this for reads What kind of moment. Never rewrite these lines to fit a change.
// 0.3.157 (DT308, the meal model; Coach Milan, Go 18 November 11:14), changed by the story: DT308.1 and DT308.9 replace R11's line and section. No meal is guessed: the line says Meal and day not set. The whole line still opens the section, which is now your calendar (today's meals, a snack and Just looking as its rows, in place of the chips of What is it for); the pencil closes it; a meal tapped is set, with an X. What still holds from R11: a meal picked sizes the plate for it and counts as that meal by the plan on Today, and the moment's question reads What kind of moment.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = []; seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3223", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.clock.setFixedTime(new Date("2026-10-18T12:30:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3223/"); await page.waitForTimeout(1200);
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600);
    const line = async () => (await page.locator(".plan-line .meal-line-text").first().innerText()).replace(/\s+/g, " ").trim();
    // changed by DT308.1 and DT308.9 (0.3.157): no meal is guessed; the calendar took the place of What is it for
    ok(/^Meal and day not set$/.test(await line()), "nothing picked: the line says Meal and day not set; no meal is named by the clock: " + await line());
    await page.locator(".plan-line .meal-line-text").first().click(); await page.waitForTimeout(300);
    const rows = (await page.locator(".meal-line-open .pcal-row b").allTextContents()).map((t) => t.trim());
    ok(rows.join("|") === "Breakfast|Lunch|Dinner|Snack|Just looking" && await page.locator(".for-row").count() === 0, "the whole line opens your calendar: today's meals, a snack and Just looking, the choices What is it for had: " + rows.join(", "));
    ok(await page.locator(".meal-line-open .pcal-row.on").count() === 0, "no meal is marked: nothing is a guess");
    ok(await page.locator(".chef-line").filter({ hasText: "What kind of moment?" }).count() === 1 && await page.locator("p.label").filter({ hasText: "When is this for?" }).count() === 0, "the moment's question reads What kind of moment?, in Chef Mealan's line (DT213)");
    ok(await page.locator(".plan-line-done").count() === 0 && await page.locator(".plan-line-pen.on").count() === 1, "the pencil stays where it is while the calendar is open; no Done");
    await page.locator(".plan-line-pen").click(); await page.waitForTimeout(300);
    ok(await page.locator(".meal-line-open").count() === 0 && /^Meal and day not set$/.test(await line()) && !/Make it a/.test(await page.locator("main").textContent()), "the pencil closes it with no meal set: not sized for a meal, and nothing offers to make it a meal");
    await page.locator(".plan-line-pen").click(); await page.waitForTimeout(300);
    await page.locator(".meal-line-open .pcal-looking").click(); await page.waitForTimeout(300);
    ok(/^Just looking · not sized for a meal/.test(await line()) && !/Make it a/.test(await page.locator("main").textContent()), "Just looking: the line says so, and nothing offers to make it a meal");
    await page.locator(".plan-line-pen").click(); await page.waitForTimeout(300);
    await page.locator(".meal-line-open .pcal-row").filter({ hasText: /^\s*Dinner/ }).click(); await page.waitForTimeout(300);
    ok(/^Dinner\s+\w+, \d+ \w+, \d\d:\d\d$/.test(await line()), "Dinner: the line says the meal, the day, date and time: " + await line());
    ok(await page.locator(".meal-line-open").count() === 0 && await page.locator(".plan-line-pen").count() === 0 && await page.locator(".plan-line-x").count() === 1, "the tap closes the calendar; an X stands where the pencil was");
    // a plate for dinner, kept as it is, counts as dinner on Today
    await page.locator(".row-food").filter({ hasText: "Skyr, natural" }).getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(500);
    ok(await page.getByRole("button", { name: "Fit to my target" }).count() === 1 && /Dinner is about/.test(await page.locator(".plate-card").textContent()), "the plate is sized for dinner: Dinner is about, Fit to my target");
    await page.getByRole("button", { name: /^(Keep it as it is|Lock the recipe|How to make it ›|How to eat it ›|Lock it and cook ›|Prepare it ›|Make it ›)$/ }).click(); await page.waitForTimeout(800);
    for (const name of ["Continue", "Lock the recipe", "How to make it ›", "How to eat it ›", "Lock it and cook ›", "Prepare it ›", "Make it ›", "I'm making it", "Cooked. Next: Eat ›"]) { const bt = page.getByRole("button", { name, exact: true }); if (await bt.count()) { await bt.first().click(); await page.waitForTimeout(600); } }
    await page.getByRole("button", { name: "Good", exact: true }).click(); await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(1200);
    if (!/today/.test(page.url())) { await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(600); }
    // R5 (Milan 17:23 to 19:00, board RS13): which meal it was is its own line; By the plan is its mark
    const nums = (await page.locator(".log-card .meal-which").first().textContent()).trim() + " · " + (await page.locator(".log-card .plan-mark").first().textContent()).trim();
    ok(/^Dinner\b/.test(nums) && /[Bb]y the plan$/.test(nums), "Today counts it as dinner, by the plan: " + nums);
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600);
    ok(/^Meal and day not set$/.test(await line()), "after saving, a new plate starts with no meal set again: " + await line());
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
