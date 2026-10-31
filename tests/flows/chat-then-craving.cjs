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
  expect("bottom bar has five tabs (DT188: Explorer fifth)", String(await page.locator("nav button").count()), "5");
  await fab(); expect("Mealan from Today is the conversation", await page.locator(".talk-overlay h2").textContent(), "Chef Mealan");
  expect("no floating button while talking", String(await page.locator(".chat-fab").count()), "0");
  await page.locator(".talk-overlay").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(300);
  await nav("Plate");
  expect("the Plate tab opens the plate", String(await page.locator(".plate-card").count()), "1");
  expect("the amounts button is code, not chat", String(await page.getByRole("button", { name: /^(Fit to my target|Make it an? \w+)$/ }).count()), "1");
  await fab(); expect("Mealan on a plate with food is about the plate", (await page.locator(".sheet .card-top span").first().textContent()).trim(), "Chef Mealan, about this plate");
  await page.getByRole("button", { name: /Talk to Chef Mealan/ }).click(); await page.waitForTimeout(300);
  expect("and can hand over to the conversation", await page.locator(".talk-overlay h2").textContent(), "Chef Mealan");
  // Changed by story DT153 (0.2.132, board Stories105): from the Plate the chat's head says Back to the plate
  await page.locator(".talk-overlay .chat-head").getByRole("button", { name: "Back to the plate" }).click(); await page.waitForTimeout(300);
  await require("./foods.cjs")(page); await nav("Plate"); expect("Plate tab after talking", String(await page.locator(".plate-card").count()), "1");
  if (errs.length) { console.log("page errors:", errs); process.exitCode = 1; }
  await b.close(); server.kill();
})();
