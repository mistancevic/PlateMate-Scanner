// Board DT340 (Coach Milan 22 November 2026, 18:46 to 19:03; Draw 23 November 13:00): the client's card shows activity: opened,
// active, full, last active, and a quiet client waits. Main on top (0.3.181), new below. One scratch build of main
// (/home/claude/work/dt340, not committed): board-new draws the levels; the example coach gets a third client, Sara.
// The clock is Thursday 26 November 2026, 13:30, so the week on a card has days gone by.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/dt340";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs340", PORT = "3705", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
const N = JSON.parse(process.env.NOTES || "{}");
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew, coach = true) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-26T13:30:00+01:00"));
    await p.addInitScript(([s, isNew]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [seed, isNew]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    if (coach) { await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1500); await p.locator(".bottom-nav button").last().click(); await p.waitForTimeout(1200); }
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) { const [a, i] = m.split("@@"); (i === undefined ? [...document.querySelectorAll(a)] : [document.querySelectorAll(a)[Number(i)]]).forEach((e) => e && (e.style.cssText += ";" + MARK)); }
    const pick = (q) => { const [a, i] = q.split("@@"); return i === undefined ? document.querySelector(a) : document.querySelectorAll(a)[Number(i)]; };
    const t = typeof sel === "string" ? pick(sel) : null; if (!t) return; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement(where, n); }, [sel, html, marks, MARK, NOTE, where]);
  const full = async (p, name) => { await p.waitForTimeout(400); await p.evaluate(() => { const n = document.querySelector(".bottom-nav"); if (n) { n.style.position = "static"; } document.querySelectorAll("[class*=fab], .chef-float, .float-chef").forEach((e) => (e.style.display = "none")); }); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log(name); };
  try {
    const tall = async (p, name, from, to) => { await p.waitForTimeout(400); await p.evaluate(() => document.querySelectorAll(".chat-fab").forEach((e) => (e.style.display = "none")));
      const r = await p.evaluate(([from, to]) => { const a = document.querySelector(from).getBoundingClientRect(), n = [...document.querySelectorAll(".board-note")].pop() ?? document.querySelector(to); const z = n.getBoundingClientRect(); return { y: a.top + scrollY - 10, h: z.bottom - a.top + 40 }; }, [from, to]);
      await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name); };
    for (const flow of (process.env.FLOWS || "1,2").split(",")) {
      if (flow === "3") { // the client: a day gone by in Plan, a meal not planned, skipped on purpose
        const p = await open(true, false);
        await p.goto(U + "/"); await p.waitForTimeout(800); await p.locator("nav button").filter({ hasText: "Plan" }).click(); await p.waitForTimeout(900);
        await p.getByRole("tab").filter({ hasText: /25/ }).first().click(); await p.waitForTimeout(700);
        for (const [sel, html, marks, where] of (N["3a"] || [])) await note(p, sel, html, marks, where);
        await tall(p, "3a", ".plan-past", ".plan-past");
        await p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove()));
        await p.locator(".past-add .skip-unplanned").first().click(); await p.waitForTimeout(600);
        for (const [sel, html, marks, where] of (N["3b"] || [])) await note(p, sel, html, marks, where);
        await tall(p, "3b", ".plan-past", ".plan-past");
        await p.context().close(); continue;
      }
      if (flow === "4") { // the privacy notice
        const p = await open(true, false);
        await p.goto(U + "/privacy"); await p.waitForTimeout(1200);
        await p.evaluate(() => { const e = document.querySelector(".board-new-line"); e.closest("li").scrollIntoView({ block: "center" }); });
        for (const [sel, html, marks, where] of (N["4a"] || [])) await note(p, sel, html, marks, where);
        await p.evaluate(() => { const e = document.querySelector(".board-new-line"); e.closest("li").scrollIntoView({ block: "center" }); });
        await p.evaluate(() => document.querySelectorAll(".chat-fab").forEach((e) => (e.style.display = "none"))); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/4a.png` }); console.log("4a");
        await p.context().close(); continue;
      }
      const isNew = flow !== "1"; const p = await open(isNew);
      for (const [sel, html, marks, where] of (N[flow] || [])) await note(p, sel, html, marks, where);
      await full(p, `${flow}a`); await p.context().close();
    }
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
