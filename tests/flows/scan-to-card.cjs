// JOURNEY INVARIANT (Milan, 7 October 2026, from testing on his phone and laptop): typing a barcode by hand pauses the
// camera: the green line stops and nothing is read until the field is left empty. A new food saved from Foods opens its
// card, so you see what was saved and can add its photos. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3198", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"] });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.route("**/api/product/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ product_name: "Test Bar", brand: "Testers", calories: 380, protein: 30, fats: 12, carbs: 35, fiber: 6, source: "Open Food Facts · review required" }) }));
  await page.addInitScript((s) => { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3198/"); await page.waitForTimeout(800);
    await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Add a food" }).click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /BARCODE/ }).click(); await page.waitForTimeout(400);
    const line = () => page.locator(".bg-green-500").count();
    ok(await line() === 1, "the green line moves while the camera reads");
    const field = page.locator('input[aria-label="Type the barcode"]');
    await field.click(); await field.type("42603", { delay: 30 }); await page.waitForTimeout(300);
    ok(await line() === 0, "typing: the green line stops");
    ok(await page.getByText("PAUSED WHILE YOU TYPE THE CODE").count() === 1, "typing: it says the camera is paused");
    await field.fill(""); await page.locator("body").click({ position: { x: 5, y: 5 } }).catch(() => {}); await field.blur(); await page.waitForTimeout(300);
    ok(await line() === 1, "the field left empty: the camera reads again");
    await field.fill("4260345270123"); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Use the code only" }).click(); await page.waitForTimeout(1200);
    await page.getByLabel(/I checked the values/).check();
    await page.getByRole("button", { name: /Confirm & save food/ }).click(); await page.waitForTimeout(600);
    ok(await page.locator(".foodcard-head b").filter({ hasText: "Test Bar" }).count() === 1, "the new food's card opens");
    ok(await page.getByRole("button", { name: /Add a photo/ }).count() === 1, "its card offers Add a photo");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
