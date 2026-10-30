// DT167 (Coach Milan 30 October 08:47 to 09:03): Your summary at the end of Me, what each answer does, Plan and Plate next;
// a settings map behind it; the summary as a readable document the person can share with the coach, part by part.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.8, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3361", U = `http://127.0.0.1:${PORT}`;
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
  const note = (t) => page.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(".menu-title").before(d); window.scrollTo(0, 0); }, { t, NOTE });
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
    <div class="button-row" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-primary" style="${mark}">Share with Coach Milan</button><button class="pill">Save as PDF</button></div>
    <small class="muted" style="display:block;margin-top:8px">Your summary changes when your answers change. A copy you share is dated and stays as it was.</small>`;
  // a, now: the Me steps end on Coach, with nothing after it
  await toMe();
  await note("Now, 0.3.8: Me is six steps, Profile to My coach. The last step ends there: no summary, no next step. What you told the app is spread over six pages.");
  await page.evaluate((mark) => { const r = [...document.querySelectorAll(".menu-row")].find((x) => /My coach/.test(x.textContent)); if (r) r.style.cssText += ";" + mark; }, mark);
  await shot("r167a");
  // b, new: a seventh row and the last step's Next
  await toMe();
  await page.evaluate((mark) => { const r = [...document.querySelectorAll(".menu-row")].find((x) => /My coach/.test(x.textContent)); r.insertAdjacentHTML("afterend", `<button class="menu-row" style="${mark}"><span class="menu-row-text"><b>Your summary</b><small>Everything you told Chef Mealan, and what it does. Share it with your coach.</small></span><span aria-hidden="true">›</span></button>`); }, mark);
  await note("New: Your summary, the last row of Me. Each step's Next leads there in the end: Profile, Goal, Lifestyle, Training week, Where I shop and cook, My coach, Your summary.");
  await shot("r167b");
  await toMe(); await draw("Your summary", SUM_TOP + SUM_BOTTOM.replace(/<div class="menu-list"[\s\S]*$/, ""));
  await note("New: Your summary. Every answer once, what it does, and whether Chef Mealan reads it. Built from one settings map in the code: a setting without a line there fails a test, so nothing is forgotten.");
  await shot("r167c");
  await toMe(); await draw("Your summary", SUM_BOTTOM);
  await note("New: the end of the summary. Two next steps: Plan your week, or Craft your first meal on Plate for the next meal by the clock. Then Share with your coach, or save it as a PDF. Two gaps closed: Where you eat and Work travel now reach Chef Mealan.");
  await shot("r167d");
  // e, the share sheet: part by part, health data off until you switch it on
  const tog = (t, why, on, hd, fixed) => `<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line)"><div style="flex:1"><b style="display:block">${t}${hd ? " " + HD : ""}</b><small style="display:block;color:#3d4a63;font-weight:600">${why}</small></div><button class="choice ${on ? "on" : ""}" ${fixed ? 'disabled style="opacity:.7"' : ""}>${fixed ? "Sees it" : on ? "On" : "Off"}</button></div>`;
  await toMe(); await draw("Share with Coach Milan", `<p class="small muted page-why">Pick what goes. Coach Milan gets a dated copy, readable on its own, and can save it as a PDF. Take it back any time: the copy is deleted.</p>
    <section class="card">${tog("Goal and numbers", "Your coach already sees these.", true)}${tog("Your day", "Work, wake-up and bedtime, meal times.", true)}${tog("How you eat", "Meals, where you eat, taste.", true)}${tog("What you eat", "Your diet, and your words if you picked Other. A diet can say something about your beliefs or health: off until you switch it on.", false, false)}${tog("Alcohol", "How often you drink. Off until you switch it on.", false)}${tog("Training week", "Your usual week.", true)}${tog("Where you shop and cook", "Places, kitchens, tools.", true)}</section>
    <section class="card" style="${mark}">${tog("Health questions", "Which you ticked, and when. Your coach already sees this, never your words.", true, true, true)}${tog("Allergies and intolerances", "Share them if you want your coach to plan around them.", false, true)}${tog("Your body data", "Height, weight, body fat, birth year. Until now your coach never sees it, only the numbers it gives. Switching it on is your consent, dated, and you can take it back.", false, true)}</section>
    <div class="button-row" style="display:flex;gap:8px"><button class="pill pill-primary">Send to Coach Milan</button><button class="pill">Cancel</button></div>
    <small class="muted" style="display:block;margin-top:8px">Sent copies: none yet. Leaving your coach or deleting your account deletes every copy.</small>`);
  await note("New: share part by part. Health data is off until you switch it on: your body data, allergies. So are what you eat and alcohol. The health questions stay as today: your coach sees which and when, never your words.");
  await shot("r167e");
  // f, what the coach reads
  await toMe(); await draw("Clients · Tester 1", `<p class="small muted page-why">Profile summary, sent 30 October at 09:40. A copy: it doesn't change when Tester 1 changes an answer. A new copy comes when Tester 1 sends one.</p>
    ${SUM_TOP.replace(/<p class="small muted page-why">[\s\S]*?<\/p>/, "").replace(/<div class="seg-head"><b>You<\/b>[\s\S]*?<\/section>/, "")}
    <section class="card" style="${mark}"><b>Not shared</b><small>Body data, allergies, what you eat, alcohol. Tester 1 kept these to themselves.</small></section>
    <div class="button-row" style="display:flex;gap:8px"><button class="pill pill-primary">Save as PDF</button><button class="pill">Back to Tester 1's week</button></div>`);
  await note("New, on the coach's side: the summary as one readable page under the client, dated, with what wasn't shared said plainly. Save as PDF for the coach's own notes.");
  await shot("r167f");
  await b.close(); server.kill();
})();
