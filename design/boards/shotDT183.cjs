// DT181 (Coach Milan 31 October 10:50 and 11:54): Explorer, a third part, Hormones: the body's messengers, what food, training and
// sleep do to them, for anyone. Theory first with sources, then your case in the five parts at the member's own horizon. Never a
// condition, a test or a treatment. Drawn as version 1, for the brainstorm.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.24, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3387", U = `http://127.0.0.1:${PORT}`;
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
  const CHAT = (q) => `<section style="${CK}"><b>Ask Chef Mealan</b><div class="moments" style="margin-top:8px">${q.map((x) => `<button class="choice" style="height:44px">${x}</button>`).join("")}</div></section>`;
  const LINE = (t) => `<section style="${CK}"><b>The wellness line</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">${t}</small></section>`;
  const CASE = (title, sub, parts, trend) => `<section style="${CK};${mark}"><b>${title}</b><small class="muted" style="display:block;margin:2px 0 6px;line-height:1.45">${sub}</small>${parts.map(([k, h, b], i) => PART(k, h, b, i === parts.length - 1 ? "border-bottom:0" : "")).join("")}${trend ? `<div style="margin-top:10px;background:#eef1f6;border-radius:12px;padding:10px 12px"><b style="font-size:14px">Trend against trajectory</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">${trend}</small></div>` : ""}</section>`;
  const TAPS = (xs) => `<div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">${xs.map(([t, w]) => TAP(t, w)).join("")}</div>`;
  const family = async (id, name, horizon, what, theory, when, line, caseHtml, chat, notes) => {
    await openEx(); await draw(HEAD(name, horizon, what) + theory, PARTS("h")); await note(notes[0]); await shot(`r${id}a`);
    await openEx(); await draw(HEAD(name, horizon, what) + when + LINE(line), PARTS("h")); await note(notes[1]); await shot(`r${id}b`);
    await openEx(); await draw(HEAD(name, horizon, what) + caseHtml + CHAT(chat), PARTS("h")); await note(notes[2]); await shot(`r${id}c`);
  };

  // DT183 Muscle
  await family("183", "Muscle", "month", "Muscle is built and taken apart all day. Protein and strength training tip the balance to building; doing without either tips it the other way.",
    `<section style="${CK};${mark}"><b>What it is, what moves it</b>
    ${line("Protein, per meal", "Building runs for a few hours after a meal with about 0.4 g of protein per kg of body weight, about 30 g for most people, and more in one meal adds little. Four such meals a day is the shape of the day.", "Schoenfeld and Aragon 2018, Journal of the International Society of Sports Nutrition; Moore et al. 2009")}
    ${line("Leucine", "The amino acid that starts the building. About 2.5 g in a meal does it: a chicken breast, a scoop of whey, a big bowl of lentils with grains. The Protein page shows it per food.", "Devries et al. 2018, Journal of Nutrition")}
    ${line("Strength training", "The signal that makes the protein go to muscle. Sets close to hard, two or more times a week per muscle; more volume builds more, up to a point.", "Schoenfeld, Ogborn and Krieger 2017, Journal of Sports Sciences")}
    ${line("Doing without", "Two weeks without training lose measurable muscle in young and old; a leg in a cast loses more. Walking and protein slow it.", "Wall et al. 2013, Journal of Clinical Endocrinology and Metabolism")}
    ${line("Age", "From about 50 the same protein builds less, so the need per meal and per day goes up. Your protein range on Goal already rises with your year of birth.", "Bauer et al. 2013, JAMDA, the PROT-AGE study group")}
    </section>`,
    WHEN([
      ["Helps", "The meal after a session", "Building runs highest for about a day after training; every protein meal in that day counts, not only the first hour."],
      ["Helps", "Protein before bed", "A protein meal or a glass of skyr before sleep builds overnight, when the gap is longest."],
      ["Helps", "A fat loss phase", "Protein at the top of your range and the strength days kept: the fat goes, the muscle stays."],
      ["Watch", "A rest day", "Building goes on from yesterday's session; protein stays, carbs can come down."],
      ["Hurts", "Two weeks of nothing", "Holiday, illness, a busy month. Walking and protein keep most of it; the first week back is easy on purpose."],
    ]),
    "What muscle does in anyone. No body composition reading, no supplement beyond food, no booster. Whey and skyr are foods on the Protein page; nothing else is sold here.",
    CASE("Your case: this month", "Read from your plates, your training week and your weigh-ins.", [
      ["1", "Before: the check-in, 20 October", "Protein 155 to 210 g a day, three strength days. 85 kg, trend flat."],
      ["2", "The path here", "Protein at 150 g on the 7-day average: three meals, breakfast at 18 g. Two of three strength days done each week."],
      ["3", "Now", "Breakfast is the meal below 30 g. Thursday's session was moved twice."],
      ["4", "The path on", TAPS([["Breakfast to 30 g of protein", "On the Plate; Chef Mealan's ideas lean that way"], ["Thursday's session kept, or moved to Friday", "On Plan, this week"]])],
      ["5", "The goal: the check-in, 17 November", "Protein inside the range every day, three sessions a week, weight flat."],
    ], "Your trend: 150 g a day, below the range by one meal. Your goal needs 155 or more. The gap is breakfast."),
    ["How much protein in one meal?", "Do I lose muscle on a cut?", "Is one strength day enough?"],
    ["New: Muscle, read per month. Protein per meal and leucine, strength training, doing without, age. One line each with its paper.", "New: when it helps, when it hurts: the day after a session, protein before bed, a fat loss phase, a rest day, two weeks of nothing.", "New: your case at the month: breakfast is the meal below 30 g, Thursday's session moves. The gap is one meal."]);

  // DT184 Bone
  await family("184", "Bone", "month", "Bone is rebuilt all life long, slowly. Calcium and vitamin D are the material, strength training is the signal, and the hormones for everyone keep the balance.",
    `<section style="${CK};${mark}"><b>What it is, what moves it</b>
    ${line("Calcium and vitamin D", "The material and the key that lets it in. The Micros pages have your day for both, with EFSA's values by age, and the ten foods with the most in a portion.", "EFSA 2015 and 2016 dietary reference values; the Micros pages")}
    ${line("Strength and impact", "Bone grows where it is loaded: lifting, jumping, running, stairs. Swimming and cycling are good for everything else and do little here.", "Watson et al. 2018, Journal of Bone and Mineral Research, the LIFTMOR trial")}
    ${line("Protein", "Bone is a third protein by weight; low protein goes with weaker bone, and the protein range on Goal covers it.", "Rizzoli et al. 2018, Osteoporosis International, the ESCEO consensus")}
    ${line("Eating too little for too long", "A long, deep cut lowers the hormones that protect bone, in everyone. Lose fat, faster, is as low as the app goes, and the check-in watches it.", "Loucks 2004, Journal of Sports Sciences")}
    ${line("Time", "Bone peaks around 30 and then slowly gives; what is built before then and kept after decides most of it.", "Weaver et al. 2016, Osteoporosis International")}
    </section>`,
    WHEN([
      ["Helps", "A strength day", "The load is the signal. Two days a week with the big movements is the dose."],
      ["Helps", "The meal after, with dairy or greens", "Calcium with the protein that bone also needs."],
      ["Watch", "A week in a hotel", "Walking and stairs keep the signal; the calendar's step count is the thing to watch."],
      ["Hurts", "Months of a deep cut", "The hormones go down and the bone with them, before anyone notices. The range on Goal is the guard."],
    ]),
    "What bone does in anyone. No bone density reading, no condition named, no supplement beyond the Micros pages' foods and vitamin D in winter, which EFSA itself names. For anything about bone health: your doctor.",
    CASE("Your case: this month", "Read from the Micros pages, your training week and the days away.", [
      ["1", "Before: the check-in", "Calcium 950 mg a day, your day from EFSA. Vitamin D 15 µg. Strength Monday and Thursday."],
      ["2", "The path here", "Calcium on the 7-day average: 700 mg, the dairy is in breakfast only. Vitamin D: foods bring 5 µg; it is October."],
      ["3", "Now", "Two strength days kept. Calcium short by a portion a day."],
      ["4", "The path on", TAPS([["One more calcium portion a day", "Skyr, sardines, tofu set with calcium: the Micros page's list"], ["Vitamin D in the dark months", "EFSA's own note on the Micros page; your doctor for a dose"]])],
      ["5", "The goal: the check-in", "Calcium in your day, both strength days, weight inside the range."],
    ], null),
    ["Which foods have the most calcium?", "Does running count for bone?", "Is cycling enough?"],
    ["New: Bone, read per month. The material, the signal, protein, eating too little, and time. One line each with its paper.", "New: when it helps, when it hurts: a strength day, the meal after, a week in a hotel, months of a deep cut.", "New: your case at the month: calcium short by one portion a day; the Micros page already lists the foods."]);

  // DT185 The gut
  await family("185", "The gut", "day", "The gut starts in the mouth and ends with what lives in the large bowel. It decides how fast a meal arrives, how full it leaves you, and it makes a good part of the body's serotonin.",
    `<section style="${CK};${mark}"><b>What it is, what moves it</b>
    ${line("The mouth", "Digestion starts here: chewing, and the first enzyme for starch. Taste adapts in about two weeks: less salt or sugar tastes right after that.", "Bertino, Beauchamp and Engelman 1982, American Journal of Clinical Nutrition")}
    ${line("The oral bacteria", "They turn the nitrate in leafy greens and beetroot into nitric oxide, which widens the vessels. A strong antibacterial mouthwash kills them, and that effect goes with it.", "Bryan et al. 2012, Free Radical Biology and Medicine")}
    ${line("How fast a meal arrives", "Fat, protein and fibre slow the stomach; a liquid meal is gone in an hour. The Fi letter on the Plate is this.", "Ludwig 2002, JAMA")}
    ${line("The microbiome", "Fed by fibre and by variety: people eating 30 or more plants a week had a richer one than people eating 10. Made poorer by a week of the same three foods, and by antibiotics.", "McDonald et al. 2018, mSystems, the American Gut Project")}
    ${line("What it makes", "Short-chain fatty acids from fibre, which feed the gut wall and reach the brain; and a large share of the body's serotonin, which the brain family reads.", "Valdes et al. 2018, BMJ, the gut microbiota review")}
    ${line("The fullness messengers", "The gut answers a meal with its own hormones, GLP-1 and PYY among them; protein and fibre raise them most. The hormone is named here because everyone has heard of it; the drugs are a doctor's subject.", "Batterham et al. 2006, Cell Metabolism; Gibbons et al. 2013")}
    </section>`,
    WHEN([
      ["Helps", "The first week of more fibre", "Add it over a week, with water. The first days bloat; the second week does not."],
      ["Helps", "A plate with variety", "Five plants on a plate feed more than one. The Plate's ideas can lean that way."],
      ["Watch", "A bloated evening", "Usually the meal, not the gut: too fast, too big, too late, or fizzy. The next day's plan is the fix."],
      ["Watch", "A trip with new food", "New water, new bread, new bacteria. Fibre you know, and time."],
      ["Hurts", "The week after antibiotics", "The microbiome is thin; fibre and fermented foods bring it back faster. Nothing else is sold here."],
    ]),
    "What the gut does in anyone. No stool test, no microbiome test, no probiotic named, no condition: with a gut that keeps hurting, your doctor.",
    CASE("Your case: this week", "Read from your plates: the Fi letter, and the plants on them.", [
      ["1", "Before: your usual", "Fibre 25 g a day, your day. Plants: about 15 different a week."],
      ["2", "The path here", "Fibre on the 7-day average: 18 g. The same five plants most days: rice, spinach, apple, oats, tomato."],
      ["3", "Now", "Fi low on four of seven days. Fewer plants than your range needs."],
      ["4", "The path on", TAPS([["Beans or lentils in one meal a day", "The Plate's Fi letter into the range"], ["Ten different plants this week", "A small target for the shopping list"]])],
      ["5", "The goal: the week", "Fi in the range every day; 20 plants a week."],
    ], "Your trend: 18 g of fibre, the same five plants. Your goal needs 25 g and variety. The gap is one legume meal a day."),
    ["Why am I bloated tonight?", "What counts as a plant?", "Does mouthwash matter?"],
    ["New: The gut, read per day. From the mouth to the microbiome: chewing and taste, the oral bacteria and nitrate, how fast a meal arrives, fibre and variety, what the gut makes, the fullness messengers.", "New: when it helps, when it hurts: the first week of more fibre, variety, a bloated evening, a trip, the week after antibiotics.", "New: your case at the week: fibre at 18 g and the same five plants. The gap is one legume meal a day and ten plants on the list."]);

  // DT186 The liver
  await family("186", "The liver", "day", "The liver keeps blood glucose steady, holds the small glycogen store, makes ketones when carbs are low, and clears alcohol. It does the body's chemistry between meals.",
    `<section style="${CK};${mark}"><b>What it is, what moves it</b>
    ${line("Between meals and overnight", "It lets out glucose from its store and makes new glucose from protein, so the brain never runs short. Breakfast refills it.", "Nilsson and Hultman 1973; Jensen et al. 2011")}
    ${line("Ketones", "When carbs are low for a day or more, it turns fat into ketones for the brain. Normal in a fast or a low-carb day.", "Cahill 2006, Annual Review of Nutrition")}
    ${line("Alcohol", "It clears about one standard drink an hour, and while it does, fat burning stops and the second half of the night's sleep breaks. The app counts a drink as energy, 7 kcal a gram.", "Ebrahim et al. 2013; Siler et al. 1999, American Journal of Clinical Nutrition")}
    ${line("Fructose", "Fruit sugar is handled by the liver; in fruit, with its fibre and water, the amount is small. In drinks, it is not.", "Tappy and Lê 2010, Physiological Reviews")}
    ${line("Fat in the liver", "Energy over the day's total, for a long time, is stored here too, in anyone. Losing weight takes it out again.", "Vilar-Gomez et al. 2015, Gastroenterology")}
    </section>`,
    WHEN([
      ["Helps", "Breakfast after a short night", "The store is low; a meal with protein and slow carbs refills it and steadies the morning."],
      ["Helps", "Fruit, whole", "Fibre and water keep the fructose small. Two or three a day is the Carbs page's range."],
      ["Watch", "A low-carb day", "Ketones by evening; normal. The day's total still decides."],
      ["Watch", "A drink with dinner", "Counted as energy; the sleep page says the rest. Water with it."],
      ["Hurts", "Sweet drinks", "The fructose arrives all at once with nothing to slow it. The one thing the Carbs page says to swap."],
    ]),
    "What the liver does in anyone. No liver value, no condition, no detox, no cleanse. For anything about liver health: your doctor.",
    CASE("Your case: today", "Read from your plates, your drinks and your sleep habit.", [
      ["1", "Before: your usual", "Breakfast at 06:30. Alcohol occasionally, from Lifestyle. Two fruit a day."],
      ["2", "The path here", "Two drinks on Thursday, counted. A short night after it."],
      ["3", "Now", "Friday: the store is low from the night; breakfast is the fix."],
      ["4", "The path on", TAPS([["Breakfast with protein and slow carbs", "On the Plate"], ["Water with tonight's dinner", "A line on Today"]])],
      ["5", "The goal: the day", "The day inside the range; the night at the usual time."],
    ], null),
    ["Is fruit sugar different?", "What does one drink do?", "Do I need a detox?"],
    ["New: The liver, read per day. Between meals and overnight, ketones, alcohol, fructose, fat in the liver. One line each with its paper.", "New: when it helps, when it hurts: breakfast after a short night, whole fruit, a low-carb day, a drink with dinner, sweet drinks.", "New: your case at the day: two drinks on Thursday, a short night, Friday's breakfast as the fix. No value, no detox."]);

  // DT187 The brain
  await family("187", "The brain", "day", "The brain's messengers decide the part of eating the numbers never show: wanting, mood, stress, and the feeling after a session. Food, sleep and training move them, in everyone.",
    `<section style="${CK};${mark}"><b>What it is, what moves it</b>
    ${line("Dopamine: wanting, not liking", "It rises before the reward, on the cue: the open fridge, the smell, the ad. Sweet, salty and fat together push it hardest, and a short night makes the push stronger. It is also what makes a habit stick: the tick on Today is a small dose.", "Berridge and Robinson 2016, American Psychologist; Greer, Goldstein and Walker 2013, Nature Communications")}
    ${line("Serotonin: mood, fullness, sleep", "Most of it is made in the gut. A carb meal lets more tryptophan into the brain, which is why a carb dinner calms. Melatonin is made from it at night.", "Wurtman and Wurtman 1995, Obesity Research")}
    ${line("Adrenaline and cortisol: the stress pair", "Right in the morning and in a hard session; wrong at 23:00. Stress eating is a mechanism, not a weakness: the pair raises the wanting for dense food.", "Adam and Epel 2007, Physiology and Behavior")}
    ${line("Endorphins: the feeling after", "A walk or a session releases them; it is the reason training sits on Plan as a row like a meal.", "Boecker et al. 2008, Cerebral Cortex")}
    ${line("What the claims get wrong", "Sugar is not a drug, and cravings fade when the cue goes, not when the will grows. Moving the cue is the whole trick.", "Benton 2010, Clinical Nutrition")}
    </section>`,
    WHEN([
      ["Helps", "The first weeks of a plan", "Every tick is a small dose. Plan small, tick often; the habit comes from the ticks, not the size."],
      ["Helps", "A walk after lunch", "Endorphins and a steadier afternoon. Fifteen minutes is enough to notice."],
      ["Helps", "A carb dinner on a hard day", "Serotonin and the slide into sleep. Protein with it keeps you full."],
      ["Watch", "A craving at 22:00", "Dopamine on a cue, often after a short night. The planned snack at 16:00 and dinner at 20:00 take the cue away; so does the fridge being boring."],
      ["Watch", "The third week of a plan", "The new wears off here. Change one thing on the plate, keep the ticks."],
      ["Hurts", "A stressful day with a skipped lunch", "The pair plus hunger is the evening that goes wrong. Lunch is the fix, not the evening."],
    ]),
    "The strictest line in Explorer. The page says mood, cravings, habit and sleep; never depression, anxiety, ADHD or any medication; nothing on it reads how you feel. When a low mood stays, the line is the same as for sleep: a doctor or a therapist.",
    CASE("Your case: this week", "Read from your plates, the ticks on Today and your sleep habit.", [
      ["1", "Before: your usual", "Lunch at 13:15, dinner at 20:00. Ticks on Today: five of seven days last month."],
      ["2", "The path here", "Two lunches skipped this week. A snack at 22:30 on both those days."],
      ["3", "Now", "The pattern is a cue, not a weakness: no lunch, a long afternoon, a sweet evening."],
      ["4", "The path on", TAPS([["Lunch planned on busy days, even a small one", "On Plan; the calendar's busy times already ask"], ["A walk after lunch, fifteen minutes", "On Plan as a row"]])],
      ["5", "The goal: the week", "Lunch every day; no snack after dinner; the ticks."],
    ], "Your trend: two skipped lunches, two late snacks. Your goal needs the ticks. The gap is lunch, not the evening."),
    ["Why do I crave sweets at night?", "Does a walk really help my mood?", "How do I make the plan stick?"],
    ["New: The brain, read per day. Dopamine as wanting, serotonin as mood and fullness, the stress pair, endorphins, and what the claims get wrong. One line each with its paper.", "New: when it helps, when it hurts: the first weeks of a plan, a walk after lunch, a carb dinner on a hard day, a craving at 22:00, the third week, a stressful day with a skipped lunch.", "New: your case at the week: two skipped lunches, two late snacks. The gap is lunch, not the evening. The strictest wellness line in Explorer."]);
  await b.close(); server.kill();
})();
