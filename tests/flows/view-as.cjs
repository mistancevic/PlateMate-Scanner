// DT232 (0.3.72, board Stories171; Coach Milan 3 November 15:56 to 16:32, Go): View the app as Me, Coach or User, first in Dev
// data, for the owner. Only what this phone shows changes; the header says As User · Back to me and leads back from any page.
// Runs on the local server, which names this phone the owner (no owner list), with the coach demo for Clients.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.feedback = [];
const PORT = "3396", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript((s) => {
      if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-coach-demo", "1");
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    }, seed);
    await require("./adult.cjs")(page);
    await page.goto(U + "/today"); await page.waitForTimeout(1200);
    const menu = async () => { if (!(await page.locator(".menu-list").count())) { await page.locator("header .menu-button").click(); await page.waitForTimeout(500); } };
    const row = (t) => page.locator(".menu-row").filter({ hasText: t });
    const navHas = async (t) => (await page.locator("nav button").filter({ hasText: t }).count()) > 0;
    await menu();
    ok(await row("Metrics").count() === 1 && await navHas("Clients"), "as Me: Metrics in the Menu, Clients in the bar");
    await row("Settings").first().click(); await page.waitForTimeout(400);
    await row("Dev data").first().click(); await page.waitForTimeout(400);
    const box = page.locator('section[aria-label="View the app as"]');
    ok(await box.count() === 1 && await box.locator(".choice.on").textContent() === "Me", "Dev data starts with View the app as, Me on");
    // ---- User ----
    await box.getByRole("button", { name: "User" }).click(); await page.waitForTimeout(500);
    ok(/^As User · Back to me$/.test((await page.locator("header .view-as").textContent()).trim()), "the header says As User · Back to me");
    ok(!(await navHas("Clients")), "as User: no Clients in the bar");
    await page.locator("header .menu-button").click(); await page.waitForTimeout(300);
    await menu();
    ok(await row("Metrics").count() === 0 && await row("Running costs").count() === 0 && await row("Share Chef Mealan").count() === 0 && await row("Admin").count() === 0, "as User: no Metrics, Running costs, Share or Admin");
    await row("Settings").first().click(); await page.waitForTimeout(400);
    ok(await row("Dev data").count() === 0, "as User: no Dev data in Settings");
    await page.reload(); await page.waitForTimeout(1000);
    ok(await page.locator("header .view-as").count() === 1, "the view stays on this phone after a reload");
    // ---- back to Me, from the header ----
    await page.locator("header .view-as").click(); await page.waitForTimeout(500);
    ok(await page.locator("header .view-as").count() === 0 && await navHas("Clients"), "Back to me: the header is as before, Clients is back");
    await menu();
    ok(await row("Metrics").count() === 1, "and Metrics is back");
    // ---- Coach ----
    await row("Settings").first().click(); await page.waitForTimeout(400);
    await row("Dev data").first().click(); await page.waitForTimeout(400);
    await page.locator('section[aria-label="View the app as"]').getByRole("button", { name: "Coach" }).click(); await page.waitForTimeout(500);
    ok(/^As Coach · Back to me$/.test((await page.locator("header .view-as").textContent()).trim()) && await navHas("Clients"), "as Coach: Clients stays; the header says As Coach");
    await page.locator("header .menu-button").click(); await page.waitForTimeout(300); await menu();
    ok(await row("Metrics").count() === 0 && await row("Admin").count() === 0, "as Coach: no owner pages, no Admin");
    const st = await page.evaluate(() => localStorage.getItem("chefmealan-view-as"));
    ok(st === "coach", "kept on this phone only: " + st);
    await ctx.close();
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.slice(0, 2).join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all passed"); process.exit(fail ? 1 : 0);
})();
