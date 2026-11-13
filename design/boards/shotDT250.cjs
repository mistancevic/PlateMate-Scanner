// Board DT250 (Coach Milan 7 November 07:58 to 08:00): a recipe in your language. Earlier: boards DT248 and DT249 (05:54 to 06:03). Earlier: boards DT240 to DT246 (Coach Milan 6 November 10:14 to 10:39): his test of the Plate, one item at a time. "Now" pictures are
// his own screenshots (rs/r240a, r242a, r245a, r246a). "New" pictures: 0.3.94 (main dist) with a plate read from a photo of a
// finished dish, the change drawn in by DOM, blue outline and yellow note. In English: boards are drawn in English.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3416", U = `http://127.0.0.1:${PORT}`;
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
    if (/could not be read/.test(await p.locator("body").innerText())) throw new Error("seed not valid");
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

  // ---- DT250: a recipe in your language. The app in English, a recipe written in Srpski ----
  const B1 = [[250, F("be", "White beans, cooked", 127, 8.7, 0.5, 23)], [120, F("on", "Onion", 40, 1.1, 0.1, 9)], [15, F("oo", "Sunflower oil", 884, 0, 100, 0)], [5, F("pa", "Sweet paprika", 282, 14, 13, 54)]].map(([g, f]) => ({ id: f.id, grams: g, food: f, locked: false }));
  const SR_STEPS = ["Iseci luk na tanke polukrugove i propržite ga na ulju 10 minuta, dok ne omekša.", "Skloni sa vatre, umešaj papriku pa dodaj pasulj.", "Sve stavi u vatrostalnu posudu i peci 40 minuta na 200 °C, dok se gore ne zapeče."];
  const EN_STEPS = ["Slice the onion into thin half rings and fry it in the oil for 10 minutes, until soft.", "Take it off the heat, stir in the paprika, then add the beans.", "Put it all in a baking dish and bake for 40 minutes at 200 °C, until the top is crisp."];
  const pre = { ...seed, meals: [{ id: "m-pr", title: "Prebranac", items: B1, portion: 390, steps: SR_STEPS, savedAt: at(18, 0, 3) }] };
  const page = async () => { const p = await open(pre, "/my-recipes/m-pr"); await p.waitForTimeout(800); return p; };
  const steps = (p, list, mark) => p.evaluate(({ list, mark }) => { const ol = document.querySelector(".rq-steps .rp-steps"); if (!ol) return; [...ol.querySelectorAll(".rp-step-text")].forEach((d, k) => { if (list[k]) d.textContent = list[k]; }); if (mark) ol.style.cssText += ";" + mark; }, { list, mark });
  // a: Now, the recipe in Srpski
  let p = await page();
  await note(p, "Now (0.3.98): a recipe written in another language than the app's stays as it is written. Cook mode reads it in its own language.", ".rq-steps");
  await shot(p, "r250a", await topOf(p, ".bnote", 110)); await p.context().close();
  // b: the offer on the page
  p = await page();
  await chefCard(p, ".rq-steps", `<b style="font-size:16px;line-height:1.35">This recipe is in Srpski. Show it in English?</b>
    <span style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-primary" style="flex:1">Show it in English</button><button class="pill" style="flex:1">Keep it in Srpski</button></span>
    <small class="muted">Chef Mealan translates it once and keeps it. The original stays, a tap away.</small>`);
  await note(p, "New: an older recipe in another language gets one line on its page.", ".bnew");
  await shot(p, "r250b", await topOf(p, ".bnote", 110)); await p.context().close();
  // c: translated, with the switch
  p = await page();
  await p.evaluate(({ mark }) => { const h = document.querySelector("main h1, main h2"); const title = [...document.querySelectorAll("main *")].find((e) => e.children.length === 0 && e.textContent.trim() === "Prebranac"); if (title) title.textContent = "Prebranac (baked beans)";
    const sw = document.createElement("div"); sw.className = "bnew"; sw.style.cssText = mark + ";display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0;padding:8px";
    sw.innerHTML = `<button class="choice on" style="min-height:44px">English</button><button class="choice" style="min-height:44px">Original, Srpski</button><small class="muted" style="flex-basis:100%">Translated by Chef Mealan. Amounts, times and temperatures as written.</small>`;
    document.querySelector(".rq-steps").before(sw); }, { mark });
  await steps(p, EN_STEPS, mark);
  await note(p, "New: the recipe in English, kept with it; one tap shows the original. Each food in a step keeps its amount.", ".bnew");
  await shot(p, "r250c", await topOf(p, ".bnote", 110)); await p.context().close();
  // d: Start cooking asks once
  p = await page();
  await chefCard(p, ".rq-start, .rq-steps", `<b style="font-size:16px;line-height:1.35">This recipe is in Srpski. Cook it in English?</b>
    <span style="display:flex;gap:8px;flex-wrap:wrap"><button class="pill pill-primary" style="flex:1">Cook it in English</button><button class="pill" style="flex:1">Cook it as written</button></span>
    <small class="muted">Cook mode reads the steps out loud, in a voice of the language you pick.</small>`, true);
  await note(p, "New: Start cooking asks once, for a recipe not yet in your language (your b).", ".bnew");
  await shot(p, "r250d", await topOf(p, ".bnote", 110)); await p.context().close();
  // e: a new recipe from a link comes in already in your language
  p = await page();
  await p.evaluate(({ mark }) => { const sw = document.createElement("p"); sw.className = "small bnew"; sw.style.cssText = mark + ";background:var(--tint);padding:10px 12px;margin:8px 0;font-size:14px;line-height:1.45";
    sw.innerHTML = "<b>From a link, in English.</b> The page is in Srpski; Chef Mealan read it in your language. <a href='#'>Original ›</a>"; document.querySelector(".rq-steps").before(sw); }, { mark });
  await steps(p, EN_STEPS, "");
  await note(p, "New: a recipe from a link or a screenshot comes in already in your language; the original is kept (your c).", ".bnew");
  await shot(p, "r250e", await topOf(p, ".bnote", 110)); await p.context().close();
  await b.close(); server.kill();
})();
