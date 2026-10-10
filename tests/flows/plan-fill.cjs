// Plan, 0.2.2 (canvas S "Plan purpose one", H7): filling a slot by hand. Tap a slot, the sheet with My recipes, Coach's
// recipes and Chef Mealan's starters with their PD marks, a meal in the slot with fits or the amber gap, Fit it on the Plate
// with the slot on the plan line, Put it in the slot from the Plate, the day as planned adding up, emptying a slot.
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
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: [{ work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }, { work: true, kind: "rest" }, { work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: false, kind: "rest" }, { work: false, kind: "rest" }], lifestyle: { meals: 3, window: { from: "07:30", to: "20:00" } } })); localStorage.setItem("seeded", "1"); } }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3198/"); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  await page.getByRole("tab", { name: /^Mon/ }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Lunch at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  const sheet = page.locator(".pick-sheet");
  ok(/Lunch, 13:45/.test(await sheet.locator(".card-top").textContent()), "the sheet names the slot and its time");
  ok(/It needs about \d+ kcal and \d+ g of protein/.test(await sheet.locator(".pick-why").textContent()), "and says what the slot needs");
  const groups = await sheet.locator(".pick-group").allTextContents();
  ok(groups.join("|") === "My recipes|Coach's recipes|Chef Mealan's starters", "My recipes, Coach's recipes, the starters: " + groups.join("|"));
  ok(await sheet.locator(".pick-row").count() === 2 + 8, "two of mine and eight starters");
  ok(await sheet.locator(".pick-pd.fits").count() >= 1 && await sheet.locator(".pick-pd.under").count() >= 1, "each row carries its PD mark, fits or under");
  await sheet.getByRole("button", { name: /Chicken, rice and greens/ }).click(); await page.waitForTimeout(400);
  ok(await page.locator(".pick-sheet").count() === 0, "the sheet closes");
  const lunch = page.locator(".plan-slot-wrap").nth(1);
  ok(/Chicken, rice and greens/.test(await lunch.textContent()) && /starter · 640 kcal · 52 g/.test(await lunch.textContent()) && /fits/.test(await lunch.textContent()), "Lunch holds the starter with its numbers and fits");
  ok(/2 slots open/.test(await page.locator(".plan-top").textContent()), "two slots open");
  let nums = await page.locator(".plan-row b").allTextContents();
  ok(nums[1].replace(/,/g, "") === "640" && nums[2] === "52", "the day as planned adds up: " + nums.join(" "));
  // a meal that falls short: the amber gap and the two ways out
  await page.getByRole("button", { name: /Breakfast at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  await page.locator(".pick-sheet").getByRole("button", { name: /^Sarma/ }).click(); await page.waitForTimeout(400);
  const bf = page.locator(".plan-slot-wrap").first();
  ok(/under/.test(await bf.textContent()) && await bf.getByRole("button", { name: "Fit it on the Plate" }).count() === 1 && await bf.getByRole("button", { name: /Ask Chef Mealan/ }).count() === 1, "Sarma is under: Fit it on the Plate and Ask Chef Mealan");
  ok((await page.locator(".day-strip .choice.has").count()) === 1, "the strip marks the day that holds meals");
  // Fit it on the Plate: the Plate opens for this slot, the line says so; Put it in fills the slot and comes back
  await bf.getByRole("button", { name: "Fit it on the Plate" }).click(); await page.waitForTimeout(600);
  ok(/Monday's breakfast, 07:30 · By the plan/.test(await page.locator(".plan-line").textContent()), "the Plate's line names the slot: " + (await page.locator(".plan-line").textContent()));
  await page.getByRole("button", { name: /^Add$/ }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Fit to my target/ }).click(); await page.waitForTimeout(800);
  ok(await page.getByRole("button", { name: /Put it in Monday's breakfast/ }).count() === 1, "the recipe step offers Put it in Monday's breakfast");
  await page.getByRole("button", { name: /Put it in Monday's breakfast/ }).click(); await page.waitForTimeout(600);
  ok(await page.locator(".plan-day").count() === 1, "back on Plan");
  const bf2 = await page.locator(".plan-slot-wrap").first().textContent();
  ok(/made on the Plate/.test(bf2) && !/under/.test(bf2), "Breakfast holds the plate's meal now, no gap: " + bf2.slice(0, 60));
  const meals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.length);
  ok(meals === 3, "and it is saved to My recipes");
  // my own recipe in a slot, then emptied
  await page.getByRole("button", { name: /Dinner at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  await page.locator(".pick-sheet").getByRole("button", { name: /Skyr bowl/ }).first().click(); await page.waitForTimeout(400);
  ok(/all slots set/.test(await page.locator(".plan-top").textContent()), "all slots set");
  ok(/my recipe/.test(await page.locator(".plan-slot-wrap").nth(2).textContent()), "Dinner says my recipe");
  await page.getByRole("button", { name: /Dinner at .*Skyr bowl/ }).click(); await page.waitForTimeout(400);
  ok(/Skyr bowl is in this slot/.test(await page.locator(".pick-why").textContent()), "the sheet says what is in the slot");
  await page.getByRole("button", { name: "Empty this slot" }).click(); await page.waitForTimeout(400);
  ok(/1 slot open/.test(await page.locator(".plan-top").textContent()), "emptied: 1 slot open");
  // it all stays after a reload
  await page.reload(); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  await page.getByRole("tab", { name: /^Mon/ }).first().click(); await page.waitForTimeout(300);
  ok(/1 slot open/.test(await page.locator(".plan-top").textContent()), "the slots keep their meals after a reload");
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
