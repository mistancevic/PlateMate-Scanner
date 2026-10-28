// Changed by DT140 (0.2.125, board Stories96; Anna's DT117): the week is the source, tap a day; Move to on Training week.
// JOURNEY INVARIANT (Milan, 7 October 2026, canvas boards T1 and T3): Calculate for me asks your everyday first (your work,
// steps on a usual day, counted on every day), then your training: Light, Moderate and Hard, each with its zones, − and +,
// and How long as a range from 15 minutes. There is no Rest row: the days left are days without training, and + stops at 7.
// The training days are the Training week's. The day settings say No training, have no Walk (walking is in the steps), and
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
    await page.getByRole("button", { name: /^I agree$/ }).click(); await page.waitForTimeout(200); await require("./door.cjs")(page);
    await page.getByRole("button", { name: /^Male$/ }).click();
    const inputs = page.locator(".calc-way input");
    await inputs.nth(0).fill("1981"); await inputs.nth(1).fill("182"); await inputs.nth(2).fill("96"); await inputs.nth(2).blur(); await page.waitForTimeout(200);
    const form = page.locator(".calc-way .form");
    const parts = await form.locator(".calc-part b").allTextContents();
    ok(parts.join("|") === "Lifestyle|Your training", "Lifestyle first (DT139: one name), then your training: " + parts.join(", "));
    // your everyday
    ok(await page.getByRole("button", { name: /Mostly sitting/ }).count() === 1, "your work, as before");
    await page.getByRole("group", { name: "Steps on a usual day" }).getByRole("button", { name: "8,000–12,000" }).click(); await page.waitForTimeout(150);
    ok((await saved()).steps === "8to12", "steps on a usual day are kept");
    // your training: no Rest row, a new week has no training
    ok(await page.getByRole("button", { name: /More Rest/ }).count() === 0, "no Rest row with − and +");
    const tally = () => page.locator(".train-tally").textContent();
    // DT140 (0.2.125, board Stories96): the week is the source; tap a day, say how hard, how long, when; the count follows
    ok(/0 training days/.test(await tally()) && /7 without/.test(await tally()), "a new week: 0 training days, 7 without: " + (await tally()));
    ok(await page.locator(".week-setup .wk-day").count() === 7 && await page.getByRole("button", { name: "More Light days" }).count() === 0, "seven days, Monday first; no counter to guess from");
    const setDay = async (day, level) => { await page.getByRole("button", { name: new RegExp(`^${day}:`) }).click(); await page.waitForTimeout(150); await page.getByRole("group", { name: `${day}, how hard` }).getByRole("button", { name: level, exact: true }).click(); await page.waitForTimeout(150); };
    await setDay("Monday", "Hard"); await setDay("Wednesday", "Moderate"); await setDay("Friday", "Moderate"); await setDay("Sunday", "Light");
    ok(/4 training days/.test(await tally()) && /Mon, Wed, Fri, Sun · 3 without/.test(await tally()), "4 training days, the ones tapped: " + (await tally()));
    await page.getByRole("button", { name: /^Monday:/ }).click(); await page.waitForTimeout(150);
    ok(await page.getByRole("group", { name: "Monday, how long" }).getByRole("button", { name: "60 to 90 min", pressed: true }).count() === 1, "Hard starts at 60 to 90 min");
    await page.getByRole("group", { name: "Monday, how long" }).getByRole("button", { name: "15 to 30 min" }).click(); await page.waitForTimeout(150);
    await page.getByRole("group", { name: "Monday, when" }).getByRole("button", { name: "Morning" }).click(); await page.waitForTimeout(150);
    let p = await saved();
    ok(p.plan[0].intensity === "hard" && p.plan[0].minutes === 25 && p.plan[0].when === "morning" && p.plan[4].intensity === "moderate" && p.plan[1].kind === "rest", "a 15 to 30 minute HIIT on Monday morning counts as 25 minutes; Friday is moderate; Tuesday rests");
    ok(/Hard · 15 to 30 min · morning/.test(await page.getByRole("button", { name: /^Monday:/ }).textContent()), "the day says what it is");
    await page.getByRole("button", { name: /What light, moderate and hard mean/ }).click(); await page.waitForTimeout(150);
    ok(/Zone 1/.test(await form.textContent()) && /Zone 4/.test(await form.textContent()) && /Walking goes in steps/.test(await form.textContent()), "the zones, behind one line; walking goes in steps");
    // the numbers count the steps on a day without training
    // DT139 (0.2.124): no goal is picked for you; the days show once one is
    await page.getByRole("button", { name: /^Maintain/ }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Each day its own" }).click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Apply from today/ }).last().click(); await page.waitForTimeout(500);
    // the Training week has the same days
    await require("./me.cjs")(page);
    await page.getByText("Training week", { exact: true }).first().click(); await page.waitForTimeout(400);
    const agenda = await page.locator(".week-card").textContent();
    const restRows = (await page.locator(".agenda-row").allTextContents()).filter((x) => /No training/.test(x)).length;
    ok(restRows === 3 && /Strength, hard/.test(agenda) && /Mobility, light/.test(agenda), "the Training week holds the same week: " + restRows + " days without training; " + agenda.replace(/\s+/g, " ").slice(0, 120));
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
    // DT140: Move to, one tap, keeps the time; each day keeps whether it is a work day
    await page.locator(".agenda-row").nth(2).click(); await page.waitForTimeout(200);
    await page.getByRole("group", { name: "Move Wednesday to" }).getByRole("button", { name: "Thu" }).click(); await page.waitForTimeout(300);
    p = await saved();
    ok(p.plan[3].intensity === "moderate" && p.plan[3].kind === "strength" && p.plan[3].when === "evening" && p.plan[2].kind === "rest" && p.plan[2].work === p.plan[3].work, "Move Wednesday to Thursday: the training goes as it is; Wednesday rests");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
