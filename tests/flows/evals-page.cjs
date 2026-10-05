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
  await page.goto("http://127.0.0.1:3124/"); await page.waitForTimeout(700);
  const expect = (label, ok, got) => { console.log(ok ? "ok  " : "FAIL", label, got !== undefined ? "-> " + JSON.stringify(got) : ""); if (!ok) process.exitCode = 1; };
  await page.getByRole("button", { name: "Menu" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Evals/ }).click(); await page.waitForTimeout(300);
  expect("50 scenarios listed, ten of them Pro tips", (await page.locator(".eval-case").count()) === 50, await page.locator(".eval-case").count());
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
