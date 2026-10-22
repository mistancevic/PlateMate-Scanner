// The day adds up (DT74, board DT74, Milan 22 October 2026: Anna's first run). A brand-new person, no recipes of her own,
// only Chef Mealan's starters: a woman of 63 kg who lifts three times a week and wants to build muscle. Tomorrow is planned
// slot by slot. Checked across the whole day, not one screen: each slot shows what is left once the others are planned;
// "fits" only where a meal fits, "close" where it lands around the target, its size named; a full day well off its kcal
// says so, and Fit the portions brings it within a tenth; Back to the usual portions undoes it; every target names its day,
// and the same day's target is the same number on Plan and in the top bar.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.meals = []; seed.items = []; seed.feedback = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3199" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const lift = { work: true, kind: "strength", intensity: "moderate", when: "evening", minutes: 50 }, rest = { work: true, kind: "rest" };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) {
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "gainsteady", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "female", birthYear: 1992, heightCm: 168, weightKg: 63, plan: s.__plan, lifestyle: { meals: 3, window: { from: "07:30", to: "20:00" } } }));
    localStorage.setItem("seeded", "1"); } }, { ...seed, __plan: [lift, rest, lift, rest, lift, { work: false, kind: "rest" }, { work: false, kind: "rest" }] });
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3199/"); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ");
  const num = (s) => Number(String(s).replace(/,/g, ""));

  // the same day's target, the same number: Plan for today and the top bar both name today
  const head = await txt(".plan-head .plan-row");
  const planToday = (head.match(/of PD ([\d.]+), today's target/) || [])[1];
  const bar = await txt("header .ref");
  ok(!!planToday && new RegExp(`PD ${planToday.replace(".", "\\.")} today`).test(bar), `today's target is one number, named today, on Plan and in the top bar: Plan ${planToday}, bar "${bar}"`);

  // tomorrow, slot by slot
  await page.evaluate(() => { const on = [...document.querySelectorAll(".day-strip .choice")].findIndex((c) => c.classList.contains("on")); document.querySelectorAll(".day-strip .choice")[on + 1].click(); });
  await page.waitForTimeout(300);
  const dayName = (await txt(".plan-day-head b")).split(",")[0].trim();
  ok(new RegExp(`of PD [\\d.]+, ${dayName}'s target`).test(await txt(".plan-head .plan-row")), `the day planned names its own target: ${dayName}'s`);
  const dayKcal = num((await txt(".plan-head .plan-row")).match(/of ([\d,]+) kcal/)[1]);

  await page.getByRole("button", { name: /Breakfast at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  const need1 = num((await txt(".pick-sheet .pick-why")).match(/needs about ([\d,]+) kcal/)[1]);
  // Sarma, under the target: never "fits"; its number is named PD
  const sarma = page.locator(".pick-sheet .pick-row", { hasText: "Sarma" });
  const sarmaMark = ((await sarma.locator(".pick-pd").textContent()) ?? "").replace(/\s+/g, " ");
  ok(/^PD [\d.]+/.test(sarmaMark) && !/fits/.test(sarmaMark), `a meal under the target never says fits, and its number says PD: "${sarmaMark}"`);
  ok(await page.locator(".pick-sheet .pick-pd.fits").count() >= 1, "a starter that does fit still says fits");
  await page.locator(".pick-sheet").getByRole("button", { name: /Skyr bowl with berries/ }).click(); await page.waitForTimeout(400);

  await page.getByRole("button", { name: /Lunch at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  const why2 = await txt(".pick-sheet .pick-why");
  const need2 = num((why2.match(/about ([\d,]+) kcal/) || [])[1]);
  ok(/With the other meals planned, it has about [\d,]+ kcal and \d+ g of protein left/.test(why2) && need2 > 0, "the next slot counts what is already planned: " + why2.slice(0, 120));
  ok(need2 === Math.round((dayKcal - 420) / 2), `lunch has the day less breakfast, shared with dinner: ${need2} = (${dayKcal} − 420) ÷ 2`);
  ok(need2 !== need1, `it moved: ${need1} before breakfast, ${need2} after`);
  await page.locator(".pick-sheet").getByRole("button", { name: /Tuna salad wrap/ }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Dinner at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  await page.locator(".pick-sheet").getByRole("button", { name: /Omelette with bread/ }).click(); await page.waitForTimeout(400);

  // the whole day: 420 + 480 + 450 = 1,350 kcal against the day's target, more than a tenth short
  const sumKcal = () => txt(".plan-head .plan-row").then((t) => num(t.match(/([\d,]+)\s*of [\d,]+ kcal/)[1]));
  ok(/all slots set/.test(await txt(".plan-head .plan-day-head small")) && await sumKcal() === 1350, "all slots set, 1,350 kcal planned");
  const off = await txt(".plan-off");
  ok(new RegExp(`${(dayKcal - 1350).toLocaleString("en")} kcal short of ${dayName}'s ${dayKcal.toLocaleString("en")} kcal`).test(off) && /Add a snack, or make the portions bigger/.test(off), "the day says it is short, by how much: " + off.slice(0, 90));
  await page.getByRole("button", { name: `Fit the portions to ${dayName}` }).click(); await page.waitForTimeout(500);
  const after = await sumKcal();
  ok(Math.abs(after - dayKcal) / dayKcal <= 0.1 && await page.locator(".plan-off").count() === 0, `Fit the portions: the day lands within a tenth, ${after} of ${dayKcal} kcal, and the warning goes`);
  ok(/\d(\.\d+)? portions/.test(await txt(".plan-slot-wrap")), "each meal says how much of it: " + (await txt(".plan-slot-wrap")).slice(0, 80));
  await page.getByRole("button", { name: "Back to the usual portions" }).click(); await page.waitForTimeout(500);
  ok(await sumKcal() === 1350 && await page.locator(".plan-off").count() === 1, "Back to the usual portions: 1,350 kcal again, the warning back");

  // Me: the average day is called that
  await page.getByRole("button", { name: "Menu" }).click(); await page.waitForTimeout(500);
  await page.locator(".menu-row", { hasText: /^Me$/ }).first().click(); await page.waitForTimeout(600);
  ok(/PD, average day/.test(await txt("main")) && /kcal, average day/.test(await txt("main")), "Me names the average day");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
