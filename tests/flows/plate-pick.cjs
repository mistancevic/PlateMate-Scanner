// JOURNEY (0.2.121, Tester 2, Milan 28 October 15:30): at 21:30 the Plate picks dinner by the clock. Breakfast picked for the
// plate stays breakfast: after a reload, after a trip to Plan and back; the checks speak of breakfast. Empty plate: the clock again.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.meals = []; seed.feedback = [];
const F2 = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, table: undefined, icon: undefined, places: [] });
const SK = F2("skyr2", "Skyr, natural", 63, 11, 0.2, 4), OA = F2("oats2", "Oats", 372, 13, 7, 59);
seed.foods = [...seed.foods, SK, OA]; seed.items = [{ id: "i0", food: SK, grams: 250, locked: false }, { id: "i1", food: OA, grams: 50, locked: false }]; seed.title = "Skyr with oats";
const PORT = "3303", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.install({ time: new Date("2026-10-27T21:30:00") });
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 64, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3, window: { from: "07:00", to: "22:00" } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Skyr with oats.", around: "", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const readout = async () => ((await page.locator(".readout").first().textContent().catch(() => "")) || "").replace(/\s+/g, " ");
  await page.goto(U + "/plate"); await page.clock.resume(); await page.waitForTimeout(1500);
  ok(/^Dinner/.test(await readout()), "21:30: the plate is dinner by the clock: " + (await readout()).slice(0, 30));
  await page.getByRole("button", { name: "Change what this plate is" }).click(); await page.waitForTimeout(200);
  await page.locator(".for-row").getByRole("button", { name: "Breakfast" }).click(); await page.waitForTimeout(300);
  ok(/^Breakfast/.test(await readout()), "picked: breakfast");
  await page.reload(); await page.waitForTimeout(1500);
  ok(/^Breakfast/.test(await readout()), "after a reload: still breakfast: " + (await readout()).slice(0, 30));
  await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(800);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(1000);
  ok(/^Breakfast/.test(await readout()), "after Plan and back: still breakfast");
  ok(!/dinner/i.test((await page.locator("main").textContent()) || ""), "nothing on the Plate speaks of dinner");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
