// DT176 (Coach Milan 30 October 19:27 to 19:31): Travel mode, a manual switch: for a while the app serves the place you are in.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.16, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3379", U = `http://127.0.0.1:${PORT}`;
const LIFE = { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, wake: "early", bed: "mid", where: ["Cook at home", "Canteen at work"], diet: "Everything", alcohol: "Occasionally", travel: "sometimes" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-30T10:10:00"));
  await page.addInitScript(([s, life]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-30T08:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: life }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed, LIFE]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const toMe = async () => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300); await page.getByRole("button", { name: /^Me\b/ }).first().click(); await page.waitForTimeout(500); };
  const note = (t) => page.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; (document.querySelector(".menu-title") || document.querySelector(".step-head") || document.querySelector("main") || document.body.firstElementChild).before(d); window.scrollTo(0, 0); }, { t, NOTE });
  // replace what is under the page title with drawn content
  const draw = (title, html) => page.evaluate(({ title, html }) => { const h = document.querySelector(".menu-title"); h.textContent = title; let n = h.nextElementSibling; while (n) { const x = n.nextElementSibling; n.remove(); n = x; } h.insertAdjacentHTML("afterend", html); }, { title, html });
  const OK = '<b style="color:#13916a">✓</b>', NEW = '<span class="ex-for">new</span>', HD = '<span class="ex-for" style="background:#fdebd3;color:#8a4b00">health data</span>';
  const row = (k, v, does, chef = true, extra = "") => `<div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)"><div style="flex:1;min-width:0"><small style="display:block;color:var(--muted);font-weight:700">${k}${extra}</small><b style="display:block;font-size:15px">${v}</b><small style="display:block;color:#3d4a63;font-weight:600;margin-top:2px">${does}</small></div><small style="width:54px;text-align:right;font-weight:700;color:${chef ? "#13916a" : "#8a96ad"}">${chef ? "✓ Chef reads" : "Numbers only"}</small></div>`;
  const sec = (t, why, rows, m = "") => `<div class="seg-head"><b>${t}</b><small>${why}</small></div><section class="card seg" style="${m}">${rows}</section>`;
  const SUM_TOP = `<p class="small muted page-why">Everything you told Chef Mealan, in one place, and what each answer does. ✓ Chef reads: Chef Mealan reads it with every plate, idea and answer. Tap a part to change it.</p>
    ${sec("You", "From Profile.", row("Body", "Male, born 1981, 182 cm, 85 kg", "Your resting burn, about 1,770 kcal, and your protein range.", false, " " + HD))}
    ${sec("Goal and numbers", "From Goal.", row("Goal", "Maintain, set by you on 30 October", "Food as much as you burn; weight within 1 to 2 kg.") + row("An average day", "2,500 kcal · 160 g protein · 83 g fat", "2,300 kcal without training, up to 2,850 on a hard day. Protein 135 to 185 g: 1.6 to 2.2 g a kg.") + row("Carbs and fat", "Balanced", "Carbs move with your training: 228 to 366 g.") + row("PD target", "6.4 on an average day", "Every plate and food is marked against it."))}
    ${sec("Your day", "From Lifestyle.", row("Weekdays", "Work, fixed hours, 9 to 5, mostly sitting", "Your days without training count 1.3 times your resting burn. Monday to Friday are work days.") + row("Work travel", "Occasionally", "Chef Mealan knows some of your days are away from home.", true, " " + NEW) + row("Wake-up and bedtime", "Before 6:00 · 22:00 to midnight", "Your meals at 06:30, 13:15 and 20:00."))}`;
  const SUM_BOTTOM = `${sec("How you eat", "From Lifestyle.", row("Meals", "3 a day, 06:30, 13:15, 20:00", "Your slots on Plan and Today.") + row("Where you eat", "Cook at home · Canteen at work", "Chef Mealan knows some lunches are at a canteen, and plans the rest at home.", true, " " + NEW) + row("What you eat", "Everything", "Every food and dish can be suggested.") + row("Alcohol", "Occasionally", "When you mention a drink, it counts as energy and leaves room in the day.") + row("Taste", "I like creamy, spicy · rather not sour", "Ideas lean your way. Never changes your numbers."))}
    ${sec("Training week", "From Training week.", row("Your usual week", "Strength Mon (hard), Tue, Thu · Mobility Fri", "4 training days and 3 without. Carbs go up and down with them."))}
    ${sec("Where you shop and cook", "From Where I shop and cook.", row("Places, kitchens, tools", "As you set them", "The foods in your search, the dishes Chef Mealan picks from, what it can ask you to use."))}
    ${sec("Health questions", "From Profile.", row("Is any of this true for you?", "None of these, answered 20 October", "Chef Mealan helps with everything. Asked again once a year.", true, " " + HD) + row("Allergies and intolerances", "None", "A food you name is never suggested.", true, " " + HD))}
    <div class="menu-list" style="margin-top:14px">
      <button class="menu-row" style="${mark}"><span class="menu-row-text"><b>Plan your week</b><small>Fill your slots with Chef Mealan, from Monday</small></span><span aria-hidden="true">›</span></button>
      <button class="menu-row" style="${mark}"><span class="menu-row-text"><b>Craft your first meal</b><small>On Plate: lunch at 13:15, 53 g protein</small></span><span aria-hidden="true">›</span></button>
    </div>
    <div class="button-row" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-primary" style="${mark}">Choose what Coach Milan sees</button><button class="pill">Save as PDF</button></div>
    <small class="muted" style="display:block;margin-top:8px">Your summary changes when your answers change. Your coach sees the parts you share, kept up to date, with what changed.</small>`;

  const CK = "background:var(--surface,#fff);border:1px solid var(--line);border-radius:16px;padding:14px";
  const toRow = async (name) => { await toMe(); await page.locator(".menu-row").filter({ hasText: name }).first().click(); await page.waitForTimeout(600); };
  const toTab = async (t) => { await page.goto(U + "/"); await page.waitForTimeout(1000); if (t !== "Today") { await page.locator("nav button").filter({ hasText: t }).click(); await page.waitForTimeout(800); } };
  const banner = (place, where) => `<div style="${mark};display:flex;align-items:center;gap:10px;background:#fff3e0;border-radius:14px;padding:10px 12px;margin:0 0 12px"><span style="font-size:22px">🧳</span><div style="flex:1;min-width:0"><b style="display:block">Travel mode · ${place}</b><small style="font-weight:600;color:#8a4b00">${where}</small></div><button class="pill pill-small" style="height:44px">Turn off</button></div>`;
  // a, now: Me knows work travel as a habit; nothing for now
  await toRow("Lifestyle");
  await page.evaluate((mark) => { const el = [...document.querySelectorAll("b, .seg-head, label, button")].find((x) => /travel/i.test(x.textContent) && x.textContent.length < 60); if (el) (el.closest("section") || el).style.cssText += ";" + mark; }, mark);
  await note("Now, 0.3.16: Lifestyle knows work travel as a habit: never, sometimes, often. Nothing tells the app you are away right now: it keeps suggesting your home shops and your kitchen.");
  await shot("r176a");
  // b, new: the switch on Me
  await toMe();
  await page.evaluate((mark) => { const card = document.querySelector(".menu-list"); card.insertAdjacentHTML("beforebegin", `<div style="${mark};display:flex;align-items:center;gap:12px;background:var(--surface,#fff);border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin:0 0 12px"><span style="font-size:24px">🧳</span><div style="flex:1"><b style="display:block">Travel mode</b><small class="muted" style="font-weight:600">Off. Turn it on when you are away: the app serves the place you are in, until you turn it off.</small></div><button class="pill pill-primary" style="height:44px">Turn on</button></div>`); }, mark);
  await note("New: Travel mode on Me, above the steps. A manual switch: on when you leave, off when you are back. Your profile does not change; travel sits on top of it.");
  await shot("r176b");
  // c, new: turning it on asks two things
  await toMe(); await draw("Travel mode", `<p class="small muted page-why">For as long as it is on, Chef Mealan serves the place you are in. Your home shops, kitchen and plan wait for you, unchanged.</p>
    <section style="${CK};${mark}"><b>Where are you?</b><small class="muted" style="display:block;margin:4px 0 10px">Products in your search come from this country's shelves.</small><div class="moments"><button class="choice on" style="height:44px">Belgrade</button><button class="choice" style="height:44px">Limassol</button><button class="choice" style="height:44px">Spain</button><button class="choice" style="height:44px">Elsewhere</button></div><small class="muted" style="display:block;margin-top:8px">Your places from Where I shop and cook, or Elsewhere.</small></section>
    <section style="${CK};${mark};margin-top:12px"><b>What do you have there?</b><div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
      <button class="choice on" style="height:auto;text-align:left;padding:10px 12px"><b style="display:block">Hotel, no kitchen</b><small style="font-weight:600">Eating out and food you can buy and eat as it is. Chef Mealan suggests nothing to cook.</small></button>
      <button class="choice" style="height:auto;text-align:left;padding:10px 12px"><b style="display:block">A flat with a kitchen</b><small style="font-weight:600">Basic tools: stovetop, pan, pot. No oven, no scale, unless you tick them.</small></button>
      <button class="choice" style="height:auto;text-align:left;padding:10px 12px"><b style="display:block">At family or friends</b><small style="font-weight:600">A full kitchen; their shops. Chef Mealan cooks as at home.</small></button></div></section>
    <section style="${CK};margin-top:12px"><b>While travelling</b><div style="margin-top:8px;display:flex;flex-direction:column;gap:8px;font-weight:600"><div style="display:flex;justify-content:space-between;align-items:center"><span>Weigh-in paused</span><button class="choice on" style="height:44px">Yes</button></div><div style="display:flex;justify-content:space-between;align-items:center"><span>Training week as usual</span><button class="choice on" style="height:44px">Yes</button></div></div><small class="muted" style="display:block;margin-top:8px">A hotel scale is a different scale: your trend keeps your home mornings only. Your numbers stay the same; where the food comes from changes.</small></section>
    <button class="pill pill-wide pill-primary" style="height:52px;margin-top:14px;${mark}">Turn travel mode on</button>`);
  await note("New: turning it on asks two things. Where you are, from your places or Elsewhere. What you have there: a hotel with no kitchen, a flat with a kitchen, or family and friends. Weigh-in pauses. Your numbers do not change.");
  await shot("r176c");
  // d, new: Today with the banner
  await toTab("Today");
  await page.evaluate(([mark, html]) => { const t = document.querySelector("main") ? document.querySelector("main").firstElementChild : document.querySelector("header").nextElementSibling; t.insertAdjacentHTML("beforebegin", html); }, [mark, banner("Belgrade", "Hotel, no kitchen · since Thursday")]);
  await note("New: while it is on, every tab shows the travel banner with Turn off. Today, Plan and Plate serve Belgrade: a hotel breakfast, a bought lunch, a restaurant dinner, counted as always.");
  await shot("r176d");
  // e, new: the Plate in travel mode
  await toTab("Plate");
  await page.evaluate(([mark, html]) => { const t = document.querySelector(".step-head"); t.insertAdjacentHTML("beforebegin", html); const card = [...document.querySelectorAll(".card")].find((c) => /On the plate/.test(c.textContent)); card.insertAdjacentHTML("afterbegin", `<div style="${mark};background:#fff3e0;border-radius:10px;padding:8px 10px;margin-bottom:10px"><small style="font-weight:700;color:#8a4b00">Belgrade, hotel, no kitchen: Chef Mealan suggests what you can buy and eat as it is, and what to order. Search finds products sold in Serbia.</small></div>`); }, [mark, banner("Belgrade", "Hotel, no kitchen · since Thursday")]);
  await note("New: the Plate in travel mode. Scan and search look up products of the country you are in. Chef Mealan knows there is no kitchen: it suggests what to buy, what to order, and how to make a plate of it that fits your numbers. Start cooking is hidden.");
  await shot("r176e");
  // f, new: off, everything back
  await toMe();
  await page.evaluate((mark) => { const card = document.querySelector(".menu-list"); card.insertAdjacentHTML("beforebegin", `<div style="${mark};display:flex;align-items:center;gap:12px;background:var(--surface,#fff);border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin:0 0 12px"><span style="font-size:24px">🏠</span><div style="flex:1"><b style="display:block">Welcome back</b><small class="muted" style="font-weight:600">Travel mode was on 4 days, Belgrade. Your home shops, kitchen and weigh-in are back. The 4 days stay in your week as eaten.</small></div><button class="pill pill-small" style="height:44px">OK</button></div>`); }, mark);
  await note("New: Turn off, and everything is back as it was: shops, kitchen, tools, weigh-in. Nothing was rewritten. What you ate while away stays in your week, as every meal does. The coach sees the travel days marked, if the day part is shared.");
  await shot("r176f");
  await b.close(); server.kill();
})();
