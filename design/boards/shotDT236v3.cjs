// Board DT236 v3 (Coach Milan 5 November 11:26: the German home page, and DE in the choice). Earlier: DT236 (Coach Milan 4 November 15:25 and 15:30, Draw): the home page in Srpski, a language switch, and the suggestion to
// switch when the phone is in Serbian. chefmealan.com stays English. Now: 0.3.85 (main dist, served here on 3398).
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3405", U = `http://127.0.0.1:${PORT}`;
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const fresh = async (path, h = 844) => { const ctx = await b.newContext({ viewport: { width: 390, height: h }, deviceScaleFactor: 2, locale: "de-DE" }); const p = await ctx.newPage(); await p.goto(U + path); await p.waitForTimeout(2200); await p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, [class*=fab]")) t.style.display = "none"; }); return p; };
  const note = (p, t, where = "body") => p.evaluate(({ t, NOTE, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const m = document.querySelector(where) || document.body; m.prepend(d); }, { t, NOTE, where });
  const shot = async (p, name) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(250); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
  // the switch in the header: EN · SR, the one on is filled
  // v2 (Coach Milan 16:18): the button shows the language that is on; a tap opens both, the one on ticked
  const sw = (p, on, open = false) => p.evaluate(({ on, open, mark }) => { const h = document.querySelector(".l-top"); const signIn = [...h.querySelectorAll("a,button")].pop();
    const nav = h.querySelector(".l-topnav"); if (nav) nav.style.gap = "10px"; const wrap = document.createElement("span"); wrap.style.cssText = "position:relative;display:inline-block";
    const x = document.createElement("button"); x.textContent = ({ en: "EN", sr: "SR", de: "DE" }[on]) + " ▾"; x.setAttribute("aria-label", { en: "Language: English", sr: "Jezik: Srpski", de: "Sprache: Deutsch" }[on]);
    x.style.cssText = `min-width:44px;min-height:44px;padding:0 9px;white-space:nowrap;border:1.5px solid #c9d6ee;border-radius:999px;background:#fff;color:#1f5fc7;font:800 14px Nunito,system-ui,sans-serif;${mark}`;
    wrap.appendChild(x);
    if (open) { const m = document.createElement("div"); m.style.cssText = "position:absolute;right:0;top:52px;z-index:50;background:#fff;border:1.5px solid #c9d6ee;border-radius:14px;box-shadow:0 8px 24px rgba(23,39,66,.18);padding:6px;width:190px";
      for (const [k, l] of [["en", "English"], ["sr", "Srpski (latinica)"], ["de", "Deutsch"]]) { const r = document.createElement("button"); r.innerHTML = (k === on ? "✓ " : "<span style=\"display:inline-block;width:1.1em\"></span>") + l;
        r.style.cssText = `display:block;width:100%;text-align:left;min-height:44px;border:0;border-radius:10px;background:${k === on ? "#e8f0fd" : "#fff"};color:#172742;font:800 15px Nunito,system-ui,sans-serif;padding:0 12px`; m.appendChild(r); }
      wrap.appendChild(m); }
    signIn.parentElement.insertBefore(wrap, signIn); }, { on, open, mark });
  const fit = (p, outline = false) => p.evaluate(({ mark, outline }) => { const h = document.querySelector(".l-top"); if (outline) h.style.cssText += ";" + mark; h.style.setProperty("padding-left", "14px", "important"); h.style.setProperty("padding-right", "14px", "important");
    const nav = h.querySelector(".l-topnav"); if (nav) nav.style.gap = "6px";
    const br = h.querySelector(".l-brand"); if (br) { br.style.gap = "6px"; const nm = br.querySelector("b"); if (nm) nm.style.fontSize = "17px"; const sv = br.querySelector("svg"); if (sv) { sv.setAttribute("height", "26"); sv.setAttribute("width", "35"); } }
    for (const e of h.querySelectorAll("button")) { const t = e.textContent.trim(); if (/^(EN|SR|DE) ▾$/.test(t)) { e.textContent = t.slice(0, 2); e.style.padding = "0 6px"; } } }, { mark, outline });
  // the suggestion, above the header, once
  const ask = (p, where = ".l-top") => p.evaluate(({ mark, where }) => { const top = document.querySelector(where); const d = document.createElement("div");
    d.style.cssText = `background:#e8f0fd;color:#172742;padding:12px 16px 14px;font:600 15px/1.4 Nunito,system-ui,sans-serif;${mark};margin:6px`;
    d.innerHTML = '<div style="font-weight:800;font-size:16px">Chef Mealan gibt es auch auf Deutsch.</div><div style="font-size:13.5px;color:#3d4a63;margin-top:2px">Dein Handy ist auf Deutsch eingestellt.</div>'
      + '<div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap"><button style="min-height:44px;padding:0 18px;border:0;border-radius:999px;background:#2e7be8;color:#fff;font:800 15px Nunito,system-ui,sans-serif">Auf Deutsch</button>'
      + '<button style="min-height:44px;padding:0 16px;border:1.5px solid #c9d6ee;border-radius:999px;background:#fff;color:#1f5fc7;font:800 15px Nunito,system-ui,sans-serif">Continue in English</button></div>';
    top.parentElement.insertBefore(d, top); }, { mark, where });
  const SR0 = { "Coaches": "Treneri", "Sign in": "Prijava", "FOR PEOPLE WITH A NUTRITION PLAN": "ZA ONE KOJI IMAJU PLAN ISHRANE", "For people with a nutrition plan": "Za one koji imaju plan ishrane", "Live your nutrition plan, day by day.": "Živi svoj plan ishrane, dan po dan.",
    "Chef Mealan plans your meals with you, and finds the meal that still fits when the day surprises you.": "Chef Mealan sa tobom planira obroke, i nađe obrok koji se i dalje uklapa kad te dan iznenadi.",
    "Join the beta, free": "Pridruži se beti, besplatno", "Use it most days for four weeks, and tell us what breaks.": "Koristi je većinu dana četiri nedelje, i javi nam šta ne radi.",
    "Or join the waiting list": "Ili se upiši na listu čekanja", "Milan's own cooking, at home.": "Milanova kuhinja, kod kuće." };
  const german = (p) => p.evaluate((SR) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const ns = []; let n; while ((n = w.nextNode())) ns.push(n);
    for (const n of ns) { const t = n.textContent.trim(); if (SR[t]) n.textContent = n.textContent.replace(t, SR[t]); }
    for (const e of document.querySelectorAll("h1, p, a, button, span, div")) { const t = e.innerText?.trim(); if (SR[t] && e.children.length) e.textContent = SR[t]; } }, DE);
  // a now
  const DE = { "Coaches": "Coaches", "Sign in": "Anmelden", "FOR PEOPLE WITH A NUTRITION PLAN": "FÜR MENSCHEN MIT ERNÄHRUNGSPLAN", "For people with a nutrition plan": "Für Menschen mit Ernährungsplan",
    "Live your nutrition plan, day by day.": "Leb deinen Ernährungsplan, Tag für Tag.",
    "Chef Mealan plans your meals with you, and finds the meal that still fits when the day surprises you.": "Chef Mealan plant deine Mahlzeiten mit dir und findet die Mahlzeit, die noch passt, wenn der Tag dich überrascht.",
    "Join the beta, free": "Bei der Beta mitmachen, kostenlos", "Use it most days for four weeks, and tell us what breaks.": "Nutze sie vier Wochen lang an den meisten Tagen und sag uns, was nicht funktioniert.",
    "Or join the waiting list": "Oder auf die Warteliste", "Milan's own cooking, at home.": "Milans eigene Küche, zu Hause." };
  let p = await fresh("/?home"); await sw(p, "en"); await fit(p); await ask(p); await note(p, "New (v3): a phone set to German sees this once, above the English page. Auf Deutsch opens chefmealan.com/de. Continue in English stays here, and the box does not come back."); await shot(p, "r236g"); await p.context().close();
  p = await fresh("/de?home"); await german(p); await sw(p, "de"); await note(p, "German drafts on chefmealan.com/de, the header as it is drawn in v2: Anmelden runs past the edge of the phone. The clips stay in English for now, on all three pages."); await shot(p, "r236h"); await p.context().close();
  p = await fresh("/?home"); await sw(p, "en", true); await fit(p); await note(p, "New (v3): the switch opens three: English, Srpski, Deutsch. A tap switches the page, and the app with it."); await shot(p, "r236i"); await p.context().close();
  // the German header on a phone: Anmelden runs past the edge; fitted with smaller gaps
  p = await fresh("/de?home"); await german(p); await sw(p, "de");
  const over = await p.evaluate(() => { const h = document.querySelector(".l-top"); return [...h.querySelectorAll("a,button")].map((e) => Math.round(e.getBoundingClientRect().right)); });
  console.log("header rights", over);
  await fit(p, true);
  const after = await p.evaluate(() => { const h = document.querySelector(".l-top"); return [...h.querySelectorAll("a,button")].map((e) => Math.round(e.getBoundingClientRect().right)); });
  console.log("after", after);
  await note(p, "New (v3): on a phone the header gets smaller gaps, the name a little smaller, and the switch shows DE without the arrow. All four fit in German, so they fit in English and Srpski too."); await shot(p, "r236j"); await p.context().close();
  await b.close(); server.kill();
})();
