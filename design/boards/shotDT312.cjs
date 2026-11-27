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
    await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; } .toast, .snack { display: none !important; }"; document.head.append(st); });
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
    }
    if (NEW) {
    const strip = async (p, name, title) => { console.log(await note(p, ".cook-strip", `<b>New:</b> cooking is over. On Today, and on every page: <b>Ready to eat · ${title} · I ate it ›</b>. Nothing is asked before I have eaten. The ✕ ends it without answers.`, [".cook-strip"])); await topShot(p, name); await clean(p); await p.locator(".cs-main").click(); await sleep(1200); };
    const how = async (p, name, extra) => { console.log(await note(p, HEAD, `<b>New:</b> opens from I ate it. The title is <b>How was it?</b>, no bar. Later today is gone: the strip is the wait. ${extra}`, [HEAD])); await shot(p, name); };
    // ---- DT312.2 a recipe, new ----
    let p = await open("/my-recipes/m-burek"); await tap(p, "Put it on the Plate");
    const m1 = await measure(p, "start2", btn("Start cooking ›")), mk = await measure(p, "whatYouMake", ".mk-on-plate");
    console.log(await note(p, ".mk-on-plate", "<b>New, moved:</b> <b>What you make</b> comes from Prep onto the Plate, above the steps, next to the numbers it belongs to.", [".mk-on-plate"]));
    console.log(await note(p, btn("Start cooking ›"), `<b>New:</b> the Plate ends with <b>Start cooking ›</b> (${px(m1)}), at the end of the page: after the foods, What you make and the steps. No Prep page, no Lock it and cook.`, [btn("Start cooking ›")]));
    await shot(p, "12-2a"); await clean(p); await tap(p, "Start cooking ›");
    const m2 = await measure(p, "cooked", btn("Cooked ›"));
    console.log(await note(p, ".step-head", "<b>New:</b> no Prep, Make, Eat bar; Back to the plate.", []));
    console.log(await note(p, btn("Cooked ›"), `<b>New:</b> Make ends with <b>Cooked ›</b> (${px(m2)}) and the line: Enjoy it. It waits on every page: tap I ate it when you have eaten. I tap Cooked ›.`, [btn("Cooked ›")]));
    await shot(p, "12-2b"); await clean(p); await tap(p, "Cooked ›");
    await strip(p, "12-2c", "Lazy Burek"); await how(p, "12-2d", "The questions are the same."); await p.context().close();
    // ---- DT312.4 a new dish I cook, new ----
    p = await open("/plate"); await p.getByRole("button", { name: /Add/ }).nth(7).click(); await sleep(600); await addFood(p, "Salmon");
    await tap(p, "Write my own"); await p.getByLabel(/Your steps/).fill("Fry the salmon for 3 minutes on each side.\nScramble the egg next to it."); await sleep(300);
    console.log(await note(p, ".plate-steps", "<b>New:</b> the steps are written on the Plate: <b>Write my own</b> opens here, one step per line, Keep my steps. Chef Mealan's draft lands in the same card. I tap Keep my steps.", [".plate-steps"]));
    await shot(p, "12-4a"); await clean(p); await tap(p, "Keep my steps");
    console.log(await note(p, btn("Start cooking ›"), "<b>New:</b> the steps stay in view; Change the steps opens them again here. The Plate ends with <b>Start cooking ›</b>, filled: the one filled button, the main step (D1, D6; Coach Milan 16:01). Chef Mealan's first way, Add a protein base, is outlined with his hat; Save it to My recipes stays outlined.", [btn("Start cooking ›"), ".plate-steps"]));
    await shot(p, "12-4b"); await clean(p); await tap(p, "Start cooking ›");
    await shot(p, "12-4c"); await tap(p, "Cooked ›");
    await strip(p, "12-4d", "Eggs &amp; Salmon"); await how(p, "12-4e", "Save in My recipes is asked here, as before."); await p.context().close();
    // ---- DT312.6 a plate that is ready to eat, new ----
    p = await open("/plate"); await addFood(p, "Skyr"); await addFood(p, "Banana");
    const m3 = await measure(p, "eatIt", btn("Eat it ›"));
    console.log(await note(p, btn("Eat it ›"), `<b>New:</b> nothing to cook, so the Plate ends with <b>Eat it ›</b>, filled (${px(m3)}): no Prep, no Make. The three ways of How do you want to eat it? (DT312.5b) go away: they were the first mocked step of the flow, and the Plate builds much more now (Coach Milan 27 November 15:44).`, [btn("Eat it ›")]));
    await shot(p, "12-6a"); await clean(p); await tap(p, "Eat it ›");
    await strip(p, "12-6b", "Skyr &amp; Banana"); await how(p, "12-6c", "Back leads to the plate."); await p.context().close();
    }
  } catch (e) { console.log("ERR", e.message.slice(0, 500)); } finally { fs.writeFileSync(`${R}/measures-${NEW ? "new" : "main"}.json`, JSON.stringify(M, null, 1)); await b.close(); s.kill(); }
})();
