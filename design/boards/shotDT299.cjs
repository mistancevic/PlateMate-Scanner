// Board DT299 (Coach Milan 14 November 2026, 14:05 to 14:16, Draw): the home page forms say what is required.
// A label above each box, * on the required ones, grey text inside that says what to do; Send always tappable, a missing
// required box says so; neutral wording (no name in the lines). The beta form, the waiting list, the same form on a book page.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/pm141", PORT = "3531", U = `http://127.0.0.1:${PORT}`;
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const LAB = "display:block;font-weight:700;font-size:15px;color:#172742;margin:0 0 6px", OPT = "font-weight:400;color:#53627f";
const box = (label, opt, ph, { err = "", val = "", area = false, sub = "" } = {}) => `<div style="margin-bottom:14px"><span style="${LAB}">${label}${opt ? ` <span style="${OPT}">(optional)</span>` : ' <span style="color:#b3261e">*</span>'}</span>
  <${area ? "textarea" : "input"} placeholder="${ph}" ${area ? "" : `value="${val}"`} style="width:100%;box-sizing:border-box;${area ? "min-height:84px;" : ""}${err ? "border:2px solid #b3261e;" : ""}">${area ? "</textarea>" : ""}
  ${err ? `<small style="display:block;color:#b3261e;font-weight:700;margin-top:4px">${err}</small>` : ""}${sub ? `<small style="display:block;color:#53627f;margin-top:4px">${sub}</small>` : ""}</div>`;
const WHO = `<div class="setting"><small class="setting-name">Which fits you? <span style="${OPT}">(optional)</span></small><div class="chip-row"><button type="button" class="choice">I have a coach</button><button type="button" class="choice">I am a coach</button><button type="button" class="choice">I train on my own</button></div></div>`;
const REQ = `<small style="display:block;color:#53627f;margin:10px 0 6px"><span style="color:#b3261e">*</span> required</small>`;
const BETA = (o = {}) => box("Name", false, "Type your name", { err: o.nameErr }) + box("Email", false, "Type the email you'll sign in with", { err: o.emailErr, val: o.email || "" })
  + box("Mobile number", true, "Start with + and your country code", { sub: "You may get a message on WhatsApp or by text about joining. The number is used for nothing else." })
  + box("A short note", true, "Write your goal, and a few words about you", { area: true }) + WHO + REQ + `<button class="pill pill-primary pill-wide" style="min-height:52px">Send</button>`;
const WAIT = (o = {}) => box("Email", false, "Type your email address", { err: o.emailErr }) + WHO
  + `<label class="l-consent" style="${o.tickErr ? "outline:2px solid #b3261e;outline-offset:4px;border-radius:8px" : ""}"><input type="checkbox"> <span>Write to me when Chef Mealan opens. I can leave the list at any time by writing to hello@chefmealan.com. <span style="color:#b3261e">*</span></span></label>${o.tickErr ? `<small style="display:block;color:#b3261e;font-weight:700;margin-top:4px">${o.tickErr}</small>` : ""}`
  + REQ + `<button class="pill pill-primary pill-wide" style="min-height:52px">Join the waiting list</button>`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const page = async (url) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); await p.goto(U + url); await p.waitForTimeout(1500); return p; };
  const note = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement("beforebegin", d); }, { t, NOTE, sel });
  const shot = async (p, name, sel, off = 110, h = 844) => { await p.setViewportSize({ width: 390, height: h }); await p.evaluate(({ sel, off }) => { const e = document.querySelector(sel); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - off); document.querySelectorAll(".l-sticky").forEach((x) => (x.style.display = "none")); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const neutral = (p, sel) => p.evaluate((sel) => { for (const e of document.querySelectorAll(sel + " p, " + sel + " p *")) for (const n of e.childNodes) if (n.nodeType === 3 && /Coach Milan sends you a personal code/.test(n.textContent)) n.textContent = n.textContent.replace("and Coach Milan sends you a personal code.", "and you get a personal code by email."); }, sel);
  const BF = ".l-request:not(.l-wait)", H = 1040;
  try {
    // now
    let p = await page("/?home"); await note(p, "Now (0.3.146): the words sit inside the boxes and go away when you type. Nothing says what is required. Send is grey and does not say why. The note's text is cut.", BF + " .l-form");
    await shot(p, "r299a", BF, 60, H);
    p = await page("/?home"); await note(p, "Now: the waiting list. The same: Join the waiting list is grey until the email and the tick are there, without a word.", "#wait .l-form");
    await shot(p, "r299b", "#wait", 60, H);
    // new: the beta form
    p = await page("/?home"); await neutral(p, BF); await p.evaluate(({ sel, html }) => { document.querySelector(sel + " .l-form").innerHTML = html; }, { sel: BF, html: BETA() });
    await note(p, "New: a label above each box, * on what is required, (optional) on the rest. The grey text inside says what to do. No name in the lines: you get a personal code by email.", BF + " .l-form");
    await shot(p, "r299c", BF, 60, 1240);
    p = await page("/?home"); await neutral(p, BF); await p.evaluate(({ sel, html }) => { document.querySelector(sel + " .l-form").innerHTML = html; }, { sel: BF, html: BETA({ nameErr: "Add your name", emailErr: "Check the email: it needs an @", email: "ana.k.example.com" }) });
    await note(p, "New: Send can always be tapped. With something missing or wrong, nothing is sent: the box turns red and says what to do. The first one comes into view.", BF + " .l-form");
    await shot(p, "r299d", BF, 60, 1240);
    // new: the waiting list
    p = await page("/?home"); await p.evaluate(({ html }) => { document.querySelector("#wait .l-form").innerHTML = html; }, { html: WAIT() });
    await note(p, "New: the waiting list in the same style: Email *, and the tick is required too.", "#wait .l-form");
    await shot(p, "r299e", "#wait", 60, H);
    p = await page("/?home"); await p.evaluate(({ html }) => { document.querySelector("#wait .l-form").innerHTML = html; }, { html: WAIT({ emailErr: "Add your email", tickErr: "Tick the box, so we may write to you when it opens" }) });
    await note(p, "New: tapped with nothing filled: both say what is missing.", "#wait .l-form");
    await shot(p, "r299f", "#wait", 60, H);
    // new: the same form on a book page
    p = await page("/worthy-numbers");
    await p.evaluate(({ html }) => { const h = document.querySelector(".bk-read"); h.outerHTML = `<div class="l-request bk-join" id="bkform"><h2>Get your personal code</h2><p class="l-book-line">Chef Mealan is free while it is in beta, and spots are limited. Leave your name and email, and you get your code within a day.</p><div class="l-form">${html}</div></div>`; }, { html: BETA() });
    await note(p, "New: the same form on a book page (Worthy Numbers), signed out.", "#bkform .l-form");
    await shot(p, "r299g", "#bkform", 60, 1240);
  } finally { await b.close(); server.kill(); }
})();
