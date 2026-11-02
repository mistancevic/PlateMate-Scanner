// Board Stories166 v2 and Stories167 (Coach Milan 2 November 19:45 to 20:02): DT225 v2, the history block below the buttons;
// DT227 Saved for later: Remove in sight, only on the Plate's start screen, and a line on the recipe. Now: 0.3.60 (main dist
// on 3387). New: the same pages with the change drawn in. Nothing in the repo changes.
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

  // ---- DT225 v2: the history block below the buttons ----
  let p = await fresh({ items: [], title: "", feedback: cards }, "/today");
  await p.locator("nav button").filter({ hasText: "Recipes" }).first().click(); await p.waitForTimeout(700);
  await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(900);
  await p.evaluate(({ mark, crepePic }) => {
    const row = (date, amount, taste, carry, words, pic) => `<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--line)">${pic ? `<img src="${crepePic}" style="width:52px;height:52px;border-radius:10px;object-fit:cover;flex:none">` : `<span style="width:52px;height:52px;border-radius:10px;background:var(--tint);flex:none;display:inline-flex;align-items:center;justify-content:center;font-size:22px">🍽️</span>`}<span style="display:flex;flex-direction:column;gap:2px;font-size:14px;line-height:1.4"><b>${date}</b><span>${amount} · ${taste}${carry ? ` · carried you: ${carry}` : ""}</span>${words ? `<i style="color:#172742">“${words}”</i>` : ""}</span></div>`;
    const edit = [...document.querySelectorAll("main button")].filter((b) => b.textContent.trim() === "Edit recipe").pop();
    const after = edit && edit.nextElementSibling && edit.nextElementSibling.tagName === "SMALL" ? edit.nextElementSibling : edit;
    (after || document.querySelector("main").lastElementChild).insertAdjacentHTML("afterend", `<section class="card eat-log" style="${mark};padding:14px 16px;margin:16px 0;display:flex;flex-direction:column;gap:4px"><b style="font-size:17px">Every time you ate it</b><small class="muted" style="font-size:13px">Only you see this. Your coach sees a meal you share.</small>${row("Today, 12:40 · cooked", "1 portion, 540 g", "DaaM good", "light and awake", "I felt so energized. Kept me going until dinner.", true)}${row("Thursday 29 October, 08:10 · from the fridge", "Half a portion, 270 g", "Good", "fine", "", false)}${row("Saturday 24 October, 19:30 · cooked", "1 portion, 540 g", "DaaM good", "heavy, tired", "Too many chocolate chips at night.", true)}<button class="link" style="align-self:flex-start;min-height:44px">All 3 ›</button></section>`);
  }, { mark, crepePic });
  await note(p, "New, version 2: the log sits at the end of the recipe, under Start cooking, Change it first and Edit recipe. The buttons come first.");
  await cut(p, "r225e", ".rq-steps", 1500);
  await p.context().close();

  // ---- DT227: Saved for later ----
  const cook9 = { id: "c9", startedAt: at("11-02", "18:27"), title: "Traditional Balkan Sarma", recipeId: "m-cr", stage: "make", plate: { items: recipe.items, title: TITLE, fromRecipe: "m-cr" }, ui: { ticks: ["s0"] }, steps: 4 };
  const later = [{ id: "l1", at: at("11-02", "18:40"), kind: "cook", cook: cook9 }];
  p = await fresh({ items: [], title: "", later }, "/plate");
  await p.evaluate((mark) => { const c = document.querySelector(".later-card"); if (c) c.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.60): Saved for later has Continue only. Remove appears when you swipe the row left; the small text is the only hint.");
  await cut(p, "r227a", ".later-card", 900);
  const xrow = (p, armed) => p.evaluate(({ mark, armed }) => {
    document.querySelector(".bnote")?.remove(); const c = document.querySelector(".later-card"); c.style.cssText = c.style.cssText.replace(/outline[^;]*;?/g, "");
    const front = c.querySelector(".lr-front"); front.querySelector(".lr-x")?.remove(); front.querySelector(".lr-arm")?.remove();
    const go = front.querySelector("button");
    if (armed) { go.style.display = "none"; go.insertAdjacentHTML("afterend", `<button class="pill lr-arm" style="${mark};min-height:44px;color:#c0392b;border-color:#e8b4ad">Tap again to remove</button><button class="link lr-x" style="min-height:44px;min-width:44px">Keep</button>`); }
    else { go.style.display = ""; go.insertAdjacentHTML("afterend", `<button class="lr-x" aria-label="Remove" style="${mark};width:44px;height:44px;border:0;background:none;font-size:18px;color:#5b6b8a;flex:none">✕</button>`); }
    c.querySelector(":scope > small").textContent = "Continue puts it back on the Plate. It stays 7 days.";
  }, { mark, armed });
  await xrow(p, false);
  await note(p, "New: a ✕ on each row, next to Continue. The swipe still works; the hint goes.");
  await cut(p, "r227b", ".later-card", 900);
  await xrow(p, true);
  await note(p, "New: one tap on ✕ asks once more, as Empty plate does: Tap again to remove, or Keep.");
  await cut(p, "r227c", ".later-card", 900);
  await p.context().close();
  // the recipe points to its draft
  p = await fresh({ items: [], title: "", later }, "/today");
  await p.locator("nav button").filter({ hasText: "Recipes" }).first().click(); await p.waitForTimeout(700);
  await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(900);
  await p.evaluate(({ mark }) => { const s = document.querySelector(".rq-steps"); if (!s) return;
    s.insertAdjacentHTML("beforebegin", `<section class="card lr-recipe" style="${mark};padding:12px 14px;margin:12px 0;display:flex;align-items:center;gap:10px"><span style="flex:1;font-size:14px;line-height:1.4"><b>Saved for later on the Plate</b><br><small class="muted" style="font-size:13px">Cooking, today 18:27 · 1 of 4 steps ticked</small></span><button class="pill" style="min-height:44px">Continue ›</button></section>`); }, { mark });
  await note(p, "New: a recipe with a draft on the Plate says so, with Continue. The draft stays in one place, on the Plate.");
  await cut(p, "r227d", ".lr-recipe", 1100);
  await p.context().close();
  await b.close();
})();
