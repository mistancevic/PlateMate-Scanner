// DT175 (Coach Milan 30 October 17:36, "draw next DT"): ask Chef while cooking, and say what you have on the Plate. One big step at a time, read aloud,
// steered by voice or by big buttons; timers from the step; how much of a food, from the recipe; the screen stays on.
// Free to run: the browser's own speech recognition and the phone's own voice. No AI in DT174.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.16, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const PORT = "3376", U = `http://127.0.0.1:${PORT}`;
const food = (id, name, calories, protein, carbs, fats, fiber, icon) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon });
const items = [[160, food("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0, "🍗")], [80, food("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3, "🍚")], [120, food("s", "Spinach, fresh", 23, 2.9, 3.6, 0.4, 2.2, "🥬")], [8, food("o", "Olive oil", 884, 0, 0, 100, 0, "🫒")], [6, food("g", "Garlic", 149, 6.4, 33, 0.5, 2.1, "🧄")]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = [
  "Rinse [[i:r|rice]] and bring it to the boil in 200 ml water. Cover and cook on low heat for 12 minutes.",
  "Cut [[i:c|chicken]] into strips. Season with salt and pepper.",
  "Slice [[i:g|garlic]] thin.",
  "Heat [[i:o|olive oil]] in a pan on medium high heat. Fry the chicken 6 minutes, turning once, until no pink is left inside.",
  "Add [[i:s|spinach]] and the garlic. Stir 2 minutes, until the spinach wilts.",
  "Put the rice in a bowl and the chicken and spinach on top.",
];
seed.items = []; seed.feedback = [];
seed.meals = [{ id: "m-bowl", title: "Chicken rice bowl with spinach", items, portion: 374, steps: STEPS, stepsFor: items.map((i) => i.food.name), savedAt: "2026-10-28T10:00:00Z" }];
const amt = (t) => t.replace(/\[\[i:(\w)\|[^\]]*\]\]/g, (_, id) => { const i = items.find((x) => x.id === id); return `<b class="st-amt">${i.grams} g ${i.food.name.split(",")[0].toLowerCase()}</b>`; });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-30T18:40:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-30T08:00:00Z", source: "profile" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0 14px;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const toRecipe = async () => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500); await page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).click(); await page.waitForTimeout(600); };
  const note = (t, sel = ".rq") => page.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).prepend(d); }, { t, NOTE, sel });
  // keep only the steps card (and what is after it) under the recipe's name
  const stepsOnly = () => page.evaluate(() => { const rq = document.querySelector(".rq"), st = rq.querySelector(".rq-steps"); for (const el of [...rq.children]) { if (el === st) break; if (!el.classList.contains("rq-name") && !el.matches("h1,h2,.rq-label")) el.remove(); } });
  // the cook screen: drawn into the recipe page, in the app's own classes
  const CK = "background:var(--card,#fff);border-radius:16px;padding:14px;box-shadow:0 1px 0 var(--line)";
  const cook = ({ k, extra = "", top = "", listen = true, heard = "" }) => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><button class="pill pill-small">✕ Close</button><b style="flex:1;text-align:center;font-size:14px">Chicken rice bowl with spinach</b><small style="font-weight:800;color:var(--muted)">${k + 1} of ${STEPS.length}</small></div>
    <div style="display:flex;gap:4px;margin-bottom:12px">${STEPS.map((_, j) => `<span style="flex:1;height:5px;border-radius:3px;background:${j <= k ? "var(--brand,#2e7be8)" : "var(--line,#dde3ee)"}"></span>`).join("")}</div>
    ${top}
    <section style="${CK};min-height:250px;display:flex;flex-direction:column;justify-content:center">
      <small style="font-weight:800;color:var(--muted);letter-spacing:.04em">STEP ${k + 1}</small>
      <div style="font-size:25px;line-height:1.38;font-weight:700;margin-top:6px">${amt(STEPS[k])}</div>
      ${extra}
    </section>
    <div style="display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:8px;margin-top:12px"><button class="pill" style="height:58px;font-size:17px">‹ Back</button><button class="pill" style="height:58px;font-size:17px">↻ Repeat</button><button class="pill pill-primary" style="height:58px;font-size:18px">${k === STEPS.length - 1 ? "Done ✓" : "Next ›"}</button></div>
    ${heard}
    <div style="margin-top:12px;display:flex;align-items:center;gap:10px;${CK};padding:10px 12px"><span style="width:12px;height:12px;border-radius:50%;background:${listen ? "#13916a" : "#8a96ad"};flex:none"></span><small style="flex:1;font-weight:700;line-height:1.4">${listen ? "Listening. Say <b>next</b>, <b>back</b>, <b>repeat</b>, <b>how much rice</b>, <b>timer 5 minutes</b>, <b>what's left</b>, <b>stop</b>." : "Voice off. The buttons work the same."}</small><button class="pill pill-small">${listen ? "Voice off" : "Voice on"}</button></div>
    <small class="muted" style="display:block;margin-top:8px">The screen stays on while you cook. Each step is read aloud${listen ? "" : " when voice is on"}.</small>
    <details style="margin-top:12px;${CK}"><summary style="font-weight:800">What's in it</summary></details>`;
  const drawCook = (html) => page.evaluate((html) => { document.querySelector(".rq").innerHTML = html; for (const el of document.querySelectorAll("nav, header")) el.remove(); window.scrollTo(0, 0); }, html);
  const toPlate = async () => { await page.goto(U + "/"); await page.waitForTimeout(900); await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(900); };
  const plateCard = `[...document.querySelectorAll(".card")].find((c) => /On the plate/.test(c.textContent))`;
  const notePlate = (t) => page.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(".step-head").before(d); window.scrollTo(0, 0); }, { t, NOTE });
  const ans = (q, a, extra = "") => `<div style="margin-top:12px;${CK};${mark};padding:10px 12px"><small style="display:block;color:var(--muted);font-weight:800">YOU ASKED</small><b>${q}</b><small style="display:block;color:var(--muted);font-weight:800;margin-top:8px">CHEF MEALAN, ABOUT STEP 4</small><b style="font-weight:700">${a}</b>${extra}</div>`;
  const listenAsk = `<div style="margin-top:12px;display:flex;align-items:center;gap:10px;${CK};padding:10px 12px"><span style="width:12px;height:12px;border-radius:50%;background:#13916a;flex:none"></span><small style="flex:1;font-weight:700;line-height:1.4">Listening. Say <b>next</b>, <b>back</b>, <b>repeat</b>, <b>how much</b>, <b>timer</b>. Or ask: start with <b>Chef</b>.</small><button class="pill pill-small">Voice off</button></div>`;
  // a, now: something else said, and cook mode can't help
  await toRecipe();
  await drawCook(cook({ k: 3, heard: `<div style="margin-top:12px;${CK};${mark};padding:10px 12px"><small style="display:block;color:var(--muted);font-weight:800">YOU SAID</small><b>I only have 120 g chicken. What do I change?</b><small style="display:block;color:var(--muted);font-weight:800;margin-top:8px">CHEF MEALAN</small><b style="font-weight:700">I heard you, but that isn't something I can do yet. Say next, back, repeat, how much, timer, what's left or stop.</b></div>` }));
  await note("Now, 0.3.16: cook mode knows seven commands. A question about the cooking gets: that isn't something I can do yet.");
  await shot("r175a");
  // b, new: Chef, ... goes to Chef Mealan, answered aloud
  await toRecipe();
  await drawCook(cook({ k: 3, heard: ans("Chef, I only have 120 g chicken. What do I change?", "Fry it the same way; 5 minutes can be enough for thinner strips, until no pink is left. Your bowl then has about 27 g protein instead of 36. An egg on top brings about 6 g back.", `<small class="muted" style="display:block;margin-top:8px">Read aloud. Nothing on your plate changes.</small>`) }).replace(/<div style="margin-top:12px;display:flex;align-items:center;gap:10px;[\s\S]*?<\/button><\/div>/, listenAsk));
  await note("New: start with Chef, and the question goes to Chef Mealan, with this recipe, this step, the amounts you cook, your kitchen and your allergies. The answer shows and is read aloud. Without Chef, nothing you say leaves the phone.");
  await shot("r175b");
  // c, new: voice off, ask by typing
  await toRecipe();
  await drawCook(cook({ k: 4, listen: false, heard: `<div style="margin-top:12px;${CK};${mark};padding:10px 12px"><b>Ask Chef Mealan about this step</b><div style="display:flex;gap:8px;margin-top:8px"><input class="search" style="flex:1" value="Can I use frozen spinach?"><button class="pill pill-primary pill-small">Ask</button></div><small style="display:block;color:var(--muted);font-weight:800;margin-top:10px">CHEF MEALAN, ABOUT STEP 5</small><b style="font-weight:700">Yes. Thaw it and squeeze the water out first, then stir it in for 2 minutes. 120 g fresh is about the same as 120 g frozen, squeezed.</b></div>` }));
  await note("New: with voice off, or in a quiet place, the same question by typing. One field under the step, the answer under it.");
  await shot("r175c");
  // d, now: the empty Plate
  await toPlate();
  await page.evaluate((card) => { const c = eval(card); c.style.cssText += ";outline:3px solid #2e7be8;outline-offset:3px"; }, plateCard);
  await notePlate("Now, 0.3.16: an empty Plate. Foods come in one at a time: Manual, Scan, a screenshot or a link, or Add from your foods.");
  await shot("r175d");
  // e, new: say what you have
  await toPlate();
  await page.evaluate(([card, mark, CK]) => { const c = eval(card); const lab = [...c.querySelectorAll("*")].find((x) => x.children.length === 0 && /Add a food/.test(x.textContent)); const row = lab.nextElementSibling; row.insertAdjacentHTML("afterend", `<div style="${mark};margin:10px 0;padding:2px"><button class="pill pill-wide pill-primary">🎤 Say what you have</button></div><div style="${CK};${mark};margin:10px 0;padding:12px;background:#f3f7ff"><div style="display:flex;align-items:center;gap:8px"><span style="width:12px;height:12px;border-radius:50%;background:#13916a"></span><b>Listening</b></div><b style="display:block;font-size:19px;margin-top:6px">eggs, spinach, feta and half an onion</b><small class="muted" style="display:block;margin-top:6px">Say the foods you have, in any order. Amounts if you know them. Tap when you are done.</small><button class="pill pill-small" style="margin-top:8px">Done</button></div>`); }, [plateCard, mark, CK]);
  await notePlate("New: Say what you have. The phone listens, as in cook mode, and shows the words as you say them.");
  await shot("r175e");
  // f, new: the foods on the plate, Chef builds around them
  await toPlate();
  const row = (ic, name, sub, g, est) => `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)"><span style="font-size:22px">${ic}</span><div style="flex:1"><b style="display:block">${name}</b><small style="color:var(--muted);font-weight:600">${sub}</small></div><b>${g}</b>${est ? '<small style="margin-left:6px;background:#fff3e0;color:#8a4b00;border-radius:6px;padding:1px 6px;font-weight:800">typical</small>' : ""}</div>`;
  await page.evaluate(([card, html]) => { const c = eval(card); c.innerHTML = html; }, [plateCard, `<b>On the plate</b><small class="muted" style="${mark};display:block;padding:6px 8px;margin:6px 0">You said: eggs, spinach, feta and half an onion.</small>
    ${row("🥚", "Eggs", "Your foods", "2")}${row("🥬", "Spinach, fresh", "Typical values, until you scan your pack", "100 g", true)}${row("🧀", "Feta", "Typical values, until you scan your pack", "50 g", true)}${row("🧅", "Onion", "Half of one, typical values", "55 g", true)}
    <small class="muted" style="display:block;margin-top:8px">Amounts you didn't say are a start. Fit to my target sets them for your dinner.</small>
    <button class="pill pill-wide pill-primary" style="margin-top:10px;${mark}">Fit to my target</button><small class="muted" style="display:block;margin-top:6px">Chef Mealan builds the dinner around them, and writes the steps. Then Lock the recipe, Make, Start cooking.</small>`]);
  await notePlate("New: the foods land on the plate. Eggs from your foods; the rest with typical values, marked so, until you scan the pack. Fit to my target, then the steps and cook mode, as today.");
  await shot("r175f");
  await b.close(); server.kill();
})().catch((e) => { console.error(e); process.exit(1); });
