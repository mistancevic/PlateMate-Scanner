// Chat and cooking are separate: Chat has its own tab, the Mealan tab always shows the plate.
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
  await page.goto("http://127.0.0.1:3122/"); await page.waitForTimeout(700);
  const nav = async (t) => { await page.locator("nav button").filter({ hasText: t }).first().click(); await page.waitForTimeout(300); };
  const click = async (t) => { await page.getByRole("button", { name: t }).first().click({ timeout: 4000 }); await page.waitForTimeout(300); };
  const h2 = async () => (await page.locator("h2").first().textContent()).trim();
  const expect = (label, got, want) => { const ok = got === want; console.log(ok ? "ok  " : "FAIL", label, "->", got); if (!ok) process.exitCode = 1; };
  await click(/Chat with Mealan/i); expect("Today, Chat with Mealan", await h2(), "Chat with Mealan");
  await nav("Today"); await click(/I'm craving something/i); expect("Today, I'm craving something", await h2(), "What are you craving?");
  await page.locator(".chat-fab").click(); await page.waitForTimeout(300); expect("floating chat button", await h2(), "Chat with Mealan");
  expect("no chat button while in the chat", String(await page.locator(".chat-fab").count()), "0");
  await nav("Mealan"); expect("Mealan tab after chat", await h2(), "What are you craving?");
  expect("no Chat button on the plate", String(await page.locator("main").getByRole("button", { name: /^Chat$/ }).count()), "0");
  expect("chat button floats over the plate", String(await page.locator(".chat-fab").count()), "1");
  expect("bottom bar has four tabs", String(await page.locator("nav button").count()), "4");
  if (errs.length) { console.log("page errors:", errs); process.exitCode = 1; }
  await b.close(); server.kill();
})();
