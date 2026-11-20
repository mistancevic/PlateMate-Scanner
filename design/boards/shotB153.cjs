// B153 board pictures: the coach demo on Friday 20 November 2026, 14:26. Lena (made up) is on day 8 of her first two weeks; her
// phone last saved on day 5 (Tuesday). One scratch build of 0.3.169 (/home/claude/work/b153, not committed): "now" shows the app as
// it is (the flag board-now), "new" the fix. Blue outline and a yellow note on what changes; a yellow note on what is wrong today.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const OUT = process.env.BOARDS_SHOTS || "/home/claude/boards/rs153"; fs.mkdirSync(OUT, { recursive: true });
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const NOTE = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px;background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;position:relative;z-index:5";
(async () => {
  const n = spawn(process.execPath, ["dist/server.cjs"], { cwd: "/home/claude/work/b153", env: { ...process.env, NODE_ENV: "production", PORT: "3653", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch("http://127.0.0.1:3653/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const br = await chromium.launch();
  const open = async (now) => {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-20T14:26:00"));
    await p.route("**/api/access-requests", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ requests: [] }) }));
    await p.route("**/api/howto", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ testers: [] }) }));
    await p.addInitScript(([s, now]) => { if (now) localStorage.setItem("board-now", "1"); if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed, now]);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto("http://127.0.0.1:3653/today?coachdemo"); await p.waitForTimeout(1500);
    await p.locator(".bottom-nav button").last().click(); await p.waitForTimeout(1200);
    return p;
  };
  const note = async (p, sel, html, mark, markSel) => p.evaluate(([sel, html, mark, NOTE, markSel]) => { const el = document.querySelector(sel); if (mark) document.querySelector(markSel || sel).style.cssText += ";outline:3px solid #2a72d9;outline-offset:4px;border-radius:10px";
    const d = document.createElement("div"); d.style.cssText = NOTE; d.innerHTML = html; el.insertAdjacentElement("afterend", d); }, [sel, html, mark, NOTE, markSel]);
  const toLena = async (p) => { const c = p.locator(".client-row").filter({ hasText: "Lena" }).first(); await c.evaluate((e) => { e.setAttribute("data-lena", "1"); e.scrollIntoView({ block: "start" }); window.scrollBy(0, -70); }); await p.waitForTimeout(400); return c; };
  for (const now of [true, false]) {
    const tag = now ? "now" : "new";
    let p = await open(now); const c = await toLena(p);
    await note(p, "[data-lena] .db-rows", now ? "<b>Today is Friday, day 8,</b> but the outline is on day 5, Tuesday: the day her phone last saved. Wednesday and Thursday show as still to come."
      : "<b>New:</b> the outline is on today, day 8. Wednesday and Thursday are amber: nothing came from her phone for them. The count under it is counted again too.", !now);
    await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/${tag}_card.png` });
    await p.reload(); await p.waitForTimeout(1500); await p.locator(".bottom-nav button").last().click(); await p.waitForTimeout(1200);
    await (await toLena(p)).locator(".client-open").click(); await p.waitForTimeout(1200);
    await p.locator(".ft-burn").first().evaluate((e) => { e.scrollIntoView({ block: "start" }); window.scrollBy(0, -80); }); await p.waitForTimeout(300);
    await note(p, ".ft-burn .ft-ends", now ? "<b>The same picture on her page:</b> it says day 5 of 14, and the squares stop at Tuesday."
      : "<b>New:</b> her page says day 8 of 14, with the same squares as her card.", !now, ".ft-burn .ft-squares");
    await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/${tag}_page.png` });
    console.log(tag);
  }
  await br.close(); n.kill();
})();
