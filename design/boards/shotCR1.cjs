// Board CR1 (Coach Milan 8 November 18:53 to 19:03): the creator, MVP. After a cook, Make a post from the recipe page: the step
// photos and the plate, a caption with the numbers in the creator's voice, the cover video, the creator's look; Cooked or Dreamed marked.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3494", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = "font-family:Nunito,system-ui,sans-serif;color:#172742";
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[190, food("c", "Chicken breast", 120, 22.5, 0, 2.6)], [95, food("r", "Basmati rice", 356, 8.5, 78, 0.9)], [145, food("s", "Spinach", 23, 2.9, 3.6, 0.4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Rinse [[i:r|basmati rice]] and cook it in 200 ml water for 12 minutes.", "Cut [[i:c|chicken breast]] into strips and fry 6 minutes.", "Add [[i:s|spinach]] and stir 2 minutes."];
// a plate photo from the home page's own pictures, as the stand-in for the creator's photos
const PIC = "/landing/hero/curry-m.webp";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); },
      { ...seed, meals: [{ id: "m-b", title: "Chicken rice bowl", items, portion: 430, steps: STEPS, savedAt: "2026-11-07T22:58:00Z", cookedAt: "2026-11-08T12:40:00Z" }] });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/my-recipes/m-b"); await p.waitForTimeout(1400); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel) => { await p.evaluate((sel) => { const e = sel && document.querySelector(sel); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 90); else window.scrollTo(0, 0); }, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const screen = (p, html) => p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.innerHTML = `<div>${html}</div>`; window.scrollTo(0, 0); }, html);
  // a. now: the recipe page after a cook
  let p = await open();
  await note(p, "Now (0.3.116): after a cook the recipe holds the steps, their photos and the cover video. They stay in the app; nothing leaves it as a post.", ".rq-steps");
  await shot(p, "rcr1a", ".bnote");
  // b. new: Make a post
  p = await open();
  await p.evaluate(({ mark }) => { const s = document.querySelector(".rq-steps"); s.insertAdjacentHTML("beforebegin", `<div class="mk-post" style="${mark};padding:8px;margin:10px 0"><button class="pill pill-primary pill-wide" style="min-height:48px">Make a post ›</button><small style="display:block;margin-top:6px;font-size:13px;color:#53627f">Cooked 8 November. The photos, the video and the numbers of this cook, ready to post.</small></div>`); }, { mark });
  await note(p, "New, Creator: a cooked recipe gets Make a post. Only for a cook that happened: the photos and the numbers are the proof.", ".mk-post");
  await shot(p, "rcr1b", ".bnote");
  // c. new: the post screen
  const pics = (n) => Array.from({ length: n }, (_, i) => `<label style="position:relative;flex:none"><img src="${PIC}" style="width:96px;height:96px;object-fit:cover;border-radius:10px;display:block;filter:hue-rotate(${i * 25}deg)"><span style="position:absolute;top:6px;left:6px;width:22px;height:22px;border-radius:11px;background:#2a72d9;color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">✓</span><small style="position:absolute;bottom:6px;left:6px;background:rgba(0,0,0,.55);color:#fff;border-radius:6px;padding:1px 6px;font-size:11px">${i === n - 1 ? "Plate" : "Step " + (i + 1)}</small></label>`).join("");
  const POST = `<div style="padding:12px;display:flex;flex-direction:column;gap:12px;${F}">
    <b style="font-size:22px">Make a post</b>
    <div style="display:flex;gap:8px;align-items:center;font-size:14px"><span style="background:#dcefe6;color:#0f7d5b;border-radius:999px;padding:3px 10px;font-weight:800">Cooked · 8 Nov 12:40</span><span style="color:#53627f">430 g · 1 portion</span></div>
    <small style="font-size:13px;font-weight:800;letter-spacing:.05em;color:#53627f">PHOTOS · tap to leave one out</small>
    <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">${pics(4)}</div>
    <small style="font-size:13px;font-weight:800;letter-spacing:.05em;color:#53627f">CAPTION · in your voice</small>
    <div style="background:#fff;border:1.5px solid #d1dcf0;border-radius:12px;padding:12px;font-size:15px;line-height:1.5">Chicken rice bowl, 12 minutes of rice and 6 of chicken. 612 kcal, 52 g protein, PD 8.5 per portion. Weighed, not guessed.<br><br>#highprotein #realnumbers #chefmealan</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-small" style="min-height:44px">Rewrite</button><button class="pill pill-small" style="min-height:44px">Shorter</button><button class="pill pill-small" style="min-height:44px">Srpski</button></div>
    <small style="font-size:13px;font-weight:800;letter-spacing:.05em;color:#53627f">YOUR LOOK</small>
    <div style="display:flex;gap:10px;align-items:center;font-size:14px"><span style="width:28px;height:28px;border-radius:14px;background:#0f7d5b;display:inline-block"></span><span>Green · Nunito · your logo bottom right</span><button class="link" style="margin-left:auto;min-height:44px">Change</button></div>
    <button class="pill pill-primary pill-wide" style="min-height:48px">Save the post: 4 photos, caption, video ›</button>
    <small style="font-size:13px;color:#53627f;text-align:center">1 credit · 19 left this month</small></div>`;
  p = await open(); await screen(p, POST);
  await note(p, "New, Creator: the post screen. The step photos and the plate, ticked; a caption in the creator's voice with the real numbers; the creator's look; one tap saves photos, caption and the cover video to the phone, to post anywhere. One credit.", "main > div", "afterbegin");
  await shot(p, "rcr1c");
  // d. new: the post as it will look
  const CARD = `<div style="padding:12px;${F}"><b style="font-size:22px">The first picture</b>
    <div style="margin:12px 0;position:relative;border-radius:14px;overflow:hidden;${mark}"><img src="${PIC}" style="width:100%;aspect-ratio:4/5;object-fit:cover;display:block">
      <div style="position:absolute;left:0;right:0;bottom:0;padding:14px;background:linear-gradient(transparent,rgba(0,0,0,.7));color:#fff"><b style="font-size:20px;display:block">Chicken rice bowl</b><div style="display:flex;gap:14px;margin-top:6px;font-size:15px"><span><b>612</b> kcal</span><span><b>52 g</b> protein</span><span><b>PD 8.5</b></span></div><small style="display:block;margin-top:6px;font-size:13px;font-weight:700;color:#fff">Cooked and weighed · 8 Nov · with Chef Mealan</small></div>
      <div style="position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:18px;background:#0f7d5b;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center">M</div></div>
    <small style="font-size:14px;color:#53627f;line-height:1.45">The numbers strip and the Cooked line are on every first picture. The colour and the logo are the creator's.</small></div>`;
  p = await open(); await screen(p, CARD);
  await note(p, "New, Creator: the first picture of the post. The plate, the numbers strip, Cooked and weighed, and the creator's colour and logo. The rest of the pictures are the steps.", "main > div", "afterbegin");
  await shot(p, "rcr1d");
  // e. new: dreamed, marked
  const DREAM = CARD.replace("Cooked and weighed · 8 Nov · with Chef Mealan", "Drawn by Chef Mealan · not cooked yet · numbers are the plan").replace("<b style=\"font-size:22px\">The first picture</b>", "<b style=\"font-size:22px\">A dreamed dish</b>").replace("The numbers strip and the Cooked line are on every first picture. The colour and the logo are the creator's.", "A dish that was not cooked can be posted, marked. The mark cannot be taken off; the numbers say plan, not weighed.");
  p = await open(); await screen(p, DREAM.replace(/filter:[^;"]*/g, "")).then(() => p.evaluate(() => { document.querySelector("main img").style.filter = "saturate(1.4) contrast(1.1)"; }));
  await note(p, "New, Creator: the one rule. A dreamed dish, never cooked, is marked Drawn by Chef Mealan, not cooked yet, and the mark stays on the picture. The first dreamed dish passed off as cooked would cost the proof story for every creator.", "main > div", "afterbegin");
  await shot(p, "rcr1e");
  await b.close(); server.kill();
})();
