// Boards DT248 and DT249 (Coach Milan 7 November 05:54 to 06:03). Earlier: boards DT240 to DT246 (Coach Milan 6 November 10:14 to 10:39): his test of the Plate, one item at a time. "Now" pictures are
// his own screenshots (rs/r240a, r242a, r245a, r246a). "New" pictures: 0.3.94 (main dist) with a plate read from a photo of a
// finished dish, the change drawn in by DOM, blue outline and yellow note. In English: boards are drawn in English.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3414", U = `http://127.0.0.1:${PORT}`;
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

  // ---- DT248: voice in the app's language. Cook mode in Srpski, an English recipe ----
  const salmon = [[180, F("sa", "Salmon fillet, raw", 208, 20, 13, 0)], [150, F("rc", "Basmati rice, dry", 356, 8.5, 0.9, 78)], [120, F("br", "Broccoli", 34, 2.8, 0.4, 7)]].map(([g, f]) => ({ id: f.id, grams: g, food: f, locked: false }));
  const withRecipe = { ...seed, meals: [{ id: "m-sa", title: "Salmon, rice and broccoli", items: salmon, portion: 450, steps: ["Cook the rice in salted water for 12 minutes.", "Bake the salmon at 200 °C for 12 minutes.", "Steam the broccoli for 5 minutes."], savedAt: at(18, 0, 1) }] };
  let p = await open(withRecipe, "/my-recipes", "sr-Latn");
  await p.getByText("Salmon, rice and broccoli").first().click(); await p.waitForTimeout(1200);
  await p.locator("button").filter({ hasText: "Počni da kuvaš" }).first().click(); await p.waitForTimeout(1500);
  const cm = ".cook-step";
  await note(p, "Now (0.3.97), Srpski: the app listens in Srpski, and Chef Mealan's answers are spoken in Srpski. Everything else it says is English, in an English voice: Step 1., Done. Enjoy your meal., the timer is done, Sorry, say that again?, the how-much answers.", cm);
  await shot(p, "r248a", await topOf(p, ".bnote", 90)); await p.context().close();
  p = await open(withRecipe, "/my-recipes", "sr-Latn");
  await p.getByText("Salmon, rice and broccoli").first().click(); await p.waitForTimeout(1200);
  await p.locator("button").filter({ hasText: "Počni da kuvaš" }).first().click(); await p.waitForTimeout(1500);
  await chefCard(p, cm, `<b style="font-size:15px;line-height:1.4">Out loud, in Srpski, with a Srpski voice:</b>
    <span style="font-size:14px;line-height:1.5">„Korak 1.” · „Gotovo. Prijatno.” · „Tajmer za pirinač je gotov.” · „Izvini, ponovi?” · „Treba ti 180 g lososa.”</span>
    <span style="font-size:14px;line-height:1.5">The step's own words in the recipe's language: this recipe is English, so an English voice reads them. A Srpski recipe gets a Srpski voice.</span>`);
  await note(p, "New: everything cook mode says is in the app's language, in a voice of that language. It still hears Srpski, English and German commands.", ".bnew");
  await shot(p, "r248b", await topOf(p, ".bnote", 90)); await p.context().close();
  // Say what you have, on the Plate, in Srpski
  p = await open(seed, "/plate", "sr-Latn");
  await p.locator("button").filter({ hasText: /Reci|Kaži/ }).first().click().catch(() => {}); await p.waitForTimeout(800);
  await note(p, "New: Say what you have listens in the app's language (now English only): jaja, spanać, feta i pola glavice luka.", ".say-have, main section.card");
  await p.evaluate((mark) => { const s = document.querySelector(".say-have"); if (s) s.style.cssText += ";" + mark; }, mark);
  await shot(p, "r248c", await topOf(p, ".bnote", 120)); await p.context().close();

  // ---- DT249: the meal's photos on the Plate ----
  const SECOND = "data:image/webp;base64," + fs.readFileSync(ROOT + "/public/landing/hero/curry-m.webp").toString("base64");
  const photoPlate = { ...seed, items: PLATE.map((i) => ({ ...i, locked: false })), title: "Balkan Baked Tava", photo: { image: PHOTO, at: at(18, 5), who: "now", more: [SECOND] }, plateAt: at(18, 5) };
  p = await open(photoPlate, "/plate", null, "2026-11-06T18:10:00");
  await p.locator(".mp-line").first().click().catch(() => {}); await p.waitForTimeout(600);
  await note(p, "Now (0.3.97): the photo is cut to one shape and the foods sit over its lower part. The second photo is only inside Help Chef Mealan read it, folded under a link.", ".mp-big");
  await p.evaluate((mark) => { const e = document.querySelector(".mp-big"); if (e) e.style.cssText += ";" + mark; }, mark);
  await shot(p, "r249a", await topOf(p, ".bnote", 110)); await p.context().close();
  const redraw = async (p, swapped) => p.evaluate(({ mark, SECOND, PHOTO, swapped }) => {
    const big = document.querySelector(".mp-big"); if (!big) return;
    const img = big.querySelector(".mp-big-img img"), tags = big.querySelector(".mp-tags");
    img.src = swapped ? SECOND : PHOTO; img.style.aspectRatio = "auto"; img.style.objectFit = "contain"; img.style.background = "#eef2f8";
    const chips = document.createElement("div"); chips.style.cssText = "display:flex;flex-direction:row;flex-wrap:wrap;align-items:flex-start;gap:6px;padding:10px 12px 4px";
    chips.innerHTML = [...tags.querySelectorAll("span")].map((s) => `<span style="display:inline-block;flex:0 0 auto;width:auto;background:var(--tint);color:var(--navy);border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800">${s.textContent}</span>`).join(""); tags.remove();
    const row = document.createElement("div"); row.style.cssText = "display:flex;gap:8px;padding:8px 12px 2px";
    const th = (src, on, label) => `<button style="width:64px;height:64px;padding:0;border-radius:10px;overflow:hidden;border:${on ? "3px solid var(--brand)" : "1.5px solid var(--line)"};background:#fff" aria-label="${label}"><img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block"></button>`;
    row.innerHTML = th(PHOTO, !swapped, "Photo 1") + th(SECOND, swapped, "Photo 2");
    big.querySelector(".mp-big-img").after(row); row.after(chips);
    row.style.outline = chips.style.outline = "3px solid #2e7be8"; row.style.outlineOffset = chips.style.outlineOffset = "-3px";
  }, { mark, SECOND, PHOTO, swapped });
  p = await open(photoPlate, "/plate", null, "2026-11-06T18:10:00");
  await p.locator(".mp-line").first().click().catch(() => {}); await p.waitForTimeout(600); await redraw(p, false);
  await note(p, "New: the photo as it is, nothing over it. Every photo of the meal in a row under it. The foods under the photos, each with its amount.", ".mp-big");
  await shot(p, "r249b", await topOf(p, ".bnote", 110)); await p.context().close();
  p = await open(photoPlate, "/plate", null, "2026-11-06T18:10:00");
  await p.locator(".mp-line").first().click().catch(() => {}); await p.waitForTimeout(600); await redraw(p, true);
  await note(p, "New: a tap on a small photo swaps it with the big one (your choice: swap, for now).", ".mp-big");
  await shot(p, "r249c", await topOf(p, ".bnote", 110)); await p.context().close();
  await b.close(); server.kill();
})();
