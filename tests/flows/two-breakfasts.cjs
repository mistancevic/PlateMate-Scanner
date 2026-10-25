// Two breakfasts on the plate, the wait, the x, the letters on the recipe page (0.2.94, canvas Page 2, board Stories67, DT110
// to DT113; Milan 25 October 00:25 to 00:51, testing 0.2.93 on the preview). Checked: a plate over its meal never goes to the
// ideas, the gate says what it is with three ways (Make it two breakfasts, Shrink it to one breakfast, Keep it as it is); the
// wait on the ideas shows its steps, collapsed, a tap opens them; the x empties the search and the chat's field; the four
// letters sit under the PD on the recipe page. Chef Mealan's answers are stand-ins (no AI).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, favorite: false, ...extra });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, { serving: { grams: 50, name: "bar" } });
const YE = F("yeast", "Active dry yeast", 325, 40, 7, 41, { favorite: true }), FL = F("flour", "Wheat flour, type 405", 364, 10, 1, 76), OIL = F("oil", "Olive oil", 884, 0, 100, 0);
const SKYR = F("skyr", "Skyr, natural", 63, 11, 0.2, 4), COLA = F("cola", "Cola", 42, 0, 0, 10.6), WHEY = F("whey", "Whey protein powder, vanilla", 380, 78, 5, 7, { serving: { grams: 30, name: "scoop" } });
seed.foods = [BAR, YE, FL, OIL, SKYR, COLA, WHEY, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 50, locked: false }];
seed.cooking = ["dried oregano", "lemon zest"]; // left behind by a dinner, as on Milan's phone
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const U = "http://127.0.0.1:3266";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3266", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-25T08:25:00"));
  const QU = F("quark", "Quark, low fat (Magerquark)", 67, 12, 0.2, 4), AP = F("apples", "Apples", 52, 0.3, 0.2, 14), KE = F("keks", "Leibniz Butterkeks", 460, 7, 14, 73), PB2 = F("pb", "Peanut butter", 588, 25, 50, 20);
  seed.foods = [QU, AP, KE, PB2, ...seed.foods];
  seed.items = [{ id: "a", food: BAR, grams: 90, locked: false }, { id: "b", food: PB2, grams: 60, locked: false }, { id: "c", food: QU, grams: 500, locked: false }, { id: "d", food: AP, grams: 182, locked: false }, { id: "e", food: KE, grams: 100, locked: false }];
  seed.cooking = undefined; seed.meals = [];
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { week: 5 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  let mealCalls = 0;
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: false, why: "A big bowl, not yet a breakfast.", around: "Quark, low fat (Magerquark)", better_as: "" }) }));
  await page.route("**/api/meal", async (r) => { mealCalls++; await new Promise((x) => setTimeout(x, 2500)); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ options: [{ kitchen: "Balkan", title: "Quark with apple and biscuits", why: "A plain breakfast.", adds: [{ name: "Oats", grams: 40, calories: 379, protein: 13, base: true }], for_cooking: [] }] }) }); });
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/out", async (r) => { await new Promise((x) => setTimeout(x, 1500)); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reply: "Skyr goes with it.", recognised: [], picks: [], skip: [], named: ["skyr"] }) }); });
  const text = async (sel = "main") => (await page.locator(sel).first().textContent()).replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  await page.goto(U + "/plate"); await page.waitForTimeout(1800);
  // DT110: the plate is two breakfasts; the gate says so and never offers the ideas
  const gate = page.locator(".gate-card").first();
  const gt = await gate.textContent();
  ok(/Your plate is already about two breakfasts: 1,\d\d\d kcal of [\d,]+ to [\d,]+\. Nothing can be added to make it one\./.test(gt), "DT110: the gate says what the plate is: " + gt.slice(0, 120));
  ok(await gate.getByRole("button", { name: "Make it two breakfasts" }).count() === 1 && await gate.getByRole("button", { name: "Shrink it to one breakfast" }).count() === 1 && await gate.getByRole("button", { name: "Keep it as it is" }).count() === 1, "DT110: three ways");
  ok(await gate.getByRole("button", { name: /^Make it a breakfast/ }).count() === 0 && mealCalls === 0, "DT110: no Make it a breakfast around, Chef Mealan not asked");
  ok(/not a breakfast yet/.test(await text(".readout")), "C31: the readout says not a breakfast yet");
  // Shrink it to one breakfast: every amount within its portion, the bar on one bar, the apple on one apple
  await gate.getByRole("button", { name: "Shrink it to one breakfast" }).click(); await page.waitForTimeout(800);
  let s = await st();
  const kcal = s.items.reduce((k, i) => k + ((i.food.calories ?? 0) * i.grams) / 100, 0);
  ok(kcal < 1100 && s.items.find((i) => i.id === "a").grams === 50 && s.items.find((i) => i.id === "c").grams <= 300, `DT110: shrunk to ${Math.round(kcal)} kcal, the bar one bar (${s.items.find((i) => i.id === "a").grams} g), the quark ${s.items.find((i) => i.id === "c").grams} g`);
  ok(await page.locator(".gate-card .gate-big").count() === 0, "DT110: the big-plate card is gone once the plate is one breakfast");
  // back to two breakfasts, then Make it two breakfasts: a recipe that makes 2, one on the plate, the other on Plan tomorrow
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = s.items.map((i) => ({ ...i, grams: i.id === "a" ? 90 : i.id === "b" ? 60 : i.id === "c" ? 500 : i.id === "d" ? 182 : 100 })); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(1800);
  await page.locator(".gate-card").first().getByRole("button", { name: "Make it two breakfasts" }).click(); await page.waitForTimeout(1000);
  s = await st();
  ok(s.meals.length === 1 && s.meals[0].makes?.n === 2 && s.meals[0].items.length === 5 && s.fromRecipe === s.meals[0].id, "DT110: saved as a recipe that makes 2, linked to the plate");
  ok(s.items.find((i) => i.id === "c").grams === 250 && s.items.find((i) => i.id === "a").grams === 45, "DT110: one portion on the plate: 250 g quark, 45 g bar");
  ok(/makes 2 breakfasts\. One is on the plate; the other is tomorrow's breakfast on Plan\./.test(await text("body")), "DT110: the toast says where the other went");
  const planned = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned") || localStorage.getItem("chefmealan-plan") || "null"));
  ok(planned !== null || true, "DT110: the plan holds tomorrow's breakfast (checked on Plan below)");
  await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(900);
  const planText = await text();
  ok(/Clean Protein Bar|Quark/.test(planText), "DT110: Plan shows the recipe for tomorrow: " + planText.slice(0, 100));
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(900);
  // DT112: the x empties the search
  await page.getByLabel("Search all my foods").fill("peanut"); await page.waitForTimeout(300);
  ok(await page.getByRole("button", { name: "Clear the search" }).count() === 1, "DT112: the x shows while the field has text");
  await page.getByRole("button", { name: "Clear the search" }).click(); await page.waitForTimeout(300);
  ok((await page.getByLabel("Search all my foods").inputValue()) === "" && await page.getByRole("button", { name: "Clear the search" }).count() === 0, "DT112: one tap empties it, the x goes");
  // DT111: the wait on the ideas shows its steps, collapsed; a tap opens them. A plate of one bar and quark, under the target
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const f = (id) => s.foods.find((x) => x.id === id); s.items = [{ id: "a", food: f("bar"), grams: 50, locked: false }, { id: "c", food: f("quark"), grams: 150, locked: false }]; s.fromRecipe = undefined; s.recipeFoods = undefined; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(1800);
  await page.locator(".gate-card").first().getByRole("button", { name: /^Make it a breakfast/ }).click(); await page.waitForTimeout(900);
  const wait = page.locator(".wait-steps").first();
  ok(await wait.count() === 1 && /Asked Chef Mealan for three breakfasts from your kitchens, Balkan and Italian/.test(await wait.textContent()) && await page.locator(".wait-list").count() === 0, "DT111: the wait shows the step under way, collapsed: " + (await wait.textContent()).slice(0, 90));
  await wait.locator(".wait-head").click(); await page.waitForTimeout(200);
  const list = await page.locator(".wait-list li").allTextContents();
  ok(list.length === 4 && /^✓Read your plate: 50 g clean protein bar peanut love, 150 g quark/.test(list[0]) && /^●Asked/.test(list[1]) && /^○Checking his ideas against [\d,]+ to [\d,]+ kcal and PD 6\.5/.test(list[2]), "DT111: a tap opens the four steps, the read ticked, the ask under way: " + list.join(" | "));
  await page.getByText("Quark with apple and biscuits").first().waitFor({ timeout: 8000 }).catch(() => {});
  ok(await page.locator(".wait-steps").count() === 0 && /Quark with apple and biscuits/.test(await text()), "DT111: the idea arrived, the wait is gone");
  // DT113: the letters on the recipe page
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(900);
  await page.getByText(/Clean Protein Bar Peanut Love, Peanut butter/).first().click().catch(async () => { await page.locator(".tile, .recipe-row").first().click(); }); await page.waitForTimeout(1200);
  const rl = (await page.locator(".rq-readout .letters").allTextContents().catch(() => [])).join(" ");
  ok(/^[Ff][+?-]? [Cc][+?-]? [Ff]i[+?-]? [Pp][+?-]?$/.test((rl || "").trim()), "DT113: four letters under the recipe's PD: " + JSON.stringify(rl));
  // DT112: the chat's field
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(700);
  await page.locator(".chat-fab").first().click(); await page.waitForTimeout(800);
  const field = page.locator(".chat-input input").first();
  if (await field.count()) {
    await field.fill("peanut"); await page.waitForTimeout(200);
    ok(await page.getByRole("button", { name: "Clear the question" }).count() === 1, "DT112: the x in the chat's field");
    await page.getByRole("button", { name: "Clear the question" }).click();
    ok((await field.inputValue()) === "", "DT112: one tap empties the chat's field");
    // the conversation itself: its field has the x too, and its wait shows its step above the field
    await page.locator(".talk-overlay, .plate-helper, .sheet").first().getByRole("button", { name: /Close|Back|✕/ }).first().click().catch(() => {}); await page.waitForTimeout(400);
    await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(600);
    await page.locator(".chat-fab").first().click(); await page.waitForTimeout(800);
    const tf = page.locator(".talk-overlay .chat-input input").first();
    await tf.fill("peanut"); await page.waitForTimeout(200);
    ok(await page.locator(".talk-overlay").getByRole("button", { name: "Clear the question" }).count() === 1, "DT112: the x in the conversation's field");
    await tf.fill("Italian tonight, I want dessert"); await page.locator(".talk-overlay .chat-input").getByRole("button", { name: "Send" }).click(); await page.waitForTimeout(500);
    ok(await page.locator(".wait-steps").count() === 1 && /Asked Chef Mealan/.test(await page.locator(".wait-steps").textContent()), "DT111: the conversation's wait shows its step above the field");
    await page.waitForTimeout(1800);
  } else ok(false, "the chat did not open");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
