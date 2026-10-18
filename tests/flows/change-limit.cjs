// JOURNEY INVARIANT (Milan, 18 October 2026, 12:03 to 12:28, story R10 on canvas board RS6): Change the recipe has a limit.
// After 20 seconds the slow line shows with Stop; Stop ends it, the plate stays as it was, and the app says Stopped. Nothing
// changed. At one minute in all it ends by itself and says Chef Mealan took too long. A refresh never leaves it running.
// Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const it = (name, written, grams, role, calories, protein, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, optional: false, part });
const fritters = { url: "https://sallysbakingaddiction.com/homemade-apple-fritters/", recipe: { title: "Homemade apple fritters", source: "Sally's Baking Addiction", servings: 12, servingsUnit: "fritters", servingsHow: "recipe", stated: null, steps: ["Make the dough.", "Fry.", "Glaze."], items: [
  it("Whole milk", "1 cup (240g)", 240, "dairy", 61, 3.2, "Dough"), it("Unsalted butter", "6 Tablespoons (85g)", 85, "fat", 717, 0.9, "Dough"), it("All-purpose flour", "4 1/2 cups (563g)", 563, "base", 364, 10, "Dough"),
  it("Confectioners' sugar", "3 cups (360g)", 360, "sweet", 389, 0, "Glaze"), it("Milk", "6 Tablespoons (90g)", 90, "dairy", 61, 3.2, "Glaze")] } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3222", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async () => {
    const page = await b.newPage({ viewport: { width: 390, height: 900 } }); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-10-18T12:30:00") });
    await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); } }, seed);
    await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fritters) }));
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    page.fits = 0;
    await page.route("**/api/recipe/fit", () => { page.fits++; /* Chef Mealan never answers */ });
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3222/"); await page.clock.runFor(1500);
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.clock.runFor(500);
    await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.clock.runFor(300);
    await page.getByLabel("Link to a recipe").fill(fritters.url); await page.getByRole("button", { name: /^Read/ }).first().click(); await page.clock.runFor(1500);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.clock.runFor(1500);
    return page;
  };
  const toast = (page) => page.locator(".toast").textContent().catch(() => "");
  try {
    let page = await open();
    const title = await page.locator(".plate-card").textContent();
    await page.locator(".in-ways").getByRole("button", { name: /Change the recipe/ }).click(); await page.clock.runFor(1000);
    ok(/is changing it/.test(await page.locator(".in-ways").textContent()) && (await page.locator(".way-slow").count()) === 0, "Chef Mealan is changing it; no slow line yet");
    await page.clock.runFor(20_000);
    ok((await page.locator(".way-slow").count()) === 1 && /keeps going: up to one minute/.test(await page.locator(".way-slow").textContent()), "after 20 seconds: the slow line");
    ok(await page.locator(".way-slow").getByRole("button", { name: "Stop", exact: true }).count() === 1, "and Stop beside it");
    await page.locator(".way-slow").getByRole("button", { name: "Stop", exact: true }).click(); await page.clock.runFor(500);
    ok(/^Stopped\. Nothing changed\. Try again, or Add on the side\./.test(await toast(page)), "Stop: the app says Stopped. Nothing changed: " + await toast(page));
    ok((await page.locator(".way-slow").count()) === 0 && /Change the recipe/.test(await page.locator(".in-ways").textContent()) && !(await page.locator(".in-ways button").first().isDisabled()), "the two ways are back");
    ok((await page.locator(".plate-card").textContent()) === title, "the plate is as it was");
    // the minute: it ends by itself
    page = await open();
    await page.locator(".in-ways").getByRole("button", { name: /Change the recipe/ }).click(); await page.clock.runFor(59_000);
    ok((await page.locator(".way-slow").count()) === 1, "at 59 seconds it is still working, with the slow line");
    await page.clock.runFor(2_000);
    ok(/took too long, so nothing changed\. Try again, or Add on the side\./.test(await toast(page)), "at one minute it ends by itself and says so: " + await toast(page));
    ok(page.fits === 1, "one request only: no second round without an answer");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 4).join(" / ")); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
