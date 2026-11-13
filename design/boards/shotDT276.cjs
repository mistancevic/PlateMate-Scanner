// Board DT276 (Coach Milan 10 November 21:24 to 21:31, draw everything first, plan the steps): one picture per step, shown
// everywhere; a new photo on a step that has one asks; several photos at once from the gallery.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3715", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = "font-family:Nunito,system-ui,sans-serif;color:#172742";
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[190, food("c", "Chicken breast", 120, 22.5, 0, 2.6)], [95, food("r", "Basmati rice", 356, 8.5, 78, 0.9)], [10, food("g", "Garlic", 149, 6.4, 33, 0.5)], [145, food("s", "Spinach", 23, 2.9, 3.6, 0.4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Rinse [[i:r|basmati rice]] and bring it to a boil in water, then cover and cook on low heat for 12 minutes.", "Cut [[i:c|chicken breast]] into strips, season with salt and pepper, and slice [[i:g|garlic]] thinly.", "Fry the chicken 6 minutes, turning once.", "Add the garlic and [[i:s|spinach]] and stir 2 minutes.", "Serve the chicken and spinach on the rice."];
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(ROOT + "/tests/flows/plate.jpg").toString("base64");
const PIC = "/landing/hero/curry-m.webp", PICS = ["/landing/hero/curry-m.webp", "/landing/hero/meatballs-m.webp", "/landing/hero/quesadilla-m.webp", "/landing/hero/squares-m.webp", "/landing/hero/waffle-m.webp"];
const meal = { id: "m-b", title: "Chicken rice bowl", items, portion: 440, steps: STEPS, savedAt: "2026-11-07T22:58:00Z", stepPics: [PHOTO, null, null, null, null], stepPicMeta: [{ by: "me", step: STEPS[0] }, null, null, null, null] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { ...seed, meals: [meal] });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-b"); await p.waitForTimeout(1500); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, tall) => { if (tall) await p.setViewportSize({ width: 390, height: tall }); await p.evaluate((sel) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - 90 : 0); }, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const toMake = async (p, keepCookMode) => {
    await p.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await p.waitForTimeout(1300);
    const clear = p.getByRole("button", { name: "Clear my plate" }); if (await clear.count()) { await clear.click(); await p.waitForTimeout(1000); }
    const cm = p.locator(".cook-mode"); await cm.waitFor({ timeout: 8000 });
    for (const n of ["Buttons only", "Step 1 ›"]) { const x = cm.getByRole("button", { name: n, exact: true }); if (await x.count()) { await x.click(); await p.waitForTimeout(300); } }
    if (!keepCookMode) { await cm.getByRole("button", { name: /Close/ }).click(); await p.waitForTimeout(600); }
    return cm;
  };
  const screen = (p, html) => p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.innerHTML = `<div>${html}</div>`; window.scrollTo(0, 0); }, html);
  // a. now: cook mode shows the step's picture
  let p = await open(); await toMake(p, true);
  await p.evaluate(({ NOTE }) => { const c = document.querySelector(".cook-mode .cook-card") || document.querySelector(".cook-mode"); const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = "Now (0.3.125), cook mode, step 1: the recipe's picture of the step, Your photo, kept with the recipe."; c.insertAdjacentElement("afterend", d); }, { NOTE });
  await p.waitForTimeout(300); await p.screenshot({ path: `${R}/rdt276a.png` }); console.log("shot rdt276a"); await p.context().close();
  // b. now: Make's list shows + Photo for the same step
  p = await open(); await toMake(p, false);
  if (process.env.DBG) console.log(await p.evaluate(() => [...document.querySelectorAll(".mk-row")].length + " rows; " + document.querySelector(".mk-photo")?.className));
  await p.evaluate(({ mark }) => { const x = document.querySelector(".mk-photo"); if (x) x.style.cssText += ";" + mark; }, { mark });
  await note(p, "Now (0.3.125), Make, the same step: ＋ Photo, as if it had none. This list shows only photos taken in this cook, not the recipe's.", ".mk-row");
  await shot(p, "rdt276b", ".bnote");
  // c. new: Make shows the recipe's picture
  p = await open(); await toMake(p, false);
  await p.evaluate(({ mark, PHOTO }) => { const x = document.querySelector(".mk-photo"); x.classList.remove("empty"); x.innerHTML = `<img src="${PHOTO}" alt="">`; x.style.cssText += ";" + mark; }, { mark, PHOTO });
  await note(p, "New, Make, the same step: the step's picture, the one the recipe and cook mode show. A step has one picture, and every place shows it.", ".mk-row");
  await shot(p, "rdt276c", ".bnote");
  // d. new: a step can have more than one picture, in Make
  p = await open(); await toMake(p, false);
  await p.evaluate(({ mark, PHOTO, PIC }) => { const x = document.querySelector(".mk-photo"); const row = document.querySelector(".mk-row");
    x.outerHTML = `<span class="two" style="${mark};display:flex;gap:6px;align-items:center;flex:none;padding:2px"><img src="${PHOTO}" style="width:48px;height:48px;object-fit:cover;border-radius:10px"><img src="${PIC}" style="width:48px;height:48px;object-fit:cover;border-radius:10px"><span style="width:44px;height:48px;border:1.5px dashed #2a72d9;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#1f5fc7;font-size:11px;font-weight:800">＋<span>Photo</span></span></span>`; row.style.flexWrap = "wrap"; }, { mark, PHOTO, PIC });
  await note(p, "New, Make, step 1: a step can have two or more pictures. A new photo is added next to the first. Nothing is replaced and nothing is asked. Tap a picture to see it large, make it the first, or remove it.", ".mk-row");
  await shot(p, "rdt276d", ".bnote");
  // d2. new: cook mode, the step's pictures one after another
  p = await open(); await toMake(p, true);
  await p.evaluate(({ NOTE, mark }) => { const im = document.querySelector(".cook-mode img"); const box = im.parentElement; box.style.position = "relative";
    box.insertAdjacentHTML("beforeend", `<span style="${mark};position:absolute;right:10px;top:10px;background:rgba(23,39,66,.8);color:#fff;border-radius:999px;padding:4px 10px;font-size:13px;font-weight:800">1 of 2 ›</span><span style="position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center"><i style="width:8px;height:8px;border-radius:4px;background:#fff"></i><i style="width:8px;height:8px;border-radius:4px;background:rgba(255,255,255,.5)"></i></span>`);
    const c = document.querySelector(".cook-mode .cook-card") || document.querySelector(".cook-mode"); const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = "New, cook mode, step 1: the step's pictures one after another. Swipe, or tap 1 of 2. The first one is the one the recipe page and the video use."; c.insertAdjacentElement("afterend", d); }, { NOTE, mark });
  await p.waitForTimeout(300); await p.screenshot({ path: `${R}/rdt276d2.png` }); console.log("shot rdt276d2"); await p.context().close();
  // e. now: the recipe page, the steps
  p = await open();
  await note(p, "Now (0.3.125), the recipe page, the steps: a tap on a step adds or changes its picture, one photo at a time. Five steps are five trips to the gallery.", ".rq-steps");
  await shot(p, "rdt276e", ".bnote");
  // f. new: Add photos to the steps
  p = await open();
  await p.evaluate(({ mark }) => { const s = document.querySelector(".rq-steps"), ol = s.querySelector("ol"); (ol || s).insertAdjacentHTML("afterend", `<div class="add-many" style="${mark};padding:8px;margin:10px 0"><button class="pill pill-wide" style="min-height:48px">🖼️ Add photos to the steps</button><small style="display:block;margin-top:6px;font-size:13px;color:#53627f;line-height:1.45">Pick several at once from your phone. All of them are kept in this recipe's photos. Then you place them on the steps.</small></div>`); }, { mark });
  await note(p, "New, the recipe page, under the steps: Add photos to the steps opens the phone's gallery to pick several at once. Every picked photo is kept in the recipe's photos, on a step or not.", ".add-many");
  await shot(p, "rdt276f", ".bnote", 1000);
  // g. new: the photos on their steps, to check before saving
  const th = (pic, sel) => `<img src="${pic}" style="width:56px;height:56px;object-fit:cover;border-radius:10px;flex:none;${sel ? "outline:3px solid #2a72d9;outline-offset:2px" : ""}">`;
  const rowG = (k, text, pics, sel) => `<div style="padding:10px 0;border-bottom:1px solid #e3eaf7"><div style="display:flex;gap:8px;align-items:center"><b style="width:26px;height:26px;border-radius:13px;background:#e7eefb;color:#1f5fc7;display:flex;align-items:center;justify-content:center;font-size:13px;flex:none">${k}</b><span style="flex:1;min-width:0;font-size:13.5px;line-height:1.35">${text}</span></div>
    <div style="display:flex;gap:8px;align-items:center;margin:8px 0 0 34px;flex-wrap:wrap">${pics.length ? pics.map((x, i) => th(x, sel === i)).join("") : `<span style="font-size:13px;color:#53627f">No picture yet</span>`}</div></div>`;
  const chip = (t, on) => `<button class="pill pill-small${on ? " pill-primary" : ""}" style="min-height:44px;min-width:44px;padding:0 12px">${t}</button>`;
  const ARR = `<div style="padding:12px;${F}"><button class="link" style="min-height:44px">‹ Chicken rice bowl</button><b style="font-size:22px;display:block">Photos on the steps</b>
    <small style="display:block;font-size:13.5px;color:#53627f;line-height:1.45;margin-top:4px">6 new photos, placed in the order you took them. Tap a photo to move it.</small>
    <div style="${mark};background:#fff;padding:2px 12px;margin-top:12px">${rowG(1, "Rinse basmati rice and bring it to a boil…", [PHOTO, PICS[4]])}${rowG(2, "Cut chicken breast into strips, season…", [PICS[0]])}${rowG(3, "Fry the chicken 6 minutes, turning once.", [PICS[1], PICS[2]], 1)}
      <div style="background:#eef4ff;border-radius:12px;padding:10px;margin:8px 0"><b style="font-size:13.5px">Move this photo to</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${chip("1")}${chip("2")}${chip("3", true)}${chip("4")}${chip("5")}${chip("No step")}</div></div>
      ${rowG(4, "Add the garlic and spinach and stir 2 minutes.", [])}${rowG(5, "Serve the chicken and spinach on the rice.", [PICS[3]])}
      <div style="padding:10px 0"><b style="font-size:13.5px">On no step</b><small style="display:block;font-size:13px;color:#53627f;line-height:1.4">Kept in the recipe's photos.</small><div style="display:flex;gap:8px;margin-top:8px">${th(PICS[2])}</div></div></div>
    <button class="pill pill-primary pill-wide" style="min-height:48px;margin-top:12px">Save 6 photos</button><button class="link" style="min-height:44px">Cancel</button></div>`;
  p = await open(); await screen(p, ARR);
  await note(p, "New, Photos on the steps, opened from the recipe page after picking. All photos are kept in the recipe's photos. Here they sit on the steps in the order you took them, two on one step if you took two. Tap a photo to move it to another step, or to No step. The step's old picture stays. Nothing is saved until Save.", "main > div", "afterbegin");
  await shot(p, "rdt276g", null, 1420);
  // h. now: the recipe's photos and the step pictures are two stores
  await b.close(); server.kill();
})();
