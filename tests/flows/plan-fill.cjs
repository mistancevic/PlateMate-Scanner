// Plan, 0.2.2 (canvas S "Plan purpose one", H7): filling a slot by hand. Tap a slot, the sheet with My recipes, Coach's
// The day picked is next week's Monday, never today, so the lines say Monday's whatever day the run falls on (12 October 2026: a run on a Monday read Today's).
// recipes and Chef Mealan's starters with their PD marks, a meal in the slot with fits or the amber gap, Fit it on the Plate
// with the slot on the plan line, Put it in the slot from the Plate, the day as planned adding up, emptying a slot.
// Changed by story R19 (Milan 06:04 to 06:41, board RS18): a tap on a planned meal opens the meal; Pick a meal opens with a
// swipe to the left (Swap). An open slot still opens Pick a meal on a tap.
// Changed by story DT74 (Milan 22 October 2026, board DT74): a meal around the target says close, not fits; fits is kept for
// a meal within 0.2 of it. The marks are fits, close or under. DT76: the starter's numbers come from its foods (647 and 56).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const skyr = seed.foods.find((f) => /skyr/i.test(f.name));
seed.meals = [{ id: "m1", title: "Skyr bowl", items: [{ id: "i1", food: skyr, grams: 300, locked: true }], portion: 300, savedAt: "2026-10-01T08:00:00Z" }, { id: "m2", title: "Coach's chicken", items: [{ id: "i2", food: skyr, grams: 200, locked: true }], portion: 200, savedAt: "2026-10-01T08:00:00Z", from: "coach" }];
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3198" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 2 });
  // today from 16:00, as when it was written: the walkthrough reads the same at any hour (after 21:00 the eating window turned the plate into a snack)
  await page.clock.install({ time: new Date(new Date().setHours(16, 0, 0, 0)) }); await page.clock.resume();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "profile" })); localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: [{ work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }, { work: true, kind: "rest" }, { work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: false, kind: "rest" }, { work: false, kind: "rest" }], lifestyle: { meals: 3, window: { from: "07:30", to: "20:00" } } })); localStorage.setItem("seeded", "1"); } }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3198/"); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelectorAll(".day-strip .choice")[7].click()); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Lunch at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  const sheet = page.locator(".pick-sheet");
  ok(/Lunch, 13:45/.test(await sheet.locator(".card-top").textContent()), "the sheet names the slot and its time");
  ok(/It needs about \d+ kcal and \d+ g of protein/.test(await sheet.locator(".pick-why").textContent()), "and says what the slot needs");
  const groups = await sheet.locator(".pick-group").allTextContents();
  ok(groups.join("|") === "My recipes|Coach's recipes|Chef Mealan's starters", "My recipes, Coach's recipes, the starters: " + groups.join("|"));
  ok(await sheet.locator(".pick-row").count() === 2 + 8, "two of mine and eight starters");
  ok(await sheet.locator(".pick-pd.fits, .pick-pd.close").count() >= 1 && await sheet.locator(".pick-pd.under").count() >= 1 && await sheet.locator(".pick-pd").count() === await sheet.locator(".pick-row").count(), "each row carries its PD mark, fits, close or under");
  await sheet.getByRole("button", { name: /Chicken, rice and greens/ }).click(); await page.waitForTimeout(400);
  ok(await page.locator(".pick-sheet").count() === 0, "the sheet closes");
  const lunch = page.locator(".plan-slot-wrap").nth(1);
  ok(/Chicken, rice and greens/.test(await lunch.textContent()) && /starter · 647 kcal · 56 g/.test(await lunch.textContent()) && /fits|close/.test(await lunch.textContent()), "Lunch holds the starter with its numbers and its mark: " + (await lunch.textContent()).slice(0, 90));
  // Changed by story SL2 (Milan 16:03 to 16:11, board SL2): the open slots are in the day's line in the head card at the top
  ok(/2 slots open/.test(await page.locator(".plan-head .plan-day-head small").textContent()), "two slots open");
  let nums = await page.locator(".plan-row b").allTextContents();
  ok(nums[1].replace(/,/g, "") === "647" && nums[2] === "56", "the day as planned adds up: " + nums.join(" "));
  // a meal that falls short: the amber gap and the two ways out
  await page.getByRole("button", { name: /Breakfast at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  await page.locator(".pick-sheet").getByRole("button", { name: /^Sarma/ }).click(); await page.waitForTimeout(400);
  const bf = page.locator(".plan-slot-wrap").first();
  ok(/under/.test(await bf.textContent()) && await bf.getByRole("button", { name: "Fit it on the Plate" }).count() === 1 && await bf.getByRole("button", { name: /Ask Chef Mealan/ }).count() === 1, "Sarma is under: Fit it on the Plate and Ask Chef Mealan");
  ok((await page.locator(".day-strip .choice.has").count()) === 1, "the strip marks the day that holds meals");
  // Fit it on the Plate: the Plate opens for this slot, the line says so; Put it in fills the slot and comes back
  await bf.getByRole("button", { name: "Fit it on the Plate" }).click(); await page.waitForTimeout(600);
  ok(/Monday's breakfast, 07:30 · By the plan/.test(await page.locator(".plan-line").textContent()), "the Plate's line names the slot: " + (await page.locator(".plan-line").textContent()));
  // Changed by story DT76 (board DT76): a starter has its foods, so the Plate opens with Sarma's foods, not empty; the first
  // of Chef Mealan's lifters goes on, and the plate is made for the slot
  // DT88 (0.2.87): the plate's rows in a cook's words: Cabbage, weigh it raw
  ok(/Cabbage\s+weigh it raw/.test(await page.locator("main").innerText()) && /Beef mince/.test(await page.locator("main").innerText()), "the Plate opens with Sarma's foods");
  // Changed by story DT101 (0.2.91): the tip goes through the rules module; nothing in these foods goes with sarma (cabbage, beef,
  // rice), so the tip offers no food and points to Chef Mealan instead of putting skyr on a sarma plate
  const tipRows = await page.locator(".tip-row").count();
  ok(tipRows === 0 && await page.getByRole("button", { name: "Ask Chef Mealan what to add" }).count() === 1, "DT101: no lifter goes with sarma; the tip offers Ask Chef Mealan: rows " + tipRows);
  await page.getByRole("button", { name: /^(Fit to my target|Make it an? \w+)$/ }).click(); await page.waitForTimeout(800);
  ok(await page.getByRole("button", { name: /Put it in Monday's breakfast/ }).count() === 1, "after Fit (in place, 0.2.88) the Plate offers Put it in Monday's breakfast");
  ok(/readout-fit-(plan|top|close|below|high|mid|low)/.test(await page.locator(".readout").getAttribute("class")), "the box is coloured by the score");
  // the name is mine to change
  // typed letter by letter, as on a phone: the field keeps the focus (Milan, 11 October 2026)
  await page.locator(".title-input").click(); await page.keyboard.press("Control+A"); await page.keyboard.type("Morning skyr", { delay: 40 }); await page.waitForTimeout(200);
  const typed = await page.locator(".title-input").inputValue(), focused = await page.evaluate(() => document.activeElement?.className);
  ok(typed === "Morning skyr" && focused === "title-input", `the name keeps the focus while typing: "${typed}", focus on ${focused}`);
  await page.getByRole("button", { name: /Put it in Monday's breakfast/ }).click(); await page.waitForTimeout(600);
  ok(await page.locator(".plan-day").count() === 1, "back on Plan");
  const bf2 = await page.locator(".plan-slot-wrap").first().textContent();
  ok(/Morning skyr/.test(bf2) && /made on the Plate/.test(bf2) && !/under/.test(bf2), "Breakfast holds the plate's meal under my name, no gap: " + bf2);
  let meals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.length);
  ok(meals === 3, "and it is saved to My recipes");
  // back to the Plate from the slot and in again: the same recipe, not a second copy
  await require("./swipe.cjs")(page, page.getByRole("button", { name: /Breakfast at .*Morning skyr/ }), "left"); // R19: a planned meal opens on a tap; a swipe left swaps
  await page.locator(".pick-sheet").getByRole("button", { name: /Morning skyr/ }).click(); await page.waitForTimeout(400);
  meals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.length);
  ok(meals === 3, "picking it again from the sheet keeps one copy");
  // Make it as it is from the first step: a plate that cannot reach the target goes in as it stands
  await require("./swipe.cjs")(page, page.getByRole("button", { name: /Lunch at .*Chicken/ }), "left"); // R19: a planned meal opens on a tap; a swipe left swaps
  await page.getByRole("button", { name: "Create a new meal on the Plate" }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: /^Add$/ }).first().click(); await page.waitForTimeout(300);
  await page.locator(".row-food", { hasText: "Leibniz" }).getByRole("button").click(); await page.waitForTimeout(300);
  ok(await page.getByRole("button", { name: /^(Keep it as it is|Lock the recipe)$/ }).count() === 1 && await page.getByRole("button", { name: /^(Fit to my target|Make it an? \w+)$/ }).count() === 1, "two ways out: Fit to my target and Make it as it is");
  // the tip (canvas S, 11 October 2026): the plate is under, three foods from My foods that lift it, with the score each would reach
  const tip = page.locator(".chef-tip");
  ok(await tip.count() === 1 && /Your plate is [\d.]+ under/.test(await tip.textContent()), "the tip says how far under the plate is");
  // Changed by story DS rule A (Milan 07:30, board DS2): the Add in a list is outlined, so the check reads its button, not its fill
  ok(await tip.locator(".tip-row").count() === 3 && await tip.locator(".tip-row button.pill").filter({ hasText: /Add|Swap|Set/ }).count() === 3, "three foods to add, each with Add");
  const tos = (await tip.locator(".tip-to b").allTextContents()).map(Number);
  ok(tos[0] >= tos[1] && tos[1] >= tos[2], "sorted by the score the plate would reach: " + tos.join(" "));
  await page.getByRole("button", { name: /^(Keep it as it is|Lock the recipe)$/ }).click(); await page.waitForTimeout(600);
  const lunch2 = await page.locator(".plan-slot-wrap").nth(1).textContent();
  ok(/made on the Plate/.test(lunch2) && /under/.test(lunch2), "Lunch holds the plate as it stands, with its gap: " + lunch2.slice(0, 70));
  meals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.length);
  ok(meals === 4, "saved once");
  // Fit it on the Plate on that short meal: after Fit the box is coloured and the chef's line says what these foods reach
  await page.locator(".plan-slot-wrap").nth(1).getByRole("button", { name: "Fit it on the Plate" }).click(); await page.waitForTimeout(600);
  ok(await page.locator(".title-input").count() === 1 && /Fit to my target|Make it an? \w+/.test(await page.locator(".plate-card").textContent()), "Fit it on the Plate lands on the first step, the name as the title");
  ok(await page.locator(".chef-tip").count() === 1, "and the tip is there");
  // the tip's Add lifts the plate; then Fit aims at the slot's day, the target Plan judges by, whatever the time of day
  // (12 October 2026: Fit used the time of day's target, so after midnight a slot's plate fell short of its slot)
  const before = Number((await page.locator(".readout b").first().textContent()).trim());
  await page.locator(".chef-tip").getByRole("button", { name: "+ Add" }).first().click(); await page.waitForTimeout(800);
  const after = Number((await page.locator(".readout b").first().textContent()).trim());
  ok(after > before, `Add lifts the plate: ${before} to ${after}`);
  await page.getByRole("button", { name: /^(Fit to my target|Make it an? \w+)$/ }).click(); await page.waitForTimeout(1500);
  const fitted = await page.locator(".readout").textContent();
  // 0.2.89 (DT96): the lifter comes on at its normal portion; Fit lifts it within its portion and the plate reaches the slot's target
  // (0.2.91, DT101: the lifter is the quark, the first food that goes with a Nutella and biscuit plate; the whey no longer leads)
  const pdNow = Number((await page.locator(".readout b").first().textContent()).trim());
  ok(pdNow >= 6.9 && /fits your plan/.test(fitted) && await page.locator(".chef-tip").count() === 0, `after Fit the plate reaches the slot's target within the lifter's portion, no tip: PD ${pdNow}`);
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(400);
  // a new name typed on the Plate for a meal that came from a recipe renames that recipe, no copy; Go closes the keyboard
  const countBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.length);
  await page.locator(".plan-slot-wrap").nth(1).getByRole("button", { name: "Fit it on the Plate" }).click(); await page.waitForTimeout(600);
  await page.locator(".title-input").click(); await page.keyboard.press("Control+A"); await page.keyboard.type("Biscuit lunch", { delay: 30 }); await page.keyboard.press("Enter"); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.activeElement?.className !== "title-input"), "Go on the keyboard leaves the name field");
  await page.getByRole("button", { name: /^(Keep it as it is|Lock the recipe)$/ }).click(); await page.waitForTimeout(600);
  ok(/Biscuit lunch/.test(await page.locator(".plan-slot-wrap").nth(1).textContent()), "Lunch shows the new name");
  const countAfter = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals);
  ok(countAfter.length === countBefore && countAfter.some((m) => m.title === "Biscuit lunch") && !countAfter.some((m) => m.title === "Nutella & Leibniz Butterkeks"), "the recipe is renamed, not copied");
  // my own recipe in a slot, then emptied
  await page.getByRole("button", { name: /Dinner at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  await page.locator(".pick-sheet").getByRole("button", { name: /Skyr bowl/ }).first().click(); await page.waitForTimeout(400);
  ok(/all slots set/.test(await page.locator(".plan-head .plan-day-head small").textContent()), "all slots set");
  ok(/my recipe/.test(await page.locator(".plan-slot-wrap").nth(2).textContent()), "Dinner says my recipe");
  await require("./swipe.cjs")(page, page.getByRole("button", { name: /Dinner at .*Skyr bowl/ }), "left"); // R19: a planned meal opens on a tap; a swipe left swaps
  ok(/Skyr bowl is in this slot/.test(await page.locator(".pick-why").textContent()), "the sheet says what is in the slot");
  await page.getByRole("button", { name: "Empty this slot" }).click(); await page.waitForTimeout(400);
  ok(/1 slot open/.test(await page.locator(".plan-head .plan-day-head small").textContent()), "emptied: 1 slot open");
  // rename a recipe on its page (canvas S, Recipes keeps; 0.2.5+r11 R8: the name is renamed on the recipe's page): the slot that holds it follows
  await page.getByRole("button", { name: /^Recipes$/ }).first().click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Open Morning skyr" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Rename Morning skyr" }).click(); await page.waitForTimeout(200);
  await page.keyboard.press("Control+A"); await page.keyboard.type("Skyr at seven", { delay: 30 }); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
  ok(await page.getByRole("button", { name: "Rename Skyr at seven" }).count() === 1, "the recipe's page shows the new name");
  await page.locator(".rq-back").click(); await page.waitForTimeout(300);
  ok(await page.getByRole("button", { name: "Open Skyr at seven" }).count() === 1, "the tile shows the new name");
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelectorAll(".day-strip .choice")[7].click()); await page.waitForTimeout(300);
  ok(/Skyr at seven/.test(await page.locator(".plan-slot-wrap").first().textContent()), "and the slot that holds it shows the new name");
  // it all stays after a reload
  await page.reload(); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelectorAll(".day-strip .choice")[7].click()); await page.waitForTimeout(300);
  ok(/1 slot open/.test(await page.locator(".plan-head .plan-day-head small").textContent()), "the slots keep their meals after a reload");
  // leaving the Plate another way drops the slot
  await page.getByRole("button", { name: /Dinner at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Create a new meal on the Plate" }).click(); await page.waitForTimeout(500);
  ok(/Monday's dinner/.test(await page.locator(".plan-line").textContent()), "Create a new meal opens the Plate for the slot");
  await page.getByRole("button", { name: /^Today$/ }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Plate$/ }).first().click(); await page.waitForTimeout(300);
  ok(/Off the plan/.test(await page.locator(".plan-line").textContent()), "leaving the Plate drops the slot");
  ok(errs.length === 0, errs.length ? "page errors: " + errs.join(" | ") : "no page errors");
  await b.close(); server.kill();
  process.exit(fail ? 1 : 0);
})();
