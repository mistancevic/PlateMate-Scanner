// The culinary gate and the three phases (0.2.88, canvas Page 2, board Stories60, DT93 and DT94; Milan 24 October 13:47 to
// 14:09, his first real test of 0.2.87). His plate: a protein bar, active dry yeast and peanut butter, 150 g each, the yeast set
// to 10 g; Maintain at 2,750 kcal, PD 6.5, lunch by the clock. Chef Mealan's read of the plate is a stand-in (no AI). Checked:
// the red portion lines, the readout saying it is not a lunch yet, Chef Mealan's gate card with its three ways, Fit in place
// (the yeast stays at its portion, the blue line says what Fit did, Undo), the three ways when the foods top out, the phase
// bar, Lock the recipe, the Make screen with the steps to tick, and Feedback without Name it.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45), YE = F("yeast", "Active dry yeast", 325, 40, 7, 41), PB = F("pb", "Peanut butter", 588, 25, 50, 20);
seed.foods = [BAR, YE, PB, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 150, locked: false }, { id: "b", food: YE, grams: 10, locked: false }, { id: "c", food: PB, grams: 150, locked: false }];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const U = "http://127.0.0.1:3262";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3262", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-24T13:47:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  let dishAsked = 0;
  await page.route("**/api/dish", (r) => { dishAsked++; r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: false, why: "A bar, yeast and peanut butter do not make a lunch: the yeast needs a dough, and the bar is a snack on its own.", around: "Clean Protein Bar Peanut Love", betterAs: "snack" }) }); });
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const text = async (sel = "main") => (await page.locator(sel).first().textContent()).replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  await page.goto(U + "/plate"); await page.waitForTimeout(1800);
  // DT94: the phase bar
  ok(JSON.stringify(await page.locator(".phase-bar span").allTextContents()) === JSON.stringify(["Craft", "Make", "Feedback"]) && await page.locator(".phase-bar span.on").count() === 1, "DT94: three phases, Craft on");
  // DT93, rule 1: the portion lines
  const gates = await page.locator(".gate-line").allTextContents();
  ok(gates.length === 2 && gates[0] === "150 g is 3 bars. One bar is about 50 g." && gates[1] === "150 g is over a portion of peanut butter, 15 to 40 g.", "DT93: red lines under the bar and the peanut butter, none under 10 g of yeast: " + gates.join(" | "));
  // rule 3: the size
  ok(/not a lunch yet/.test(await text(".readout")) && /about 2 lunches/.test(await text(".readout")), "DT93: the readout says not a lunch yet, about 2 lunches");
  // rule 2: Chef Mealan's read, once per set of foods
  const gate = page.locator(".gate-card").first();
  ok(dishAsked === 1 && /do not make a lunch/.test(await gate.textContent()) && !/Reading your plate/.test(await gate.textContent()) && await gate.getByRole("button", { name: /^Make it a lunch around the clean protein bar/ }).count() === 1 && await gate.getByRole("button", { name: "Make it a snack" }).count() === 1 && await gate.getByRole("button", { name: "Keep it as it is" }).count() === 1, "DT93: Chef Mealan's card: why, and three ways");
  await page.locator(".grams input").nth(1).fill("25"); await page.waitForTimeout(600);
  ok(dishAsked === 1, "DT93: changing an amount does not ask Chef Mealan again");
  // Fit in place: the yeast stays at its portion, the line says so, the plate stays on Craft
  await page.locator(".grams input").nth(1).fill("10"); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Fit to my target" }).click(); await page.waitForTimeout(1500);
  ok(await page.locator(".phase-bar span.on").count() === 1 && await page.locator(".title-input").count() === 1 && await page.getByRole("button", { name: "Manual" }).count() === 1, "DT93: Fit stays on the Plate: the name field and Manual are still there");
  // DT97 (0.2.90): Fit's line lives in Chef Mealan's one place, not under the row
  const fitLine = await page.locator(".fit-note").allTextContents();
  ok(fitLine.length === 1 && /^Fit set 10 g active dry yeast, the most for a portion \(it asked for \d+ g\)\.$/.test(fitLine[0]), "DT93, DT97: Fit never moves the yeast past 10 g, says what it asked for, in Chef Mealan's place: " + fitLine[0]);
  ok((await st()).items.find((i) => i.id === "b").grams === 10, "DT93: the yeast is 10 g in the state");
  const ways = page.locator(".gate-card").first();
  ok(await page.locator(".gate-card").count() === 1, "DT97: one Chef Mealan place, not two cards");
  ok(/These foods top out at PD 4\.7 within their portions/.test(await ways.textContent()) && await ways.getByRole("button", { name: "Add foods for a lunch" }).count() === 1 && await ways.getByRole("button", { name: "Swap a food" }).count() === 1 && await ways.getByRole("button", { name: "Ask Chef Mealan" }).count() === 1, "DT93: the foods top out: Add foods, Swap a food, Ask Chef Mealan");
  ok(await page.getByRole("button", { name: "Fit again" }).count() === 1 && await page.getByRole("button", { name: "Lock the recipe" }).count() === 1, "DT94: Fit again and Lock the recipe on the Plate");
  // Ask Chef Mealan opens the chat with the plate in the first question
  await ways.getByRole("button", { name: "Ask Chef Mealan" }).click(); await page.waitForTimeout(900);
  const talk = await text(".talk-overlay");
  ok(/What should I change on my plate so it makes a lunch\? 150 g Clean Protein Bar Peanut Love, 10 g Active dry yeast, 150 g Peanut butter\./.test(talk), "DT93: the chat opens with the plate in the question: " + talk.slice(0, 200));
  await page.locator(".talk-overlay").getByRole("button", { name: /Close|Back/ }).first().click().catch(() => {}); await page.waitForTimeout(400);
  if (await page.locator(".talk-overlay").count()) { await page.keyboard.press("Escape"); await page.waitForTimeout(300); }
  // a plate that is food: the bar at 50 g, bread, banana, peanut butter 20 g; named in Craft
  await page.unroute("**/api/dish");
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A peanut banana toast with the bar on the side: a plain lunch.", around: "Wholegrain bread", betterAs: "meal" }) }));
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const f = (id) => s.foods.find((x) => x.id === id); s.items = [{ id: "a", food: f("bar"), grams: 50, locked: false }, { id: "d", food: f("f-bread"), grams: 80, locked: false }, { id: "e", food: f("f-banana"), grams: 120, locked: false }, { id: "c", food: f("pb"), grams: 20, locked: false }]; s.title = "Peanut banana toast"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(1800);
  ok(await page.locator(".gate-line").count() === 0 && /A peanut banana toast with the bar on the side/.test(await text(".gate-ok")), "DT93: a plate that is food: no red lines, Chef Mealan's one line that says what it is");
  // DT98 (0.2.90): the cooking foods as chips; x takes one out
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.cooking = ["ground cinnamon", "lemon zest"]; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(1500);
  ok(await page.locator(".pt-cook .pt-chip").count() === 2, "DT98: For cooking as two chips");
  await page.getByRole("button", { name: "Take out lemon zest" }).click(); await page.waitForTimeout(300);
  ok(JSON.stringify((await st()).cooking) === JSON.stringify(["ground cinnamon"]) && await page.locator(".pt-cook .pt-chip").count() === 1, "DT98: x takes the lemon zest out, the cinnamon stays");
  await page.getByRole("button", { name: "Lock the recipe" }).click(); await page.waitForTimeout(900);
  // a mix of ready foods: the ways, inside Craft, ending with Lock the recipe
  ok(await page.locator(".phase-bar span.on").count() === 1 && /How do you want to eat it\?/.test(await text()), "DT94: the ways to eat a mix stay inside Craft");
  await page.locator(".way").first().click(); await page.getByRole("button", { name: "Lock the recipe, this way" }).click(); await page.waitForTimeout(900);
  ok(await page.locator(".phase-bar span.on").count() === 2 && /^Make: Peanut banana toast/.test(await text("h2")), "DT94: Make, with the recipe's name");
  const ticks = page.locator(".mk-check");
  ok(await ticks.count() >= 2 && /Tick the steps as you go/.test(await text()), "DT94: the steps to tick on the Make screen: " + await ticks.count());
  await ticks.first().click(); ok(await page.locator(".mk-check.on").count() === 1, "DT94: a step ticked");
  ok(await page.getByRole("button", { name: "Rate it" }).count() === 1 && await page.getByRole("button", { name: /On to/ }).count() === 0, "DT99: the button on Make is Rate it");
  await page.getByRole("button", { name: "Rate it" }).click(); await page.waitForTimeout(800);
  ok(await page.locator(".phase-bar span.on").count() === 3 && /Feedback: how was it\?/.test(await text("h2")) && /Peanut banana toast · named in Craft/.test(await text()) && await page.getByLabel("Name it").count() === 0, "DT94: Feedback, the name from Craft, no Name it");
  await page.getByRole("button", { name: "DaaM good" }).click(); await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(1200);
  ok((await st()).meals[0]?.title === "Peanut banana toast", "DT94: saved under the name from Craft");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
