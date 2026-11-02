// Board DT230 (Coach Milan 2 November 23:44 to 23:50): the Plate decides, so no Craft, Make, Eat on it; the bar starts after
// the Plate and its first step is Prep; a photo plate opens with the photo large, its own buttons under it. Now: 0.3.65 (main
// dist on 3387). New: the same pages with the change drawn in. Nothing in the repo changes.
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


  const PLATE = fs.readFileSync("/home/claude/platemate-scanner/tests/flows/plate.jpg");
  const pic = "data:image/jpeg;base64," + PLATE.toString("base64");
  const sch = F("ps", "Pork schnitzel, breaded, pan-fried", 250, 25, 14, 8), pot = F("po", "Roasted potatoes", 150, 2.5, 6, 22), lem = F("lj", "Lemon juice", 22, 0.4, 0.2, 7);
  const its = [[180, sch], [130, pot], [30, lem]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, est: { low: g * 0.7, high: g * 1.3 }, food: f }));
  // ---- now: a photo plate, Exploring ----
  let p = await fresh({ items: its, title: "Schnitzel with roasted potatoes", photo: { image: pic, at: new Date().toISOString(), who: "idea" }, pick: "exploring" }, "/plate");
  await p.evaluate((mark) => { const b = document.querySelector(".phase-bar"); if (b) b.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.65): after a read, Craft, Make, Eat sits on top, though the Plate is where you decide. The photo is small; it shows large only on a tap.");
  await cut(p, "r230a", "main", 1500);
  await p.evaluate(() => { document.querySelector(".bnote")?.remove(); document.querySelector(".phase-bar")?.remove(); });
  await p.locator(".mp-line").click(); await p.waitForTimeout(400);
  await p.evaluate(({ mark }) => {
    const big = document.querySelector(".mp-big"); if (big) big.style.cssText += ";" + mark;
    const row = document.querySelector(".mp-big-row"); if (row) row.innerHTML = `<small class="muted">Exploring a photo · not logged</small><span style="display:flex;gap:8px"><button class="pill pill-small" style="min-height:44px">📷 Retake</button><button class="pill pill-small" style="min-height:44px">＋ Photo</button></span>`;
    const link = document.querySelector(".mp-again-link"); if (link) link.style.cssText += ";" + mark;
  }, { mark });
  await note(p, "New: no bar on the Plate. The photo opens large, its foods on it; under it its own buttons: Retake and ＋ Photo, then Wrong foods? Help Chef Mealan read it.");
  await cut(p, "r230b", "main", 1500);
  await p.context().close();
  // ---- How to make it: the bar starts here, Prep first ----
  p = await fresh({ items: [], title: "" }, "/today");
  await p.locator("nav button").filter({ hasText: "Recipes" }).first().click(); await p.waitForTimeout(700);
  await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(700);
  await p.getByRole("button", { name: "Change it first" }).click(); await p.waitForTimeout(1200);
  // the Plate: Craft on paper, no bar; one door into preparing: Prepare it ›
  await p.evaluate((mark) => { document.querySelector(".phase-bar")?.remove(); const bt = [...document.querySelectorAll("main button")].find((x) => /^(How to make it ›|Lock it and cook ›|How to eat it ›)$/.test(x.textContent.trim())); if (bt) { bt.dataset.was = bt.textContent; bt.textContent = "Prepare it ›"; bt.style.cssText += ";" + mark; bt.scrollIntoView({ block: "center" }); } }, mark);
  await note(p, "New: the Plate is Craft on paper, a step of its own: no bar. One door out: Prepare it ›. Fit to my target stays on the Plate.");
  await cut(p, "r230e", "main", 1500);
  await p.evaluate(() => { document.querySelector(".bnote")?.remove(); const bt = [...document.querySelectorAll("main button")].find((x) => x.textContent.trim() === "Prepare it ›"); if (bt) bt.textContent = bt.dataset.was; });
  await p.reload(); await p.waitForTimeout(1200);
  await p.getByRole("button", { name: /How to make it ›|Lock it and cook ›|Lock the recipe/ }).first().click(); await p.waitForTimeout(900);
  await p.evaluate((mark) => { const b = document.querySelector(".phase-bar"); if (b) b.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.65): How to make it is still Craft, the same word as the Plate.");
  await cut(p, "r230c", "main", 1000);
  await p.evaluate((mark) => { document.querySelector(".bnote")?.remove(); const b = document.querySelector(".phase-bar"); if (!b) return; const s = b.querySelectorAll("span"); if (s[0]) s[0].lastChild.textContent = "Prep"; }, mark);
  await note(p, "New: Prepare it starts the three steps: Prep (how to make it, or how to eat it), Make (cooking or putting it together), Eat.");
  await cut(p, "r230d", "main", 1000);
  await p.context().close();
  await b.close();
})();
