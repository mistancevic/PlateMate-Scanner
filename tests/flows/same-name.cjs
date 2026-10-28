// JOURNEY (0.2.123, DT137 note on Stories94; Milan 28 October 16:39): two recipes with the same name, saved before 0.2.122,
// show the day they were saved, on Recipes and where you pick a meal on Plan. A name used once stays as it is.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const skyr = seed.foods.find((f) => /skyr/i.test(f.name));
const it = (id, grams) => ({ id, food: skyr, grams, locked: false });
seed.items = []; seed.feedback = [];
seed.meals = [{ id: "r1", title: "Skyr breakfast", items: [it("a", 250)], portion: 250, savedAt: "2026-10-26T08:00:00Z" }, { id: "r2", title: "Skyr breakfast", items: [it("b", 300)], portion: 300, savedAt: "2026-10-27T18:10:00Z" }, { id: "r3", title: "Skyr bowl", items: [it("c", 200)], portion: 200, savedAt: "2026-10-20T08:00:00Z" }];
const PORT = "3307", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 } });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.install({ time: new Date(new Date().setHours(6, 30, 0, 0)) });
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 64, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.goto(U + "/plan"); await page.clock.resume(); await page.waitForTimeout(1200);
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(1200);
  const tiles = (await page.locator(".recipe-tile .tile-name").allTextContents()).map((s) => s.trim());
  ok(tiles.includes("Skyr breakfast · 26 October") && tiles.includes("Skyr breakfast · 27 October") && tiles.includes("Skyr bowl"), "Recipes: the two Skyr breakfasts by their day, Skyr bowl as it is: " + tiles.join(" | "));
  await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Breakfast at .*pick a meal/ }).click(); await page.waitForTimeout(400);
  const picks = await page.locator(".pick-sheet .pick-row b").allTextContents();
  ok(picks.includes("Skyr breakfast · 26 October") && picks.includes("Skyr breakfast · 27 October"), "Plan's picker: the same days: " + picks.join(" | "));
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
