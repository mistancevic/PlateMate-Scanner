// Boards DT211 and DT212 version 2 (Coach Milan 2 November 10:41 to 10:55): one Start cooking, the step picture slot, the plate
// question inside its box, Save for later, and the answers to the five gaps. Earlier: DT211 and DT212 (Coach Milan 2 November 00:44 to 00:47). DT211: cooking with voice you can find; Start cooking on the
// recipe. DT212: a plate that ends; one question at a time on the Plate. Now: 0.3.50 as it runs (main dist on 3387). New: the
// same pages with the change drawn in. Nothing in the repo changes.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3387";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8"));
const waffle = "data:image/webp;base64," + fs.readFileSync("/home/claude/platemate-scanner/public/landing/hero/waffle-m.webp").toString("base64");
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
const F = (id, name, calories, protein, fats, carbs, fiber = 0) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber, photo: undefined, photos: undefined, icon: undefined, barcode: undefined, table: undefined, places: [] });
const pf = [[60, F("oat", "Oat flour", 375, 13, 7, 60, 10)], [40, F("whey", "Whey protein powder", 380, 78, 6, 8)], [150, F("egw", "Egg whites", 52, 11, 0.2, 0.7)], [2, F("eg", "Eggs", 143, 12.6, 9.5, 0.7)], [100, F("mi", "Milk 1.5%", 47, 3.4, 1.5, 4.9)], [5, F("bp", "Baking powder", 53, 0, 0, 28)], [80, F("bl", "Blueberries", 57, 0.7, 0.3, 14, 2.4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
pf[3].grams = 55;
const STEPS = ["Whisk [[i:oat|oat flour]], [[i:whey|whey protein powder]] and [[i:bp|baking powder]] in a bowl.", "Add [[i:eg|the egg]], [[i:egw|egg whites]] and [[i:mi|milk]]. Whisk to a thick batter. Rest it 5 minutes.", "Heat a non-stick pan on medium heat. Pour a small ladle of batter per pancake.", "Cook 2 minutes, until bubbles show, then flip and cook 1 minute more.", "Stack them and put [[i:bl|blueberries]] on top."];
const skyr = [[250, F("sk", "Skyr, natural", 63, 11, 0.2, 4)], [40, F("oa", "Oats", 372, 13.5, 7, 58.7, 10)], [100, F("ba", "Banana", 89, 1.1, 0.3, 22.8, 2.6)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
seed.meals = [{ id: "m-pp", title: "Protein Pancake", items: pf, portion: pf.reduce((n, i) => n + i.grams, 0), steps: STEPS, stepsFor: pf.map((i) => i.food.name), savedAt: "2026-10-30T10:00:00Z" },
  { id: "m-sk", title: "Skyr bowl", items: skyr, portion: 390, savedAt: "2026-10-29T10:00:00Z" }];
seed.feedback = [];
const CH = F("ch", "Chicken breast", 165, 31, 3.6, 0), PE = F("pe", "Peas, green", 81, 5.4, 0.4, 14.5, 5.7), RI = F("ri", "Rice", 130, 2.7, 0.3, 28, 0.4);
const yday = new Date(Date.now() - 86400000); yday.setHours(13, 11, 0, 0);
const OLD = { items: [{ id: "a", food: CH, grams: 170, locked: false }, { id: "b", food: PE, grams: 150, locked: false }, { id: "c", food: RI, grams: 150, locked: false }], plateAt: yday.toISOString(), photo: { image: waffle, at: yday.toISOString() } };
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const fresh = async (plate = null, W = 390) => {
    const ctx = await b.newContext({ viewport: { width: W, height: 844 }, deviceScaleFactor: 2, locale: "en-GB", timezoneId: "Europe/Berlin" });
    const p = await ctx.newPage();
    const s = { ...seed, items: [], title: "", ...(plate || {}) };
    await p.addInitScript((s) => {
      window.SpeechRecognition = function () { this.start = () => {}; this.stop = () => {}; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-region", "munich");
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, s);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto(U + "/today"); await p.waitForTimeout(1400);
    return p;
  };
  const hide = (p) => p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, [class*=fab]")) t.style.display = "none"; for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (cs.position !== "fixed" || el.closest(".cook-mode") || el.classList.contains("cook-mode")) continue; if (el.tagName === "NAV" || el.querySelector("nav")) { if (el.getBoundingClientRect().top > 100) { el.style.position = "static"; document.body.appendChild(el); } } else el.style.display = "none"; } });
  // whole page, nav kept at the bottom of the picture
  const shot = async (p, name, full = true) => {
    await p.waitForTimeout(300); await hide(p);
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot", name, await p.evaluate(() => document.documentElement.scrollHeight));
  };
  const note = (p, t, where = "main") => p.evaluate(({ t, NOTE, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const m = document.querySelector(where) || document.querySelector("main") || document.body; m.prepend(d); }, { t, NOTE, where });
  const toRecipe = async (p, t = "Protein Pancake") => { await p.locator("nav button").filter({ hasText: "Recipes" }).click(); await p.waitForTimeout(600); await p.locator(".recipe-tile").filter({ hasText: t }).click(); await p.waitForTimeout(700); };
  const markEl = (p, sel, text) => p.evaluate(({ sel, text, mark }) => { const el = [...document.querySelectorAll(sel)].find((x) => !text || x.textContent.includes(text)); if (el) el.style.cssText += ";" + mark; return !!el; }, { sel, text, mark });


  const slotFix = (mark) => { for (const s of document.querySelectorAll(".rq-step-pic button")) { if (s.querySelector("img")) continue;
    s.style.cssText += ";border:2px dashed #2e7be8;background:#f4f7fc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;" + (mark ? mark : "");
    s.innerHTML = '<span style="font-size:24px;line-height:1;color:#1f5fc7;font-weight:700">＋</span><span style="font-size:12.5px;font-weight:700;color:#1f5fc7;line-height:1.2">Picture</span>'; } };
  // ---------- DT211 v2 ----------
  let p = await fresh();
  await toRecipe(p);
  await p.evaluate((mark) => { const s = document.querySelector(".rq-step-pic button"); if (s) s.style.cssText += ";" + mark; }, mark);
  await markEl(p, "button", "Cook it as written");
  await note(p, "Now (0.3.52): Cook it as written at the end, no word about the voice. The + Picture slot beside each step is cut off: the word breaks out of its box.");
  await shot(p, "r211a2");
  await p.evaluate(({ mark }) => {
    const btn = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Cook it as written");
    btn.textContent = "Start cooking"; btn.style.cssText += ";" + mark;
    const under = btn.nextElementSibling; if (under) under.textContent = "5 steps, read aloud. Say next, back or repeat. A second phone can show them.";
    document.querySelector(".bnote")?.remove();
  }, { mark });
  await p.evaluate(slotFix, mark);
  await note(p, "New, version 2: one Start cooking, after the steps, where you have looked at everything first (Coach Milan 10:55). The picture slot holds a + and Picture inside its own frame, dashed, 72 px.");
  await shot(p, "r211b2"); await p.context().close();

  // ---------- DT212 v2 ----------
  const QBOX = (mark, img, title, sub, buttons, small) => `<section class="card" style="${mark};padding:16px;margin:12px 0;display:flex;flex-direction:column;gap:10px;background:#fff">
      <div style="display:flex;gap:12px;align-items:center"><img src="${img}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;flex:none"><span style="font-size:16px;line-height:1.4"><b>${title}</b><br>${sub}</span></div>
      ${buttons}<small class="muted" style="font-size:13px;line-height:1.45">${small}</small></section>`;
  const solo = (main) => { for (const el of [...main.children]) el.style.display = "none"; };
  // b: the Plate opens with yesterday's plate
  p = await fresh(OLD);
  await p.locator("nav button").filter({ hasText: "Plate" }).click(); await p.waitForTimeout(1300);
  await p.evaluate(({ mark, img, QB }) => { const QBOX = eval(QB); const main = document.querySelector("main"); const keep = main.children[0]; for (const el of [...main.children]) if (el !== keep) el.style.display = "none";
    main.insertAdjacentHTML("beforeend", QBOX(mark, img, "Your plate from yesterday, 13:11.", "Chicken breast, peas and rice, from your photo.",
      `<span style="font-size:15px">Did you eat it?</span><div style="display:flex;flex-direction:column;gap:8px"><button class="pill pill-primary pill-wide" style="min-height:44px">Ate it</button><button class="pill pill-wide" style="min-height:44px">Save for later</button></div>
       <div style="display:flex;gap:18px"><button class="link" style="min-height:44px">Keep working on it</button><button class="link" style="min-height:44px">Clear it</button></div>`,
      "Ate it saves it to yesterday, to the meal it was set for, at the photo's time. Save for later keeps it to finish another time, and the Plate is free. Keep working on it opens it as it is, and this plate is not asked about again. Clear it empties the plate."));
  }, { mark, img: waffle, QB: QBOX.toString() });
  await note(p, "New, version 2: the Plate opens on one question when the plate is from an earlier meal (over 3 hours, or another day). Save for later added (Coach Milan 10:55): an unfinished plate is kept to continue. Every button sits inside the box, one under the other on a phone.");
  await shot(p, "r212b2"); await p.context().close();
  // h: the Plate after Save for later: the saved plate waits at the top of an empty Plate
  p = await fresh();
  await p.locator("nav button").filter({ hasText: "Plate" }).click(); await p.waitForTimeout(1300);
  await p.evaluate(({ mark, img }) => { const main = document.querySelector("main"); const at = main.children[1] || main.children[0];
    at.insertAdjacentHTML("beforebegin", `<section class="card" style="${mark};padding:12px 14px;margin:10px 0;display:flex;flex-direction:column;gap:8px;background:#fff">
      <b style="font-size:15px">Saved for later</b>
      <div style="display:flex;gap:10px;align-items:center"><img src="${img}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex:none"><span style="flex:1;font-size:15px;line-height:1.35">Chicken breast, peas and rice<br><small class="muted" style="font-size:13px">yesterday, 13:11 · 3 foods</small></span><button class="pill" style="min-height:44px">Continue</button></div>
      <small class="muted" style="font-size:13px">Continue puts it back on the Plate. A saved plate stays 7 days; Remove is on its own row when you swipe it left.</small></section>`); }, { mark, img: waffle });
  await note(p, "New, version 2: a plate saved for later waits at the top of the Plate, with Continue. Up to 7 days, then it goes.");
  await shot(p, "r212h"); await p.context().close();
  // c: Start cooking with yesterday's plate
  p = await fresh(OLD); await toRecipe(p);
  await p.getByRole("button", { name: "Cook it as written", exact: true }).click(); await p.waitForTimeout(1500);
  await p.evaluate(({ mark, img, QB }) => { const QBOX = eval(QB); const main = document.querySelector("main"); for (const el of [...main.children]) el.style.display = "none";
    main.insertAdjacentHTML("beforeend", QBOX(mark, img, "Before you cook: your plate from yesterday, 13:11.", "Chicken breast, peas and rice, from your photo.",
      `<span style="font-size:15px">Did you eat it?</span><div style="display:flex;flex-direction:column;gap:8px"><button class="pill pill-primary pill-wide" style="min-height:44px">Ate it</button><button class="pill pill-wide" style="min-height:44px">Save for later</button></div>
       <div style="display:flex;gap:18px"><button class="link" style="min-height:44px">Clear it</button><button class="link" style="min-height:44px">Cancel</button></div>`,
      "Whichever you pick, Protein Pancake then starts on its own plate. Cancel goes back to the recipe."));
  }, { mark, img: waffle, QB: QBOX.toString() });
  await note(p, "New, version 2: Start cooking with a plate from earlier. The same question with Save for later, then cooking starts on its own plate. Start cooking never adds to a plate.");
  await shot(p, "r212c2"); await p.context().close();
  // g: Start cooking with a fresh plate (under 3 hours)
  const NOW = { ...OLD, plateAt: new Date(Date.now() - 20 * 60000).toISOString(), photo: { image: waffle, at: new Date(Date.now() - 20 * 60000).toISOString() } };
  p = await fresh(NOW); await toRecipe(p);
  await p.getByRole("button", { name: "Cook it as written", exact: true }).click(); await p.waitForTimeout(1500);
  await p.evaluate(({ mark, img, QB }) => { const QBOX = eval(QB); const main = document.querySelector("main"); for (const el of [...main.children]) el.style.display = "none";
    main.insertAdjacentHTML("beforeend", QBOX(mark, img, "Your plate has 3 foods, from 20 minutes ago.", "Protein Pancake starts on its own plate.",
      `<div style="display:flex;flex-direction:column;gap:8px"><button class="pill pill-primary pill-wide" style="min-height:44px">Save my plate for later</button><button class="pill pill-wide" style="min-height:44px">Clear my plate</button></div>
       <button class="link" style="min-height:44px;align-self:flex-start">Cancel</button>`,
      "Save my plate for later keeps it to finish another time; it waits at the top of the Plate. Clear my plate empties it. Cancel goes back to the recipe."));
  }, { mark, img: waffle, QB: QBOX.toString() });
  await note(p, "New, version 2 (gap 2): Start cooking with a plate of now. No Add to my plate: a recipe cooked as written is its own plate. Save it for later, or clear it.");
  await shot(p, "r212g"); await p.context().close();
  // f: now and new at 360 px, the recipe question on a plate of now: the buttons
  p = await fresh(NOW, 360); await toRecipe(p);
  await p.getByRole("button", { name: "Change it first", exact: true }).click(); await p.waitForTimeout(1500);
  await p.evaluate((mark) => { const b = [...document.querySelectorAll(".pa-go button")].pop(); if (b) b.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.52, a phone 360 px wide): Change it first on a plate with foods. Add to my plate runs out of the box.");
  await shot(p, "r212f0", false);
  await p.evaluate((mark) => { document.querySelector(".bnote")?.remove(); const go = document.querySelector(".pa-go"); if (go) { go.style.cssText += ";flex-direction:column;align-items:stretch;" + mark; for (const b of go.querySelectorAll("button")) b.style.cssText += ";width:100%;min-height:44px"; } }, mark);
  await note(p, "New, version 2: every Plate question keeps its buttons inside its box; on a phone they stand one under the other, full width. The question shows alone: the foods and Chef Mealan wait behind it (gap 5, every question on the Plate).");
  await p.evaluate(() => { const main = document.querySelector("main"); let n = document.querySelector(".plate-ask"); while (n && n !== main) { let s = n.nextElementSibling; while (s) { s.style.display = "none"; s = s.nextElementSibling; } n = n.parentElement; } });
  await shot(p, "r212f", false); await p.context().close();
  await b.close();
})();
