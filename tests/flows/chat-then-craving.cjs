// One chef, one door: the floating Mealan is the conversation anywhere, and it's about the plate when there's food on it.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3122", GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => { server.stdout.on("data", (d) => { if (String(d).includes("ready")) r(); }); setTimeout(r, 6000); });
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: new Date().toISOString(), source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3122/"); await page.waitForTimeout(700);
  const nav = async (t) => { await page.locator("nav button").filter({ hasText: t }).first().click(); await page.waitForTimeout(300); };
  const fab = async () => { await page.locator(".chat-fab").click(); await page.waitForTimeout(400); };
  const h2 = async () => (await page.locator("h2").first().textContent()).trim();
  const expect = (label, got, want) => { const ok = got === want; console.log(ok ? "ok  " : "FAIL", label, "->", got); if (!ok) process.exitCode = 1; };
  expect("bottom bar has four tabs", String(await page.locator("nav button").count()), "4");
  await fab(); expect("Mealan from Today is the conversation", await page.locator(".talk-overlay h2").textContent(), "Mealan");
  expect("no floating button while talking", String(await page.locator(".chat-fab").count()), "0");
  await page.locator(".talk-overlay").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /I'm craving something/i }).click(); await page.waitForTimeout(400);
  expect("I'm craving something opens the plate", await h2(), "What are you craving?");
  expect("the amounts button is code, not chat", String(await page.getByRole("button", { name: /Fit to my target/ }).count()), "1");
  await fab(); expect("Mealan on a plate with food is about the plate", (await page.locator(".sheet .card-top span").first().textContent()).trim(), "Mealan, about this plate");
  await page.getByRole("button", { name: /Talk to Mealan/ }).click(); await page.waitForTimeout(300);
  expect("and can hand over to the conversation", await page.locator(".talk-overlay h2").textContent(), "Mealan");
  await page.locator(".talk-overlay").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(300);
  await nav("Foods"); await nav("Plate"); expect("Plate tab after talking", await h2(), "What are you craving?");
  if (errs.length) { console.log("page errors:", errs); process.exitCode = 1; }
  await b.close(); server.kill();
})();
