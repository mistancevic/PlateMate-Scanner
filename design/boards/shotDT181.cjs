// DT181 (Coach Milan 31 October 10:50 and 11:54): Explorer, a third part, Hormones: the body's messengers, what food, training and
// sleep do to them, for anyone. Theory first with sources, then your case in the five parts at the member's own horizon. Never a
// condition, a test or a treatment. Drawn as version 1, for the brainstorm.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.24, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3385", U = `http://127.0.0.1:${PORT}`;
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
  const PARTS = (on) => `<div class="moments ex-parts" role="radiogroup" aria-label="Which part" style="margin-bottom:8px"><button class="choice ${on === "n" ? "on" : ""}" style="height:44px">Nutrients</button><button class="choice ${on === "s" ? "on" : ""}" style="height:44px">Situations</button><button class="choice ${on === "h" ? "on" : ""}" style="height:44px;${on === "h" ? mark : ""}">Hormones</button></div>`;
  const FAMS = `<div class="moments ex-chips ex-families" role="radiogroup"><button class="choice on" style="height:44px">Protein</button><button class="choice" style="height:44px">Fats</button><button class="choice" style="height:44px">Carbs</button><button class="choice" style="height:44px">Micros</button><button class="choice" style="height:44px">Foods</button></div>`;
  const row = (name, hint, soon) => `<button class="menu-row" style="${soon ? "opacity:.55" : mark}"><span class="menu-row-text"><b>${name}</b><small>${hint}</small></span><span aria-hidden="true">${soon ? "" : "›"}</span></button>`;
  const PART = (k, title, body, m = "") => `<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);${m}"><span style="flex:none;width:28px;height:28px;border-radius:50%;background:#172742;color:#fff;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center">${k}</span><div style="flex:1;min-width:0"><b style="font-size:14px">${title}</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">${body}</small></div></div>`;
  const TAP = (t, where) => `<button class="pill pill-small" style="min-height:44px;height:auto;padding:8px 12px;line-height:1.3;text-align:left;white-space:normal;width:100%;display:block;box-sizing:border-box"><b>${t}</b><small style="display:block;font-weight:600;font-size:12px">${where}</small></button>`;

  const HEAD = (name, horizon, what) => `<div style="display:flex;align-items:center;gap:8px;margin:4px 0 8px"><button class="link" style="min-height:44px">‹ Hormones</button></div><h3 style="margin:0;font-size:20px">${name}</h3><small class="muted" style="display:block;line-height:1.5;margin-top:4px">${what} Read at the ${horizon}. What food, training and sleep do to it, for anyone. Never a test, a condition or a treatment: for any of those, your doctor.</small>`;
  // a, now: nutrients and situations, no hormones
  await openEx();
  await page.evaluate((mark) => { document.querySelector(".ex-families").style.cssText += ";" + mark; }, mark);
  await note("Now, 0.3.24, with DT180 drawn: Explorer has Nutrients and Situations. Hormones are much discussed and not on any page, so people read about them elsewhere, often as claims.");
  await page.evaluate(() => { const ex = document.querySelector(".explorer"); let n = ex.querySelector(".ex-families").nextElementSibling; let keep = 2; while (n) { const x = n.nextElementSibling; if (keep-- <= 0) n.remove(); n = x; } });
  await shot("r181a");
  // b, new: a third part, Hormones
  await openEx();
  await draw(`<p class="small muted page-why">Hormones are the body's messengers. Food, training and sleep move them, in everyone. Each page says what a hormone does, what moves it, with its source, and your case from what the app knows. No page reads a blood test, names a condition or sells a supplement.</p>
    <div class="menu-list">${row("Insulin", "Carries the energy of a meal into the body. Moved by carbs, protein, fibre and training. Read per meal.", false)}${row("Hunger hormones", "Leptin says full, ghrelin says hungry. Moved by sleep and by meal size. Read per day.", false)}${row("Cortisol", "The morning hormone. Moved by sleep, caffeine and hard training. Read per day.", false)}${row("Testosterone", "Muscle, drive and recovery. Moved by sleep, strength training and body fat. Read per month.", false)}</div>
    <small class="muted" style="display:block;margin-top:10px;line-height:1.5">Four members in version 1. Oestrogen and the cycle, thyroid and growth hormone wait: they need a different wellness line, to be agreed first.</small>`, PARTS("h"));
  await note("New: a third part of Explorer, Hormones, with four members. Each is read at its own horizon: insulin per meal, hunger and cortisol per day, testosterone per month.");
  await shot("r181b");
  // c, new: Insulin, theory first
  await openEx();
  await draw(HEAD("Insulin", "meal", "Insulin carries the energy of a meal from the blood into muscle and fat. It rises after every meal and falls again. That is its job, not a problem.") + `<section style="${CK};${mark}"><b>What it does</b>
    ${line("After a meal, blood sugar rises, insulin answers", "Carbs raise it most, protein some, fat and fibre little. Within two to three hours both are back where they were.", "Ludwig 2002, JAMA, the glycaemic index review")}
    ${line("How fast depends on the food, not only how much", "White bread and a baked potato raise blood sugar fast (GI about 70 and above); lentils and most fruit slowly (GI under 55). Our Carbs page has the table.", "Atkinson, Foster-Powell and Brand-Miller 2008, Diabetes Care, International Tables of GI")}
    ${line("Protein and fibre in the same meal slow the rise", "The same carbs with protein and fibre on the plate give a lower, longer curve. That is the plate the app builds anyway: protein first, fibre with it.", "Ludwig 2002, JAMA; WHO 2023 carbohydrate guideline on fibre")}
    </section><section style="${CK};${mark}"><b>What moves it</b>
    ${line("Training", "Working muscle takes up sugar during and for hours after a session, with little insulin needed. The meal after training is the one where carbs land best.", "Richter and Hargreaves 2013, Physiological Reviews")}
    ${line("A short night", "One short night makes the body answer a meal with more insulin for the same sugar, in healthy people, for that day.", "Spiegel, Leproult and Van Cauter 1999, The Lancet")}
    ${line("Meal size", "A big meal is a big curve; the same food in two meals is two smaller curves. The eating window from Lifestyle is where this is set.", "Ludwig 2002, JAMA")}
    </section><section style="${CK}"><b>The wellness line</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">This page is about what happens after a meal in anyone. It does not read blood sugar, does not say insulin resistance or diabetes, and does not advise about either. If you have been told to watch your blood sugar, your doctor's plan comes first, and Chef Mealan follows the numbers you give it.</small></section>`, PARTS("h"));
  await note("New: Insulin, theory first. What it does after a meal, and what moves it: the food's GI, protein and fibre on the plate, training, a short night, meal size. One line each with its paper. The wellness line says what the page is not.");
  await shot("r181c");
  // d, new: Insulin, your case at the meal
  await openEx();
  await draw(HEAD("Insulin", "meal", "Your case reads today's planned lunch, your Carbs letter and your training.") + `<section style="${CK};${mark}"><b>Your case: lunch today, 13:15</b><small class="muted" style="display:block;margin:2px 0 6px;line-height:1.45">From Plan, the Plate's letters and your training week. Nothing is changed unless you tap.</small>
    ${PART("1", "Before: your usual lunch", "Three meals a day, lunch at 13:15. Your carbs are Balanced: 228 to 366 g a day, moving with your training.")}
    ${PART("2", "The path here: this week's lunches", "Monday a canteen pasta, C+ and Fi low. Tuesday chicken rice bowl, C in the range, Fi in the range. Yesterday a sandwich, C+.")}
    ${PART("3", "Now: today's lunch", "Chicken rice bowl, planned. Letters: P in the range, C in the range, Fi in the range. Rice GI about 60, with chicken and spinach on the plate: a slow curve. No training today.")}
    ${PART("4", "The path on", `<div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">${TAP("Keep this lunch", "It already does what this page says")}${TAP("On a training day, move the bigger carb meal after the session", "Plan reads your training week; one tap per week")}${TAP("Monday's canteen: add a side of beans or a salad", "The Plate's Fi letter goes into the range")}</div>`)}
    ${PART("5", "The goal: the day", "Carbs inside your range, fibre at least 25 g a day, protein at every meal. Your numbers do not change.", "border-bottom:0")}
    <div style="margin-top:10px;background:#eef1f6;border-radius:12px;padding:10px 12px"><b style="font-size:14px">Trend against trajectory</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">Your trend: two of three lunches this week C+ with Fi low. Your goal needs Fi in the range every day. The change: fibre on the Monday plate.</small></div></section>
    <section style="${CK}"><b>Ask Chef Mealan</b><div class="moments" style="margin-top:8px"><button class="choice" style="height:44px">Why am I sleepy after lunch?</button><button class="choice" style="height:44px">Which carbs before training?</button><button class="choice" style="height:44px">Is fruit sugar different?</button></div></section>`, PARTS("h"));
  await note("New: Insulin, your case, read at the meal. The five parts use what the app has: the Plate's letters P, C and Fi, the GI from our Carbs table, your training week. The taps go to Plan and the Plate. The trend is this week's lunches.");
  await shot("r181d");
  // e, new: Testosterone, read per month
  await openEx();
  await draw(HEAD("Testosterone", "month", "Testosterone builds muscle, drive and recovery, in men and, in smaller amounts, in women.") + `<section style="${CK};${mark}"><b>What moves it</b>
    ${line("Sleep", "One week of five hours a night cut daytime testosterone by 10 to 15 % in healthy young men. The usual fall with age is 1 to 2 % a year, so a week of short nights is like ten years.", "Leproult and Van Cauter 2011, JAMA")}
    ${line("Strength training", "A session with big movements and short rests raises it for about an hour. The long-term gain comes from the training itself, not from the hour.", "Kraemer and Ratamess 2005, Sports Medicine")}
    ${line("Body fat", "In men, more body fat goes with lower testosterone, and losing fat brings part of it back. Your weigh-ins and the trend on Goal are the app's view of this.", "Camacho et al. 2013, European Journal of Endocrinology, the EMAS study")}
    ${line("Eating far too little", "A long, hard cut lowers it. Your range on Goal is set so that does not happen; Lose fat, faster, is the lowest the app goes.", "Loucks 2004, Journal of Sports Sciences, energy availability")}
    </section><section style="${CK};${mark}"><b>Your case: this month</b><small class="muted" style="display:block;margin:2px 0 6px;line-height:1.45">Read from your sleep habit, your training week and your weigh-ins. No blood value, ever.</small>
    ${PART("1", "Before: at your check-in, 20 October", "Bed 22:00 to midnight, up before 6:00. Strength Monday and Thursday. Weight trend flat at 85 kg.")}
    ${PART("2", "The path here", "Two short nights this week. Thursday's session moved twice. Weight flat.")}
    ${PART("3", "Now", "Four weeks to the check-in on 27 November. Three of your four levers are in place: training, food, body fat. Sleep is the one that moved.")}
    ${PART("4", "The path on", `<div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">${TAP("Keep both strength days this week", "On Plan, Thursday at 17:30")}${TAP("Dinner at 20:00 all week", "See A bad night's sleep in Situations")}</div>`)}
    ${PART("5", "The goal: the check-in", "Maintain. Weight 84 to 86 kg, both strength days, the usual nights.", "border-bottom:0")}</section>
    <section style="${CK}"><b>The wellness line</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">No page says your level, low or high. No supplement is named, and no booster: the four levers above are the ones with evidence. If you want your level known, that is a blood test with your doctor.</small></section>`, PARTS("h"));
  await note("New: Testosterone, read per month. Four levers with their papers: sleep, strength training, body fat, eating far too little. Your case uses the training week, the weigh-ins and the sleep habit. No level, no supplement, no booster.");
  await shot("r181e");
  // f, new: Hunger hormones and cortisol lead to the situation
  await openEx();
  await draw(HEAD("Hunger hormones", "day", "Leptin tells the brain there is enough; ghrelin says eat. Sleep and meal size move both.") + `<section style="${CK};${mark}"><b>What moves them</b>
    ${line("Two short nights", "After two nights of four hours, leptin was 18 % lower and ghrelin 28 % higher; hunger up by a quarter, mostly for sweet, salty and starchy food.", "Spiegel et al. 2004, Annals of Internal Medicine")}
    ${line("Protein in the meal", "A meal with more protein leaves people fuller for longer than the same energy as carbs or fat.", "Weigle et al. 2005, American Journal of Clinical Nutrition")}
    ${line("Eating slowly, and fibre", "Fullness takes about 20 minutes to arrive; fibre and volume help it arrive before the plate is empty.", "WHO 2023 carbohydrate guideline; Ludwig 2002, JAMA")}
    </section>
    <section style="${CK};${mark};background:#fff3e0;border-color:#f3d2a6"><b>Your case points to a situation</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">Two short nights this week, and a 22:30 snack on both. The hormones page explains why; the situation page has the day's three taps.</small><button class="pill pill-small" style="min-height:44px;margin-top:8px">A bad night's sleep ›</button></section>
    <section style="${CK}"><b>Cortisol, in short</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">The morning hormone: high at waking, low at night. A short night keeps it up in the evening (Leproult et al. 1997, Sleep); caffeine raises it (Lovallo et al. 2005, Psychosomatic Medicine); a hard session raises it for an hour and that is normal. Its page follows the same shape. Stress as a feeling is not measured here.</small></section>`, PARTS("h"));
  await note("New: Hunger hormones, read per day. The theory explains the 22:30 snack; the case points to the situation page, which has the taps. The two parts of Explorer link to each other. Cortisol, the same shape, in short.");
  await shot("r181f");
  await b.close(); server.kill();
})();
