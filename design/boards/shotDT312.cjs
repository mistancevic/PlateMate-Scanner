// Board DT312 (Coach Milan 18 November 2026, 10:05: Prep rebuilt to fit today's app; 27 November 14:29: Prepare it is misleading,
// the Prep page is empty of the Plate's information, the three steps are independent, feedback is asked before I eat; 14:33: yes,
// pull it into Now, widen it, draw it before DT346's Go). Three kinds of plate, each as in main 0.3.200 (this repo, built) and
// new below it: a recipe (Lazy Burek), a new dish I cook (Eggs and Salmon), a plate that is ready to eat (Skyr and Banana).
// The AI is off in a local run, so Chef Mealan drafts no steps here: the steps are written by hand.
const path = require("node:path"), fs = require("node:fs"), { spawn } = require("node:child_process");
// ROWS=new shoots the new rows on a scratch build of main with the change (BOARD_ROOT, /home/claude/work/b312, not committed)
const NEW = process.env.ROWS === "new";
const ROOT = NEW ? (process.env.BOARD_ROOT || "/home/claude/work/b312") : (process.env.BEFORE_ROOT || path.resolve(__dirname, "../.."));
const { chromium } = require(path.resolve(__dirname, "../../node_modules/playwright"));
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs312"; fs.mkdirSync(R, { recursive: true });
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats, fiber, extra = {}) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, table: undefined, icon: undefined, places: [], ...extra });
const Q = food("q", "Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0, { barcode: "4056489000001" }), P = food("p", "Frischer Blätterteig", 400, 6, 36, 25, 1.5, { barcode: "4056489000002" }),
  E = food("e", "Eggs", 143, 12.6, 0.7, 9.5, 0, { source: "Reference table", refId: "egg" }), F = food("f", "Feta Leicht", 180, 17, 1, 12, 0, { barcode: "4056489000003" });
const it = (id, f, g, part) => ({ id, food: f, grams: g, locked: false, ...(part ? { part } : {}) });
const burek = { id: "m-burek", title: "Lazy Burek", kitchen: "Balkan", items: [it("a", Q, 250, "Filling"), it("b", P, 375, "Base"), it("d", E, 122, "Filling"), it("h", F, 150, "Filling")], makes: { n: 4, unit: "portions" }, portion: 224, savedAt: "2026-11-23T16:00:00Z",
  steps: ["Mix 250 g Körniger Frischkäse, 122 g eggs and 150 g Feta Leicht.", "Lay out 375 g Frischer Blätterteig, spread the filling, roll it up.", "Bake at 200 °C for 25 minutes."] };
const omelette = { id: "m-om", title: "Feta omelette", kitchen: "Balkan", items: [it("o1", E, 122), it("o2", F, 50)], portion: 172, savedAt: "2026-11-20T08:00:00Z", steps: ["Whisk 2 eggs with 50 g Feta Leicht.", "Cook in a hot pan for 4 minutes."] };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5;white-space:normal`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = process.env.PORT || "3766";
const serve = async () => { const s = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${PORT}/`); break; } catch { await sleep(500); } } return s; };
const M = {};
(async () => {
  const s = await serve(); const b = await chromium.launch();
  const open = async (url) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-26T12:10:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, Q, P, E, F], meals: [burek, omelette], feedback: [] });
    await require(path.resolve(__dirname, "../../tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A Balkan pie.", around: "", better_as: "" }) }));
    await p.goto(`http://127.0.0.1:${PORT}${url}`); await sleep(1800);
    await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; } .toast, .snack { display: none !important; } *:has(> .cook-mode) > *:not(.cook-mode), body:has(.cook-mode) header, body:has(.cook-mode) .topbar { display: none !important; } .cook-mode { position: static !important; overflow: visible !important; } .plate-card > .plate-end > .prepare-it.pill-primary, .plate-card > .ways-out-col > .pill-primary { position: static !important; box-shadow: none !important; width: 100% !important; } main { padding-bottom: 24px !important; }"; document.head.append(st); });
    return p;
  };
  // q: a CSS selector, or JS: an expression that gives elements
  const Q_ = `const q = (s) => (s.startsWith("JS:") ? [eval(s.slice(3))].flat().filter(Boolean) : [...document.querySelectorAll(s)]);`;
  const note = (p, sel, html, marks = []) => p.evaluate(([Q_, sel, html, marks, MARK, NOTE]) => { eval(Q_ + "globalThis.__q = q"); const q = globalThis.__q;
    for (const m of marks) q(m).forEach((e) => { e.dataset.bm = "1"; e.style.cssText += ";" + MARK; });
    const t = q(sel)[0]; if (!t) return "missing " + sel; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement("afterend", n); return "ok"; }, [Q_, sel, html, marks, MARK, NOTE]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[data-bm]").forEach((e) => { e.style.outline = ""; delete e.dataset.bm; }); });
  // a whole screen (one tall picture), or from one element to another when the screen starts lower down
  const shot = async (p, name, from, to) => { await p.mouse.move(2, 2); await sleep(400);
    if (!from) { await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log(name, "full"); return; }
    const r = await p.evaluate(([Q_, from, to]) => { eval(Q_ + "globalThis.__q = q"); const q = globalThis.__q; const a = q(from)[0].getBoundingClientRect(), e = to ? q(to)[0]?.getBoundingClientRect() : null; const notes = [...document.querySelectorAll(".board-note")].map((n) => n.getBoundingClientRect().bottom);
      return { y: a.top + scrollY - 12, h: Math.max(e ? e.bottom : a.bottom, ...notes) - a.top + 26 }; }, [Q_, from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name, Math.round(r.h)); };
  // the design rules, measured: height (D10), corners (D16), weight, and the space above and below (D15)
  const measure = (p, key, sel) => p.evaluate(([Q_, sel]) => { eval(Q_ + "globalThis.__q = q"); const q = globalThis.__q; const e = q(sel)[0]; if (!e) return null; const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    const vis = (x) => x && x.getBoundingClientRect().height > 0 && getComputedStyle(x).display !== "none";
    let pr = e.previousElementSibling; while (pr && !vis(pr)) pr = pr.previousElementSibling; let nx = e.nextElementSibling; while (nx && !vis(nx)) nx = nx.nextElementSibling;
    return { h: Math.round(r.height), r: parseFloat(cs.borderTopLeftRadius), fw: cs.fontWeight, fs: parseFloat(cs.fontSize), above: pr ? Math.round(r.top - pr.getBoundingClientRect().bottom) : null, below: nx ? Math.round(nx.getBoundingClientRect().top - r.bottom) : null }; }, [Q_, sel]).then((m) => { M[key] = m; console.log("measure", key, JSON.stringify(m)); return m; });
  const px = (m) => (m ? `${m.h} px high${m.h < 44 ? ", under 44 px (D10)" : ""}, corners ${m.r >= 99 ? "round" : m.r + " px"}${m.r < 99 && m.r !== 14 ? ", not 14 px (D16)" : ""}` : "not found");
  const stored = (p, id) => p.evaluate((id) => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === id), id);
  const grams = (p, re, g) => p.getByLabel(re).first().fill(String(g)).then(() => p.getByLabel(re).first().press("Enter")).then(() => sleep(700));
  const tap = async (p, name) => { await p.getByRole("button", { name }).first().click(); await sleep(1000); };
  const topShot = async (p, name) => { await p.mouse.move(2, 2); await sleep(400); const h = await p.evaluate(() => Math.max(...[...document.querySelectorAll(".board-note")].map((n) => n.getBoundingClientRect().bottom + scrollY)) + 330); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width: 390, height: h } }); console.log(name, Math.round(h)); };
  const btn = (t) => `JS:[...document.querySelectorAll('button')].filter((b) => b.offsetParent && b.innerText.trim() === ${JSON.stringify(t)}).pop()`;
  const addFood = async (p, f) => { if (await p.getByRole("button", { name: "+ Add more to your plate" }).count()) { await p.getByRole("button", { name: "+ Add more to your plate" }).click(); await sleep(500); }
    await p.getByPlaceholder("Search all foods").fill(f); await sleep(800); await p.getByRole("button", { name: /^\+? ?Add$/ }).first().click(); await sleep(700); await p.getByRole("button", { name: "Close" }).first().click().catch(() => {}); await sleep(300); };
  const HEAD = ".step-head h2, .step-head .title-input";
  try {
    if (!NEW) {
    // ---- DT312.1 a recipe, in main ----
    let p = await open("/my-recipes/m-burek"); await tap(p, "Put it on the Plate");
    const m1 = await measure(p, "prepare1", btn("Prepare it as it is ›"));
    console.log(await note(p, btn("Prepare it as it is ›"), `The Plate ends with <b>Prepare it as it is ›</b> (${px(m1)}). Prepare sounds like go for it; it opens one more page. The steps are already here, under the button.`, [btn("Prepare it as it is ›"), ".in-steps-plate"]));
    await shot(p, "12-1a"); await clean(p); await tap(p, "Prepare it as it is ›");
    console.log(await note(p, ".phase-bar", "<b>Prep.</b> The bar ties Prep, Make and Eat into one chain. The Plate's numbers are gone: no PD card, no foods. What is here: What you make, the same steps once more, and <b>Lock it and cook ›</b>.", [".phase-bar"]));
    await shot(p, "12-1b"); await clean(p); await tap(p, "Lock it and cook ›");
    console.log(await note(p, btn("Cooked. Next: Eat ›"), "<b>Make</b> ends with <b>Cooked. Next: Eat ›</b>: Eat is the step after Make, so it opens before I have eaten.", [btn("Cooked. Next: Eat ›")]));
    await shot(p, "12-1c"); await clean(p); await tap(p, "Cooked. Next: Eat ›");
    console.log(await note(p, HEAD, "<b>Eat: how was it?</b> How much I ate and how it tasted, asked while the meal is still in front of me, uneaten.", [HEAD]));
    await shot(p, "12-1d"); await p.context().close();
    // ---- DT312.3 a new dish I cook, in main ----
    p = await open("/plate"); await p.getByRole("button", { name: /Add/ }).nth(7).click(); await sleep(600); await addFood(p, "Salmon");
    console.log(await note(p, ".plate-steps", "A new dish. <b>Prepare it ›</b> and Save it to My recipes come first; the Steps card is under them. <b>Write my own</b> does not open here: it jumps to the Prep page.", [".plate-steps", btn("Prepare it ›")]));
    await shot(p, "12-3a"); await clean(p); await tap(p, "Prepare it ›");
    console.log(await note(p, HEAD, "<b>Prep</b>, How to make Eggs &amp; Salmon: nothing of the Plate, only the place where steps are written, and Lock it and cook ›. (Here the AI is off, so no draft.)", [HEAD]));
    await shot(p, "12-3b"); await clean(p); await tap(p, "Lock it and cook ›");
    await shot(p, "12-3c"); await tap(p, "Cooked. Next: Eat ›"); await shot(p, "12-3d"); await p.context().close();
    // ---- DT312.5 a plate that is ready to eat, in main ----
    p = await open("/plate"); await addFood(p, "Skyr"); await addFood(p, "Banana");
    console.log(await note(p, btn("Prepare it ›"), "Skyr and a banana: nothing to cook. The Plate still ends with <b>Prepare it ›</b>.", [btn("Prepare it ›")]));
    await shot(p, "12-5a"); await clean(p); await tap(p, "Prepare it ›");
    console.log(await note(p, HEAD, "<b>Prep</b> asks <b>How do you want to eat it?</b>: three fixed ways, and one has to be picked to go on (the quick set from the early app, DT312's first note).", [".how"]));
    await shot(p, "12-5b"); await clean(p); await p.locator(".way").first().click(); await sleep(300); await tap(p, "Make it this way ›");
    console.log(await note(p, HEAD, "<b>Make</b> for a bowl of skyr: Start cooking, steps to tick, How did the cooking go?, Cooked. Next: Eat ›.", [HEAD]));
    await shot(p, "12-5c"); await clean(p); await tap(p, "Cooked. Next: Eat ›"); await shot(p, "12-5d"); await p.context().close();
    // ---- DT312.7 from a recipe's page, in main: the other cooking flow ----
    p = await open("/my-recipes/m-burek");
    const sc = "JS:[...document.querySelectorAll('.rq-steps button')].find((b) => b.innerText.trim() === 'Start cooking')";
    console.log(await note(p, sc, "The other way in: <b>Start cooking</b> on the recipe's page, at the end of Steps. It skips the Plate, Prep and the Make page.", [sc]));
    await shot(p, "12-7a", ".rq-steps", ".rq-steps"); await clean(p); await p.locator(".rq-steps").getByRole("button", { name: "Start cooking" }).click(); await sleep(1500);
    console.log(await note(p, ".cook-top", "<b>Cook mode</b> opens at once, on <b>Get it ready</b>: put out what you need, each food with its amount; then one step at a time, read aloud. From the Plate this is one more tap away, behind a second Start cooking on the Make page (DT312.1c).", [".cook-ready-top, .cook-count"]));
    await shot(p, "12-7b"); await clean(p); await p.getByRole("button", { name: "Buttons only" }).click(); await sleep(400); await p.getByRole("button", { name: /Step 1 ›/ }).first().click(); await sleep(600);
    for (let i = 0; i < 25 && !(await p.locator(".cook-to-eat").count()); i++) { await p.locator(".cook-mode").getByRole("button", { name: /^Next ›|^Done/ }).first().click(); await sleep(350); }
    console.log(await note(p, ".cook-to-eat", "Cook mode's last screen: the photo of the meal and <b>Cooked. Next: Eat ›</b>. How did the cooking go? is not here: it is on the Make page, behind the link Make: step photos and notes ›.", [".cook-to-eat", ".cook-done-links"]));
    await shot(p, "12-7c"); await clean(p); await p.locator(".cook-to-eat").click(); await sleep(1200);
    await shot(p, "12-7d"); await p.context().close();
    }
    if (NEW) {
    const HOW = async (p, name, text, marks = []) => { console.log(await note(p, HEAD, text, [HEAD, ...marks])); await shot(p, name); await clean(p); };
    const cookThrough = async (p) => { await p.getByRole("button", { name: "Buttons only" }).click().catch(() => {}); await sleep(400); await p.getByRole("button", { name: /Step 1 ›/ }).first().click(); await sleep(600);
      for (let i = 0; i < 25 && !(await p.locator(".cook-to-eat").count()); i++) { await p.locator(".cook-mode").getByRole("button", { name: /^Next ›|^Done/ }).first().click(); await sleep(350); } };
    // ---- DT312.8 the ways in, side by side; DT312.9 the one cook; DT312.10 after Cooked ----
    // 8a a recipe's page
    let p = await open("/my-recipes/m-burek");
    const sc = "JS:[...document.querySelectorAll('.rq-steps button')].find((b) => b.innerText.trim() === 'Start cooking')";
    console.log(await note(p, sc, "<b>No change:</b> a recipe's page, <b>Start cooking</b>. It hands the cook the name, the foods with their amounts and the steps.", [sc]));
    await shot(p, "12-8a", ".rq-steps", ".rq-steps"); await p.context().close();
    // 8b a recipe's copy on the Plate, then the cook (9a to 9c), then after Cooked (10a, 10b)
    p = await open("/my-recipes/m-burek"); await tap(p, "Put it on the Plate");
    const m1 = await measure(p, "start8", btn("Start cooking ›"));
    console.log(await note(p, ".mk-on-plate", "<b>New, moved:</b> <b>What you make</b> comes from Prep onto the Plate, above the steps.", [".mk-on-plate"]));
    console.log(await note(p, btn("Start cooking ›"), `<b>New:</b> the Plate ends with <b>Start cooking ›</b> (${px(m1)}), the one filled button. On the phone it is pinned to the bottom of the screen while I scroll (DT312.12a); this tall picture shows it at the end. It hands the cook the same three things as the recipe's page: the name, the foods, the steps. No Prep page, no Lock it and cook.`, [btn("Start cooking ›")]));
    await shot(p, "12-8b"); await clean(p); await tap(p, "Start cooking ›");
    console.log(await note(p, ".cook-top", "<b>New for the Plate, as from a recipe's page:</b> the cook opens at once on <b>Get it ready</b>: put out what you need, each food with its amount. The first time it asks: voice or buttons. No Make page in between, no second Start cooking.", [".cook-top"]));
    await shot(p, "12-9a"); await clean(p); await p.getByRole("button", { name: "Buttons only" }).click(); await sleep(400); await p.getByRole("button", { name: /Step 1 ›/ }).first().click(); await sleep(600);
    console.log(await note(p, ".cook-top", "<b>No change:</b> the steps, one at a time, with voice or buttons, and a photo on any step. ✕ Close leaves in the middle: the strip then says Cooking now, Go on › (DT312.8e).", []));
    await shot(p, "12-9b"); await clean(p);
    // leave in the middle: the strip, the fifth way in
    await p.getByRole("button", { name: "✕ Close" }).click(); await sleep(1200);
    console.log(await note(p, ".cook-strip", "<b>New:</b> ✕ Close in the middle leads here, not to a Make page. <b>Cooking now · Lazy Burek · step 1 of 3 · Go on ›</b>, on every page, opens the cook again where I left it.", [".cook-strip"]));
    await topShot(p, "12-8e"); await clean(p); await p.locator(".cs-main").click(); await sleep(1200);
    for (let i = 0; i < 25 && !(await p.locator(".cook-to-eat").count()); i++) { const s1 = p.getByRole("button", { name: /Step 1 ›/ }).first(); if (await s1.count()) await s1.click(); else await p.locator(".cook-mode").getByRole("button", { name: /^Next ›|^Done/ }).first().click(); await sleep(350); }
    const mc = await measure(p, "cooked", ".cook-to-eat");
    console.log(await note(p, ".cook-went", "<b>New, moved:</b> <b>How did the cooking go?</b> comes from the Make page onto the cook's last screen, with the photo of the meal.", [".cook-went"]));
    console.log(await note(p, ".cook-waits", `<b>New:</b> the cook ends with <b>Cooked ›</b> (${px(mc)}) and the line under it. The Make page is gone: its ticks, step photos, the meal's photo and the question are all in the cook. I tap Cooked ›.`, [".cook-to-eat"]));
    await shot(p, "12-9c"); await clean(p); await p.locator(".cook-to-eat").click(); await sleep(1300);
    console.log(await note(p, ".cook-strip", "<b>New:</b> after Cooked, always the same: <b>Ready to eat · Lazy Burek · I ate it ›</b>, on Today and on every page. Nothing is asked before I have eaten.", [".cook-strip"]));
    await topShot(p, "12-10a"); await clean(p); await p.locator(".cs-main").click(); await sleep(1200);
    await HOW(p, "12-10b", "<b>New:</b> <b>How was it?</b> opens from I ate it; no bar; Later today is gone. For <b>a recipe as it is</b> nothing more is asked: the card points at the recipe. For a changed copy the question of DT346 comes here: Update my recipe, Save as a new recipe, Only this time.");
    await p.context().close();
    // 8c, 8d a new dish on the Plate; 10c its ending
    p = await open("/plate"); await p.getByRole("button", { name: /Add/ }).nth(7).click(); await sleep(600); await addFood(p, "Salmon");
    await tap(p, "Write my own"); await p.getByLabel(/Your steps/).fill("Fry the salmon for 3 minutes on each side.\nScramble the egg next to it."); await sleep(300);
    console.log(await note(p, ".plate-steps", "<b>New:</b> the steps are written on the Plate: <b>Write my own</b> opens here, one step per line. Chef Mealan's draft lands in the same card. I tap Keep my steps.", [".plate-steps"]));
    await shot(p, "12-8c"); await clean(p); await tap(p, "Keep my steps");
    console.log(await note(p, btn("Start cooking ›"), "<b>New:</b> a new dish has the same <b>Start cooking ›</b>, filled, pinned on the phone (DT312.12b), and hands over the same three things. Chef Mealan's first way is outlined with his hat; Save it to My recipes stays outlined.", [btn("Start cooking ›"), ".plate-steps"]));
    await shot(p, "12-8d"); await clean(p); await tap(p, "Start cooking ›"); await cookThrough(p); await p.locator(".cook-to-eat").click(); await sleep(1300); await p.locator(".cs-main").click(); await sleep(1200);
    await HOW(p, "12-10c", "<b>A new dish:</b> the same page; its last question is <b>Save in My recipes</b>.", [".save-recipe"]);
    await p.context().close();
    // 10d, 10e a plate with nothing to cook skips the middle
    p = await open("/plate"); await addFood(p, "Skyr"); await addFood(p, "Banana");
    const m3 = await measure(p, "eatIt", btn("Eat it ›"));
    console.log(await note(p, btn("Eat it ›"), `<b>New:</b> nothing to cook, so the Plate ends with <b>Eat it ›</b>, filled (${px(m3)}), pinned on the phone (DT312.12c), and skips the cook. It leads to the same strip on Today: Ready to eat · Skyr &amp; Banana · I ate it ›. The three ways of How do you want to eat it? go away (Coach Milan 15:44).`, [btn("Eat it ›")]));
    await shot(p, "12-10d"); await clean(p); await tap(p, "Eat it ›"); await p.locator(".cs-main").click(); await sleep(1200);
    await HOW(p, "12-10e", "<b>A plate that was ready to eat:</b> the same page, the same questions; Back leads to the plate.");
    await p.context().close();
    // ---- DT312.13 a cooked meal that waits: Chef Mealan asks once, 30 minutes after the later of the mealtime and Cooked ----
    const STY = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; } .toast, .snack { display: none !important; } *:has(> .cook-mode) > *:not(.cook-mode), body:has(.cook-mode) header, body:has(.cook-mode) .topbar { display: none !important; } .cook-mode { position: static !important; overflow: visible !important; } .plate-card > .plate-end > .prepare-it.pill-primary, .plate-card > .ways-out-col > .pill-primary { position: static !important; box-shadow: none !important; width: 100% !important; } main { padding-bottom: 24px !important; }";
    const restyle = (q) => q.evaluate((t) => { const st = document.createElement("style"); st.textContent = t; document.head.append(st); }, STY);
    const stamp = (q, text) => q.evaluate((text) => { document.querySelectorAll(".board-stamp").forEach((n) => n.remove()); const d = document.createElement("div"); d.className = "board-stamp"; d.style.cssText = "background:#fff8d6;border-bottom:2px solid #2a72d9;color:#172742;font:700 14px Nunito,system-ui,sans-serif;padding:8px 16px;text-align:center"; d.textContent = text; document.body.prepend(d); }, text);
    const later = async (q, hm) => { await q.clock.setFixedTime(new Date(`2026-11-26T${hm}:00+01:00`)); await q.reload(); await sleep(1800); await restyle(q); await stamp(q, `Thursday, 26 November, ${hm}`); };
    p = await open("/my-recipes/m-burek"); await tap(p, "Put it on the Plate");
    await p.getByRole("button", { name: "Change what this plate is" }).click(); await sleep(700); await p.locator(".pcal-row").filter({ hasText: /Lunch/ }).first().click(); await sleep(600); await p.getByRole("button", { name: "Close" }).first().click().catch(() => {}); await sleep(400);
    await tap(p, "Start cooking ›"); await cookThrough(p); await p.locator(".cook-to-eat").click(); await sleep(1300); await stamp(p, "Thursday, 26 November, 12:10");
    console.log(await note(p, ".next-cook", "<b>As DT312.11c:</b> cooked at 12:10 for lunch at 13:45. The meal waits in Lunch's place with I ate it ›. Nothing is counted yet.", [".next-cook"]));
    await topShot(p, "12-13a"); await clean(p); await later(p, "14:20");
    const ma = await measure(p, "eatAsk", ".eat-ask-acts .pill");
    console.log(await note(p, ".next-cook", `<b>New:</b> 14:20, I open the app: 30 minutes after the later of the mealtime (13:45) and Cooked (12:10). Chef Mealan asks once, in the meal's place: <b>Did you eat your Lazy Burek?</b> with <b>Not after all</b>, <b>Not yet</b> and <b>I ate it ›</b> (${px(ma)}). Nothing is logged by itself, however long it waits.`, [".eat-ask"]));
    await topShot(p, "12-13b"); await clean(p); await p.getByRole("button", { name: "Not yet" }).click(); await sleep(700);
    console.log(await note(p, ".next-cook", "<b>New:</b> after <b>Not yet</b>: the meal goes on waiting with I ate it ›, and the question does not come again today. I ate it › opens How was it? (DT312.11d). Not after all ends it; nothing is logged.", [".next-cook"]));
    await topShot(p, "12-13c"); await p.context().close();
    p = await open("/plate"); await p.getByRole("button", { name: /Add/ }).nth(7).click(); await sleep(600); await addFood(p, "Salmon");
    await tap(p, "Start cooking ›"); await cookThrough(p); await p.locator(".cook-to-eat").click(); await sleep(1300); await later(p, "12:45");
    console.log(await note(p, ".eat-ask-card", "<b>New, without a meal set:</b> 30 minutes after Cooked (12:10), the question takes the strip's place on Today. I ate it › then asks which meal it was, as Save does now.", [".eat-ask-card"]));
    await topShot(p, "12-13d"); await p.context().close();
    // ---- DT312.12 the main step stays in view: the phone's screen as it is, the tab bar and Chef Mealan's button in place ----
    const pinned = (t) => `JS:[...document.querySelectorAll('.plate-card button')].find((b) => b.innerText.trim() === ${JSON.stringify(t)})`;
    const phone = async (url) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const q = await ctx.newPage();
      await q.clock.setFixedTime(new Date("2026-11-26T12:10:00+01:00"));
      await q.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
        localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
        localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, Q, P, E, F], meals: [burek, omelette], feedback: [] });
      await require(path.resolve(__dirname, "../../tests/flows/adult.cjs"))(q);
      await q.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
      await q.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", better_as: "" }) }));
      await q.goto(`http://127.0.0.1:${PORT}${url}`); await sleep(1800);
      await q.evaluate(() => { const st = document.createElement("style"); st.textContent = ".toast, .snack { display: none !important; }"; document.head.append(st); }); return q; };
    const screen = async (q, name, text, main) => { const mp = await measure(q, `pin-${name}`, main); const gap = await q.evaluate((sel) => { const b = eval(sel.slice(3)), f = document.querySelector(".chat-fab"), n = document.querySelector(".bottom-nav"); if (!b) return null; const r = b.getBoundingClientRect(); return { toFab: f ? Math.round(f.getBoundingClientRect().left - r.right) : null, toNav: n ? Math.round(n.getBoundingClientRect().top - r.bottom) : null }; }, main);
      console.log("pin", name, JSON.stringify(gap));
      console.log(await note(q, ".meal-line", `${text} ${mp ? mp.h + " px high (D10), corners " + mp.r + " px (D16)" : ""}${gap && gap.toFab !== null ? `, ${gap.toFab} px from Chef Mealan's button, ${gap.toNav} px above the tab bar` : ""}.`, [main]));
      await q.evaluate(() => window.scrollTo(0, 0)); await q.mouse.move(2, 2); await sleep(500); await q.screenshot({ path: `${R}/${name}.png` }); console.log(name, "screen"); await q.context().close(); };
    let q = await phone("/my-recipes/m-burek"); await q.getByRole("button", { name: "Put it on the Plate" }).first().click(); await sleep(1200);
    await screen(q, "12-12a", "<b>New:</b> the phone's screen, not a tall picture. <b>Start cooking ›</b> stays pinned at the bottom while I scroll the foods, What you make and the steps: the next step is always one tap away. It is the first pinned button in the app.", pinned("Start cooking ›"));
    q = await phone("/plate"); await q.getByRole("button", { name: /Add/ }).nth(7).click(); await sleep(600); await addFood(q, "Salmon");
    await screen(q, "12-12b", "<b>New:</b> a new dish: the same pinned <b>Start cooking ›</b>. Save it to My recipes stays at the end of the page.", pinned("Start cooking ›"));
    q = await phone("/plate"); await addFood(q, "Skyr"); await addFood(q, "Banana");
    await screen(q, "12-12c", "<b>New:</b> a plate that is ready to eat: <b>Eat it ›</b> in the same place.", pinned("Eat it ›"));
    // ---- DT312.11 with a meal set on the Plate: the meal sits in its place on Today (Coach Milan 16:42) ----
    p = await open("/my-recipes/m-burek"); await tap(p, "Put it on the Plate");
    await p.getByRole("button", { name: "Change what this plate is" }).click(); await sleep(700); await p.locator(".pcal-row").filter({ hasText: /Lunch/ }).first().click(); await sleep(600); await p.getByRole("button", { name: "Close" }).first().click().catch(() => {}); await sleep(400);
    console.log(await note(p, ".meal-line", "<b>No change:</b> on the Plate, Meal and day says <b>Lunch, Thursday, 26 November, 13:45</b>. The cook takes the meal with it. I tap Start cooking ›, cook step 1, then ✕ Close.", [".meal-line"]));
    await shot(p, "12-11a", ".step-head", ".pd-card"); await clean(p);
    await tap(p, "Start cooking ›"); await p.getByRole("button", { name: "Buttons only" }).click(); await sleep(300); await p.getByRole("button", { name: /Step 1 ›/ }).first().click(); await sleep(500);
    await p.getByRole("button", { name: "✕ Close" }).click(); await sleep(1200);
    console.log(await note(p, ".next-cook", "<b>New:</b> the meal sits in its place on Today: <b>Lunch, 13:45 · Lazy Burek · Cooking now · step 1 of 3 · Go on ›</b>. No blue strip on Today; on the other pages the strip stays, to come back from anywhere.", [".next-cook"]));
    await topShot(p, "12-11b"); await clean(p); await p.getByRole("button", { name: "Go on ›" }).click(); await sleep(1200);
    for (let i = 0; i < 25 && !(await p.locator(".cook-to-eat").count()); i++) { const s1 = p.getByRole("button", { name: /Step 1 ›/ }).first(); if (await s1.count()) await s1.click(); else await p.locator(".cook-mode").getByRole("button", { name: /^Next ›|^Done/ }).first().click(); await sleep(350); }
    await p.locator(".cook-to-eat").click(); await sleep(1300);
    const mi = await measure(p, "slotAte", ".next-cook .pill");
    console.log(await note(p, ".next-cook", `<b>New:</b> after Cooked, the same place: <b>Lunch, 13:45 · Lazy Burek · Cooked, ready to eat · I ate it ›</b> (${px(mi)}). Without a meal set, the strip of DT312.10a stays.`, [".next-cook"]));
    await topShot(p, "12-11c"); await clean(p); await p.getByRole("button", { name: "I ate it ›" }).click(); await sleep(1200);
    await HOW(p, "12-11d", "<b>New:</b> How was it? for lunch. The meal is known, so Save asks no Which meal is it?; it is logged as Lunch.");
    await p.context().close();
    }
  } catch (e) { console.log("ERR", e.message.slice(0, 500)); } finally { fs.writeFileSync(`${R}/measures-${NEW ? "new" : "main"}.json`, JSON.stringify(M, null, 1)); await b.close(); s.kill(); }
})();
