// DT233 (0.3.74, board Stories173; Coach Milan 3 November 17:46 to 18:21, Go): Deploy, last in Dev data, for the owner. Preview,
// Promote and Rollback open their pages on GitHub; each says the version it touches: main from GitHub, the preview and
// chefmealan.com from their own /api/version (here answered by stand-ins). The server's /api/version is checked too.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../package.json"), "utf8"));
seed.feedback = [];
const PORT = "3397", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    const r = await fetch(U + "/api/version"); const j = await r.json();
    ok(j.version === pkg.version && r.headers.get("access-control-allow-origin") === "*", `the server says its version, readable from the other address: ${j.version}`);
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.route("https://raw.githubusercontent.com/**", (rt) => rt.fulfill({ json: { name: "x", version: "9.9.3" } }));
    await page.route("https://preview---chefmealan-eovxlu2pqq-ew.a.run.app/api/version", (rt) => rt.fulfill({ json: { version: "9.9.2" } }));
    await page.route("https://chefmealan.com/api/version", (rt) => rt.fulfill({ json: { version: "9.9.1" } }));
    await page.addInitScript((s) => { if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1"); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
    await require("./adult.cjs")(page);
    await page.goto(U + "/today"); await page.waitForTimeout(1000);
    await page.locator("header .menu-button").click(); await page.waitForTimeout(400);
    await page.locator(".menu-row").filter({ hasText: "Settings" }).first().click(); await page.waitForTimeout(300);
    await page.locator(".menu-row").filter({ hasText: "Dev data" }).first().click(); await page.waitForTimeout(1200);
    const box = page.locator('section[aria-label="Deploy"]');
    ok(await box.count() === 1, "Dev data ends with Deploy");
    const blocks = await page.locator(".dev-block").count();
    ok(await page.locator(".dev-block").nth(blocks - 1).getAttribute("aria-label") === "Deploy", "Deploy is the last block");
    const rows = box.locator("a.deploy-row");
    ok(await rows.count() === 3, "three rows: Preview, Promote, Rollback");
    const hrefs = await rows.evaluateAll((as) => as.map((a) => [a.textContent, a.getAttribute("href"), a.getAttribute("target")]));
    ok(/Preview/.test(hrefs[0][0]) && hrefs[0][1].endsWith("/actions/workflows/preview.yml") && hrefs[0][2] === "_blank", "Preview opens GitHub's Preview page");
    ok(/Promote/.test(hrefs[1][0]) && hrefs[1][1].endsWith("/actions/workflows/promote.yml"), "Promote opens Promote");
    ok(/Rollback/.test(hrefs[2][0]) && hrefs[2][1].endsWith("/actions/workflows/rollback.yml") && await box.locator(".deploy-warn").count() === 1, "Rollback opens Rollback, its line in red");
    const t = await box.textContent();
    ok(/Builds main, 9\.9\.3,/.test(t) && /Puts the preview, 9\.9\.2, live on chefmealan\.com\. Live now: 9\.9\.1/.test(t), "each row says the version it touches: " + t.slice(0, 160));
    ok(/Nothing deploys from the app/.test(t), "the line says the run starts on GitHub");
    await ctx.close();
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.slice(0, 2).join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all passed"); process.exit(fail ? 1 : 0);
})();
