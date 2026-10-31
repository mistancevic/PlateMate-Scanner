// DT181 (Coach Milan 31 October 10:50 and 11:54): Explorer, a third part, Hormones: the body's messengers, what food, training and
// sleep do to them, for anyone. Theory first with sources, then your case in the five parts at the member's own horizon. Never a
// condition, a test or a treatment. Drawn as version 1, for the brainstorm.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.24, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3386", U = `http://127.0.0.1:${PORT}`;
const LIFE = { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, wake: "early", bed: "mid", where: ["Cook at home"], diet: "Everything", alcohol: "Occasionally" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-11-05T12:40:00"));
  await page.addInitScript(([s, life]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: life }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed, LIFE]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const openEx = async () => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300); await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(600); };
  const note = (t) => page.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; (document.querySelector(".ex-calc") || document.querySelector(".explorer")).before(d); window.scrollTo(0, 0); }, { t, NOTE });
  // everything under the family chips is replaced by drawn content; the chips may be replaced too
  const draw = (html, chips) => page.evaluate(({ html, chips }) => { const ex = document.querySelector(".explorer"); const fam = ex.querySelector(".ex-families"); if (chips) fam.outerHTML = chips; const f2 = ex.querySelector(".ex-families, .ex-parts"); let n = f2.nextElementSibling; while (n) { const x = n.nextElementSibling; n.remove(); n = x; } f2.insertAdjacentHTML("afterend", html); window.scrollTo(0, 0); }, { html, chips });
  const CK = "background:var(--surface,#fff);border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:12px";
  const SRC = (t) => `<small style="display:block;font-size:12px;color:var(--muted);margin-top:2px">${t}</small>`;
  const line = (b, t, src) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b style="font-size:14px">${b}</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">${t}</small>${src ? SRC("Source: " + src) : ""}</div>`;
  const PARTS = (on) => `<div class="moments ex-parts" role="radiogroup" aria-label="Which part" style="margin-bottom:8px"><button class="choice ${on === "n" ? "on" : ""}" style="height:44px">Nutrients</button><button class="choice ${on === "s" ? "on" : ""}" style="height:44px">Situations</button><button class="choice ${on === "h" ? "on" : ""}" style="height:44px;${on === "h" ? mark : ""}">${on === "old" ? "Hormones" : "The body"}</button></div>`;
  const FAMS = `<div class="moments ex-chips ex-families" role="radiogroup"><button class="choice on" style="height:44px">Protein</button><button class="choice" style="height:44px">Fats</button><button class="choice" style="height:44px">Carbs</button><button class="choice" style="height:44px">Micros</button><button class="choice" style="height:44px">Foods</button></div>`;
  const row = (name, hint, soon) => `<button class="menu-row" style="${soon ? "opacity:.55" : mark}"><span class="menu-row-text"><b>${name}</b><small>${hint}</small></span><span aria-hidden="true">${soon ? "" : "›"}</span></button>`;
  const PART = (k, title, body, m = "") => `<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);${m}"><span style="flex:none;width:28px;height:28px;border-radius:50%;background:#172742;color:#fff;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center">${k}</span><div style="flex:1;min-width:0"><b style="font-size:14px">${title}</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">${body}</small></div></div>`;
  const TAP = (t, where) => `<button class="pill pill-small" style="min-height:44px;height:auto;padding:8px 12px;line-height:1.3;text-align:left;white-space:normal;width:100%;display:block;box-sizing:border-box"><b>${t}</b><small style="display:block;font-weight:600;font-size:12px">${where}</small></button>`;

  const WHEN = (rows) => `<section style="${CK};${mark}"><b>When it helps, when it hurts</b><small class="muted" style="display:block;margin:2px 0 6px;line-height:1.45">The same food is a different thing in a different situation.</small>${rows.map(([s, ok, w]) => `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span style="flex:none;width:58px;font-size:12px;font-weight:800;color:${ok === "Helps" ? "#0f6b4e" : ok === "Hurts" ? "#b42318" : "#8a4b00"}">${ok}</span><div style="flex:1;min-width:0"><b style="font-size:14px">${s}</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">${w}</small></div></div>`).join("")}</section>`;
  const HEAD = (name, horizon, what) => `<div style="display:flex;align-items:center;gap:8px;margin:4px 0 8px"><button class="link" style="min-height:44px">‹ The body</button></div><h3 style="margin:0;font-size:20px">${name}</h3><small class="muted" style="display:block;line-height:1.5;margin-top:4px">${what} Read at the ${horizon}. What food, training and sleep do to it, for anyone. Never a test, a condition or a treatment: for any of those, your doctor.</small>`;
  const fam = (name, hint, state) => `<button class="menu-row" style="${state === "drawn" ? mark : state === "now" ? "" : "opacity:.6"}"><span class="menu-row-text"><b>${name}</b><small>${hint}</small></span><small style="flex:none;font-size:12px;font-weight:800;color:${state === "drawn" ? "#2e7be8" : state === "now" ? "#0f6b4e" : "var(--muted)"}">${state === "drawn" ? "this board" : state === "now" ? "DT181" : "later"}</small></button>`;
  // a, now: with DT180 and DT181 drawn, the third chip says Hormones
  await openEx();
  await draw(`<p class="small muted page-why">Hormones are the body's messengers. Food, training and sleep move them, in everyone.</p><div class="menu-list">${row("Glucose and insulin", "The curve after a meal. Read per meal.", false)}${row("Hunger hormones", "Leptin says full, ghrelin says hungry. Read per day.", false)}${row("Cortisol", "The morning hormone. Read per day.", false)}${row("Testosterone", "Muscle, drive and recovery, in everyone. Read per month.", false)}${row("Oestrogen", "Bone, where fat sits, recovery, in everyone. Read per month.", true)}</div>`, PARTS("old"));
  await page.evaluate((mark) => { document.querySelector(".ex-parts").style.cssText += ";" + mark; }, mark);
  await note("Now, with DT180 and DT181 drawn: three chips, Nutrients, Situations, Hormones. Hormones is one family of what the food becomes, not the whole of it.");
  await shot("r182a");
  // b, new: the map
  await openEx();
  await draw(`<p class="small muted page-why">Explorer in one sentence: what you eat (Nutrients), what it becomes (The body), when it helps and when it hurts (Situations). The body has eight families. Every page keeps one shape: what it is, what moves it with its source, when it helps, your case in five parts.</p>
    <div class="menu-list">
      ${fam("Muscle", "Built by protein and strength training; the sink for carbs after a session. Why the protein range is what it is.", "later")}
      ${fam("The fat store", "The fat you carry, against the fat you eat. In circulation, burned, used over the day, stored; ketones.", "drawn")}
      ${fam("Glycogen", "The carb store, muscle and liver, about a day's worth. Only what was used gets refilled.", "drawn")}
      ${fam("Bone", "Calcium and vitamin D from Micros, strength training, oestrogen for everyone.", "later")}
      ${fam("The gut", "Starts in the mouth. Digestion and uptake, the microbiome, fibre and variety, the fullness messengers.", "later")}
      ${fam("The liver", "Makes glucose and ketones, clears alcohol, holds the small glycogen store.", "later")}
      ${fam("Hormones", "The messengers: glucose and insulin, hunger, cortisol, testosterone, oestrogen.", "now")}
      ${fam("The brain", "Dopamine, serotonin, adrenaline, endorphins: wanting, mood, stress, the feeling after a session.", "later")}
    </div>
    <small class="muted" style="display:block;margin-top:10px;line-height:1.5">The wellness line for every family: what happens in anyone; no test read, no level, no condition, no treatment, no supplement. The brain's line is the strictest: mood, cravings, habit and sleep, never a mental condition or a medication.</small>`, PARTS("h"));
  await note("New: the third chip is The body, and this is its map. Eight families; two drawn on this board, Hormones on DT181, the rest later, each its own board. One shape for every page.");
  await shot("r182b");
  // c, new: The fat store
  await openEx();
  await draw(HEAD("The fat store", "day", "The fat you eat is fuel and building material. The fat you carry is the store. They are not the same thing, and the one does not become the other by itself.") + `<section style="${CK};${mark}"><b>Five words, and what each one means</b>
    ${line("In circulation", "Fatty acids in the blood are fuel on its way, from the last meal or from the store. Highest a few hours after a meal and during easy work.", "Frayn 2010, Metabolic Regulation, a human perspective")}
    ${line("Burned, or oxidised", "Muscle burns fat all the time: most at rest and in easy work, least in a hard session, where carbs take over. A session burns less fat than the day around it.", "Venables, Achten and Jeukendrup 2005, Journal of Applied Physiology")}
    ${line("Used over the day", "The honest number. What the store gave up is the day's total out against the day's total in, not what one session did.", "Hall et al. 2012, American Journal of Clinical Nutrition, energy balance")}
    ${line("Stored", "What is over the day's total goes to the store, from carbs, fat or protein alike. Fat gets there with the least work; carbs are turned to fat only in small amounts.", "Hellerstein 1999, European Journal of Clinical Nutrition")}
    ${line("Ketones", "The liver makes them when carbs are low for a day or more; the brain can run on them. Normal in a fast or a low-carb day. Not a sign of fat loss by itself.", "Cahill 2006, Annual Review of Nutrition")}
    </section>` + WHEN([
      ["Helps", "Easy work: a walk, a slow ride", "The most fat burned per minute, and it adds up over hours. The reason steps are in your day."],
      ["Watch", "A hard session", "Carbs do the work; fat is burned later, in the hours after. The session still counts, through the day's total."],
      ["Watch", "The hours after a big meal", "Storage for a few hours is normal; it is what a meal is for. The day decides, not the meal."],
      ["Hurts", "Counting what a session burned", "The number on a watch is the session, not the day. The day's range on Goal is the number that moves the store."],
    ]) + `<section style="${CK}"><b>The wellness line</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">What the store does in anyone. No body fat reading, no target, no fat burner, no ketone strip. Your weigh-ins and the trend on Goal are the app's view of this, and only you choose to share them.</small></section>`, PARTS("h"));
  await note("New: The fat store. The fat you eat against the fat you carry, then the five words people mix up: in circulation, burned, used over the day, stored, ketones. Each true in its situation; the day's total is the honest number.");
  await shot("r182c");
  // d, new: Glycogen
  await openEx();
  await draw(HEAD("Glycogen", "day", "Glucose is what moves in the blood, held in a narrow range all day. Glycogen is the store: about 400 g in muscle, about 100 g in the liver, a day's worth.") + `<section style="${CK};${mark}"><b>What it does</b>
    ${line("Two stores, two jobs", "The liver's store keeps blood glucose steady between meals and overnight; any meal refills it. Muscle's store is for the muscle only: it is used when muscle works, and refilled by carbs after.", "Jensen et al. 2011, Frontiers in Physiology")}
    ${line("Overnight", "The liver's store runs low by morning; breakfast refills it. That is why the first meal after a short night matters most on the Glucose page.", "Nilsson and Hultman 1973, Scandinavian Journal of Clinical and Laboratory Investigation")}
    ${line("Only what was used gets refilled", "A hard session or a long day on your feet empties muscle glycogen; the next carbs put it back. A full store takes nothing more: what is over goes to the day's total.", "Burke, Hawley, Wong and Jeukendrup 2011, Journal of Sports Sciences")}
    </section>` + WHEN([
      ["Helps", "The meal after a hard session", "The store is open; carbs land there first. The biggest carb meal of a training day goes here."],
      ["Helps", "The evening after a day on your feet", "Muscle was used; a carb dinner refills it. The carbs in your day's range, not a heavy meal."],
      ["Watch", "A hard day for the head", "Nothing to refill in the muscle; the liver's store is topped up by any meal. Carbs count like any others that day."],
      ["Watch", "Two rest days in a row", "The store is full. Carbs are still fine inside the range; they just have no special job."],
    ]) + `<section style="${CK};${mark}"><b>Your case: today</b><small class="muted" style="display:block;margin:2px 0 6px;line-height:1.45">Read from your training week and your plan.</small>
    ${PART("1", "Before: yesterday", "A rest day, three meals in the range. The store is full.")}
    ${PART("2", "The path here", "Breakfast at 06:30 refilled the liver. No carbs with a job yet today.")}
    ${PART("3", "Now", "Strength, hard, at 17:30 today. Muscle glycogen will be used.")}
    ${PART("4", "The path on", `<div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">${TAP("Dinner: the day's biggest carb meal, after the session", "On Plan; Chef Mealan sizes it to your day")}${TAP("Tomorrow, a rest day: carbs back to the usual share", "Plan reads your training week")}</div>`)}
    ${PART("5", "The goal: the day", "Carbs inside your range, placed where they have a job. Your numbers do not change.", "border-bottom:0")}</section>`, PARTS("h"));
  await note("New: Glycogen, with glucose explained next to it. Two stores, two jobs; overnight; only what was used gets refilled. Your case places the day's carbs where they have a job: after today's hard session.");
  await shot("r182d");
  // e, new: Situations: Fat burning, what is true when
  await openEx();
  await draw(`<div style="display:flex;align-items:center;gap:8px;margin:4px 0 8px"><button class="link" style="min-height:44px">‹ Situations</button></div><h3 style="margin:0;font-size:20px">Fat burning: what is true when</h3><small class="muted" style="display:block;line-height:1.5;margin-top:4px">A day situation. The claims people repeat, each one true in one situation and not in another. The body pages explain the words; this page says when.</small>` + WHEN([
      ["Helps", "A walk before breakfast", "More fat burned during the walk than after a meal, that is true. Over the day and the weeks, the same fat loss as the same walk after breakfast (Schoenfeld et al. 2014, Journal of the International Society of Sports Nutrition). Do it if you like it, not for the number."],
      ["Helps", "A long easy walk or ride", "The most fat burned per minute, for hours. The steps in your day are this."],
      ["Watch", "A hard session", "Carbs do the work during it; fat is burned in the hours after. The session counts through the day's total and the muscle it builds."],
      ["Watch", "The hours after a big meal", "Storage for a few hours is what a meal is for. Nothing is lost; the day decides."],
      ["Watch", "A low-carb day", "Ketones appear after a day or more. Normal, and not fat loss by itself: the day's total still decides."],
      ["Hurts", "A fat loss phase that is too deep", "Below the range on Goal, the body saves energy and drops muscle with the fat. Lose fat, faster, is the lowest the app goes."],
    ]) + `<section style="${CK};${mark}"><b>Your case: this week</b><small class="muted" style="display:block;margin:2px 0 6px;line-height:1.45">Read from your goal, your weigh-ins and the days lived by the plan.</small>
    ${PART("1", "Before: the check-in, 20 October", "Lose fat, steady. 85 kg. Five of seven days by the plan.")}
    ${PART("2", "The path here", "Two weeks: 84.6 kg on the 7-day average. Four of seven days by the plan this week; two dinners over the range.")}
    ${PART("3", "Now", "Trend: down 0.2 kg a week. Your goal expects 0.25 to 0.5. Steps 6,000 a day; the plan says 8,000.")}
    ${PART("4", "The path on", `<div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">${TAP("A 30 minute walk after lunch, Monday to Friday", "On Plan as a row; the easy work that burns most")}${TAP("Dinner inside the range on the two long days", "Chef Mealan's quick dinners, cooked ahead")}</div>`)}
    ${PART("5", "The goal: the check-in, 17 November", "83.5 to 84 kg on the 7-day average, six of seven days by the plan.", "border-bottom:0")}
    <div style="margin-top:10px;background:#eef1f6;border-radius:12px;padding:10px 12px"><b style="font-size:14px">Trend against trajectory</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">Your trend: 0.2 kg a week. Your goal needs 0.25 to 0.5. The gap is one walk a day and two dinners, not a harder cut.</small></div></section>`, PARTS("s"));
  await note("New, under Situations: Fat burning, what is true when. Six claims, each placed: a walk before breakfast, a long easy walk, a hard session, after a big meal, a low-carb day, a cut that is too deep. Your case at the week: the trend against the goal's trajectory, and the gap closed by a walk and two dinners.");
  await shot("r182e");
  // f, new: the chat, and the links between parts
  await openEx();
  await draw(`<div style="display:flex;align-items:center;gap:8px;margin:4px 0 8px"><button class="link" style="min-height:44px">‹ Situations</button></div><h3 style="margin:0;font-size:20px">Fat burning: what is true when</h3>
    <section style="${CK};${mark}"><b>Ask Chef Mealan</b><small class="muted" style="display:block;margin:2px 0 8px">The round button on this page starts with these.</small><div class="moments"><button class="choice" style="height:44px">Does my walk burn fat?</button><button class="choice" style="height:44px">Is a low-carb day better?</button><button class="choice" style="height:44px">Why is the scale flat this week?</button></div><small class="muted" style="display:block;margin-top:8px;line-height:1.45">Chef Mealan answers from this page, your weigh-ins and your plan. It never names a condition and never goes below your range.</small></section>
    <section style="${CK};${mark}"><b>The pages this one reads</b><div class="menu-list" style="margin-top:8px">${row("The body: The fat store", "The five words", false)}${row("The body: Glycogen", "Why carbs after a session", false)}${row("Nutrients: Fats", "The kinds you eat", false)}${row("Situations: A bad night's sleep", "Hunger after a short night", false)}</div><small class="muted" style="display:block;margin-top:8px;line-height:1.45">The three parts link: a situation reads the body pages, the body pages read the nutrients, and every page can send you to a situation.</small></section>`, PARTS("s"));
  await note("New: the chat chips for this page, and the links. A situation page reads the body pages, the body pages read the nutrients, and every page can send you to a situation. One Explorer, three parts.");
  await shot("r182f");
  await b.close(); server.kill();
})();
