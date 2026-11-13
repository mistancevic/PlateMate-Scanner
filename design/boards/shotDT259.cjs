// Board DT259 (Coach Milan 8 November 08:11 to 08:21): sign in with any email, by a link; Remove on old invites.
// "Now": 0.3.111. "New": drawn in by DOM, blue outline and yellow note.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3485", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = []; seed.meals = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const PANEL = `${mark};margin:12px;padding:16px;background:#fff;display:flex;flex-direction:column;gap:10px;font-family:Nunito,system-ui,sans-serif;color:#172742`;
const btn = (t, primary) => `<button class="pill ${primary ? "pill-primary" : ""} pill-wide" style="min-height:48px">${t}</button>`;
const input = (v, ph) => `<input type="email" value="${v}" placeholder="${ph}" style="min-height:48px;font-size:16px;padding:0 12px;border:1.5px solid #c5d2e8;border-radius:12px">`;
const PANELS = {
  signin: `<b style="font-size:20px">Sign in</b>${btn("Continue with Google", true)}<small style="text-align:center;color:#53627f;font-size:14px">or with your email</small>${input("", "Your email")}${btn("Send me a link")}<small style="color:#53627f;font-size:14px;line-height:1.45">No password. We email you a link. Open it on this phone and you are in. Any email works: Gmail, Hotmail, your work email.</small>`,
  inbox: `<b style="font-size:20px">Check your inbox</b><span style="font-size:16px;line-height:1.5">We sent a link to <b>dajana@hotmail.com</b>. Open it on this phone to sign in.</span><small style="color:#53627f;font-size:14px;line-height:1.45">Not there after a minute? Look in spam.</small>${btn("Send it again")}<button class="link" style="min-height:44px">Use another email</button>`,
  other: `<b style="font-size:20px">Which email is this link for?</b><span style="font-size:16px;line-height:1.5">You opened the link on another phone or browser. Type the email once more, so we know it is you.</span>${input("dajana@hotmail.com", "Your email")}${btn("Sign in", true)}`,
  del: `<b style="font-size:20px">Delete my account</b><span style="font-size:16px;line-height:1.5">This removes everything: your profile, plates, foods, recipes, photos, cards, the link to your coach, and the sign-in. It cannot be undone.</span>${btn("Export my data first")}<span style="font-size:16px;line-height:1.5">To be sure it is you, we send a link to <b>dajana@hotmail.com</b>. Nothing is deleted until you open it.</span><button class="pill pill-wide" style="min-height:48px;background:#b3261e;color:#fff;border-color:#b3261e">Send the link</button><button class="link" style="min-height:44px">Cancel</button>`,
};
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (path) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    if (path !== "/?home") await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1500); return p;
  };
  const note = (p, t, sel, where = "afterend") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const panel = (p, html, sel) => p.evaluate(({ html, PANEL, sel }) => { const d = document.createElement("div"); d.style.cssText = PANEL; d.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", d); }, { html, PANEL, sel });
  const shot = async (p, name) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  // 1. sign in
  let p = await open("/?home");
  await p.evaluate((mark) => { const a = document.querySelector(".l-signin"); a.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.111): Sign in opens Google, and nothing else. Someone with a Hotmail or a work email can ask for the beta but cannot get in.", ".l-top");
  await shot(p, "r259a");
  p = await open("/?home");
  await panel(p, PANELS.signin, ".l-top");
  await note(p, "New: Sign in offers Google or your email. With email, Chef Mealan sends a link: no password.", ".l-top");
  await shot(p, "r259b");
  p = await open("/?home");
  await panel(p, PANELS.inbox, ".l-top");
  await note(p, "New: after Send me a link. Spam is named, since the link comes from Firebase's address.", ".l-top");
  await shot(p, "r259c");
  // 2. the link on another phone, and delete
  p = await open("/?home");
  await panel(p, PANELS.other, ".l-top");
  await note(p, "New: the link opened on another phone or browser asks for the email once more. On the same phone it signs in straight away.", ".l-top");
  await shot(p, "r259d");
  // DT259e redrawn (Coach Milan 08:47): a full screen that says what goes; Export first; nothing deleted before the link
  p = await open("/today");
  await p.locator("header .menu-button").click(); await p.waitForTimeout(500);
  await p.evaluate(({ html, PANEL }) => { const m = [...document.querySelectorAll("main")].pop(); m.innerHTML = `<div style="${PANEL}">${html}</div>`; }, { html: PANELS.del, PANEL });
  await note(p, "New: Menu, Delete my account, then this screen. Nothing is deleted until the link is opened. A Google account sees Continue with Google in place of the link.", "main > div", "beforebegin");
  await shot(p, "r259e");
  // 3. invites
  const list = (rm) => `<p class="label">Invites</p><section class="card">${[["Dajana", "dajana@hotmail.com · K7Q2MX", "revoked"], ["Dada", "dada@example.com · 9WRT4P", "revoked"], ["Mia", "mia@gmail.com · H3MZ8D", "used"], ["Marko", "marko@gmail.com · Q2LP6A", "expired"]]
    .filter((r) => rm !== "gone" || r[2] === "used")
    .map(([n, s, st]) => `<div class="history-row"><div><b>${n}</b><small>${s}</small></div><div class="history-num"><b class="inv-${st}">${st}</b>${rm && st !== "used" ? `<small><button class="link" style="min-height:44px;${mark}">remove</button></small>` : ""}</div></div>`).join("")}</section>`;
  for (const [name, rm, t] of [["r259f", "", "Now (0.3.111): revoke closes an invite, and it stays in the list for good. Dajana's and Dada's stay."], ["r259g", "on", "New: remove on a revoked or an expired invite takes it out of the list. A used one stays: it ties a client to you."], ["r259h", "gone", "New: after remove. Dajana gets a new invite when she has signed in with her Hotmail."]]) {
    p = await open("/today");
    await p.evaluate(({ html }) => { const m = document.querySelector("main") || document.querySelector(".screen") || document.body; m.innerHTML = `<div style="padding:12px">${html}</div>`; }, { html: list(rm) });
    await note(p, t, ".label", "beforebegin");
    await shot(p, name);
  }
  // 4. safe sign in (Coach Milan 08:36: yes, all four)
  p = await open("/?home");
  await panel(p, PANELS.inbox.replace('${btn("Send it again")}', '').replace(btn("Send it again"), `<button class="pill pill-wide" disabled style="min-height:48px;opacity:.55">Send it again in 0:52</button>`), ".l-top");
  await note(p, "New: Send it again waits 60 seconds, so nobody can use Chef Mealan to fill someone's inbox. The email comes from chefmealan.com, in the app's language.", ".l-top");
  await shot(p, "r259i");
  p = await open("/privacy");
  await p.evaluate((mark) => { const li = [...document.querySelectorAll("li")].find((x) => x.textContent.startsWith("Account.")); li.innerHTML = "<b>Account.</b> How you sign in: with Google (name, email, user ID), or with your email and a link we send you (email, user ID), so the app knows it is you, and the date you confirmed that you're 18 or over. The sign-in email is sent by Firebase Authentication, from chefmealan.com. Legal basis: the contract, Art. 6(1)(b)."; li.style.cssText += ";" + mark + ";background:#eef5ff;padding:6px"; li.scrollIntoView({ block: "center" }); }, mark);
  await note(p, "New: the privacy page names sign in by email link, and who sends the email. In English, Srpski and German.", "h2:nth-of-type(2)", "beforebegin");
  await p.waitForTimeout(300); await p.evaluate(() => { const li = [...document.querySelectorAll("li")].find((x) => x.textContent.startsWith("Account.")); window.scrollTo(0, li.getBoundingClientRect().top + window.scrollY - 260); });
  await p.screenshot({ path: `${R}/r259j.png` }); console.log("shot r259j"); await p.context().close();
  await b.close(); server.kill();
})();
