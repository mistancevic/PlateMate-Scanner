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
  await page.addInitScript((s) => { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-camera-auto", "manual"); /* the auto shot has its own walkthrough; here the shutter counts */ }, seed);
  await page.goto("http://127.0.0.1:3180/"); await page.waitForTimeout(800);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(2500);
  // JOURNEY INVARIANT: Scan on the plate opens the group camera, several sides of one product in one go, whatever mode was used before.
  // Never rewrite these lines to fit a change.
  const groupOn = async () => page.getByRole("button", { name: /GROUP/ }).evaluate((b) => b.className.includes("bg-white"));
  console.log((await groupOn()) ? "ok   Scan opens the group camera" : "FAIL Scan did not open the group camera"); if (!(await groupOn())) process.exitCode = 1;
  await page.getByRole("button", { name: /LABEL/ }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Close camera|Cancel|Close/ }).first().click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(2500);
  console.log((await groupOn()) ? "ok   Scan opens the group camera again after Label was used" : "FAIL Scan reopened in the last mode, not the group camera"); if (!(await groupOn())) process.exitCode = 1;
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(500);
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(500);
  
  const n = await page.getByRole("button", { name: /Analyze 2 photos/ }).count(); console.log(n === 1 ? "ok   Analyze 2 sits next to the shutter" : "FAIL Analyze button missing: " + (await page.getByRole("button", { name: /Analyze/ }).allTextContents()).join(",")); if (n !== 1) process.exitCode = 1;
  await b.close(); server.kill();
})();
