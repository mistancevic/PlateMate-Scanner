// DT149 (UX4, Tester 3, Coach Milan 29 October 00:10 to 00:14): the past is recording what I ate, the future is planning what I
// will eat, the moment is what I eat
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = [];
const F = (re) => seed.foods.find((f) => re.test(f.name));
const bowl = { id: "m-bowl", title: "Skyr bowl", items: [{ id: "b1", food: F(/^Skyr/), grams: 250, locked: true }, { id: "b2", food: F(/^Oats/), grams: 40, locked: true }, { id: "b3", food: F(/^Banana/), grams: 100, locked: true }], portion: 390, savedAt: "2026-10-20T08:00:00Z", steps: ["Stir the skyr smooth.", "Top with the oats and the sliced banana."] };
seed.meals = [bowl];
const k = (m) => { const kc = m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0), pr = m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0); return { kcal: Math.round(kc), protein: Math.round(pr) }; };
const planned = { "2026-10-28": { dinner: { title: "Skyr bowl", source: "mine", mealId: "m-bowl", items: bowl.items, portion: 390, ...k(bowl) } }, "2026-10-30": { breakfast: { title: "Skyr bowl", source: "mine", mealId: "m-bowl", items: bowl.items, portion: 390, ...k(bowl) } } };
const PORT = "3317", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"], env: { ...process.env, LANG: "en_GB.UTF-8" } });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-29T12:10:00"));
  await page.addInitScript(([s, planned]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-planned", JSON.stringify(planned));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("chefmealan-region", "limassol"); localStorage.setItem("seeded", "1"); }, [seed, planned]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.classList.contains("sheet-backdrop")) { el.style.position = "static"; el.style.background = "transparent"; continue; } if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name, full = true) => { await page.waitForTimeout(400); if (full) await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot " + name); };
  const note = (sel, text, where = "before") => page.evaluate(({ sel, text, NOTE, where }) => { const x = document.querySelector(sel); if (!x) return console.log("no " + sel); const d = document.createElement("div"); d.className = "dt-note"; d.style.cssText = NOTE; d.textContent = text; where === "before" ? x.before(d) : x.prepend(d); }, { sel, text, NOTE, where });
  const markEl = (sel) => page.evaluate(({ sel, mark }) => { const x = document.querySelector(sel); if (x) x.style.cssText += ";" + mark; }, { sel, mark });
  const toPlan = async () => { await page.goto(U + "/"); await page.waitForTimeout(800); await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(900); };
  const day = async (label) => { await page.getByRole("tab").filter({ hasText: label }).first().click(); await page.waitForTimeout(700); };
  // a, now: a recipe planned for tomorrow, opened from Plan: Make it leads
  await toPlan(); await day(/30/);
  await page.locator(".plan-slot-set").first().click(); await page.waitForTimeout(900);
  await page.evaluate((m) => { for (const b of document.querySelectorAll("button")) if (/^Make it$/.test(b.textContent.trim())) b.style.cssText += ";" + m; }, mark);
  await note("main h1, main h2, .rq-title, main", "Now (0.2.129): tap tomorrow's planned breakfast on Plan and its recipe opens. The main button is Make it: the recipe goes on the Plate to cook now, then the steps and How was it? with its rating. Nothing says it is a plan for Friday.", "prepend");
  await shot("r149a");
  // a2, now: tomorrow's dinner, planned on the Plate, after Fit
  await toPlan(); await day(/30/);
  await page.getByRole("button", { name: /^Dinner at .*pick a meal/ }).click(); await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Create a new meal on the Plate/ }).click(); await page.waitForTimeout(1200);
  for (const n of ["Chicken breast, cooked", "Rice, cooked"]) { await page.getByLabel("Search all my foods").fill(n.split(",")[0]); await page.waitForTimeout(500); await page.locator(".row-food").filter({ hasText: n }).first().getByRole("button", { name: "Add" }).click(); await page.waitForTimeout(500); }
  await page.getByLabel("Search all my foods").fill(""); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Fit to my target/ }).click(); await page.waitForTimeout(1500);
  await markEl(".phase-bar"); await page.evaluate((m) => { for (const b of document.querySelectorAll("button")) if (/^Make it$|Put it in/.test(b.textContent.trim())) b.style.cssText += ";" + m; }, mark);
  await note(".phase-bar", "Now: a new meal for tomorrow's dinner, from Plan. Put it in Friday's dinner is there, but the bar says Craft, Make, Feedback, the line under the name says or make them as they are, and Fit again is the main button.");
  await shot("r149a2");
  // b, now: a past day records nothing
  await toPlan(); await day(/28/);
  await markEl(".plan-past");
  await note(".plan-past", "Now: yesterday holds a planned Skyr bowl for dinner, and nothing was logged. The day says so, and offers no way to record what you ate.");
  await shot("r149b");
  // c, new: planning, the future
  await toPlan(); await day(/30/);
  await page.getByRole("button", { name: /^Dinner at .*pick a meal/ }).click(); await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Create a new meal on the Plate/ }).click(); await page.waitForTimeout(1200);
  for (const n of ["Chicken breast, cooked", "Rice, cooked"]) { await page.getByLabel("Search all my foods").fill(n.split(",")[0]); await page.waitForTimeout(500); await page.locator(".row-food").filter({ hasText: n }).first().getByRole("button", { name: "Add" }).click(); await page.waitForTimeout(500); }
  await page.getByLabel("Search all my foods").fill(""); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Fit to my target/ }).click(); await page.waitForTimeout(1500);
  await page.evaluate((m) => {
    const bar = document.querySelector(".phase-bar"); if (bar) { bar.innerHTML = '<span class="on" style="flex:1"><i></i>Planning Friday\'s dinner</span>'; bar.style.cssText += ";" + m; }
    const put = [...document.querySelectorAll("button")].find((b) => /^Put it in/.test(b.textContent.trim()));
    const fit = [...document.querySelectorAll("button")].find((b) => /^Fit again|^Fit to my target/.test(b.textContent.trim()));
    if (put && fit) { const row = put.parentElement; const nb = document.createElement("button"); nb.className = "pill pill-primary pill-wide"; nb.textContent = "Put it in Friday's dinner"; nb.style.cssText = "width:100%;margin:8px 0;" + m; row.before(nb); put.remove(); fit.classList.remove("pill-primary"); fit.style.width = "100%";
      const s = document.createElement("small"); s.className = "muted"; s.style.cssText = "display:block;text-align:center;margin:6px 0"; s.textContent = "Planned, not eaten. On Friday it comes up on Today: tap I ate it then, and rate it if you like."; nb.after(s); }
    for (const n of document.querySelectorAll("p, small")) if (/or make them as they are/.test(n.textContent)) n.textContent = "Planning Friday's dinner. Add your foods, fit them to your target, then put it in the plan.";
  }, mark);
  await note(".phase-bar", "New: a day after today is planning. No Make and no Feedback: the bar says Planning Friday's dinner, and the one main button is Put it in Friday's dinner, before Fit and after it. Nothing asks for a rating; that comes on Friday, after you eat it.");
  await shot("r149c");
  // d, new: recording, the past, on Plan
  await toPlan(); await day(/28/);
  await page.evaluate(({ mark }) => {
    const card = document.querySelector(".plan-past"); if (!card) return;
    const none = card.querySelector(".past-none"); if (none) none.remove();
    const row = (time, name, body) => `<div class="past-plate" style="flex-wrap:wrap;gap:6px"><span><small>${name}, ${time}</small><b style="display:block">${body}</b></span>`;
    const box = document.createElement("div"); box.style.cssText = "display:flex;flex-direction:column;gap:10px;margin-top:8px;padding:8px;" + mark;
    box.innerHTML = `<small class="setting-name">Record what you ate</small>
      <div class="past-plate"><span><small>Breakfast, 07:30</small><b style="display:block">Not recorded</b></span><button class="pill pill-small">Record it</button></div>
      <div class="past-plate"><span><small>Lunch, 13:45</small><b style="display:block">Not recorded</b></span><button class="pill pill-small">Record it</button></div>
      <div class="past-plate" style="flex-wrap:wrap"><span><small>Dinner, 20:00 · planned</small><b style="display:block">Skyr bowl</b></span><div class="button-row" style="width:100%;margin-top:6px"><button class="pill pill-small pill-primary">I ate it</button><button class="pill pill-small">I ate something else</button><button class="pill pill-small">I skipped it</button></div></div>
      <small class="muted">A day before today is a record: what you ate counts at its meal's time. Nothing to make, no rating asked; Rate it waits on the meal if you want it.</small>`;
    card.appendChild(box);
  }, { mark });
  await note(".plan-past", "New: a day before today is recording. Each meal of the day can be recorded; a planned one is one tap, I ate it, at its time. I ate something else and Record it open the Plate to record.");
  await shot("r149d");
  // e, new: recording on the Plate
  await toPlan(); await day(/30/);
  await page.getByRole("button", { name: /^Dinner at .*pick a meal/ }).click(); await page.waitForTimeout(600);
  await page.getByRole("button", { name: /Create a new meal on the Plate/ }).click(); await page.waitForTimeout(1200);
  for (const n of ["Chicken breast, cooked", "Rice, cooked"]) { await page.getByLabel("Search all my foods").fill(n.split(",")[0]); await page.waitForTimeout(500); await page.locator(".row-food").filter({ hasText: n }).first().getByRole("button", { name: "Add" }).click(); await page.waitForTimeout(500); }
  await page.getByLabel("Search all my foods").fill(""); await page.waitForTimeout(300);
  await page.evaluate((m) => {
    const bar = document.querySelector(".phase-bar"); if (bar) { bar.innerHTML = '<span class="on" style="flex:1"><i></i>Recording Wednesday\'s dinner</span>'; bar.style.cssText += ";" + m; }
    const line = document.querySelector(".plan-line span"); if (line) line.textContent = "Wednesday's dinner, 20:00 · Eaten";
    const keep = [...document.querySelectorAll("button")].find((b) => /^Keep it as it is|^Put it in/.test(b.textContent.trim()));
    const fit = [...document.querySelectorAll("button")].find((b) => /Fit to my target/.test(b.textContent.trim()));
    if (keep) { const row = keep.parentElement; const nb = document.createElement("button"); nb.className = "pill pill-primary pill-wide"; nb.textContent = "Put it in Wednesday's dinner, eaten"; nb.style.cssText = "width:100%;margin:8px 0;" + m; row.before(nb); row.remove();
      const s = document.createElement("small"); s.className = "muted"; s.style.cssText = "display:block;text-align:center;margin:6px 0"; s.textContent = "Counted on Wednesday at 20:00. Nothing to fit, make or rate: it is what you ate."; nb.after(s); }
    for (const n of document.querySelectorAll("p, small")) if (/or make them as they are/.test(n.textContent)) n.textContent = "Recording Wednesday's dinner. Add what you ate, at the amounts you ate.";
    for (const n of document.querySelectorAll("small, p")) if (/Fit moves one food|adds what it needs/.test(n.textContent)) n.remove();
  }, mark);
  await note(".phase-bar", "New: Record it or I ate something else opens the Plate for that meal. The amounts are what you ate, so there is no Fit; one button records it at the meal's time.");
  await shot("r149e");
  // f, new: the Plate on its own: What is it for? Another day
  await page.goto(U + "/"); await page.waitForTimeout(800); await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(900);
  await page.locator(".plan-line").click(); await page.waitForTimeout(400);
  await page.evaluate((m) => {
    const row = document.querySelector(".for-row"); if (!row) return;
    const day = document.createElement("div"); day.style.cssText = "margin:8px 0;padding:6px;" + m;
    day.innerHTML = `<p class="label">Which day?</p><div class="moments"><button class="choice">Yesterday</button><button class="choice on">Today</button><button class="choice">Tomorrow</button><button class="choice">Another day ›</button></div><small class="small" style="display:block;margin-top:4px">Today is what you eat now. A day before records what you ate; a day after plans what you will eat.</small>`;
    row.previousElementSibling ? row.previousElementSibling.before(day) : row.before(day);
  }, mark);
  await note(".plan-line", "New: on the Plate itself, Which day? sits above What is it for?. Today stays the moment. Yesterday or another day before records; tomorrow or later plans.");
  await shot("r149f");
  // g, new: a recipe planned for a later day says Change it on the Plate; Make it lives on its day
  await toPlan(); await day(/30/);
  await page.locator(".plan-slot-set").first().click(); await page.waitForTimeout(900);
  await page.evaluate((m) => { for (const b of document.querySelectorAll("button")) if (/^Make it$/.test(b.textContent.trim())) { b.textContent = "Change it on the Plate"; b.classList.remove("pill-primary"); b.style.cssText += ";" + m; const u = b.nextElementSibling; if (u && u.tagName === "SMALL") u.textContent = "Planned for Friday's breakfast. Change the foods or amounts for that day; the recipe stays as it is. Make it and I ate it come on Friday, on Today."; } }, mark);
  await note("main", "New: a recipe opened from a later day on Plan is a plan. Change it on the Plate opens it in planning (no Make, no rating). Opened from yesterday it says I ate it, which records it at the meal's time.", "prepend");
  await shot("r149g");
  await b.close(); server.kill();
})();
