// Board Stories165 (Coach Milan 2 November 18:30 to 19:00): DT222 the done screen of cook mode as the start of the next step,
// DT223 a photo of each step in cook mode, DT224 the Plate's start screen without Craft, Make, Eat until it holds something.
// Now: 0.3.58 as it runs (main dist on 3387). New: the same pages with the change drawn in. Nothing in the repo changes.
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


  const toCook = async (p) => {
    await p.locator("nav button").filter({ hasText: "Recipes" }).first().click(); await p.waitForTimeout(700);
    await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(700);
    await p.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await p.waitForTimeout(1200);
  };
  const svgMark = (p) => p.evaluate(() => (document.querySelector("header svg")?.outerHTML || "").replace(/width="\d+"/, 'width="18"').replace(/height="\d+"/, 'height="18"'));

  // ---- DT222: the done screen ----
  let p = await fresh({ items: [], title: "" }, "/today");
  await toCook(p);
  for (let i = 0; i < 40; i++) { const d = p.locator(".cook-mode").getByRole("button", { name: "Done ✓" }); if (await d.count()) { await d.click(); break; } await p.locator(".cook-mode").getByRole("button", { name: /Next/ }).click(); await p.waitForTimeout(120); }
  await p.waitForTimeout(500);
  await p.evaluate((mark) => { const c = document.querySelector(".cook-done"); if (c) c.parentElement.style.cssText += ""; for (const el of [document.querySelector(".cook-done"), document.querySelector(".cook-under")]) if (el) el.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.58): Done, then a paragraph on what to do on Make. The next step is a wall of words.", ".cook-mode");
  await shot(p, "r222a", false);
  const done = (p, withPhoto) => p.evaluate(({ mark, crepePic, withPhoto }) => {
    document.querySelector(".bnote")?.remove();
    const c = document.querySelector(".cook-done"); const box = c.parentElement;
    for (const el of [...box.children]) if (el !== c && !el.classList.contains("cook-ticks") && (el.matches(".pill, .cook-under, .link"))) el.remove();
    c.innerHTML = `<div aria-hidden="true">🍽️</div><b>Done. Enjoy your meal.</b><small>4 steps, 38 minutes. Now a photo of your plate, then eat.</small>`;
    const photo = withPhoto
      ? `<div style="${mark};padding:0;border-radius:16px;overflow:hidden;position:relative"><img src="${crepePic}" style="display:block;width:100%;height:220px;object-fit:cover"><span style="position:absolute;left:10px;bottom:10px;background:#fff;border-radius:999px;padding:4px 10px;font-size:13px;font-weight:800;color:#172742">Your meal, 19:12</span></div><button class="link" style="align-self:center;min-height:44px">Take it again</button>`
      : `<button class="pill pill-wide" style="${mark};min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border-style:dashed;font-size:18px"><span style="font-size:30px">📷</span>Photo of your meal<small style="font-size:13px;font-weight:600;color:#5b6b8a">It goes on the meal's card and the recipe</small></button>`;
    c.insertAdjacentHTML("afterend", `<div style="display:flex;flex-direction:column;gap:10px">${photo}<button class="pill pill-wide pill-primary" style="${mark};min-height:52px">Cooked. Next: Eat ›</button><div style="display:flex;justify-content:space-between;gap:8px"><button class="link" style="min-height:44px">‹ Last step</button><button class="link" style="min-height:44px">Make: step photos and notes ›</button></div></div>`);
  }, { mark, crepePic, withPhoto });
  await done(p, false);
  await note(p, "New: Done, how long it took, and the next step: the photo of your meal, big. Then one button: Cooked. Next: Eat. Make is a small link.", ".cook-mode");
  await shot(p, "r222b", false);
  await done(p, true);
  await note(p, "New: with the photo taken. Take it again under it; Cooked. Next: Eat opens Eat with this photo on the meal.", ".cook-mode");
  await shot(p, "r222c", false);
  await p.context().close();

  // ---- DT223: a photo of each step in cook mode ----
  p = await fresh({ items: [], title: "" }, "/today");
  await toCook(p);
  for (const tab of await p.locator(".cook-mode [role=tab]").all()) { if (/^3/.test((await tab.textContent()).trim())) { await tab.click(); break; } }
  await p.waitForTimeout(500);
  await p.evaluate((mark) => { const s = document.querySelector(".cook-step"); if (s) s.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.58): a step shows a picture only when the recipe has one. Your Sarma had none; there is no way to add one here.", ".cook-mode");
  await shot(p, "r223a", false);
  await p.evaluate((mark) => { document.querySelector(".bnote")?.remove(); const s = document.querySelector(".cook-step"); s.style.cssText = s.style.cssText.replace(/outline[^;]*;?/g, "");
    const t = s.querySelector(".cook-text"); t.insertAdjacentHTML("afterend", `<button class="pill pill-small cook-add-pic" style="${mark};align-self:flex-start;min-height:44px;margin-top:6px">📷 Add a photo of this step</button>`); }, mark);
  await note(p, "New: under the step, a small button: Add a photo of this step. The camera opens; cooking goes on.", ".cook-mode");
  await shot(p, "r223b", false);
  const quark = "data:image/webp;base64," + require("node:fs").readFileSync("/home/claude/platemate-scanner/public/landing/hero/waffle-m.webp").toString("base64");
  await p.evaluate(({ mark, quark }) => { document.querySelector(".bnote")?.remove(); document.querySelector(".cook-add-pic")?.remove(); const s = document.querySelector(".cook-step");
    s.insertAdjacentHTML("afterbegin", `<div style="${mark};padding:0;border-radius:12px;overflow:hidden"><img src="${quark}" style="display:block;width:100%;height:180px;object-fit:cover"></div><small class="cook-pic-label" style="display:flex;justify-content:space-between;align-items:center;letter-spacing:0;font-weight:700">Your photo · kept with the recipe<button class="link" style="min-height:44px;font-size:13px">Take it again</button></small>`); }, { mark, quark });
  await note(p, "New: the photo sits on top of its step, now and the next time you cook it. It is the recipe's step picture, as on Make.", ".cook-mode");
  await shot(p, "r223c", false);
  await p.context().close();

  // ---- DT224: the Plate's start screen ----
  p = await fresh({ items: [], title: "" }, "/plate");
  await p.evaluate((mark) => { const b = document.querySelector(".phase-bar"); if (b) b.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.58): an empty Plate already shows Craft, Make, Eat above What are you craving?");
  await cut(p, "r224a", "main", 900);
  await p.evaluate(() => { document.querySelector(".bnote")?.remove(); document.querySelector(".phase-bar")?.remove(); });
  await note(p, "New: an empty Plate is the start screen: What are you craving?, alone. No Craft, Make, Eat yet.");
  await cut(p, "r224b", "main", 900);
  await p.context().close();
  p = await fresh({ items: [crepes[4], crepes[5]], title: "" }, "/plate");
  await p.evaluate((mark) => { const b = document.querySelector(".phase-bar"); if (b) b.style.cssText += ";" + mark; }, mark);
  await note(p, "New: once the Plate holds something (a food, a recipe or a photo), Craft, Make, Eat appears: now you are crafting.");
  await cut(p, "r224c", "main", 900);
  await p.context().close();
  await b.close();
})();
