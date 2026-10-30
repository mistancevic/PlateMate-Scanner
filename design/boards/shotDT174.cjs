// DT174 (Coach Milan 30 October 16:05, "DT174. Draw"): cook mode on the same phone. One big step at a time, read aloud,
// steered by voice or by big buttons; timers from the step; how much of a food, from the recipe; the screen stays on.
// Free to run: the browser's own speech recognition and the phone's own voice. No AI in DT174.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.15, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const PORT = "3374", U = `http://127.0.0.1:${PORT}`;
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

  const toMake = async () => { await toRecipe(); await page.getByRole("button", { name: "Make it", exact: true }).click(); await page.waitForTimeout(1200); for (let i = 0; i < 2; i++) { await page.getByRole("button", { name: "Lock the recipe", exact: true }).first().click(); await page.waitForTimeout(900); } };
  const doors = (m) => `<div style="${m};padding:2px;display:flex;flex-direction:column;gap:6px"><button class="pill pill-wide pill-primary">Cook it as written</button><small class="muted rq-under">Straight to Make, with the recipe as it is: the steps, Start cooking, then how it went.</small><button class="pill pill-wide">Change it first</button><small class="muted rq-under">On the Plate: change foods, or Fit to my target sets today's amounts. Then Make. The recipe stays as it is.</small></div>`;
  // a, now: one button on the recipe, Make it, and it always goes through the Plate's editing
  await toRecipe(); await stepsOnly();
  await page.evaluate((mark) => { const b = [...document.querySelectorAll(".rq button.pill")].find((x) => x.textContent.trim() === "Make it"); b.style.cssText += ";" + mark; }, mark);
  await note("Now, 0.3.15: the recipe has one way to cook it, Make it. It always opens the Plate for changes first, even when the recipe is exactly how you want it.");
  await shot("r174a");
  // b, new: two doors, both ending on Make
  await toRecipe(); await stepsOnly();
  await page.evaluate(([mark, html]) => { const b = [...document.querySelectorAll(".rq button.pill")].find((x) => x.textContent.trim() === "Make it"); const hint = b.nextElementSibling; b.insertAdjacentHTML("beforebegin", html); b.remove(); if (hint && hint.tagName === "SMALL") hint.remove(); }, [mark, doors(mark)]);
  await note("New: two doors. Cook it as written goes straight to Make with the recipe's amounts. Change it first is today's Make it: the Plate, to edit, then Make. The recipe page stays for reading and deciding.");
  await shot("r174b");
  // c, now: Make is already a step on the Plate: tick the steps
  await toMake();
  await page.evaluate((mark) => { const s = document.querySelector('section[aria-label="The steps"]'); s.style.cssText += ";" + mark; }, mark);
  await note("Now, 0.3.15: Make, the Plate's middle step. Tick the steps as you go, a photo, how it went. Small type, one long list.", ".step-head");
  await shot("r174c");
  // d, new: Start cooking on Make
  await toMake();
  await page.evaluate((mark) => { const s = document.querySelector('section[aria-label="The steps"]'); s.insertAdjacentHTML("beforebegin", `<div style="${mark};padding:2px;margin:6px 0 12px"><button class="pill pill-wide pill-primary" style="height:52px;font-size:17px">Start cooking</button><small class="muted" style="display:block;margin-top:6px">One big step at a time, read aloud. Say next, back or repeat, or tap. Each step you finish is ticked here.</small></div>`); }, mark);
  await note("New: Start cooking on Make, above the steps. Both doors land here: Cook it as written, or Change it first and then Lock the recipe. Cook mode ticks each step as you finish it; close it any time and the ticks stay.", ".step-head");
  await shot("r174d");
  // e, new: the first time, voice is asked for
  await toRecipe();
  await drawCook(cook({ k: 0, listen: false, top: `<section style="${CK};${mark};margin-bottom:12px"><b style="font-size:17px">Cook hands free?</b><small style="display:block;margin:6px 0 10px;line-height:1.45;font-weight:600">Your phone listens while you cook, so you can say next, back, repeat or how much. Your browser turns your voice into words: Google does it in Chrome, Apple in Safari. Chef Mealan keeps no recordings and sends nothing to its own AI.</small><div style="display:flex;gap:8px"><button class="pill pill-primary">Turn voice on</button><button class="pill">Buttons only</button></div></section>` }));
  await note("New: cook mode, full screen. The first time, it asks for voice once and says where the voice goes. The answer is kept for next time; Voice on and Voice off change it any time.");
  await shot("r174e");
  // f, new: a step with a time in it offers the timer
  await toRecipe();
  await drawCook(cook({ k: 3, extra: `<div style="margin-top:14px"><button class="pill" style="${mark};font-size:16px">⏱ Start 6 min timer</button></div>` }));
  await note("New: step 4 of 6, read aloud. A step that names minutes offers its timer; say timer 6 minutes, or tap. The bar on top shows where you are.");
  await shot("r174f");
  // g, new: timers running and a how much answer, from the recipe itself
  await toRecipe();
  await drawCook(cook({ k: 4,
    top: `<div style="display:flex;gap:8px;margin-bottom:12px;${mark};padding:4px"><span class="pill pill-small" style="background:#e9f5ef;font-weight:800">⏱ Rice 3:40</span><span class="pill pill-small" style="background:#fff3e0;font-weight:800">⏱ Chicken 0:00 · done</span></div>`,
    heard: `<div style="margin-top:12px;${CK};${mark};padding:10px 12px"><small style="display:block;color:var(--muted);font-weight:800">YOU SAID</small><b>How much rice?</b><small style="display:block;color:var(--muted);font-weight:800;margin-top:8px">CHEF MEALAN</small><b>80 g basmati rice, dry. In step 1.</b></div>` }));
  await note("New: two timers run side by side, named after their step. When one ends, the phone rings and says which. How much rice is answered from the amounts you cook, read aloud: no AI, no cost.");
  await shot("r174g");
  // h, new: the end goes back to Make, every step ticked
  await toRecipe();
  await drawCook(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><button class="pill pill-small">✕ Close</button><b style="flex:1;text-align:center;font-size:14px">Chicken rice bowl with spinach</b><small style="font-weight:800;color:var(--muted)">done</small></div>
    <div style="display:flex;gap:4px;margin-bottom:12px">${STEPS.map(() => `<span style="flex:1;height:5px;border-radius:3px;background:var(--brand,#2e7be8)"></span>`).join("")}</div>
    <section style="${CK};${mark};text-align:center;padding:28px 16px"><div style="font-size:40px">🍽️</div><b style="display:block;font-size:24px;margin-top:6px">Done. Enjoy your meal.</b><small style="display:block;margin-top:8px;font-weight:600;line-height:1.45">All 6 steps are ticked. The screen goes back to normal now.</small></section>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px"><button class="pill pill-wide pill-primary">Back to Make</button></div>
    <small class="muted" style="display:block;margin-top:8px">On Make: a photo while it is on the counter, how it went, how much you ate, then Rate it, as today.</small>`);
  await note("New: the end. Voice stops and the screen may sleep again. Back to Make, with every step ticked; the rest of Make and Feedback are as today.");
  await shot("r174h");
  await b.close(); server.kill();
})().catch((e) => { console.error(e); process.exit(1); });
