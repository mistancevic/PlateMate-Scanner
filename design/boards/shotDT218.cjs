// Board Stories164 (Coach Milan 2 November 17:53 to 17:58): DT218 the strip after eating, DT219 a Plate stuck with a photo,
// DT220 two buttons named Lock the recipe, DT221 a short line when cook mode did not catch it. Now: 0.3.56 as it runs (main
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

  // ---- DT218: the strip after eating ----
  const eaten = new Date(Date.now() - 2 * 60000).toISOString();
  const card = { id: "fb-cr", meal: { ...recipe, id: "m-cr" }, recipeId: "m-cr", status: "eaten", taste: "DaaM good", notes: "", createdAt: eaten, photo: crepePic, photos: [crepePic] };
  const cook = { id: "c1", startedAt: eaten, title: TITLE, recipeId: "m-cr", stage: "carry", plate: {}, ui: {}, steps: 4, cardId: "fb-cr", eatenAt: eaten };
  let p = await fresh({ feedback: [card], cook });
  await p.evaluate((mark) => { const s = document.querySelector(".cook-strip"); if (s) s.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.56): after eating, the strip waits for the last question. Go on lands on Today, where nothing asks for 28 more minutes; there is no way to close it.");
  await shot(p, "r218a");
  // New: Go on opens the meal's card with the question, now
  await p.evaluate(({ mark, crepePic }) => {
    document.querySelector(".bnote")?.remove();
    const s = document.querySelector(".cook-strip"); if (s) { s.style.cssText = s.style.cssText.replace(/outline[^;]*;?/g, ""); const x = document.createElement("span"); x.textContent = "✕"; x.setAttribute("aria-label", "End the cook"); x.style.cssText = "flex:none;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;margin:-6px -8px -6px 0;font-size:18px;color:#5b6b8a;" + mark; s.appendChild(x); }
    const logCard = [...document.querySelectorAll(".log-card")].find((c) => /Vanilla protein crepes/.test(c.textContent));
    if (logCard) { logCard.style.cssText += ";" + mark; const svg = (document.querySelector("header svg")?.outerHTML || "").replace(/width="\d+"/, 'width="18"').replace(/height="\d+"/, 'height="18"');
      logCard.insertAdjacentHTML("beforeend", `<div class="carry-in" style="margin-top:10px"><div class="bubble mealan chef-line" style="display:block;width:100%;box-sizing:border-box"><span class="bubble-tag tag-chef" style="display:flex;align-items:center;gap:6px"><span style="display:inline-flex;width:18px;height:18px">${svg}</span>CHEF MEALAN</span><p style="font-weight:700">How did it carry you? Answer now, or in 28 minutes, when I ask.</p></div><div class="carry-acts" style="display:flex;gap:8px;flex-wrap:wrap"><button class="choice">Light and awake</button><button class="choice">Fine</button><button class="choice">Heavy, tired</button></div><small class="muted" style="display:block;font-size:13px;margin-top:6px">Your answer closes the cook: the strip goes, the card keeps it all.</small></div>`);
      logCard.scrollIntoView({ block: "center" }); }
  }, { mark, crepePic });
  await note(p, "New: Go on scrolls to the meal's card and lets you answer now. The ✕ on the strip ends the cook without the last answer; the card keeps everything else.");
  await shot(p, "r218b"); await p.context().close();

  // ---- DT219: a Plate stuck with a photo and no foods ----
  p = await fresh({ items: [], title: "", photo: { image: crepePic, at: new Date(Date.now() - 5 * 3600000).toISOString() } }, "/plate");
  await p.evaluate((mark) => { const l = document.querySelector(".mp-line"); if (l) l.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.56): the photo was read again and found 0 foods. It stays on the Plate, with no Empty plate: only Retake, which read it again.");
  await shot(p, "r219a");
  await p.evaluate((mark) => { document.querySelector(".bnote")?.remove(); const l = document.querySelector(".mp-line"); if (l) l.style.cssText = l.style.cssText.replace(/outline[^;]*;?/g, "");
    const top = document.querySelector(".plate-card .card-top"); if (top) top.insertAdjacentHTML("beforeend", `<button class="link plate-empty-link" style="${mark};padding:2px 6px">🗑 Empty plate</button>`); }, mark);
  await note(p, "New: Empty plate whenever the Plate has foods or a photo.");
  await shot(p, "r219b");
  await p.evaluate((mark) => { document.querySelector(".bnote")?.remove(); document.querySelector(".plate-empty-link")?.remove(); document.querySelector(".mp-line")?.remove();
    const svg = (document.querySelector("header svg")?.outerHTML || "").replace(/width="\d+"/, 'width="18"').replace(/height="\d+"/, 'height="18"');
    const card = document.querySelector(".plate-card"); if (card) card.insertAdjacentHTML("afterbegin", `<section style="${mark};padding:6px;margin:0 0 12px;display:flex;flex-direction:column;gap:10px"><div class="bubble mealan chef-line" style="display:block;width:100%;box-sizing:border-box"><span class="bubble-tag tag-chef" style="display:flex;align-items:center;gap:6px"><span style="display:inline-flex;width:18px;height:18px">${svg}</span>CHEF MEALAN</span><p style="font-weight:700">I could not find foods on this photo. Take it again, from above with the whole plate in, or add the foods yourself.</p></div><div style="display:flex;flex-direction:column;gap:8px"><button class="pill pill-primary" style="min-height:44px">Take it again</button><button class="pill" style="min-height:44px">Add the foods myself</button></div><small class="muted" style="font-size:13px">Your plate stays as it was; the photo is not kept.</small></section>`); }, mark);
  await note(p, "New: a read that finds no foods leaves the plate as it was. Chef Mealan says so, with Take it again.");
  await shot(p, "r219c"); await p.context().close();

  // ---- DT220: the two Lock the recipe buttons ----
  p = await fresh({ items: crepes, title: TITLE, plateAt: new Date().toISOString() }, "/plate");
  await cut(p, "r220a", "button.pill-wide", 900);
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate((mark) => { const bt = [...document.querySelectorAll("main button")].filter((x) => x.textContent.trim() === "Lock the recipe"); bt.forEach((b) => (b.style.cssText += ";" + mark)); }, mark);
  await note(p, "Now (0.3.56): on the Plate, Lock the recipe (white) opens How to make it.");
  await shot(p, "r220a");
  await p.evaluate((mark) => { document.querySelector(".bnote")?.remove(); const bt = [...document.querySelectorAll("main button")].filter((x) => x.textContent.trim() === "Lock the recipe"); bt.forEach((b) => { b.textContent = "How to make it ›"; }); }, mark);
  await note(p, "New: it says where it goes: How to make it ›.");
  await shot(p, "r220b");
  await p.getByRole("button", { name: /How to make it|Lock the recipe/ }).first().click().catch(() => {}); await p.waitForTimeout(1000);
  if (!(await p.locator("h2", { hasText: "How to make it" }).count())) { await p.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((x) => /How to make it ›/.test(x.textContent)); if (b) b.textContent = "Lock the recipe"; }); await p.getByRole("button", { name: "Lock the recipe" }).first().click(); await p.waitForTimeout(1000); }
  await p.evaluate((mark) => { const b = [...document.querySelectorAll("main button")].find((x) => x.textContent.trim() === "Lock the recipe"); if (b) b.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.56): under the steps, Lock the recipe again (blue). What the steps are for is not said.");
  await shot(p, "r220c");
  await p.evaluate((mark) => { document.querySelector(".bnote")?.remove(); const b = [...document.querySelectorAll("main button")].find((x) => x.textContent.trim() === "Lock the recipe"); if (b) { b.textContent = "Lock it and cook ›"; b.insertAdjacentHTML("beforebegin", `<small class="muted" style="display:block;font-size:13px;line-height:1.45;margin:0 0 8px;${mark};padding:6px">Make reads these steps aloud, one at a time, and you tick them as you go. Lock it and cook keeps them with the recipe.</small>`); } }, mark);
  await note(p, "New: one line says what the steps are for; the button says what comes next: Lock it and cook ›.");
  await shot(p, "r220d"); await p.context().close();

  // ---- DT221: when cook mode did not catch it ----
  p = await fresh({ items: [], title: "" }, "/today");
  await p.locator("nav button").filter({ hasText: "Recipes" }).first().click(); await p.waitForTimeout(700);
  await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(700);
  await p.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await p.waitForTimeout(1200);
  const heard = (said, answer, foot) => p.evaluate(({ said, answer, foot, mark }) => { document.querySelector(".cook-heard")?.remove(); const anchor = document.querySelector(".cook-buttons");
    anchor.insertAdjacentHTML("afterend", `<section class="cook-card cook-heard" style="${mark}"><small>YOU SAID</small><b>${said}</b><small>CHEF MEALAN</small><b>${answer}</b>${foot}</section>`); }, { said, answer, foot, mark });
  await heard("recipe", "I heard you, but that isn't something I can do yet. Say next, back, repeat, how much, timer, what's left or stop. Start with Chef to ask about the dish.", "");
  await note(p, "Now (0.3.56): when cook mode doesn't catch it, the phone reads all of this aloud, every command word included.", ".cook-mode");
  await shot(p, "r221a", false);
  await heard("recipe", "Sorry, say that again?", `<small class="muted" style="display:block;font-size:13px;line-height:1.45;margin-top:6px">You can say: next, back, repeat, how much rice, timer 5 minutes, what's left, stop. Start with Chef to ask about the dish.</small>`);
  await note(p, "New: the phone says only: Sorry, say that again? The words you can say stay on the screen, not read aloud.", ".cook-mode");
  await shot(p, "r221b", false); await p.context().close();
  await b.close();
})();
