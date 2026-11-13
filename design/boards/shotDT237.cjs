// Board DT237 (Coach Milan 4 November 18:49 to 18:50, Draw both): the coach's copy of Your summary, in which language.
// Way 1: the client's language. Way 2: the coach's own language. Now: 0.3.87 (main dist, served here on 3402, ?coachdemo).
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3402", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.items = [];
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
// Nina's rows in Srpski, drafts by Claude
const ROWS = { "Goal and numbers": "Cilj i brojevi", "Goal": "Cilj", "Lose fat, set by Milan on 18 October": "Gubitak masti, postavio Milan 18. oktobra",
  "Your numbers on Today, Plan and Plate follow it.": "Tvoji brojevi na Danas, Plan i Tanjir prate ga.", "✓ Chef reads": "✓ Chef čita", "An average day": "Prosečan dan",
  "2,200 kcal · 180 g protein · 61 g fat": "2.200 kcal · 180 g proteina · 61 g masti", "Carbs and fat": "Ugljeni hidrati i masti", "Balanced": "Uravnoteženo",
  "How your day splits between carbs and fat.": "Kako se tvoj dan deli na ugljene hidrate i masti.", "PD target": "PD cilj", "8.2 on an average day": "8,2 prosečnog dana",
  "Every plate and food is marked against the day's own target.": "Svaki tanjir i namirnica mere se prema cilju tog dana.", "Your day": "Tvoj dan", "Weekdays": "Radni dani",
  "Work, fixed hours, 08:00 to 16:00, mostly sitting": "Posao, fiksno radno vreme, 08:00 do 16:00, uglavnom sedenje",
  "How much a day without training burns; meal times fit around work.": "Koliko troši dan bez treninga; obroci se uklapaju oko posla.", "Numbers only": "Samo brojevi",
  "Wake-up and bedtime": "Buđenje i spavanje", "Before 6:00 · 22:00 to midnight": "Pre 6:00 · 22:00 do ponoći", "Your meals at 06:30, 13:15 and 20:00.": "Tvoji obroci u 06:30, 13:15 i 20:00.",
  "How you eat": "Kako jedeš", "Meals": "Obroci", "3 a day, 06:30, 13:15 and 20:00": "3 dnevno, 06:30, 13:15 i 20:00", "Your slots on Plan and Today.": "Tvoja mesta na Plan i Danas.",
  "Where you eat": "Gde jedeš", "Cook at home · Canteen at work": "Kuvam kod kuće · Menza na poslu" };
// the coach's own screens in Srpski (way 2, a coach whose app is in Srpski)
const CHROME = { "‹ Clients · 6 waiting": "‹ Klijenti · 6 čeka", "Today": "Danas", "Week": "Nedelja", "Shared (5)": "Podeljeno (5)", "Nina's profile": "Profil: Nina",
  "Lose fat · 2,200 kcal · 180 g protein · week 3": "Gubitak masti · 2.200 kcal · 180 g proteina · 3. nedelja", "Check-in: Wednesday": "Provera: sreda",
  "What changed since you last looked": "Šta se promenilo otkad si pogledao" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const fresh = async (path, { sex = "male", lang = "en" } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" });
    const p = await ctx.newPage();
    await p.addInitScript(({ s, sex, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-region", "munich"); if (lang !== "en") localStorage.setItem("chefmealan-lang", lang);
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex, birthYear: 1990, heightCm: 168, weightKg: 64, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { s: seed, sex, lang });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1800);
    return p;
  };
  const tidy = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav")) el.style.display = "none"; else if (el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; }
    for (const t of document.querySelectorAll(".toast, .chef-fab, [class*=fab], .app-notice, .numbers-changed")) t.style.display = "none"; });
  const shot = async (p, name, top = 0) => { await p.evaluate((y) => window.scrollTo(0, y), top); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
  const note = (p, t, where = "main") => p.evaluate(({ t, NOTE, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const m = document.querySelector(where) || document.body; m.prepend(d); }, { t, NOTE, where });
  const swap = (p, map, sel) => p.evaluate(({ map, sel }) => { for (const root of document.querySelectorAll(sel)) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const ns = []; let n; while ((n = w.nextNode())) ns.push(n);
      for (const n of ns) { const t = n.textContent.trim(); if (map[t]) n.textContent = n.textContent.replace(t, map[t]); } } }, { map, sel });
  // the coach's change list, with one line for the switch instead of every row
  const changeCard = (p, at, line, srHead = false) => p.evaluate(({ at, line, mark, srHead }) => { const old = document.querySelector(".profile-changes"); const c = document.createElement("section"); c.className = "card profile-changes"; c.style.cssText = mark;
      c.innerHTML = `<b>${srHead ? "Šta se promenilo otkad si pogledao" : "What changed since you last looked"}</b><div class="change-row"><small class="change-at">${at}</small><span>${line}</span></div>`;
      if (old) old.replaceWith(c); else document.querySelector(".cp-tabs").after(c); }, { at, line, mark, srHead });
  const coach = async (tab) => { const p = await fresh("/today?coachdemo"); await p.locator(".bottom-nav").getByText("Clients").click(); await p.waitForTimeout(1000);
    await p.getByText(/^Profile: 2 changes since you looked$/).last().click(); await p.waitForTimeout(1000); if (tab) { await p.getByRole("tab", { name: tab }).click(); await p.waitForTimeout(800); } await tidy(p); return p; };
  const toCard = (p) => p.evaluate(() => { const e = document.querySelector("p.label"); const all = [...document.querySelectorAll(".shared-profile p.label")]; const t = (all[0] || e); return t ? Math.max(0, t.getBoundingClientRect().top + window.scrollY - 150) : 0; });
  // a now: what changed, on the client's page
  let p = await coach(); await note(p, "Now (0.3.87): Nina's page. Each change to her profile is a line, with its date.", ".client-page"); await p.evaluate(() => { const n = document.querySelector(".bnote"); const h = document.querySelector(".profile-changes"); h.parentElement.insertBefore(n, h); }); await shot(p, "r237a"); await p.context().close();
  // b now: Nina's profile, on Goal
  p = await coach("Goal"); let y;
  await p.evaluate(({ NOTE }) => { const t = document.querySelector(".shared-profile p.label"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "Now: the copy Nina's phone sends is in English. Every row is a sentence, written on her phone."; t.parentElement.insertBefore(d, t); }, { NOTE });
  y = await toCard(p); await shot(p, "r237b", y); await p.context().close();
  // c the client's Language page, way 1
  const lang = async (text) => { const p = await fresh("/menu", { sex: "female", lang: "sr-Latn" }); await p.getByRole("button", { name: /Podešavanja|Settings/ }).first().click(); await p.waitForTimeout(700);
    await p.getByText(/^(Jezik|Language)$/).first().click(); await p.waitForTimeout(700); await tidy(p);
    await p.evaluate(({ text, mark }) => { const r = document.querySelector(".lang-rows"); const d = document.createElement("p"); d.className = "small"; d.style.cssText = `${mark};background:#e8f0fd;padding:10px 12px;margin:12px 0;font-size:15px;line-height:1.45;color:#172742`; d.textContent = text; r.after(d); }, { text, mark });
    return p; };
  p = await lang("Tvoj trener čita tvoj pregled na ovom jeziku. Ako promeniš jezik, trener vidi jedan red: da si prešla na srpski."); await note(p, "Way 1, Nina's phone: one line under the languages. Her coach reads her summary in the language she picks here. Nothing to choose; the line says it."); await shot(p, "r237c"); await p.context().close();
  // d way 1, the coach (app in English): Nina's rows in Srpski
  p = await coach("Goal"); await swap(p, ROWS, ".shared-profile .sum-part, .shared-profile .card");
  await p.evaluate(({ NOTE, mark }) => { const t = document.querySelector(".shared-profile p.label"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "Way 1, the coach: the app stays English, Nina's rows come in Srpski, as her phone writes them. A coach with clients in two languages sees two languages here."; t.parentElement.insertBefore(d, t); for (const s of document.querySelectorAll(".shared-profile .sum-part")) s.style.cssText = mark; }, { NOTE, mark });
  y = await toCard(p); await shot(p, "r237d", y); await p.context().close();
  // e way 1, the change list: one line
  p = await coach(); await changeCard(p, "4 Nov", "Nina switched to Srpski. Her profile comes in Srpski from now on. Nothing else changed.");
  await note(p, "Way 1 and way 2: switching the language is one line in the list, not every row as changed. The app compares Nina's answers, not the words.", ".client-page"); await p.evaluate(() => { const n = document.querySelector(".bnote"); const h = document.querySelector(".profile-changes"); h.parentElement.insertBefore(n, h); }); await shot(p, "r237e"); await p.context().close();
  // f way 2, the client's Language page
  p = await lang("Tvoj trener čita tvoj pregled na svom jeziku, onom koji je izabrao u svojoj aplikaciji."); await note(p, "Way 2, Nina's phone: the same line, saying her coach reads her summary in the coach's own language."); await shot(p, "r237f"); await p.context().close();
  // g way 2, a coach whose app is in English: Nina's profile in English, as now, and one line in the list
  p = await coach(); await changeCard(p, "4 Nov", "Nina switched to Srpski. Her profile shows in your language, English.");
  await note(p, "Way 2, a coach in English: Nina's profile stays English, whatever Nina picks. The list says she switched, so the coach knows which language to write the notes in.", ".client-page"); await p.evaluate(() => { const n = document.querySelector(".bnote"); const h = document.querySelector(".profile-changes"); h.parentElement.insertBefore(n, h); }); await shot(p, "r237g"); await p.context().close();
  // h way 2, a coach whose app is in Srpski: the whole page Srpski, Nina's rows with it
  p = await coach("Goal"); await swap(p, { ...ROWS, ...CHROME }, "main");
  await p.evaluate(() => { const l = document.querySelector(".shared-profile p.label"); l.textContent = "Profil: Nina"; const m = l.nextElementSibling; if (m) m.textContent = "Kako je danas: delovi koje Nina deli, uvek ažurni. Poslednja promena 2. nov."; });
  await p.evaluate(({ NOTE, mark }) => { const t = document.querySelector(".shared-profile p.label"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "Way 2, a coach in Srpski: the page and Nina's rows in Srpski, also for a client whose app is in English. Every client reads the same for one coach. No button here: Nina's language is the coach's."; t.parentElement.insertBefore(d, t); for (const s of document.querySelectorAll(".shared-profile .sum-part")) s.style.cssText = mark; }, { NOTE, mark });
  y = await toCard(p); await shot(p, "r237h", y); await p.context().close();
  // v2 (Coach Milan 19:11 to 19:12): a button on the card shows it in the client's language, when it is not the coach's; one tap back
  const btn = (p, label, note) => p.evaluate(({ label, note, NOTE, mark }) => { const l = document.querySelector(".shared-profile p.label"); const m = l.nextElementSibling;
      const r = document.createElement("div"); r.className = "button-row"; r.style.cssText = "margin:8px 0 4px"; const x = document.createElement("button"); x.className = "pill"; x.textContent = label; x.style.cssText = `min-height:44px;${mark}`; r.appendChild(x); m.after(r);
      const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; l.parentElement.insertBefore(d, l); }, { label, note, NOTE, mark });
  p = await coach("Goal"); await btn(p, "See it in Srpski, as Nina does", "v2, a coach in English: Nina's app is in Srpski, so her card has one button. A tap shows her rows in Srpski, as she sees them. Only on this card, only until you tap back or leave the page.");
  y = await toCard(p); await shot(p, "r237i", y); await p.context().close();
  p = await coach("Goal"); await swap(p, ROWS, ".shared-profile .sum-part, .shared-profile .card"); await btn(p, "Back to English", "v2, after the tap: Nina's rows in Srpski, the rest of the page in English. Back to English puts it back. Nothing is kept; the next visit opens in English.");
  await p.evaluate((mark) => { for (const s of document.querySelectorAll(".shared-profile .sum-part")) s.style.cssText = mark; }, mark);
  y = await toCard(p); await shot(p, "r237j", y); await p.context().close();
  await b.close(); server.kill();
})();
