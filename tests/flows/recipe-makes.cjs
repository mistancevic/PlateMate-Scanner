// What a recipe makes (DT80, Milan 23 October 12:26 and 12:27, board DT80). A sarma recipe saved from the Plate says nothing
// about what it makes, so the Plate divides it by weight into portions. Edit recipe, Makes 8 sarma: the page counts one sarma,
// a lunch already planned turns into the sarmas that keep its kcal, Plan counts in sarmas, and the page says what the plan takes.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const f = (n) => seed.foods.find((x) => x.name === n);
seed.items = []; seed.feedback = [];
// test data: 1,060 g of foods saved with a 265 g portion, so the Plate divides it into 4 portions
seed.meals = [{ id: "sarma", title: "Sarma", savedAt: "2026-10-01T08:00:00Z", portion: 265,
  items: [["Rice, cooked", 400], ["Chicken breast, cooked", 360], ["Milk 1.5%", 300]].map(([n, g], i) => ({ id: "s" + i, food: f(n), grams: g, locked: true })) }];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3195" }, stdio: ["ignore", "pipe", "pipe"] });
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
  await page.goto("http://127.0.0.1:3195/"); await page.waitForTimeout(900);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ");
  const num = (s) => Number(String(s).replace(/,/g, ""));
  // plan it before it says what it makes: portions
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  await page.evaluate(() => { const c = [...document.querySelectorAll(".day-strip .choice")]; c[c.findIndex((x) => x.classList.contains("is-today")) + 1].click(); });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Lunch at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  await page.locator(".pick-sheet .pick-row", { hasText: /portions?/ }).filter({ hasText: "Sarma" }).first().click(); await page.waitForTimeout(400);
  const before = await txt(".plan-slot-wrap .plan-pieces");
  const kcalBefore = num((await txt(".plan-slot-wrap:has(.plan-pieces)")).match(/([\d,]+) kcal/)[1]);
  ok(/\d+ portions?/.test(before), "before: Plan counts the Plate's portions: " + before);
  // Edit recipe: Makes 8 sarma
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
  await page.getByText("Sarma", { exact: true }).last().click(); await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(400);
  ok(await page.getByRole("group", { name: "What the recipe makes" }).count() === 1, "Edit recipe asks what it makes");
  await page.getByLabel("How many it makes").fill("8"); await page.getByLabel("Of what").fill("sarma");
  await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(800);
  const pageText = await txt(".rq");
  ok(/The whole recipe makes 8 sarmas · one sarma \d+ kcal/.test(pageText) && /One sarma/.test(pageText), "the page: Makes 8 sarmas, and one sarma's numbers: " + pageText.slice(0, 200));
  ok(/^8 sarmas: \d+ on \w+ lunch\. \d+ sarmas? left\./.test(await txt(".rq-planned")), "the page says what the plan takes: " + await txt(".rq-planned"));
  // Plan: the lunch is now in sarmas, about the same kcal
  await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(700);
  const after = await txt(".plan-slot-wrap .plan-pieces");
  const kcalAfter = num((await txt(".plan-slot-wrap:has(.plan-pieces)")).match(/([\d,]+) kcal/)[1]);
  ok(/\d+ sarmas?/.test(after) && /of the 8 it makes/.test(after), "after: Plan counts in sarmas: " + after);
  ok(Math.abs(kcalAfter - kcalBefore) / kcalBefore <= 0.15, `the lunch keeps about its kcal: ${kcalBefore} before, ${kcalAfter} after`);
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
