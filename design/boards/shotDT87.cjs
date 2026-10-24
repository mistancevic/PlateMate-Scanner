// Board DT87 to DT91 (Milan 24 October 11:37 to 11:49): making a dinner with Chef Mealan, from an empty Plate to the saved
// recipe. Now: main 0.2.86, untouched. New: the same pages with the change drawn in the browser. Nothing in the repo changes.
// No AI key in this workspace: Chef Mealan's two answers are stand-ins written to the prompts in server.ts.
const ROOT = process.env.APP_DIR || "/home/claude/mistancevic/platemate-scanner";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs";
fs.mkdirSync(R, { recursive: true });
const PORT = "3293", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const MEAL = { options: [
  { kitchen: "Balkan", title: "Chicken with ajvar, potatoes and šopska salad", why: "The smoky ajvar and the fresh salad lift the plain chicken, and the potatoes make it a full dinner.",
    adds: [{ name: "Potatoes, boiled", grams: 250, calories: 87, protein: 1.9, fats: 0.1, carbs: 20, base: true }, { name: "Ajvar", grams: 40, calories: 85, protein: 1.5, fats: 5, carbs: 8, base: false }, { name: "Tomato", grams: 120, calories: 18, protein: 0.9, fats: 0.2, carbs: 3.9, base: false }, { name: "Feta cheese", grams: 30, calories: 264, protein: 14, fats: 21, carbs: 4, base: false }] },
  { kitchen: "Italian", title: "Pollo alla pizzaiola with penne", why: "Chicken in a quick tomato and oregano sauce, tossed through penne.",
    adds: [{ name: "Penne, dry", grams: 80, calories: 359, protein: 12.5, fats: 1.5, carbs: 71, base: true }, { name: "Passata", grams: 150, calories: 30, protein: 1.3, fats: 0.2, carbs: 5.5, base: false }, { name: "Parmesan", grams: 15, calories: 392, protein: 35, fats: 26, carbs: 3, base: false }, { name: "Olive oil", grams: 10, calories: 884, protein: 0, fats: 100, carbs: 0, base: false }] },
  { kitchen: "Mediterranean", title: "Chicken bulgur bowl with yogurt sauce", why: "Nutty bulgur, a cool garlic yogurt and crunchy cucumber around the chicken.",
    adds: [{ name: "Bulgur, cooked", grams: 180, calories: 83, protein: 3.1, fats: 0.2, carbs: 18.6, base: true }, { name: "Greek yogurt 2%", grams: 100, calories: 73, protein: 10, fats: 2, carbs: 3.6, base: false }, { name: "Cucumber", grams: 100, calories: 15, protein: 0.7, fats: 0.1, carbs: 3.6, base: false }] },
] };
const STEPS = { steps: [
  "Bring a large pot of salted water to the boil and cook {5} for 11 minutes, until al dente.",
  "Meanwhile, warm {4} in a pan over medium heat, add {2} and simmer for 5 minutes.",
  "Slice {1}, stir it into the sauce and heat it through, 3 to 4 minutes. Season with salt and pepper.",
  "Drain the penne, toss it in the pan and serve with {3} over the top.",
] };

(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const fresh = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-10-24T18:30:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian", "Mediterranean"], equipment: ["oven", "stovetop", "microwave"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/meal", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MEAL) }));
    await p.route("**/api/steps", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STEPS) }));
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    return p;
  };
  // whole screens: the header and the bar stay in the page's flow, toasts and the round chef button go
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (p, name) => { await p.waitForTimeout(350); await flat(p); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot", name); };
  // drawing helpers: change words in place, add a note block after an element
  const draw = (p, fn, arg) => p.evaluate(fn, arg);
  const swap = (p, pairs) => p.evaluate((pairs) => { const w = document.createTreeWalker(document.querySelector("main") || document.body, NodeFilter.SHOW_TEXT);
    const ns = []; while (w.nextNode()) ns.push(w.currentNode);
    for (const n of ns) for (const [a, bb] of pairs) if (n.data.includes(a)) n.data = n.data.split(a).join(bb); }, pairs);
  const setText = (p, sel, re, txt, css = "") => p.evaluate(({ sel, re, txt, css }) => { const r = new RegExp(re); let n = 0; for (const el of document.querySelectorAll(sel)) if (r.test(el.textContent)) { el.textContent = el.textContent.replace(r, txt); if (css) el.style.cssText += ";" + css; n++; } return n; }, { sel, re, txt, css });
  const mark = `outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px`;
  const note = (p, sel, html, where = "after") => p.evaluate(({ sel, html, where, mark }) => { const el = typeof sel === "string" ? document.querySelector(sel) : null; if (!el) return false;
    const d = document.createElement("div"); d.innerHTML = html; d.style.cssText = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742"; el[where](d); return true; }, { sel, html, where, mark });
  const outline = (p, sel) => p.evaluate(({ sel, mark }) => { for (const el of document.querySelectorAll(sel)) el.style.cssText += ";" + mark; }, { sel, mark });
  const byText = (p, sel, re, css) => p.evaluate(({ sel, re, css }) => { const r = new RegExp(re); for (const el of document.querySelectorAll(sel)) if (r.test(el.textContent)) el.style.cssText += ";" + css; }, { sel, re, css });

  // the steps of the flow, each from a fresh start
  const plate = async (p) => { await p.goto(U + "/plate"); await p.waitForTimeout(1500); };
  const addChicken = async (p) => { await p.locator("section, div").filter({ hasText: /^Chicken breast, cooked/ }).getByRole("button", { name: "Add" }).last().click().catch(async () => {
    await p.locator("text=Chicken breast, cooked").first().locator("xpath=ancestor::*[.//button[normalize-space()='Add']][1]").getByRole("button", { name: "Add" }).click(); }); await p.waitForTimeout(900); };
  const ideas = async (p) => { await p.getByRole("button", { name: "Make it a dinner" }).click(); await p.waitForTimeout(1500); };
  const putOn = async (p) => { await p.locator(".mm-card").first().getByRole("button", { name: "Put it on the plate" }).click(); await p.waitForTimeout(1000); };
  const makeIt = async (p) => { await p.getByRole("button", { name: "Make it", exact: true }).click(); await p.waitForTimeout(1200); };
  const toMade = async (p) => { await p.locator(".way").first().click(); await p.waitForTimeout(300); await p.getByRole("button", { name: "I'm making it this way" }).click(); await p.waitForTimeout(900); };
  const toHow = async (p) => { await p.getByRole("button", { name: "On to How was it?" }).click(); await p.waitForTimeout(800); await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(400); };
  const save = async (p) => { await p.getByRole("button", { name: "Save", exact: true }).click(); await p.waitForTimeout(1300); };
  const keepSteps = async (p) => { await p.getByRole("button", { name: "Draft the steps with Chef Mealan" }).first().click(); await p.waitForTimeout(1300); await p.getByRole("button", { name: "Keep these steps" }).click(); await p.waitForTimeout(900); };
  const run = async (upTo) => { const p = await fresh(); await plate(p); const st = ["chicken", "ideas", "plate", "make", "made", "how", "page", "steps"];
    const fns = [addChicken, ideas, putOn, makeIt, toMade, toHow, save, keepSteps]; for (let k = 0; k < st.length && k <= st.indexOf(upTo); k++) await fns[k](p); return p; };

  try {
    // ---- Now ----
    let p = await run("none"); await shot(p, "dt87NowEmpty"); await p.close();
    p = await run("chicken"); await shot(p, "dt87NowOne"); await p.close();
    p = await run("ideas"); await shot(p, "dt88NowIdeas"); await p.close();
    p = await run("plate"); await shot(p, "dt88NowPlate"); await p.close();
    p = await run("make"); await shot(p, "dt89NowMake"); await p.close();
    p = await run("made"); await shot(p, "dt90NowMade"); await p.close();
    p = await run("how"); await p.getByRole("button", { name: "Yes, save it" }).click().catch(() => {}); await shot(p, "dt90NowSave"); await p.close();
    p = await run("page"); await shot(p, "dt90NowPage"); await p.close();

    // ---- New, release 1 and 2 ----
    // DT87: Fit to my target, with the chef hat; on an empty plate a line says why it waits
    p = await run("none");
    await swap(p, [["Make it a dinner", "Fit to my target"]]);
    await outline(p, ".ways-out .pill-primary"); await p.evaluate(() => { const sv = document.querySelector(".ways-out .pill-primary svg"); if (sv) sv.style.cssText += ";width:20px;height:20px;min-width:20px;flex:none"; });
    await note(p, ".ways-out", "Add one food first. Chef Mealan builds the dinner around it.");
    await shot(p, "dt87NewEmpty"); await p.close();
    p = await run("chicken");
    await swap(p, [["Make it a dinner", "Fit to my target"], ["Chef Mealan adds what it needs and sets the amounts.", "Chef Mealan adds what it needs to land your dinner in its range."]]);
    await outline(p, ".ways-out .pill-primary"); await p.evaluate(() => { const sv = document.querySelector(".ways-out .pill-primary svg"); if (sv) sv.style.cssText += ";width:20px;height:20px;min-width:20px;flex:none"; });
    await setText(p, "p.small", "Chef Mealan adds what it needs and sets the amounts\\.", "Chef Mealan adds what it needs to land your dinner in its range.", mark + ";background:#fff8d6");
    await shot(p, "dt87NewOne"); await p.close();
    // DT88: the words a cook uses; the head says what the screen is for
    p = await run("ideas");
    await swap(p, [["Make it a dinner", "A dinner around your chicken"], ["One way from your kitchens.", "One way from your kitchens. Two did not fit; DT91 fixes why."],
      ["chicken breast, cooked 150 g", "150 g cooked chicken breast"], ["+ 135 g penne, dry", "+ 135 g dry penne"]]);
    await setText(p, ".mm-add", "135 g penne, dry", "135 g dry penne"); await setText(p, ".mm-stays", "chicken breast, cooked 150 g", "150 g cooked chicken breast");
    await outline(p, ".mm-adds"); await outline(p, ".mm-stays"); await outline(p, ".step-head h1, .step-head h2");
    await shot(p, "dt88NewIdeas"); await p.close();
    p = await run("plate");
    await swap(p, [["Chef Mealan's Italian dinner. Your foods as you had them; the penne, dry sets the energy. Change any amount you like.", "Chef Mealan's Italian dinner, around your chicken. Change any amount you like."],
      ["Chicken breast, cooked", "Chicken breast"], ["Penne, dry", "Penne"]]);
    await p.evaluate((mark) => { for (const el of document.querySelectorAll(".plate-card *")) { if (el.children.length) continue; const t = el.textContent.trim();
      if (t === "Chicken breast" || t === "Penne") { const s = document.createElement("small"); s.textContent = t === "Penne" ? " weigh it dry" : " weigh it cooked"; s.style.cssText = "display:block;font-weight:700;color:#1f5fc7"; el.appendChild(s); el.style.cssText += ";" + mark; } } }, mark);
    await byText(p, ".step-head p, .step-head small", "around your chicken", mark + ";background:#fff8d6");
    await shot(p, "dt88NewPlate"); await p.close();
    // DT89: How to make it with Chef Mealan's steps, at the plate's amounts (a real screen: the same recipe with its steps kept)
    p = await run("steps");
    await p.getByRole("button", { name: /^Make it$/ }).first().click(); await p.waitForTimeout(1000);
    await p.getByRole("button", { name: /^(Keep it as it is|Make it as it is|Make it)$/ }).first().click(); await p.waitForTimeout(1000);
    await swap(p, [["Chef Mealan's steps for what you make.", "Chef Mealan's steps for your dinner, at your amounts. Drafted here, kept with the recipe."], ["chicken breast", "chicken breast"]]);
    await outline(p, ".mk-card"); await byText(p, ".step-head p, .step-head small", "at your amounts", mark + ";background:#fff8d6");
    await shot(p, "dt89NewMake"); await p.close();
    // DT90: after making it
    p = await run("made");
    await swap(p, [["All as the recipe says", "As the steps say"], ["Not as the recipe says", "Not as the steps say"]]);
    await byText(p, "button.choice", "steps say", mark);
    await shot(p, "dt90NewMade"); await p.close();
    p = await run("steps");
    await swap(p, [["Chicken breast, cooked", "Chicken breast"], ["Penne, dry", "Penne"]]);
    await p.evaluate((mark) => {
      const h = [...document.querySelectorAll("main *")].find((e) => e.children.length === 0 && e.textContent.trim() === "Pollo alla pizzaiola with penne"); if (h) { const d = document.createElement("div"); d.innerHTML = "Chef Mealan's Italian dinner, around your chicken. Made on 24 October."; d.style.cssText = mark + ";background:#fff8d6;padding:6px 10px;margin:8px 0;font-size:14px;font-weight:700;color:#172742"; h.after(d); }
      for (const b of document.querySelectorAll("button")) if (b.textContent.trim() === "Italian") { b.classList.add("on"); b.setAttribute("aria-pressed", "true"); b.style.cssText += ";" + mark; }
      for (const el of document.querySelectorAll("main *")) { if (el.children.length) continue; const t = el.textContent.trim(); if (t === "Chicken breast" || t === "Penne") { const s = document.createElement("small"); s.textContent = t === "Penne" ? " weigh it dry" : " weigh it cooked"; s.style.cssText = "display:block;font-weight:700;color:#1f5fc7"; el.appendChild(s); } }
    }, mark);
    await byText(p, "section", "^\\s*Steps", mark);
    await shot(p, "dt90NewPage"); await p.close();

    // ---- New, release 3: the dish itself (DT91) ----
    const CARDS = [
      { k: "ITALIAN", n: "909 kcal · PD 7.9", t: "Pollo alla pizzaiola with penne", adds: ["100 g dry penne", "250 g passata", "25 g parmesan", "10 g olive oil", "80 g onion", "2 garlic cloves"], cook: "dried oregano, salt, pepper", why: "Chicken in a quick tomato, onion and oregano sauce, tossed through penne." },
      { k: "BALKAN", n: "917 kcal · PD 7.1", t: "Chicken with ajvar, potatoes and šopska salad", adds: ["350 g potatoes, raw", "50 g ajvar", "150 g tomato", "150 g cucumber", "60 g feta", "15 g olive oil", "40 g red onion"], cook: "parsley, vinegar, salt", why: "Smoky ajvar and a fresh salad with feta next to the chicken and boiled potatoes." },
      { k: "MEDITERRANEAN", n: "940 kcal · PD 8.6", t: "Chicken bulgur bowl with chickpeas and garlic yogurt", adds: ["80 g dry bulgur", "80 g chickpeas, drained", "150 g Greek yogurt 2%", "150 g cucumber", "100 g tomato", "15 g olive oil", "1 garlic clove"], cook: "lemon juice, dried mint, salt", why: "Nutty bulgur and chickpeas under the chicken, with a cool garlic yogurt." },
    ];
    p = await run("ideas");
    await p.evaluate(({ CARDS, mark }) => {
      const one = document.querySelector(".mm-card"); const host = one.parentElement;
      const html = (c) => `<div class="mm-top"><small class="mm-kitchen">${c.k}</small><small class="mm-nums">${c.n}</small></div><b class="mm-title">${c.t}</b><div class="mm-adds" style="${mark}">${c.adds.map((a) => `<span class="mm-add">+ ${a}</span>`).join("")}</div><small class="mm-why" style="${mark};background:#fff8d6;padding:4px 8px"><b>For cooking, not counted:</b> ${c.cook}.</small><small class="mm-why">${c.why}</small><button class="pill pill-small pill-primary" style="align-self:stretch">Put it on the plate</button>`;
      one.innerHTML = html(CARDS[0]);
      let at = one; for (const c of CARDS.slice(1)) { const n = one.cloneNode(false); n.innerHTML = html(c); at.after(n); at = n; }
      for (const el of document.querySelectorAll(".step-head h1, .step-head h2")) el.textContent = "A dinner around your chicken";
      for (const el of document.querySelectorAll(".step-head p, .step-head small")) if (/Dinner is about/.test(el.textContent)) { el.textContent = "Your plate has the protein: 47 g, PD 18.8. Dinner is 840 to 1,026 kcal. Three ways from your kitchens, each in that range."; el.style.cssText += ";" + mark + ";background:#fff8d6"; }
      const st = document.querySelector(".mm-stays"); if (st) { st.textContent = "On the plate: 200 g raw chicken breast, about 150 g cooked. It stays."; st.style.cssText += ";" + mark; }
    }, { CARDS, mark });
    await shot(p, "dt91NewIdeas"); await p.close();

    p = await run("plate");
    await p.evaluate((mark) => {
      const rows = [...document.querySelectorAll(".plate-card .row-text")].map((e) => { let r = e; while (r.parentElement && r.parentElement.querySelectorAll(".row-text").length === 1) r = r.parentElement; return r; });
      const data = [["Chicken breast", "raw, about 150 g cooked · PD 18.8 · This amount stays.", 200], ["Penne", "weigh it dry · PD 3.5 · Chef Mealan can change this amount.", 100], ["Passata", "PD 4.3", 250], ["Parmesan", "PD 8.9", 25], ["Olive oil", "PD 0.0", 10], ["Onion", "1 small onion · PD 2.8", 80], ["Garlic", "2 cloves · PD 4.3", 6]];
      // the order of the rows on the plate: chicken, passata, parmesan, olive oil, penne
      const order = [0, 2, 3, 4, 1];
      while (rows.length < 7) { const c = rows[rows.length - 1].cloneNode(true); rows[rows.length - 1].after(c); rows.push(c); order.push(order.length); }
      rows.forEach((row, k) => { const [n, sub, g] = data[order[k]];
        const nm = row.querySelector(".name-link"); if (nm) nm.textContent = n; const sm = row.querySelector(".row-text small"); if (sm) sm.textContent = sub;
        const inp = row.querySelector("input"); if (inp) { const c = inp.cloneNode(true); c.setAttribute("value", String(g)); c.value = String(g); inp.replaceWith(c); }
        for (const el of row.querySelectorAll("*")) if (el.children.length === 0 && /^\d+\s*g$/.test(el.textContent.trim())) el.textContent = `${g} g`;
        row.style.cssText += ";" + mark; });
      const last = rows[rows.length - 1]; const d = document.createElement("div"); d.innerHTML = "<b>For cooking, not counted:</b> dried oregano, salt, pepper."; d.style.cssText = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;color:#172742"; last.after(d);
      const ro = document.querySelector(".readout"); if (ro) { ro.querySelector(".readout-mid b").textContent = "7.9"; ro.querySelector(".readout-mid span").textContent = "in your range"; ro.querySelector(".readout-mid small").textContent = "909 kcal · 72.3 g protein · 671 g"; ro.style.cssText += ";" + mark; }
      for (const el of document.querySelectorAll(".step-head p, .step-head small")) if (/Chef Mealan's Italian dinner/.test(el.textContent)) { el.textContent = "Chef Mealan's Italian dinner, around your chicken. 840 to 1,026 kcal for dinner. Change any amount you like."; el.style.cssText += ";" + mark + ";background:#fff8d6"; }
    }, mark);
    await shot(p, "dt91NewPlate"); await p.close();

    p = await run("steps");
    await p.getByRole("button", { name: /^Make it$/ }).first().click(); await p.waitForTimeout(1000);
    await p.getByRole("button", { name: /^(Keep it as it is|Make it as it is|Make it)$/ }).first().click(); await p.waitForTimeout(1000);
    await p.evaluate((mark) => {
      const A = (t) => `<b class="st-amt">${t}</b>`;
      const steps = [`Slice ${A("200 g chicken breast")} into strips and season with salt and pepper. Fry it in ${A("10 g olive oil")} over medium high heat, 5 to 6 minutes, until no pink is left. Take it out of the pan.`,
        `In the same pan, soften ${A("80 g onion")}, chopped, and ${A("2 garlic cloves")}, sliced, over medium heat for 4 minutes.`,
        `Add ${A("250 g passata")} and a pinch of dried oregano. Simmer for 10 minutes.`,
        `Meanwhile, cook ${A("100 g penne")} in a large pot of salted boiling water for 11 minutes, until al dente.`,
        `Put the chicken back in the sauce for 2 minutes. Drain the penne, toss it through and serve with ${A("25 g parmesan")} on top.`];
      const ol = document.querySelector(".rp-steps"); ol.innerHTML = steps.map((s, k) => `<li><span>${k + 1}</span><div class="rp-step-text">${s}</div></li>`).join(""); ol.closest(".mk-card").style.cssText += ";" + mark;
      for (const el of document.querySelectorAll(".step-head p, .step-head small")) if (/Chef Mealan's steps/.test(el.textContent)) { el.textContent = "Chef Mealan's steps for your dinner, at your amounts. The chicken goes in raw, so the steps cook it."; el.style.cssText += ";" + mark + ";background:#fff8d6"; }
    }, mark);
    await shot(p, "dt91NewMake"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
