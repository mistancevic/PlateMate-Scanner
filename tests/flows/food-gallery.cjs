const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(require("node:path").resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: require("node:path").resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3185" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
  await page.goto("http://127.0.0.1:3185/"); await page.waitForTimeout(800);
  await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(400);
  await page.locator(".name-link, .row-text b").filter({ hasText: "Skyr" }).first().click(); await page.waitForTimeout(400);
  console.log("add button:", await page.locator(".g-add").textContent());
  await page.locator('.food-gallery input[type=file]').setInputFiles(require("node:path").resolve(__dirname, "front.jpg")); await page.waitForTimeout(900);
  await page.locator('.food-gallery input[type=file]').setInputFiles(require("node:path").resolve(__dirname, "front.jpg")); await page.waitForTimeout(900);
  const n = await page.locator(".g-thumb").count(); console.log(n === 3 ? "ok   the picture plus two added photos" : "FAIL gallery has " + n); if (n !== 3) process.exitCode = 1;
  await page.locator(".g-thumb").first().click(); await page.waitForTimeout(300);
  console.log("full view open:", await page.locator(".photo-view").count());
  await page.getByRole("button", { name: "Remove this photo" }).click(); await page.waitForTimeout(400);
  const left = await page.locator(".g-thumb").count();
  console.log(left === 2 ? "ok   a photo can be removed" : "FAIL remove left " + left); if (left !== 2) process.exitCode = 1;
  
  
  console.log(errs.length ? "errors: " + errs : "no page errors");
  await b.close(); server.kill();
})();
