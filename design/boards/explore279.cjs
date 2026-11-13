const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const ROOT = "/home/claude/pm284v5", PORT = "3487", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = []; seed.meals = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
  await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
  await require(ROOT + "/tests/flows/adult.cjs")(p);
  await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1500);
  await p.locator(".bottom-nav button").filter({ hasText: "Clients" }).click(); await p.waitForTimeout(1000);
  await p.screenshot({ path: "rs/x279.png", fullPage: true });
  console.log(await p.evaluate(() => [...document.querySelectorAll("main > *, main section, main .label")].map((e) => e.className + ": " + (e.innerText || "").slice(0, 50).replace(/\n/g, " ")).slice(0, 40).join("\n")));
  console.log(await p.evaluate(() => document.documentElement.scrollHeight));
  await b.close(); server.kill();
})();
