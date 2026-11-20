// DT331 board pictures: the bottom of the Menu and About, today (main's dist) and with the version in the Menu (scratch build at
// /home/claude/work/dt328, not committed). A local run has no sign-in, so the scratch shows Sign out behind ?showsignout.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const OUT = process.env.BOARDS_SHOTS || "/home/claude/boards/rs331";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const S = (dir, port) => spawn(process.execPath, ["dist/server.cjs"], { cwd: dir, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
(async () => {
  const a = S("/home/claude/platemate-scanner", "3641"), n = S("/home/claude/work/dt328", "3642");
  for (const port of ["3641", "3642"]) for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const br = await chromium.launch();
  const open = async (port, q) => {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto(`http://127.0.0.1:${port}/today${q}`); await p.waitForTimeout(1200);
    await p.locator("header .menu-button").click(); await p.waitForTimeout(600);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(500);
    return p;
  };
  let p = await open("3641", ""); await p.screenshot({ path: `${OUT}/now_menu.png` });
  await p.locator(".menu-row").filter({ hasText: "About" }).click(); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/now_about.png` });
  p = await open("3642", "?showsignout"); await p.screenshot({ path: `${OUT}/new_menu.png` });
  await br.close(); a.kill(); n.kill(); console.log("ok");
})();
