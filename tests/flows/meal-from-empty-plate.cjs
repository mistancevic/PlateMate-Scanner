
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(require("node:path").resolve(__dirname, "seed.json"), "utf8"));
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: require("node:path").resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3121", GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => { server.stdout.on("data", (d) => { if (String(d).includes("ready")) r(); }); setTimeout(r, 6000); });
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
  await page.addInitScript((s) => {
    if (!localStorage.getItem("seeded")) {
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: new Date().toISOString(), source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, activity: "moderate", dayMode: "follow", pdUnit: "pct" }));
      localStorage.setItem("seeded", "1");
    }
  }, seed);
  await page.goto("http://127.0.0.1:3121/");
  await page.waitForTimeout(800);
  const shot = async (n) => page.screenshot({ path: `/tmp/f2-${n}.png`, fullPage: true });
  const click = async (text) => { await page.getByRole("button", { name: text }).first().click({ timeout: 4000 }); await page.waitForTimeout(400); };
  const step = async (name, fn) => { try { await fn(); console.log("ok  ", name); } catch (e) { console.log("FAIL", name, "->", e.message.split("\n")[0]); await shot("fail-" + name.replace(/\W+/g, "_")); } };
  await step("craving", () => click(/I'm craving something/i));
  await step("add first food", async () => { await page.getByRole("button", { name: /Add/ }).first().click(); await page.waitForTimeout(300); });
  await step("add second food", async () => { await page.getByRole("button", { name: /Add/ }).first().click(); await page.waitForTimeout(300); });
  await shot("1-plate");
  console.log("items in state:", await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.length));
  await step("moment afterwork", () => click(/Afterwork event/i));
  await step("ask", () => click(/Fit it to me/i));
  await shot("2-recipe");
  console.log("recipe h2:", await page.locator("h2").first().textContent());
  await step("make it", () => click(/^Make it$/i));
  await step("pick way", async () => { await page.locator(".way").first().click(); await page.waitForTimeout(200); });
  await step("making", () => click(/I'm making it this way/i));
  await step("rate", () => click(/DaaM good/i));
  await step("save", () => click(/^Save$/i));
  console.log("feedback:", JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).feedback.map((f) => [f.meal.title, f.moment, f.dayType, f.meal.items.length]))));
  console.log(errs.join("\n") || "no page errors");
  await b.close(); server.kill();
})();
