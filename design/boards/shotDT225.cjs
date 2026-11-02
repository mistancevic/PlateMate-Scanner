// Board Stories166 (Coach Milan 2 November 19:15 to 19:26): DT225 every time you ate a recipe, on its page: the date, how much,
// how it tasted, how it carried you and your own words; only you see it. Now: 0.3.59 as it runs (main dist on 3387). New: the
// same pages with the change drawn in. Nothing in the repo changes.
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



  const at = (d, h) => new Date(`2026-${d}T${h}:00`).toISOString();
  const card = (id, d, h, grams, taste, how, notes, pic) => ({ id, meal: { ...recipe, items: recipe.items.map((i) => ({ ...i, grams: Math.round(i.grams * grams) })) }, recipeId: "m-cr", status: "eaten", taste, notes, createdAt: at(d, h), ...(how ? { carry: { how, at: at(d, h) } } : {}), ...(pic ? { photo: crepePic, photos: [crepePic] } : {}) });
  const cards = [card("f3", "11-02", "12:40", 1, "DaaM good", "light", "I felt so energized. Kept me going until dinner.", true), card("f2", "10-29", "08:10", 1, "Good", "fine", "", false), card("f1", "10-24", "19:30", 1, "DaaM good", "heavy", "Too many chocolate chips at night.", true)];
  let p = await fresh({ items: [], title: "", feedback: cards }, "/today");
  await p.locator("nav button").filter({ hasText: "Recipes" }).first().click(); await p.waitForTimeout(700);
  if (!(await p.locator(".recipe-tile").count())) { await p.screenshot({ path: "/tmp/claude-0/-home-claude/a3625ff7-4226-57ca-879e-055f53d2dca0/scratchpad/dbg.png" }); }
  await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(900);
  await p.evaluate((mark) => { const c = document.querySelector(".rq-cooks"); if (c) c.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.59): the recipe sums up your cooks: how often, tasted, carried you. Not each time, not how much, not your words.");
  await cut(p, "r225a", ".rq-cooks", 1100);
  await p.evaluate(({ mark, crepePic }) => {
    document.querySelector(".bnote")?.remove(); const c = document.querySelector(".rq-cooks"); c.style.cssText = c.style.cssText.replace(/outline[^;]*;?/g, "");
    const row = (date, amount, taste, carry, words, pic) => `<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--line)">${pic ? `<img src="${crepePic}" style="width:52px;height:52px;border-radius:10px;object-fit:cover;flex:none">` : `<span style="width:52px;height:52px;border-radius:10px;background:var(--tint);flex:none;display:inline-flex;align-items:center;justify-content:center;font-size:22px">🍽️</span>`}<span style="display:flex;flex-direction:column;gap:2px;font-size:14px;line-height:1.4"><b>${date}</b><span>${amount} · ${taste}${carry ? ` · carried you: ${carry}` : ""}</span>${words ? `<i style="color:#172742">“${words}”</i>` : ""}</span></div>`;
    c.insertAdjacentHTML("afterend", `<section class="card" style="${mark};padding:14px 16px;margin:12px 0;display:flex;flex-direction:column;gap:4px"><b style="font-size:17px">Every time you ate it</b><small class="muted" style="font-size:13px">Only you see this. Your coach sees a meal you share.</small>${row("Today, 12:40 · cooked", "1 portion, 540 g", "DaaM good", "light and awake", "I felt so energized. Kept me going until dinner.", true)}${row("Thursday 29 October, 08:10 · from the fridge", "Half a portion, 270 g", "Good", "fine", "", false)}${row("Saturday 24 October, 19:30 · cooked", "1 portion, 540 g", "DaaM good", "heavy, tired", "Too many chocolate chips at night.", true)}<button class="link" style="align-self:flex-start;min-height:44px">All 3 ›</button></section>`);
  }, { mark, crepePic });
  await note(p, "New: under Your cooks, every time you ate it: the date and how, how much, the taste, how it carried you, and your words. Only you see it.");
  await cut(p, "r225b", ".rq-cooks", 1400);
  await p.context().close();

  // ---- the Eat page: your words, for you ----
  const cook = { id: "c1", startedAt: at("11-02", "12:00"), title: TITLE, recipeId: "m-cr", stage: "eat", plate: { items: recipe.items, title: TITLE, fromRecipe: "m-cr" }, ui: { step: "after", ticks: ["s0", "s1", "s2", "s3"] }, steps: 4 };
  p = await fresh({ items: [], title: "", feedback: [], cook }, "/today");
  await p.locator(".cook-strip .cs-main, .cook-strip").first().click(); await p.waitForTimeout(1200);
  const ta = p.locator("textarea").last();
  await p.evaluate((mark) => { const t = [...document.querySelectorAll("textarea")].pop(); if (t) t.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.59): Eat asks how much and how it tasted; the last field is a line for your coach.");
  await cut(p, "r225c", "textarea", 1100);
  await p.evaluate(({ mark }) => { document.querySelector(".bnote")?.remove(); const t = [...document.querySelectorAll("textarea")].pop(); if (!t) return; t.style.cssText = t.style.cssText.replace(/outline[^;]*;?/g, "");
    const svg = (document.querySelector("header svg")?.outerHTML || "").replace(/width="\d+"/, 'width="18"').replace(/height="\d+"/, 'height="18"');
    t.placeholder = "I felt so energized"; t.value = "I felt so energized. Kept me going until dinner.";
    t.insertAdjacentHTML("beforebegin", `<div class="bubble mealan chef-line" style="display:block;width:100%;box-sizing:border-box;${mark}"><span class="bubble-tag tag-chef" style="display:flex;align-items:center;gap:6px"><span style="display:inline-flex;width:18px;height:18px">${svg}</span>CHEF MEALAN</span><p style="font-weight:700">Anything you want to remember about it?</p></div>`);
    t.insertAdjacentHTML("afterend", `<small class="muted" style="display:block;font-size:13px;margin-top:6px;${mark};padding:4px">Kept on the recipe, only for you. Your coach sees it when you share the meal.</small>`); }, { mark });
  await note(p, "New: Chef Mealan asks for your words. They go on the recipe, every time you ate it; only you see them.");
  await cut(p, "r225d", "textarea", 1100);
  await p.context().close();
  await b.close();
})();
