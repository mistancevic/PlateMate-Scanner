// JOURNEY (0.2.124, board Stories95, DT139; Anna's blind runs, her DT118; Milan 28 October 17:05 Go): the first screen. The
// formula is automatic, behind How we calculate ›; sections numbered as they show; five numbers and PD said once; no goal
// picked for you; Lifestyle, one name; a coach can adjust these numbers later; both paces in % a week.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3309", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 } });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1990, heightCm: 170, weightKg: 66, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-28T16:00:00Z", consentBodyAt: "2026-10-28T16:00:00Z", declaredAt: "2026-10-28T16:00:00Z", aiConfirmedAt: "2026-10-28T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.goto(U + "/"); await page.waitForTimeout(1500);
  const main = async () => ((await page.locator(".goal-screen").innerText()) || "").replace(/\s+/g, " ");
  let t = await main();
  ok(/Your day in five numbers/.test(t), "the line says five numbers");
  ok(!/The formula|Mifflin|Katch|Schofield/.test(t) && await page.locator(".how-calc").count() === 1 && /Automatic, from your body and your week/.test(t), "no formula block: How we calculate ›, automatic");
  const steps = (await page.locator(".calc-step, .section-title").allTextContents()).map((s) => s.trim());
  ok(steps.join("|") === "1. You|2. What are you after?", "sections numbered as they show: " + steps.join(" | "));
  ok(await page.locator(".goal-pick.on").count() === 0 && await page.getByRole("button", { name: /^Apply from/ }).count() === 0 && /Pick what you are after, and your numbers appear/.test(t), "nothing picked for you; no numbers, no Apply yet");
  await page.getByRole("button", { name: "Edit" }).first().click(); await page.waitForTimeout(300);
  ok((await page.locator(".calc-part b").allTextContents()).join("|") === "Lifestyle|Your training", "Lifestyle, one name");
  await page.getByRole("button", { name: /^Maintain/ }).first().click(); await page.waitForTimeout(400);
  t = await main();
  const steps2 = (await page.locator(".calc-step, .section-title").allTextContents()).map((s) => s.trim());
  ok(steps2.join("|") === "1. You|2. What are you after?|3. Carbs and fat|4. Your days", "a goal picked: 3. Carbs and fat (DT161), 4. Your days: " + steps2.join(" | "));
  ok(/PD: grams of protein per 100 kcal/.test(t) && await page.getByRole("button", { name: /^Apply from today/ }).count() === 1 && /A coach can adjust these numbers later/.test(t), "PD said once; Apply; the coach line");
  await page.locator(".how-calc").click(); await page.waitForTimeout(300);
  ok(/Mifflin St Jeor/.test(await main()), "How we calculate › opens the formula names");
  await page.getByRole("button", { name: /^Build muscle/ }).first().click(); await page.waitForTimeout(300);
  const pace = ((await page.locator(".pace").innerText()) || "").replace(/\s+/g, " ");
  ok(!/a month/.test(pace) && (pace.match(/% a week/g) || []).length === 2, "both paces in % a week: " + pace.slice(0, 200));
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
