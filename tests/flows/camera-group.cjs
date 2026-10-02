const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(require("node:path").resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: require("node:path").resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3180" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ["camera"] });
  const page = await ctx.newPage();
  await page.addInitScript((s) => { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
  await page.goto("http://127.0.0.1:3180/"); await page.waitForTimeout(800);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(2500);
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(500);
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(500);
  
  const n = await page.getByRole("button", { name: /Analyze 2 photos/ }).count(); console.log(n === 1 ? "ok   Analyze 2 sits next to the shutter" : "FAIL Analyze button missing"); if (n !== 1) process.exitCode = 1;
  await b.close(); server.kill();
})();
