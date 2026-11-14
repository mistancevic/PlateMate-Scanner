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
const REQC = (src) => `<section class="card request request-top" style="${mark};margin:6px 0 10px"><small style="display:inline-block;align-self:flex-start;background:#2a72d9;color:#fff;border-radius:999px;padding:2px 10px;font-weight:800;font-size:13px;margin-bottom:4px">New beta tester application</small>
  <div class="card-top"><span>Ana · ${src}</span><small>13 Nov</small></div><a href="#">ana.k@example.com</a><a href="#">WhatsApp +49 000 0000000</a>
  <p class="client-note">“Met Milan at the meetup. I train three times a week.”</p>
  <div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="pill pill-primary" style="min-height:48px;padding:0 22px">✉ Invite</button></div>
  <div style="border-top:1px solid #e3eaf6;margin-top:12px;padding-top:6px"><button class="link" style="min-height:44px;color:#53627f">Mark as handled</button></div></section>`;
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
  const rename = (p, to, letter, sub, tail = "") => p.evaluate(({ to, letter, sub, tail, mark }) => {
    for (const e of document.querySelectorAll("main *")) { if (e.children.length) continue; const t = e.textContent;
      if (t.trim() === "N" && e.classList.contains("avatar")) e.textContent = letter;
      else if (/Nina/.test(t)) e.textContent = t.replace(/Nina/g, to); }
    const heads = [...document.querySelectorAll("main b")].filter((x) => x.textContent.trim() === to);
    const last = heads.pop(); if (last && sub) { last.insertAdjacentHTML("afterend", sub); const c = last.closest(".card") || last.parentElement; if (tail) c.insertAdjacentHTML("beforeend", `<div style="border-top:1px solid #e3eaf6;margin-top:10px;padding-top:8px;width:100%">${tail}</div>`); c.style.cssText += ";" + mark; c.id = "crow"; }
  }, { to, letter, sub, tail, mark });
  const review = (p, who, marked) => p.evaluate(({ html, mark, marked }) => { const wq = document.querySelector("main section.card.waiting"); wq.querySelector("small.muted").insertAdjacentHTML("afterend", html); if (marked) wq.querySelector(".review-card").style.cssText += ";" + mark; }, { html: REVIEW(who), mark, marked });
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, off = 120) => { await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const bottom = (p, html) => p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.insertAdjacentHTML("beforeend", html); }, html);
  try {
    // a: now, unnamed everywhere
    let p = await open(); await review(p, "Client unnamed", true); await rename(p, "unnamed", "U");
    await note(p, "4. Now: everything they send says unnamed too: Client unnamed set new numbers.", "main > section.card.waiting");
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
    // d: new, name and email on the card, with the coach's own note
    p = await open(); await rename(p, "Ana", "A", `<small style="display:block;color:#3d4a63">ana.k@example.com</small><small style="display:block;color:#3d4a63">From the home page form · 13 November</small>`, `<small style="display:block;color:#172742;margin-top:2px"><b>Your note:</b> Met at the High Performers meetup, Friday 13 November.</small><div style="display:flex;justify-content:flex-end;margin-top:6px"><button class="pill pill-small" style="min-height:44px;background:#fff;border:1.5px solid #2a72d9;color:#1f5fc7;font-weight:700">Edit note</button></div>`);
    await note(p, "4. New: your note on the card, for later. Only you see it.", "#crow");
    await shot(p, "r141d", "#crow", 260);
    // f: new, writing the note
    p = await open(); await rename(p, "Ana", "A", `<small style="display:block;color:#3d4a63">ana.k@example.com</small>`, `<div style="margin-top:8px"><textarea style="width:100%;box-sizing:border-box;min-height:70px;border:1.5px solid #2a72d9;border-radius:10px;padding:8px;font:inherit;font-size:14px">Met at the High Performers meetup, Friday 13 November.</textarea><small style="display:block;color:#3d4a63">Only you see this note. Ana doesn't.</small><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><button class="link" style="min-height:44px">Cancel</button><button class="pill pill-primary" style="min-height:44px;padding:0 20px">Save</button></div></div>`);
    await note(p, "New: Add a note opens a box on the card. Save on the right. Only you see it: it is kept with your account, never in the client's.", "#crow");
    await shot(p, "r141f", "#crow", 260);
    // e: new, no name anywhere yet: the email, and room for a note
    p = await open(); await review(p, "ana.k@example.com", false); await rename(p, "ana.k@example.com", "A", "", `<div style="display:flex;justify-content:flex-end;margin-top:6px"><button class="pill pill-small" style="min-height:44px;background:#fff;border:1.5px solid #2a72d9;color:#1f5fc7;font-weight:700">Add a note</button></div>`);
    await note(p, "New: no name on the invite and none in Profile: the email it was sent to, as at the earlier tester. Never unnamed, and no Client in front.", "main > section.card.waiting");
    await shot(p, "r141e", null);
    // routes into the beta, each to the client's card
    const EM = `<small style="display:block;color:#3d4a63">ana.k@example.com</small>`, FROM = (t) => `<small style="display:block;color:#3d4a63">${t}</small>`;
    const ADD = `<div style="display:flex;justify-content:flex-end;margin-top:6px"><button class="pill pill-small" style="min-height:44px;background:#fff;border:1.5px solid #2a72d9;color:#1f5fc7;font-weight:700">Add a note</button></div>`;
    const card = async (name, from, txt, file) => { const p = await open(); await rename(p, "Ana", "A", EM + FROM(from), ADD); await note(p, txt, "#crow"); await shot(p, file, "#crow", 260); };
    const page = async (url) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); await p.goto(U + url); await p.waitForTimeout(1500); return p; };
    const fill = (p, sel) => p.evaluate((sel) => { const f = document.querySelector(sel); const ins = [...f.querySelectorAll("input, textarea")]; const v = ["Ana", "ana.k@example.com", "+49 000 0000000", "Met Milan at the meetup. I train three times a week."]; let i = 0; for (const x of ins) { if (x.type === "checkbox" || x.type === "hidden" || x.name === "website" || x.offsetParent === null) continue; if (i < v.length) x.value = v[i++]; } }, sel);
    // A: the home page form
    p = await page("/?home"); await fill(p, ".l-request:not(.l-wait)"); await p.evaluate((mark) => { document.querySelector(".l-request:not(.l-wait)").style.cssText += ";" + mark; }, mark);
    await note(p, "1. The home page: Join the beta. Name, email, a mobile number if they like, a note, which fits them.", ".l-request:not(.l-wait)");
    await shot(p, "r141h1", ".l-request:not(.l-wait)", 150);
    p = await open(); await p.evaluate(({ html }) => { document.querySelector("main section.card.waiting small.muted").insertAdjacentHTML("afterend", html); }, { html: REQC("from the home page") });
    await note(p, "2. Clients, first in Waiting for you. Invite makes the code with the name from the form and opens the email to send. They sign in and type the code.", "main > section.card.waiting");
    await shot(p, "r141h2", null);
    await card("Ana", "From the home page form · 13 November", "3. New: they joined, and their card keeps the name from the form. Under it the email, and where they came from. Add a note is yours.", "r141h3");
    // B: a book page form
    p = await page("/worthy-numbers?from=qr");
    await p.evaluate(() => { const h = document.querySelector(".bk-read"); if (h) h.outerHTML = `<div class="l-request bk-join" id="bkform"><h2>Get your personal code</h2><p class="l-book-line">Chef Mealan is free while it is in beta, and spots are limited. Leave your name and email, and you get your code within a day.</p><div class="l-form"><input value="Ana"><input value="ana.k@example.com"><input placeholder="Mobile (optional)"><textarea placeholder="Anything we should know?"></textarea><button class="pill pill-primary" style="min-height:48px">Send</button></div></div>`; });
    await p.evaluate((mark) => { document.querySelector("#bkform").style.cssText += ";" + mark; }, mark);
    await note(p, "1. A book page, Worthy Numbers, here opened from the QR code in the book (?from=qr). The same form, signed out.", "#bkform");
    await shot(p, "r141b1", "#bkform", 150);
    p = await open(); await p.evaluate(({ html }) => { document.querySelector("main section.card.waiting small.muted").insertAdjacentHTML("afterend", html); }, { html: REQC("from Worthy Numbers · QR") });
    await note(p, "2. Clients, the same application card, with the page and the link it came from. Invite, as above.", "main > section.card.waiting");
    await shot(p, "r141b2", null);
    await card("Ana", "From Worthy Numbers · QR · 13 November", "New: their card says the book page and the link.", "r141b3");
    // C: your own invite
    await card("Ana", "From your invite · 14 November", "New: their card. The name you gave the invite, the email, From your invite.", "r141i2");
    // D: the waiting list
    p = await page("/?home"); await p.evaluate(() => { const f = document.querySelector("#wait"); const i = f.querySelector("input[type=email], input"); if (i) i.value = "ana.k@example.com"; }); await p.evaluate((mark) => { document.querySelector("#wait").style.cssText += ";" + mark; }, mark);
    await note(p, "1. The home page: the waiting list. An email only, for when Chef Mealan opens to everyone. No code, no beta.", "#wait");
    await shot(p, "r141w1", "#wait", 150);
    p = await open(); await bottom(p, `<p class="label" id="wl">Waiting list (1)</p><section class="card waitlist" style="${mark}"><div class="wait-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span><a href="#">ana.k@example.com</a><small style="display:block">I train on my own · 2 Nov</small></span><button class="pill pill-small pill-danger-line" style="min-height:44px">Remove</button></div></section>`);
    await note(p, "2. Clients, Waiting list. To bring someone into the beta, you make an invite by hand: Invite a client, with their name and this email.", "#wl");
    await shot(p, "r141w2", "#wl", 200);
    await card("Ana", "From the waiting list · 2 November", "New: their card. On the waiting list first, so it says so, with the day they joined it.", "r141w3");
    // the flow's missing frames: now, the card says unnamed; new, the review says the name
    p = await open(); await rename(p, "unnamed", "U", " ");
    await note(p, "3. Now: they joined, and their card says unnamed. The name from the form was wiped by their empty Profile name.", "#crow");
    await shot(p, "r141n3", "#crow", 260);
    p = await open(); await review(p, "Ana", true); await rename(p, "Ana", "A");
    await note(p, "5. New: everything they send carries the name: Ana set new numbers.", "main > section.card.waiting");
    await shot(p, "r141n5", null);
  } finally { await b.close(); server.kill(); }
})();
