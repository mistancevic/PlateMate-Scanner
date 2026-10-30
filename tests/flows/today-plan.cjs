// Today reads the plan, 0.2.3 (canvas S "Today eats and counts" and "Today through the day", H8 to H14): the day's slots as
// rows on Today, a row opens the Plate for the slot, Save records the meal as by the plan and the row leaves, a meal from
// outside counts as extra, the line counts both, and the record card appears once every planned slot is eaten. Recipes: Open.
// Changed by story R19 (Milan 06:04 to 06:41, board RS18): a row opens the meal, with its slot on top; Change it on the Plate
// there opens the Plate for the slot, as the row did. Everything after is unchanged.
// Changed by story DS6 K (Milan 10:21 to 11:26, board DS6): the record box goes; the plan card's row says how the day went
// (Today went by the plan) and Today's meals says the extras.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const skyr = seed.foods.find((f) => /skyr/i.test(f.name)), oats = seed.foods.find((f) => /^oats/i.test(f.name)), chicken = seed.foods.find((f) => /chicken/i.test(f.name));
seed.meals = [
  { id: "m1", title: "Morning skyr", items: [{ id: "i1", food: skyr, grams: 300, locked: true }, { id: "i2", food: oats, grams: 50, locked: true }], portion: 350, savedAt: "2026-10-01T08:00:00Z" },
  { id: "m2", title: "Chicken bowl", items: [{ id: "i3", food: chicken, grams: 200, locked: true }], portion: 200, savedAt: "2026-10-01T08:00:00Z" },
];
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3196" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 2 });
  // today at 16:00, as when it was written: the walkthrough reads the same at any hour (after 21:00 the eating window turned the plate into a snack)
  await page.clock.install({ time: new Date(new Date().setHours(16, 0, 0, 0)) }); await page.clock.resume(); // time flows from 16:00, so two cards never share a time
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const click = async (re) => { await page.getByRole("button", { name: re }).first().click({ timeout: 5000 }); await page.waitForTimeout(400); };
  // through the Plate's steps after Make it as it is: a way when there are several foods, Continue for one, then photos, rating, Save
  const cook = async () => {
    await click(/^(Keep it as it is|Lock the recipe)$/);
    if (await page.locator(".way").count()) { await page.locator(".way").first().click(); await page.waitForTimeout(200); await click(/I'm making it this way|Lock the recipe, this way/i); }
    else await click(/^(Continue|Lock the recipe)$/);
    await click(/On to How was it|Rate it/i);
    await click(/DaaM good/i);
    await click(/^Save$/);
    await page.waitForTimeout(600);
  };
  const key = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  await page.addInitScript(([s, key]) => { if (!localStorage.getItem("seeded")) {
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }), lifestyle: { meals: 2, window: { from: "08:00", to: "19:00" } } }));
    // two slots, both planned from My recipes
    localStorage.setItem("chefmealan-planned", JSON.stringify({ [key]: { lunch: { title: "Morning skyr", kcal: 376, protein: 40, source: "mine", mealId: "m1", items: s.meals[0].items, portion: 350 }, dinner: { title: "Chicken bowl", kcal: 330, protein: 62, source: "mine", mealId: "m2", items: s.meals[1].items, portion: 200 } } }));
    localStorage.setItem("seeded", "1"); } }, [seed, key]);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3196/"); await page.waitForTimeout(900);
  // Today: the two slots as rows, nothing eaten yet
  const card = page.locator(".cooking");
  ok(await card.locator(".plan-slot-row").count() === 2 && /Lunch, 08:00/.test(await card.textContent()) && /Morning skyr/.test(await card.textContent()), "What's in the plan shows the day's slots with their meals");
  ok(/0 of 2 by the plan so far/.test(await page.locator(".logged-line").textContent()), "the line counts by the plan: " + (await page.locator(".logged-line").textContent()));
  // a row opens the Plate for that slot, in eat mode
  await page.getByRole("button", { name: /Lunch at 08:00, Morning skyr/ }).click(); await page.waitForTimeout(600);
  if (await page.locator(".rq-slot").count()) { await page.locator(".rq-slot").getByRole("button", { name: "Change it on the Plate" }).click(); await page.waitForTimeout(600); }
  ok(/Lunch, 08:00 · By the plan/.test(await page.locator(".plan-line").textContent()), "the Plate's line says Lunch, 08:00 · By the plan");
  ok(await page.locator(".title-input").inputValue() === "Morning skyr", "the meal's name is the title");
  ok(await page.getByRole("button", { name: /Put it in/ }).count() === 0, "no Put it in: this is eating, not planning");
  // a new name on the Plate reaches the recipe and the slot at once, before anything is saved (Milan, 11 October 2026)
  await page.locator(".title-input").click(); await page.keyboard.press("Control+A"); await page.keyboard.type("Skyr at noon", { delay: 20 }); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Recipes$/ }).first().click(); await page.waitForTimeout(500);
  ok(await page.getByRole("button", { name: "Open Skyr at noon" }).count() === 1 && await page.getByRole("button", { name: "Open Morning skyr" }).count() === 0, "Recipes shows the new name");
  await page.getByRole("button", { name: /^Today$/ }).first().click(); await page.waitForTimeout(500);
  ok(/Skyr at noon/.test(await page.locator(".cooking").textContent()), "Today's plan row shows the new name");
  await page.getByRole("button", { name: /Lunch at 08:00, Skyr at noon/ }).click(); await page.waitForTimeout(600);
  if (await page.locator(".rq-slot").count()) { await page.locator(".rq-slot").getByRole("button", { name: "Change it on the Plate" }).click(); await page.waitForTimeout(600); }
  await cook();
  // back on Today: the row left, the card says by the plan, the line counts 1 of 2
  await page.getByRole("button", { name: /^Today$/ }).first().click(); await page.waitForTimeout(500);
  ok(await page.locator(".cooking .plan-slot-row").count() === 1 && !/Morning skyr/.test(await page.locator(".cooking").textContent()), "the eaten slot left the plan card");
  ok(/1 of 2 by the plan so far/.test(await page.locator(".logged-line").textContent()), "1 of 2 by the plan so far");
  const first = page.locator(".log-card").first();
  // R5 (Milan 17:23 to 19:00, board RS13): the meal says which meal it was on its own line; By the plan is its mark
  ok(/By the plan/.test(await first.locator(".plan-mark").textContent()) && /^Lunch/.test((await first.locator(".meal-which").textContent()).trim()), "the card is marked By the plan");
  ok(await page.locator(".day-record").count() === 0, "no record yet, a slot is still to come");
  // a meal from outside: the Plate without a slot, saved: extra, Off the plan
  await page.getByRole("button", { name: /^Plate$/ }).first().click(); await page.waitForTimeout(500);
  ok(/Off the plan/.test(await page.locator(".plan-line").textContent()), "the Plate on its own is off the plan");
  await page.getByRole("button", { name: /^Add$/ }).first().click(); await page.waitForTimeout(300);
  await cook();
  await page.getByRole("button", { name: /^Today$/ }).first().click(); await page.waitForTimeout(500);
  ok(/1 of 2 by the plan so far, 1 extra/.test(await page.locator(".logged-line").textContent()), "the line counts the extra: " + (await page.locator(".logged-line").textContent()));
  const marks = await page.locator(".log-card .plan-mark").allTextContents();
  ok(marks.some((m) => /Off the plan · the next meal leans protein/.test(m)), "the extra is marked Off the plan, the next meal leans protein: " + marks.join(" | "));
  // the last slot eaten: the record
  await page.getByRole("button", { name: /Dinner at 19:00, Chicken bowl/ }).click(); await page.waitForTimeout(600);
  if (await page.locator(".rq-slot").count()) { await page.locator(".rq-slot").getByRole("button", { name: "Change it on the Plate" }).click(); await page.waitForTimeout(600); }
  await cook();
  await page.getByRole("button", { name: /^Today$/ }).first().click(); await page.waitForTimeout(500);
  ok(/went (mostly )?by the plan/.test(await page.locator("section.cooking").textContent()) && await page.locator(".day-record").count() === 0, "every planned slot eaten: the plan card says the day went by the plan; no record box");
  const rec = await page.locator(".logged-line").textContent();
  ok(/2 of 2 by the plan, 1 extra/.test(rec), "the day's line, in Today's meals: " + rec.replace(/\s+/g, " ").slice(0, 120));
  ok(/All 2 slots eaten/.test(await page.locator(".cooking").textContent()) && /Today went mostly by the plan/.test(await page.locator(".cooking").textContent()), "the plan card closes the day");
  // Recipes (0.2.5+r11, R7, R10): a tile opens the recipe's page; Make it puts the recipe on the Plate with its name, nothing decided
  await page.getByRole("button", { name: /^Recipes$/ }).first().click(); await page.waitForTimeout(500);
  ok(await page.locator(".recipe-tile").count() >= 1 && await page.locator(".recipe-tile .pill").count() === 0, "a tile has no buttons; the tile itself opens the recipe");
  const meals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.map((m) => m.title));
  ok(meals.length === 3 && meals.filter((t) => t === "Skyr at noon").length === 1, "eating a planned recipe as it stands saves no copy; the extra was saved: " + meals.join(", "));
  await page.locator(".recipe-tile", { hasText: "Skyr at noon" }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Change it first", exact: true }).click(); await page.waitForTimeout(600);
  const head = await page.evaluate(() => { const i = document.querySelector(".title-input"); return i ? "input:" + i.value : "h2:" + (document.querySelector("h2")?.textContent ?? ""); }); ok(/Skyr at noon|Chicken bowl/.test(head), "the Plate opens with the recipe's name: " + head);
  ok(await page.getByRole("button", { name: /^(Fit to my target|Make it an? \w+)$/ }).count() === 1, "on the first step, with Fit to my target");
  ok(errs.length === 0, errs.length ? "page errors: " + errs.join(" | ") : "no page errors");
  await b.close(); server.kill();
  process.exit(fail ? 1 : 0);
})();
