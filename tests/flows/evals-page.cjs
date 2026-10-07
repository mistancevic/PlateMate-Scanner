// The evals page: open it from the menu, run the code scenarios, see output and checks, label one.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3124", GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => { server.stdout.on("data", (d) => { if (String(d).includes("ready")) r(); }); setTimeout(r, 6000); });
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: new Date().toISOString(), source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3124/"); await page.waitForTimeout(700);
  const expect = (label, ok, got) => { console.log(ok ? "ok  " : "FAIL", label, got !== undefined ? "-> " + JSON.stringify(got) : ""); if (!ok) process.exitCode = 1; };
  await page.getByRole("button", { name: "Menu" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Evals/ }).click(); await page.waitForTimeout(300);
  // ten Numbers cases joined on 7 October 2026: 60 in all
  expect("60 scenarios listed: ten numbers, ten Pro tips", (await page.locator(".eval-case").count()) === 60, await page.locator(".eval-case").count());
  // Numbers: the ten people, every check, the coach's label and own numbers
  await page.getByRole("button", { name: /^numbers$/ }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /Run 10/ }).click(); await page.waitForTimeout(600);
  const nst = await page.locator(".eval-status").allTextContents();
  expect("all ten numbers cases pass their checks", nst.length === 10 && nst.every((s) => s.includes("checks pass")), nst.slice(0, 3));
  await page.locator(".eval-head").first().click(); await page.waitForTimeout(200);
  const nbody = await page.locator(".eval-body").first().textContent();
  expect("a numbers case shows what to look for, the numbers and the days", /Look for/.test(nbody) && /kcal on average/.test(nbody) && /Mon/.test(nbody), nbody.slice(0, 120));
  await page.getByLabel("N01, your kcal").fill("2900"); await page.getByRole("button", { name: /^Pass$/ }).click(); await page.waitForTimeout(200);
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-evals") || "{}").N01);
  expect("the coach's label and number are kept", kept && kept.label === "pass" && kept.coachKcal === 2900, kept && { label: kept.label, kcal: kept.coachKcal });
  await page.getByRole("button", { name: /^all$/ }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /^code$/ }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /Run 10/ }).click(); await page.waitForTimeout(800);
  const statuses = await page.locator(".eval-status").allTextContents();
  expect("all ten code scenarios pass their checks", statuses.every((s) => s.includes("checks pass")), statuses.slice(0, 3));
  await page.locator(".eval-head").first().click(); await page.waitForTimeout(200);
  const out = await page.locator(".eval-list li").allTextContents();
  expect("output visible", out.length > 0, out);
  await page.getByRole("button", { name: /^Pass$/ }).click(); await page.waitForTimeout(200);
  expect("label saved", (await page.locator(".eval-status").first().textContent()).includes("you: pass"));
  const shot = path.resolve(__dirname, "../screenshots"); fs.mkdirSync(shot, { recursive: true }); await page.screenshot({ path: path.join(shot, "evals-page.png"), fullPage: true });
  if (errs.length) { console.log("page errors:", errs); process.exitCode = 1; }
  await b.close(); server.kill();
})();
