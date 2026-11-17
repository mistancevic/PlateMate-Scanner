// Quick picks on the plate: eight at most, a favourite goes first, search reaches everything, All foods opens Foods.
// Changed by story DT308 (0.3.154 and 0.3.155, boards Stories236 and 238): the empty Plate lists three of your foods each for
// Protein, Carbs and Fat, a favourite first in its group; the search reaches everything; See all foods opens Foods.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = []; seed.title = "";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3191" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3191/"); await page.waitForTimeout(800);
  const total = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.length);
  // make the last food a favourite, from Foods
  await require("./foods.cjs")(page);
  const lastName = await page.evaluate(() => { const f = JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods; return f[f.length - 1].name; });
  await page.locator(".row").filter({ hasText: lastName }).getByRole("button", { name: /Favourite/ }).click(); await page.waitForTimeout(300);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(400);
  const picks = await page.locator(".from-list .row-food .row-text b").allTextContents();
  const groups = await page.locator(".from-list .macro-group").count();
  ok(picks.length >= 3 && picks.length <= 9 && groups >= 1 && groups <= 3, `the empty plate shows up to three foods per macro, ${picks.length} out of ${total}`);
  ok(picks.some((n) => n.includes(lastName)) && (await page.locator(".from-list .macro-group + .row-food .row-text b").allTextContents()).some((n) => n.includes(lastName)), `the favourite comes first in its group: ${lastName}`);
  await (await require("./more.cjs")(page)).fill(lastName.slice(0, 5)); await page.waitForTimeout(200);
  ok(await page.locator(".from-list .macro-group").count() === 0 && (await page.locator(".from-list .row-food .row-text b").allTextContents()).some((n) => n.includes(lastName)), "typing searches all foods");
  await (await require("./more.cjs")(page)).fill(""); await page.waitForTimeout(200);
  await page.getByRole("button", { name: "See all foods" }).click(); await page.waitForTimeout(300);
  ok(await page.getByText(/Find a food/).count() >= 1, "All foods opens Foods");
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(300);
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
