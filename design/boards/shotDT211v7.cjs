// Board DT211 version 7 (Coach Milan 2 November 11:38 to 11:41): one conversation between the cook and the chef. The steps are
// Craft, Make, Eat; each question is Chef Mealan's line, a chat bubble; Make ends on Cooked. Next: Eat; Today asks How did it
// carry you as his line too. Earlier: DT211 version 6 (Coach Milan 2 November 11:33): Make rounds off the cooking (photos while you cook, the final photo,
// how the cooking went); Feedback is the eating (how much, the taste), with the final photo borrowed.
// Earlier: DT211 version 5 (Coach Milan 2 November 11:28): two sets of photos. Make: photos while you cook, the prep and the steps.
// Feedback: the meal, the final look. Earlier: DT211 version 4 (Coach Milan 2 November 11:22): How did it go and How much did you eat move from Make to Feedback;
// Make ends on Cooked. Next: Feedback. Earlier: DT211 version 3 (Coach Milan 2 November 11:09): one dashed frame per picture slot, room between the steps, Start
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
const EATEN = { id: "fb-pp", meal: { ...seed.meals[0] }, status: "eaten", recipeId: "m-pp", taste: "", notes: "", createdAt: new Date(Date.now() - 40 * 60000).toISOString() };
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





  const toMake = async (p) => { await toRecipe(p); await p.getByRole("button", { name: "Cook it as written", exact: true }).click(); await p.waitForTimeout(1200); };
  const pic = waffle;
  // Chef Mealan's line: the chat's bubble, with his mark and name
  const chefLine = () => (text) => { const svg = document.querySelector("header svg")?.outerHTML || "";
    const d = document.createElement("div"); d.className = "bubble mealan"; d.style.cssText = "display:block;max-width:92%;margin:12px 0 8px";
    d.innerHTML = `<span class="bubble-tag tag-chef" style="display:flex;align-items:center;gap:6px"><span style="display:inline-flex;width:18px;height:18px">${svg.replace(/width="\d+"/, 'width="18"').replace(/height="\d+"/, 'height="18"')}</span>CHEF MEALAN</span><p style="font-weight:700">${text}</p>`; return d; };
  const tabs = () => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (n.textContent.trim() === "Feedback") n.textContent = n.textContent.replace("Feedback", "Eat"); };
  const grab = () => { const ls = [...document.querySelectorAll("main p.label")]; const at = (re) => ls.find((x) => re.test(x.textContent));
    const run = (from, stop) => { const out = []; let n = from; while (n && !stop(n)) { out.push(n); n = n.nextElementSibling; } return out; };
    const btn = [...document.querySelectorAll("main button.pill-primary.pill-wide")].find((x) => /Rate it/.test(x.textContent));
    const went = run(at(/How did it go/), (n) => n.tagName === "P" && /How much/.test(n.textContent));
    const ate = run(at(/How much did you eat/), (n) => n === btn);
    return { went, ate, btn, photos: at(/Photos of the meal/) }; };
  let p = await fresh(); await toMake(p);
  const ateHtml = await p.evaluate(({ src }) => { const grab = eval(src); return grab().ate.slice(1).map((e) => e.outerHTML).join(""); }, { src: grab.toString() });
  await p.evaluate(({ mark, src, cl, tb, pic }) => { const grab = eval(src); const chefLine = eval(cl)(); const tabs = eval(tb); const g = grab(); tabs();
    const lab = g.photos; const row = lab.nextElementSibling;
    const w1 = document.createElement("div"); w1.style.cssText = "padding:6px 0"; lab.before(w1); lab.textContent = "Photos while you cook"; w1.appendChild(lab);
    const l1 = document.createElement("small"); l1.className = "muted"; l1.style.cssText = "display:block;margin:-4px 0 8px;font-size:13px"; l1.textContent = "The prep and the steps, as many as you like."; w1.appendChild(l1);
    row.insertAdjacentHTML("afterbegin", `<img src="${pic}" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:12px">`); w1.appendChild(row);
    const w2 = document.createElement("div"); w2.style.cssText = "padding:6px 0;margin-top:8px"; w1.after(w2);
    w2.innerHTML = '<p class="label">The meal, the final look</p><small class="muted" style="display:block;margin:-4px 0 8px;font-size:13px">One photo when it is on the plate. Eat shows it too.</small><label class="plate-photo"><span>Add a photo of the meal</span></label>';
    const w3 = document.createElement("div"); w3.style.cssText = mark + ";padding:6px;margin-top:8px"; w2.after(w3);
    g.went[0].replaceWith(chefLine("How did the cooking go?")); w3.appendChild(document.querySelector("main .bubble.mealan")); for (const e of g.went.slice(1)) w3.appendChild(e);
    for (const e of g.ate) e.style.display = "none";
    const box = document.createElement("div"); box.className = "next-step"; box.style.cssText = mark + ";padding:6px";
    box.innerHTML = '<button class="pill pill-primary pill-wide" style="min-height:52px;font-size:17px;font-weight:900">Cooked. Next: Eat ›</button><small class="muted">How much you ate, and how it tasted.</small>';
    g.btn.replaceWith(box);
    const t = document.querySelector(".mk-card > b"); if (t) t.textContent = "Tick each step when it is done";
    const sub = [...document.querySelectorAll("main p, main small, main span")].find((x) => /A photo while it is on the counter/.test(x.textContent) && x.children.length === 0); if (sub) sub.textContent = "Tick the steps as you go, take photos, and say how the cooking went."; },
    { mark, src: grab.toString(), cl: chefLine.toString(), tb: tabs.toString(), pic });
  await note(p, "New, version 7: the steps are Craft, Make, Eat. Make rounds off the cooking, and its question is Chef Mealan's line: How did the cooking go? Then Cooked. Next: Eat.");
  await shot(p, "r211m4"); await p.context().close();
  // Eat
  p = await fresh(); await toMake(p);
  await p.locator("main button").filter({ hasText: "Rate it" }).click(); await p.waitForTimeout(1200);
  await p.evaluate(({ mark, ateHtml, pic, cl, tb }) => { const chefLine = eval(cl)(); const tabs = eval(tb); tabs();
    const h = [...document.querySelectorAll("main h1, main h2")].find((x) => /Feedback/.test(x.textContent)); if (h) { h.textContent = "Eat: how was it?"; h.style.cssText += ";" + mark; }
    const first = document.querySelector("main .choices.three");
    const top = document.createElement("div"); top.style.cssText = "padding:6px 0;margin-bottom:4px;display:flex;gap:12px;align-items:center";
    top.innerHTML = `<img src="${pic}" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:12px;flex:none"><small class="muted" style="font-size:13px;line-height:1.45">Your meal, from Make.</small>`;
    first.before(top);
    const w = document.createElement("div"); w.style.cssText = mark + ";padding:6px;margin-bottom:10px"; w.appendChild(chefLine("Enjoy it. How much did you eat?")); w.insertAdjacentHTML("beforeend", ateHtml); first.before(w);
    const w2 = document.createElement("div"); w2.style.cssText = mark + ";padding:6px"; first.before(w2); w2.appendChild(chefLine("And how did it taste?")); w2.appendChild(first);
    const sub = [...document.querySelectorAll("main p, main small, main span")].find((x) => /One tap\. It stays yours/.test(x.textContent) && x.children.length === 0); if (sub) sub.textContent = "How much you ate and how it tasted. It stays yours unless you share it.";
    const mp = document.querySelector("main .meal-photos"); if (mp) mp.style.display = "none"; }, { mark, ateHtml, pic, cl: chefLine.toString(), tb: tabs.toString() });
  await note(p, "New, version 7: Eat. Chef Mealan asks, in his lines: Enjoy it. How much did you eat? And how did it taste? The final photo comes along from Make.");
  await shot(p, "r211e4"); await p.context().close();
  // Today, about 30 minutes later: now and new
  p = await fresh({ feedback: [EATEN] });
  await p.waitForTimeout(800);
  await p.evaluate((mark) => { const q = document.querySelector(".carry-in"); if (q) { q.style.cssText += ";" + mark; q.scrollIntoView({ block: "center" }); } }, mark);
  await note(p, "Now: on Today, about 30 minutes after the meal, the card asks How did it carry you?");
  await p.evaluate(() => { const q = document.querySelector(".carry-in"); window.__y = q ? q.getBoundingClientRect().top + scrollY - 300 : 0; });
  await shot(p, "r211t0");
  await p.evaluate(({ cl, mark }) => { const chefLine = eval(cl)(); document.querySelector(".bnote")?.remove(); const q = document.querySelector(".carry-q"); if (q) { const l = chefLine("About 30 minutes on: how did it carry you?"); q.replaceWith(l); l.parentElement.style.cssText += ";" + mark; } }, { cl: chefLine.toString(), mark });
  await note(p, "New, version 7: the same question as Chef Mealan's line, the last of the conversation: About 30 minutes on: how did it carry you?");
  await shot(p, "r211t1"); await p.context().close();
  await b.close();
})();
