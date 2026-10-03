// Mix it: a food that doesn't fit on its own shows partners by moment; one tap makes the plate; Not quite opens the helper with the tip.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3196", GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, activity: "moderate" })); localStorage.setItem("chefmealan-region", "munich"); localStorage.setItem("seeded", "1"); } }, seed);
  await page.goto("http://127.0.0.1:3196/"); await page.waitForTimeout(900);
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const logOf = (ev) => page.evaluate((e) => JSON.parse(localStorage.getItem("chefmealan-log") || "[]").filter((x) => x.event === e), ev);

  // Foods: Nutella's card, regular meal: under target, a protein base first, up to three mixes, every one on target
  await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(400);
  await page.locator(".name-link, .food-name, button", { hasText: /^Nutella$/ }).first().click(); await page.waitForTimeout(500);
  ok(await page.locator(".mix-tip").count() === 1, "Nutella gets a Mix it section");
  const chips = await page.locator(".mix-chip").allTextContents();
  ok(chips.length >= 2 && chips.length <= 3, `two or three mixes offered: ${chips.length}`);
  ok(/with Skyr|with Quark|with Greek|with Cottage/.test(chips[0]), "the first partner is a protein base: " + chips[0].slice(0, 40));
  ok(chips.every((c) => /DaaM dessert|meal|snack/.test(c)), "every chip says what it makes");
  ok(chips.every((c) => /kcal/.test(c)), "every chip says the calories it lands on");
  const shown = await logOf("mix_tip");
  ok(shown.length === 1 && shown[0].case === "under" && shown[0].offered.length === chips.length, "the tip shown is logged once, with what was offered");

  // tap the first mix: the plate becomes the mix with solved amounts, on target
  await page.locator(".mix-chip").first().click(); await page.waitForTimeout(600);
  const st = await state();
  ok(st.items.length === 2 && st.items[0].food.name === "Nutella", "the plate is Nutella plus the partner");
  const pd = (100 * st.items.reduce((a, i) => a + (i.food.protein * i.grams) / 100, 0)) / st.items.reduce((a, i) => a + (i.food.calories * i.grams) / 100, 0);
  ok(Math.abs(pd - 6.3) < 0.1 || pd >= 6.3, `the plate lands on the target: PD ${pd.toFixed(2)}`);
  ok(/fits your plan/.test(await page.locator(".readout").first().textContent()), "the readout says it fits");
  const taken = await logOf("mix_taken");
  ok(taken.length === 1 && taken[0].partners.length === 1 && taken[0].moment === "regular", "the tap is logged with partners and moment");

  // a food that fits gets no mix: Eggs
  await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(400);
  await page.locator("button", { hasText: /^Eggs$/ }).first().click(); await page.waitForTimeout(400);
  ok(await page.locator(".mix-tip").count() === 0, "Eggs fit on their own: no Mix it");
  await page.locator(".sheet-backdrop").first().click({ position: { x: 5, y: 5 } }).catch(() => {}); await page.waitForTimeout(200);

  // the moment changes the mix: before training is snack-sized and never cooks
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Before training" }).click(); await page.waitForTimeout(200);
  await page.locator(".name-link", { hasText: "Nutella" }).first().click(); await page.waitForTimeout(400);
  const before = await page.locator(".mix-chip").allTextContents();
  ok(before.length >= 1 && before.every((c) => Number(c.match(/(\d+) kcal/)[1]) <= 300), "before training: every mix under the snack line");
  ok(before.every((c) => !/cooking/.test(c)), "before training: nothing to cook");

  // Not quite? Tell Mealan: the helper opens with the tip as the start of the question
  await page.getByRole("button", { name: /Not quite/ }).click(); await page.waitForTimeout(500);
  const q = await page.locator("input[placeholder^=\"What goes with\"]").first().inputValue().catch(() => "");
  ok(/I scanned Nutella for before training/.test(q) && /You suggested with/.test(q), "the helper carries the tip: " + q.slice(0, 60));
  const asked = await logOf("mix_ask");
  ok(asked.length === 1, "the ask is logged");
  await page.locator(".sheet-backdrop, .modal-backdrop").first().click({ position: { x: 5, y: 5 } }).catch(() => {}); await page.waitForTimeout(300);

  // the review sheet is the scan result: Type it a biscuit, Mix it shows before saving; a chip saves it and makes the plate
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Regular meal" }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /Empty plate/ }).click().catch(() => {}); await page.getByRole("button", { name: /Tap again to empty/ }).click().catch(() => {}); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Type it$/ }).click(); await page.waitForTimeout(400);
  const sheet = page.locator(".modal").last();
  await sheet.locator("input").first().fill("Shop biscuit");
  const rowNames = await sheet.locator(".lt-row .lt-name").allTextContents();
  const fillRow = async (re, v) => { const i = rowNames.findIndex((n) => re.test(n)); await sheet.locator(".lt-row input").nth(i).fill(v); };
  await fillRow(/Energ/i, "470"); await fillRow(/^Fat|Fett/i, "14"); await fillRow(/Carb|Kohlen/i, "74"); await fillRow(/Protein|Eiwei/i, "7.6"); await page.waitForTimeout(300);
  ok(await sheet.locator(".mix-tip").count() === 1, "the review sheet shows Mix it before the food is saved");
  const reviewChips = await sheet.locator(".mix-chip").allTextContents();
  ok(reviewChips.length >= 1 && /with /.test(reviewChips[0]), "a partner is offered on the review sheet: " + reviewChips[0].slice(0, 30));
  await sheet.getByText(/I checked the values/).click(); await page.waitForTimeout(100);
  await sheet.locator(".mix-chip").first().click(); await page.waitForTimeout(800);
  const st2 = await state();
  ok(st2.foods.some((f) => f.name === "Shop biscuit"), "the chip saved the food");
  ok(st2.items.length >= 2 && st2.items[0].food.name === "Shop biscuit", "and put the mix on the plate: " + st2.items.map((i) => i.food.name).join(" + "));
  ok(!/cooking/.test(reviewChips[0]), "the review sheet does not call a mix cooking because the ready box is still unticked");
  // Tell Mealan from the review sheet: saves, then opens the helper with the tip
  await page.getByRole("button", { name: /^Type it$/ }).click(); await page.waitForTimeout(400);
  const sheet2 = page.locator(".modal").last();
  await sheet2.locator("input").first().fill("Shop wafer");
  const names2 = await sheet2.locator(".lt-row .lt-name").allTextContents();
  const fill2 = async (re, v) => { const i = names2.findIndex((n) => re.test(n)); await sheet2.locator(".lt-row input").nth(i).fill(v); };
  await fill2(/Energ/i, "500"); await fill2(/^Fat|Fett/i, "25"); await fill2(/Carb|Kohlen/i, "60"); await fill2(/Protein|Eiwei/i, "6"); await page.waitForTimeout(200);
  const fit = await sheet2.locator(".fit-line").allTextContents();
  ok(fit.length >= 3 && /On its own/.test(fit[0]) && /Before training/.test(fit[1]) && /After training/.test(fit[2]), "the sheet says how it fits: on its own, before and after training");
  ok(/Under your/.test(fit[0]) && !/fit-line ok/.test(await sheet2.locator(".fit-line").first().getAttribute("class")), "on its own: under the target, said plainly and never green");
  // Tell Mealan needs no reviewed tick: name, energy and protein are enough
  await sheet2.getByRole("button", { name: /Not quite/ }).click(); await page.waitForTimeout(800);
  const q2 = await page.locator("input[placeholder^=\"What goes with\"]").first().inputValue().catch(() => "");
  ok(/I scanned Shop wafer/.test(q2), "Tell Mealan on the sheet saves the food and opens the helper with the tip: " + q2.slice(0, 40));
  ok((await state()).foods.some((f) => f.name === "Shop wafer"), "the wafer was saved on the way");

  // JOURNEY INVARIANT: Fit to my target keeps the person's foods. A plate already on or above the target moves nothing and swaps nothing.
  await page.getByRole("button", { name: /^Close$/ }).first().click().catch(() => {}); await page.waitForTimeout(300);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Empty plate/ }).click().catch(() => {}); await page.getByRole("button", { name: /Tap again to empty/ }).click().catch(() => {}); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Type it$/ }).click(); await page.waitForTimeout(400);
  const sheet3 = page.locator(".modal").last();
  await sheet3.locator("input").first().fill("Tomato sauce, no added sugar");
  const names3 = await sheet3.locator(".lt-row .lt-name").allTextContents();
  const fill3 = async (re, v) => { const i = names3.findIndex((n) => re.test(n)); await sheet3.locator(".lt-row input").nth(i).fill(v); };
  await fill3(/Energ/i, "37"); await fill3(/^Fat|Fett/i, "0.5"); await fill3(/Carb|Kohlen/i, "5.8"); await fill3(/Protein|Eiwei/i, "1.3"); await page.waitForTimeout(200);
  await sheet3.getByText(/Ready to eat/).click(); await sheet3.getByText(/I checked the values/).click(); await page.waitForTimeout(100);
  await sheet3.getByRole("button", { name: /Confirm & save food/ }).click(); await page.waitForTimeout(600);
  const st3 = await state();
  await page.evaluate((s) => { s.items = [{ id: "c1", food: s.foods.find((f) => f.name === "Chicken breast, cooked"), grams: 200, locked: false }, { id: "s1", food: s.foods.find((f) => /Tomato sauce/.test(f.name)), grams: 100, locked: false }]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, st3);
  await page.goto("http://127.0.0.1:3196/"); await page.waitForTimeout(800);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Fit to my target/ }).click(); await page.waitForTimeout(900);
  const after = await state();
  ok(after.items.some((i) => i.food.name === "Chicken breast, cooked") && after.items.some((i) => /Tomato sauce/.test(i.food.name)), "the person's foods stay: " + after.items.map((i) => i.food.name).join(" + "));
  ok(!after.items.some((i) => /Soda|Whey/.test(i.food.name)), "no swap for a food that was never asked for");
  await page.screenshot({ path: "/tmp/mix-tip.png", fullPage: true });
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
