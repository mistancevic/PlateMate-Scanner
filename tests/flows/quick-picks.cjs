// Quick picks on the plate: eight at most, a favourite goes first, search reaches everything, All foods opens Foods.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
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
  await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(300);
  const lastName = await page.evaluate(() => { const f = JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods; return f[f.length - 1].name; });
  await page.locator(".row").filter({ hasText: lastName }).getByRole("button", { name: /Favourite/ }).click(); await page.waitForTimeout(300);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(400);
  const picks = await page.locator(".row-food .row-text b").allTextContents();
  ok(picks.length === 8, `the plate shows 8 quick picks out of ${total}`);
  ok(picks[0].includes(lastName), `the favourite comes first: ${picks[0]}`);
  await page.getByLabel("Search all my foods").fill(lastName.slice(0, 5)); await page.waitForTimeout(200);
  ok(await page.getByText("From all your foods").count() === 1, "typing searches all foods");
  await page.getByLabel("Search all my foods").fill(""); await page.waitForTimeout(200);
  await page.getByRole("button", { name: new RegExp(`all ${total} foods`, "i") }).click(); await page.waitForTimeout(300);
  ok(await page.getByText(/Find a food/).count() >= 1, "All foods opens Foods");
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(300);
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
