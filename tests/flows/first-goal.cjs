// JOURNEY INVARIANT (Milan, 4 October 2026, after Mia's sign-up): the first screen after sign-in works the day out from body data,
// consent first, and gives four numbers: calories, protein, fat, carbs. A rough goal and own numbers are the other two ways, never the only ones.
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
  ok(await page.getByRole("button", { name: /Work it out for me/ }).count() === 1, "the first screen offers to work the day out");
  ok(await page.locator(".calc-way .consent").count() === 1, "consent comes before the body fields");
  ok(await page.locator(".calc-way .form.shut").count() === 1, "the fields are shut until consent");
  await page.getByRole("button", { name: /^I agree$/ }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /^Female$/ }).click();
  const inputs = page.locator(".calc-way input");
  await inputs.nth(0).fill("2009"); await inputs.nth(1).fill("168"); await inputs.nth(2).fill("58"); await inputs.nth(2).blur();
  await page.locator(".activity").nth(1).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /^Lose fat$/ }).click(); await page.waitForTimeout(200);
  const four = await page.locator(".four").textContent();
  ok(/g protein/.test(four) && /g fat/.test(four) && /g carbs/.test(four), "four numbers appear as you type: " + four.replace(/\s+/g, " ").slice(0, 60));
  ok(/Under 18/.test(await page.locator(".proposal").textContent()), "a 17-year-old picking Lose fat gets no deficit, and is told");
  await page.getByRole("button", { name: /Set my day/ }).click(); await page.waitForTimeout(600);
  const g = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).goals);
  ok(g.calories > 0 && g.protein > 0 && g.fats > 0 && g.carbs > 0, "the day is saved with all four: " + JSON.stringify(g));
  ok(/g fat · \d+ g carbs/.test(await page.locator(".macro-line").first().textContent()), "the Today card carries fat and carbs");
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
