// JOURNEY INVARIANT (Milan, 7 October 2026, canvas boards C4 and C5): in a food's photos you move to the next one without
// closing: the arrows, a photo below, or the arrow keys, and it says 2 of 3; tapping the photo doesn't close it. Back
// closes only what is on top: the photo, then the card, then the tab you came from; the address follows the tab, so a
// reload opens on the same tab. A food added today is marked New on the list. With one photo, tapping it closes it; Add a
// photo lets you take one or choose one from the phone (Milan, 7 and 8 October 2026): Take a photo and Choose a photo on a
// phone, where Android's photo picker has no camera; on a computer, one Add a photo. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const jpg = "data:image/jpeg;base64," + fs.readFileSync(path.resolve(__dirname, "front.jpg")).toString("base64");
seed.items = [];
seed.foods = seed.foods.map((f) => /Skyr/.test(f.name) ? { ...f, photos: [jpg, jpg, jpg], addedAt: new Date().toISOString() } : f);
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3194", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); sessionStorage.setItem("seeded", "1"); } localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
  const back = async () => { await page.evaluate(() => history.back()); await page.waitForTimeout(400); };
  const count = () => page.locator(".photo-count").textContent();
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3194/"); await page.waitForTimeout(900);
    ok(new URL(page.url()).pathname === "/today", "the app opens at /today: " + page.url());
    await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(400);
    ok(new URL(page.url()).pathname === "/foods", "Foods has its own address: " + page.url());
    const skyr = page.locator(".row-text").filter({ hasText: "Skyr" }).first();
    ok(await skyr.locator(".new-mark").count() === 1, "a food added today is marked New");
    ok(await page.locator(".row-text").filter({ hasText: "Nutella" }).first().locator(".new-mark").count() === 0, "an older food is not");
    await skyr.locator(".name-link").click(); await page.waitForTimeout(400);
    ok(await page.locator('.food-gallery input[type=file][capture]').count() === 1 && await page.locator('.food-gallery input[type=file]:not([capture])').count() === 1, "a photo can be taken with the camera, or chosen from the phone's photos");
    await page.locator(".g-thumb").first().click(); await page.waitForTimeout(300);
    ok((await count()) === "1 of 3", "the photo says 1 of 3");
    await page.getByRole("button", { name: "Next photo" }).click(); await page.waitForTimeout(200);
    ok((await count()) === "2 of 3", "Next: 2 of 3");
    await page.keyboard.press("ArrowRight"); await page.waitForTimeout(200);
    ok((await count()) === "3 of 3", "the arrow key: 3 of 3");
    await page.getByRole("button", { name: "Show photo 1" }).click(); await page.waitForTimeout(200);
    ok((await count()) === "1 of 3", "a photo below: 1 of 3");
    await page.locator(".photo-view > img").click(); await page.waitForTimeout(200);
    ok(await page.locator(".photo-view").count() === 1, "tapping the photo doesn't close it");
    await back();
    ok(await page.locator(".photo-view").count() === 0 && await page.locator(".foodcard-head").count() === 1, "Back closes the photo; the card stays");
    await back();
    ok(await page.locator(".foodcard-head").count() === 0 && new URL(page.url()).pathname === "/foods", "Back closes the card; the Foods list stays");
    await back();
    ok(new URL(page.url()).pathname === "/today", "Back goes to the tab you came from: " + page.url());
    await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(300);
    // one photo: tapping it closes it
    await page.locator(".row-text").filter({ hasText: "Nutella" }).first().locator(".name-link").click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: "See the photo" }).click(); await page.waitForTimeout(300);
    ok(/Tap the photo to close/.test(await page.locator(".photo-view").textContent()), "one photo: it says tap the photo to close");
    await page.locator(".photo-view > img").click(); await page.waitForTimeout(300);
    ok(await page.locator(".photo-view").count() === 0 && await page.locator(".foodcard-head").count() === 1, "one photo: tapping it closes it, the card stays");
    await page.locator(".sheet .card-top").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(600);
    // closed in the app, the card takes its own step back: the next Back goes to Today, not to a card that's gone
    await page.locator(".row-text").filter({ hasText: "Skyr" }).first().locator(".name-link").click(); await page.waitForTimeout(300);
    await page.locator(".sheet .card-top").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(600);
    await back();
    ok(new URL(page.url()).pathname === "/today", "after Close, Back goes to the tab you came from: " + page.url());
    await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(300);
    await page.reload(); await page.waitForTimeout(1200);
    ok(new URL(page.url()).pathname === "/foods" && await page.getByText("Find a food").count() === 1, "a reload opens on the same tab");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
