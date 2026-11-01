// Boards DT211 and DT212 (Coach Milan 2 November 00:44 to 00:47). DT211: cooking with voice you can find; Start cooking on the
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
  const fresh = async (plate = null) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB", timezoneId: "Europe/Berlin" });
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

  // ---------- DT211 ----------
  let p = await fresh();
  await toRecipe(p);
  await markEl(p, "button", "Cook it as written");
  await note(p, "Now: the recipe says nothing about cooking along. Cook it as written opens Make, and Start cooking with the voice sits there, one more tap. The second phone shows only inside cooking.");
  await shot(p, "r211a");
  // b: new recipe page
  await p.evaluate(({ mark }) => {
    const btn = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Cook it as written");
    btn.textContent = "Start cooking"; btn.style.cssText += ";" + mark;
    const under = btn.nextElementSibling; if (under) under.textContent = "One step at a time, read aloud. Say next, back or repeat, or tap. A second phone can show the steps.";
    document.querySelector(".bnote")?.remove();
    const num = [...document.querySelectorAll("main *")].find((x) => /fits your plan/.test(x.textContent) && x.children.length && x.getBoundingClientRect().height < 260 && x.getBoundingClientRect().height > 120);
    const top = document.createElement("div"); top.style.cssText = mark + ";display:flex;flex-direction:column;gap:6px;margin:14px 0";
    top.innerHTML = `<button class="pill pill-wide pill-primary" style="min-height:48px">Start cooking</button><small class="muted" style="font-size:13px">5 steps, read aloud. Say next, back or repeat. A second phone can show them.</small>`;
    (num?.closest("section, .card") || num)?.after(top);
  }, { mark });
  await note(p, "New: Start cooking right under the numbers, so it is on the first screen, and again as the main button after the steps. Both say what it does: one step at a time, read aloud, a second phone if you want. It opens cooking straight away; Make stays behind it for the ticks and the photo. Change it first as now.");
  await shot(p, "r211b"); await p.context().close();
  // c: now, Make with Start cooking
  p = await fresh(); await toRecipe(p);
  await p.getByRole("button", { name: "Cook it as written", exact: true }).click(); await p.waitForTimeout(1200);
  await markEl(p, ".mk-cook button", "Start cooking");
  await note(p, "Now: Make. Start cooking is here, with the voice, one tap after Cook it as written.");
  await shot(p, "r211c");
  // d: now, cooking: the voice question and Use another screen
  await p.locator(".mk-cook button").first().click(); await p.waitForTimeout(1000);
  await markEl(p, ".cook-pair-open");
  await note(p, "Now: cooking. The voice is asked once. Use another screen gives a 4-letter code and a QR code; the other phone opens chefmealan.com/cook, no sign-in, and both move together.", ".cook-mode");
  const ch = await p.evaluate(() => { const c = document.querySelector(".cook-mode"); return c ? c.scrollHeight : 844; });
  await p.setViewportSize({ width: 390, height: Math.min(1500, ch + 20) }); await p.waitForTimeout(500);
  await shot(p, "r211d", false); await p.context().close();
  // e: new, a recipe with no steps
  p = await fresh(); await toRecipe(p, "Skyr bowl");
  await p.evaluate(({ mark }) => {
    const btn = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Cook it as written");
    if (btn) { btn.textContent = "Draft the steps to cook along"; btn.style.cssText += ";" + mark; const under = btn.nextElementSibling; if (under) under.textContent = "No steps yet, so there is nothing to read aloud. Chef Mealan drafts them, you check them, then Start cooking."; }
  }, { mark });
  await note(p, "New: a recipe with no steps says so where Start cooking would be, and drafts the steps first. Today it just has no Start cooking, with no word why.");
  await shot(p, "r211e"); await p.context().close();

  // ---------- DT212 ----------
  // a: now, Milan's case: yesterday's photo plate, then Cook it as written on Protein Pancake
  p = await fresh(OLD); await toRecipe(p);
  await p.getByRole("button", { name: "Cook it as written", exact: true }).click(); await p.waitForTimeout(1500);
  await note(p, "Now (0.3.50, your case at 00:42): the photo plate from yesterday, 13:11, never ended. The recipe question sits on top of it, and under it everything at once: the photo, the numbers, Chef Mealan's checks and a second Chef Mealan card.");
  await shot(p, "r212x");
  // c: new, one question alone (start cooking, plate from earlier)
  await p.evaluate(({ mark, img }) => {
    const ask = document.querySelector(".plate-ask, [class*=plate-ask], .pa-top")?.closest("section, .card, div[class*=ask]");
    const main = document.querySelector("main");
    for (const el of [...main.children]) el.style.display = "none";
    const box = document.createElement("section"); box.className = "card"; box.style.cssText = mark + ";padding:16px;margin:12px 0;display:flex;flex-direction:column;gap:10px;background:#fff";
    box.innerHTML = `<div style="display:flex;gap:12px;align-items:center"><img src="${img}" style="width:64px;height:64px;object-fit:cover;border-radius:10px"><span style="font-size:16px;line-height:1.4"><b>Before you cook: your plate from yesterday, 13:11.</b><br>Chicken breast, peas and rice, from your photo.</span></div>
      <span style="font-size:15px">Did you eat it?</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-primary" style="min-height:44px;flex:1">Ate it</button><button class="pill" style="min-height:44px;flex:1">Clear it</button></div>
      <small class="muted" style="font-size:13px">Ate it saves it to yesterday. Clear it empties the plate. Either way, Protein Pancake starts on its own plate.</small>
      <button class="link" style="align-self:flex-start;min-height:44px">Cancel</button>`;
    main.appendChild(box);
  }, { mark, img: waffle });
  await p.evaluate(() => { const h = [...document.querySelectorAll("main h2, main h1")][0]; });
  await note(p, "New: one question, alone. A plate from an earlier meal ends before anything new goes on: Ate it or Clear it. Then cooking starts on its own plate. Nothing else shows until you answer.");
  await shot(p, "r212c"); await p.context().close();
  // b: new, opening the Plate with yesterday's plate
  p = await fresh(OLD);
  await p.locator("nav button").filter({ hasText: "Plate" }).click(); await p.waitForTimeout(1300);
  await p.evaluate(({ mark, img }) => {
    const main = document.querySelector("main");
    const keep = [...main.children].slice(0, 1);
    for (const el of [...main.children]) if (!keep.includes(el)) el.style.display = "none";
    const box = document.createElement("section"); box.className = "card"; box.style.cssText = mark + ";padding:16px;margin:12px 0;display:flex;flex-direction:column;gap:10px;background:#fff";
    box.innerHTML = `<div style="display:flex;gap:12px;align-items:center"><img src="${img}" style="width:64px;height:64px;object-fit:cover;border-radius:10px"><span style="font-size:16px;line-height:1.4"><b>Your plate from yesterday, 13:11.</b><br>Chicken breast, peas and rice, from your photo.</span></div>
      <span style="font-size:15px">Did you eat it?</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-primary" style="min-height:44px;flex:1">Ate it</button><button class="pill" style="min-height:44px;flex:1">Clear it</button></div>
      <button class="pill pill-wide" style="min-height:44px">Keep working on it</button>
      <small class="muted" style="font-size:13px">Ate it saves it to yesterday, to the meal it was for. Clear it empties the plate for what comes next. Keep working on it opens it as it is.</small>`;
    main.appendChild(box);
  }, { mark, img: waffle });
  await note(p, "New: the Plate opens on one question when the plate is from an earlier meal (over 3 hours, or another day). The foods, numbers and Chef Mealan's cards wait behind it.");
  await shot(p, "r212b"); await p.context().close();
  // d, e: now and new, a plate of now with Chef Mealan's two cards
  const NOW = { ...OLD, plateAt: new Date(Date.now() - 20 * 60000).toISOString(), photo: { image: waffle, at: new Date(Date.now() - 20 * 60000).toISOString() } };
  p = await fresh(NOW);
  await p.locator("nav button").filter({ hasText: "Plate" }).click(); await p.waitForTimeout(1500);
  await note(p, "Now: a plate from 20 minutes ago. The photo card, then Chef Mealan's checks, then a second Chef Mealan card further down.");
  await shot(p, "r212d");
  await p.context().close();
  // e: new, a plate of now: Read it again on the photo, one Chef Mealan line about the eating window
  p = await fresh(NOW);
  await p.locator("nav button").filter({ hasText: "Plate" }).click(); await p.waitForTimeout(1500);
  await p.evaluate(({ mark }) => {
    const ph = document.querySelector(".mp-line"); if (ph) { const a = document.createElement("button"); a.className = "link"; a.style.cssText = mark + ";min-height:44px;margin:4px 0 0;align-self:flex-start;display:block"; a.textContent = "Wrong foods? Read the photo again ›"; ph.after(a); }
    const ck = [...document.querySelectorAll("main *")].filter((x) => /could not read your plate/.test(x.textContent) && /Chef Mealan/.test(x.textContent) && /Try again/.test(x.textContent)).sort((a, b) => a.textContent.length - b.textContent.length)[0];
    if (ck) { ck.style.cssText += ";" + mark; ck.innerHTML = `<b style="font-size:17px">Chef Mealan</b>
      <div style="margin-top:10px;color:#c0392b;font-weight:700;font-size:13px">✗ Culinary</div><div style="font-size:14px">Your plate of chicken, rice and peas belongs at lunch or dinner rather than breakfast.</div>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="pill pill-primary pill-small" style="min-height:44px">Make it a breakfast</button><button class="pill pill-small" style="min-height:44px">Keep it as it is</button></div>
      <div style="margin-top:12px;color:#1e8e5a;font-weight:700;font-size:13px">✓ Nutrition</div>
      <div style="margin-top:12px;color:#c0392b;font-weight:700;font-size:13px">✗ Your day</div><div style="font-size:14px">00:42, and your eating window is 10:00 to 19:00. A full plate now sits on tomorrow.</div>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="pill pill-primary pill-small" style="min-height:44px">Make it a snack</button><button class="pill pill-small" style="min-height:44px">Keep it as it is</button></div>`; }
    const ea = [...document.querySelectorAll("main section, main .card, main div")].filter((x) => /Ate half/.test(x.textContent) && /Chef Mealan:/.test(x.textContent)).sort((a, b) => a.textContent.length - b.textContent.length)[0];
    if (ea) { ea.style.cssText += ";" + mark; const w = document.createTreeWalker(ea, NodeFilter.SHOW_TEXT); let n; const all = []; while ((n = w.nextNode())) all.push(n);
      const host = all.find((t) => /Chef Mealan/.test(t.textContent))?.parentElement; const line = host?.parentElement; if (line) line.innerHTML = "<b>Did you eat it?</b> About 600 kcal and 65 g protein."; }
  }, { mark });
  await note(p, "New: Chef Mealan says the eating window once, in Your day. The card under it only asks Did you eat it, with the numbers. The photo card gets Wrong foods? Read the photo again.");
  await shot(p, "r212e");
  const txt = await p.evaluate(() => [...document.querySelectorAll("main section, main .card")].map((x) => x.className + " :: " + x.textContent.slice(0, 120)).join("\n"));
  fs.writeFileSync("/tmp/claude-0/-home-claude/a3625ff7-4226-57ca-879e-055f53d2dca0/scratchpad/r212d.txt", txt);
  await p.context().close();
  await b.close();
})();
