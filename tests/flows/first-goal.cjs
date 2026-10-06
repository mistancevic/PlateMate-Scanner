// JOURNEY INVARIANT (Milan, 6 October 2026, approved on the canvas): the first screen has a way out, Not now, and saves nothing
// until Set my day. Two ways in: Calculate for me, My own numbers. Five goals. Life once, training per day. Every day the same,
// or each day its own as one table: kcal, protein, fat, carbs per day, How on each row, the week's average under it.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3189", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.goto("http://127.0.0.1:3189/"); await page.waitForTimeout(900);
  // the way out
  ok(await page.getByRole("button", { name: "Not now" }).count() === 1, "the first screen has Not now");
  await page.getByRole("button", { name: "Not now" }).click(); await page.waitForTimeout(500);
  ok((await page.evaluate(() => localStorage.getItem("chefmealan-goal"))) === null && /Set your goal/.test(await page.locator("main").textContent()), "Not now saves nothing; Today offers Set your goal");
  await page.getByText(/Set your goal/).click(); await page.waitForTimeout(400);
  // Calculate for me
  ok(await page.getByRole("button", { name: "Calculate for me" }).count() === 1 && await page.getByText("Work it out for me").count() === 0, "Calculate for me, not Work it out");
  const goals = await page.locator(".calc-way .moments").last().locator("button").allTextContents();
  ok(goals.join("|") === "Lose fat|Recomposition|Maintain|Build muscle|Performance", "the five goals: " + goals.join(", "));
  await page.getByRole("button", { name: /^I agree$/ }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /^Female$/ }).click();
  const inputs = page.locator(".calc-way input");
  await inputs.nth(0).fill("2009"); await inputs.nth(1).fill("168"); await inputs.nth(2).fill("58"); await inputs.nth(2).blur();
  await page.getByRole("button", { name: /9 to 5 at a desk/ }).click();
  await page.getByRole("button", { name: /^Lose fat$/ }).click(); await page.waitForTimeout(200);
  ok(/Under 18/.test(await page.locator(".calc-way").textContent()), "a 17-year-old picking Lose fat gets no deficit, and is told");
  // each day its own: the table
  await page.getByRole("button", { name: "Each day its own" }).click(); await page.waitForTimeout(200);
  const rows = await page.locator(".day-table .dt-row").count();
  ok(rows === 4 && /Rest, passive/.test(await page.locator(".day-table").textContent()) && /Training, hard/.test(await page.locator(".day-table").textContent()), "four days, all about training");
  ok(/Your week averages/.test(await page.locator(".dt-avg").textContent()), "the week's average under the table");
  await page.locator(".dt-row").last().getByRole("button", { name: /How/ }).click(); await page.waitForTimeout(150);
  ok(/METs/.test(await page.locator(".dt-how").textContent()) && /Mifflin/.test(await page.locator(".dt-how").textContent()), "How shows the arithmetic and the sources");
  await page.getByRole("button", { name: /Set my day/ }).click(); await page.waitForTimeout(600);
  const g = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).goals);
  ok(g.calories > 0 && g.protein > 0 && g.fats > 0 && g.carbs > 0, "the average is saved with all four: " + JSON.stringify(g));
  // Today: pick the day, the numbers follow it
  const avgK = await page.locator(".plan-row div").nth(1).locator("b").textContent();
  await page.getByRole("button", { name: "Training, hard" }).click(); await page.waitForTimeout(300);
  const hardK = await page.locator(".plan-row div").nth(1).locator("b").textContent();
  ok(Number(hardK.replace(/,/g, "")) > Number(avgK.replace(/,/g, "")), `a hard training day raises today's calories: ${avgK} to ${hardK}`);
  // from Me, Goal: the same screen comes with a way back
  await page.locator("nav button").filter({ hasText: "Me" }).click(); await page.waitForTimeout(300);
  await page.locator(".me-rows .menu-row").filter({ hasText: /^Goal/ }).first().click(); await page.waitForTimeout(300);
  ok(await page.locator(".day-table").count() === 1, "Me, Goal shows the same four-day table");
  await page.getByRole("button", { name: /Change the goal/ }).click(); await page.waitForTimeout(300);
  ok(await page.getByRole("button", { name: "← Me" }).count() === 1, "opened from Me, the goal screen has a way back to Me");
  await page.getByRole("button", { name: "← Me" }).click(); await page.waitForTimeout(300);
  // my own numbers, each day its own
  await page.getByRole("button", { name: /Change the goal/ }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "My own numbers" }).click(); await page.waitForTimeout(200);
  await page.getByLabel("Rest, passive, kcal").fill("1700"); await page.getByLabel("Rest, passive, kcal").press("Enter"); await page.waitForTimeout(200);
  ok(/Set by you|Filled:/.test(await page.locator(".dt-block").first().textContent()) && /Calculated, nothing typed/.test(await page.locator(".dt-block").nth(1).textContent()), "own numbers: a typed day says set by you, an empty one calculated");
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
