// A dinner with Chef Mealan, from an empty Plate to the saved recipe (0.2.87, canvas Page 2, board Stories58, DT87 to DT90;
// Milan 24 October 11:37 to 12:12: making a recipe together with Chef Mealan is broken). 18:30, Maintain at 2,800 kcal, kitchens
// Balkan, Italian and Mediterranean, one food added: chicken breast, cooked, 150 g. No AI in the walkthroughs: Chef Mealan's two
// answers are fixed stand-ins written to the prompts. Checked: Fit to my target with the hat, the line on an empty plate, a
// cook's words, How to make it with steps at the plate's amounts, As the steps say, and a recipe that keeps its steps, says who
// made it and has its kitchen. Then the name: a dish from another recipe, named by you, is saved as a recipe of its own.
// DT91 (0.2.88, board Stories59): the dinner lands in its range (840 to 1,026 kcal), the penne stays a normal portion (110 g
// dry at most) and the other foods grow with it, the potato dinner fits, the bulgur bowl that cannot is shown with why, the
// herbs come as For cooking, not counted, and the cooked chicken says about how much that is raw.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const U = "http://127.0.0.1:3261";
const MEAL = { options: [
  { kitchen: "Italian", title: "Pollo alla pizzaiola with penne", why: "Chicken in a quick tomato and oregano sauce, tossed through penne.", for_cooking: ["dried oregano", "salt and pepper"],
    adds: [{ name: "Penne, dry", grams: 80, calories: 359, protein: 12.5, fats: 1.5, carbs: 71, base: true }, { name: "Passata", grams: 150, calories: 30, protein: 1.3, fats: 0.2, carbs: 5.5, base: false }, { name: "Parmesan", grams: 15, calories: 392, protein: 35, fats: 26, carbs: 3, base: false }, { name: "Olive oil", grams: 10, calories: 884, protein: 0, fats: 100, carbs: 0, base: false }] },
  { kitchen: "Balkan", title: "Chicken with ajvar, potatoes and šopska salad", why: "Smoky ajvar and a fresh salad next to the chicken.", for_cooking: ["parsley", "vinegar"],
    adds: [{ name: "Potatoes, boiled", grams: 250, calories: 87, protein: 1.9, fats: 0.1, carbs: 20, base: true }, { name: "Ajvar", grams: 40, calories: 85, protein: 1.5, fats: 5, carbs: 8, base: false }, { name: "Tomato", grams: 120, calories: 18, protein: 0.9, fats: 0.2, carbs: 3.9, base: false }, { name: "Feta cheese", grams: 30, calories: 264, protein: 14, fats: 21, carbs: 4, base: false }] },
  { kitchen: "Mediterranean", title: "Chicken bulgur bowl with yogurt sauce", why: "Nutty bulgur and a cool yogurt.", for_cooking: ["lemon juice"],
    adds: [{ name: "Bulgur, cooked", grams: 180, calories: 83, protein: 3.1, fats: 0.2, carbs: 18.6, base: true }, { name: "Greek yogurt 2%", grams: 100, calories: 73, protein: 10, fats: 2, carbs: 3.6, base: false }, { name: "Cucumber", grams: 100, calories: 15, protein: 0.7, fats: 0.1, carbs: 3.6, base: false }] },
] };
const STEPS = { steps: [
  "Bring a large pot of salted water to the boil and cook {5} for 11 minutes, until al dente.",
  "Meanwhile, warm {4} in a pan over medium heat, add {2} and simmer for 5 minutes.",
  "Slice {1}, stir it into the sauce and heat it through, 3 to 4 minutes.",
  "Drain the penne, toss it in the pan and serve with {3} over the top.",
] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3261", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (state) => {
    const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-24T18:30:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, state);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    return page;
  };
  const text = async (page, sel = "main") => (await page.locator(sel).first().textContent()).replace(/\s+/g, " ");
  const st = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));

  const page = await open(seed);
  let asked = null;
  await page.route("**/api/meal", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MEAL) }));
  await page.route("**/api/steps", (r) => { asked = JSON.parse(r.request().postData() || "{}"); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STEPS) }); });
  await page.goto(U + "/plate"); await page.waitForTimeout(1400);
  // DT87: the button says what it does; on an empty plate a line says why it waits
  const fit = page.getByRole("button", { name: "Fit to my target" });
  ok(await fit.count() === 1 && !(await fit.isEnabled()) && /Add one food first\. Chef Mealan builds the dinner around it\./.test(await text(page, ".plate-card")), "DT87: empty plate: Fit to my target waits, and the line says why");
  ok(await page.getByRole("button", { name: /^Make it an? \w+$/ }).count() === 0, "DT87: no Make it a dinner");
  await page.locator(".row-food").filter({ hasText: "Chicken breast, cooked" }).getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(700);
  ok(await fit.isEnabled() && /Chef Mealan adds what it needs to land your dinner in its range\./.test(await text(page, ".plate-card")), "DT87: one food: Fit to my target, and the line names the range");
  const hat = await page.locator(".ways-out .pill-primary svg").boundingBox();
  ok(hat && hat.width >= 16, "DT87: the chef hat keeps its size next to Keep it as it is: " + (hat && Math.round(hat.width)));
  ok(/Chicken breast/.test(await text(page, ".plate-card .row-text")) && /weigh it cooked, about 200 g raw/.test(await text(page, ".plate-card .row-text")), "DT88, DT91: the row: the short name, weigh it cooked, about 200 g raw");
  // DT88: Chef Mealan's ideas, in a cook's words
  await fit.click(); await page.waitForTimeout(1200);
  ok(/A dinner around your chicken breast/.test(await text(page, ".step-head")), "DT88: the head says what the screen is for: " + await text(page, ".step-head h2, .step-head h1"));
  ok(/On the plate: 150 g cooked chicken breast\. It stays\./.test(await text(page, ".mm-stays")), "DT88: on the plate: 150 g cooked chicken breast");
  const chips = await page.locator(".mm-card").first().locator(".mm-add").allTextContents();
  ok(JSON.stringify(chips) === JSON.stringify(["+ 110 g dry penne", "+ 225 g passata", "+ 25 g parmesan", "+ 15 g olive oil"]), "DT88, DT91: chips in a cook's words; the penne at 110 g, the most for dry pasta, and the rest grown with it: " + chips.join(" | "));
  ok(/Dinner is 840 to 1,026 kcal, about 686 more than the plate\. Two ways from your kitchens, each in that range\./.test(await text(page, ".step-head")), "DT91: the head names the range: " + await text(page, ".step-head p, .step-head small"));
  ok(/^ITALIAN94\d kcal/.test(await text(page, ".mm-card")) && /For cooking, not counted: dried oregano, salt and pepper\./.test(await text(page, ".mm-card")), "DT91: Italian, about 940 kcal, in the range; the herbs not counted");
  const balkan = await page.locator(".mm-card").nth(1).textContent();
  ok(/BALKAN/.test(balkan) && /\+ 400 g boiled potatoes/.test(balkan), "DT91: the potato dinner fits now, potatoes at 400 g (it needed 632 g): " + balkan.replace(/\s+/g, " ").slice(0, 120));
  ok(/Chicken bulgur bowl with yogurt sauce/.test(await text(page, ".mm-fail")) && /Did not fit: \d+ kcal, under the 840 to 1026 kcal of this meal, even with 250 g bulgur, cooked\./.test(await text(page, ".mm-fail")), "DT91: the bulgur bowl that cannot fit says why, instead of disappearing");
  await page.locator(".mm-card").first().getByRole("button", { name: "Put it on the plate" }).click(); await page.waitForTimeout(900);
  ok(/Chef Mealan's Italian dinner, around your chicken breast\. Change any amount you like\./.test(await text(page, ".step-head")) && !/sets the energy/.test(await text(page)), "DT88: the line on the plate: around your chicken breast");
  ok(/Penne/.test(await text(page, ".plate-card")) && /weigh it dry/.test(await text(page, ".plate-card")), "DT88: Penne, weigh it dry");
  ok(/For cooking, not counted: dried oregano, salt and pepper\./.test(await text(page, ".plate-card")), "DT91: under the foods, for cooking, not counted");
  // DT89: How to make it, with Chef Mealan's steps at the plate's amounts
  await page.getByRole("button", { name: "Make it", exact: true }).click(); await page.waitForTimeout(1300);
  let t = await text(page);
  ok(/How to make it/.test(t) && !/How do you want to eat it/.test(t), "DT89: a dinner you cook gets How to make it, not the bowl ways");
  ok(asked && asked.items.length === 5 && asked.items[4].name === "Penne, dry" && JSON.stringify(asked.cooking) === JSON.stringify(["dried oregano", "salt and pepper"]), "DT89, DT91: Chef Mealan was asked for the steps of the five foods, with the herbs");
  const steps = await page.locator(".rp-steps li").allTextContents();
  ok(steps.length === 4 && /cook \d+ g penne for 11 minutes/.test(steps[0]) && /150 g chicken breast/.test(steps[2]), "DT89: four steps, at the plate's amounts: " + steps[0]);
  ok(/Chef Mealan's steps for your dinner, at your amounts\./.test(await text(page, ".step-head")), "DT89: the head says whose steps and for what");
  await page.getByRole("button", { name: "I'm making it", exact: true }).click(); await page.waitForTimeout(700);
  // DT90: As the steps say; Save keeps the steps, the kitchen and who made it
  ok(await page.getByRole("button", { name: /^\W*As the steps say$/ }).count() === 1 && !/as the recipe says/i.test(await text(page)), "DT90: How did it go? says As the steps say");
  await page.getByRole("button", { name: "On to How was it?" }).click(); await page.waitForTimeout(700);
  await page.getByRole("button", { name: "DaaM good" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(1300);
  let s = await st(page);
  const m = s.meals[0];
  ok(m && m.title === "Pollo alla pizzaiola with penne" && m.steps?.length === 4 && m.kitchen === "Italian" && m.byChef?.around === "chicken breast" && m.cooking?.length === 2, "DT90, DT91: the recipe keeps the steps, its kitchen, who made it, the herbs");
  t = await text(page);
  ok(/Chef Mealan's Italian dinner, around your chicken breast\. Made on 24 October\./.test(t) && !/No steps yet/.test(t) && /cook \d+ g penne/.test(t), "DT90: the recipe page says who made it and shows the steps");
  ok(/Penne · weigh it dry/.test(await text(page, ".rq-foods")) && /For cooking, not counted: dried oregano, salt and pepper\./.test(await text(page, ".rq-foods")), "DT88, DT91: the recipe page's foods in a cook's words, and the herbs");
  await page.close();

  // DT90: a dish from another recipe, named by you, is a recipe of its own (Milan 11:37: the Yeast name, then fritters)
  const F = (n) => seed.foods.find((x) => x.name === n);
  const fritters = { id: "fritters", title: "Fritters", savedAt: "2026-10-20T08:00:00Z", portion: 230, items: [{ id: "f1", food: F("Eggs"), grams: 120, locked: false }, { id: "f2", food: F("Oats"), grams: 60, locked: false }, { id: "f3", food: F("Milk 1.5%"), grams: 50, locked: false }] };
  const dish = { id: "fritters", title: "Fritters", of: 1, n: 1, base: 230 };
  const p2 = await open({ ...seed, meals: [fritters], items: fritters.items.map((i) => ({ ...i, id: "d" + i.id, dish })), title: "" });
  await p2.goto(U + "/plate"); await p2.waitForTimeout(1300);
  await p2.getByRole("button", { name: "Keep it as it is" }).click(); await p2.waitForTimeout(900);
  for (const name of ["Continue", "I'm making it this way", "I'm making it"]) { const bt = p2.getByRole("button", { name, exact: true }); if (await bt.count() && await bt.first().isEnabled()) { await bt.first().click(); await p2.waitForTimeout(600); break; } }
  if (await p2.locator(".way").count()) { await p2.locator(".way").first().click(); await p2.getByRole("button", { name: "I'm making it this way" }).click(); await p2.waitForTimeout(600); }
  await p2.getByRole("button", { name: "On to How was it?" }).click(); await p2.waitForTimeout(600);
  await p2.getByRole("button", { name: "Good", exact: true }).click();
  await p2.getByLabel("Name it").fill("Yeast fritters");
  ok(await p2.getByRole("button", { name: "Yes, save it" }).count() === 1, "DT90: a name you typed: Save in My recipes is offered, not This card points at it");
  await p2.getByRole("button", { name: "Save", exact: true }).click(); await p2.waitForTimeout(1300);
  s = await st(p2);
  ok(s.meals.length === 2 && s.meals[0].title === "Yeast fritters" && s.meals[0].basedOn?.id === "fritters" && s.meals[1].title === "Fritters", "DT90: Yeast fritters saved as its own recipe, adapted from Fritters; Fritters as it was");
  ok(/Yeast fritters/.test(await text(p2, ".rq-name")), "DT90: Save lands on Yeast fritters, not on Fritters");
  await p2.close();
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
