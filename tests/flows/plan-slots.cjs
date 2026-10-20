// Plan, 0.2.1 (canvas S "Plan purpose one" and H): the day's slots from Lifestyle, the training row from the Training week,
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
  // Changed by story R19 (Milan 06:36, board RS18): a slot's time sits in its line, Breakfast, 07:30, not in a column of its own;
  // the training row keeps its column. These read the times and names from there; what they check is unchanged.
  const slotTimes = async () => (await page.locator(".plan-slot .menu-row-text small:first-child").allTextContents()).map((t) => t.split(", ")[1]);
  const slotNames = async () => (await page.locator(".plan-slot .menu-row-text small:first-child").allTextContents()).map((t) => t.split(",")[0]);
  const rowTimes = () => page.evaluate(() => [...document.querySelectorAll(".plan-day .plan-training, .plan-day .plan-slot")].map((r) => r.querySelector(".plan-time")?.textContent.trim() ?? (r.querySelector(".menu-row-text small")?.textContent.split(", ")[1] ?? "")));
  const times = await slotTimes();
  ok(times.join(" ") === "07:30 11:40 15:50 20:00", "four slots spread over the eating window: " + times.join(" "));
  ok((await slotNames()).join(",") === "Breakfast,Lunch,Snack,Dinner", "named Breakfast, Lunch, Snack, Dinner");
  // Changed by story SL2 (Milan 16:03 to 16:11, board SL2): the open slots are in the day's line in the head card at the top
  ok(await page.locator(".plan-slot .plan-pick").count() === 4 && /4 slots open/.test(await page.locator(".plan-head .plan-day-head small").textContent()), "every slot says Pick a meal, the box counts them open");
  // next Monday (a date to come: a past date shows what was eaten instead): a hard evening session with no time set says
  // Evening and sits before dinner (board FX, TT2); the line carries the day's numbers
  await page.evaluate(() => document.querySelectorAll(".day-strip .choice")[7].click()); await page.waitForTimeout(300);
  const rows = await rowTimes();
  ok(rows.join(" ") === "07:30 11:40 15:50 Evening 20:00", "Monday: no clock time made up, the evening sits before Dinner: " + rows.join(" "));
  ok(/From my Training week/.test(await page.locator(".plan-training").textContent()) && /Strength, hard, 60 min/.test(await page.locator(".plan-training").textContent()), "the training row reads the Training week");
  // Changed by story SL2 (board SL2): the target is said once, in the head card's numbers; the line has the kind of day
  const dayKcal = async () => (await page.locator(".plan-head .plan-row small").nth(1).textContent()).match(/of ([\d,]+) kcal/)[1];
  const line = await page.locator(".plan-day-head small").textContent();
  ok(/^training in the evening · \d slots? open$/.test(line) && /^[\d,]+$/.test(await dayKcal()), "the day's line: " + line);
  // a clock time set for this date places the row and the line says it
  await page.locator(".plan-training").click(); await page.waitForTimeout(300);
  await page.locator(".date-sheet").getByLabel("Starts at").fill("18:15"); await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Save for this date" }).click(); await page.waitForTimeout(400);
  ok((await rowTimes()).join(" ") === "07:30 11:40 15:50 18:15 20:00" && /training at 18:15/.test(await page.locator(".plan-day-head small").textContent()), "Starts at 18:15: the row and the line say 18:15");
  // weeks both ways (board FX, PW1): ahead, and This week back
  const wk = await page.locator(".week-arrows-mid").textContent();
  await page.getByRole("button", { name: "Week after" }).click(); await page.waitForTimeout(300);
  ok((await page.locator(".week-arrows-mid").textContent()) !== wk && await page.getByRole("button", { name: "This week" }).count() === 1 && await page.locator(".plan-slot").count() > 0, "a week ahead has slots to fill, and This week");
  await page.getByRole("button", { name: "This week" }).click(); await page.waitForTimeout(300);
  ok(await page.getByRole("button", { name: "This week" }).count() === 0 && /^Today, /.test(await page.locator(".plan-day-head b").textContent()), "This week comes back to today");
  await page.evaluate(() => document.querySelectorAll(".day-strip .choice")[7].click()); await page.waitForTimeout(300);
  // Tuesday: a rest day, no training row, fewer calories
  const monKcal = Number((await dayKcal()).replace(/,/g, ""));
  await page.evaluate(() => document.querySelectorAll(".day-strip .choice")[8].click()); await page.waitForTimeout(300);
  const tue = await page.locator(".plan-day-head small").textContent();
  ok(await page.locator(".plan-training").count() === 0 && /rest day/.test(tue), "Tuesday: a rest day, no training row");
  ok(Number((await dayKcal()).replace(/,/g, "")) < monKcal, "and fewer calories than the training day");
  // Lifestyle: the slot times, changed by hand; Plan follows
  await page.getByRole("button", { name: "Slots and times" }).click(); await page.waitForTimeout(500);
  ok(await page.locator(".slot-times input").count() === 4, "Lifestyle shows the four slot times");
  await page.locator(".slot-times input").nth(1).fill("12:30"); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(500);
  ok((await slotTimes()).join(" ") === "07:30 12:30 15:50 20:00", "Lunch moved to 12:30 in Plan");
  await page.getByRole("button", { name: "Slots and times" }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "3", exact: true }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".slot-times input").count() === 3, "three meals a day gives three slots");
  await page.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(500);
  ok((await slotNames()).join(",") === "Breakfast,Lunch,Dinner" && /3 slots open/.test(await page.locator(".plan-head .plan-day-head small").textContent()), "Plan shows Breakfast, Lunch, Dinner, 3 open");
  ok(errs.length === 0, errs.length ? "page errors: " + errs.join(" | ") : "no page errors");
  await b.close(); server.kill();
  process.exit(fail ? 1 : 0);
})();
