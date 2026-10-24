// Cyprus and Limassol (0.2.58 and 0.2.59, Milan 14:58 and 15:19, for Tester 3). Tester 3's library had twenty starter foods
// picked for Munich. He picks Limassol, taps Add starter foods for Limassol, and gets the fifty Cypriot foods with their
// Greek names; a second tap adds nothing. Foods finds a Cypriot food in Greek.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const U = "http://127.0.0.1:3244";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3244", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("chefmealan-region", "munich");
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const count = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.length);
  await page.goto(U + "/me/shop"); await page.waitForTimeout(1100);
  const before = await count();
  ok(await page.getByRole("button", { name: "Limassol" }).count() === 1 && await page.getByRole("button", { name: "Cyprus, elsewhere" }).count() === 1, "Limassol and Cyprus, elsewhere are places to shop");
  await page.getByRole("button", { name: "Limassol" }).click(); await page.waitForTimeout(300);
  ok(/fifty Cypriot foods with their Greek names/.test(await page.locator("section.card").first().textContent()), "the starter line names the fifty Cypriot foods");
  await page.getByRole("button", { name: "Add starter foods for Limassol" }).click(); await page.waitForTimeout(500);
  const after = await count();
  const foods = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods);
  ok(after - before >= 50 && foods.some((f) => f.name === "Halloumi" && (f.aliases || []).includes("Χαλλούμι")), `the tap adds the fifty Cypriot foods (${after - before} added), halloumi with its Greek name`);
  await page.getByRole("button", { name: "Add starter foods for Limassol" }).click(); await page.waitForTimeout(500);
  ok(await count() === after, "a second tap adds nothing");
  await page.goto(U + "/foods"); await page.waitForTimeout(1100);
  await page.getByLabel("Find a food").fill("σεφταλια"); await page.waitForTimeout(500);
  ok(/Sheftalia/.test(await page.locator("main").textContent()), "Find a food finds sheftalia in my foods, typed in Greek with no accent");
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
