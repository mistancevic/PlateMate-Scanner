// Board DT254 (Coach Milan 7 November 12:16 to 12:28, he picked C): the recipe's cover is its video. The step pictures and
// the cover play once, without sound, when the page opens, then it rests on the cover with Again under it. "Now": 0.3.103
// (main dist). "New": the change drawn in by DOM, blue outline and yellow note. Drawn in English.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3498", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const jpg = (f) => "data:image/jpeg;base64," + fs.readFileSync(f).toString("base64");
const PICS = [1, 2, 3, 4, 5, 6].map((n) => jpg(`${R}/dt254_step${n}.jpg`)), COVER = jpg(ROOT + "/tests/flows/plate.jpg");
const PLAY = `<span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.95);color:#2e7be8;font-size:26px;display:grid;place-items:center;box-shadow:0 2px 10px rgba(0,0,0,.25);outline:3px solid #2e7be8;outline-offset:3px">▶</span>`;
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[160, food("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0)], [80, food("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3)], [120, food("s", "Spinach, fresh", 23, 2.9, 3.6, 0.4, 2.2)], [8, food("o", "Olive oil", 884, 0, 0, 100, 0)], [6, food("g", "Garlic", 149, 6.4, 33, 0.5, 2.1)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Rinse [[i:r|rice]] and bring it to the boil in 200 ml water. Cover and cook on low heat for 12 minutes.", "Cut [[i:c|chicken]] into strips. Season with salt and pepper.", "Slice [[i:g|garlic]] thin.", "Heat [[i:o|olive oil]] in a pan on medium high heat. Fry the chicken 6 minutes, turning once.", "Add [[i:s|spinach]] and the garlic. Stir 2 minutes, until the spinach wilts.", "Put the rice in a bowl and the chicken and spinach on top."];
seed.meals = [{ id: "m-bowl", title: "Chicken rice bowl", items, portion: 374, steps: STEPS, stepPics: PICS, stepPicMeta: STEPS.map((t) => ({ by: "me", step: t })), photos: [COVER], savedAt: "2026-11-01T18:00:00Z" }];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (path) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB", timezoneId: "Europe/Berlin" });
    const p = await ctx.newPage(); await p.clock.setFixedTime(new Date("2026-11-07T12:20:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    for (const r of ["cover", "dish", "members/foods**"]) await p.route(`**/api/${r}`, (x) => x.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + path); await p.waitForTimeout(1800);
    if (/could not be read/.test(await p.locator("body").innerText())) throw new Error("seed not valid");
    await p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, [class*=fab]")) t.style.display = "none"; });
    return p;
  };
  const shot = async (p, name, top) => { await p.evaluate((y) => window.scrollTo(0, y), top); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
  const topOf = (p, sel, off = 140) => p.evaluate(({ sel, off }) => { const e = document.querySelector(sel); return e ? Math.max(0, e.getBoundingClientRect().top + window.scrollY - off) : 0; }, { sel, off });
  const note = (p, t, sel, after = false) => p.evaluate(({ t, NOTE, sel, after }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const e = document.querySelector(sel) || document.querySelector("main"); after ? e.after(d) : e.before(d); }, { t, NOTE, sel, after });

  // Now: the cover is a photo; Watch the steps is a card further down
  let p = await open("/my-recipes/m-bowl");
  await note(p, "Now (0.3.103): the cover is a photo. Watch the steps is a separate card under the photos.", ".rq-hero");
  await shot(p, "r254a", await topOf(p, ".bnote", 70)); await p.context().close();
  p = await open("/my-recipes/m-bowl");
  await note(p, "Now: the video is here, below the foods. You find it only when you scroll.", ".watch-card");
  await shot(p, "r254a2", await topOf(p, ".bnote", 70)); await p.context().close();

  // New: it plays once when the page opens, without sound; nothing over the picture, the step under it
  const under = (k, n, playing) => `<div class="bnew" style="${mark};display:grid;gap:8px;padding:8px 4px;margin:6px 0 4px">
    <div style="display:flex;gap:4px">${Array.from({ length: n + 1 }, (_, j) => `<span style="flex:1;height:5px;border-radius:3px;background:${j < k ? "var(--brand)" : j === k && playing ? "linear-gradient(90deg,var(--brand) 55%,var(--line) 55%)" : j === k ? "var(--brand)" : "var(--line)"}"></span>`).join("")}</div>
    ${playing ? `<small style="font-weight:900;letter-spacing:.05em;color:var(--muted)">STEP ${k + 1} OF ${n} · NO SOUND · TAP FOR THE WORDS</small>`
      : `<div style="display:flex;gap:8px;align-items:center"><button class="link" style="min-height:44px">Watch with the words ›</button><small class="muted" style="margin-left:auto">${n} steps · 30 s</small></div>`}</div>`;
  p = await open("/my-recipes/m-bowl");
  await p.evaluate(({ src, html }) => { const h = document.querySelector(".rq-hero"); h.querySelector("img").src = src; for (const s of h.querySelectorAll("span")) s.remove(); h.insertAdjacentHTML("afterend", html); const wc = document.querySelector(".watch-card"); if (wc) wc.remove(); }, { src: PICS[1], html: under(1, 6, true) });
  await note(p, "New: the page opens and the cover plays the steps once, one picture every 5 seconds, without sound. Under it, which step. A tap opens the player with the words.", ".rq-hero");
  await shot(p, "r254b", await topOf(p, ".bnote", 70)); await p.context().close();

  // New: it rests on the cover
  p = await open("/my-recipes/m-bowl");
  await p.evaluate(({ html, PLAY }) => { const h = document.querySelector(".rq-hero"); h.style.position = "relative"; h.insertAdjacentHTML("beforeend", PLAY); h.insertAdjacentHTML("afterend", html); const wc = document.querySelector(".watch-card"); if (wc) wc.remove(); }, { html: under(6, 6, false), PLAY });
  await note(p, "New: after the last step it rests on the cover, the finished meal, with ▶ in the middle (Coach Milan 13:06): a tap plays it again. Watch with the words opens the player. The separate Watch the steps card goes: the cover is the video. A phone set to reduce motion does not play it by itself; ▶ Play instead.", ".rq-hero");
  await shot(p, "r254c", await topOf(p, ".bnote", 70)); await p.context().close();

  // Recipes: a recipe with a video says so on its tile, next to the words, never over the picture
  p = await open("/my-recipes");
  await note(p, "Now (0.3.103): the tile shows the cover only.", ".recipe-tile");
  await shot(p, "r254d", await topOf(p, ".bnote", 70)); await p.context().close();
  p = await open("/my-recipes");
  await p.evaluate((PLAY) => { const t = document.querySelector(".recipe-tile"); const im = t.querySelector("img"); const box = im.parentElement === t ? (() => { const s = document.createElement("span"); s.style.cssText = "position:relative;display:block"; im.before(s); s.append(im); return s; })() : im.parentElement; box.style.position = "relative"; box.insertAdjacentHTML("beforeend", PLAY); }, PLAY);
  await note(p, "New (Coach Milan 13:06): a recipe with a steps video has ▶ in the middle of its cover, on its tile and on its page.", ".recipe-tile");
  await shot(p, "r254e", await topOf(p, ".bnote", 70)); await p.context().close();
  await b.close(); server.kill();
})();
