// Board DT211 version 3 (Coach Milan 2 November 11:09): one dashed frame per picture slot, room between the steps, Start
// cooking inside the Steps block (greyed until there are steps), the Make block titled with what the ticks are for.
// Earlier: DT211 and DT212 version 2 (Coach Milan 2 November 10:41 to 10:55): one Start cooking, the step picture slot, the plate
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

  // the slot: one dashed frame, nothing else; the steps 14 px apart
  const slotFix3 = () => { for (const li of document.querySelectorAll(".rq-steps .rp-steps > li")) li.style.marginBottom = "14px";
    for (const s of document.querySelectorAll(".rq-step-pic button")) { if (s.querySelector("img")) continue;
      s.style.cssText += ";border:2px dashed #2e7be8;background:#f4f7fc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;outline:none;box-shadow:none";
      s.innerHTML = '<b style="display:block;font-size:22px;line-height:1;color:#1f5fc7;font-weight:700">＋</b><b style="display:block;font-size:12.5px;font-weight:700;color:#1f5fc7;line-height:1.2">Picture</b>'; } };
  const intoSteps = (on, line) => { const block = document.querySelector(".rq-steps");
    const btn = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Cook it as written");
    if (btn) { const under = btn.nextElementSibling; btn.style.display = "none"; if (under && under.tagName === "SMALL") under.style.display = "none"; }
    const box = document.createElement("div"); box.className = "bt-mark-steps"; box.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-top:10px;padding-top:12px;border-top:1px solid #d1dcf0";
    box.innerHTML = `<button class="pill pill-wide ${on ? "pill-primary" : ""}" ${on ? "" : "disabled"} style="min-height:48px;${on ? "" : "background:#e6edf8;color:#5b6b8a;border-color:#d1dcf0;cursor:not-allowed"}">Start cooking</button><small class="muted" style="font-size:13px;line-height:1.45">${line}</small>`;
    block.appendChild(box); return box; };
  // a: now, the slot and Cook it as written outside the block
  let p = await fresh();
  await toRecipe(p);
  await markEl(p, ".rq-step-pic button"); await markEl(p, "button", "Cook it as written");
  await note(p, "Now (0.3.52): the + Picture slot is cut off, the steps touch; Cook it as written sits below the Steps block, with no word about the voice.");
  await shot(p, "r211a3");
  await p.evaluate(() => document.querySelector(".bnote")?.remove());
  await p.evaluate(slotFix3);
  await p.evaluate(({ mark, src }) => { const intoSteps = eval(src); const box = intoSteps(true, "5 steps, read aloud. Say next, back or repeat. A second phone can show them."); box.style.cssText += ";outline:3px solid #2e7be8;outline-offset:4px;border-radius:10px"; }, { mark, src: intoSteps.toString() });
  await p.evaluate((mark) => { const s = document.querySelector(".rq-step-pic button"); if (s) { s.parentElement.style.cssText += ";outline:3px solid #2e7be8;outline-offset:4px;border-radius:12px"; } }, mark);
  await note(p, "New, version 3: the slot is one dashed frame with + over Picture, and the steps have room between them. Start cooking sits inside the Steps block, at its end, where you have read every step. Change it first and Edit recipe stay below.");
  await shot(p, "r211b3"); await p.context().close();
  // e: a recipe with no steps: Start cooking greyed inside the block, under Draft and Write my own
  p = await fresh(); await toRecipe(p, "Skyr bowl");
  await p.evaluate(({ src }) => { const intoSteps = eval(src); const block = document.querySelector(".rq-steps");
    const none = [...block.querySelectorAll("small")].find((x) => /No steps yet/.test(x.textContent));
    if (none && !/Draft the steps/.test(block.textContent)) { none.textContent = "No steps yet."; none.insertAdjacentHTML("afterend", '<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-small pill-primary" style="min-height:44px">Draft the steps with Chef Mealan</button><button class="pill pill-small" style="min-height:44px">Write my own</button></div>'); }
    const box = intoSteps(false, "Start cooking reads the steps aloud, one at a time. It opens once the steps are here: drafted by Chef Mealan or written by you.");
    box.style.cssText += ";outline:3px solid #2e7be8;outline-offset:4px;border-radius:10px"; }, { src: intoSteps.toString() });
  await note(p, "New, version 3: a recipe with no steps. Drafting the steps stays where it is, in the Steps block. Under it Start cooking is grey, with a line that says why and what opens it.");
  await shot(p, "r211e3"); await p.context().close();
  // c: Make, the steps block's title says what the ticks are for
  p = await fresh(); await toRecipe(p);
  await p.getByRole("button", { name: "Cook it as written", exact: true }).click(); await p.waitForTimeout(1200);
  await p.evaluate((mark) => { const b = document.querySelector(".mk-card > b"); if (b) b.style.cssText += ";" + mark; }, mark);
  await note(p, "Now: Make. The block is titled The steps, with boxes to tick and no word what they are for.");
  await shot(p, "r211c3");
  await p.evaluate(() => { document.querySelector(".bnote")?.remove(); const b = document.querySelector(".mk-card > b"); if (b) b.textContent = "Tick each step when it is done"; });
  await note(p, "New, version 3: only the block's title changes. Tick each step when it is done.");
  await shot(p, "r211c4"); await p.context().close();
  await b.close();
})();
