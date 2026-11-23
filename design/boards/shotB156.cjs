// Board B156 (Coach Milan 22 November 2026, 15:23 to 15:35; Draw 23 November 11:53): Clients keeps the names it knew when
// the invites do not load. Main on top (0.3.179), new below. One scratch build of main (/home/claude/work/b156, not
// committed): the example coach gets a third client whose Profile name is empty, named from the invites; board-new keeps
// the last good answer and tries once more. The request is answered or refused by the walkthrough, as a promote would.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/b156";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs156", PORT = "3704", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const JOINED = [{ uid: "c3", name: "Sara Novak", email: "sara.novak@example.com", via: { kind: "invite", at: "2026-11-20T10:00:00Z" } }];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  // answers: a list of "ok" or "fail", one per request; the last repeats
  const open = async (isNew, answers, kept) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    let n = 0;
    await p.route("**/api/invites", (r) => { const a = answers[Math.min(n++, answers.length - 1)]; return a === "ok" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ invites: [], joined: JOINED }) }) : r.fulfill({ status: 503, body: "" }); });
    await p.addInitScript(([s, isNew, kept, J]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (kept) localStorage.setItem("chefmealan-joined-cache", JSON.stringify(J));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [seed, isNew, kept, JOINED]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1500);
    await p.locator(".bottom-nav button").last().click(); await p.waitForTimeout(1200);
    return p;
  };
  const note = (p, html) => p.evaluate(([html, MARK, NOTE]) => { const cards = [...document.querySelectorAll("div.client-row:not(.cw-today)")]; const c = cards[cards.length - 1];
    if (!c) return; c.style.cssText += ";" + MARK; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; c.insertAdjacentElement("afterend", n);
    c.scrollIntoView({ block: "center" }); }, [html, MARK, NOTE]);
  const shot = async (p, name) => { await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); });
  try {
    let p = await open(false, ["ok"], false);
    await note(p, "The invites load: the client with no Profile name shows the invite's name, Sara, and her email.");
    await shot(p, "1a"); await p.context().close();
    p = await open(false, ["fail"], false);
    await note(p, "The invites do not load (a promote, a weak connection): the same client shows as <b>No</b>, the first word of No name yet. No email, nothing tried again.");
    await shot(p, "1b"); await p.context().close();
    p = await open(true, ["fail"], true);
    await note(p, "<b>New:</b> the invites do not load, and the phone keeps the last good answer: Sara, with her email and where she came from, as before.");
    await shot(p, "2a"); await p.context().close();
    p = await open(true, ["fail", "ok"], false);
    await note(p, "<b>New:</b> a client this phone has never seen, and the invites do not load: the whole line, No name yet.");
    await shot(p, "2b"); await clean(p);
    await p.waitForTimeout(3800);
    await note(p, "<b>New:</b> a moment later, with no tap, the app tries once more; the answer comes and the name fills in: Sara, with her email.");
    await shot(p, "2c"); await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
