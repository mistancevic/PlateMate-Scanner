// JOURNEY (0.2.60, boards SL1 and SL2; Milan 15:48 to 16:11; changed by story SL3 in 0.2.61, SL4 in 0.2.62, SL5 in 0.2.63 and SL6 in 0.2.64): Plan says the day once, in one head card, with one main step.
// Shopping list, the next 7 days adds up the planned meals' foods, names a meal without foods, keeps ticks, copies what is left.
const { chromium } = require("playwright");
const path = require("node:path"); const S = { MAIN: path.resolve(__dirname, "../..") };
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(S.MAIN + "/tests/flows/seed.json", "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(from ? { from } : {}) }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4);
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1, "coach");
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8);
seed.items = []; seed.meals = [crepes, sarma, pudding]; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const planned = (m, source) => { const w = m.items.reduce((s, i) => s + i.grams, 0), r = Math.min(1, m.portion / w); const k = m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0) * r, p = m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0) * r; return { title: m.title, kcal: Math.round(k), protein: Math.round(p), source, mealId: m.id, items: m.items, portion: m.portion }; };
// Changed by story DT76 (board DT76): every starter has its foods now; a meal without foods is one planned long ago under a
// name no starter has any more, so the list still names it
const starter = { title: "Lentil soup", kcal: 640, protein: 52, source: "starter" };
const PLAN = {};
["20", "21", "22", "23", "24", "25", "26"].forEach((d, i) => { PLAN[`2026-10-${d}`] = { breakfast: planned(crepes, "mine"), lunch: i % 2 ? planned(sarma, "mine") : planned(pudding, "coach"), ...(i === 1 ? { dinner: starter } : {}) }; });
const PORT = 3245, U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: S.MAIN, env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, timezoneId: "Europe/Berlin", permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date("2026-10-20T14:00:00Z"));
  await page.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-12T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z" }));
    localStorage.setItem("chefmealan-planned", JSON.stringify(plan));
    localStorage.setItem("seeded", "1"); }, [seed, PLAN]);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  // SL5: Chef Mealan's answer for a short meal, stubbed: one food that stands in, one other meal that still needs rice
  // (the app must drop that one), one meal that needs no rice
  let shortAsk = null;
  await page.route("**/api/status", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ai: true, airtable: false, accessRequired: false }) }));
  await page.route("**/api/short", (r) => { shortAsk = JSON.parse(r.request().postData() || "{}"); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ options: [
    { kind: "standin", id: null, title: "Sarma with bulgur", why: "Bulgur holds the filling like rice.", swaps: [{ missing: "Rice, cooked", name: "Bulgur, cooked", grams: 150, calories: 83, protein: 3.1, fats: 0.2, carbs: 18.6 }], foods: [] },
    { kind: "meal", id: null, title: "Rice bowl", why: "Still rice.", swaps: [], foods: [{ name: "Rice, cooked", grams: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28 }] },
    { kind: "meal", id: null, title: "Chicken, potatoes and salad", why: "No rice needed.", swaps: [], foods: [{ name: "Chicken breast, cooked", grams: 160, calories: 165, protein: 31, fats: 3.6, carbs: 0 }, { name: "Potato, boiled", grams: 250, calories: 87, protein: 1.9, fats: 0.1, carbs: 20.1 }] } ] }) }); });
  await page.goto(U + "/plan"); await page.waitForTimeout(1500);
  // SL7 (Milan 21:20): today's day is always marked; another day of this week picked, a Today link brings it back
  ok(/Today 20/.test(await page.getByRole("tab", { name: /Today 20/ }).textContent()) && /is-today/.test(await page.getByRole("tab", { name: /Today 20/ }).getAttribute("class")), "SL7: today's day reads Today 20 and is marked");
  ok(await page.locator(".week-arrows-mid").getByRole("button", { name: "Today" }).count() === 0, "SL7: no Today link while today is picked");
  await page.getByRole("tab", { name: "Wed 21" }).click(); await page.waitForTimeout(300);
  ok(/is-today/.test(await page.getByRole("tab", { name: /Today 20/ }).getAttribute("class")), "SL7: Wednesday picked, today stays marked");
  await page.locator(".week-arrows-mid").getByRole("button", { name: "Today" }).click(); await page.waitForTimeout(300);
  ok(/^Today, Tuesday, 20 October/.test(await page.locator(".plan-head .plan-day-head b").textContent()), "SL7: the Today link brings today back");
  // SL2: the day said once, one main step
  const head = (await page.locator(".plan-head").textContent()).replace(/\s+/g, " ");
  // Changed by story DT75 (board DT75): the day's kcal is a range, 2,800 give or take a tenth
  ok(/Today, Tuesday, 20 October/.test(head) && /rest day · 1 slot open/.test(head) && /of 2,500 to 3,100 kcal/.test(head) && await page.getByText("The day as planned").count() === 0, "SL2: one head card, the day and its numbers; The day as planned is gone: " + head);
  ok(await page.locator("main .pill-primary").count() === 1 && /Fill the open slots/.test(await page.locator("main .pill-primary").textContent()), "SL2: one filled button, Fill the open slots");
  ok(await page.locator(".plan-day .plan-card-links").getByRole("button", { name: "Slots and times ›" }).count() === 1 && await page.locator(".plan-day .plan-card-links").getByRole("button", { name: "Training week ›" }).count() === 1, "SL2: Slots and times and Training week are links in the day card");
  // SL1, changed by story SL3 (Milan 16:46 to 17:11, board SL3): a list is made, numbered and dated, and kept
  const shop = page.locator(".plan-shop");
  ok(/Make a shopping list/.test(await shop.textContent()) && !(await shop.getAttribute("class")).includes("pill-primary"), "SL3: Make a shopping list, outlined");
  await shop.click(); await page.waitForTimeout(500);
  const sheet = page.getByRole("dialog", { name: "Shopping lists" });
  const st = (await sheet.textContent()).replace(/\s+/g, " ");
  ok(/Shopping list 1/.test(st) && /It starts today/.test(st) && /Tuesday 20 to Monday 26 October: 15 planned meals, 8 foods/.test(st), "SL3: list 1 starts today; 7 days: 15 meals, 8 foods: " + st.slice(0, 200));
  await sheet.getByRole("button", { name: "Make shopping list 1" }).click(); await page.waitForTimeout(400);
  const one = (await sheet.textContent()).replace(/\s+/g, " ");
  ok(/Made Tuesday 20 October, for Tuesday 20 to Monday 26 October: 15 planned meals, one portion each/.test(one), "SL3: named and dated: " + one.slice(0, 160));
  ok(/Not on the list, no foods saved: Lentil soup \(Wednesday\)/.test(one), "SL1: the starter without foods is named");
  // Changed by story SL4 (0.2.62, Milan 17:15 to 18:29, board SL4): under each food, the meals it is for, not a count
  ok(await sheet.locator(".shop-row").count() === 8 && /Quark, low fat \(Magerquark\)\s*Chocolate quark pudding: Tue, Thu, Sat, Mon lunch\s*1,000 g/.test(await sheet.locator(".shop-row").nth(5).textContent()), "SL1, SL4: eight foods added up by name; quark 1,000 g says the four lunches it is for: " + (await sheet.locator(".shop-row").nth(5).textContent()));
  await sheet.locator(".shop-row").filter({ hasText: "Eggs" }).click(); await page.waitForTimeout(200);
  ok(await sheet.locator(".shop-row.got").count() === 1, "a tap ticks a food");
  // the plan changes: the list doesn't
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem("chefmealan-planned")); p["2026-10-22"].dinner = p["2026-10-22"].lunch; localStorage.setItem("chefmealan-planned", JSON.stringify(p)); });
  await page.reload(); await page.waitForTimeout(1500);
  ok(/Shopping list 1, open/.test(await page.locator(".plan-shop").textContent()), "SL3: Plan's button names the open list");
  await page.locator(".plan-shop").click(); await page.waitForTimeout(400);
  ok(/15 planned meals/.test(await sheet.textContent()) && await page.locator(".shop-row.got").filter({ hasText: "Eggs" }).count() === 1, "SL3: a later change to the plan doesn't touch the list; the tick stays");
  // SL7: the list sees the change and offers to follow it; here it is left as made, so the next list takes the new dinner
  ok(/The plan changed since this list was made\s*Thursday dinner: Chocolate quark pudding, new\s*Update the list/.test(await sheet.locator(".shop-plan-changed").textContent()), "SL7: the open list says the plan changed: Thursday dinner, new");
  // Changed by story SL6 (0.2.64, Milan 19:54 to 20:22): the neutral mark is Not this time; Swap a food, not Keep the dish
  // SL4: Not this time, and the list by meal
  // Changed by story SL7 (0.2.66, Milan 21:00 to 21:39): the list buys raw, so rice is Rice, white, raw with its cooked grams; Chef Mealan still gets the meal's own name, Rice, cooked
  const rice = sheet.locator(".shop-row").filter({ hasText: "Rice, white, raw" });
  await rice.click(); await rice.click(); await page.waitForTimeout(200);
  ok(await sheet.locator(".shop-row.missing").count() === 1 && /Not this time/.test(await rice.textContent()), "SL4: a second tap marks rice Not this time");
  ok(/Not this time: Rice, white, raw\. Short now: Wednesday lunch, Sarma; Friday lunch, Sarma; Sunday lunch, Sarma\./.test(await sheet.locator(".shop-short").textContent()), "SL4: the list says which meals are short: " + await sheet.locator(".shop-short").textContent());
  await sheet.getByRole("tab", { name: "By meal" }).click(); await page.waitForTimeout(300);
  const days = await sheet.locator(".shop-day .pick-group").allTextContents();
  const wed = sheet.locator(".shop-day").nth(1);
  ok(days.length === 7 && /Tuesday 20 October/i.test(days[0]) && /Breakfast · DaaM good protein crêpes/.test(await wed.locator(".shop-meal-head").first().textContent()) && /Lunch · Sarma\s*Short: Rice, white, raw/.test(await wed.locator(".shop-meal-head").nth(1).textContent()), "SL4: By meal, day by day, meals in their order, Wednesday's lunch short of rice");
  ok(/Lentil soup: no foods saved/.test(await wed.textContent()), "SL4: the meal with no foods says so in its day");
  ok(await wed.locator(".shop-meal").nth(1).locator(".shop-row").count() === 3, "SL4: Sarma needs three foods, in its own grams");
  await sheet.getByRole("tab", { name: "By food" }).click(); await page.waitForTimeout(200);
  await sheet.getByRole("button", { name: "Copy the list" }).click(); await page.waitForTimeout(400);
  const text = await page.evaluate(() => navigator.clipboard.readText());
  ok(/^Shopping list 1, Tuesday 20 to Monday 26 October\n\n/.test(text) && !/Eggs/.test(text) && /Quark, low fat \(Magerquark\): 1,000 g/.test(text) && /Rice, white, raw: [\d,]+ g \([\d,]+ g cooked\) \(not bought last time\)/.test(text) && text.split("\n").length === 9, "Copy the list: what is left, one food per line; rice not bought last time");
  // SL5: Chef Mealan helps Wednesday's lunch, short of rice
  const helps = sheet.locator(".shop-help");
  ok(await helps.count() === 3 && /Wednesday lunch, Sarma\s*Short: Rice, white, raw/.test(await helps.first().textContent()), "SL5: one card per short meal, with Ask Chef Mealan");
  await helps.first().getByRole("button", { name: "Ask Chef Mealan" }).click(); await page.waitForTimeout(600);
  ok(shortAsk && shortAsk.missing.join() === "Rice, cooked" && shortAsk.meal.title === "Sarma" && shortAsk.meal.foods.length === 3 && shortAsk.slot === "Wednesday lunch", "SL5: Chef Mealan is asked about Sarma, short of rice");
  const opts = helps.first().locator(".shop-help-opt");
  ok(await opts.count() === 2 && /Swap a food\s*Sarma with bulgur/.test(await opts.first().textContent()) && /PD [\d.]+ · fits/.test(await opts.first().textContent()) && /Another meal\s*Chicken, potatoes and salad/.test(await opts.nth(1).textContent()), "SL5: the stand in and the other meal; the meal that still needs rice is dropped");
  await opts.first().getByRole("button", { name: "Use this" }).click(); await page.waitForTimeout(500);
  const wedLunch = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned"))["2026-10-21"].lunch);
  ok(wedLunch.title === "Sarma with bulgur" && wedLunch.items.some((i) => i.food.name === "Bulgur, cooked") && !wedLunch.items.some((i) => i.food.name === "Rice, cooked"), "SL5: Wednesday's lunch in the plan is Sarma with bulgur");
  ok(/Added · [\d,]+ g cooked · Sarma with bulgur: Wed lunch/.test(await sheet.locator(".shop-row").filter({ hasText: "Bulgur, dry" }).textContent()) && await helps.count() === 2 && /Friday lunch, Sarma/.test(await helps.first().textContent()), "SL5: bulgur on the list, marked Added; Wednesday is no longer short, Friday and Sunday still are");
  ok(/Rice, white, raw\s*[\d,]+ g cooked · Sarma: Fri, Sun lunch/.test(await sheet.locator(".shop-row").filter({ hasText: "Rice, white, raw" }).textContent()), "SL5: rice stays for Friday and Sunday");
  // Changed by story SL5: bulgur is on the list now, so 8 foods are not ticked, and list 1 has 9 foods
  await sheet.getByRole("button", { name: "Finish the list" }).click(); await page.waitForTimeout(300);
  ok(/8 foods aren't ticked\. Carry them to the next list\?/.test(await sheet.locator(".shop-ask").textContent()), "SL3: Finish asks about the 8 foods not ticked");
  await sheet.getByRole("button", { name: "Carry them" }).click(); await page.waitForTimeout(400);
  const two = (await sheet.textContent()).replace(/\s+/g, " ");
  ok(/Shopping list 2/.test(two) && /It starts Thursday 22 October, with the planned meals no list has counted yet/.test(two) && /Thursday 22 to Wednesday 28 October: 1 planned meal, 4 foods, plus 8 from list 1/.test(two), "SL3, changed by story SL7: list 2 starts with Thursday's dinner, the one meal no list counted, and brings list 1's 8 foods: " + two.slice(0, 220));
  ok(await sheet.locator(".shop-earlier .menu-row").count() === 1 && /Shopping list 1\s*Tuesday 20 to Monday 26 October · 9 foods · finished/.test(await sheet.locator(".shop-earlier").textContent()), "SL3: list 1 under Earlier lists");
  await sheet.getByRole("group", { name: "Days" }).getByRole("button", { name: "1 day" }).click();
  await sheet.getByRole("button", { name: "Make shopping list 2" }).click(); await page.waitForTimeout(400);
  ok(/From list 1/.test(await sheet.textContent()) && await sheet.locator(".shop-list").first().locator(".shop-row").count() === 8 && await sheet.locator(".shop-row").count() === 12, "SL3: list 2 opens with the 8 foods from list 1 (and SL7: Thursday dinner's 4)");
  await sheet.locator(".shop-earlier .menu-row").click(); await page.waitForTimeout(300);
  ok(/Shopping list 1/.test(await sheet.locator(".shop-title").textContent()) && /Finished/.test(await sheet.textContent()) && await sheet.getByRole("button", { name: "Finish the list" }).count() === 0 && await sheet.locator(".shop-row[disabled]").count() === 9, "SL3: an earlier list reads, nothing to tick");
  // SL6: a food carried from list 1, marked Not this time on list 2; the change is said on the list; Plan opens the meal
  await sheet.getByRole("button", { name: "‹ Shopping lists" }).click(); await page.waitForTimeout(300);
  const cRice = sheet.locator(".shop-list").first().locator(".shop-row").filter({ hasText: "Rice, white, raw" });
  ok(/Sarma: Fri, Sun lunch/.test(await cRice.textContent()), "SL6: rice comes from list 1, for Friday's and Sunday's lunch");
  await cRice.click(); await cRice.click(); await page.waitForTimeout(300);
  ok(await sheet.locator(".shop-help").count() === 2 && /Friday lunch, Sarma/.test(await sheet.locator(".shop-help").first().textContent()), "SL6: the carried rice leaves Friday and Sunday short");
  await sheet.locator(".shop-help").first().getByRole("button", { name: "Ask Chef Mealan" }).click(); await page.waitForTimeout(600);
  const use6 = sheet.locator(".shop-help").first().locator(".shop-help-opt").first().getByRole("button", { name: "Use this" });
  await use6.click(); await page.waitForTimeout(500);
  ok(await sheet.locator(".shop-help").count() === 1 && /Sunday lunch, Sarma/.test(await sheet.locator(".shop-help").first().textContent()) && /Sarma: Sun lunch/.test(await sheet.locator(".shop-list").first().locator(".shop-row").filter({ hasText: "Rice, white, raw" }).textContent()), "SL6: Friday is no longer short; the carried rice stays only for Sunday");
  const box = (await sheet.locator(".shop-changed").textContent()).replace(/\s+/g, " ");
  ok(/Changed from this list/.test(box) && /Friday lunch is now Sarma with bulgur, in place of Sarma, because you marked rice, white, raw Not this time\. You picked it from Chef Mealan's ideas\. This day only\./.test(box) && !/at the shop/.test(box), "SL6: the list says what changed, why, and who picked it: " + box);
  await sheet.getByRole("button", { name: "See it in Plan ›" }).click(); await page.waitForTimeout(700);
  ok(/Friday, 23 October/.test(await page.locator(".plan-head .plan-day-head b").textContent()), "SL6: See it in Plan opens Friday");
  await page.getByRole("button", { name: /^Lunch at .*, Sarma with bulgur/ }).click(); await page.waitForTimeout(500);
  const ms = page.getByRole("dialog", { name: /Sarma with bulgur/ });
  const mt = (await ms.textContent()).replace(/\s+/g, " ");
  ok(/You swapped rice, cooked for bulgur, cooked because you marked rice, white, raw Not this time on shopping list 2\. From Chef Mealan's ideas\. This day only; Sarma stays as it is\./.test(mt) && /Bulgur, cooked\s*Chef Mealan's estimate/.test(mt) && /PD [\d.]+/.test(mt), "SL6: Plan opens the meal: how it came to be, its foods, its numbers: " + mt.slice(0, 200));
  ok(await ms.getByRole("button", { name: "Swap" }).count() === 1 && await ms.getByRole("button", { name: "Make it on the Plate" }).count() === 1, "SL6: Swap, Save in My recipes, Make it on the Plate");
  await ms.getByRole("button", { name: "Save in My recipes" }).click(); await page.waitForTimeout(500);
  const fri = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned"))["2026-10-23"].lunch);
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.title === "Sarma with bulgur"));
  ok(kept && fri.mealId === kept.id && !fri.note, "SL6: Save in My recipes keeps it as a recipe, and the plan points at it");
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
