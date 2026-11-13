// Board DT280 (Coach Milan 11 November 07:46, Yes, draw it): a step photo can be the cover without a second upload; and
// Photos on the steps says how many photos are on no step before Save.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3713", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[190, food("c", "Chicken breast", 120, 22.5, 0, 2.6)], [95, food("r", "Basmati rice", 356, 8.5, 78, 0.9)], [145, food("s", "Spinach", 23, 2.9, 3.6, 0.4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Rinse [[i:r|basmati rice]] and cook it 12 minutes.", "Cut [[i:c|chicken breast]] into strips and season.", "Fry the chicken 6 minutes, turning once.", "Add the [[i:s|spinach]] and stir 2 minutes.", "Serve the chicken and spinach on the rice."];
const W = (n) => "data:image/webp;base64," + fs.readFileSync(`${ROOT}/public/landing/hero/${n}-m.webp`).toString("base64");
const P = { curry: W("curry"), meat: W("meatballs"), ques: W("quesadilla"), sq: W("squares"), waf: W("waffle") };
const me = (k) => ({ by: "me", step: STEPS[k] });
const meal = (cover) => ({ id: "m-b", title: "Chicken rice bowl", items, portion: 430, steps: STEPS, savedAt: "2026-11-07T22:58:00Z", photo: cover, photos: cover === P.curry ? [P.waf] : [],
  stepPics: [P.ques, P.meat, null, null, P.curry, P.sq], stepPicMeta: [me(0), me(1), null, null, me(4), me(4)] });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (cover) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { ...seed, meals: [meal(cover)] });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-b"); await p.waitForTimeout(1500); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, tall) => { if (tall) await p.setViewportSize({ width: 390, height: tall }); await p.evaluate((sel) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - 90 : 0); document.querySelector(".sp-sheet")?.scrollTo(0, 0); }, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  // a. now: the recipe's photos, with the row On the steps
  let p = await open(P.waf);
  await note(p, "Now (0.3.130), the recipe page, its photos: the cover and the row On the steps. To make the finished bowl (step 5) the cover, you would add that photo a second time here.", ".rq-on-steps");
  await shot(p, "rdt280a", ".rq-thumbs", 1000);
  // b. new: one gallery, and the cover is chosen in it. Coach Milan 11 November 18:07: in the gallery should be the cover
  // selection; no reason to have any other place for that
  const GAL = [[P.waf, null], [P.ques, 1], [P.meat, 2], [P.curry, 5], [P.sq, 5]];
  const th = (src, step, k, sel) => `<button style="position:relative;flex:none;width:76px;height:76px;padding:0;border:0;border-radius:12px;overflow:hidden;background:none${sel ? ";outline:3px solid #1f5fc7;outline-offset:2px" : ""}"><img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block">${k === 0 ? `<span style="position:absolute;left:4px;bottom:4px;background:#1f5fc7;color:#fff;border-radius:999px;padding:1px 7px;font-size:12px;font-weight:800">Cover</span>` : ""}${step ? `<span style="position:absolute;right:4px;top:4px;width:22px;height:22px;border-radius:11px;background:rgba(23,39,66,.85);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center">${step}</span>` : ""}</button>`;
  const chip = (t, on) => `<button class="pill pill-small${on ? " pill-primary" : ""}" style="min-height:44px;min-width:44px;padding:0 12px">${t}</button>`;
  const PANEL = `<div style="background:#eef4ff;border-radius:12px;padding:12px;margin-top:10px;display:flex;flex-direction:column;gap:10px;font-family:Nunito,system-ui,sans-serif;color:#172742">
    <button class="pill pill-primary" style="min-height:48px">Make it the cover</button>
    <div><b style="font-size:14px">On step</b><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${[1, 2, 3, 4, 5].map((k) => chip(String(k), k === 5)).join("")}${chip("No step")}</div></div>
    <button class="link" style="align-self:flex-start;min-height:44px;color:#b3261e">Delete this photo</button></div>`;
  for (const [name, sel, text] of [["rdt280b", -1, "New, the recipe page: one gallery, every photo of the recipe. The first is the cover. A small number shows the step a photo is on. The row On the steps is gone. 12 photos per recipe."],
    ["rdt280c", 3, "New, a tap on a photo in the gallery: under the row, Make it the cover, the step it is on (or No step), Delete. The cover is chosen here and nowhere else. A tap on a step's photo lower on the page brings you here, with that photo picked."]]) {
    p = await open(P.waf);
    await p.evaluate(({ mark, html, panel }) => { const t = document.querySelector(".rq-thumbs"); t.innerHTML = html; t.style.cssText = `display:flex;gap:10px;flex-wrap:wrap;padding:6px;${mark}`; t.hidden = false;
      document.querySelector(".rq-on-steps")?.remove(); const hint = t.nextElementSibling; if (hint && hint.tagName === "SMALL") hint.remove();
      t.insertAdjacentHTML("afterend", (panel || "") + `<small style="display:block;font-size:13px;color:#53627f;margin:8px 4px 0;line-height:1.45">5 of 12 photos. The first is the cover. A number shows the step a photo is on. Tap a photo to change it.</small>`); },
      { mark, panel: sel >= 0 ? PANEL : "", html: GAL.map(([src, st], k) => th(src, st, k, k === sel)).join("") + `<button style="flex:none;width:76px;height:76px;border:2px dashed #2a72d9;border-radius:12px;background:#eef4ff;color:#1f5fc7;font-weight:800;font-size:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px"><span style="font-size:18px">＋</span>Add</button>` });
    await note(p, text, ".rq-thumbs");
    await shot(p, name, ".bnote", 1000);
  }
  // d. new: Photos on the steps says how many are on no step
  p = await open(P.waf);
  const more = [...["curry", "meatballs", "quesadilla", "squares", "waffle"].map((n) => `${ROOT}/public/landing/hero/${n}-m.webp`), `${ROOT}/tests/flows/plate.jpg`, `${ROOT}/tests/flows/front.jpg`];
  await p.locator(".rq-steps input[type=file][multiple]").setInputFiles(more); await p.locator(".spp").waitFor({ timeout: 10000 }); await p.waitForTimeout(400);
  const n = await p.locator(".spp .spp-step").last().locator(".publish-photo").count();
  // Coach Milan 11 November 08:14 and 08:21: the photos above the step's words. The number stays at the top left; to its right
  // the photos, then the words. A step with no photo is the number and the words, as it always was.
  await p.evaluate(({ mark }) => { [...document.querySelectorAll(".spp .spp-step")].forEach((st, i) => { const pics = st.querySelector(".spp-pics"), head = st.querySelector(".spp-head"); if (!pics || !head) return;
    const words = head.querySelector("small"), col = document.createElement("div"); col.style.cssText = "flex:1;min-width:0;display:flex;flex-direction:column;gap:8px"; head.appendChild(col);
    const empty = !pics.querySelector("img"); pics.style.marginLeft = "0"; if (empty) { col.append(words, pics); } else { col.append(pics, words); } if (i === 0) col.style.cssText += ";" + mark; }); }, { mark });
  await p.evaluate(({ mark, n }) => { const save = document.querySelector(".spp .pill-wide"); save.insertAdjacentHTML("beforebegin", `<div class="loose-say" style="${mark};background:#fff3d6;color:#5a3c00;padding:10px 12px;font-size:14px;line-height:1.45;font-weight:700">${n} photos are on no step. They stay in the recipe's gallery.</div>`); }, { mark, n });
  await note(p, "New, Photos on the steps: the number stays at the top left. To its right the photos, then the words: see first, read second. A step with no photo is its number and words. Above Save, a line says how many photos are on no step; they stay in the gallery.", ".spp .loose-say", "afterend");
  await p.setViewportSize({ width: 390, height: 1560 }); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/rdt280d.png` }); console.log("shot rdt280d", n);
  await b.close(); server.kill();
})();
