const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const S = (dir, port) => spawn(process.execPath, ["dist/server.cjs"], { cwd: dir, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
(async () => {
  const a = S("/home/claude/platemate-scanner", "3611"), b = S("/home/claude/work/dt328", "3612");
  for (const port of ["3611", "3612"]) for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const br = await chromium.launch();
  const shot = async (port, q, width, name) => {
    const p = await br.newPage({ viewport: { width, height: 900 } });
    await p.goto(`http://127.0.0.1:${port}/?home${q}`); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelectorAll("video").forEach((v) => { v.pause(); }); document.querySelectorAll("body *").forEach((e) => { if (getComputedStyle(e).position === "fixed") e.style.display = "none"; }); });
    const top = await p.locator(".l-ways").evaluate((e) => e.getBoundingClientRect().top + scrollY);
    const end = await p.locator(".l-ways .l-one").evaluate((e) => e.getBoundingClientRect().top + scrollY);
    await p.evaluate((y) => scrollTo(0, y), top); await p.waitForTimeout(800);
    await p.screenshot({ path: `/home/claude/boards/rs328/${name}.png`, fullPage: true, clip: { x: 0, y: top - 10, width, height: end - top + 10 } });
    console.log(name, Math.round(end - top)); await p.close();
  };
  await shot("3611", "", 390, "now_phone");
  await shot("3612", "", 390, "a_phone");
  await shot("3612", "&b", 390, "b_phone");
  await shot("3611", "", 1280, "now_wide");
  await shot("3612", "", 1280, "new_wide");
  await br.close(); a.kill(); b.kill();
})();
