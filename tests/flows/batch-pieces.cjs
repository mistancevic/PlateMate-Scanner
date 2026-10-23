// A batch recipe in whole pieces (DT79, Milan 23 October 11:12 and 11:15, board DT79). Sarma makes 8. Planned for lunch,
// Chef Mealan picks the sarmas closest to what the slot has left; − and + change it by one; a second day takes its own; the
// recipe page says what the plan takes of the batch; the shopping list buys the whole batch, and each meal its share.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const f = (n) => seed.foods.find((x) => x.name === n);
seed.items = []; seed.feedback = [];
// 8 sarmas: about 1,440 kcal, 180 a sarma (test data, from the seed's foods)
seed.meals = [{ id: "sarma", title: "Sarma", savedAt: "2026-10-01T08:00:00Z", makes: { n: 8, unit: "sarmas" }, portion: 160,
  items: [["Rice, cooked", 400], ["Chicken breast, cooked", 360], ["Milk 1.5%", 300]].map(([n, g], i) => ({ id: "s" + i, food: f(n), grams: g, locked: true }))];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3196" }, stdio: ["ignore", "pipe", "pipe"] });
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
  await page.goto("http://127.0.0.1:3196/"); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(500);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ");
  const num = (s) => Number(String(s).replace(/,/g, ""));
  const pickDay = (k) => page.evaluate((k) => { const c = [...document.querySelectorAll(".day-strip .choice")]; c[c.findIndex((x) => x.classList.contains("is-today")) + k].click(); }, k);
  await pickDay(1); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Lunch at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  const need = num((await txt(".pick-sheet .pick-why")).match(/needs about ([\d,]+) kcal/)[1]);
  const row = await txt(".pick-sheet .pick-row");
  const pieces = Number((row.match(/(\d+) sarmas?/) || [])[1]);
  const one = 1440 / 8, want = Math.max(1, Math.min(8, Math.round(need / one)));
  ok(/Sarma/.test(row) && Math.abs(pieces - want) <= 1, `the picker offers Sarma in the sarmas that fit the slot: ${pieces} for about ${need} kcal (${row.slice(0, 60)})`);
  await page.locator(".pick-sheet").getByRole("button", { name: /Sarma/ }).click(); await page.waitForTimeout(400);
  const lunch = page.locator(".plan-slot-wrap", { hasText: "Sarma" });
  ok(new RegExp(`${pieces} sarmas`).test(await lunch.textContent()) && await lunch.locator(".plan-pieces").count() === 1, `lunch holds ${pieces} sarmas, with − and +`);
  await lunch.getByRole("button", { name: "One sarma more" }).click(); await page.waitForTimeout(300);
  ok(new RegExp(`${pieces + 1} sarmas`).test(await lunch.textContent()), `+ makes it ${pieces + 1}`);
  ok(await page.getByRole("button", { name: "Back to the usual portions" }).count() === 0, "a count set by hand is the usual one, nothing to go back to");
  // the next day, another lunch of it
  await pickDay(2); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Lunch at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  await page.locator(".pick-sheet").getByRole("button", { name: /Sarma/ }).click(); await page.waitForTimeout(400);
  const second = Number(((await txt(".plan-slot-wrap .plan-pieces")).match(/(\d+) sarmas?/) || [])[1]);
  const total = pieces + 1 + second;
  // the shopping list: one batch for what both lunches take, each meal its share
  await page.getByRole("button", { name: "Make a shopping list" }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: /^7 days$/ }).click(); await page.waitForTimeout(300);
  const batches = Math.ceil(total / 8);
  ok(new RegExp(`Sarma: ${batches === 1 ? "one batch" : `${batches} batches`} of 8, for the ${total} planned\\.`).test(await txt(".sheet")), `the list buys the whole batch: ${(await txt(".shop-batch")).slice(0, 80)}`);
  await page.getByRole("button", { name: /^Make shopping list \d/ }).click(); await page.waitForTimeout(500);
  const rice = ((await page.locator(".shop-row", { hasText: "Rice" }).first().textContent()) ?? "").replace(/\s+/g, " ");
  ok(/raw/.test(rice) && /Sarma: \w+, \w+ lunch/.test(rice), "rice for the batch, bought raw, for both lunches: " + rice.slice(0, 90));
  await page.locator(".sheet").getByRole("button", { name: "Close" }).first().click(); await page.waitForTimeout(300);
  // the recipe page: what the plan takes of the batch
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
  await page.getByText("Sarma", { exact: true }).last().click(); await page.waitForTimeout(900);
  const line = (await page.locator(".rq-planned").count()) ? await txt(".rq-planned") : "";
  ok(new RegExp(`^8 sarmas: ${pieces + 1} on \\w+ lunch, ${second} on \\w+ lunch\\.`).test(line), "the recipe page says what the plan takes: " + line);
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
