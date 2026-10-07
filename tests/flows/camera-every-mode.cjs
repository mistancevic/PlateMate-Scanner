// JOURNEY INVARIANT: several photos in every mode. The mode decides how a picture is read, never how many can be taken.
// Label: two shots stage, nothing is sent until Analyze 2. Barcode: the code is read, the camera stays open, a photo stages,
// Analyze sends the code plus the photo; Use the code only sends the code alone. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3199", GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ["camera"] });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const calls = []; await page.route("**/api/scan", (route) => { calls.push(route.request().postDataJSON()); route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "no model in the sandbox" }) }); });
  const lookups = []; await page.route("**/api/product/**", (route) => { lookups.push(route.request().url()); route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not in the database" }) }); });
  await page.addInitScript((s) => { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-camera-auto", "manual"); }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3199/"); await page.waitForTimeout(800);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(2500);

  // Label: two shots stage, nothing sent, Analyze 2 sends both as one label scan
  await page.getByRole("button", { name: /LABEL/ }).click(); await page.waitForTimeout(400);
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(600);
  ok(calls.length === 0, "label: the first shot is staged, not sent");
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(600);
  ok(await page.getByLabel("Staged photos").locator("img").count() === 2, "label: two photos in the strip");
  ok(await page.getByRole("button", { name: /Analyze 2 photos/ }).count() === 1, "label: Analyze 2 sits next to the shutter");
  await page.getByRole("button", { name: /Analyze 2 photos/ }).click(); await page.waitForTimeout(800);
  ok(calls.length === 1 && calls[0].images.length === 2 && calls[0].mode === "label", "label: Analyze sends both photos as one label scan");

  // Barcode: the code is read, the camera stays open, a photo stages, Analyze sends the code plus the photo
  await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /BARCODE/ }).click(); await page.waitForTimeout(400);
  await page.locator('input[aria-label^="Type t"]').fill("4260345270123"); await page.keyboard.press("Enter"); await page.waitForTimeout(600);
  ok(await page.locator("#camera-shutter-button").count() === 1, "barcode: the camera stays open after the code is read");
  ok(await page.getByText(/Code read/).count() === 1, "barcode: it says the code was read and asks for the pack's photos");
  ok(lookups.length === 0, "barcode: nothing is looked up until Analyze or Use the code only");
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(600);
  ok(await page.getByLabel("Staged photos").locator("img").count() === 1, "barcode: a photo stages");
  await page.getByRole("button", { name: /Analyze 1 photo/ }).click(); await page.waitForTimeout(1200);
  ok(lookups.length === 1 && /4260345270123/.test(lookups[0]), "barcode: Analyze looks the code up");
  ok(calls.length === 2 && calls[1].images.length === 1 && calls[1].barcode === "4260345270123", "barcode: and sends the photo with the code");

  // Barcode: Use the code only sends the code alone
  await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /BARCODE/ }).click(); await page.waitForTimeout(400);
  await page.locator('input[aria-label^="Type t"]').fill("4260345270123"); await page.keyboard.press("Enter"); await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Use the code only/ }).click(); await page.waitForTimeout(800);
  ok(lookups.length === 2 && calls.length === 2, "barcode: Use the code only looks up without a photo");

  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
