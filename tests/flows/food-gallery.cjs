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
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3185/"); await page.waitForTimeout(800);
  await require("./foods.cjs")(page);
  await page.locator(".name-link, .row-text b").filter({ hasText: "Skyr" }).first().click(); await page.waitForTimeout(400);
  // since 0.1.86 the card has Take a photo (phones) and Choose a photo, in their own row under the photos (0.1.88, canvas C6); the photos here go in through Choose
  console.log("add button:", await page.locator(".g-add").last().textContent());
  // Changed with Milan, 8 October 2026 (board C9): a drawn picture is not a photo, so the first real photo added becomes
  // the food's picture and its main photo; Upload a photo is the second button; with no photo, one line asks for the front.
  const okc = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) process.exitCode = 1; };
  okc(/Start with the front/.test(await page.locator(".sheet").textContent()), "no photo yet: one line asks for the front");
  await page.locator('.photo-add input[type=file]:not([capture])').setInputFiles(require("node:path").resolve(__dirname, "front.jpg")); await page.waitForTimeout(900);
  okc(await page.evaluate(() => { const f = JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.find((x) => /Skyr/.test(x.name)); return Boolean(f && f.photo && !f.photo.startsWith("data:image/svg")); }) || await page.locator(".foodcard-head img").evaluate((i) => !i.src.startsWith("data:image/svg")), "the first real photo replaces the drawn picture");
  await page.locator('.photo-add input[type=file]:not([capture])').setInputFiles(require("node:path").resolve(__dirname, "front.jpg")); await page.waitForTimeout(900);
  await page.locator('.photo-add input[type=file]:not([capture])').setInputFiles(require("node:path").resolve(__dirname, "plate.jpg")); await page.waitForTimeout(900);
  const n = await page.locator(".g-thumb").count(); console.log(n === 3 ? "ok   three added photos, no drawn picture among them" : "FAIL gallery has " + n); if (n !== 3) process.exitCode = 1;
  okc(await page.locator(".g-thumb").first().locator(".g-main").count() === 1, "the main photo comes first, with a star");
  // Make it the main photo
  await page.locator(".g-thumb").nth(2).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Make it the main photo/ }).click(); await page.waitForTimeout(600);
  okc(/1 of 3/.test(await page.locator(".photo-count").textContent()) && /The main photo/.test(await page.locator(".photo-view").textContent()), "Make it the main photo: it moves to the front and says so");
  okc(await page.evaluate(() => { const f = JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.find((x) => /Skyr/.test(x.name)); return (f.photos ? f.photos.length : f.photoCount) === 3; }) && (await page.locator(".photo-strip button").count()) === 3, "still three photos");
  await page.getByRole("button", { name: "Close the photo" }).click(); await page.waitForTimeout(300);
  await page.locator(".g-thumb").first().click(); await page.waitForTimeout(300);
  console.log("full view open:", await page.locator(".photo-view").count());
  // JOURNEY INVARIANT (Milan, 5 October 2026): one tap never removes a photo. Remove sits top left, away from closing;
  // the first tap arms it, the second removes, and Undo brings it back for eight seconds.
  const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) process.exitCode = 1; };
  ok(await page.getByRole("button", { name: "Close the photo" }).count() === 1, "close is its own button, top right");
  await page.locator(".photo-remove").click(); await page.waitForTimeout(200);
  ok(await page.locator(".photo-view").count() === 1 && /Tap again to remove/.test(await page.locator(".photo-remove").textContent()), "one tap only arms Remove; the photo stays");
  await page.locator(".photo-remove").click(); await page.waitForTimeout(300);
  ok((await page.locator(".g-thumb").count()) === 2 && /Photo removed/.test(await page.locator(".undo-note").textContent()), "the second tap hides it, with Undo");
  await page.locator(".undo-note").getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(300);
  ok((await page.locator(".g-thumb").count()) === 3, "Undo brings it back");
  await page.locator(".g-thumb").first().click(); await page.waitForTimeout(300);
  await page.locator(".photo-remove").click(); await page.locator(".photo-remove").click(); await page.waitForTimeout(8600);
  const stored = await page.evaluate(() => { const f = JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.find((x) => /Skyr/.test(x.name)); return f ? (f.photos ? f.photos.length : typeof f.photoCount === "number" ? f.photoCount : [f.photo].length) : 0; }); // since 7 October 2026 the saved data counts photos, the photo store holds them
  ok((await page.locator(".g-thumb").count()) === 2 && stored === 2, "after the note goes, the photo is removed for real: " + (await page.locator(".g-thumb").count()) + " shown, " + stored + " stored");
  
  
  console.log(errs.length ? "errors: " + errs : "no page errors");
  await b.close(); server.kill();
})();
