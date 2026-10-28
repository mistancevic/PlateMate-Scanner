// JOURNEY (0.2.119, Tester 2's session, Milan 28 October 14:59): the goal screen never ends without a way out. My own numbers,
// each day its own, with nothing typed: the table showed numbers and Apply stayed grey; now the rows shown are applied. A
// missing number says what is missing. Calculate for me without height says so. Reset clears all four numbers and your days.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.goals = { ...seed.goals, calories: 2100, protein: 140, fats: 70, carbs: 230 };
const PORT = "3299", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 64, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const ls = (k) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), k);
  await page.goto(U + "/me/goal"); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Change the goal/ }).click(); await page.waitForTimeout(400);
  ok(await page.getByRole("button", { name: "My own numbers" }).getAttribute("class").then((c) => /on/.test(c)), "own numbers is the way in, each day its own");
  const apply = page.getByRole("button", { name: /^Apply from today/ });
  ok(await apply.isEnabled(), "each day its own, nothing typed: the calculated rows can be applied");
  await apply.click(); await page.waitForTimeout(800);
  const per = await ls("chefmealan-personal");
  ok(per.ownDays && Object.keys(per.ownDays).length >= 4 && (await ls("chefmealan-goal")).source === "exact", "the rows shown are saved as your own days");
  await page.goto(U + "/me/goal"); await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /Change the goal/ }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Every day the same" }).click(); await page.waitForTimeout(300);
  await page.locator("#own-kcal").fill(""); await page.waitForTimeout(200);
  ok(!(await page.getByRole("button", { name: /^Apply from today/ }).isEnabled()) && /Type kcal and protein above to apply/.test(await page.locator(".goal-missing").first().textContent()), "a missing number says what is missing");
  await page.getByRole("button", { name: "Calculate for me" }).click(); await page.waitForTimeout(300);
  ok(await page.getByRole("button", { name: /^Apply from today/ }).isEnabled(), "Calculate for me with a full profile: Apply is there");
  await page.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(500);
  // Reset
  await page.goto(U + "/me/goal"); await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /Reset/ }).click(); await page.waitForTimeout(150);
  await page.getByRole("button", { name: /Tap again to reset/ }).click(); await page.waitForTimeout(600);
  const g = (await ls("platemate-pilot-v1")).goals, p2 = await ls("chefmealan-personal");
  ok(g.calories === null && g.protein === null && g.fats === null && g.carbs === null, "Reset clears all four numbers: " + JSON.stringify(g));
  ok(!p2.ownDays && (await ls("chefmealan-goal")) === null, "Reset clears your own days and the goal");
  ok(await page.locator("#own-kcal").count() === 0 && await page.getByRole("button", { name: /^Apply from today/ }).count() === 1, "after Reset the goal screen opens on Calculate for me, with Apply");
  // Calculate for me without a height
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem("chefmealan-personal")); delete p.heightCm; localStorage.setItem("chefmealan-personal", JSON.stringify(p)); });
  await page.reload(); await page.waitForTimeout(1200);
  const miss = (await page.locator(".goal-missing").first().textContent().catch(() => "")) || "";
  ok(/fill in your height above\. Or use My own numbers\./.test(miss), "Calculate for me says what is missing: " + miss);
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
