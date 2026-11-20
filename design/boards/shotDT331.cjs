// DT331 board pictures, all from one scratch build of 0.3.167 (/home/claude/work/dt328, not committed), built with the commit as
// the live app shows it (VITE_COMMIT). A local run has no sign-in, so the scratch shows Sign out on a flag, as a signed-in phone
// has it; "now" hides the new line on another flag. The order: the Menu today, About today, then the Menu new.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const OUT = process.env.BOARDS_SHOTS || "/home/claude/boards/rs331";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
(async () => {
  const n = spawn(process.execPath, ["dist/server.cjs"], { cwd: "/home/claude/work/dt328", env: { ...process.env, NODE_ENV: "production", PORT: "3642", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch("http://127.0.0.1:3642/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const br = await chromium.launch();
  const open = async (now) => {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
    await p.addInitScript(([s, now]) => { localStorage.setItem("board-signout", "1"); if (now) localStorage.setItem("board-now", "1"); if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed, now]);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto("http://127.0.0.1:3642/today"); await p.waitForTimeout(1200);
    await p.locator("header .menu-button").click(); await p.waitForTimeout(600);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(500);
    return p;
  };
  let p = await open(true); await p.screenshot({ path: `${OUT}/now_menu.png` });
  await p.locator(".menu-row").filter({ hasText: "About" }).click(); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/now_about.png` });
  // the house style of a board: the change drawn into the new screen, blue outline and a yellow note (as B150, DT308)
  p = await open(false);
  await p.evaluate(() => { const v = document.querySelector(".menu-version"); v.style.cssText += ";outline:3px solid #2a72d9;outline-offset:3px;border-radius:6px";
    const n = document.createElement("div"); n.style.cssText = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px;background:#fff8d6;padding:8px 10px;margin:14px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif";
    n.innerHTML = "<b>New:</b> the version, the same line as in About, between the links and Sign out. Small and grey, as the links."; v.insertAdjacentElement("afterend", n); window.scrollTo(0, document.body.scrollHeight); });
  await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/new_menu.png` });
  await br.close(); n.kill(); console.log("ok");
})();
