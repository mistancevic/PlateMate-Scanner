// Board B155 (Coach Milan 22 November 2026, 10:40 and 10:59): an application comes back to Waiting for you although the person
// was invited and already joined. Pictures from the coach demo on a scratch build of 0.3.172 (/home/claude/work/b151, not
// committed). The phone's clock: Sunday 22 November 2026, 10:38. The applicant is the demo client Nina (nina@example.com):
// she sent the form on 20 November, was invited that day, joined, and sent the form once more on 21 November.
// Today's screens: the requests as the server sends them now. New: the same requests with what the coach's invites say.
const { chromium } = require("/home/claude/work/b151/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/work/b151", R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs155", PORT = "3692", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
const r1 = { id: "r1", name: "Nina", email: "nina@example.com", phone: "+49 000 0000000", note: "I want to eat better and help test it.", createdAt: "2026-11-20T09:10:00.000Z", status: "new" };
const r1h = { ...r1, status: "handled", handledAt: "2026-11-20T10:00:00.000Z" };
const r2 = { ...r1, id: "r2", createdAt: "2026-11-21T18:30:00.000Z", status: "new" };
const INV = "2026-11-20T10:00:00.000Z";
// name: [requests, invite of that email or null, where to look, note, what to mark]
const USED = { status: "used", at: INV }, OPEN = { status: "open", at: INV, code: "ABC123" };
const scenes = {
  "1a": [[r1], null, "top", "A new application waits. I tap Invite: the mail with her code opens.", [".request-top .request-invite"]],
  "1b": [[r1h], null, "list", "After Invite the application left Waiting for you. Further down it says Handled.", []],
  "1c": [[r2, r1h], null, "top", "She joined with the code. She also sent the form once more. The card is back as new, with Invite, although she is already a client.", [".request-top"]],
  "2a": [[r1], null, "top", "<b>No change:</b> a new application waits. I tap Invite.", []],
  "2b": [[r1h], null, "list", "<b>No change:</b> after Invite the application left Waiting for you. Further down it says Handled.", []],
  "2c": [[r2, r1h].map((r) => ({ ...r, invite: USED })), null, "top", "<b>New:</b> she is already a client, so her second form is not a new request. No card, and the badge on Clients does not count it.", []],
  "2d": [[r2, r1h].map((r) => ({ ...r, invite: USED })), null, "list", "<b>New:</b> further down I see that she asked again: 2 requests, Already a client. One button answers her by mail with how to sign in. It opens my mail app, as Invite does.", [".request .request-state", ".request .request-answer"]],
  "3a": [[r2, r1h], null, "top", "She has the code but did not use it, and sent the form once more. The card is back and looks like a first request.", [".request-top"]],
  "3b": [[r2, r1h].map((r) => ({ ...r, invite: OPEN })), null, "top", "<b>New:</b> she is already invited, so her second form is not a new request. No card, no badge.", []],
  "3c": [[r2, r1h].map((r) => ({ ...r, invite: OPEN })), null, "list", "<b>New:</b> further down: 2 requests, invited on 20 Nov, the code is not used yet. One button sends her the same code again by mail.", [".request .request-state", ".request .request-answer"]],
};
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  try { for (const [name, [reqs, _i, where, html, marks]] of Object.entries(scenes)) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.install({ time: new Date("2026-11-22T10:38:00+01:00") });
    await p.route("**/api/access-requests", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ requests: reqs }) }));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("board-reqs", "1"); localStorage.setItem("seeded", "1"); }, seed);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1500);
    await p.locator(".bottom-nav button").last().click(); await p.waitForTimeout(1200);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    const sel = where === "top" ? "section.card.waiting" : ".card.request:not(.request-top)";
    const target = where === "top" ? ((await p.locator(".request-top").count()) ? ".request-top" : "section.card.waiting > b") : sel;
    await p.evaluate(([target, html, marks, MARK, NOTE, where]) => {
      for (const m of marks) { const e = document.querySelector(m); if (e) e.style.cssText += ";" + MARK; }
      const t = document.querySelector(target); const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html;
      if (t) { t.insertAdjacentElement(target.endsWith("> b") ? "afterend" : "afterend", n); window.scrollTo(0, Math.max(0, t.getBoundingClientRect().top + scrollY - (where === "top" ? 150 : 260))); }
      else document.querySelector("main").prepend(n);
    }, [target, html, marks, MARK, NOTE, where]);
    await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name, await p.locator(".request").count(), (await p.locator("section.card.waiting > b").first().innerText().catch(() => "no waiting")).trim());
    await ctx.close();
  } } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
