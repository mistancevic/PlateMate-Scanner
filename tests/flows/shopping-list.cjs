// JOURNEY (0.2.60, boards SL1 and SL2; Milan 15:48 to 16:11): Plan says the day once, in one head card, with one main step.
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
const starter = { title: "Chicken, rice and greens", kcal: 640, protein: 52, source: "starter" };
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
  await page.goto(U + "/plan"); await page.waitForTimeout(1500);
  // SL2: the day said once, one main step
  const head = (await page.locator(".plan-head").textContent()).replace(/\s+/g, " ");
  ok(/Today, Tuesday, 20 October/.test(head) && /rest day · 1 slot open/.test(head) && /of 2,800 kcal/.test(head) && await page.getByText("The day as planned").count() === 0, "SL2: one head card, the day and its numbers; The day as planned is gone: " + head);
  ok(await page.locator("main .pill-primary").count() === 1 && /Fill the open slots/.test(await page.locator("main .pill-primary").textContent()), "SL2: one filled button, Fill the open slots");
  ok(await page.locator(".plan-day .plan-card-links").getByRole("button", { name: "Slots and times ›" }).count() === 1 && await page.locator(".plan-day .plan-card-links").getByRole("button", { name: "Training week ›" }).count() === 1, "SL2: Slots and times and Training week are links in the day card");
  // SL1: the list
  const shop = page.getByRole("button", { name: "Shopping list, the next 7 days" });
  ok(await shop.count() === 1 && !(await shop.getAttribute("class")).includes("pill-primary"), "SL1: Shopping list, the next 7 days, outlined");
  await shop.click(); await page.waitForTimeout(500);
  const sheet = page.getByRole("dialog", { name: "Shopping list" });
  const st = (await sheet.textContent()).replace(/\s+/g, " ");
  ok(/Tuesday 20 to Monday 26 October: 15 planned meals, one portion each/.test(st), "the seven days and the meals counted: " + st.slice(0, 120));
  ok(/Not on the list, no foods saved: Chicken, rice and greens \(Wednesday\)/.test(st), "the starter without foods is named");
  ok(await sheet.locator(".shop-row").count() === 8 && /Quark, low fat \(Magerquark\)\s*4 meals\s*1,000 g/.test(await sheet.locator(".shop-row").nth(5).textContent()), "eight foods added up by name, quark 1,000 g for four meals");
  await sheet.locator(".shop-row").filter({ hasText: "Eggs" }).click(); await page.waitForTimeout(200);
  ok(await sheet.locator(".shop-row.got").count() === 1, "a tap ticks a food");
  await sheet.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(200);
  await shop.click(); await page.waitForTimeout(400);
  ok(await page.locator(".shop-row.got").filter({ hasText: "Eggs" }).count() === 1, "the tick stays for these seven days");
  await page.getByRole("button", { name: "Copy the list" }).click(); await page.waitForTimeout(400);
  const text = await page.evaluate(() => navigator.clipboard.readText());
  ok(/^Shopping list, Tuesday 20 to Monday 26 October\n\n/.test(text) && !/Eggs/.test(text) && /Quark, low fat \(Magerquark\): 1,000 g/.test(text) && text.split("\n").length === 9, "Copy the list: what is left, one food per line");
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
