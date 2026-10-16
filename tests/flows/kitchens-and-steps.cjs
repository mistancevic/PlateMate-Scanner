// What a kitchen means, and recipe steps drafted by Chef Mealan (0.2.10, canvas board CH, CH5, CH7 and CH7b; Milan,
// 16 October 2026). Chef Mealan's answers are fixed here (no AI in the walkthroughs); what is checked is the app's part:
// the kitchen line and its three dishes, Another and Undo, the taste kept and sent to Chef Mealan, and for the steps, the
// checks on the draft, the one retry with the reason, and the steps kept with the recipe's own amounts.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const ch = seed.foods.find((f) => /Chicken breast/.test(f.name)), co = seed.foods.find((f) => /Cottage/.test(f.name));
seed.items = [{ id: "a", food: ch, grams: 200, locked: false }, { id: "b", food: co, grams: 150, locked: false }];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const food = (id, name, calories, protein) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs: 10, fats: 5, fiber: 0, photo: undefined, photos: undefined, icon: "🥣" });
const ritems = [[200, food("pf", "Protein flour", 357, 21)], [500, food("pm", "Protein milk", 51, 7.5)], [180, food("eg", "Eggs", 143, 12.6)], [50, food("ms", "Mascarpone", 379, 3.4)]].map(([g, f], i) => ({ id: "i" + i, grams: g, locked: false, food: f }));
seed.meals = [{ id: "m-crepes", title: "High protein crepes", items: ritems, portion: 930, savedAt: "2026-10-07T10:00:00Z" }];
const U = "http://127.0.0.1:3205";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3205", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  await page.clock.setFixedTime(new Date("2026-10-15T11:00:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const personal = () => page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")));

  // CH7: each kitchen picked says what it means and shows three dishes
  await page.goto(U + "/me/shop"); await page.waitForTimeout(1200);
  const blocks = page.locator(".kt");
  ok(await blocks.count() === 2, "CH7: a block for each kitchen picked: " + await blocks.count());
  const bal = blocks.first();
  ok(/^BALKAN/.test(await bal.locator(".kt-name").textContent()) && /Grilled meat and peppers/.test(await bal.locator(".kt-what").textContent()), "CH7: Balkan, with the line on what it means");
  const dishes = async () => (await bal.locator(".kt-dish b").allTextContents());
  ok((await dishes()).join("|") === "Šopska salad with grilled chicken|Sarma|Ćevapi with ajvar and onion", "CH7: the three Balkan dishes: " + (await dishes()).join(", "));
  // CH7b: Another, then Undo
  await bal.getByRole("button", { name: "Another instead of Ćevapi with ajvar and onion" }).click(); await page.waitForTimeout(300);
  ok((await dishes())[2] === "Stuffed peppers" && /Not for you: ćevapi with ajvar and onion\./.test(await bal.locator(".kt-out").textContent()), "CH7b: Another puts stuffed peppers in its place and says what is not for you");
  let t = (await personal()).kitchenTaste?.Balkan;
  ok(t && t.out.length === 1 && t.out[0].dish === "Ćevapi with ajvar and onion" && t.shown.includes("Stuffed peppers"), "CH7b: the taste is kept");
  await bal.getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(300);
  ok((await dishes())[2] === "Ćevapi with ajvar and onion" && await bal.locator(".kt-out").count() === 0, "CH7b: Undo brings it back");
  await bal.getByRole("button", { name: "Another instead of Sarma" }).click(); await page.waitForTimeout(300);
  ok((await dishes())[1] === "Stuffed peppers", "CH7b: Another on Sarma instead");
  for (let i = 0; i < 6; i++) { const btn = bal.getByRole("button", { name: /^Another instead of / }).first(); if (!(await btn.count())) break; await btn.click(); await page.waitForTimeout(150); }
  ok(/That's every dish we have for this kitchen/.test(await bal.textContent()) && await bal.getByRole("button", { name: /^Another instead of / }).count() === 0, "CH7b: when the dishes run out, it says so and Another goes");
  while (await bal.getByRole("button", { name: "Undo" }).count()) { await bal.getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(100); if ((await personal()).kitchenTaste.Balkan.out.length <= 1) break; }
  t = (await personal()).kitchenTaste.Balkan;
  ok(t.out.length === 1 && t.out[0].dish === "Sarma", "Undo walks back one dish at a time, Sarma stays swapped away");

  // the taste goes to Chef Mealan with Make it a lunch
  let asked = null;
  await page.route("**/api/meal", async (route) => { asked = JSON.parse(route.request().postData() || "{}"); await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ options: [] }) }); });
  await page.goto(U + "/plate"); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Make it a lunch" }).click(); await page.waitForTimeout(800);
  const tb = asked?.taste?.find((x) => x.kitchen === "Balkan");
  ok(tb && tb.leave_out.join() === "Sarma" && tb.cook_toward.includes("Šopska salad with grilled chicken") && asked.taste.find((x) => x.kitchen === "Italian")?.cook_toward.length === 3, "the taste is sent: cook toward the dishes kept, leave out Sarma");

  // CH5: the steps drafted by Chef Mealan
  const drafts = [
    { steps: ["Whisk {1} into {2}.", "Beat in {3}.", "Cook thin crepes in a hot pan."] }, // no step names the mascarpone
    { steps: ["Whisk {1} into {2} until smooth.", "Beat in {3} and rest the batter for 10 minutes.", "Cook thin crepes in a hot, lightly oiled pan, a minute a side.", "Spread with {4} and fold."] },
  ];
  let sent = [];
  await page.route("**/api/steps", async (route) => { const body = JSON.parse(route.request().postData() || "{}"); sent.push(body); await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(drafts[Math.min(sent.length - 1, 1)]) }); });
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
  await page.locator(".recipe-tile").filter({ hasText: "High protein crepes" }).click(); await page.waitForTimeout(500);
  const steps = page.locator(".rq-steps");
  ok(await steps.getByRole("button", { name: "Draft the steps with Chef Mealan" }).count() === 1 && await steps.getByRole("button", { name: "Write my own" }).count() === 1, "CH5: no steps yet: Draft the steps with Chef Mealan, or Write my own");
  await steps.getByRole("button", { name: "Draft the steps with Chef Mealan" }).click(); await page.waitForTimeout(900);
  ok(sent.length === 2 && sent[0].title === "High protein crepes" && sent[0].items.map((i) => i.grams).join() === "200,500,180,50" && sent[0].kitchens.join() === "Balkan,Italian" && !sent[0].failed, "CH5: Chef Mealan gets the title, the foods in order with their amounts, and the kitchens");
  ok(/no step names mascarpone/.test(sent[1].failed || ""), "CH5: the draft that left a food out goes back once, with why: " + sent[1].failed);
  ok(/Drafted by Chef Mealan from your foods and amounts\. Read it, change any word\./.test(await steps.textContent()), "CH5: the banner says who drafted it");
  const li = (await steps.locator(".rp-steps li").allTextContents()).map((x) => x.replace(/\s+/g, " "));
  ok(li.length === 4 && /Whisk 200 g protein flour into 500 g protein milk/i.test(li[0]) && /50 g mascarpone/i.test(li[3]), "CH5: the amounts in the steps are the recipe's: " + li[0]);
  ok(JSON.parse(await page.evaluate(() => localStorage.getItem("platemate-pilot-v1"))).meals[0].steps == null, "CH5: nothing is saved before Keep these steps");
  await steps.getByRole("button", { name: "Keep these steps" }).click(); await page.waitForTimeout(500);
  const kept = JSON.parse(await page.evaluate(() => localStorage.getItem("platemate-pilot-v1"))).meals[0].steps;
  ok(kept?.length === 4 && kept[0].includes("[[i:i0|") && kept[3].includes("[[i:i3|"), "CH5: Keep these steps saves them as the recipe's food chips");
  ok(await steps.getByRole("button", { name: "Draft the steps with Chef Mealan" }).count() === 0 && await steps.locator(".rp-steps li").count() === 4, "CH5: the steps are the recipe's now");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
