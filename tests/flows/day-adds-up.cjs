// The day adds up (DT74, board DT74, Milan 22 October 2026: Anna's first run). A brand-new person, no recipes of her own,
// only Chef Mealan's starters: a woman of 63 kg who lifts three times a week and wants to build muscle. Tomorrow is planned
// slot by slot. Checked across the whole day, not one screen: each slot shows what is left once the others are planned;
// "fits" only where a meal fits, "close" where it lands around the target, its size named; a full day well off its kcal
// says so, and Fit the portions brings it within a tenth; Back to the usual portions undoes it; every target names its day,
// and the same day's target is the same number on Plan and in the top bar.
// Changed by story DT75 (Milan 22 October 23:54 to 23:58, board DT75, Anna's second run): the day's kcal is a range, a tenth
// either side (2,100: 1,900 to 2,300); off says how far from its edge; Fit the portions lands inside it in quarters and says
// so; protein shows the person's range, and above it a quiet line; the slot line gives the PD of what is left, and the
// picker judges against it, with no size mark.
// Changed by story DT76 (Milan 23 October 07:17, board DT76): a starter is its foods in grams; a fitted one opens with the
// grams to weigh at its portions, eggs counted, and the shopping list for the day has its foods.
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
  const range = (await txt(".plan-head .plan-row")).match(/of ([\d,]+) to ([\d,]+) kcal/);
  const lo = num(range[1]), hi = num(range[2]);

  await page.getByRole("button", { name: /Breakfast at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  const need1 = num((await txt(".pick-sheet .pick-why")).match(/needs about ([\d,]+) kcal/)[1]);
  const dayKcal = need1 * 3;                                    // three meals, equal shares (give or take the rounding)
  ok(Math.abs(lo - dayKcal * 0.9) <= 26 && Math.abs(hi - dayKcal * 1.1) <= 26 && lo % 50 === 0 && hi % 50 === 0, `the day's kcal is a range, a tenth either side: ${lo} to ${hi} around ${dayKcal}`);
  ok(await page.locator(".pick-sheet .pick-pd small", { hasText: /for this slot/ }).count() === 0, "no size mark in the picker");
  // Sarma, under the target: never "fits"; its number is named PD
  const sarma = page.locator(".pick-sheet .pick-row", { hasText: "Sarma" });
  const sarmaMark = ((await sarma.locator(".pick-pd").textContent()) ?? "").replace(/\s+/g, " ");
  ok(/^PD [\d.]+/.test(sarmaMark) && !/fits/.test(sarmaMark), `a meal under the target never says fits, and its number says PD: "${sarmaMark}"`);
  ok(await page.locator(".pick-sheet .pick-pd.fits").count() >= 1, "a starter that does fit still says fits");
  const kcalOf = async (name) => num(((await page.locator(".pick-sheet .pick-row", { hasText: name }).first().textContent()) ?? "").match(/([\d,]+) kcal/)[1]);
  const kB = await kcalOf("Skyr bowl with berries");
  await page.locator(".pick-sheet").getByRole("button", { name: /Skyr bowl with berries/ }).click(); await page.waitForTimeout(400);

  await page.getByRole("button", { name: /Lunch at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  const why2 = await txt(".pick-sheet .pick-why");
  const need2 = num((why2.match(/about ([\d,]+) kcal/) || [])[1]);
  ok(/With the other meals planned, it has about [\d,]+ kcal and \d+ g of protein left/.test(why2) && need2 > 0, "the next slot counts what is already planned: " + why2.slice(0, 120));
  const left = why2.match(/about ([\d,]+) kcal and (\d+) g of protein left, PD (\d+\.\d)/);
  ok(!!left && Number(left[3]).toFixed(1) === (num(left[2]) / num(left[1]) * 100).toFixed(1), `its PD is the PD of what is left, not the day's: ${left && left.slice(1).join(", ")}`);
  ok(Math.abs(need2 - (dayKcal - kB) / 2) <= 1, `lunch has the day less breakfast, shared with dinner: ${need2} = (${dayKcal} − ${kB}) ÷ 2`);
  ok(need2 !== need1, `it moved: ${need1} before breakfast, ${need2} after`);
  const kL = await kcalOf("Tuna salad wrap");
  await page.locator(".pick-sheet").getByRole("button", { name: /Tuna salad wrap/ }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Dinner at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  const kD = await kcalOf("Omelette with bread"), usual = kB + kL + kD;
  await page.locator(".pick-sheet").getByRole("button", { name: /Omelette with bread/ }).click(); await page.waitForTimeout(400);

  // the whole day: the three starters added up (DT76: about 1,360 kcal) against the day's range, under it
  const sumKcal = () => txt(".plan-head .plan-row").then((t) => num(t.match(/([\d,]+)\s*of [\d,]+ to [\d,]+ kcal/)[1]));
  ok(/all slots set/.test(await txt(".plan-head .plan-day-head small")) && await sumKcal() === usual, `all slots set, ${usual} kcal planned`);
  const off = await txt(".plan-off");
  ok(new RegExp(`${(lo - usual).toLocaleString("en")} kcal under ${dayName}'s range of ${lo.toLocaleString("en")} to ${hi.toLocaleString("en")} kcal`).test(off) && /Add a snack, or make the portions bigger/.test(off), "the day says it is under its range, by how much: " + off.slice(0, 90));
  await page.getByRole("button", { name: `Fit the portions to ${dayName}` }).click(); await page.waitForTimeout(500);
  const after = await sumKcal();
  ok(after >= lo && after <= hi && await page.locator(".plan-off").count() === 0, `Fit the portions: the day lands inside its range, ${after} in ${lo} to ${hi} kcal, and the warning goes`);
  ok(new RegExp(`${dayName} is inside its range: ${after.toLocaleString("en")} kcal`).test(await txt(".toast, [role=status], body")), "the message says where the day landed");
  const amounts = (await page.locator(".plan-slot-wrap").allTextContents()).join(" ");
  ok(/(\d|½|¼|¾) portions?/.test(amounts) && !/\d\.\d+ portions/.test(amounts), "each meal says how much of it, in quarters: " + (amounts.match(/[\d½¼¾]+ portions?/g) || []).join(", "));
  // DT76: a fitted starter opens with the foods to weigh; the shopping list has them
  const fittedRow = page.locator(".plan-slot-wrap", { hasText: /portions/ }).first();
  const fittedTitle = ((await fittedRow.locator(".plan-slot").first().getAttribute("aria-label")) ?? "").split(", ").slice(1).join(", ");
  await fittedRow.getByRole("button", { name: new RegExp(fittedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first().click(); await page.waitForTimeout(500);
  const sheet = (await page.locator(".meal-view").count()) ? await txt(".meal-view") : "";
  ok(/Chef Mealan's starter, [\d½¼¾]+ portions?\. These are the foods to weigh\./.test(sheet) && /\d+ g/.test(sheet), "a fitted starter opens with the foods to weigh: " + sheet.slice(0, 140));
  await page.locator(".meal-view").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Make a shopping list" }).click(); await page.waitForTimeout(500);
  const shop = await txt(".sheet");
  ok(!/0 foods/.test(shop) && await page.getByRole("button", { name: /^Make shopping list \d/ }).isEnabled(), "the shopping list has the starters' foods: " + shop.slice(0, 120));
  await page.locator(".sheet").getByRole("button", { name: "Close" }).first().click(); await page.waitForTimeout(300);
  const note = await page.locator(".plan-protein-note").count() ? await txt(".plan-protein-note") : "";
  ok(/g of protein, above your range of \d+ to \d+ g\. That does no harm/.test(note), "protein above the range is said quietly: " + note.slice(0, 80));
  await page.getByRole("button", { name: "Back to the usual portions" }).click(); await page.waitForTimeout(500);
  ok(await sumKcal() === usual && await page.locator(".plan-off").count() === 1 && await page.locator(".plan-protein-note").count() === 0, `Back to the usual portions: ${usual} kcal again, the warning back`);

  // Me: the average day is called that
  await page.getByRole("button", { name: "Menu" }).click(); await page.waitForTimeout(500);
  await page.locator(".menu-row", { hasText: /^Me$/ }).first().click(); await page.waitForTimeout(600);
  ok(/PD, average day/.test(await txt("main")) && /kcal, average day/.test(await txt("main")), "Me names the average day");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
