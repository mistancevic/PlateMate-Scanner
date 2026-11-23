// Board B159 (Coach Milan 23 November 2026, 17:07 to 17:09): on a client's card, a day before the client's phone recorded
// activity says not known, never not opened. Main on top (0.3.185), new below. One scratch build of main (/home/claude/work/b159,
// not committed); board-new turns the new rule on. The example coach's clients, with Sara (her phone recorded from yesterday, in the scratch); the clock is Thursday 26 November 2026, 13:30.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/b159";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs159", PORT = "3708", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-26T13:30:00+01:00"));
    await p.addInitScript(([s, isNew]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("chefmealan-coach-demo-quiet", "1"); if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [seed, isNew]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1500); await p.locator(".bottom-nav button").last().click(); await p.waitForTimeout(1200);
    await p.evaluate(() => document.querySelectorAll(".chat-fab").forEach((e) => (e.style.display = "none")));
    return p;
  };
  const note = (p, card, html, marks) => p.evaluate(([card, html, marks, MARK, NOTE]) => { const c = [...document.querySelectorAll(".client-row")].find((e) => e.textContent.includes(card));
    for (const m of marks) c.querySelectorAll(m).forEach((e) => (e.style.cssText += ";" + MARK));
    const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; c.querySelector(".db").insertAdjacentElement("afterend", n); }, [card, html, marks, MARK, NOTE]);
  const shot = async (p, name, card) => { await p.waitForTimeout(300);
    const r = await p.evaluate((card) => { const c = [...document.querySelectorAll(".client-row")].find((e) => e.textContent.includes(card)); c.scrollIntoView({ block: "start" }); const a = c.getBoundingClientRect(); return { y: a.top + scrollY - 10, h: a.height + 20 }; }, card);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name); };
  try {
    let p = await open(false);
    await note(p, "Sara", "Sara's phone started recording yesterday, when she first opened the new version. Monday and Tuesday read <b>not opened</b>, though nobody knows: she may have opened the app.", [".db-row"]);
    await shot(p, "1a", "Sara"); await p.context().close();
    p = await open(true);
    await note(p, "Sara", "<b>New:</b> Monday and Tuesday, before her phone recorded and with nothing logged, read <b>o</b>: not known. The key line says so. A day with something logged keeps its colour.", [".db-row", ".db-key"]);
    await shot(p, "2a", "Sara"); await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
