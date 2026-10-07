// JOURNEY INVARIANT (Milan, 7 October 2026, canvas boards T1 and T3): Calculate for me asks your everyday first (your work,
// steps on a usual day, counted on every day), then your training: Light, Moderate and Hard, each with its zones, − and +,
// and How long as a range from 15 minutes. There is no Rest row: the days left are days without training, and + stops at 7.
// The training days are the Weekly plan's. The day settings say No training, have no Walk (walking is in the steps), and
// offer Light, Moderate and Hard with their zones and the same ranges.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3191", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal") || "{}"));
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3191/"); await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Not now" }).click(); await page.waitForTimeout(400);
    await page.getByText(/Set your goal/).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: /^I agree$/ }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: /^Male$/ }).click();
    const inputs = page.locator(".calc-way input");
    await inputs.nth(0).fill("1981"); await inputs.nth(1).fill("182"); await inputs.nth(2).fill("96"); await inputs.nth(2).blur(); await page.waitForTimeout(200);
    const form = page.locator(".calc-way .form");
    const parts = await form.locator(".calc-part b").allTextContents();
    ok(parts.join("|") === "Your everyday|Your training", "your everyday first, then your training: " + parts.join(", "));
    // your everyday
    ok(await page.getByRole("button", { name: /9 to 5 at a desk/ }).count() === 1, "your work, as before");
    await page.getByRole("group", { name: "Steps on a usual day" }).getByRole("button", { name: "8,000–12,000" }).click(); await page.waitForTimeout(150);
    ok((await saved()).steps === "8to12", "steps on a usual day are kept");
    // your training: no Rest row, a new week has no training
    ok(await page.getByRole("button", { name: /More Rest/ }).count() === 0, "no Rest row with − and +");
    const tally = () => page.locator(".train-tally").textContent();
    ok(/0 training days/.test(await tally()) && /7 days without training/.test(await tally()), "a new week: 0 training days, 7 without: " + (await tally()));
    ok(await page.getByRole("button", { name: "More Light days" }).isEnabled(), "+ works straight away");
    ok(/Zone 1/.test(await form.textContent()) && /Zone 4/.test(await form.textContent()) && /Walking goes in steps/.test(await form.textContent()), "each row names its zones; walking goes in steps");
    await page.getByRole("button", { name: "More Hard days" }).click();
    await page.getByRole("button", { name: "More Moderate days" }).click(); await page.getByRole("button", { name: "More Moderate days" }).click();
    await page.getByRole("button", { name: "More Light days" }).click(); await page.waitForTimeout(200);
    ok(/4 training days/.test(await tally()) && /3 days without training/.test(await tally()), "4 training days, 3 without");
    const hard = page.getByRole("group", { name: "Hard, how long" });
    ok(await hard.getByRole("button", { name: "60–90 min", pressed: true }).count() === 1, "Hard starts at 60–90 min");
    ok(await page.getByRole("group", { name: "Light, how long" }).getByRole("button", { name: "30–45 min", pressed: true }).count() === 1, "Light starts at 30–45 min");
    await hard.getByRole("button", { name: "15–30 min" }).click(); await page.waitForTimeout(200);
    let p = await saved();
    ok(p.plan && p.plan.filter((d) => d.intensity === "hard").every((d) => d.minutes === 25), "a 15–30 minute HIIT counts as 25 minutes on the plan");
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "More Hard days" }).click();
    await page.waitForTimeout(200);
    ok(/7 training days/.test(await tally()) && !(await page.getByRole("button", { name: "More Light days" }).isEnabled()), "+ stops at 7 training days");
    await page.getByRole("button", { name: "Fewer Hard days" }).click(); await page.waitForTimeout(200);
    ok(/6 training days/.test(await tally()) && /1 day without training/.test(await tally()), "a − gives a day back, never stuck");
    await page.getByRole("button", { name: "Fewer Hard days" }).click(); await page.getByRole("button", { name: "Fewer Hard days" }).click(); await page.waitForTimeout(200);
    // the numbers count the steps on a day without training
    await page.getByRole("button", { name: "Each day its own" }).click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Set my day|Save/ }).last().click(); await page.waitForTimeout(500);
    // the Weekly plan has the same days
    await page.locator("nav button").filter({ hasText: "Me" }).click(); await page.waitForTimeout(300);
    await page.getByText("Weekly plan", { exact: true }).first().click(); await page.waitForTimeout(400);
    await page.getByRole("tab", { name: "Usual week" }).click(); await page.waitForTimeout(200);
    const agenda = await page.locator(".week-card").textContent();
    const restRows = (await page.locator(".agenda-row").allTextContents()).filter((x) => /No training/.test(x)).length;
    ok(restRows === 3 && /Strength, hard/.test(agenda) && /Mobility, light/.test(agenda), "the Weekly plan holds the same week: " + restRows + " days without training; " + agenda.replace(/\s+/g, " ").slice(0, 120));
    // the day settings
    await page.locator(".agenda-row").nth(0).click(); await page.waitForTimeout(200);
    const ed = page.locator(".day-editor");
    ok(await ed.getByRole("button", { name: /^No training$/ }).count() === 1 && await ed.getByRole("button", { name: /^Walk$/ }).count() === 0, "No training, and no Walk");
    const hardPick = ed.getByRole("group", { name: "How hard" });
    ok((await hardPick.locator("button").allTextContents()).map((x) => x.split("Zone")[0]).join("|") === "Light|Moderate|Hard", "How hard: Light, Moderate, Hard");
    ok(/Zone 2/.test(await hardPick.textContent()) && /Zone 5/.test(await hardPick.textContent()), "each with its zones");
    const lens = await ed.locator(".setting").filter({ hasText: "How long" }).locator("button").allTextContents();
    ok(lens.join("|") === "15–30 min|30–45 min|45–60 min|60–90 min|90+ min", "How long as ranges: " + lens.join(", "));
    await ed.getByRole("button", { name: /^No training$/ }).click(); await page.waitForTimeout(200);
    ok(/Your work and your steps still count/.test(await ed.textContent()), "No training says the work and the steps still count");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
