// One recipe, a batch each time you cook it (DT81, Milan 23 October 13:26 to 15:17, board DT81). Sarma makes 8. Two lunches
// planned take more than 8; the recipe page says so on its label and offers to cook what the plan takes; the foods follow;
// the shopping list buys for that batch; on the Plate the batch is counted after cooking (it made one more), and the plan's
// sarmas are that batch's share from then on.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const f = (n) => seed.foods.find((x) => x.name === n);
seed.items = []; seed.feedback = [];
seed.meals = [{ id: "sarma", title: "Sarma", savedAt: "2026-10-01T08:00:00Z", makes: { n: 8, unit: "sarmas" }, portion: 133,
  items: [["Rice, cooked", 400], ["Chicken breast, cooked", 360], ["Milk 1.5%", 300]].map(([n, g], i) => ({ id: "s" + i, food: f(n), grams: g, locked: true })) }];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3194", GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) {
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 80, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { meals: 3, window: { from: "07:30", to: "20:00" } } }));
    localStorage.setItem("seeded", "1"); } }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3194/"); await page.waitForTimeout(900);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ");
  const store = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === "sarma"));
  const nav = async (t) => { await page.locator("nav button").filter({ hasText: t }).click(); await page.waitForTimeout(700); };
  // two lunches of it
  await nav("Plan");
  for (const k of [1, 2]) {
    await page.evaluate((k) => { const c = [...document.querySelectorAll(".day-strip .choice")]; c[c.findIndex((x) => x.classList.contains("is-today")) + k].click(); }, k); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Lunch at .*pick a meal/ }).click(); await page.waitForTimeout(400);
    await page.locator(".pick-sheet .pick-row", { hasText: /sarmas?/ }).first().click(); await page.waitForTimeout(400);
  }
  const planned = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("chefmealan-planned"))).flatMap((d) => Object.values(d)).filter((m) => m.mealId === "sarma").reduce((a, m) => a + (m.amount || 1), 0));
  ok(planned > 8, `two lunches take ${planned} sarmas, more than the 8 the recipe makes`);
  // the recipe page: the label, and Cook it with what the plan takes
  await nav("Recipes");
  await page.getByText("Sarma", { exact: true }).last().click(); await page.waitForTimeout(900);
  ok(/The whole recipe makes 8 sarmas · one sarma \d+ kcal/.test(await txt(".rq-label")), "the label under the name: " + await txt(".rq-label"));
  ok(/^Cook it\s*−\s*8 sarmas\s*\+\s*As the recipe makes it\./.test(await txt(".rq-cook")), "Cook it starts as written: " + (await txt(".rq-cook")).slice(0, 60));
  await page.getByRole("button", { name: `The plan takes ${planned}: cook ${planned}` }).click(); await page.waitForTimeout(500);
  ok(new RegExp(`${planned} sarmas\\s*\\+\\s*The recipe makes 8; the foods below are for ${planned}\\.`).test(await txt(".rq-cook")), "Cook it takes the plan's number: " + (await txt(".rq-cook")).slice(0, 90));
  ok(new RegExp(`${Math.round(400 * planned / 8)} g`).test(await txt(".rq-foods")), `the foods follow: rice ${Math.round(400 * planned / 8)} g for ${planned}`);
  ok((await store()).cook?.n === planned, "the recipe keeps the batch to cook; the recipe itself stays at 8");
  // the shopping list buys for that batch
  await nav("Plan");
  await page.getByRole("button", { name: "Make a shopping list" }).click(); await page.waitForTimeout(500);
  ok(new RegExp(`Sarma: cook ${planned}, for the ${planned} planned\\.`).test(await txt(".sheet")), "the list buys for the batch: " + await txt(".shop-batch"));
  await page.locator(".sheet").getByRole("button", { name: "Close" }).first().click(); await page.waitForTimeout(300);
  // cook it on the Plate, count what it made: one more
  await nav("Recipes");
  await page.getByText("Sarma", { exact: true }).last().click(); await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Make it" }).first().click(); await page.waitForTimeout(900);
  const plateG = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.reduce((s, i) => s + i.grams, 0));
  ok(Math.abs(plateG - 1060 * planned / 8) <= 2, `the Plate holds the batch for ${planned}: ${Math.round(plateG)} g`);
  await page.getByRole("button", { name: /^Make it( as it is)?$|^Keep it as it is$|^Lock the recipe$/ }).first().click(); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^I'm making it|^Lock the recipe/ }).first().click(); await page.waitForTimeout(700);
  const made = page.getByRole("group", { name: "How many it made" });
  ok(new RegExp(`It made\\s*−\\s*${planned}\\s*sarmas`).test(((await made.textContent()) ?? "").replace(/\s+/g, " ")), `It made ${planned}, as cooked`);
  await made.getByRole("button", { name: "It made one more" }).click(); await page.waitForTimeout(300);
  ok(new RegExp(`You made ${planned + 1} sarmas\\. How many did you eat\\?`).test(await txt("main")), `counted: You made ${planned + 1} sarmas`);
  await page.getByRole("button", { name: /^(On to How was it\?|Rate it)$/ }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "DaaM good" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(900);
  const m = await store();
  ok(m.batch?.cooked === planned && m.batch?.made === planned + 1 && !m.cook && m.makes.n === 8, `the batch is kept: cooked for ${planned}, made ${planned + 1}; the recipe still makes 8`);
  // the plan's sarmas are now that batch's share
  const per = await page.evaluate(() => { const ms = Object.values(JSON.parse(localStorage.getItem("chefmealan-planned"))).flatMap((d) => Object.values(d)).filter((m) => m.mealId === "sarma"); return ms.map((x) => [x.servings, Math.round(x.kcal / (x.amount || 1))]); });
  const whole = await page.evaluate(() => { const r = JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === "sarma"); return r.items.reduce((s, i) => s + i.food.calories * i.grams / 100, 0); });
  const want = Math.round(whole * planned / 8 / (planned + 1));
  ok(per.length === 2 && per.every(([s, k]) => s === planned + 1 && Math.abs(k - want) <= 1), `a planned sarma is now 1/${planned + 1} of the batch: ${JSON.stringify(per)}, about ${want} kcal`);
  // from scratch: no recipe yet; the foods on the Plate are what you cook, and the save asks what it made
  await nav("Plate");
  await page.getByRole("button", { name: /Add/ }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Add/ }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^(Fit to my target|Make it an? \w+)$/ }).first().click(); await page.waitForTimeout(900);
  // 0.2.88 (DT93, DT94): Fit works in place; Lock the recipe goes on
  await page.getByRole("button", { name: /^Lock the recipe$/ }).first().click(); await page.waitForTimeout(600);
  await page.locator(".way").first().click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /I'm making it this way|Lock the recipe, this way/ }).click(); await page.waitForTimeout(600);
  await page.getByRole("button", { name: /On to How was it|Rate it/ }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "DaaM good" }).click();
  // about one meal: the save says nothing about it, one plate unless you say more (DT81, Milan 15:53 and 15:55)
  ok(await page.getByRole("group", { name: "What it makes" }).count() === 0 && await page.getByRole("button", { name: "It makes more than one" }).count() === 1, "about one meal: no question, only It makes more than one");
  await page.getByRole("button", { name: "It makes more than one" }).click(); await page.waitForTimeout(200);
  const ask = page.getByRole("group", { name: "What it makes" });
  ok(await ask.count() === 1, "a tap asks what it makes");
  await ask.getByLabel("How many it makes").fill("10"); await ask.getByLabel("Of what").fill("sarma");
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(900);
  const fresh = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id !== "sarma"));
  ok(fresh && fresh.makes?.n === 10 && fresh.makes.unit === "sarmas", "the new recipe makes 10 sarmas: " + JSON.stringify(fresh && fresh.makes));
  // clearly more than one meal: the save asks, with the Plate's guess in it
  await nav("Plate");
  await page.getByRole("button", { name: /Add/ }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Add/ }).first().click(); await page.waitForTimeout(300);
  for (const inp of await page.locator('input[aria-label^="Grams of"]').all()) { await inp.fill("900"); }
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^(Keep it as it is|Lock the recipe)$/ }).first().click(); await page.waitForTimeout(800);
  if (await page.locator(".way").count()) { await page.locator(".way").first().click(); await page.waitForTimeout(200); }
  await page.getByRole("button", { name: /I'm making it|Lock the recipe/ }).first().click(); await page.waitForTimeout(600);
  // a big plate eaten all at once is asked about (R25); you ate a portion of it
  await page.getByRole("button", { name: "A portion" }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /On to How was it|Rate it/ }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "DaaM good" }).click();
  const big = page.getByRole("group", { name: "What it makes" });
  const bigText = ((await big.textContent()) ?? "").replace(/\s+/g, " ");
  const guess = await big.getByLabel("How many it makes").inputValue();
  ok(/You ate a portion of it, and it is about \d+ of your meals\. How many does it make\?/.test(bigText) && Number(guess) >= 2, `you ate a portion of a big plate: the save asks, ${guess} filled in (${bigText.slice(0, 90)})`);
  ok(await big.getByRole("button", { name: "One plate" }).count() === 1, "and One plate");
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(900);
  const st = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); return { m: s.meals[0], f: s.feedback.filter((x) => x.status === "eaten")[0] }; });
  const kc = (items) => items.reduce((a, i) => a + i.food.calories * i.grams / 100, 0);
  ok(st.m.makes?.n === Number(guess) && Math.abs(kc(st.f.meal.items) - kc(st.m.items) / Number(guess)) < 2, `saved as ${guess} portions, and today counts one of them`);
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
