// Board DT279 (Coach Milan 11 November; 12 November 13:24 Draw: a full card, moved from the bottom to the top, for review and action now).
// A new beta application shows high on Clients, inside Waiting for you. Clients in the coach demo; the request card drawn with the app's own markup.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/pm284v5", PORT = "3488", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = []; seed.meals = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
// Coach Milan 13:44: New beta tester application; Invite on the right; Mark as handled on its own line, with a second tap
const REQ = (top, done, sure = false) => `<section class="card request${done ? " handled" : ""}" style="${top ? mark + ";margin:6px 0 10px" : ""}">
  ${top ? '<small style="display:inline-block;align-self:flex-start;background:#2a72d9;color:#fff;border-radius:999px;padding:2px 10px;font-weight:800;font-size:13px;margin-bottom:4px">New beta tester application</small>' : ""}
  <div class="card-top"><span>Ana (example) · from the home page</span><small>12 Nov</small></div>
  <a href="#">ana@example.com</a><a href="#">WhatsApp +49 000 0000000</a>
  <p class="client-note">“I cook for two and want more protein at dinner.”</p>
  ${done ? '<small class="muted">Invited 12 Nov, 13:40</small>' : !top ? `<div class="button-row" style="margin-top:6px"><button class="pill pill-small pill-primary" style="min-height:44px">✉ Invite</button><button class="link" style="min-height:44px">Mark as handled</button></div>`
    : `<div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="pill pill-primary" style="min-height:48px;padding:0 22px">✉ Invite</button></div>
  <div style="border-top:1px solid #e3eaf6;margin-top:12px;padding-top:6px;display:flex;flex-direction:column;align-items:flex-start;gap:2px">
  ${sure ? '<button class="link" id="b-sure" style="min-height:44px;color:#b3261e;font-weight:800">Sure? Tap again to mark as handled</button><button class="link" style="min-height:44px">Keep it</button><small class="muted">It leaves Waiting for you without an invite.</small>'
    : '<button class="link" id="b-handled" style="min-height:44px;color:#53627f">Mark as handled</button>'}</div>`}</section>`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1500);
    await p.locator(".bottom-nav button").filter({ hasText: "Clients" }).click(); await p.waitForTimeout(1000);
    await p.evaluate(() => { const f = document.querySelector(".chat-fab"); if (f) f.style.visibility = "hidden"; });
    return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  // the bottom of Clients as it is on the live app: Codes and sign-ups, Requests for access (the demo leaves them out)
  const bottom = (p, done) => p.evaluate(({ REQ }) => { const m = [...document.querySelectorAll("main")].pop();
    m.insertAdjacentHTML("beforeend", `<p class="label coach-static">Codes and sign-ups</p><section class="card"><div class="card-top"><span>Invite a client</span></div><small class="muted">A code for one person, by email.</small></section><p class="label" id="reqlabel">Requests for access (${REQ.done ? 0 : 1})</p>${REQ.html}`); }, { REQ: { html: REQ(false, done), done } });
  const shot = async (p, name, y = 0, h = 844) => { await p.setViewportSize({ width: 390, height: h }); await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  // 1. now: the top of Clients
  let p = await open();
  await note(p, "Now (0.3.140): the top of Clients. Waiting for you, the check-ins, the clients. A new beta application is not here.", "main > section.card.waiting");
  await shot(p, "r279a");
  // 2. now: the application at the bottom
  p = await open(); await bottom(p, false);
  await p.evaluate((mark) => { const r = document.querySelector("main section.request"); r.style.cssText += ";" + mark; }, mark);
  await note(p, "Now: the application is at the very bottom, under Codes and sign-ups, after every client. Easy to miss.", "#reqlabel");
  const y2 = await p.evaluate(() => document.documentElement.scrollHeight - 844);
  await shot(p, "r279b", y2);
  // 3. new: a full card at the top, inside Waiting for you, first
  p = await open(); await bottom(p, false);
  await p.evaluate(({ html }) => { const wq = document.querySelector("main section.card.waiting"); const h = wq.querySelector("b"); h.textContent = h.textContent.replace(/\((\d+)\)/, (_, n) => `(${+n + 1})`);
    wq.querySelector("small.muted").insertAdjacentHTML("afterend", html);
    for (const e of document.querySelectorAll(".bottom-nav button *")) if (e.children.length === 0 && e.textContent.trim() === "7") e.textContent = "8"; }, { html: REQ(true, false) });
  await note(p, "New: a new beta tester application is the first thing in Waiting for you, as a full card. Invite on the right. Mark as handled on its own line below, away from Invite. It counts in Waiting for you.", "main > section.card.waiting");
  await shot(p, "r279c");
  // 3b. new: Mark as handled asks for a second tap
  p = await open(); await bottom(p, false);
  await p.evaluate(({ html }) => { const wq = document.querySelector("main section.card.waiting"); const h = wq.querySelector("b"); h.textContent = h.textContent.replace(/\((\d+)\)/, (_, n) => `(${+n + 1})`);
    wq.querySelector("small.muted").insertAdjacentHTML("afterend", html);
    for (const e of document.querySelectorAll(".bottom-nav button *")) if (e.children.length === 0 && e.textContent.trim() === "7") e.textContent = "8"; }, { html: REQ(true, false, true) });
  await note(p, "New, after one tap on Mark as handled: a second tap is needed, so it can't happen by accident. Keep it goes back.", "main > section.card.waiting");
  await shot(p, "r279e");
  // 4. new: after Invite or Mark as handled
  p = await open(); await bottom(p, true);
  await note(p, "New, after Invite or Mark as handled: the card leaves the top and the count drops by one. Below, under Requests for access, it stays as handled, with the date.", "#reqlabel");
  const y4 = await p.evaluate(() => document.documentElement.scrollHeight - 844);
  await shot(p, "r279d", y4);
  await b.close(); server.kill();
})();
