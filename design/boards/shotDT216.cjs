// Boards DT216 (cooked plates) and DT217 (cooking move by move), Stories163 (Coach Milan 2 November 15:54 to 16:13). Now: 0.3.55
// as it runs (main dist on 3387). New: the same pages with the change drawn in. Nothing in the repo changes.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3387";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8"));
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
const F = (id, name, calories, protein, fats, carbs, fiber = 0) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber, photo: undefined, photos: undefined, icon: undefined, barcode: undefined, table: undefined, places: [] });
const crepes = [[104, F("eg", "Eggs", 143, 12.6, 9.5, 0.7)], [100, F("mi", "Milk 1.5%", 47, 3.4, 1.5, 4.9)], [35, F("wf", "Wheat flour, white", 364, 10, 1, 76, 2.7)], [25, F("wh", "vanilla whey protein powder", 380, 78, 6, 8)], [180, F("qu", "Quark, low fat (Magerquark)", 67, 12, 0.2, 4)], [81, F("ba", "Banana", 89, 1.1, 0.3, 22.8, 2.6)], [15, F("cc", "chocolate chips", 500, 5, 28, 60, 4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
// your recipe as saved: it kept the bowl steps (All in one) from an earlier save, so How to make it shows them as Chef Mealan's
const g = (i) => `${i.grams} g ${i.food.name}`;
const BOWL = [`Put ${g(crepes[3])} in a bowl.`, `Add ${[0, 1, 2, 4, 5, 6].map((k) => g(crepes[k])).join(" and ")} and stir until it's one colour.`];
seed.meals = [{ id: "m-cr", title: "Vanilla protein crepes", items: crepes, portion: 540, steps: BOWL, stepsFor: crepes.map((i) => i.food.name), way: "All in one", savedAt: "2026-11-02T13:20:00Z" }]; seed.feedback = [];
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
      localStorage.setItem("chefmealan-cook-voice", "off");
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, s);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto(U + "/plate"); await p.waitForTimeout(1500);
    return p;
  };
  const hide = (p) => p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, .chat-fab, [class*=fab]")) t.style.display = "none"; for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (cs.position !== "fixed" || el.closest(".cook-mode") || el.classList.contains("cook-mode")) continue; if (el.tagName === "NAV" || el.querySelector("nav")) { if (el.getBoundingClientRect().top > 100) { el.style.position = "static"; document.body.appendChild(el); } } else el.style.display = "none"; } });
  const shot = async (p, name, full = true) => { await p.waitForTimeout(300); await hide(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot", name); };
  const note = (p, t, where = "main") => p.evaluate(({ t, NOTE, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const m = document.querySelector(where) || document.querySelector("main"); m.prepend(d); }, { t, NOTE, where });
  const plate = { items: crepes, title: "Vanilla protein crepes", plateAt: new Date().toISOString() };
  const toHow = async (p) => { await p.getByRole("button", { name: /^(Lock the recipe|Keep it as it is)$/ }).first().click(); await p.waitForTimeout(1000); };
  const NEWSTEPS = [
    "Whisk <b>2 eggs</b>, <b>100 g milk</b> and <b>25 g vanilla whey protein powder</b> in a bowl.",
    "Add <b>35 g wheat flour</b> and whisk until smooth. Rest the batter 5 minutes.",
    "Heat a non-stick pan on medium heat. Pour in a third of the batter and tilt the pan to spread it thin.",
    "Cook 1 to 2 minutes, until the edge lifts, then flip and cook 30 seconds more. Repeat with the rest.",
    "Mix <b>180 g quark</b> with <b>81 g banana</b>, mashed. Spread it on the crêpes, add <b>15 g chocolate chips</b> and roll them up.",
  ];
  // 1. Now: How to make it on the crêpes
  let p = await fresh(plate); await toHow(p);
  await p.evaluate((mark) => { const l = document.querySelector("main ol"); if (l) l.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.55): your crêpes carry the steps for a bowl you don't cook, kept with the recipe when it was saved: put the whey in a bowl, add the rest, stir. No pan, no heat; step 2 holds six foods.");
  await shot(p, "r216a");
  // 2. New: a cooked plate gets Chef Mealan's steps
  await p.evaluate(({ mark, STEPS }) => { document.querySelector(".bnote")?.remove();
    const l = document.querySelector("main ol"); if (!l) return;
    l.innerHTML = STEPS.map((x, k) => `<li><span>${k + 1}</span><div class="rp-step-text">${x.replace(/<b>/g, '<b class="st-amt">')}</div></li>`).join("");
    const lock = [...document.querySelectorAll("main button")].find((x) => /Lock the recipe/.test(x.textContent));
    if (lock) lock.insertAdjacentHTML("beforebegin", `<small class="muted" style="display:block;font-size:13px;line-height:1.45;margin:0 0 8px;${mark};padding:6px">Your recipe had the bowl steps from an earlier save. Lock the recipe keeps these new steps with it.</small>`);
    const sub = [...document.querySelectorAll("main .step-head p")][0]; if (sub) { sub.textContent = "Flour and eggs make a batter: this is cooked. Chef Mealan's steps, one or two foods at a time, at your amounts."; sub.style.cssText += ";" + mark; }
    l.style.cssText += ";" + mark; }, { mark, STEPS: NEWSTEPS });
  await note(p, "New (DT216): flour, a raw egg, raw meat or fish, or a batter make a plate cooked. A cooked plate never gets the bowl steps: it gets Chef Mealan's steps (3 to 8, every food in one), or Write my own.");
  await shot(p, "r216b"); await p.context().close();
  // 3. Now: cook mode on step 2 of the bowl steps
  p = await fresh(plate); await toHow(p);
  await p.getByRole("button", { name: /^Lock the recipe/ }).first().click(); await p.waitForTimeout(1000);
  await p.getByRole("button", { name: "Start cooking", exact: true }).first().click(); await p.waitForTimeout(800);
  await p.locator(".cook-mode").getByRole("button", { name: /Next/ }).click(); await p.waitForTimeout(400);
  await p.evaluate((mark) => { const t = document.querySelector(".cook-text"); if (t) t.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.55): cook mode reads step 2 in one go: six foods, about 15 seconds of reading before you can do anything.", ".cook-mode");
  await shot(p, "r217a", false);
  // 4. New, version 2 (Coach Milan 16:35): the whole step stays on top, to follow along; under it the moves, read one at a time
  const MOVES = ["Add 2 eggs, 104 g.", "Add 100 g milk.", "Add 35 g wheat flour.", "Add 180 g quark.", "Add 1 banana, 81 g.", "Add 15 g chocolate chips.", "Stir until it's one colour."];
  const movesOn = (at, mark, MOVES) => { document.querySelector(".bnote")?.remove(); document.querySelector(".mv-list")?.remove();
    const t = document.querySelector(".cook-text"); if (t) { t.style.cssText = t.style.cssText.replace(/outline[^;]*;?/g, "") + ";font-size:19px;line-height:1.4;font-weight:700"; }
    const card = document.querySelector(".cook-card");
    const box = document.createElement("div"); box.className = "mv-list"; box.style.cssText = "margin-top:14px;padding-top:12px;border-top:1px solid #d1dcf0;" + mark;
    box.innerHTML = `<small style="display:block;font-size:12px;font-weight:900;letter-spacing:.05em;color:#5b6b8a;margin-bottom:6px">READ ALOUD, ONE AT A TIME · ${at + 1} OF ${MOVES.length}</small>` + MOVES.map((m, k) => k < at
      ? `<div style="display:flex;gap:8px;align-items:center;padding:5px 0;color:#5b6b8a;font-size:15px"><span style="width:20px;color:#1e8e5a;font-weight:900">✓</span>${m}</div>`
      : k === at ? `<div style="display:flex;gap:8px;align-items:center;padding:8px 10px;margin:2px -10px;background:#dae6fb;border-radius:10px;color:#123a7a;font-size:20px;font-weight:900"><span style="width:20px">▶</span>${m}</div>`
      : `<div style="display:flex;gap:8px;align-items:center;padding:5px 0;color:#172742;font-size:15px"><span style="width:20px"></span>${m}</div>`).join("");
    card.appendChild(box);
    const nb = [...document.querySelectorAll(".cook-mode button")].find((x) => /Next|Done/.test(x.textContent)); if (nb) nb.textContent = at === MOVES.length - 1 ? "Done ✓" : "Next ›"; };
  await p.evaluate(({ src, mark, MOVES }) => eval(src)(2, mark, MOVES), { src: movesOn.toString(), mark, MOVES });
  await note(p, "New (DT217 v2): the whole step stays on top, to follow along. Under it the moves, read aloud one at a time: done ones ticked, this one large. Next and Back go move by move; the number buttons stay the written steps.", ".cook-mode");
  await shot(p, "r217b", false);
  // 5. New: the step's action
  await p.evaluate(({ src, mark, MOVES }) => eval(src)(6, mark, MOVES), { src: movesOn.toString(), mark, MOVES });
  await note(p, "New (DT217 v2): the last move is the step's action, with its timer when it names minutes. Next on it ticks the step on Make, as today.", ".cook-mode");
  await shot(p, "r217c", false); await p.context().close();
  await b.close();
})();
