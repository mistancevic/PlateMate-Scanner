// Board DT214 (Coach Milan 2 November 12:17 to 12:30): the cook. Cooking is its own thing beside the Plate, from Start cooking
// to how the meal carried you; a strip on every tab while it runs. Earlier: Board DT211 version 8 (Coach Milan 2 November 12:03 to 12:09): Photo is the one word; photos are added on the steps in Make;
// the recipe shows them; leaving Make or Eat and coming back goes on where you left off. Eat first on the board.
// Earlier: DT211 version 7 (Coach Milan 2 November 11:38 to 11:41): one conversation between the cook and the chef. The steps are
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
  const intoSteps = (on, line) => { const block = document.querySelector(".rq-steps");
    const btn = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Cook it as written");
    if (btn) { const under = btn.nextElementSibling; btn.style.display = "none"; if (under && under.tagName === "SMALL") under.style.display = "none"; }
    const box = document.createElement("div"); box.className = "bt-mark-steps"; box.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-top:10px;padding-top:12px;border-top:1px solid #d1dcf0";
    box.innerHTML = `<button class="pill pill-wide ${on ? "pill-primary" : ""}" ${on ? "" : "disabled"} style="min-height:48px;${on ? "" : "background:#e6edf8;color:#5b6b8a;border-color:#d1dcf0;cursor:not-allowed"}">Start cooking</button><small class="muted" style="font-size:13px;line-height:1.45">${line}</small>`;
    block.appendChild(box); return box; };

  const PH = (on, size = 56) => on ? `<img src="${pic}" alt="" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:10px;display:block">`
    : `<div style="width:${size}px;height:${size}px;box-sizing:border-box;border:2px dashed #2e7be8;border-radius:10px;background:#f4f7fc;display:flex;flex-direction:column;align-items:center;justify-content:center"><b style="font-size:18px;line-height:1;color:#1f5fc7">＋</b><b style="font-size:12px;color:#1f5fc7;line-height:1.2">Photo</b></div>`;
  const makeV8 = (resume) => ({ mark, src, cl, tb, pic, PHs, resume }) => { const grab = eval(src); const chefLine = eval(cl)(); const tabs = eval(tb); const PH = eval(PHs); const g = grab(); tabs();
    // + Photo on each step, beside the tick
    [...document.querySelectorAll(".mk-check")].forEach((row, k) => { const w = document.createElement("div"); w.style.cssText = "display:flex;gap:10px;align-items:center"; row.before(w); w.appendChild(row); row.style.flex = "1";
      const s = document.createElement("div"); s.innerHTML = PH(k === 1 || (resume && k === 0)); s.style.cssText = "flex:none;" + (k === 0 && !resume ? mark : ""); w.appendChild(s); });
    // the old Photos of the meal row goes; the final photo, then the chef's question
    const lab = g.photos; const row = lab.nextElementSibling; lab.style.display = "none"; row.style.display = "none";
    const w2 = document.createElement("div"); w2.style.cssText = "padding:6px 0;margin-top:8px"; row.after(w2);
    w2.innerHTML = '<p class="label">The meal, the final look</p><small class="muted" style="display:block;margin:-4px 0 8px;font-size:13px">One photo when it is on the plate. Eat shows it too.</small><label class="plate-photo"><span>Add a photo of the meal</span></label>';
    const w3 = document.createElement("div"); w3.style.cssText = "padding:6px;margin-top:8px"; w2.after(w3);
    g.went[0].replaceWith(chefLine("How did the cooking go?")); w3.appendChild(document.querySelector("main .bubble.mealan")); for (const e of g.went.slice(1)) w3.appendChild(e);
    for (const e of g.ate) e.style.display = "none";
    const box = document.createElement("div"); box.className = "next-step";
    box.innerHTML = '<button class="pill pill-primary pill-wide" style="min-height:52px;font-size:17px;font-weight:900">Cooked. Next: Eat ›</button><small class="muted">How much you ate, and how it tasted.</small>';
    g.btn.replaceWith(box);
    const t = document.querySelector(".mk-card > b"); if (t) t.textContent = "Tick each step when it is done";
    const sub = [...document.querySelectorAll("main p, main small, main span")].find((x) => /A photo while it is on the counter/.test(x.textContent) && x.children.length === 0); if (sub) sub.textContent = "Tick the steps as you go, add photos to them, and tell Chef Mealan how the cooking went.";
    if (resume) { const start = [...document.querySelectorAll("main button")].find((x) => /Start cooking|Go on cooking/.test(x.textContent));
      const top = document.createElement("div"); top.style.cssText = mark + ";padding:6px;margin-bottom:10px";
      top.appendChild(chefLine("You were cooking Protein Pancake: 3 of 5 steps ticked, 2 photos. Go on where you left off?"));
      top.insertAdjacentHTML("beforeend", '<div style="display:flex;flex-direction:column;gap:8px;margin-top:6px"><button class="pill pill-primary pill-wide" style="min-height:44px">Go on cooking</button><div style="display:flex;gap:18px"><button class="link" style="min-height:44px">Save for later</button><button class="link" style="min-height:44px">Start over</button></div></div>');
      (start?.closest("div") || start).before(top); if (start) start.parentElement.style.display = "none";
      [...document.querySelectorAll(".mk-check")].slice(0, 3).forEach((b) => b.classList.add("on")); } };
  // 1. Make, version 8

  // the strip: on every tab while a cook runs, under the header
  const strip = () => (html) => { const svg = (document.querySelector("header svg")?.outerHTML || "").replace(/width="\d+"/, 'width="20"').replace(/height="\d+"/, 'height="20"');
    const d = document.createElement("div"); d.className = "cook-strip";
    d.style.cssText = "display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 12px;margin:8px 0 10px;background:#dce9fd;border:1.5px solid #2e7be8;border-radius:14px;color:#123a7a;font-size:15px";
    d.innerHTML = `<span style="display:inline-flex;width:20px;height:20px;flex:none">${svg}</span><span style="flex:1;line-height:1.3">${html}</span><b style="flex:none;color:#1f5fc7">Go on ›</b>`;
    const main = document.querySelector("main"); main.prepend(d); return d; };
  const run = (p, f, arg) => p.evaluate(({ src, cl, st, tb, arg, pic }) => { const chefLine = eval(cl)(); const strip = eval(st)(); eval(tb)();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; const swap = [[/^No picture yet\.$/, "No photo yet."], [/^Draw a picture$/, "Let Chef Mealan draw one"], [/Chef Mealan's pictures today/, (t) => t.replace("Chef Mealan's pictures today", "Chef Mealan's drawings today")]];
    while ((n = w.nextNode())) for (const [re, to] of swap) if (re.test(n.textContent.trim())) n.textContent = typeof to === "function" ? to(n.textContent) : to;
    return eval(src)(arg); }, { src: f.toString(), cl: chefLine.toString(), st: strip.toString(), tb: tabs.toString(), arg, pic });
  // a. Today, while cooking
  let p = await fresh();
  await run(p, (a) => { strip("<b>Cooking now</b> · Protein Pancake · step 3 of 5"); });
  await note(p, "New: while a cook runs, a strip sits under the header on every tab: Cooking now, the dish, the step. Go on brings you back to the same step, with every tick, photo and answer kept.");
  await shot(p, "r214a"); await p.context().close();
  // b. the Plate stays free: a scan in the middle of cooking asks where the food goes
  p = await fresh();
  await p.locator("nav button").filter({ hasText: "Plate" }).click(); await p.waitForTimeout(1200);
  await run(p, (a) => { strip("<b>Cooking now</b> · Protein Pancake · step 3 of 5");
    const main = document.querySelector("main"); const at = main.querySelector(".cook-strip");
    const box = document.createElement("section"); box.style.cssText = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:14px;padding:6px;margin:6px 0 12px";
    box.innerHTML = `<div style="display:flex;gap:10px;align-items:center;background:#fff;border:1.5px solid #d1dcf0;border-radius:14px;padding:10px"><span style="width:44px;height:44px;border-radius:10px;background:#eef3fb;display:flex;align-items:center;justify-content:center;font-size:22px">🥛</span><span style="flex:1"><b>Skyr, natural</b><br><small class="muted" style="font-size:13px">just scanned · PD 17.5</small></span></div>`;
    box.appendChild(chefLine("You are cooking Protein Pancake. Shall I use this skyr in it, or keep it in your foods?"));
    box.insertAdjacentHTML("beforeend", '<div style="display:flex;flex-direction:column;gap:8px;margin-top:6px"><button class="pill pill-primary pill-wide" style="min-height:44px">Use it in Protein Pancake</button><button class="pill pill-wide" style="min-height:44px">Keep it in my foods</button></div><small class="muted" style="display:block;font-size:13px;margin-top:6px;line-height:1.45">Use it: Chef Mealan asks what it replaces or adds, and the steps follow. Keep it: it waits in Foods; the cook goes on as it was.</small>');
    at.after(box); });
  await note(p, "New: the Plate is free while you cook. A food scanned in the middle of cooking is asked about: use it in the dish you are cooking, or keep it in your foods.");
  await shot(p, "r214b"); await p.context().close();
  // c. after eating: the cook waits for the last question
  p = await fresh({ feedback: [EATEN] });
  await run(p, (a) => { strip("<b>Eaten 12:40</b> · Protein Pancake · Chef Mealan asks how it carried you in 18 min"); const q = document.querySelector(".carry-in"); if (q) q.style.display = "none"; });
  await note(p, "New: after Eat the cook is still open, waiting for the last question. The strip says when Chef Mealan asks.");
  await shot(p, "r214c"); await p.context().close();
  // d. 30 minutes on: the last answer closes the cook
  p = await fresh({ feedback: [EATEN] });
  await run(p, (a) => { const q = document.querySelector(".carry-q"); if (q) { const l = chefLine("About 30 minutes on: how did it carry you?"); q.replaceWith(l); l.parentElement.style.cssText += ";outline:3px solid #2e7be8;outline-offset:3px;border-radius:14px"; l.parentElement.scrollIntoView({ block: "center" }); }
    const small = document.createElement("small"); small.className = "muted"; small.style.cssText = "display:block;font-size:13px;margin-top:6px"; small.textContent = "Your answer closes the cook: the strip goes, the card keeps it all."; document.querySelector(".carry-acts")?.after(small); });
  await note(p, "New: about 30 minutes after eating, Chef Mealan asks on the meal's card. The answer closes the cook.");
  await shot(p, "r214d"); await p.context().close();
  // e. the recipe collects its cooks
  p = await fresh(); await toRecipe(p);
  await run(p, (a) => { const steps = document.querySelector(".rq-steps"); const box = document.createElement("section"); box.className = "card"; box.style.cssText = "outline:3px solid #2e7be8;outline-offset:3px;padding:14px 16px;margin:12px 0;display:flex;flex-direction:column;gap:8px";
    box.innerHTML = `<b style="font-size:17px">Your cooks</b><small class="muted" style="font-size:13px">3 times, the last on 2 November</small>
      <div style="display:flex;gap:8px">${[1, 2, 3].map(() => `<img src="${pic}" style="width:64px;height:64px;object-fit:cover;border-radius:10px">`).join("")}</div>
      <div style="font-size:15px;line-height:1.6">As the steps say: <b>2 of 3</b><br>Tasted: <b>DaaM good 2, Good 1</b><br>Carried you: <b>light and awake 2 of 3</b></div>
      <small class="muted" style="font-size:13px;line-height:1.45">Each time you cook it, the cook keeps the photos and the answers. The best photo of a step can become the step's photo here.</small>`;
    steps.before(box); });
  await note(p, "New: a recipe collects its cooks: their photos, how often it went as the steps said, how it tasted, how it carried you.");
  await shot(p, "r214e"); await p.context().close();
  await b.close();
})();
