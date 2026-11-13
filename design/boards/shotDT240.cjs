// Boards DT240 to DT246 (Coach Milan 6 November 10:14 to 10:39): his test of the Plate, one item at a time. "Now" pictures are
// his own screenshots (rs/r240a, r242a, r245a, r246a). "New" pictures: 0.3.94 (main dist) with a plate read from a photo of a
// finished dish, the change drawn in by DOM, blue outline and yellow note. In English: boards are drawn in English.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3412", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.meals = []; seed.items = [];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(ROOT + "/tests/flows/plate.jpg").toString("base64");
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = (id, name, calories, protein, fats, carbs, fiber = 0) => ({ ...seed.foods[0], id, name, brand: "", source: "estimate", calories, protein, fats, carbs, fiber, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const est = (g) => ({ low: Math.round(g * 0.8), high: Math.round(g * 1.25) });
const PLATE = [[180, F("ch", "Chicken breast, cooked", 165, 31, 3.6, 0)], [160, F("cs", "Cream sauce, savory", 150, 2.5, 13, 6)], [60, F("mv", "Mushrooms and vegetables, braised", 45, 2, 2.5, 4, 1.5)], [25, F("rp", "Roasted red pepper", 30, 1, 0.3, 6, 1.5)], [35, F("sc", "Sour cream", 193, 2.4, 19, 3.6)]]
  .map(([g, f]) => ({ id: f.id, grams: g, food: f, est: est(g), fromPhoto: true }));
const at = (h, m, d = 6) => new Date(2026, 10, d, h, m).toISOString();
const plateState = (more = {}) => ({ ...seed, __read: true, ...more });
const READ = { dish: "Balkan Baked Tava", foods: PLATE.map((i) => ({ name: i.food.name, grams: i.grams, low: i.est.low, high: i.est.high, calories: i.food.calories, protein: i.food.protein, fats: i.food.fats, carbs: i.food.carbs, fiber: i.food.fiber || 0, confidence: "medium" })), unsure: null };
const MEAL = { options: [
  { kitchen: "Balkan", title: "Creamy mushroom chicken with roasted potatoes", why: "Roasted potatoes next to the creamy chicken.", for_cooking: ["salt"], adds: [{ name: "Potatoes, raw", grams: 200, calories: 77, protein: 2, fats: 0.1, carbs: 17, base: true }] },
  { kitchen: "Italian", title: "Creamy chicken and mushroom penne with sweet peas", why: "Penne through the sauce.", for_cooking: [], adds: [{ name: "Penne, dry", grams: 70, calories: 359, protein: 12.5, fats: 1.5, carbs: 71, base: true }, { name: "Peas", grams: 60, calories: 81, protein: 5.4, fats: 0.4, carbs: 14, base: false }] },
  { kitchen: "Mediterranean", title: "Herbed chicken with bulgur and sautéed zucchini", why: "Bulgur and zucchini.", for_cooking: [], adds: [{ name: "Bulgur, dry", grams: 60, calories: 342, protein: 12, fats: 1.3, carbs: 76, base: true }, { name: "Zucchini", grams: 120, calories: 17, protein: 1.2, fats: 0.3, carbs: 3, base: false }] },
] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const open = async (state, path = "/plate", lang = null, clock = "2026-11-05T18:10:00") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB", timezoneId: "Europe/Berlin", permissions: ["camera"] });
    const p = await ctx.newPage(); await p.clock.setFixedTime(new Date(clock));
    await p.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      if (lang) localStorage.setItem("chefmealan-lang", lang);
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { s: state, lang });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    for (const r of ["cover", "dish", "members/foods**"]) await p.route(`**/api/${r}`, (x) => x.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/meal", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MEAL) }));
    await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }));
    await p.goto(U + path); await p.waitForTimeout(1800);
    if (state.__read) { await p.goto(U + "/plate"); await p.waitForTimeout(1500); await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(400); if (await p.locator(".cam-analyze").count()) await p.locator(".cam-analyze").click(); await p.waitForTimeout(2500); if (path !== "/plate") { await p.goto(U + path); await p.waitForTimeout(1500); } }
    await p.evaluate((PHOTO) => { for (const t of document.querySelectorAll(".toast, .chef-fab, [class*=fab]")) t.style.display = "none";
      for (const im of document.querySelectorAll("main img")) if (/^data:image\/(jpeg|png|webp)/.test(im.src) && im.naturalWidth > 100) im.src = PHOTO; }, PHOTO);
    return p;
  };
  const shot = async (p, name, top) => { await p.evaluate((y) => window.scrollTo(0, y), top); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
  const topOf = (p, sel, off = 140) => p.evaluate(({ sel, off }) => { const e = document.querySelector(sel); return e ? Math.max(0, e.getBoundingClientRect().top + window.scrollY - off) : 0; }, { sel, off });
  const byText = (p, re) => p.evaluate((re) => { const rx = new RegExp(re); const e = [...document.querySelectorAll("button, a, b, small, p, h1, h2, span")].find((x) => rx.test((x.innerText || "").trim())); if (!e) return null; e.setAttribute("data-hit", "1"); return true; }, re.source);
  const note = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const e = document.querySelector(sel) || document.querySelector("main"); e.before(d); }, { t, NOTE, sel });
  // a Chef Mealan card in the app's own look (the line and its buttons)
  const chefCard = (p, sel, html, after = false) => p.evaluate(({ sel, html, mark, after }) => { const c = document.createElement("section"); c.className = "card bnew"; c.style.cssText = mark + ";display:grid;gap:10px;padding:14px";
    c.innerHTML = `<small style="font-weight:900;letter-spacing:.06em;color:var(--brand-text)">CHEF MEALAN</small>${html}`; const e = document.querySelector(sel) || document.querySelector("main > *"); after ? e.after(c) : e.before(c); }, { sel, html, mark, after });

  // DT240 new: the cook of Test asks once, when the photo plate came in
  const cook = { id: "ck1", startedAt: at(16, 0, 5), title: "Test", stage: "make", plate: { items: [], title: "Test" }, ui: { ticks: ["s0"] }, steps: 2 };
  let p = await open(plateState({ cook }));
  await p.evaluate(() => { for (const s of document.querySelectorAll(".cook-strip")) s.style.display = "none"; });
  await chefCard(p, ".plate-card, .in-ways, main section.card", `<b style="font-size:16px;line-height:1.35">You were cooking Test, step 2 of 2. A new plate came in. Go on with Test, or end it?</b>
    <span style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-primary" style="flex:1">Go on with Test</button><button class="pill" style="flex:1">End it</button></span>
    <small class="muted">End it keeps nothing of Test's steps. Your new plate stays as it is.</small>`);
  await note(p, "New: when a new plate comes in while a cook is open, Chef Mealan asks once. The strip goes away after the answer.", ".bnew");
  await shot(p, "r240b", await topOf(p, ".bnote", 120)); await p.context().close();

  // DT241: a finished dish from a photo is never cooked: no Prepare it
  p = await open(plateState());
  let y = await topOf(p, ".ways-out", 420); await note(p, "Now (0.3.94): a plate read from a photo of a finished dish offers Prepare it ›, which leads to cooking.", ".ways-out");
  await p.evaluate((mark) => { const w = document.querySelector(".ways-out"); if (w) w.style.cssText += ";" + mark; }, mark);
  await shot(p, "r241a", await topOf(p, ".bnote", 360)); await p.context().close();
  p = await open(plateState());
  await p.evaluate((mark) => { const w = document.querySelector(".ways-out"); if (!w) return; for (const x of w.querySelectorAll("button")) if (/Prepare/.test(x.textContent)) x.remove(); w.style.cssText += ";" + mark; }, mark);
  await note(p, "New: a finished dish from a photo can be eaten, saved for later or changed. No Prepare it, no Start cooking. They show only for a recipe with steps, or the raw foods of a recipe.", ".ways-out");
  await shot(p, "r241b", await topOf(p, ".bnote", 360)); await p.context().close();

  // DT242 new: the answer was lost while away: read again once, then this
  p = await open({ ...seed, items: [], title: "" });
  await chefCard(p, "main section.card, main .card", `<span style="display:flex;gap:12px;align-items:center"><img src="${PHOTO}" style="width:64px;height:64px;object-fit:cover;border-radius:10px"><b style="font-size:16px;line-height:1.35">The connection was lost. Your photo is kept.</b></span>
    <small class="muted">Chef Mealan read it again by himself when you came back. That did not work either.</small>
    <button class="pill pill-primary">Try again</button>`);
  await note(p, "New: you left the app while the photo was read. Back in the app, Chef Mealan reads it again once by himself; only when that fails too, this card. Never Failed to fetch.", ".bnew");
  await shot(p, "r242b", await topOf(p, ".bnote", 120)); await p.context().close();

  // DT244: food names from a photo in the app's language (Srpski here), English kept in the background
  p = await open(plateState(), "/plate", "sr-Latn");
  await note(p, "Now (0.3.94), in Srpski: the foods the AI read keep its English names.", ".plate-card, .rows, main section.card");
  await shot(p, "r244a", await topOf(p, ".bnote", 140));
  const SR = { "Chicken breast": "Pileća prsa", "Cream sauce": "Krem sos", "Mushrooms and vegetables": "Pečurke i povrće", "Roasted red pepper": "Pečena crvena paprika", "Sour cream": "Kisela pavlaka" };
  await p.evaluate(({ SR, mark }) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { for (const [a, b] of Object.entries(SR)) if (n.textContent.includes(a)) { n.textContent = n.textContent.replace(a, b); const e = n.parentElement.closest(".row-food, .food-row, li, .row") || n.parentElement; e.style.outline = "3px solid #2e7be8"; e.style.outlineOffset = "2px"; } } }, { SR, mark });
  await p.evaluate(() => document.querySelector(".bnote").remove());
  await note(p, "New: the AI names them in the app's language, also in Travel mode. The English name stays in the background, so search and the food table still find each food.", ".plate-card, .rows, main section.card");
  await shot(p, "r244b", await topOf(p, ".bnote", 140)); await p.context().close();

  // DT245 new: asked anyway, an idea that does not fit gets Put it on the plate
  p = await open(plateState());
  await chefCard(p, ".ways-out", `<small class="muted">You asked for ideas anyway. Chef Mealan looked for small additions, a salad or vegetables.</small>
    <section class="card mm-card mm-fail" style="margin:0"><b class="mm-title">Creamy mushroom chicken with roasted potatoes</b><small class="mm-why">Did not fit: 884 kcal, over the 619 to 757 kcal of this meal, even with 200 g potatoes, raw.</small>
    <button class="pill pill-small" style="align-self:stretch;margin-top:8px">Put it on the plate</button></section>`);
  await p.evaluate(() => { const w = document.querySelector(".ways-out"); if (w) w.style.display = "none"; });
  await note(p, "New: an idea that does not fit still says why, and gets Put it on the plate. You decide.", ".bnew");
  await shot(p, "r245c", await topOf(p, ".bnote", 360)); await p.context().close();
  p = await open(plateState());
  await p.evaluate((mark) => { const w = document.querySelector(".ways-out"); if (w) w.style.display = "none"; }, mark);
  await chefCard(p, ".ways-out", `<b style="font-size:16px;line-height:1.35">Your plate already fills this dinner: 714 kcal, in its range.</b>
    <span style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-primary" style="flex:1">I ate it</button><button class="pill" style="flex:1">Save for later</button></span>
    <button class="link" style="justify-self:start">Ideas anyway ›</button>`);
  await note(p, "New: when the plate already fills the meal, Fit to my target says so first. Ideas come only when you ask, and then as small additions.", ".bnew");
  await shot(p, "r245b", await topOf(p, ".bnote", 360)); await p.context().close();

  // DT246 new: a recorded plate says where its changes go
  p = await open(plateState({ photo: { image: PHOTO, at: at(17, 20, 5), who: "ate" } }), "/plate", null, "2026-11-06T10:20:00");
  await p.evaluate((mark) => { const h = document.querySelector("main h1, main h2, .meal-name"); const d = document.createElement("p"); d.className = "small"; d.style.cssText = mark + ";background:#e8f0fd;padding:10px 12px;margin:8px 0;font-size:15px";
    d.innerHTML = "<b>Recorded: Thursday, snack, 17:20.</b> Your changes here go there too."; (h ? h.parentElement : document.querySelector("main")).after ? (h || document.querySelector("main > *")).after(d) : null; }, mark);
  await note(p, "New: a plate you already recorded says so, and every change you make goes to that meal: Thursday's snack shows what the Plate shows.", "main p.small[style]");
  await shot(p, "r246b", await topOf(p, ".bnote", 100)); await p.context().close();
  await b.close(); server.kill();
})();
