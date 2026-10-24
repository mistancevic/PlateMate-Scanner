// JOURNEY INVARIANT (Milan, 18 October 2026, 12:52 to 13:06, story R11 on canvas board RS8): what the plate is for, in the
// line's section. With nothing picked, the line names the meal the clock is in, as a guess, off the plan. What is it for
// offers Exploring, the day's meals and a snack; Exploring sizes nothing; a meal picked sizes the plate for it, the line
// gives its numbers, and the meal counts as that meal by the plan on Today. The whole line opens the section; Done closes
// it. The old When is this for reads What kind of moment. Never rewrite these lines to fit a change.
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
    const line = () => page.locator(".plan-line span").first().textContent();
    ok(/^Lunch, \d\d:\d\d by the clock · Off the plan · Regular meal · A mix$/.test(await line()), "nothing picked: the line names the meal by the clock, off the plan: " + await line());
    await page.locator(".plan-line span").first().click(); await page.waitForTimeout(300);
    const chips = await page.locator(".for-row .choice").allTextContents();
    ok(chips.join("|") === "Exploring|Breakfast|Lunch|Dinner|Snack", "the whole line opens What is it for: " + chips.join(", "));
    ok(/Lunch/.test(await page.locator(".for-row .choice.on").textContent()) && /by the clock: a guess/.test(await page.locator(".for-hint").textContent()), "Lunch is the guess, and the hint says so");
    ok(await page.locator("p.label").filter({ hasText: "What kind of moment?" }).count() === 1 && await page.locator("p.label").filter({ hasText: "When is this for?" }).count() === 0, "the moment's question reads What kind of moment?");
    ok(await page.locator(".plan-line-done").count() === 1, "Done stands where the pencil was");
    await page.locator(".for-row .choice").filter({ hasText: "Exploring" }).click(); await page.waitForTimeout(300);
    ok(/^Exploring · not sized for a meal/.test(await line()) && !/Make it a/.test(await page.locator("main").textContent()), "Exploring: the line says so, and nothing offers to make it a meal");
    await page.locator(".for-row .choice").filter({ hasText: "Dinner" }).click(); await page.waitForTimeout(300);
    ok(/^Dinner, \d\d:\d\d · [\d,]+ kcal · \d+ g protein · PD [\d.]+ · By the plan$/.test(await line()), "Dinner: its numbers from the plan, by the plan: " + await line());
    ok(/It counts as your dinner\./.test(await page.locator(".for-hint").textContent()), "the hint says it counts as your dinner");
    await page.locator(".plan-line-done").click(); await page.waitForTimeout(300);
    ok(await page.locator(".for-row").count() === 0 && await page.locator(".plan-line-pen").count() === 1, "Done closes the section; the pencil is back");
    // a plate for dinner, kept as it is, counts as dinner on Today
    await page.locator(".row-food").filter({ hasText: "Skyr, natural" }).getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(500);
    ok(await page.getByRole("button", { name: "Fit to my target" }).count() === 1 && /Dinner is about/.test(await page.locator(".plate-card").textContent()), "the plate is sized for dinner: Dinner is about, Fit to my target");
    await page.getByRole("button", { name: /^(Keep it as it is|Lock the recipe)$/ }).click(); await page.waitForTimeout(800);
    for (const name of ["Continue", "Lock the recipe", "I'm making it", "On to How was it?"]) { const bt = page.getByRole("button", { name, exact: true }); if (await bt.count()) { await bt.first().click(); await page.waitForTimeout(600); } }
    await page.getByRole("button", { name: "Good", exact: true }).click(); await page.getByRole("button", { name: /^Save/ }).first().click(); await page.waitForTimeout(1200);
    if (!/today/.test(page.url())) { await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(600); }
    // R5 (Milan 17:23 to 19:00, board RS13): which meal it was is its own line; By the plan is its mark
    const nums = (await page.locator(".log-card .meal-which").first().textContent()).trim() + " · " + (await page.locator(".log-card .plan-mark").first().textContent()).trim();
    ok(/^Dinner\b/.test(nums) && /By the plan$/.test(nums), "Today counts it as dinner, by the plan: " + nums);
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600);
    ok(/by the clock · Off the plan/.test(await line()), "after saving, a new plate starts from the clock again: " + await line());
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
