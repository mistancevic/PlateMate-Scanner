// Board DT268 (Coach Milan 9 November 21:46 to 22:36, Yes): Served. A plate scanned to explore is kept on its own, in Recipes,
// marked Served (cooked in another kitchen, read from a photo, not weighed). Scan another plate at the table; a name on each;
// I ate this, Put it on the Plate, Share the numbers, Remove. The path Served, On paper, From the kitchen is in the story.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3499", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = "font-family:Nunito,system-ui,sans-serif;color:#172742";
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[190, food("c", "Chicken breast", 120, 22.5, 0, 2.6)], [95, food("r", "Basmati rice", 356, 8.5, 78, 0.9)], [145, food("s", "Spinach", 23, 2.9, 3.6, 0.4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
seed.meals = [{ id: "m-b", title: "Chicken rice bowl", items, portion: 430, steps: ["Cook the rice.", "Fry the chicken.", "Add the spinach."], savedAt: "2026-11-07T22:58:00Z", cookedAt: "2026-11-08T12:40:00Z" }];
const PIC = "/landing/hero/curry-m.webp", PIC2 = "/landing/hero/meatballs-m.webp", PIC3 = "/landing/hero/quesadilla-m.webp";
const SERVED = `<span style="background:#fde9c8;color:#7a4b00;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800;white-space:nowrap">Served</span>`;
const PLATES = [["Croque madame, mine", PIC, "about 737 kcal · 46 g protein · PD 6.3"], ["Ana's meatballs", PIC2, "about 640 kcal · 38 g protein · PD 5.9"], ["Marko's quesadilla", PIC3, "about 810 kcal · 34 g protein · PD 4.2"]];
const small = (pic, n, tag, nums) => `<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-top:1px solid #e3eaf7"><img src="${pic}" style="width:52px;height:52px;object-fit:cover;border-radius:10px;flex:none"><span style="flex:1;min-width:0"><b style="display:block;font-size:14.5px">${n}</b><small style="display:block;font-size:12.5px;color:#53627f">${nums}</small></span>${tag ? `<span style="background:#e7eefb;color:#1f5fc7;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800;white-space:nowrap">${tag}</span>` : ""}</div>`;
const SITTING = `<div style="background:#fff;border:1.5px solid #d1dcf0;border-radius:12px;padding:10px 12px;margin-top:8px"><div style="display:flex;gap:8px;align-items:center"><span style="flex:1"><b style="font-size:15.5px;display:block">Café Jadran <span style="color:#1f5fc7;font-size:13px;font-weight:700">✎</span></b><small style="font-size:12.5px;color:#53627f">Saturday 7 November, lunch</small></span>${SERVED}</div>
  <button class="pill pill-small" style="min-height:44px;margin-top:8px">📷 Add a photo of the menu</button>
  <small style="display:block;margin-top:8px;font-size:12px;font-weight:800;letter-spacing:.05em;color:#53627f">MINE · about 1,290 kcal · 61 g protein</small>
  ${small("/landing/hero/squares-m.webp", "Bruschetta", "Starter", "about 210 kcal · 6 g protein")}${small(PIC, "Croque madame with salad", "Main", "about 737 kcal · 46 g protein")}${small("/landing/hero/waffle-m.webp", "Waffle with berries", "Dessert", "about 343 kcal · 9 g protein")}
  <small style="display:block;margin-top:10px;font-size:12px;font-weight:800;letter-spacing:.05em;color:#53627f">OTHERS AT THE TABLE</small>
  ${small(PIC2, "Ana&#39;s meatballs", "", "about 640 kcal · 38 g protein")}${small(PIC3, "Marko&#39;s quesadilla", "", "about 810 kcal · 34 g protein")}</div>`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (tab = "Recipes") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/"); await p.waitForTimeout(900); await p.locator("nav button").filter({ hasText: tab }).click(); await p.waitForTimeout(900); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, tall) => { if (tall) await p.setViewportSize({ width: 390, height: tall }); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const screen = (p, html) => p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.innerHTML = `<div>${html}</div>`; window.scrollTo(0, 0); }, html);
  const row = ([n, pic, nums], i) => `<div style="display:flex;gap:10px;align-items:center;background:#fff;border:1.5px solid #d1dcf0;border-radius:12px;padding:8px;margin-top:8px"><img src="${pic}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;flex:none"><span style="flex:1;min-width:0"><b style="display:block;font-size:15px">${n}</b><small style="display:block;font-size:12.5px;color:#53627f">${nums}</small><small style="display:block;font-size:12.5px;color:#53627f">Sat 7 Nov · Café Jadran</small></span>${SERVED}</div>`;
  // a. now: Recipes
  let p = await open();
  if (process.env.DBG) console.log(await p.evaluate(() => [...[...document.querySelectorAll("main")].pop().querySelectorAll("section,div")].slice(0, 25).map((e) => e.tagName + "." + String(e.className).split(" ").join(".")).join(" | ")));
  await note(p, "Now (0.3.117), Recipes: your own recipes only. A plate scanned as Exploring is gone when the Plate is cleared, unless you tapped Save as an idea each time. At a table with friends the plates are lost.", "main section, main .recipes, main > *");
  await shot(p, "rdt268a");
  // b. new: the Plate after an Exploring read
  const PLATE = `<div style="padding:12px;display:flex;flex-direction:column;gap:12px;${F}"><b style="font-size:22px">Exploring</b>
    <img src="${PIC2}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;display:block">
    <div style="font-size:15px;line-height:1.5">Meatballs in tomato sauce with mashed potato. As the photo shows it: about <b>640 kcal</b> and <b>38 g protein</b>.</div>
    <div style="${mark};background:#fff;padding:12px;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;gap:8px;align-items:center">${SERVED}<b style="font-size:15px">Kept in Recipes, under Served</b></div>
      <label style="font-size:13px;font-weight:800;color:#53627f">NAME<span style="background:#e7eefb;color:#1f5fc7;border-radius:999px;padding:1px 8px;font-size:11.5px;font-weight:800;margin-left:6px;letter-spacing:0">filled by Chef Mealan</span><input value="Ana&#39;s meatballs in tomato sauce" style="display:block;width:100%;box-sizing:border-box;margin-top:6px;min-height:44px;border:1.5px solid #d1dcf0;border-radius:10px;padding:0 10px;font:inherit;font-size:15px;font-weight:600;color:#172742"></label>
      <small style="font-size:13px;font-weight:800;color:#53627f">WHICH DISH<span style="background:#e7eefb;color:#1f5fc7;border-radius:999px;padding:1px 8px;font-size:11.5px;font-weight:800;margin-left:6px;letter-spacing:0">filled by Chef Mealan</span></small>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${["Starter", "Main", "Side", "Dessert", "Drink"].map((c) => `<button class="pill pill-small" style="min-height:44px;${c === "Main" ? "background:#172742;color:#fff;border-color:#172742" : ""}">${c}</button>`).join("")}</div>
      <div style="background:#fff8d6;border-radius:10px;padding:10px"><b style="font-size:14.5px;display:block">One thing I could not tell: the meatballs.</b><div style="display:flex;gap:8px;margin-top:8px"><button class="pill pill-small" style="min-height:44px;flex:1">About 150 g</button><button class="pill pill-small" style="min-height:44px;flex:1">About 200 g</button><button class="link" style="min-height:44px">Skip</button></div></div>
      <small style="font-size:13px;font-weight:800;color:#53627f">📷 SCAN ANOTHER PLATE</small>
      <div style="display:flex;gap:8px"><button class="pill pill-small pill-primary" style="min-height:48px;flex:1;white-space:normal">Another dish of mine</button><button class="pill pill-small" style="min-height:48px;flex:1;white-space:normal">Someone else&#39;s plate</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-small" style="min-height:44px">Share the numbers</button><button class="pill pill-small" style="min-height:44px">I ate this</button><button class="link" style="min-height:44px">Don't keep it</button></div></div>
    <small style="font-size:13px;color:#53627f;line-height:1.45">Nothing is logged. Your day stays as it was.</small></div>`;
  p = await open("Plate"); await screen(p, PLATE);
  await note(p, "New, the Plate after a photo read as Exploring: the plate is kept on its own, marked Served. Step 1. Chef Mealan fills the name and the dish; a tap corrects them, you only add whose. One question at most, the one that moves the numbers most; Skip keeps the range wide. Scan another plate asks whose: the one thing a photo cannot tell.", "main > div", "afterbegin");
  await shot(p, "rdt268b", 1460);
  // c. new: Recipes with Served (the real page, the chip and the group drawn in)
  p = await open();
  await p.evaluate(({ rows, mark }) => {
    const chips = document.querySelectorAll(".rb-chips"); const c = chips[chips.length - 1];
    c.insertAdjacentHTML("beforeend", `<button class="pill pill-small" style="${mark};background:#172742;color:#fff;border-color:#172742">Served · 5</button>`);
    document.querySelector(".recipe-add")?.remove();
    const g = document.querySelector(".rc-group");
    g.insertAdjacentHTML("beforebegin", `<section class="served-group" style="${mark};padding:8px;margin:12px 0"><b style="font-size:15px">Served · 1 visit, 5 plates</b><small style="font-size:13px;color:#53627f;line-height:1.45;display:block;margin-top:2px">Cooked in another kitchen. Read from a photo, not weighed.</small>${rows}</section>`);
    g.style.opacity = ".45";
  }, { rows: SITTING, mark });
  await note(p, "New, Recipes: Served is a chip with the others, and a group of its own above Made by me. One visit is one card. Its title is your note, typed once with the pencil; with no note it is the day and the meal. Your dishes as one meal with the total, then the plates of the others. Add a photo of the menu is step 3.", ".served-group");
  await shot(p, "rdt268c", 1520);
  // d. new: a Served plate, open
  const foods = [["Meatballs, beef and pork", 150], ["Tomato sauce", 50], ["Mashed potato", 95], ["Olive oil", 5]].map(([n, g]) => `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #e3eaf7;font-size:15px"><span>${n}</span><b>${g} g</b></div>`).join("");
  const ONE = `<div style="padding:12px;${F}"><button class="link" style="min-height:44px">‹ Recipes</button>
    <b style="font-size:22px;display:block">Ana&#39;s meatballs in tomato sauce</b>
    <div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap">${SERVED}<span style="background:#e7eefb;color:#1f5fc7;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">Main</span><small style="font-size:13.5px;color:#53627f">Café Jadran · Sat 7 Nov, lunch</small></div>
    <div style="background:#e7f4ec;border-radius:10px;padding:8px 10px;margin-top:8px;font-size:13.5px;line-height:1.4"><b>On the menu:</b> Ćufte u paradajz sosu, pire, 300 g <button class="link" style="min-height:44px;margin-left:4px">Not this</button></div>
    <img src="${PIC2}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;display:block;margin-top:10px">
    <div style="display:flex;gap:8px;margin-top:8px">${[0, 30, 60].map((h, i) => `<img src="${PIC2}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;filter:hue-rotate(${h}deg);${i === 0 ? "outline:2px solid #2a72d9" : ""}">`).join("")}</div>
    <div style="${mark};background:#fff8ec;padding:10px 12px;margin-top:12px;font-size:14px;line-height:1.45">Read from a photo, not weighed. A kitchen you did not cook in often uses more oil and butter than a photo shows.</div>
    <div style="${mark};background:#fff;padding:4px 12px;margin-top:12px">${[["Energy", "about 640 kcal", "580 to 760"], ["Protein", "about 38 g", "33 to 43 g"], ["Fat", "about 34 g", "30 to 48 g"], ["Carbs", "about 45 g", "38 to 54 g"], ["PD", "about 5.9", "4.3 to 7.4"]].map(([n, v, r]) => `<div style="display:flex;align-items:baseline;gap:8px;padding:9px 0;border-bottom:1px solid #e3eaf7;font-size:15px"><span style="width:64px;color:#53627f">${n}</span><b style="flex:1">${v}</b><span style="color:#53627f;font-size:14px">${r}</span></div>`).join("")}<small style="display:block;padding:8px 0;font-size:12.5px;color:#53627f;line-height:1.45">A guess with its range. Fat can be higher than a photo shows, so its range reaches further up. The menu gave the weight, so the range is tighter than from the photo alone.</small></div>
    <div style="margin-top:10px;background:#fff;border-radius:12px;padding:4px 12px">${foods}</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px"><button class="pill pill-primary pill-wide" style="min-height:48px">Share the numbers</button>
      <div style="display:flex;gap:8px"><button class="pill pill-small" style="min-height:44px;flex:1">I ate this</button><button class="pill pill-small" style="min-height:44px;flex:1">Put it on the Plate</button></div>
      <button class="link" style="min-height:44px;color:#b3261e">Remove</button></div></div>`;
  p = await open(); await screen(p, ONE);
  await note(p, "New, a Served plate opened from Recipes: no steps and no Start cooking, there is nothing to cook. Step 1: the photo with its other photos, the honest line, the foods as read, I ate this, Put it on the Plate, Remove. Step 2: the numbers each with its range, Share the numbers. Step 3: the line it matched on the menu.", "main > div", "afterbegin");
  await shot(p, "rdt268d", 1740);
  // e. new: I ate this, which day and meal
  const opt = (t, on) => `<button class="pill pill-small" style="min-height:44px;${on ? "background:#172742;color:#fff;border-color:#172742" : ""}">${t}</button>`;
  const dish = (t, n, k) => `<div style="display:flex;gap:8px;align-items:baseline;padding:8px 0;border-bottom:1px solid #e3eaf7;font-size:14.5px"><span style="width:62px;color:#53627f">${t}</span><b style="flex:1">${n}</b><span style="color:#53627f">${k}</span></div>`;
  const ATE = `<div style="padding:12px;${F}"><b style="font-size:22px">Café Jadran</b><small style="display:block;font-size:13.5px;color:#53627f">Saturday 7 November, lunch</small>
    <div style="${mark};background:#fff;padding:14px;margin-top:12px;display:flex;flex-direction:column;gap:12px">
      <b style="font-size:18px">When did you eat it?</b>
      <div>${dish("Starter", "Bruschetta", "about 210")}${dish("Main", "Croque madame with salad", "about 737")}${dish("Dessert", "Waffle with berries", "about 343")}<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:15px"><b>One meal</b><b>about 1,290 kcal · 61 g protein</b></div><small style="font-size:12.5px;color:#53627f">1,150 to 1,530 kcal</small></div>
      <small style="font-size:13px;font-weight:800;letter-spacing:.05em;color:#53627f">DAY</small><div style="display:flex;gap:8px;flex-wrap:wrap">${opt("Sat 7 Nov, the day of the photos", true)}${opt("Today")}${opt("Another day")}</div>
      <small style="font-size:13px;font-weight:800;letter-spacing:.05em;color:#53627f">MEAL</small><div style="display:flex;gap:8px;flex-wrap:wrap">${opt("Breakfast")}${opt("Lunch", true)}${opt("Dinner")}${opt("Snack")}</div>
      <button class="pill pill-primary pill-wide" style="min-height:48px">Put it in Saturday&#39;s lunch, eaten</button><button class="link" style="min-height:44px">Cancel</button>
      <small style="font-size:13px;color:#53627f;line-height:1.45">Your three dishes go in as one meal, with their photos. The day counts the middle of the range. The plates of Ana and Marko are not counted. Everything stays in Served.</small></div></div>`;
  p = await open(); await screen(p, ATE);
  await note(p, "Step 1. I ate this on a visit: your dishes, starter, main and dessert, go in as one meal with the total and its range. The day and the meal are asked out loud, the day of the photos first. The plates of the others are not counted.", "main > div", "afterbegin");
  await shot(p, "rdt268e", 1180);
  // f. new: the shared picture
  const CARD = `<div style="padding:12px;${F}"><b style="font-size:22px">Share the numbers</b>
    <div style="margin:12px 0 0;position:relative;border-radius:14px;overflow:hidden;${mark}"><img src="${PIC2}" style="width:100%;aspect-ratio:4/5;object-fit:cover;display:block">
      <div style="position:absolute;left:0;right:0;bottom:0;padding:14px 14px 26px;background:linear-gradient(transparent,rgba(0,0,0,.72));color:#fff"><b style="font-size:20px;display:block">Ana&#39;s meatballs</b><div style="display:flex;gap:12px;margin-top:6px;font-size:15px;flex-wrap:wrap"><span>about <b>640</b> kcal</span><span><b>38 g</b> protein</span><span><b>PD 5.9</b></span></div><small style="display:block;margin-top:6px;font-size:12.5px;font-weight:700;color:#fff">Served · read from a photo · 7 Nov</small></div>
      <small style="position:absolute;right:10px;bottom:8px;color:rgba(255,255,255,.55);font-size:11px;font-weight:700">chefmealan.com</small></div>
    <button class="pill pill-primary pill-wide" style="min-height:48px;margin-top:14px">Send it ›</button>
    <small style="display:block;margin-top:8px;font-size:13px;color:#53627f;line-height:1.45;text-align:center">Opens the phone's share sheet: Viber, WhatsApp, Messages.</small></div>`;
  p = await open(); await screen(p, CARD);
  await note(p, "Step 2. Share the numbers: the photo with the numbers strip, to send to the friend whose plate it is. It says Served, read from a photo, never Cooked and weighed. The same picture Make a post (CR1a) draws, built once.", "main > div", "afterbegin");
  await shot(p, "rdt268f", 1000);
  // g. new: the menu on a visit (step 3)
  const ml = (n, g, hit) => `<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 8px;font-size:13px;${hit ? "background:#fff3b8;border-radius:6px;font-weight:800" : ""}"><span>${n}</span><span>${g}</span></div>`;
  const match = (pic, plate, line, sure) => `<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #e3eaf7"><img src="${pic}" style="width:48px;height:48px;object-fit:cover;border-radius:10px;flex:none"><span style="flex:1;min-width:0"><b style="display:block;font-size:14px">${plate}</b><small style="display:block;font-size:12.5px;color:#53627f">${line}</small></span><span style="font-size:12px;font-weight:800;color:${sure ? "#0f7d5b" : "#7a4b00"};white-space:nowrap">${sure ? "✓ matched" : "not sure"}</span></div>`;
  const MENU = `<div style="padding:12px;${F}"><button class="link" style="min-height:44px">‹ Café Jadran</button><b style="font-size:22px;display:block">The menu</b>
    <div style="${mark};background:#fbf7ee;border:1px solid #e3d9c2;padding:10px 8px;margin-top:10px;font-family:Georgia,serif;color:#3b2f1c">
      <b style="display:block;text-align:center;font-size:15px;letter-spacing:.08em">PREDJELA</b>${ml("Brusketi sa paradajzom", "150 g", true)}${ml("Goveđa supa", "250 ml")}
      <b style="display:block;text-align:center;font-size:15px;letter-spacing:.08em;margin-top:6px">GLAVNA JELA</b>${ml("Ćufte u paradajz sosu, pire", "300 g", true)}${ml("Krok madam, salata", "280 g", true)}${ml("Kesadilja sa piletinom", "320 g")}${ml("Kesadilja sa sirom", "280 g")}
      <b style="display:block;text-align:center;font-size:15px;letter-spacing:.08em;margin-top:6px">DESERTI</b>${ml("Vafl sa šumskim voćem", "180 g", true)}</div>
    <div style="background:#fff;border-radius:12px;padding:4px 12px;margin-top:12px">${match("/landing/hero/squares-m.webp", "Bruschetta", "Brusketi sa paradajzom · 150 g · starter", true)}${match(PIC, "Croque madame with salad", "Krok madam, salata · 280 g · main", true)}${match("/landing/hero/waffle-m.webp", "Waffle with berries", "Vafl sa šumskim voćem · 180 g · dessert", true)}${match(PIC2, "Ana&#39;s meatballs", "Ćufte u paradajz sosu, pire · 300 g · main", true)}${match(PIC3, "Marko&#39;s quesadilla", "Chicken or cheese?", false)}</div>
    <div style="background:#fff8d6;border-radius:10px;padding:10px;margin-top:10px"><b style="font-size:14.5px;display:block">Marko&#39;s quesadilla: which one on the menu?</b><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="pill pill-small" style="min-height:44px">With chicken, 320 g</button><button class="pill pill-small" style="min-height:44px">With cheese, 280 g</button><button class="link" style="min-height:44px">Neither</button></div></div>
    <small style="display:block;margin-top:10px;font-size:13px;color:#53627f;line-height:1.45">A menu weight is what the kitchen says, often before cooking. It tightens the range; the plates stay Served, not weighed.</small></div>`;
  p = await open(); await screen(p, MENU);
  await note(p, "Step 3, a photo of the menu on a visit: Chef Mealan reads the names, what is in each dish, the weight where the menu prints it, and the course from its section, in the menu's own language. Each plate is matched to a line; one question where it is not sure.", "main > div", "afterbegin");
  await shot(p, "rdt268g", 1500);
  await b.close(); server.kill();
})();
