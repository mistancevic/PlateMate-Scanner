// Board DT281 (Coach Milan 11 November 08:12 to 08:21, Draw): photo first. On the recipe page and in Make's tick list a
// step's photos come before its words. The number (or the tick) stays at the top left, so a step with no photo looks as today.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3712", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[190, food("c", "Chicken breast", 120, 22.5, 0, 2.6)], [95, food("r", "Basmati rice", 356, 8.5, 78, 0.9)], [145, food("s", "Spinach", 23, 2.9, 3.6, 0.4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Rinse [[i:r|basmati rice]] and cook it 12 minutes.", "Cut [[i:c|chicken breast]] into strips and season.", "Fry the chicken 6 minutes, turning once.", "Add the [[i:s|spinach]] and stir 2 minutes.", "Serve the chicken and spinach on the rice."];
const W = (n) => "data:image/webp;base64," + fs.readFileSync(`${ROOT}/public/landing/hero/${n}-m.webp`).toString("base64");
const P = { curry: W("curry"), meat: W("meatballs"), ques: W("quesadilla"), sq: W("squares"), waf: W("waffle") };
const me = (k) => ({ by: "me", step: STEPS[k] });
const meal = { id: "m-b", title: "Chicken rice bowl", items, portion: 430, steps: STEPS, savedAt: "2026-11-07T22:58:00Z", photo: P.waf, photos: [],
  stepPics: [P.ques, P.meat, null, null, P.curry, P.sq], stepPicMeta: [me(0), me(1), null, null, me(4), me(4)] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1100 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { ...seed, meals: [meal] });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-b"); await p.waitForTimeout(1500); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, tall) => { if (tall) await p.setViewportSize({ width: 390, height: tall }); await p.evaluate((sel) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - 90 : 0); }, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const toMake = async (p) => {
    await p.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await p.waitForTimeout(1300);
    const cm = p.locator(".cook-mode"); await cm.waitFor({ timeout: 8000 });
    for (const n of ["Buttons only", "Step 1 ›"]) { const x = cm.getByRole("button", { name: n, exact: true }); if (await x.count()) { await x.click(); await p.waitForTimeout(300); } }
    await cm.getByRole("button", { name: /Close/ }).click(); await p.waitForTimeout(600);
  };
  // a. now: the recipe page, the steps
  let p = await open();
  await note(p, "Now (0.3.130), the recipe page, the steps: the words lead, and the step's photo is a small square to the right.", ".rq-steps");
  await shot(p, "rdt281a", ".bnote", 880);
  // b. new: the recipe page, photo first
  p = await open();
  await p.evaluate(({ mark }) => { [...document.querySelectorAll(".rp-steps li")].forEach((li, i) => { const pic = li.querySelector(".rq-step-pic"), text = li.querySelector(".rp-step-text"); if (!pic || !text) return;
    const img = pic.querySelector("img"), more = pic.querySelector(".more"); const col = document.createElement("div"); col.style.cssText = "flex:1;min-width:0;display:flex;flex-direction:column;gap:8px";
    const box = document.createElement("div"); box.style.cssText = "position:relative;border-radius:12px;overflow:hidden" + (i === 0 ? ";" + mark : "");
    box.innerHTML = `<img src="${img.src}" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block">` + (more ? `<span style="position:absolute;right:8px;top:8px;background:rgba(23,39,66,.82);color:#fff;border-radius:999px;padding:4px 10px;font-size:13px;font-weight:800;white-space:nowrap">1 of 2 ›</span>` : "");
    li.insertBefore(col, text); col.append(box, text); pic.remove(); li.style.alignItems = "flex-start"; }); }, { mark });
  await note(p, "New, the recipe page, the steps: the number stays at the top left. To its right the photo, wide, then the words. Two or more photos: swipe, or tap 1 of 2. A step with no photo is its number and words, as today. A tap on the photo opens the step's photos.", ".rq-steps");
  await shot(p, "rdt281b", ".bnote", 1480);
  // c. now: Make's tick list
  p = await open(); await toMake(p);
  await note(p, "Now (0.3.130), Make, the tick list: the words lead, and the step's photos sit in a row under them.", ".mk-step");
  await shot(p, "rdt281c", ".bnote", 900);
  // d. new: Make's tick list, photos first. Coach Milan 11 November 17:27: + Photo above the words too, with or without photos
  p = await open(); await toMake(p);
  await p.evaluate(({ mark }) => { [...document.querySelectorAll(".mk-step")].forEach((st, i) => { const check = st.querySelector(".mk-check"); if (!check) return;
    const words = check.querySelector("span:last-child"); let pics = st.querySelector(".mk-pics");
    if (!pics) { const add = st.querySelector(".mk-row > .mk-photo.empty"); pics = document.createElement("div"); pics.className = "mk-pics"; if (add) pics.appendChild(add); }
    pics.style.marginLeft = "0"; pics.style.marginBottom = "8px"; words.style.display = "block"; words.insertBefore(pics, words.firstChild); check.style.alignItems = "flex-start";
    if (i === 0 || i === 2) pics.style.cssText += ";" + mark; }); }, { mark });
  await note(p, "New, Make, the tick list: the tick stays at the top left. To its right, first the step's photos and ＋ Photo, then the words. A step with no photo has ＋ Photo in the same place, above its words.", ".mk-step");
  await shot(p, "rdt281d", ".bnote", 900);
  await b.close(); server.kill();
})();
