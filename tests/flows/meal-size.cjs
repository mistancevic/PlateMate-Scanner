// How big the next meal is (0.2.12, canvas board MS, MS1 to MS2b; Milan 16 October 2026, 17:59 to 18:08). Milan's day:
// 2,800 kcal, meals at 07:30, 13:45 and 20:00. At 17:30, after the Šopska plate at 13:10 logged off the plan, with nothing
// logged at breakfast. MS1: that plate closes lunch, so dinner is about 936 kcal (it was 624). MS2: the plate asks once
// about breakfast; I skipped it gives dinner what is left, about 1,873 kcal; Undo puts it back; I had it keeps 936.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const ch = seed.foods.find((f) => /Chicken breast/.test(f.name)), co = seed.foods.find((f) => /Cottage/.test(f.name));
const F = (id, name, calories, protein) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs: 10, fats: 5, fiber: 0, photo: undefined, photos: undefined, icon: "🥣" });
const lunch = { id: "m-sopska", title: "Šopska plate with bread", portion: 785, savedAt: "2026-10-16T13:00:00Z", items: [[200, F("f-ch", "Chicken breast, cooked", 165, 31)], [150, F("f-co", "Cottage cheese", 98, 12)], [150, F("f-to", "Tomato", 18, 0.9)], [150, F("f-cu", "Cucumber", 15, 0.7)], [10, F("f-oi", "Olive oil", 884, 0)], [125, F("f-br", "Wholegrain bread", 250, 9)]].map(([g, f], i) => ({ id: `i${i}`, grams: g, locked: false, food: f })) };
seed.items = [{ id: "a", food: ch, grams: 200, locked: false }, { id: "b", food: co, grams: 150, locked: false }];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 }; seed.meals = [];
seed.feedback = [{ id: "fb-lunch", meal: lunch, status: "eaten", taste: "Good", notes: "", createdAt: "2026-10-16T13:10:00" }];
const U = "http://127.0.0.1:3207";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3207", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  await page.clock.setFixedTime(new Date("2026-10-16T17:30:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const card = () => page.locator(".plate-card").textContent().then((t) => t.replace(/\s+/g, " "));
  await page.goto(U + "/plate"); await page.waitForTimeout(1300);
  ok(await page.getByRole("button", { name: "Fit to my target" }).count() === 1 && /Dinner is about/.test(await page.locator(".plate-card").textContent()), "the plate at 17:30 is for dinner");
  ok(/Dinner is about 936 kcal of your 2,800/.test(await card()), "MS1: the lunch eaten off the plan closes lunch: dinner about 936 kcal (it was 624; the drawing said 937, the lunch is 927.4 kcal)");
  ok(/Breakfast isn't logged today\. Did you have it\?/.test(await card()) && /I skipped it: breakfast's share moves to dinner, about 1,873 kcal/.test(await card()), "MS2: the plate asks once about breakfast, with what each answer means");
  await page.getByRole("button", { name: "I skipped it" }).click(); await page.waitForTimeout(400);
  ok(/Dinner is about 1,873 kcal/.test(await card()) && /Breakfast skipped today\. Its share moved to dinner\./.test(await card()) && !/isn't logged/.test(await card()), "MS2b: I skipped it: dinner gets what is left, about 1,873 kcal");
  await page.getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(400);
  ok(/Dinner is about 936 kcal/.test(await card()) && /Breakfast isn't logged today/.test(await card()), "MS2b: Undo puts it back, and the question with it");
  await page.getByRole("button", { name: "I had it" }).click(); await page.waitForTimeout(400);
  ok(/Dinner is about 936 kcal/.test(await card()) && !/isn't logged/.test(await card()), "MS2: I had it: dinner stays about 936, and the plate asks no more");
  await page.reload(); await page.waitForTimeout(1300);
  ok(!/isn't logged/.test(await card()), "MS2: the answer holds for today");
  // Members sizes the same way
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
  // Changed by story DT126c (0.2.106): no Members tab; the members' group of the one list carries the line
  await page.goto(U + "/my-recipes?made=members"); await page.waitForTimeout(900);
  ok(/Dinner is about 936 kcal/.test(await page.locator(".rc-lead").textContent()), "Members sizes dinner by the same rule");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
