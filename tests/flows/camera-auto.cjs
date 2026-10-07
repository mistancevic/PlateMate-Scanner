const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(require("node:path").resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: require("node:path").resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3182" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"] });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3182/"); await page.waitForTimeout(800);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(1500);
  console.log("switch:", await page.locator(".auto-switch").first().textContent());
  // freeze the picture to simulate holding still: pause the video
  await page.evaluate(() => document.querySelector("video").pause());
  await page.waitForTimeout(1800);
  console.log("staged after holding still:", await page.locator('[aria-label="Staged photos"] img').count());
  await page.waitForTimeout(1500);
  console.log("still one (waits for the next angle):", await page.locator('[aria-label="Staged photos"] img').count());
  await page.locator(".auto-switch").first().click(); await page.waitForTimeout(200);
  console.log("switch now:", await page.locator(".auto-switch").first().textContent(), "| remembered:", await page.evaluate(() => localStorage.getItem("chefmealan-camera-auto")));
  console.log(errs.length ? "page errors: " + errs : "no page errors");
  await b.close(); server.kill();
})();
