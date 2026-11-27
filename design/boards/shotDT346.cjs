// Board DT346 (Coach Milan 23 November 2026, 19:03, after making Lazy Burek: it is not clear when you edit the recipe and when the
// Plate makes a new one; 26 November 14:25: pull main, draw the three states as they are in main). Everything here is main,
// 0.3.200 (this repo, built). Found while drawing: the second state is two in main, by whether the recipe says how many
// servings it makes. So four rows: DT346.1 Edit recipe, DT346.2 Put it on the Plate with servings (Lazy Burek, 4),
// DT346.3 Put it on the Plate for one plate (Feta omelette), DT346.4 a new dish on the Plate. Nothing in the app changes.
const path = require("node:path"), fs = require("node:fs"), { spawn } = require("node:child_process");
// ROWS=new shoots DT346.5 and DT346.6 on a scratch build of main with the change (BOARD_ROOT, /home/claude/work/b346, not committed)
const NEW = process.env.ROWS === "new";
const ROOT = NEW ? (process.env.BOARD_ROOT || "/home/claude/work/b346") : (process.env.BEFORE_ROOT || path.resolve(__dirname, "../.."));
const { chromium } = require(path.resolve(__dirname, "../../node_modules/playwright"));
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs346"; fs.mkdirSync(R, { recursive: true });
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
const PORT = process.env.PORT || "3746";
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
  try {
    if (!NEW) {
    // ---- DT346.1 Edit recipe on the recipe page ----
    let p = await open("/my-recipes/m-burek");
    const edit = "JS:[...document.querySelectorAll('.rq button')].find((b) => b.innerText.trim() === 'Edit recipe')";
    const m1 = await measure(p, "editBtn", edit);
    console.log(await note(p, edit, `Lazy Burek's page, as I read it. <b>Edit recipe</b> is near the end, under Good for, with the line under it: change the recipe itself. The button is ${px(m1)}. I tap Edit recipe.`, [edit]));
    await shot(p, "46-1a"); await clean(p);
    await tap(p, "Edit recipe");
    const m2 = await measure(p, "tag", ".rq-editing");
    const saveBtn = "JS:[...document.querySelectorAll('.rq button')].find((b) => b.innerText.trim() === 'Save changes')";
    const m3 = await measure(p, "saveChanges", saveBtn), m4 = await measure(p, "saveNew", "JS:[...document.querySelectorAll('.rq button')].find((b) => b.innerText.trim() === 'Save as a new recipe')"), m5 = await measure(p, "cancel", "JS:[...document.querySelectorAll('.rq button')].find((b) => b.innerText.trim() === 'Cancel')");
    console.log(await note(p, ".rq-editing", `The only sign that I am changing the recipe itself: the small dark tag <b>Editing the recipe</b>, ${m2 ? m2.h + " px high, " + m2.fs + " px type" : ""}. The page is the same page as before: the same title, photo and PD card; further down, Foods and Steps turn into fields in a blue frame (the app's own frame, not a board mark).`, [".rq-editing"]));
    await grams(p, /Grams of Frischer/, 300);
    console.log(await note(p, saveBtn, `At the end: <b>Save changes</b> (${px(m3)}), <b>Save as a new recipe</b> (${px(m4)}), the line, then <b>Cancel</b> (${px(m5)}). Space between Save changes and Save as a new recipe: ${m3 ? m3.below : "?"} px. Nothing here says where the change goes: every meal and plan with Lazy Burek. I set Frischer Blätterteig to 300 g and tap Save changes.`, [saveBtn]));
    await shot(p, "46-1b"); await clean(p);
    await tap(p, "Save changes");
    const s1 = await stored(p, "m-burek");
    console.log(await note(p, ".rq .readout, .rq .pd-card, .rq [class*=pd]", `Saved at once, in place: the PD card now counts 300 g of Frischer Blätterteig (stored: ${s1.items.find((i) => i.food.id === "p").grams} g). No line says it was saved; the page is the reading page again.`, [".rq-name"]));
    await shot(p, "46-1c", ".rq-back", ".rq .readout, .rq .pd-card, .rq [class*=pd]"); await clean(p);
    await p.context().close();

    // ---- DT346.2 Put it on the Plate: a recipe with servings (Lazy Burek makes 4) ----
    p = await open("/my-recipes/m-burek");
    const actions = ".rq-actions";
    console.log(await note(p, actions, "Lazy Burek's page, further down: <b>What do you do with it?</b> The line says: on the Plate, change foods; <b>the recipe stays as it is</b>. I tap Put it on the Plate.", [actions]));
    await shot(p, "46-2a", actions, actions); await clean(p);
    await tap(p, "Put it on the Plate");
    const sub2 = await p.evaluate(() => [...document.querySelectorAll("p, small, span, div")].map((e) => e.childElementCount === 0 ? e.innerText : "").find((t) => /^From /.test(t || "")) || "");
    console.log("sub2", sub2);
    const head2 = "JS:[...document.querySelectorAll('p, small, span, div')].find((e) => e.childElementCount === 0 && /^From your screenshot/.test(e.innerText))";
    console.log(await note(p, head2, `The Plate holds a copy. The line under the title says <b>${sub2}</b> Lazy Burek was made by hand, not from a screenshot: in main every recipe that says how many servings it makes gets this line. Nothing on the screen says the recipe stays as it is.`, [head2]));
    await grams(p, /Grams of Frischer/, 300);
    const prep2 = "JS:[...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Prepare it as it is ›')";
    const m6 = await measure(p, "prepareAsIs", prep2);
    console.log(await note(p, prep2, `I set Frischer Blätterteig to 300 g. The main step stays <b>Prepare it as it is ›</b> (${px(m6)}), though the plate is no longer as it is. I tap it.`, [prep2]));
    await shot(p, "46-2b"); await clean(p);
    await tap(p, "Prepare it as it is ›");
    console.log(await note(p, "JS:[...document.querySelectorAll('h1, h2, .step-title, b')].find((e) => /How to make/.test(e.innerText))", "Prep: <b>You make the whole recipe</b>, 897 g, 2,194 kcal, the recipe as saved; <b>You eat the whole recipe</b>, 822 g, the plate with my change. I tap Lock it and cook ›.", []));
    await shot(p, "46-2c"); await clean(p);
    await tap(p, "Lock it and cook ›");
    await shot(p, "46-2d");
    await tap(p, "Cooked. Next: Eat ›"); await tap(p, "DaaM good");
    const ptr = "JS:[...document.querySelectorAll('p, small')].find((e) => /is in My recipes already/.test(e.innerText))";
    const m7 = await measure(p, "eatSave", "JS:[...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Save').pop()");
    console.log(await note(p, ptr, "Eat says <b>Lazy Burek is in My recipes already. This card points at it.</b> No question about the change: 300 g instead of 375 g stays on this meal only. I tap Save.", [ptr]));
    await shot(p, "46-2e"); await clean(p);
    await tap(p, "Save");
    const s2 = await stored(p, "m-burek");
    await p.goto(`http://127.0.0.1:${PORT}/my-recipes/m-burek`); await sleep(1500);
    await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; }"; document.head.append(st); });
    console.log(await note(p, ".rq-foods", `Back in Recipes, Lazy Burek still has ${s2.items.find((i) => i.food.id === "p").grams} g of Frischer Blätterteig: the change on the Plate did not reach the recipe, and I was never asked.`, [".rq-foods"]));
    await shot(p, "46-2f", ".rq-foods", ".rq-foods"); await clean(p);
    await p.context().close();

    // ---- DT346.3 Put it on the Plate: a recipe for one plate (Feta omelette, no servings) ----
    p = await open("/my-recipes/m-om");
    console.log(await note(p, ".rq-actions", "Feta omelette's page, the same card: <b>the recipe stays as it is</b>. This recipe does not say how many servings it makes. I tap Put it on the Plate.", [".rq-actions"]));
    await shot(p, "46-3a", ".rq-actions", ".rq-actions"); await clean(p);
    await tap(p, "Put it on the Plate");
    const head3 = "JS:[...document.querySelectorAll('p, small, span, div')].find((e) => e.childElementCount === 0 && /^From My recipes/.test(e.innerText))";
    await grams(p, /Grams of Feta/, 80);
    const prep3 = "JS:[...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Prepare it ›')", keep3 = "JS:[...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Save it to My recipes')";
    const m8 = await measure(p, "prepare", prep3), m9 = await measure(p, "saveToMine", keep3);
    console.log(await note(p, head3, "The Plate holds a copy, with another line: <b>From My recipes. Change what you like, then Fit to my target or Keep it as it is.</b> The same Plate, the same look as a new dish (DT346.4b).", [head3]));
    console.log(await note(p, keep3, `I set Feta Leicht to 80 g. <b>Prepare it ›</b> (${px(m8)}) and <b>Save it to My recipes</b> (${px(m9)}), ${m8 ? m8.below : "?"} px apart: Save it to My recipes on a recipe that is in My recipes already. I tap Prepare it ›.`, [prep3, keep3]));
    await shot(p, "46-3b"); await clean(p);
    await tap(p, "Prepare it ›"); await shot(p, "46-3c");
    await tap(p, "Lock it and cook ›"); await shot(p, "46-3d");
    await tap(p, "Cooked. Next: Eat ›"); await tap(p, "DaaM good");
    const ask = ".changed-ask";
    const m10 = await measure(p, "askChoice", ".changed-ask .choice");
    console.log(await note(p, ask, `Here Eat asks: <b>Changed from your recipe Feta omelette</b>, what changed, then <b>Update my recipe</b>, <b>Save as a new recipe</b>, <b>Only this time</b> (chosen by itself). The three are chips, ${px(m10)}. Only at the end do I learn that a change could go back to the recipe.`, [ask]));
    await shot(p, "46-3e"); await clean(p);
    await p.context().close();

    // ---- DT346.4 A new dish on the Plate ----
    p = await open("/plate");
    const eggsAdd = "JS:[...document.querySelectorAll('button')].filter((b) => /Add/.test(b.innerText))[7]";
    console.log(await note(p, "JS:[...document.querySelectorAll('input')].find((i) => /Meal title/.test(i.placeholder))", "The empty Plate: Meal title, nothing on the plate yet. I tap + Add on Eggs, then + Add more to your plate and add Salmon.", []));
    await shot(p, "46-4a"); await clean(p);
    await p.getByRole("button", { name: /Add/ }).nth(7).click(); await sleep(600);
    await tap(p, "+ Add more to your plate");
    await p.getByPlaceholder("Search all foods").fill("Salmon"); await sleep(900);
    await p.getByRole("button", { name: /^\+? ?Add$/ }).first().click(); await sleep(800);
    await p.getByRole("button", { name: "Close" }).first().click().catch(() => {}); await sleep(500);
    const head4 = "JS:[...document.querySelectorAll('p, small, span, div')].find((e) => e.childElementCount === 0 && /^Name it, or keep/.test(e.innerText))";
    const m11 = await measure(p, "prepare4", prep3), m12 = await measure(p, "saveToMine4", keep3);
    console.log(await note(p, head4, "No recipe behind it. The line says <b>Name it, or keep the foods' name.</b> Apart from that line, this is the same screen as DT346.3b.", [head4]));
    console.log(await note(p, keep3, `The same two buttons as on a recipe's copy: <b>Prepare it ›</b> (${px(m11)}), <b>Save it to My recipes</b> (${px(m12)}). I tap Prepare it ›.`, [prep3, keep3]));
    await shot(p, "46-4b"); await clean(p);
    await tap(p, "Prepare it ›"); await shot(p, "46-4c");
    await tap(p, "Lock it and cook ›"); await shot(p, "46-4d");
    await tap(p, "Cooked. Next: Eat ›"); await tap(p, "DaaM good");
    const sv = ".save-recipe";
    const m13 = await measure(p, "saveChoice", ".save-recipe .choice");
    console.log(await note(p, sv, `Eat: <b>Save in My recipes</b>, with <b>Yes, save it</b>, <b>Not this one</b> and It makes more than one. The chips are ${px(m13)}.`, [sv]));
    await shot(p, "46-4e"); await clean(p);
    await p.context().close();
    }
    if (NEW) {
    const eatSave = require(path.resolve(__dirname, "../../tests/flows/eat-save.cjs"));
    const toEat = async (p, tag) => { await tap(p, "Prepare it ›"); await shot(p, `46-${tag}c`); await tap(p, "Lock it and cook ›"); await shot(p, `46-${tag}d`); await tap(p, "Cooked. Next: Eat ›"); await tap(p, "DaaM good"); };
    for (const [tag, id, title, re, from, to] of [["5", "m-burek", "Lazy Burek", /Grams of Frischer/, 375, 300], ["6", "m-om", "Feta omelette", /Grams of Feta/, 50, 80]]) {
      let p = await open(`/my-recipes/${id}`);
      console.log(await note(p, ".rq-actions", `<b>No change:</b> ${title}'s page, What do you do with it?, the line: the recipe stays as it is. I tap Put it on the Plate.`, []));
      await shot(p, `46-${tag}a`, ".rq-actions", ".rq-actions"); await clean(p);
      await tap(p, "Put it on the Plate");
      await grams(p, re, to);
      const head = "JS:[...document.querySelectorAll('p, small, span, div')].find((e) => e.childElementCount === 0 && /^From My recipes/.test(e.innerText))";
      const prep = "JS:[...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Prepare it ›')";
      const mc = await measure(p, `changed${tag}`, ".copy-changed"), mp = await measure(p, `prep${tag}`, prep);
      if (tag === "5") console.log(await note(p, head, "<b>New:</b> a recipe I made says <b>From My recipes</b>, servings or not; <b>The whole recipe.</b> in place of as you mapped it, and the line under the chips says The whole recipe: 4 portions. From your screenshot stays for a recipe read from a screenshot.", [head]));
      console.log(await note(p, ".copy-changed", `<b>New:</b> at the first change, under the title: <b>Changed from ${title}:</b> ${title === "Lazy Burek" ? "Frischer Blätterteig" : "Feta Leicht"} ${from} to ${to} g. The recipe stays as it is; Eat asks whether the change goes back to it. ${mc ? mc.h + " px, type 14 px, weights 400 and 700." : ""} It is not there before a change.`, [".copy-changed"]));
      if (tag === "5") console.log(await note(p, prep, `<b>New:</b> after a change the main step is <b>Prepare it ›</b>, no longer Prepare it as it is (${px(mp)}). I tap it.`, [prep]));
      else console.log(await note(p, prep, "<b>No change:</b> Prepare it › and Save it to My recipes, as in main. I tap Prepare it ›.", []));
      await shot(p, `46-${tag}b`); await clean(p);
      await toEat(p, tag);
      await p.locator(".changed-ask").getByRole("button", { name: "Update my recipe" }).click(); await sleep(400);
      const mk = await measure(p, `ask${tag}`, ".changed-ask .choice");
      console.log(await note(p, ".changed-ask", tag === "5"
        ? `<b>New:</b> Eat asks for a recipe with servings too: <b>Changed from your recipe Lazy Burek</b>, Frischer Blätterteig 375 to 300 g; <b>Update my recipe</b>, <b>Save as a new recipe</b>, <b>Only this time</b>, the default. The chips are ${px(mk)} (D10). I tap Update my recipe, then Save. With One portion on the plate, the change is scaled back: 94 to 70 g there makes 280 g in the recipe.`
        : `<b>New:</b> the same question as before; the chips are ${px(mk)} (D10). I tap Update my recipe, then Save.`, [".changed-ask"]));
      await shot(p, `46-${tag}e`); await clean(p);
      await eatSave(p); await sleep(1200);
      const st = await stored(p, id);
      await p.goto(`http://127.0.0.1:${PORT}/my-recipes/${id}`); await sleep(1500);
      await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; }"; document.head.append(st); });
      const g = st.items.find((i) => re.test("Grams of " + i.food.name)).grams;
      console.log(await note(p, ".rq-foods", `<b>New:</b> back in Recipes, ${title} has ${g} g: Update my recipe changed the recipe.`, [".rq-foods"]));
      await shot(p, `46-${tag}f`, ".rq-foods", ".rq-foods"); await clean(p);
      await p.context().close();
    }
    }
  } catch (e) { console.log("ERR", e.message.slice(0, 500)); } finally { fs.writeFileSync(`${R}/measures.json`, JSON.stringify(M, null, 1)); await b.close(); s.kill(); }
})();
