// 0.2.7+r2 (Milan, 15 October 2026): the floating Chef Mealan on a menu page opens the conversation over it, and closing
// it comes back to the page; Fit to my target on a plate already above the target says nothing moved, and the PD stands.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const ch = seed.foods.find((f) => /Chicken breast/.test(f.name)), co = seed.foods.find((f) => /Cottage/.test(f.name));
seed.items = [{ id: "a", food: ch, grams: 200, locked: false }, { id: "b", food: co, grams: 150, locked: false }];
const U = "http://127.0.0.1:3202";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3202", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 1 });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { meals: 3 } }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  // the floating Chef Mealan on a menu page
  await page.goto(U + "/me/goal"); await page.waitForTimeout(1300);
  ok(await page.locator(".chat-fab").isVisible(), "the floating Chef Mealan shows on a menu page");
  await page.locator(".chat-fab").click(); await page.waitForTimeout(700);
  ok(await page.locator(".talk-overlay").isVisible(), "a tap opens the conversation over the page");
  ok(!(await page.locator(".menu-title").isVisible()), "the menu page waits underneath");
  await page.goBack(); await page.waitForTimeout(700);
  ok(await page.locator(".talk-overlay").count() === 0 && /Goal/.test(await page.locator(".menu-title").textContent()), "Back closes the conversation and the Goal page is there again");
  ok(await page.locator(".chat-fab").isVisible(), "and the floating Chef Mealan with it");
  // Fit on a plate already above the target
  await page.goto(U + "/plate"); await page.waitForTimeout(1300);
  const before = (await page.locator(".readout").first().textContent()).replace(/\s+/g, " ");
  ok(/PD16\.8/.test(before.replace(/ /g, "")), "as it stands: PD 16.8 (" + before + ")");
  await page.getByRole("button", { name: /^(Fit to my target|Make it an? \w+)$/ }).click(); await page.waitForTimeout(1200);
  const after = (await page.locator("main").textContent()).replace(/\s+/g, " ");
  ok(/Already above your target: PD 16\.8 against [\d.]+, so nothing moved/.test(after) && !/moves the Chicken breast/.test(after), "Fit: already above the target, nothing moved, and it says so");
  ok(/As it stands ?PD ?16\.8/.test(after) && /477 kcal/.test(after), "the PD and the kcal stand (in place, 0.2.88)");
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
