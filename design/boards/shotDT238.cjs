// Board DT238 (Coach Milan 5 November 10:54 to 10:59): Deutsch as a beta for testers in Munich, and where long German words
// break the screens. Served from /home/claude/pmde, a scratch copy of 0.3.91 (never merged) with Claude's German drafts in the
// Srpski slot and German dates, so the screens show German as the drafts stand. "New" pictures are the same pages with the fix
// drawn in by style, blue outline and yellow note.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/pmde", PORT = "3404", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = [];
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = (id, name, calories, protein, fats, carbs, fiber = 0) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const salmon = [[180, F("sa", "Lachsfilet, roh", 208, 20, 13, 0)], [150, F("rc", "Basmatireis, trocken", 356, 8.5, 0.9, 78, 1.3)], [120, F("br", "Brokkoli", 34, 2.8, 0.4, 7, 2.6)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const fresh = async (path, { lang = "sr-Latn", width = 390, plate = false } = {}) => {
    const ctx = await b.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2, locale: lang === "en" ? "en-GB" : "de-DE", timezoneId: "Europe/Berlin" });
    const p = await ctx.newPage();
    const st = plate ? { ...seed, meals: [{ id: "m-sa", title: "Lachs, Reis und Brokkoli", items: salmon, portion: 450, steps: ["Reis kochen.", "Lachs 12 Minuten backen.", "Brokkoli dämpfen."], savedAt: "2026-11-01T18:00:00Z" }], items: salmon, title: "Lachs, Reis und Brokkoli" } : seed;
    await p.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-region", "munich"); localStorage.setItem("chefmealan-lang", lang);
      localStorage.setItem("chefmealan-personal", JSON.stringify({ name: "Ana", dayMode: "same", sex: "female", birthYear: 1992, heightCm: 168, weightKg: 64, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 4, where: ["Cook at home"], diet: "Everything" } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { s: st, lang });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1800);
    await p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, [class*=fab], .app-notice, .numbers-changed, [aria-label='Dismiss message']")) (t.closest(".toast, .app-notice") || t).style.display = "none"; });
    return p;
  };
  const shot = async (p, name, top = 0) => { await p.evaluate((y) => window.scrollTo(0, y), top); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
  const note = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const m = sel ? document.querySelector(sel) : null;
    if (m) m.before(d); else (document.querySelector("main") || document.body).prepend(d); }, { t, NOTE, sel });
  // the element that holds a text, and its row
  const byText = (p, re, fn, arg) => p.evaluate(({ re, fn, arg, mark, NOTE }) => { const rx = new RegExp(re); const el = [...document.querySelectorAll("button, a, b, span, p, small, h1, h2, div")].find((e) => rx.test((e.innerText || "").trim()) && e.children.length <= 3);
    if (!el) return null; return new Function("el", "arg", "mark", "NOTE", fn)(el, arg, mark, NOTE); }, { re: re.source, fn, arg, mark, NOTE });
  const topOf = (p, re, off = 160) => byText(p, re, "return Math.max(0, el.getBoundingClientRect().top + window.scrollY - arg)", off);
  const noteBtn = (p, re, t) => byText(p, re, "const d = document.createElement('div'); d.style.cssText = NOTE; d.textContent = arg; const row = (el.closest('button') || el).parentElement; row.before(d); return 1;", t);
  const noteAt = (p, re, t) => byText(p, re, "const d = document.createElement('div'); d.style.cssText = NOTE; d.textContent = arg; const row = el.closest('section, .card, article') || el.parentElement; row.before(d); return 1;", t);

  // a: Settings, Language, as it is (0.3.91, English)
  const lang = async (l) => { const p = await fresh("/menu", { lang: l }); await p.locator(".menu-row").filter({ hasText: /^.*(Settings|Einstellungen)/ }).first().click(); await p.waitForTimeout(700);
    await p.locator(".menu-row").filter({ hasText: /Language|Sprache/ }).first().click(); await p.waitForTimeout(800); return p; };
  let p = await lang("en"); await note(p, "Now (0.3.91): Deutsch is coming soon. It can't be picked.", ".lang-rows"); await shot(p, "r238a", 0); await p.context().close();
  // b: Deutsch (Beta), pickable
  p = await lang("en");
  await p.evaluate(({ mark }) => { const s = document.querySelector(".settings-soon"); s.classList.remove("settings-soon"); s.removeAttribute("aria-disabled"); s.style.cssText = mark;
    s.innerHTML = `<span class="menu-row-text"><b>Deutsch (Beta)</b><small>Chef Mealan and the screens, drafts by Claude, for testers. The safety answers stay in English until a German reader confirms them.</small></span>`; }, { mark });
  await note(p, "New: Deutsch (Beta) can be picked by anyone who finds it. English and Srpski stay as they are.", ".lang-rows"); await shot(p, "r238b", 0); await p.context().close();

  // c, d: Today, the three buttons under the day card
  p = await fresh("/today"); let y = await topOf(p, /^Tag planen$/, 330);
  await noteAt(p, /^Heute noch nichts geplant oder gegessen$/, "German drafts as they stand: the three buttons wrap to 3 and 4 lines. The meal is in small letters (mittagessen): the code makes it lower case.");
  y = await topOf(p, /^Tag planen$/, 360); await shot(p, "r238c", y); await p.context().close();
  p = await fresh("/today");
  await byText(p, /^Tag planen$/, `const row = el.parentElement; row.style.cssText += ';display:flex;flex-wrap:wrap;gap:8px;' + mark; const bs = [...row.children]; bs.forEach((x) => { x.style.flex = '1 1 auto'; x.style.whiteSpace = 'nowrap'; x.style.width = 'auto'; });
    bs[0].style.flexBasis = '100%'; for (const x of bs) for (const n of x.querySelectorAll('*')) n.style.whiteSpace = 'nowrap';
    const w = document.createTreeWalker(bs[0], NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) n.textContent = n.textContent.replace('mittagessen', 'Mittagessen'); bs[2].textContent = 'Gegessenes eintragen'; return 1;`);
  await noteAt(p, /^Heute noch nichts geplant oder gegessen$/, "New: the main button takes the whole row, the other two share the next. Each button stays on one line. Meal names keep their capital in German. Shorter: Gegessenes eintragen.");
  y = await topOf(p, /^Tag planen$/, 400); await shot(p, "r238d", y); await p.context().close();

  // e, f: the Plate, Fit and Prepare
  p = await fresh("/plate", { plate: true }); y = await topOf(p, /^An mein Ziel anpassen$/, 420);
  await noteBtn(p, /^An mein Ziel anpassen$/, "German drafts as they stand: An mein Ziel anpassen is cut at the edge of its button.");
  y = await topOf(p, /^An mein Ziel anpassen$/, 520); await shot(p, "r238e", y); await p.context().close();
  p = await fresh("/plate", { plate: true });
  await byText(p, /^An mein Ziel anpassen$/, `const btn = el.closest('button') || el; const row = btn.parentElement; row.style.cssText += ';display:flex;flex-wrap:wrap;gap:8px;' + mark; for (const x of row.children) { x.style.flex = '1 1 100%'; x.style.maxWidth = 'none'; x.style.width = '100%'; x.style.whiteSpace = 'nowrap'; } return 1;`);
  await noteBtn(p, /^An mein Ziel anpassen$/, "New: when the two don't fit side by side, they go one under the other, the whole width. In English nothing changes.");
  y = await topOf(p, /^An mein Ziel anpassen$/, 560); await shot(p, "r238f", y); await p.context().close();

  // g, h: Plan on a smaller phone (360 px): the wide button
  p = await fresh("/plan", { width: 360 }); y = await topOf(p, /^Offene Mahlzeiten mit Chef Mealan füllen$/, 380);
  await byText(p, /^Offene Mahlzeiten mit Chef Mealan füllen$/, "const d = document.createElement('div'); d.style.cssText = NOTE; d.textContent = arg; (el.closest('button') || el).before(d); return 1;", "German drafts on a smaller phone, 360 px wide: the button's words run past its edge.");
  y = await topOf(p, /^Offene Mahlzeiten mit Chef Mealan füllen$/, 480); await shot(p, "r238g", y); await p.context().close();
  p = await fresh("/plan", { width: 360 });
  await byText(p, /^Offene Mahlzeiten mit Chef Mealan füllen$/, `const btn = el.closest('button') || el; btn.style.cssText += ';white-space:normal;height:auto;min-height:44px;padding-block:10px;line-height:1.3;text-align:center;' + mark; for (const n of btn.querySelectorAll('*')) n.style.whiteSpace = 'normal'; return 1;`);
  await byText(p, /^Offene Mahlzeiten mit Chef Mealan füllen$/, "const d = document.createElement('div'); d.style.cssText = NOTE; d.textContent = arg; (el.closest('button') || el).before(d); return 1;", "New: a wide button may take two lines. The words are never cut.");
  y = await topOf(p, /^Offene Mahlzeiten mit Chef Mealan füllen$/, 500); await shot(p, "r238h", y); await p.context().close();

  // i, j: the head on a smaller phone: a long title and the goal line
  p = await fresh("/foods", { width: 360 }); await note(p, "German drafts on a smaller phone, 360 px wide: the title Lebensmittel cuts the goal line short, with three dots."); await shot(p, "r238i", 0); await p.context().close();
  p = await fresh("/foods", { width: 360 });
  await byText(p, /^Halten · PD [0-9,]+ heute$/, `const head = el.parentElement; head.style.cssText += ';flex-wrap:wrap;row-gap:0;' + mark; const last = head.lastElementChild; if (last && last !== el) last.style.marginLeft = 'auto'; el.style.cssText += ';order:3;flex-basis:100%;max-width:none;overflow:visible;text-overflow:clip;white-space:nowrap;margin:-4px 0 4px 44px;'; return 1;`);
  await note(p, "New: when the title is long, the goal line goes under it, whole."); await shot(p, "r238j", 0); await p.context().close();
  await b.close(); server.kill();
})();
