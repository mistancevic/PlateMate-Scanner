// DT329 board pictures: How to on today's app (main's dist) and on a scratch build with the bar's icons, Watch it and the
// long press scenario (/home/claude/work/dt328, not committed). Fake camera so the long press shows the camera's modes.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const OUT = process.env.BOARDS_SHOTS || "/home/claude/boards/rs329";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const S = (dir, port) => spawn(process.execPath, ["dist/server.cjs"], { cwd: dir, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
(async () => {
  const a = S("/home/claude/platemate-scanner", "3621"), n = S("/home/claude/work/dt328", "3622");
  for (const port of ["3621", "3622"]) for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const br = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const open = async (port, q = "") => {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"] }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-19T17:30:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("chefmealan-howto", JSON.stringify({ photoLog: { s: "tried", at: "2026-11-18T10:00:00Z" } }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto(`http://127.0.0.1:${port}/today${q}`); await p.waitForTimeout(1200);
    await p.locator("header .menu-button").click(); await p.waitForTimeout(500); await p.locator(".howto-row").click(); await p.waitForTimeout(700);
    return p;
  };
  const shot = async (p, name, full = true) => { await p.evaluate((full) => { document.querySelectorAll("video").forEach((v) => { try { v.currentTime = 2.5; v.pause(); } catch {} }); if (full) document.querySelectorAll("body *").forEach((e) => { if (getComputedStyle(e).position === "fixed") e.style.display = "none"; }); }, full); await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: full }); console.log(name); };
  let p = await open("3621"); await shot(p, "now_list");
  await p.locator(".ht-photoLog").click(); await p.waitForTimeout(500); await shot(p, "now_one");
  p = await open("3622"); await shot(p, "new_list");
  await p.locator(".ht-photoLog").click(); await p.waitForTimeout(500); await shot(p, "new_one");
  await p.locator(".ht-watch").click(); await p.waitForTimeout(2500); await shot(p, "new_watch");
  await p.locator(".ht-back").click(); await p.waitForTimeout(400); await p.locator(".ht-scanAnywhere").click(); await p.waitForTimeout(500); await shot(p, "new_scan");
  // New at the top right, with Tried under it (Coach Milan 18:08)
  await p.locator(".ht-tried").click(); await p.waitForTimeout(400); await p.locator(".ht-back").click(); await p.waitForTimeout(500); await shot(p, "new_list_tried");
  // the long press itself, on the app as it is (DT309)
  p = await open("3621"); await p.locator(".ht-back, .menu-close, header .menu-button").first().click().catch(() => {});
  await p.goto("http://127.0.0.1:3621/today"); await p.waitForTimeout(1000);
  const bx = await p.locator(".bottom-nav button").nth(2).boundingBox(); await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(1200);
  await shot(p, "hold_camera", false);
  await br.close(); a.kill(); n.kill();
})();
