// JOURNEY INVARIANT (Milan, 8 October 2026, canvas board C8): after a barcode, the database's photos of the pack come with
// its values, each with its own tick (all ticked to start) and a globe; the credit is one short line: Credit: Open Food
// Facts, CC BY-SA. A line the database lacks is read from its nutrition photo and marked read from the photo; the
// database's own values never change. Only the ticked photos stay with the food, with the globe and the credit on its card.
// Photos come only with a barcode lookup. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const jpg = "data:image/jpeg;base64," + fs.readFileSync(path.resolve(__dirname, "front.jpg")).toString("base64");
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3190", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"] })).newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const scans = [];
  await page.route("**/api/product/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ product_name: "PAM protein bar", brand: "PAM", calories: 313, protein: 31.1, fats: 8.9, carbs: 31.1, fiber: 17.1, table: [{ name: "Energy", amount: 313, unit: "kcal" }, { name: "Carbohydrate", amount: 31.1, unit: "g" }, { name: "of which sugars", amount: 3.1, unit: "g", sub: true }, { name: "Protein", amount: 31.1, unit: "g" }], photos: [{ kind: "front", url: "https://images.openfoodfacts.org/images/products/1/front.jpg" }, { kind: "nutrition", url: "https://images.openfoodfacts.org/images/products/1/nutrition.jpg" }], source: "Open Food Facts · 2026-10-08" }) }));
  await page.route("**/api/offphoto**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: jpg }) }));
  await page.route("**/api/scan", (r) => { scans.push(r.request().postDataJSON()); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, calories: 300, protein: 30, table: [{ name: "Kohlenhydrate", amount: 30, unit: "g" }, { name: "davon Zuckeralkohole", amount: 12, unit: "g", sub: true }, { name: "Eiweiß", amount: 30, unit: "g" }] }) }); });
  await page.addInitScript((s) => { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3190/"); await page.waitForTimeout(800);
    await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Add a food" }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: /^Scan$/ }).first().click(); await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /^Barcode$/ }).click(); await page.waitForTimeout(300);
    await page.locator('input[aria-label="Type the barcode"]').fill("4260345270999"); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Use the code only" }).click(); await page.waitForTimeout(1800);
    ok(await page.locator(".db-photo").count() === 2 && await page.locator(".db-photo.on").count() === 2, "the database's two photos, both ticked");
    ok(await page.locator(".db-photo .db-globe").count() === 2, "each with a globe");
    ok(/Credit: Open Food Facts, CC BY-SA/.test(await page.locator(".db-photos").textContent()), "the credit, with the license, in one short line");
    ok(scans.length === 1 && scans[0].images.length === 1, "the nutrition photo is read once");
    const table = await page.locator(".label-table").textContent();
    ok(/sugar alcohols|Zuckeralkohole/i.test(table) && /read from the photo/.test(table), "the line the database lacks comes from the photo, marked: " + table.replace(/\s+/g, " ").slice(0, 200));
    ok(await page.locator('input[aria-label="Carbohydrate"]').inputValue() === "31.1", "the database's own value stays");
    await page.locator(".db-photo").nth(1).click(); await page.waitForTimeout(200);
    ok(await page.locator(".db-photo.on").count() === 1, "a tap leaves one photo out");
    await page.getByLabel(/I checked the values/).check();
    await page.getByRole("button", { name: /Confirm & save food/ }).click(); await page.waitForTimeout(1200);
    const card = page.locator(".sheet");
    ok(await card.locator(".foodcard-head b").filter({ hasText: "PAM protein bar" }).count() === 1, "the card opens");
    ok(/Credit: Open Food Facts, CC BY-SA/.test(await card.textContent()), "the card carries the credit");
    const stored = await page.evaluate(() => { const f = JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.find((x) => x.name === "PAM protein bar"); return f ? { photos: (f.photos ?? []).length || f.photoCount || 0, credits: (f.creditPhotos ?? []).length } : null; });
    ok(stored && stored.credits === 1, "only the ticked photo is kept, with its credit: " + JSON.stringify(stored));
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
