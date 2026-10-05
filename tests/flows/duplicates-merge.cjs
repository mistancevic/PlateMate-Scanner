const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(require("node:path").resolve(__dirname, "seed.json"), "utf8"));
const flip = (id, name, brand, barcode) => ({ id, name, brand, barcode, basis: "100g", source: "label", notes: "", reviewedAt: "2026-10-01", readyToEat: true, calories: 404, protein: 23, fats: 8.4, carbs: 56, fiber: 5.2 });
seed.foods = [flip("fa", "Protein Flips Salt & Vinegar Flavour", "", undefined), flip("fb", "protein flips salt vinegar flavour", "ahead", "4260345270123"), ...seed.foods];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: require("node:path").resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3186" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ["camera"] });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
  await page.goto("http://127.0.0.1:3186/"); await page.waitForTimeout(800);
  await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(400);
  console.log("strip:", await page.locator(".strip-button").first().textContent());
  await page.locator(".strip-button").first().click(); await page.waitForTimeout(300);
  
  await page.getByRole("button", { name: /^Merge$/ }).first().click(); await page.waitForTimeout(400);
  const foods = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.filter((f) => /flips/i.test(f.name)));
  console.log("after merge:", foods.length, foods.map((f) => [f.name, f.brand, f.barcode]));
  // the barcode now opens the existing card
  await page.locator(".sheet-backdrop").first().click({ position: { x: 5, y: 5 } }).catch(() => {}); await page.waitForTimeout(200);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /BARCODE/ }).click(); await page.waitForTimeout(300);
  await page.locator('input[aria-label^="Type t"]').fill("4260345270123"); await page.keyboard.press("Enter"); await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/dm.png" }); console.log("card opened for:", await page.locator(".foodcard-head b").textContent().catch(() => "no card"));
  console.log(errs.length ? "errors: " + errs : "no page errors");
  await b.close(); server.kill();
})();
