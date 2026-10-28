// JOURNEY (0.2.127, board Stories98, DT142; Anna's DT123; Milan 28 October 20:46 Go): the first setup ends on one more step,
// 4. Where you shop and cook: home in one tap brings its starter foods, with See them in Foods; the kitchens and what you
// cook with, as in Me; Done: to Today, which says Pick home first until home is picked. Changing the goal later skips it.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.foods = [];
const PORT = "3314", U = `http://127.0.0.1:${PORT}`;
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
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  await page.goto(U + "/"); await page.waitForTimeout(1300);
  await page.getByRole("button", { name: /^Maintain/ }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Apply from today/ }).click(); await page.waitForTimeout(700);
  const step = page.locator(".shop-step");
  ok(await step.count() === 1 && (await step.locator(".calc-step").textContent()).trim() === "4. Where you shop and cook", "after Apply on the first setup: 4. Where you shop and cook");
  const done = step.getByRole("button", { name: /^(Done: to Today|Pick home first)$/ });
  ok(await done.isDisabled() && (await done.textContent()) === "Pick home first", "the step ends on its button: Pick home first, until home is picked");
  ok(await step.getByRole("group", { name: "The kitchens you cook" }).count() === 1 && await step.getByRole("group", { name: "What you cook with" }).count() === 1, "the kitchens and what you cook with, as in Me");
  await step.getByRole("group", { name: "Where do you live and shop?" }).getByRole("button", { name: "Limassol", exact: true }).click(); await page.waitForTimeout(600);
  const foods = (await st()).foods;
  ok(foods.length >= 50 && foods.some((f) => f.name === "Halloumi") && await page.evaluate(() => localStorage.getItem("chefmealan-region")) === "limassol", `one tap: home is Limassol, its starter foods came (${foods.length})`);
  const line = ((await step.locator(".starter-line").innerText()) || "").replace(/\s+/g, " ");
  ok(new RegExp(`^${foods.length} foods for Limassol`).test(line) && /See them in Foods ›/.test(line), "the line says how many, with See them in Foods: " + line);
  await step.getByRole("group", { name: "The kitchens you cook" }).getByRole("button", { name: "Greek" }).click(); await page.waitForTimeout(200);
  ok((await done.textContent()) === "Done: to Today" && await done.isEnabled(), "home picked: Done: to Today");
  await done.click(); await page.waitForTimeout(800);
  ok(await page.locator(".shop-step").count() === 0 && /Today/.test((await page.locator("header h1").textContent()) || ""), "Done: setup ends on Today");
  ok((JSON.parse(await page.evaluate(() => localStorage.getItem("chefmealan-personal"))).kitchens || []).includes("Greek"), "the kitchen picked is kept");
  // changing the goal later never shows the step again
  await page.goto(U + "/me/goal"); await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /Change the goal/ }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Apply from today/ }).click(); await page.waitForTimeout(700);
  ok(await page.locator(".shop-step").count() === 0, "changing the goal later: no step 4");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
