// Board B141 (Coach Milan 14 November 11:30: new testers from the Munich meetup show as "unnamed"; 11:35 Draw).
// A client's name: the name they typed in Profile, else the invite's name, else the invite's email. Create invite asks for a name.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/pm141", PORT = "3502", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = []; seed.meals = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const REVIEW = (who) => `<section class="card review-card" style="margin:6px 0 10px"><b>${who} set new numbers</b><small class="muted">Lose fat · every day the same · 1,520 kcal · November 14</small>
  <div class="finding"><b>Kept on purpose: this looks more like a deeper cut than losing fat</b><span>Your average is 1,520; what you burn, calculated, is 2,250: 32 % under.</span></div></section>`;
const INVITE = (name, email, on, hint) => `<p class="label">Codes and sign-ups</p><section class="card" id="inv"><div class="card-top"><span>Invite a client</span></div><small>A personal code for one person, by email.</small>
  <div class="l-form" style="margin-top:8px"><input placeholder="Name" value="${name}" style="${hint ? "border-color:#2a72d9" : ""}"><input placeholder="Email they sign in with" value="${email}">
  ${hint ? `<small style="color:#1f5fc7;font-weight:700">${hint}</small>` : ""}
  <div style="display:flex;justify-content:flex-end"><button class="pill pill-primary" style="min-height:48px;padding:0 22px" ${on ? "" : "disabled"}>Create invite</button></div></div></section>`;
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
    await p.locator(".bottom-nav button").filter({ hasText: "Clients" }).click(); await p.waitForTimeout(1200);
    await p.evaluate(() => { const f = document.querySelector(".chat-fab"); if (f) f.style.visibility = "hidden"; });
    return p;
  };
  // Nina becomes the client with no name: "unnamed" now; a name or an email in the new frames
  const rename = (p, to, letter, sub) => p.evaluate(({ to, letter, sub, mark }) => {
    for (const e of document.querySelectorAll("main *")) { if (e.children.length) continue; const t = e.textContent;
      if (t.trim() === "N" && e.classList.contains("avatar")) e.textContent = letter;
      else if (/Nina/.test(t)) e.textContent = t.replace(/Nina/g, to); }
    const heads = [...document.querySelectorAll("main b")].filter((x) => x.textContent.trim() === to);
    const last = heads.pop(); if (last && sub) { last.parentElement.insertAdjacentHTML("beforeend", `<small style="color:#1f5fc7;font-weight:700;display:block">${sub}</small>`); const c = last.closest(".card") || last.parentElement; c.style.cssText += ";" + mark; c.id = "crow"; }
  }, { to, letter, sub, mark });
  const review = (p, who, marked) => p.evaluate(({ html, mark, marked }) => { const wq = document.querySelector("main section.card.waiting"); wq.querySelector("small.muted").insertAdjacentHTML("afterend", html); if (marked) wq.querySelector(".review-card").style.cssText += ";" + mark; }, { html: REVIEW(who), mark, marked });
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, off = 120) => { await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const bottom = (p, html) => p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.insertAdjacentHTML("beforeend", html); }, html);
  try {
    // a: now, unnamed everywhere
    let p = await open(); await review(p, "Client unnamed", true); await rename(p, "unnamed", "U");
    await note(p, "Now (0.3.145): no name on the invite and none in their Profile, so Clients says unnamed: in the review, in Waiting for you, on their card.", "main > section.card.waiting");
    await shot(p, "r141a", null);
    // b: now, the invite takes an email alone
    p = await open(); await bottom(p, INVITE("", "new.tester@example.com", true, ""));
    await p.evaluate((mark) => { document.querySelector("#inv").style.cssText += ";" + mark; }, mark);
    await note(p, "Now: the name is optional. An invite made with an email alone brings no name. An email-link sign-in brings none either.", "#inv");
    await shot(p, "r141b", "#inv", 200);
    // c: new, a name is needed
    p = await open(); await bottom(p, INVITE("", "new.tester@example.com", false, "Add their name, so you know who joined."));
    await p.evaluate((mark) => { document.querySelector("#inv").style.cssText += ";" + mark; }, mark);
    await note(p, "New: Create invite needs a name and an email. Until both are there, the button stays off and says why. The name is yours; they can change theirs in Profile.", "#inv");
    await shot(p, "r141c", "#inv", 200);
    // d: new, the name from the invite
    p = await open(); await review(p, "Ana", false); await rename(p, "Ana", "A", "Name from your invite");
    await note(p, "New: no name in their Profile, so Clients takes the name from the invite they joined with. Everywhere: Waiting for you, the review, their card, their week. The card says where the name came from.", "#crow");
    await shot(p, "r141d", "#crow", 260);
    // e: new, the invite had no name either: its email
    p = await open(); await review(p, "ana.k@example.com", false); await rename(p, "ana.k@example.com", "A", "Email from your invite. No name yet");
    await note(p, "New: an older invite with no name: the email it was sent to, as at the earlier tester. Never unnamed, and no Client in front. When they type a name in Profile, that name wins.", "main > section.card.waiting");
    await shot(p, "r141e", null);
  } finally { await b.close(); server.kill(); }
})();
