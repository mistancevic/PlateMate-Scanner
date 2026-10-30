// DT175a (Coach Milan 30 October 18:09 to 18:14): pictures for each step, in cook mode, labelled Beta when drawn by AI. One big step at a time, read aloud,
// steered by voice or by big buttons; timers from the step; how much of a food, from the recipe; the screen stays on.
// Free to run: the browser's own speech recognition and the phone's own voice. No AI in DT174.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.16, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const PORT = "3377", U = `http://127.0.0.1:${PORT}`;
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
  const IMG = (k) => "data:image/webp;base64," + fs.readFileSync(`/tmp/claude-0/-home-claude/a3625ff7-4226-57ca-879e-055f53d2dca0/scratchpad/stepcheck/img/${k}.webp`).toString("base64");
  const pic = (src, label, ai) => `<div style="position:relative;margin:-14px -14px 10px;${mark}"><img src="${src}" style="display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:16px 16px 0 0"><span style="position:absolute;left:10px;top:10px;background:${ai ? "rgba(23,39,66,.82)" : "rgba(19,145,106,.9)"};color:#fff;font-weight:800;font-size:12px;border-radius:999px;padding:4px 10px">${label}</span></div>`;
  const withPic = (html, src, label, ai) => html.replace('<small style="font-weight:800;color:var(--muted);letter-spacing:.04em">STEP', pic(src, label, ai) + '<small style="font-weight:800;color:var(--muted);letter-spacing:.04em">STEP').replace("min-height:250px;display:flex;flex-direction:column;justify-content:center", "display:flex;flex-direction:column;overflow:hidden");
  // DT175a v2 (Milan 19:21): labels under pictures, not on them; nothing under 12 px; every tap target at least 44 px; the step bar
  // becomes numbered step buttons; Watch the steps on the recipe page, played from the step pictures
  const chips = (k, done) => `<div style="display:flex;gap:6px;margin-bottom:12px;${mark};padding:3px" role="tablist" aria-label="Steps">${STEPS.map((_, j) => { const cur = j === k, d = done.includes(j); return `<button style="flex:1;height:44px;border-radius:12px;font-weight:800;font-size:16px;border:1.5px solid ${cur ? "var(--brand)" : "var(--line)"};background:${cur ? "var(--brand)" : d ? "#e9f5ef" : "var(--surface,#fff)"};color:${cur ? "#fff" : d ? "#13916a" : "var(--ink)"}">${j + 1}${d && !cur ? " ✓" : ""}</button>`; }).join("")}</div>`;
  const withChips = (html, k, done) => html.replace(/<div style="display:flex;gap:4px;margin-bottom:12px">[\s\S]*?<\/div>/, chips(k, done));
  const pic2 = (src, label) => `<img src="${src}" style="display:block;width:calc(100% + 28px);max-width:none;margin:-14px -14px 0;aspect-ratio:4/3;object-fit:cover;border-radius:16px 16px 0 0"><small style="display:block;margin:8px 0 10px;font-size:13px;font-weight:700;color:var(--muted)">${label}</small>`;
  const withPic2 = (html, src, label) => html.replace('<small style="font-weight:800;color:var(--muted);letter-spacing:.04em">STEP', pic2(src, label) + '<small style="font-weight:800;color:var(--muted);letter-spacing:.04em">STEP').replace("min-height:250px;display:flex;flex-direction:column;justify-content:center", "display:flex;flex-direction:column;overflow:hidden");
  const SET = ["c1", "c2", "c3", "c4", "c5", "c6"];
  // a, now: a step in words only, a thin bar
  await toRecipe();
  await drawCook(cook({ k: 3 }));
  await note("Now, 0.3.16: a step in cook mode is words only. The bar on top is 5 px high: it shows where you are, but you can't tap it.");
  await shot("r175Aa");
  // b, new: Watch the steps on the recipe, and a picture per step with its label under it
  await toRecipe(); await stepsOnly();
  await page.evaluate(([mark, srcs, poster]) => {
    const lis = [...document.querySelectorAll(".rq-steps li")];
    lis.forEach((li, k) => li.insertAdjacentHTML("beforeend", `<div style="flex:none;width:76px;display:flex;flex-direction:column;gap:4px;align-items:center"><img src="${srcs[k]}" style="width:76px;height:76px;object-fit:cover;border-radius:10px;display:block"><small style="font-size:12px;font-weight:700;color:var(--muted)">AI · Beta</small></div>`));
    const st = document.querySelector(".rq-steps"); st.style.cssText += ";" + mark;
    st.insertAdjacentHTML("beforebegin", `<section class="card" style="${mark};padding:0;overflow:hidden"><div style="position:relative"><img src="${poster}" style="display:block;width:100%;aspect-ratio:16/10;object-fit:cover"><button aria-label="Watch the steps" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.95);font-size:26px;color:#2e7be8;box-shadow:0 2px 10px rgba(0,0,0,.25)">▶</button></div><div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b style="display:block;font-size:17px">Watch the steps</b><small class="muted" style="font-size:13px">6 steps, 35 seconds · pictures drawn by AI, Beta</small></div></div></section>`);
  }, [mark, SET.map(IMG), IMG("c6")]);
  await note("New, Beta: Watch the steps, on top of the recipe, where you read and decide. It plays the step pictures with each step's words. Each step's picture sits beside it, its label under it in 12 px. The pictures are the ChatGPT set, three of them marked Fix on the checks page.");
  await shot("r175Ab");
  // c, new: the video playing, words under the picture, big controls
  await toRecipe();
  await drawCook(`<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><button class="pill" style="height:44px">✕ Close</button><b style="flex:1;text-align:center;font-size:14px">Chicken rice bowl with spinach</b><small style="font-weight:800;color:var(--muted)">0:21</small></div>
    ${chips(3, []).replace(mark, "")}
    <section style="${CK};padding:0;overflow:hidden;${mark}"><img src="${IMG("c4")}" style="display:block;width:100%;aspect-ratio:1;object-fit:cover"><div style="padding:12px 14px"><small style="display:block;font-weight:800;color:var(--muted);letter-spacing:.04em">STEP 4 OF 6 · TIMER 6:00</small><div style="font-size:21px;line-height:1.35;font-weight:700;margin-top:4px">Heat <b class="st-amt">8 g olive oil</b> in a pan on medium high heat. Fry the chicken 6 minutes, turning once, until no pink is left inside.</div><small style="display:block;margin-top:8px;font-size:13px;font-weight:700;color:var(--muted)">Picture drawn by AI, Beta</small></div></section>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px"><button class="pill" style="height:52px">‹ Step 3</button><button class="pill pill-primary" style="height:52px">❚❚ Pause</button><button class="pill" style="height:52px">Step 5 ›</button></div>
    <button class="pill pill-wide" style="height:52px;margin-top:10px">Cook it as written</button>`);
  await note("New, Beta: the steps play one after another, about 5 seconds each, the words under the picture. The numbers on top jump to a step. From the video straight to Cook it as written. Made on the phone from the pictures: no video file, nothing to pay.");
  await shot("r175Ac");
  // d, new: adding a picture, the checks, big buttons
  await toRecipe(); await stepsOnly();
  await page.evaluate(([mark, CK, src]) => { const st = document.querySelector(".rq-steps"); st.innerHTML = `<b>Picture for step 5</b><small style="display:block;margin:4px 0 10px;font-weight:600">Add 120 g spinach and the garlic. Stir 2 minutes, until the spinach wilts.</small>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px"><button class="pill" style="height:48px">Take a photo</button><button class="pill pill-primary" style="height:48px">From my gallery</button></div>
    <img src="${src}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;display:block">
    <b style="display:block;margin-top:12px">Who made it?</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px"><button class="choice" style="height:44px">My photo</button><button class="choice on" style="height:44px">Drawn by AI</button></div>
    <div style="${mark};margin-top:12px;padding:10px 12px;background:#fff8d6;border-radius:10px"><b>Before you keep it</b><ul style="margin:6px 0 0;padding-left:18px;line-height:1.55;font-size:14px;font-weight:600"><li>It shows this step, and only this step</li><li>Every food is from the recipe, and where it should be by now</li><li>Meat raw before cooking, cooked through after it</li><li>The amounts look like the grams</li><li>A real cook would do it this way</li></ul></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><button class="pill pill-primary" style="height:48px">Keep it</button><button class="pill" style="height:48px">Choose another</button></div>
    <small class="muted" style="display:block;margin-top:8px">Drawn by AI says so under the picture, in cook mode and in the video.</small>`; }, [mark, CK, IMG("c5")]);
  await note("New, Beta: a picture for a step comes from the camera or the gallery, for example one made in ChatGPT or Gemini with the prompts on the Step Picture Checks page. Who made it is asked, and the checks show before Keep it. Every button 44 px or more.");
  await shot("r175Ad");
  // e, new: cook mode: numbered steps to tap, the picture with its label under it
  await toRecipe();
  await drawCook(withChips(withPic2(cook({ k: 3, extra: `<div style="margin-top:12px"><button class="pill" style="font-size:16px;height:48px">⏱ Start 6 min timer</button></div>` }), IMG("c4"), "Picture drawn by AI, Beta"), 3, [0, 1, 2]));
  await note("New: the thin bar becomes six step buttons, 44 px high. Done steps show a tick; tap a number, or say go to step 4, to jump there; it is read aloud. Jumping ahead ticks nothing; only Next does. The picture's label sits under it.");
  await shot("r175Ae");
  // f, new: your own photo, and a jump back
  await toRecipe();
  await drawCook(withChips(withPic2(cook({ k: 1 }), IMG("g2"), "Your photo"), 1, [0, 1, 2, 3]));
  await note("New: tapped back to step 2 from step 5: steps 1 to 4 keep their ticks. Your own photo says Your photo under it. The picture here is a stand-in for the photo you take while cooking.");
  await shot("r175Af");
  await b.close(); server.kill();
})().catch((e) => { console.error(e); process.exit(1); });
