// DT180 (Coach Milan 31 October 11:16 to 11:46): Explorer gets a second part, Situations. The first: a bad night's sleep.
// Theory first (what it does to the day, what causes it, one line each with its source), then Your case as Milan's five
// parts at the day horizon: before, the path here, now, the path on, the goal; the trend against the trajectory.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.24, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3384", U = `http://127.0.0.1:${PORT}`;
const LIFE = { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, wake: "early", bed: "mid", where: ["Cook at home"], diet: "Everything", alcohol: "Occasionally" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-11-05T07:40:00"));
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
  const PARTS = (on) => `<div class="moments ex-parts" role="radiogroup" aria-label="Which part" style="margin-bottom:8px"><button class="choice ${on === "n" ? "on" : ""}" style="height:44px">Nutrients</button><button class="choice ${on === "s" ? "on" : ""}" style="height:44px;${mark}">Situations</button></div>`;
  const FAMS = `<div class="moments ex-chips ex-families" role="radiogroup"><button class="choice on" style="height:44px">Protein</button><button class="choice" style="height:44px">Fats</button><button class="choice" style="height:44px">Carbs</button><button class="choice" style="height:44px">Micros</button><button class="choice" style="height:44px">Foods</button></div>`;
  const row = (name, hint, soon) => `<button class="menu-row" style="${soon ? "opacity:.55" : mark}"><span class="menu-row-text"><b>${name}</b><small>${hint}</small></span><span aria-hidden="true">${soon ? "" : "›"}</span></button>`;
  const HEAD = `<div style="display:flex;align-items:center;gap:8px;margin:4px 0 8px"><button class="link" style="min-height:44px">‹ Situations</button></div><h3 style="margin:0;font-size:20px">A bad night's sleep</h3><small class="muted" style="display:block;line-height:1.5;margin-top:4px">A day situation. What a short night does to the day, what causes it, and your case from what the app already knows. Food, training and timing only. Never a condition: with sleep that stays bad, see your doctor.</small>`;
  const THEORY = `<section style="${CK}"><b>What it does to the day</b>
    ${line("You eat more, about 385 kcal", "After a short night people ate about 385 kcal more the next day, in a review of 11 studies. Mostly as snacks and fat, not as more meals.", "Al Khatib et al. 2017, European Journal of Clinical Nutrition, meta-analysis of partial sleep deprivation")}
    ${line("Sweet and salty foods look better", "The brain's reward answer to high-calorie food is stronger after a sleepless night, and the part that weighs choices is quieter.", "Greer, Goldstein and Walker 2013, Nature Communications")}
    ${line("Training feels harder", "Strength holds up for one night; endurance, reaction and how hard it feels get worse. An easy session or a walk keeps the habit without the cost.", "Fullagar et al. 2015, Sports Medicine, review")}
    <div style="padding:8px 0"><b style="font-size:14px">Your numbers do not change</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">Today's target is today's target. What changes is where the energy sits in the day.</small></div></section>
    <section style="${CK}"><b>What causes it</b>
    ${line("Coffee after 14:00", "Caffeine 6 hours before bed cut sleep by more than an hour, measured in the lab, and people did not notice it.", "Drake et al. 2013, Journal of Clinical Sleep Medicine")}
    ${line("A drink in the evening", "Alcohol brings sleep on faster and breaks the second half of the night.", "Ebrahim et al. 2013, Alcoholism: Clinical and Experimental Research, review")}
    ${line("A late, heavy dinner", "Eating close to bedtime, above all a big meal, goes with poorer sleep.", "Crispim et al. 2011, Journal of Clinical Sleep Medicine")}
    ${line("A hard session late", "A hard workout within an hour of bed delays sleep; earlier in the evening it does not.", "Stutz, Eiholzer and Spengler 2019, Sports Medicine, meta-analysis")}
    <div style="padding:8px 0"><b style="font-size:14px">A loop</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">A short night makes a late snack likely; a late snack makes the next night short. The way out is one evening done at the usual times.</small></div></section>`;
  const PART = (k, title, body, m = "") => `<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);${m}"><span style="flex:none;width:28px;height:28px;border-radius:50%;background:#172742;color:#fff;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center">${k}</span><div style="flex:1;min-width:0"><b style="font-size:14px">${title}</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">${body}</small></div></div>`;
  const TAP = (t, where) => `<button class="pill pill-small" style="min-height:44px;height:auto;padding:8px 12px;line-height:1.3;text-align:left;white-space:normal;width:100%;display:block;box-sizing:border-box"><b>${t}</b><small style="display:block;font-weight:600;font-size:12px">${where}</small></button>`;
  const CASE = `<section style="${CK};${mark}"><b>Your case, today</b><small class="muted" style="display:block;margin:2px 0 6px;line-height:1.45">Read from your settings and your plates. Nothing is changed unless you tap.</small>
    ${PART("1", "Before: your usual", "Bed 22:00 to midnight, up before 6:00. Dinner at 20:00. Coffee at 7:00 and about 15:00, from your plates. Training Thursday at 20:30, hard.")}
    ${PART("2", "The path here: this week", "Dinner at 20:00, then 20:30, then 21:40 last night. A chocolate snack at 22:30 on two evenings. Coffee at 16:30 yesterday.")}
    ${PART("3", "Now: a short night", "You opened this page, so last night was short. Today is a training day: strength, hard, at 17:30.")}
    ${PART("4", "The path on: today", `Three things, each one tap.<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">${TAP("Breakfast and lunch with more protein and fibre", "On the Plate, your numbers unchanged")}${TAP("A planned snack at 16:00", "On Plan, instead of a craving at 22:30")}${TAP("Today's training easy, or a walk", "On Plan, this date only, Keep it stays open")}</div><div style="margin-top:8px">No coffee after 14:00. Dinner at 20:00. Bed at the usual time.</div>`)}
    ${PART("5", "The goal: tonight", "Bed by 23:00, as usual. Your goal, Maintain, and the check-in on 27 November stay as they are.", "border-bottom:0")}
    <div style="margin-top:10px;background:#eef1f6;border-radius:12px;padding:10px 12px"><b style="font-size:14px">Trend against trajectory</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">Your trend: dinner 50 minutes later over the week. Carried on, Friday's dinner is at 22:30. Your goal needs bed by 23:00. The gap closes with one change: dinner back at 20:00.</small></div></section>`;
  const CHIPS = `<section style="${CK};${mark}"><b>Ask Chef Mealan</b><small class="muted" style="display:block;margin:2px 0 8px">The round button on this page starts with these.</small><div class="moments"><button class="choice" style="height:44px">Why am I hungrier today?</button><button class="choice" style="height:44px">What do I eat tonight?</button><button class="choice" style="height:44px">Should I train today?</button></div><small class="muted" style="display:block;margin-top:8px;line-height:1.45">Chef Mealan answers from this page and your day: food, training and timing. It never names a condition.</small></section>`;
  const UP = `<section style="${CK};${mark};background:#fff3e0;border-color:#f3d2a6"><b>Third short night this week</b><small style="display:block;font-weight:600;line-height:1.45;margin-top:2px">One night is a day question. Three in a week is a week question: your meal times and your training week. The day page stops here and points up.</small><button class="pill pill-small" style="min-height:44px;margin-top:8px">See the week on Plan ›</button><small class="muted" style="display:block;margin-top:8px;line-height:1.45">The same frame reads the week there: before is Monday as planned, the goal is your training week and your slots.</small></section>`;

  // a, now: the Explorer is nutrients only
  await openEx();
  await page.evaluate((mark) => { document.querySelector(".ex-families").style.cssText += ";" + mark; }, mark);
  await note("Now, 0.3.24: Explorer is five families of nutrients and foods. A page starts from a nutrient. There is no page that starts from a situation you are in.");
  await page.evaluate(() => { const ex = document.querySelector(".explorer"); let n = ex.querySelector(".ex-families").nextElementSibling; let keep = 2; while (n) { const x = n.nextElementSibling; if (keep-- <= 0) n.remove(); n = x; } });
  await shot("r180a");
  // b, new: a second part, Situations
  await openEx();
  await draw(`<p class="small muted page-why">A situation page starts from where you are, not from a nutrient. Theory first: what it does to the day and what causes it, one line each with its source. Then your case, from what the app already knows.</p>
    <div class="menu-list">${row("A bad night's sleep", "You eat more, sweet looks better, training feels harder. What causes it, and your day.", false)}${row("A late evening after work", "Later", true)}${row("A party or a dinner out", "Later", true)}${row("A day away, no kitchen", "Later", true)}${row("A day off training", "Later", true)}</div>
    <small class="muted" style="display:block;margin-top:10px;line-height:1.5">Each situation reads one horizon: the day, the week, or the month. A bad night is a day. A holiday is a week. The goal check-in is the month, and lives on Goal.</small>`, PARTS("s"));
  await note("New: Explorer has two parts, Nutrients and Situations. The first situation is a bad night's sleep. The others are named so the shape is clear; each gets its own board.");
  await shot("r180b");
  // c, new: the page, theory first
  await openEx();
  await draw(HEAD + THEORY, PARTS("s"));
  await page.evaluate((mark) => { const s = document.querySelectorAll(".explorer section"); s[0].style.cssText += ";" + mark; s[1].style.cssText += ";" + mark; }, mark);
  await note("New: the page, theory first. What a short night does to the day, and what causes it. One line each, each with its paper, as the micros pages cite the EU values. Your numbers do not change.");
  await shot("r180c");
  // d, new: your case, the five parts
  await openEx();
  await draw(HEAD + CASE, PARTS("s"));
  await note("New: Your case, read from your settings and your plates. Five parts: before, the path here, now, the path on, the goal. The trend carried on against what the goal needs, and the one change that closes the gap. Nothing changes unless you tap.");
  await shot("r180d");
  // e, new: the chat
  await openEx();
  await draw(HEAD + CHIPS, PARTS("s"));
  await note("New: the round chef button on this page starts with three questions the page raises. Chef Mealan answers from the page's facts and your day.");
  await shot("r180e");
  // f, new: pointing up a level
  await openEx();
  await draw(HEAD + UP, PARTS("s"));
  await note("New: a day page knows its horizon. The third short night in a week is a week question, so the page says so and points up to Plan, where the same five parts read the week.");
  await shot("r180f");
  await b.close(); server.kill();
})();
