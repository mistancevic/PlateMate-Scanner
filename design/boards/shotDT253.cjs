// Board DT253 (Coach Milan 7 November 08:29 to 13:06): the home page tells visitors Chef Mealan speaks their language, a block
// among the clips with its own clip. The clip for the English page: English, then Srpski, then Deutsch (Beta). Frames: the app
// as it is (0.3.104, main dist) on test data; the translation is a stand-in. The block drawn in by DOM, blue outline and note.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3499", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const items = [[250, F("be", "Pasulj, kuvan", 127, 8.7, 0.5, 23)], [120, F("on", "Crni luk", 40, 1.1, 0.1, 9)], [15, F("oi", "Suncokretovo ulje", 884, 0, 100, 0)]].map(([g, f], k) => ({ id: "i" + k, grams: g, food: f, locked: false }));
const SR = ["Iseci [[i:i1|crni luk]] na tanke polukrugove i propržite ga na [[i:i2|ulju]] 10 minuta, dok ne omekša.", "Dodaj [[i:i0|pasulj]], sve stavi u vatrostalnu posudu i peci 40 minuta na 200 °C."];
const DE = ["Schneide die [[i:i1|Zwiebel]] in dünne Halbringe und brate sie 10 Minuten im [[i:i2|Öl]], bis sie weich ist.", "Gib die [[i:i0|Bohnen]] dazu, gib alles in eine Auflaufform und backe es 40 Minuten bei 200 °C."];
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(ROOT + "/tests/flows/plate.jpg").toString("base64");
const prebranac = { id: "m-pr", title: "Prebranac", items, portion: 385, steps: SR, photos: [PHOTO], source: { name: "recepti.rs", url: "https://recepti.rs/prebranac", from: "link", at: "2026-11-06T18:00:00Z" }, savedAt: "2026-11-06T18:00:00Z" };
const state = { ...seed, meals: [prebranac] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (path, lang, seeded = true) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB", timezoneId: "Europe/Berlin" });
    const p = await ctx.newPage(); await p.clock.setFixedTime(new Date("2026-11-07T12:20:00"));
    if (seeded) {
      await p.addInitScript(([s, lang]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
        localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); if (lang) localStorage.setItem("chefmealan-lang", lang);
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
        localStorage.setItem("seeded", "1"); }, [state, lang]);
      await require(ROOT + "/tests/flows/adult.cjs")(p);
      await p.route("**/api/status", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ai: true, airtable: false, accessRequired: false }) }));
      await p.route("**/api/recipe/translate", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ title: "Prebranac (gebackene Bohnen)", steps: DE, foods: [{ id: "i0", name: "Bohnen, gekocht" }, { id: "i1", name: "Zwiebel" }, { id: "i2", name: "Sonnenblumenöl" }] }) }));
      for (const r of ["cover", "dish", "members/foods**"]) await p.route(`**/api/${r}`, (x) => x.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    }
    await p.goto(U + path); await p.waitForTimeout(1800);
    if (/could not be read/.test(await p.locator("body").innerText())) throw new Error("seed not valid");
    await p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, [class*=fab]")) t.style.display = "none"; });
    return p;
  };
  const shot = async (p, name, top) => { await p.evaluate((y) => window.scrollTo(0, y), top); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
  const topOf = (p, sel, off = 140) => p.evaluate(({ sel, off }) => { const e = document.querySelector(sel); return e ? Math.max(0, e.getBoundingClientRect().top + window.scrollY - off) : 0; }, { sel, off });
  const note = (p, t, sel, after = false) => p.evaluate(({ t, NOTE, sel, after }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const e = document.querySelector(sel) || document.querySelector("main"); after ? e.after(d) : e.before(d); }, { t, NOTE, sel, after });

  // the clip, frame by frame
  let p = await open("/today", null);
  await note(p, "Clip 1: English. Today, as the other clips start.", "main > *");
  await shot(p, "r253f1", 0); await p.context().close();
  p = await open("/menu", null);
  const row = p.locator(".menu-row").filter({ hasText: /Settings/ }).first(); if (await row.count()) { await row.click(); await p.waitForTimeout(800); }
  const lr = p.locator(".menu-row, button").filter({ hasText: /Also Srpski/ }).first(); if (await lr.count()) { await lr.click(); await p.waitForTimeout(800); }
  const sr = p.getByRole("button", { name: /Srpski/ }).first(); const srTop = await sr.evaluate((e) => e.getBoundingClientRect().top + window.scrollY - 260).catch(() => 0);
  await sr.evaluate((e, mark) => { e.style.cssText += ";" + mark; }, mark).catch(() => {});
  await note(p, "Clip 2: Menu, Settings, Language: Srpski.", "main > *"); await p.evaluate(() => window.scrollTo(0, 0));
  await shot(p, "r253f2", srTop); await p.context().close();
  p = await open("/today", "sr-Latn");
  await note(p, "Clip 3: the app in Srpski at once: Danas, the plan, the words on every screen.", "main > *");
  await shot(p, "r253f3", 0); await p.context().close();
  p = await open("/my-recipes/m-pr", "sr-Latn");
  await note(p, "Clip 4: Prebranac, from a Serbian link: in Srpski, as the page wrote it.", ".rq-hero");
  await shot(p, "r253f4", await topOf(p, ".bnote", 70)); await p.context().close();
  // the switch to Deutsch, from the app in Srpski
  p = await open("/menu", "sr-Latn");
  { const r = p.locator(".menu-row").filter({ hasText: /Podešavanja/ }).first(); if (await r.count()) { await r.click(); await p.waitForTimeout(800); } }
  { const r = p.locator(".menu-row, button").filter({ hasText: /Jezik/ }).first(); if (await r.count()) { await r.click(); await p.waitForTimeout(800); } }
  { const d = p.locator("button, [role=radio], label").filter({ hasText: /Deutsch/ }).first(); await d.evaluate((e, mark) => { e.style.cssText += ";" + mark; }, mark).catch(() => {}); }
  await note(p, "Clip 5: from Srpski to Deutsch (Beta): Meni, Podešavanja, Jezik, Deutsch.", "main > *"); await p.evaluate(() => window.scrollTo(0, 0));
  await shot(p, "r253f45", 0); await p.context().close();
  p = await open("/my-recipes/m-pr", "de");
  await note(p, "Clip 6: Deutsch (Beta). The same recipe: Chef Mealan offers it in German, once.", ".rq-lang-offer");
  await shot(p, "r253f5", await topOf(p, ".bnote", 70));
  await p.locator(".rq-lang-offer .ca-go button").first().click(); await p.waitForTimeout(1500);
  await p.evaluate(() => { for (const d of document.querySelectorAll(".bnote")) d.remove(); });
  await shot(p, "r253f6clean", await topOf(p, ".rq-lang", 70));
  await note(p, "Clip 7: in German, Übersetzt von Chef Mealan, the Srpski original one tap away.", ".rq-lang");
  await shot(p, "r253f6", await topOf(p, ".bnote", 70));
  await p.locator(".rq-start button").first().click(); await p.waitForTimeout(1500);
  const v = p.locator(".cook-mode button").filter({ hasText: /Stimme an|Stimme einschalten/ }).first(); if (await v.count()) { await v.click(); await p.waitForTimeout(500); }
  await p.evaluate((mark) => { const m = { "pasulj": "Bohnen", "crni luk": "Zwiebel", "suncokretovo ulje": "Sonnenblumenöl" }; for (const b of document.querySelectorAll(".cook-ready-name b")) { for (const [a, z] of Object.entries(m)) b.textContent = b.textContent.replace(a, z); } const l = document.querySelector(".cook-ready-list"); if (l) l.style.cssText += ";" + mark; }, mark);
  await note(p, "Clip 8: Kochen starten. Alles bereitlegen, read aloud in German, then Schritt 1. With the fix: the foods as the German steps name them (Bohnen, Zwiebel), not pasulj.", ".cook-mode > *");
  await shot(p, "r253f7", 0); await p.context().close();

  // the end frame
  p = await open("/today", null);
  await p.setContent(`<html><body style="margin:0;height:100vh;display:grid;place-items:center;background:#2e7be8;font-family:Nunito,system-ui,sans-serif;color:#fff"><div style="text-align:center"><div style="font-size:30px;font-weight:900;line-height:1.4">English · Srpski · Deutsch</div><div style="font-size:18px;font-weight:700;opacity:.9;margin-top:6px">Deutsch in Beta</div><div style="font-size:16px;margin-top:28px;opacity:.9">chefmealan.com</div></div></body></html>`);
  await shot(p, "r253f8", 0); await p.context().close();

  // the home page: the block among the clips
  p = await open("/?home", null, false);
  const poster = "data:image/png;base64," + fs.readFileSync(`${R}/r253f6clean.png`).toString("base64");
  await p.evaluate(({ mark, poster }) => {
    const ones = document.querySelectorAll(".l-steps.l-new .l-one"), last = ones[ones.length - 1]; if (!last) return;
    const d = document.createElement("div"); d.className = "l-one bnew"; d.style.cssText = mark + ";padding:10px";
    d.innerHTML = `<div class="l-one-text"><span class="l-eyebrow">IN YOUR LANGUAGE</span><h2>Chef Mealan is multilingual</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px">${["English", "Srpski", "Deutsch · Beta"].map((x) => `<span style="padding:6px 12px;border-radius:999px;background:var(--tint);color:var(--navy);font-weight:800;font-size:15px">${x}</span>`).join("")}</div>
      <ul class="l-list"><li>The whole app in your language: switch it in Menu, Settings.</li><li>A recipe from a link or a screenshot comes in your language; the original stays one tap away.</li><li>A recipe in another language: Chef Mealan offers it in yours, once.</li><li>Cooking: the steps read aloud in your language, and it listens in it.</li></ul>
      <p class="muted" style="font-size:14px">Deutsch is in Beta: a German speaker checks it as we go. More languages join this list as they come.</p></div>
      <div style="position:relative;border-radius:22px;overflow:hidden;border:1px solid var(--line);max-width:240px;margin:0 auto"><img src="${poster}" style="display:block;width:100%"><span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.95);color:#2e7be8;font-size:26px;display:grid;place-items:center;box-shadow:0 2px 10px rgba(0,0,0,.25)">▶</span></div>`;
    last.after(d);
  }, { mark, poster });
  await note(p, "New: the fourth block after cook it, the day as it goes, and the body. An evergreen title (Coach Milan 13:45): Chef Mealan is multilingual; under it the languages, from the app's own list. Its own clip, about 30 s, the frames below.", ".bnew");
  await shot(p, "r253h", await topOf(p, ".bnote", 70)); await p.context().close();
  await b.close(); server.kill();
})();
