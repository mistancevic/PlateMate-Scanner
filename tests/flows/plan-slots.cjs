// Plan, 0.2.1 (canvas S "Plan purpose one" and H): the day's slots from Lifestyle, the training row from the Weekly plan,
// the day's numbers, and the slot times changed in Lifestyle.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3197" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const hard = { work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }, rest = { work: true, kind: "rest" };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: [{ work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }, { work: true, kind: "rest" }, { work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }, { work: true, kind: "rest" }, { work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }, { work: false, kind: "rest" }, { work: false, kind: "rest" }], lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 4, window: { from: "07:30", to: "20:00" } } })); localStorage.setItem("seeded", "1"); } }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3197/"); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  ok(await page.locator(".day-strip .choice").count() === 14 && await page.locator(".day-strip .choice.on").count() === 1, "a strip of two weeks, today marked");
  ok(/^Today, /.test(await page.locator(".plan-day-head b").textContent()), "the card names today");
  const times = await page.locator(".plan-slot .plan-time").allTextContents();
  ok(times.join(" ") === "07:30 11:40 15:50 20:00", "four slots spread over the eating window: " + times.join(" "));
  ok((await page.locator(".plan-slot .menu-row-text small").allTextContents()).join(",") === "Breakfast,Lunch,Snack,Dinner", "named Breakfast, Lunch, Snack, Dinner");
  ok(await page.locator(".plan-slot .plan-pick").count() === 4 && /4 slots open/.test(await page.locator(".plan-top").textContent()), "every slot says Pick a meal, the box counts them open");
  // Monday: a hard evening session sits between the slots at 17:30; the line carries the day's numbers
  await page.getByRole("tab", { name: /^Mon/ }).first().click(); await page.waitForTimeout(300);
  const rows = await page.locator(".plan-day .menu-row .plan-time").allTextContents();
  ok(rows.join(" ") === "07:30 11:40 15:50 17:30 20:00", "Monday: the training row at 17:30 between Snack and Dinner: " + rows.join(" "));
  ok(/From my Weekly plan/.test(await page.locator(".plan-training").textContent()) && /Strength, hard, 60 min/.test(await page.locator(".plan-training").textContent()), "the training row reads the Weekly plan");
  const line = await page.locator(".plan-day-head small").textContent();
  ok(/\d kcal · \d+ g protein · training at 17:30/.test(line), "the day's line: " + line);
  // Tuesday: a rest day, no training row, fewer calories
  const monKcal = Number(line.match(/([\d,]+) kcal/)[1].replace(/,/g, ""));
  await page.getByRole("tab", { name: /^Tue/ }).first().click(); await page.waitForTimeout(300);
  const tue = await page.locator(".plan-day-head small").textContent();
  ok(await page.locator(".plan-training").count() === 0 && /rest day/.test(tue), "Tuesday: a rest day, no training row");
  ok(Number(tue.match(/([\d,]+) kcal/)[1].replace(/,/g, "")) < monKcal, "and fewer calories than the training day");
  // Lifestyle: the slot times, changed by hand; Plan follows
  await page.getByRole("button", { name: "Slots and times" }).click(); await page.waitForTimeout(500);
  ok(await page.locator(".slot-times input").count() === 4, "Lifestyle shows the four slot times");
  await page.locator(".slot-times input").nth(1).fill("12:30"); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(500);
  ok((await page.locator(".plan-slot .plan-time").allTextContents()).join(" ") === "07:30 12:30 15:50 20:00", "Lunch moved to 12:30 in Plan");
  await page.getByRole("button", { name: "Slots and times" }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "3", exact: true }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".slot-times input").count() === 3, "three meals a day gives three slots");
  await page.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(500);
  ok((await page.locator(".plan-slot .menu-row-text small").allTextContents()).join(",") === "Breakfast,Lunch,Dinner" && /3 slots open/.test(await page.locator(".plan-top").textContent()), "Plan shows Breakfast, Lunch, Dinner, 3 open");
  ok(errs.length === 0, errs.length ? "page errors: " + errs.join(" | ") : "no page errors");
  await b.close(); server.kill();
  process.exit(fail ? 1 : 0);
})();
