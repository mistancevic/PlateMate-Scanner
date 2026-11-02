// Board DT215 (Coach Milan 2 November 13:xx proposed; 22:33 draw it): voice settings. A Voice row on Me opens Voice: read aloud
// on or off, the phone's voices with a sample, the speed, and whether next, back and stop cut in. Cook mode links to it. Now:
// 0.3.63 (main dist on 3387). New: the same pages with the change drawn in. Nothing in the repo changes.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3387";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8"));
const crepePic = "data:image/webp;base64," + fs.readFileSync("/home/claude/platemate-scanner/public/landing/hero/waffle-m.webp").toString("base64");
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
const F = (id, name, calories, protein, fats, carbs, fiber = 0) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber, photo: undefined, photos: undefined, icon: undefined, barcode: undefined, table: undefined, places: [] });
const crepes = [[104, F("eg", "Eggs", 143, 12.6, 9.5, 0.7)], [100, F("mi", "Milk 1.5%", 47, 3.4, 1.5, 4.9)], [35, F("wf", "Wheat flour, white", 364, 10, 1, 76, 2.7)], [25, F("wh", "vanilla whey protein powder", 380, 78, 6, 8)], [180, F("qu", "Quark, low fat (Magerquark)", 67, 12, 0.2, 4)], [81, F("ba", "Banana", 89, 1.1, 0.3, 22.8, 2.6)], [15, F("cc", "chocolate chips", 500, 5, 28, 60, 4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Whisk [[i:eg|eggs]], [[i:mi|milk]], [[i:wf|wheat flour]] and [[i:wh|vanilla whey protein powder]] in a bowl until smooth.", "Heat a pan on the stovetop at 180 °C. Pour in batter and cook each crêpe for 2 minutes per side until golden.", "Stir [[i:qu|quark]] in a bowl until creamy. Slice [[i:ba|banana]] into thin pieces.", "Fill the crêpes, fold them over, and scatter [[i:cc|chocolate chips]] on top to serve."];
const TITLE = "Vanilla protein crepes with sweet quark and banana";
const recipe = { id: "m-cr", title: TITLE, items: crepes, portion: 540, steps: STEPS, stepsFor: crepes.map((i) => i.food.name), savedAt: "2026-11-02T16:40:00Z" };
seed.feedback = [];
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const fresh = async (state = {}, path = "/today") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB", timezoneId: "Europe/Berlin" });
    const p = await ctx.newPage();
    const s = { ...seed, meals: [recipe], items: [], title: "", ...state };
    await p.addInitScript((s) => {
      window.SpeechRecognition = function () { this.start = () => {}; this.stop = () => {}; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-region", "munich"); localStorage.setItem("chefmealan-cook-voice", "on");
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, s);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1500);
    return p;
  };
  const hide = (p) => p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, .chat-fab, [class*=fab]")) t.style.display = "none"; for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (cs.position !== "fixed" || el.closest(".cook-mode") || el.classList.contains("cook-mode")) continue; if (el.tagName === "NAV" || el.querySelector("nav")) { if (el.getBoundingClientRect().top > 100) { el.style.position = "static"; document.body.appendChild(el); } } else el.style.display = "none"; } });
  const shot = async (p, name, full = true) => { await p.waitForTimeout(300); await hide(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot", name); };
  const note = (p, t, where = "main") => p.evaluate(({ t, NOTE, where }) => { document.querySelector(".bnote")?.remove(); const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const m = document.querySelector(where) || document.querySelector("main"); m.prepend(d); }, { t, NOTE, where });
  const cut = async (p, name, sel, h = 1300) => { await p.waitForTimeout(300); await hide(p); const y = await p.evaluate((sel) => { const e = document.querySelector(sel); return e ? Math.max(0, e.getBoundingClientRect().top + scrollY - 120) : 0; }, sel); await p.setViewportSize({ width: 390, height: h }); await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(250); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };




  // ---- the Menu: now, and with Settings ----
  let p = await fresh({ items: [], title: "" }, "/today");
  await p.locator("header button").last().click(); await p.waitForTimeout(700);
  await note(p, "Now (0.3.65): the Menu has Me (your profile), Foods, Support, About. No place for how the app itself behaves.", ".menu-list");
  await shot(p, "r215e");
  await p.evaluate((mark) => { document.querySelector(".bnote")?.remove(); const list = document.querySelector(".menu-list"); const rows = [...list.querySelectorAll(".menu-row")]; const foods = rows.find((r) => /Foods/.test(r.textContent));
    const row = foods.cloneNode(true); row.style.cssText += ";" + mark; row.querySelector(".menu-icon").textContent = "⚙️"; row.querySelector("b").outerHTML = `<span class="menu-row-text"><b>Settings</b><small>Voice while cooking · Language and Units coming soon</small></span>`; foods.after(row); }, mark);
  await note(p, "New: Settings in the Menu, under Foods: how the app works, not who you are. Voice is its first part.", ".menu-list");
  await shot(p, "r215f");
  // ---- the Settings list: Voice while cooking, and rows coming soon ----
  await p.evaluate((mark) => {
    const m = document.querySelector("main"); for (const ch of m.children) ch.style.display = "none";
    const row = (icon, name, line, soon) => `<button class="menu-row" style="${soon ? "opacity:.6;" : mark}"><span class="menu-icon">${icon}</span><span class="menu-row-text"><b>${name}</b><small>${line}</small></span>${soon ? `<span class="me-todo" style="background:var(--tint);color:var(--muted)">Coming soon</span>` : `<span aria-hidden="true">›</span>`}</button>`;
    m.insertAdjacentHTML("beforeend", `<div id="settings-list"><div class="step-head"><button class="link back-top" style="min-height:44px">‹ Back to Menu</button><h2 style="margin:4px 0">Settings</h2><p>How the app works for you, on this phone.</p></div>
      <div class="menu-list me-rows">${row("🔊", "Voice while cooking", "Read aloud · Daniel, English (UK) · normal speed · cut in on", false)}${row("🌐", "Language", "English. Serbian and German are coming.", true)}${row("⚖️", "Units", "Grams and millilitres. Ounces and cups are coming.", true)}</div></div>`);
    window.scrollTo(0, 0);
  }, mark);
  await shot(p, "r215g");
  await p.evaluate(() => document.querySelector("#settings-list")?.remove());
  // ---- the Voice page ----
  await p.evaluate((mark) => {
    const m = document.querySelector("main");
    const voices = [["Daniel", "English (UK)", true], ["Serena", "English (UK)", false], ["Samantha", "English (US)", false], ["Google UK", "English (UK)", false], ["Google Deutsch", "German", false]];
    const row = ([n, l, on]) => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)"><button class="choice${on ? " on" : ""}" style="flex:1;min-height:44px;justify-content:flex-start;text-align:left"><b>${n}</b>&nbsp;<small class="muted">${l}</small></button><button class="pill pill-small" style="min-height:44px;min-width:44px">▶ Sample</button></div>`;
    for (const ch of m.children) ch.style.display = "none"; m.insertAdjacentHTML("beforeend", `<div class="step-head"><button class="link back-top" style="min-height:44px">‹ Back to Settings</button><h2 style="margin:4px 0">Voice while cooking</h2><p>How Chef Mealan reads to you while you cook. Your phone's own voices: free, nothing leaves the phone.</p></div>
    <section class="card" style="${mark};padding:14px;margin:10px 0;display:flex;flex-direction:column;gap:8px"><b>Read aloud</b><div class="button-row"><button class="choice on" style="min-height:44px">On</button><button class="choice" style="min-height:44px">Off</button></div><small class="muted" style="font-size:13px">Off: the steps stay on the screen and the buttons steer. Cook mode asks once, as now, if this is not set.</small></section>
    <section class="card" style="${mark};padding:14px;margin:10px 0;display:flex;flex-direction:column;gap:4px"><b>Voice</b><small class="muted" style="font-size:13px">The voices on this phone, English first. ▶ Sample reads one step.</small>${voices.map(row).join("")}<button class="link" style="align-self:flex-start;min-height:44px">Show all 34 voices ›</button></section>
    <section class="card" style="${mark};padding:14px;margin:10px 0;display:flex;flex-direction:column;gap:8px"><b>Speed</b><div class="button-row"><button class="choice" style="min-height:44px">Slower</button><button class="choice on" style="min-height:44px">Normal</button><button class="choice" style="min-height:44px">Faster</button></div></section>
    <section class="card" style="${mark};padding:14px;margin:10px 0;display:flex;flex-direction:column;gap:8px"><b>Cut in</b><label style="display:flex;align-items:center;gap:10px;min-height:44px"><span style="width:44px;height:26px;border-radius:13px;background:#2e7be8;position:relative;display:inline-block"><span style="position:absolute;right:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff"></span></span><span>Next, back and stop cut in while I read</span></label><small class="muted" style="font-size:13px">On: say next and the reading stops and moves on. Off: I finish the sentence first.</small></section>
    <section class="card" style="padding:14px;margin:10px 0;display:flex;flex-direction:column;gap:4px;opacity:.7"><b>Chef Mealan's own voice</b><small class="muted" style="font-size:13px">Later (VO1): an AI voice that talks both ways. Not yet.</small></section>`);
    window.scrollTo(0, 0);
  }, mark);
  await shot(p, "r215c");
  await p.context().close();
  // ---- cook mode: a link to Voice ----
  p = await fresh({ items: [], title: "" }, "/today");
  await p.locator("nav button").filter({ hasText: "Recipes" }).first().click(); await p.waitForTimeout(700);
  await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(700);
  await p.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await p.waitForTimeout(1200);
  await p.evaluate((mark) => { const l = document.querySelector(".cook-listen"); if (!l) return; const off = [...l.querySelectorAll("button")].find((b) => /Voice off/.test(b.textContent));
    (off || l).insertAdjacentHTML("afterend", `<button class="link" style="${mark};min-height:44px;margin-left:8px">Voice ›</button>`); l.scrollIntoView({ block: "center" }); }, mark);
  await note(p, "New: in cook mode, next to Voice off, Voice › opens Voice while cooking straight away; cooking waits where it was.", ".cook-mode");
  await shot(p, "r215d", false);
  await p.context().close();
  await b.close();
})();
