// Board DT236 (Coach Milan 4 November 15:25 and 15:30, Draw): the home page in Srpski, a language switch, and the suggestion to
// switch when the phone is in Serbian. chefmealan.com stays English. Now: 0.3.85 (main dist, served here on 3398).
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3398", U = `http://127.0.0.1:${PORT}`;
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const fresh = async (path, h = 844) => { const ctx = await b.newContext({ viewport: { width: 390, height: h }, deviceScaleFactor: 2, locale: "sr-RS" }); const p = await ctx.newPage(); await p.goto(U + path); await p.waitForTimeout(2200); await p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, [class*=fab]")) t.style.display = "none"; }); return p; };
  const note = (p, t, where = "body") => p.evaluate(({ t, NOTE, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const m = document.querySelector(where) || document.body; m.prepend(d); }, { t, NOTE, where });
  const shot = async (p, name) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(250); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
  // the switch in the header: EN · SR, the one on is filled
  // v2 (Coach Milan 16:18): the button shows the language that is on; a tap opens both, the one on ticked
  const sw = (p, on, open = false) => p.evaluate(({ on, open, mark }) => { const h = document.querySelector(".l-top"); const signIn = [...h.querySelectorAll("a,button")].pop();
    const nav = h.querySelector(".l-topnav"); if (nav) nav.style.gap = "10px"; const wrap = document.createElement("span"); wrap.style.cssText = "position:relative;display:inline-block";
    const x = document.createElement("button"); x.textContent = (on === "en" ? "EN" : "SR") + " ▾"; x.setAttribute("aria-label", on === "en" ? "Language: English" : "Jezik: Srpski");
    x.style.cssText = `min-width:44px;min-height:44px;padding:0 9px;white-space:nowrap;border:1.5px solid #c9d6ee;border-radius:999px;background:#fff;color:#1f5fc7;font:800 14px Nunito,system-ui,sans-serif;${mark}`;
    wrap.appendChild(x);
    if (open) { const m = document.createElement("div"); m.style.cssText = "position:absolute;right:0;top:52px;z-index:50;background:#fff;border:1.5px solid #c9d6ee;border-radius:14px;box-shadow:0 8px 24px rgba(23,39,66,.18);padding:6px;width:190px";
      for (const [k, l] of [["en", "English"], ["sr", "Srpski (latinica)"]]) { const r = document.createElement("button"); r.innerHTML = (k === on ? "✓ " : "<span style=\"display:inline-block;width:1.1em\"></span>") + l;
        r.style.cssText = `display:block;width:100%;text-align:left;min-height:44px;border:0;border-radius:10px;background:${k === on ? "#e8f0fd" : "#fff"};color:#172742;font:800 15px Nunito,system-ui,sans-serif;padding:0 12px`; m.appendChild(r); }
      wrap.appendChild(m); }
    signIn.parentElement.insertBefore(wrap, signIn); }, { on, open, mark });
  // the suggestion, above the header, once
  const ask = (p, where = ".l-top") => p.evaluate(({ mark, where }) => { const top = document.querySelector(where); const d = document.createElement("div");
    d.style.cssText = `background:#e8f0fd;color:#172742;padding:12px 16px 14px;font:600 15px/1.4 Nunito,system-ui,sans-serif;${mark};margin:6px`;
    d.innerHTML = '<div style="font-weight:800;font-size:16px">Chef Mealan je i na srpskom.</div><div style="font-size:13.5px;color:#3d4a63;margin-top:2px">Tvoj telefon je podešen na srpski.</div>'
      + '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap"><button style="min-height:44px;padding:0 18px;border:0;border-radius:999px;background:#2e7be8;color:#fff;font:800 15px Nunito,system-ui,sans-serif">Na srpskom</button>'
      + '<button style="min-height:44px;padding:0 16px;border:1.5px solid #c9d6ee;border-radius:999px;background:#fff;color:#1f5fc7;font:800 15px Nunito,system-ui,sans-serif">Continue in English</button></div>';
    top.parentElement.insertBefore(d, top); }, { mark, where });
  const SR = { "Coaches": "Treneri", "Sign in": "Prijava", "FOR PEOPLE WITH A NUTRITION PLAN": "ZA ONE KOJI IMAJU PLAN ISHRANE", "For people with a nutrition plan": "Za one koji imaju plan ishrane", "Live your nutrition plan, day by day.": "Živi svoj plan ishrane, dan po dan.",
    "Chef Mealan plans your meals with you, and finds the meal that still fits when the day surprises you.": "Chef Mealan sa tobom planira obroke, i nađe obrok koji se i dalje uklapa kad te dan iznenadi.",
    "Join the beta, free": "Pridruži se beti, besplatno", "Use it most days for four weeks, and tell us what breaks.": "Koristi je većinu dana četiri nedelje, i javi nam šta ne radi.",
    "Or join the waiting list": "Ili se upiši na listu čekanja", "Milan's own cooking, at home.": "Milanova kuhinja, kod kuće." };
  const serbian = (p) => p.evaluate((SR) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const ns = []; let n; while ((n = w.nextNode())) ns.push(n);
    for (const n of ns) { const t = n.textContent.trim(); if (SR[t]) n.textContent = n.textContent.replace(t, SR[t]); }
    for (const e of document.querySelectorAll("h1, p, a, button, span, div")) { const t = e.innerText?.trim(); if (SR[t] && e.children.length) e.textContent = SR[t]; } }, SR);
  // a now
  let p = await fresh("/?home"); await note(p, "Now (0.3.85): chefmealan.com, English for everyone. No switch."); await shot(p, "r236a"); await p.context().close();
  // b the suggestion on the English page, phone in Serbian
  p = await fresh("/?home"); await sw(p, "en"); await ask(p); await note(p, "New: a phone set to Serbian sees this once, above the English page. Na srpskom opens chefmealan.com/sr. Continue in English stays here, and it does not ask again."); await shot(p, "r236b"); await p.context().close();
  // c the Serbian home page
  p = await fresh("/sr?home"); await serbian(p); await sw(p, "sr"); await note(p, "New: chefmealan.com/sr, the same page in Srpski. The switch shows SR, the language that is on. A tap opens English and Srpski."); await shot(p, "r236c"); await p.context().close();
  // d the switch alone on the English page, any phone
  p = await fresh("/?home"); await sw(p, "en"); await note(p, "New: on any phone the switch is in the header. It shows the language that is on: EN here, SR on the Serbian page. 44 px. The choice is kept on the phone and goes into the app with you."); await shot(p, "r236d"); await p.context().close();
  // e the app, opened straight from an invite link: same question on Welcome
  p = await fresh("/today", 900);
  const where = await p.evaluate(() => (document.querySelector(".welcome, main") ? (document.querySelector(".welcome") ? ".welcome" : "main") : "body"));
  await p.evaluate(() => { const t = document.querySelector(".l-top"); });
  await p.evaluate(({ where, mark }) => { const top = document.querySelector(where); const d = document.createElement("div");
    d.style.cssText = `background:#e8f0fd;color:#172742;padding:12px 16px 14px;font:600 15px/1.4 Nunito,system-ui,sans-serif;${mark};margin:10px`;
    d.innerHTML = '<div style="font-weight:800;font-size:16px">Chef Mealan je i na srpskom.</div><div style="font-size:13.5px;color:#3d4a63;margin-top:2px">Tvoj telefon je podešen na srpski.</div>'
      + '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap"><button style="min-height:44px;padding:0 18px;border:0;border-radius:999px;background:#2e7be8;color:#fff;font:800 15px Nunito,system-ui,sans-serif">Na srpskom</button>'
      + '<button style="min-height:44px;padding:0 16px;border:1.5px solid #c9d6ee;border-radius:999px;background:#fff;color:#1f5fc7;font:800 15px Nunito,system-ui,sans-serif">Continue in English</button></div>';
    top.prepend(d); }, { where, mark });
  await note(p, "New: someone who opens the app straight from a coach's invite, never having seen the home page, gets the same question once, on Welcome.", where);
  await shot(p, "r236e"); await p.context().close();
  // f the switch, opened
  p = await fresh("/?home"); await sw(p, "en", true); await note(p, "New: a tap on the button opens both languages, the one on ticked. A tap on the other switches the page, and the app with it."); await shot(p, "r236f"); await p.context().close();
  await b.close(); server.kill();
})();
