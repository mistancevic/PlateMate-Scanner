// DT276 step 1 (0.3.127, board Stories205; Coach Milan 10 November 21:24 to 22:37, Go): a step has one picture and every place
// shows it. The recipe keeps the picture; the recipe page, cook mode and Make's tick list all show that one. A step without
// a picture still says + Photo.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const PORT = "3497", U = `http://127.0.0.1:${PORT}`;
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg")).toString("base64");
const F = (re) => seed.foods.find((f) => re.test(f.name));
const STEPS = ["Stir the skyr smooth.", "Add the oats.", "Serve."];
seed.meals = [{ id: "m-b", title: "Skyr bowl", items: [{ id: "b1", food: F(/^Skyr/), grams: 250, locked: false }, { id: "b2", food: F(/^Oats/), grams: 40, locked: false }], portion: 290, steps: STEPS, savedAt: "2026-11-07T22:58:00Z", stepPics: [PHOTO, null, null], stepPicMeta: [{ by: "me", step: STEPS[0] }, null, null] }];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + "/my-recipes/m-b"); await page.waitForTimeout(1500);
    ok(await page.locator(".rq-steps img").count() === 1, "the recipe page shows step 1's picture");
    await page.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(1300);
    const cm = page.locator(".cook-mode"); await cm.waitFor({ timeout: 8000 });
    for (const n of ["Buttons only", "Step 1 ›"]) { const x = cm.getByRole("button", { name: n, exact: true }); if (await x.count()) { await x.click(); await page.waitForTimeout(300); } }
    const inCook = await cm.locator("img").first().getAttribute("src").catch(() => null);
    ok(!!inCook, "cook mode shows step 1's picture");
    await cm.getByRole("button", { name: /Close/ }).click(); await page.waitForTimeout(600);
    const rows = page.locator(".mk-row");
    ok(await rows.count() === 3, "Make lists the three steps");
    const inMake = await rows.nth(0).locator(".mk-photo img").getAttribute("src").catch(() => null);
    ok(!!inMake && inMake === inCook, "Make's tick list shows the same picture on step 1");
    ok(!(await rows.nth(0).locator(".mk-photo").getAttribute("class")).includes("empty") && /Change/.test(await rows.nth(0).locator(".mk-photo").getAttribute("aria-label")), "step 1's button is a picture, named Change");
    ok(await rows.nth(1).locator(".mk-photo.empty").count() === 1 && await rows.nth(2).locator(".mk-photo.empty").count() === 1 && await page.locator(".mk-photo img").count() === 1, "steps 2 and 3 have no picture and say + Photo");
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
