// Board CR1a (Coach Milan 8 November 21:19 to 21:30, Yes): Make a post, the first creator build. Cook ends and the recipe page
// get Make a post; the post screen: pictures (plate, steps, video), a caption in three languages, 4:5 and 9:16, share or save.
// For every member with the Chef Mealan mark; the creator's look, dreamed dishes and credits come with CR1b.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3495", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = "font-family:Nunito,system-ui,sans-serif;color:#172742";
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[190, food("c", "Chicken breast", 120, 22.5, 0, 2.6)], [95, food("r", "Basmati rice", 356, 8.5, 78, 0.9)], [145, food("s", "Spinach", 23, 2.9, 3.6, 0.4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Rinse [[i:r|basmati rice]] and cook it in 200 ml water for 12 minutes.", "Cut [[i:c|chicken breast]] into strips and fry 6 minutes.", "Add [[i:s|spinach]] and stir 2 minutes."];
const PIC = "/landing/hero/curry-m.webp";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (cooked = true) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); },
      { ...seed, meals: [{ id: "m-b", title: "Chicken rice bowl", items, portion: 430, steps: STEPS, savedAt: "2026-11-07T22:58:00Z", ...(cooked ? { cookedAt: "2026-11-08T12:40:00Z" } : {}) }] });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/my-recipes/m-b"); await p.waitForTimeout(1400); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, full) => { await p.evaluate((sel) => { const e = sel && document.querySelector(sel); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 90); else window.scrollTo(0, 0); }, sel); await p.waitForTimeout(400); if (full) { await p.setViewportSize({ width: 390, height: 1180 }); await p.waitForTimeout(300); } await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const screen = (p, html) => p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.innerHTML = `<div>${html}</div>`; window.scrollTo(0, 0); }, html);
  // cook to the end: Start cooking, Make, cook mode, Next until Done
  const cookToEnd = async (p) => {
    await p.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await p.waitForTimeout(1200);
    const clear = p.getByRole("button", { name: "Clear my plate" }); if (await clear.count()) { await clear.click(); await p.waitForTimeout(1000); }
    const cm = p.locator(".cook-mode"); if (process.env.DBG) { console.log("h2:", await p.locator("h2").first().textContent().catch(() => ""), "cm:", await cm.count(), "buttons:", (await p.locator("button").allInnerTexts()).join(" | ")); await p.screenshot({ path: process.env.DBG }); } await cm.waitFor({ timeout: 8000 });
    for (const n of ["Buttons only", "Step 1 ›"]) { const x = cm.getByRole("button", { name: n, exact: true }); if (await x.count()) { await x.click(); await p.waitForTimeout(300); } }
    for (let i = 0; i < 6; i++) { const btn = cm.getByRole("button", { name: /^(Next ›|Done ✓)$/ }); if (!(await btn.count())) break; await btn.first().click(); await p.waitForTimeout(250); if (await cm.locator(".cook-done").count()) break; }
    await p.waitForTimeout(400); return cm;
  };
  // a. now: cook ends (0.3.116)
  let p = await open(false); await cookToEnd(p);
  await note(p, "Now (0.3.116): Cook ends. Photo of your meal, Cooked. Next: Eat, and Make for the step photos and notes. Nothing here makes a post.", ".cook-done", "afterend");
  await shot(p, "rcr1aa");
  // b. new: cook ends with Make a post
  p = await open(false); await cookToEnd(p);
  await p.evaluate(({ mark }) => { const e = document.querySelector(".cook-to-eat"); e.insertAdjacentHTML("afterend", `<button class="pill pill-wide mk-post" style="${mark};min-height:48px;margin-top:10px;display:flex;flex-direction:column;white-space:normal;line-height:1.3">Make a post ›<small style="display:block;font-weight:600;font-size:12.5px;color:#53627f">The plate, the step photos and the video, with the numbers</small></button>`); }, { mark });
  await note(p, "New: Cook ends with Make a post, under Cooked. Next: Eat. For every member. The post is made from this cook: its photos and its numbers.", ".mk-post");
  await shot(p, "rcr1ab", ".cook-done");
  // c. new: the post screen
  const pics = () => ["Plate", "Step 1", "Step 2", "Step 3", "Video"].map((l, i) => `<label style="position:relative;flex:none"><img src="${PIC}" style="width:92px;height:92px;object-fit:cover;border-radius:10px;display:block;filter:hue-rotate(${i * 22}deg)${l === "Video" ? ";filter:grayscale(.3)" : ""}"><span style="position:absolute;top:6px;left:6px;width:22px;height:22px;border-radius:11px;background:${i === 3 ? "#fff" : "#2a72d9"};color:${i === 3 ? "#5b6b8a" : "#fff"};border:1.5px solid #2a72d9;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">${i === 3 ? "" : "✓"}</span>${l === "Video" ? '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.5)">▶</span>' : ""}<small style="position:absolute;bottom:6px;left:6px;background:rgba(0,0,0,.55);color:#fff;border-radius:6px;padding:1px 6px;font-size:11px">${l}</small></label>`).join("");
  const chip = (t, on) => `<button class="pill pill-small" style="min-height:44px;${on ? "background:#172742;color:#fff;border-color:#172742" : ""}">${t}</button>`;
  const POST = `<div style="padding:12px;display:flex;flex-direction:column;gap:12px;${F}">
    <b style="font-size:22px">Make a post</b>
    <div style="display:flex;gap:8px;align-items:center;font-size:14px;flex-wrap:wrap"><span style="background:#dcefe6;color:#0f7d5b;border-radius:999px;padding:3px 10px;font-weight:800">Cooked · 8 Nov 12:40</span><span style="color:#53627f">Chicken rice bowl · 430 g</span></div>
    <small style="font-size:13px;font-weight:800;letter-spacing:.05em;color:#53627f">PICTURES · tap to leave one out</small>
    <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">${pics()}</div>
    <small style="font-size:13px;font-weight:800;letter-spacing:.05em;color:#53627f">CAPTION</small>
    <div style="display:flex;gap:8px">${chip("English", true)}${chip("Srpski")}${chip("Deutsch")}</div>
    <div style="background:#fff;border:1.5px solid #d1dcf0;border-radius:12px;padding:12px;font-size:15px;line-height:1.5">Chicken rice bowl. 12 minutes of rice, 6 of chicken, 2 of spinach. 612 kcal, 52 g protein, PD 8.5 per portion. Weighed, not guessed.<br><br>#highprotein #mealprep #chefmealan</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-small" style="min-height:44px">Rewrite</button><button class="pill pill-small" style="min-height:44px">Shorter</button><button class="pill pill-small" style="min-height:44px">My words</button></div>
    <small style="font-size:13px;font-weight:800;letter-spacing:.05em;color:#53627f">FORMAT</small>
    <div style="display:flex;gap:8px">${chip("4:5 · feed, 5 pictures", true)}${chip("9:16 · story, 1")}</div>
    <button class="pill pill-primary pill-wide" style="min-height:48px">Share the post ›</button>
    <button class="pill pill-wide" style="min-height:48px">Save to the phone</button>
    <small style="font-size:13px;color:#53627f;text-align:center;line-height:1.45">Every picture carries the Chef Mealan mark. Your own look, without the mark, comes with Creator (CR1b).</small></div>`;
  p = await open(); await screen(p, POST);
  await note(p, "New: the post screen. The pictures of this cook, ticked; the caption with the real numbers, in English, Srpski or Deutsch, Rewrite and Shorter by Chef Mealan or your own words; 4:5 or 9:16; Share opens the phone's share sheet, Save puts the pictures on the phone.", "main > div", "afterbegin");
  await shot(p, "rcr1ac", null, true);
  // d. new: the first picture, 4:5, with the mark
  const CARD = (ratio, title, line) => `<div style="padding:12px;${F}"><b style="font-size:22px">${title}</b>
    <div style="margin:12px auto 0;position:relative;border-radius:14px;overflow:hidden;${mark};width:${ratio === "9/16" ? "62%" : "100%"}"><img src="${PIC}" style="width:100%;aspect-ratio:${ratio};object-fit:cover;display:block">
      <div style="position:absolute;left:0;right:0;bottom:0;padding:14px 14px 26px;background:linear-gradient(transparent,rgba(0,0,0,.72));color:#fff"><b style="font-size:${ratio === "9/16" ? 17 : 20}px;display:block">Chicken rice bowl</b><div style="display:flex;gap:12px;margin-top:6px;font-size:${ratio === "9/16" ? 13 : 15}px;flex-wrap:wrap"><span><b>612</b> kcal</span><span><b>52 g</b> protein</span><span><b>PD 8.5</b></span></div><small style="display:block;margin-top:6px;font-size:12.5px;font-weight:700;color:#fff">Cooked and weighed · 8 Nov</small></div>
      <small style="position:absolute;right:10px;bottom:8px;color:rgba(255,255,255,.55);font-size:11px;font-weight:700;letter-spacing:.02em">chefmealan.com</small></div>
    <small style="display:block;margin-top:12px;font-size:14px;color:#53627f;line-height:1.45">${line}</small></div>`;
  p = await open(); await screen(p, CARD("4/5", "The first picture, 4:5", "The numbers strip and Cooked and weighed on every first picture. Then the steps, then the video as the last one. The mark is chefmealan.com, small and half transparent, bottom right, on every member's picture."));
  await note(p, "New: the first picture of the post. The plate, the numbers strip, Cooked and weighed with the date, and the mark, chefmealan.com, barely there, bottom right. It is the proof picture; the steps follow it.", "main > div", "afterbegin");
  await shot(p, "rcr1ad");
  // e. new: 9:16
  p = await open(); await screen(p, CARD("9/16", "The story picture, 9:16", "One picture for a story or a reel's last frame: the plate and the numbers. The steps are not in it; the caption goes in the story's text."));
  await note(p, "New: the 9:16 picture. One picture with the plate and the numbers, for a story or the last frame of a reel.", "main > div", "afterbegin");
  await shot(p, "rcr1ae");
  // f. new: the recipe page, Make a post for a cooked recipe
  p = await open();
  await p.evaluate(({ mark }) => { const s = document.querySelector(".rq-steps"); s.insertAdjacentHTML("beforebegin", `<div class="mk-post" style="${mark};padding:8px;margin:10px 0"><button class="pill pill-wide" style="min-height:48px">Make a post ›</button><small style="display:block;margin-top:6px;font-size:13px;color:#53627f">Cooked 8 November. The pictures and the numbers of that cook.</small></div>`); }, { mark });
  await note(p, "New: the recipe page has Make a post too, above the steps, for a recipe that was cooked. A recipe never cooked has none. The publish sheet's button The Instagram images goes; its four pictures live inside Make a post now.", ".mk-post");
  await shot(p, "rcr1af", ".bnote");

  // g. new: the 10th post, thank you
  const TEN = (n, q, btns, extra) => `<div style="padding:12px;${F}"><b style="font-size:22px">Make a post</b>
    <div style="margin-top:12px;${mark};background:#fff;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px">
      <div style="font-size:30px">🎉</div><b style="font-size:19px">Your ${n}th post. Thank you.</b>
      <p style="margin:0;font-size:15px;line-height:1.5;color:#172742">${q}</p>
      ${btns}${extra || ""}
      <small style="font-size:12.5px;color:#53627f">Your answer goes to Coach Milan, with the count.</small></div>
    <div style="margin-top:14px;opacity:.45"><small style="font-size:13px;font-weight:800;letter-spacing:.05em;color:#53627f">PICTURES</small><div style="display:flex;gap:8px;margin-top:8px">${["Plate","Step 1","Step 2"].map((l,i)=>`<img src="${PIC}" style="width:92px;height:92px;object-fit:cover;border-radius:10px;filter:hue-rotate(${i*22}deg)">`).join("")}</div></div></div>`;
  p = await open(); await screen(p, TEN(10, "Ten posts from your own cooking. Is this worth keeping?",
    `<button class="pill pill-primary pill-wide" style="min-height:48px">Yes, keep going</button><button class="pill pill-wide" style="min-height:48px">Something is missing</button>`,
    `<textarea style="width:100%;box-sizing:border-box;min-height:64px;border:1.5px solid #d1dcf0;border-radius:10px;padding:8px;font:inherit;font-size:14px" placeholder="What is missing? One line is enough."></textarea>`));
  await note(p, "New: after the 10th post a card, not a blocking popup. Thank you, and one question: is this worth keeping? Yes, or Something is missing with a line. The count and the answer go to Coach Milan's Clients view.", "main > div", "afterbegin");
  await shot(p, "rcr1ag");
  // h. new: the 20th post, the Creator offer with the price; the tap is the signal
  p = await open(); await screen(p, TEN(20, "Twenty posts. Creator gives you your own look on every picture, your colour and your logo, no Chef Mealan mark, and 20 credits a month for captions, pictures and video.",
    `<div style="display:flex;align-items:baseline;gap:8px"><b style="font-size:26px">€29</b><span style="font-size:14px;color:#53627f">a month, first month free</span></div><button class="pill pill-primary pill-wide" style="min-height:48px">Get Creator ›</button><button class="link" style="min-height:44px">Not for me</button>`,
    ``).replace("Your answer goes to Coach Milan, with the count.", "The tap goes to Coach Milan, with the count. Not for me too."));
  await note(p, "New: after the 20th post the Creator offer, with the price. Get Creator is the signal: a tap on €29 is a commitment, a Yes to a question is not. Not for me is a signal too.", "main > div", "afterbegin");
  await shot(p, "rcr1ah");
  // i. new: after the tap, the honest door
  const DOOR = `<div style="padding:12px;${F}"><b style="font-size:22px">Creator</b>
    <div style="margin-top:12px;${mark};background:#fff;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px">
      <b style="font-size:19px">Not open yet. You are first in line.</b>
      <p style="margin:0;font-size:15px;line-height:1.5">Creator opens when the app opens to everyone. You pay nothing now; there is no card to enter. Your first month will be free, €29 a month after that, and you can stop any month.</p>
      <div style="font-size:14px;color:#53627f">We write to <b style="color:#172742">dajana@example.com</b> when it opens.</div>
      <button class="pill pill-primary pill-wide" style="min-height:48px">Put me first in line ›</button>
      <button class="link" style="min-height:44px">Back to my post</button></div></div>`;
  p = await open(); await screen(p, DOOR);
  await note(p, "New: after Get Creator, the honest door. Not open yet, nothing to pay, no card field; first month free when it opens. Put me first in line is the second signal, by email. The same door PR2 uses.", "main > div", "afterbegin");
  await shot(p, "rcr1ai");
  await b.close(); server.kill();
})();
