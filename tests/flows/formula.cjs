// The goal calculator (canvas board FX, G1a to G3, Milan 14 October 2026; the formula card from board TW, F1 and F2).
// 1 You, 2 the formula, 3 the goal, 4 the days, then Apply from a date. The formula is a draft until applied. A goal from a
// later date waits on Me, Goal and Plan already uses it; a day gone by keeps its own target; History shows periods.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3197" }, stdio: ["ignore", "pipe", "pipe"] });
  process.on("unhandledRejection", (e) => { console.log("FAIL " + e.message); server.kill(); process.exit(1); });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const y = new Date(); y.setDate(y.getDate() - 1); const yKey = ymd(y);
  const d0 = new Date(); d0.setDate(d0.getDate() - 20); const early = d0.toISOString();
  const t = (h, m) => { const x = new Date(); x.setDate(x.getDate() - 3); x.setHours(h, m, 0, 0); return x.toISOString(); };
  const log = [{ at: early, band: "maintain", kcal: 2600, protein: 150, source: "profile" }, { at: t(19, 2), band: "fatloss", kcal: 2100, protein: 190, source: "profile" }, { at: t(19, 3), band: "gainsteady", kcal: 2900, protein: 180, source: "profile" }, { at: t(19, 5), band: "maintain", kcal: 2600, protein: 150, source: "profile" }];
  await page.addInitScript(([s, yKey, log]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("seeded", "1");
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-goal-log", JSON.stringify(log));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "male", birthYear: new Date().getFullYear() - 45, heightCm: 182, weightKg: 95, dayMode: "each", plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 }, targets: { [yKey]: { kcal: 1234, protein: 111, fats: 40, carbs: 100 } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], allergies: [], flags: [], consentBodyAt: "2026-10-05T10:00:00Z", consentBy: "self", none: true, declaredAt: "2026-10-05T10:00:00Z", adultAt: "2026-10-05T09:00:00Z" }));
  }, [seed, yKey, log]);
  await require("./adult.cjs")(page);
  const personal = () => page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")));
  // Me, Goal: one line for the formula, History as periods
  await page.goto("http://127.0.0.1:3197/me/goal"); await page.waitForTimeout(1200);
  ok(await page.locator(".formula-card").count() === 0 && /Automatic: Mifflin St Jeor now/.test(await page.locator(".formula-line").textContent()), "Me, Goal says which formula is in use, in one line");
  const hist = await page.locator(".card.history .history-row").allTextContents();
  ok(hist.length === 1 && /NOW/.test(hist[0]) && /^Maintain/.test(hist[0]) && /Since/.test(hist[0]), "three tries on one day leave one period: " + hist.join(" | "));
  // the calculator: 1 You, 2 the formula, 3 the goal, 4 the days
  await page.locator(".formula-line").getByRole("button", { name: "Change" }).click(); await page.waitForTimeout(700);
  const steps = await page.locator(".calc-step, .section-title").allTextContents();
  ok(steps.join("|").includes("1. You|2. The formula|3. What are you after?|4. Your days"), "the calculator in four steps: " + steps.join(" | "));
  ok(/Body fat: not given/.test(await page.locator(".you-card").textContent()), "You shows the body fat, or that it is not given");
  const card = page.locator(".formula-card");
  const opts = await card.locator(".opt-grid .opt").allTextContents();
  ok(opts.length === 4 && /Mifflin St Jeor1,868 kcal at rest/.test(opts[1]) && /Schofield1,963 kcal at rest/.test(opts[3]), "four choices with the resting burn from each");
  // 0.2.7 (board FT, FT5): a fifth, From your data, greyed until the burn is measured
  ok(await card.locator(".opt-wide").isDisabled() && /From your dataNot enough data yet/.test(await card.locator(".opt-wide").textContent()), "From your data waits, greyed, until the burn is measured");
  ok(await card.locator(".opt").nth(2).isDisabled() && /Add your body fat under You/.test(opts[2]), "Katch McArdle sleeps without body fat");
  ok(/Schofield gives 95 kcal more at rest than Mifflin St Jeor\. With your everyday that is about 120 kcal more a day/.test(await card.textContent()), "the difference in plain numbers");
  const before = await page.locator(".day-table").textContent();
  await card.getByRole("button", { name: /^Schofield/ }).click(); await page.waitForTimeout(300);
  ok((await personal()).formula === undefined, "the pick is a draft: nothing saved yet");
  const after = await page.locator(".day-table").textContent();
  ok(before !== after && /Schofield 1985/.test(after), "the days follow the draft and the sources name Schofield");
  await card.getByRole("button", { name: "About the three formulas ›" }).click(); await page.waitForTimeout(200);
  ok(/Schofield \(1985\)/.test(await card.locator(".formula-text").textContent()), "About the three formulas opens");
  ok(/^Apply from today$/.test((await page.getByRole("button", { name: /^Apply from/ }).textContent()).trim()), "Apply from today, by default");
  await page.getByRole("button", { name: /^Apply from/ }).click(); await page.waitForTimeout(600);
  ok((await personal()).formula === "schofield", "Apply keeps the formula");
  // a goal from a later date: it waits, Today keeps the goal, Plan uses the new one from its date
  await page.goto("http://127.0.0.1:3197/me/goal"); await page.waitForTimeout(1000);
  ok(/Schofield/.test(await page.locator(".formula-line").textContent()), "Me, Goal says Schofield now");
  await page.locator(".formula-line").getByRole("button", { name: "Change" }).click(); await page.waitForTimeout(700);
  await page.getByRole("button", { name: /^Lose fat/ }).click(); await page.waitForTimeout(200);
  const chips = page.getByRole("group", { name: "Apply from" }).locator(".choice");
  await chips.nth(2).click(); await page.waitForTimeout(200);
  const label = (await page.getByRole("button", { name: /^Apply from/ }).textContent()).trim();
  ok(/^Apply from Monday \d+ \w+$/.test(label), "the date is on the button: " + label);
  await page.getByRole("button", { name: /^Apply from/ }).click(); await page.waitForTimeout(700);
  const p1 = await personal();
  ok(p1.nextGoal?.band === "fatloss" && await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-goal")).band) === "maintain", "the new goal waits; the goal in use stays");
  await page.goto("http://127.0.0.1:3197/me/goal"); await page.waitForTimeout(1000);
  ok(/NEXT, FROM MONDAY/.test(await page.locator(".next-goal").textContent()) && /Lose fat/.test(await page.locator(".next-goal").textContent()), "Me, Goal shows the waiting goal with its date");
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(600);
  // Changed by story SL2 (board SL2): a day ahead says its target in the head card's numbers; a past day keeps its line
  const kcalOf = async () => Number((await page.locator(".plan-head .plan-row > div:nth-child(2) small, .plan-past .plan-day-head small").first().textContent()).match(/([\d,]+) kcal/)[1].replace(/,/g, ""));
  const todayKcal = await kcalOf();
  // on a Sunday next Monday is in the week after (found 18 October 2026)
  const sunday = new Date().getDay() === 0;
  if (sunday) { await page.getByRole("button", { name: "Week after" }).click(); await page.waitForTimeout(300); }
  const nextMon = await page.evaluate((from) => [...document.querySelectorAll(".day-strip .choice")].findIndex((x) => x.textContent.trim().endsWith(" " + String(Number(from.slice(8))))), p1.nextGoal.from);
  await page.evaluate((i) => document.querySelectorAll(".day-strip .choice")[i].click(), nextMon); await page.waitForTimeout(300);
  ok(nextMon >= 0 && await kcalOf() < todayKcal, "Plan already uses the waiting goal from its date");
  // a day gone by keeps its own target
  const yIdx = (y.getDay() + 6) % 7;
  if (sunday) { await page.getByRole("button", { name: "Week before" }).click(); await page.waitForTimeout(300); }
  if ((new Date().getDay() + 6) % 7 === 0) { await page.getByRole("button", { name: "Week before" }).click(); await page.waitForTimeout(300); }
  await page.evaluate((i) => document.querySelectorAll(".day-strip .choice")[i].click(), yIdx); await page.waitForTimeout(300);
  ok(/1,234 kcal/.test(await page.locator(".plan-day-head small").textContent()), "yesterday keeps the target it had");
  // Cancel the waiting goal
  await page.goto("http://127.0.0.1:3197/me/goal"); await page.waitForTimeout(1000);
  await page.locator(".next-goal").getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(300);
  ok(!(await personal()).nextGoal && await page.locator(".next-goal").count() === 0, "Cancel takes the waiting goal away");
  ok(!/kids|children|child/i.test(await page.locator("main").textContent()), "the page says nothing about children");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill(); process.exit(fail ? 1 : 0);
})();
