// Make it a meal and the kitchens you cook (0.2.9, canvas board CH, CH1 to CH4). Milan's plate of 15 October: chicken
// breast 200 g and cottage cheese 150 g, Maintain at 2,800 kcal and 180 g protein, PD target 6.4, at 11:00 so the plate is
// for lunch. Chef Mealan's answer is fixed here (no AI in the walkthroughs); what is checked is the app's part: which way
// the plate goes, what Chef Mealan is asked, the grams the app sets, the checks, and the meal on the plate.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const ch = seed.foods.find((f) => /Chicken breast/.test(f.name)), co = seed.foods.find((f) => /Cottage/.test(f.name));
seed.items = [{ id: "a", food: ch, grams: 200, locked: false }, { id: "b", food: co, grams: 150, locked: false }];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const U = "http://127.0.0.1:3204";
const answer = { options: [
  { kitchen: "Balkan", title: "Šopska plate with bread", why: "The cottage cheese stands in for sirene over a tomato and cucumber salad.", adds: [{ name: "Wholegrain bread", grams: 100, calories: 250, protein: 9, base: true }, { name: "Tomato", grams: 150, calories: 18, protein: 0.9, base: false }, { name: "Cucumber", grams: 150, calories: 15, protein: 0.7, base: false }, { name: "Olive oil", grams: 10, calories: 884, protein: 0, base: false }] },
  { kitchen: "Italian", title: "Pasta with chicken, tomato and cottage cheese", why: "Warm pasta loosens the cottage cheese into a light sauce.", adds: [{ name: "Pasta, cooked", grams: 200, calories: 158, protein: 5.8, base: true }, { name: "Tomato", grams: 150, calories: 18, protein: 0.9, base: false }, { name: "Olive oil", grams: 10, calories: 884, protein: 0, base: false }] },
  { kitchen: "Mediterranean", title: "Chicken with peanut sauce and rice", why: "Creamy and quick.", adds: [{ name: "Rice, cooked", grams: 200, calories: 130, protein: 2.7, base: true }, { name: "Peanut butter", grams: 20, calories: 588, protein: 25, base: false }] },
] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3204", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  await page.clock.setFixedTime(new Date("2026-10-15T11:00:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: ["allergies"], flags: [], allergies: ["peanut"], none: false, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  let asked = null, calls = 0;
  await page.route("**/api/meal", async (route) => { calls++; asked = JSON.parse(route.request().postData() || "{}"); await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(answer) }); });
  // CH1: the plate says what it is for and what it aims at
  await page.goto(U + "/plate"); await page.waitForTimeout(1300);
  ok(await page.getByRole("button", { name: "Fit to my target" }).count() === 1 && await page.getByRole("button", { name: "Keep it as it is" }).count() === 1, "CH1, DT87 (0.2.87): Fit to my target, and Keep it as it is");
  ok(/Lunch is about 933 kcal of your 2,800, at PD 6\.4 or more\. Chef Mealan adds what it needs to land your lunch in its range\./.test(await page.locator(".plate-card").textContent()), "CH1: lunch is about 933 kcal: what is left of the day over the three meals to come");
  // CH2: PD above the target, half a lunch: maths cannot make it a meal, so Chef Mealan
  await page.getByRole("button", { name: "Fit to my target" }).click(); await page.waitForTimeout(900);
  ok(calls === 1 && asked.meal === "lunch" && asked.need === 933 && asked.kitchens.join(",") === "Balkan,Italian,Mediterranean" && asked.plate.length === 2, "CH2: Chef Mealan is asked for a lunch of 933 kcal, in the three kitchens, with the plate");
  const cards = page.locator(".mm-card");
  ok(await cards.count() === 2 && await page.locator(".mm-fail").count() === 0, "CH2: the idea that fails the checks (peanut, a declared allergy) is left out, not even shown as a miss: " + await cards.count());
  const c1 = (await cards.first().textContent()).replace(/\s+/g, " ");
  ok(/^BALKAN927 kcal · PD 10\.1Šopska plate with bread/.test(c1) && /\+ 125 g wholegrain bread/.test(c1) && /\+ 150 g tomato/.test(c1), "CH2: the Balkan lunch, 927 kcal, PD 10.1, the bread's grams set by the app: " + c1.slice(0, 140));
  ok(await cards.first().locator(".mm-add.have").count() === 1, "CH2: bread is in your foods; the rest is new");
  ok(/Your plate has the protein: 80 g, PD 16\.8\. Lunch is 840 to 1,026 kcal, about 456 more than the plate\. Two ways from your kitchens, each in that range\./.test(await page.locator(".step-head").textContent()), "CH2: the line on top says what the plate has and what lunch needs");
  // CH3: on the plate
  await cards.first().getByRole("button", { name: "Put it on the plate" }).click(); await page.waitForTimeout(700);
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  ok(st.items.length === 6 && st.title === "Šopska plate with bread" && st.items.filter((i) => !i.locked).length === 1, "CH3: six foods on the plate, the dish's name as the title, only the bread free to move");
  const ro = (await page.locator(".readout").first().textContent()).replace(/\s+/g, " ");
  ok(/This lunch/.test(ro) && /10\.1/.test(ro) && /927 kcal/.test(ro), "CH3: This lunch, PD 10.1, 927 kcal: " + ro);
  ok(/Chef Mealan's Balkan lunch, around your foods\. Change any amount you like\./.test(await page.locator(".step-head").textContent()), "CH3, DT88 (0.2.87): the line says whose lunch it is, around your foods");
  ok(await page.getByRole("button", { name: "Make it" }).count() === 1 && await page.getByRole("button", { name: "Other ideas" }).count() === 1, "CH3: Make it, or Other ideas");
  await page.getByRole("button", { name: "Other ideas" }).click(); await page.waitForTimeout(900);
  ok(calls === 2 && asked.plate.length === 2 && asked.avoid.includes("Šopska plate with bread"), "Other ideas: from the plate as it was, and not the same ideas again");
  await page.getByRole("button", { name: "Keep it as it is" }).click(); await page.waitForTimeout(600);
  ok(await page.locator(".mm-card").count() === 0, "Keep it as it is closes the ideas");
  // CH4: the kitchens you cook
  await page.goto(U + "/me/shop"); await page.waitForTimeout(1100);
  ok(/Where I shop and cook/.test(await page.locator(".menu-title").textContent()) && await page.getByRole("group", { name: "The kitchens you cook" }).locator(".choice.on").count() === 3, "CH4: Where I shop and cook, with the three kitchens picked");
  await page.getByRole("group", { name: "The kitchens you cook" }).getByRole("button", { name: "Indian" }).click(); await page.waitForTimeout(300);
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).kitchens)).includes("Indian"), "CH4: a tap adds a kitchen");
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
