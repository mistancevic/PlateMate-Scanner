// Help inside the plate: "Don't have it" offers swaps from your foods; one tap changes exactly one food; closing changes nothing.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3123", GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => { server.stdout.on("data", (d) => { if (String(d).includes("ready")) r(); }); setTimeout(r, 6000); });
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: new Date().toISOString(), source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3123/"); await page.waitForTimeout(700);
  const plate = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.map((i) => i.food.name));
  const expect = (label, ok, got) => { console.log(ok ? "ok  " : "FAIL", label, got !== undefined ? "-> " + JSON.stringify(got) : ""); if (!ok) process.exitCode = 1; };
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(400);
  const before = await plate();
  await page.locator(".chat-fab").click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Close$/ }).last().click(); await page.waitForTimeout(300);
  expect("open and close the helper leaves the plate as it was", JSON.stringify(await plate()) === JSON.stringify(before), await plate());
  const target = before.find((n) => /skyr/i.test(n)) || before[1];
  await page.locator(".name-link", { hasText: target }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Don't have it/i }).click(); await page.waitForTimeout(600);
  const offered = await page.locator(".suggestion b").allTextContents();
  expect("swaps from your foods are offered", offered.length > 0, offered.slice(0, 3));
  expect("the missing food is not offered", !offered.some((o) => o.toLowerCase().includes(target.toLowerCase().split(/[\s,(]+/)[0])));
  await page.locator(".suggestion").first().getByRole("button").click(); await page.waitForTimeout(400);
  const after = await plate();
  const changed = before.filter((n, k) => after[k] !== n).length;
  expect("exactly one food changed", changed === 1 && after.length === before.length, after);
  if (errs.length) { console.log("page errors:", errs); process.exitCode = 1; }
  await b.close(); server.kill();
})();
