// DT255 (0.3.110, board Stories190; Coach Milan 7 November 22:25, Go): cook mode hears its commands in Srpski and German.
// A timer by voice, a step's own minutes with their timer button, what is left, a step by its number, a food in any ending.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const PORT = "3408", B = `http://127.0.0.1:${PORT}`;
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const items = [[250, F("i0", "Pasulj, kuvan", 127, 8.7, 0.5, 23)], [120, F("i1", "Crni luk", 40, 1.1, 0.1, 9)], [15, F("i2", "Suncokretovo ulje", 884, 0, 100, 0)]].map(([g, f]) => ({ id: f.id, grams: g, food: f, locked: false }));
const SR = ["Iseci [[i:i1|crni luk]] na tanke polukrugove i propržite ga na [[i:i2|ulju]] 10 minuta, dok ne omekša.", "Dodaj [[i:i0|pasulj]], sve stavi u vatrostalnu posudu i peci 40 minuta na 200 °C."];
const DE = ["Schneide die [[i:i1|Zwiebel]] in dünne Halbringe und brate sie 10 Minuten im [[i:i2|Öl]], bis sie weich ist.", "Gib die [[i:i0|Bohnen]] dazu, gib alles in eine Auflaufform und backe es 40 Minuten bei 200 °C."];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang, steps) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-07T18:30:00") });
    await page.addInitScript(([s, lang]) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("chefmealan-cook-voice", "on");
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); sessionStorage.setItem("seeded", "1"); }
      window.__spoken = []; const synth = { speak: (u) => { window.__spoken.push(u.text); queueMicrotask(() => u.onend && u.onend()); }, cancel: () => {}, getVoices: () => [] };
      Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      window.__recs = []; window.SpeechRecognition = function () { const me = this; window.__recs.push(me); me.start = () => { me.on = true; }; me.stop = () => { me.on = false; }; }; },
      [{ ...seed, meals: [{ id: "m-pr", title: "Prebranac", items, portion: 385, steps, savedAt: "2026-11-06T18:00:00Z" }] }, lang]);
    await require("./adult.cjs")(page);
    await page.goto(B + "/my-recipes/m-pr"); await page.waitForTimeout(1200);
    await page.locator(".rq-start button, .rq-steps button").filter({ hasText: /Počni da kuvaš|Kochen starten/ }).first().click(); await page.waitForTimeout(1200);
    page.ready = await page.locator(".cook-ready-food").allTextContents();
    await require("./ready.cjs")(page);
    return page;
  };
  const hear = async (page, t) => { await page.evaluate((t) => { const r = window.__recs.filter((x) => x.on).at(-1); r.onresult({ results: [{ 0: { transcript: t }, isFinal: true, length: 1 }] }); }, t); await page.waitForTimeout(400); };
  const answer = (page) => page.locator(".cook-heard b").nth(1).textContent();
  try {
    let page = await open("sr-Latn", SR);
    const cm = page.locator(".cook-mode");
    ok(page.ready.some((x) => /15 g suncokretovo ulje/.test(x)) && page.ready.some((x) => /120 g crni luk/.test(x)), "Get it ready says each food by its own name, not as a step bends it (na ulju): " + page.ready.join(" | "));
    ok(/Pokreni tajmer od 10 min/.test(await cm.locator(".cook-timer-start").textContent().catch(() => "")), "Srpski: the step's 10 minuta gets its timer button");
    await hear(page, "tajmer 5 minuta");
    ok(await cm.locator(".cook-timer").count() === 1 && /^Tajmer \(Crni luk\): 5 minuta\.$/.test(await answer(page)), "tajmer 5 minuta: a timer, said back in Srpski: " + await answer(page));
    await hear(page, "koliko pasulja");
    ok(/^250 g pasulj\. U koraku 2\.$/.test(await answer(page)), "koliko pasulja finds pasulj: " + await answer(page));
    await hear(page, "šta je ostalo");
    ok(/^Posle ovog još 1 korak\. Sledeći:/.test(await answer(page)), "šta je ostalo says what is left: " + await answer(page));
    await hear(page, "idi na korak dva");
    ok(/2 od 2/.test(await cm.locator(".cook-count").textContent()), "idi na korak dva goes to step 2");
    await page.context().close();

    page = await open("de", DE);
    const cd = page.locator(".cook-mode");
    ok(page.ready.some((x) => /250 g Bohnen/.test(x)) && page.ready.some((x) => /15 g Öl/.test(x)), "Deutsch, a translated recipe's foods as its steps name them: " + page.ready.join(" | "));
    ok(/Timer für 10 Min\. starten/.test(await cd.locator(".cook-timer-start").textContent().catch(() => "")), "Deutsch: the step's 10 Minuten gets its timer button");
    await hear(page, "Timer auf zehn Minuten");
    ok(await cd.locator(".cook-timer").count() === 1 && /^Timer \(Zwiebel\): 10 Minuten\.$/.test(await answer(page)), "Timer auf zehn Minuten: " + await answer(page));
    await hear(page, "wie viel Bohnen");
    ok(/^250 g Bohnen\. In Schritt 2\.$/.test(await answer(page)), "wie viel Bohnen: " + await answer(page));
    await hear(page, "was fehlt noch");
    ok(/^Danach noch 1 Schritt\. Als Nächstes:/.test(await answer(page)), "was fehlt noch: " + await answer(page));
    await hear(page, "Schritt 2");
    ok(/2 von 2/.test(await cd.locator(".cook-count").textContent()), "Schritt 2 goes to step 2");
    await page.context().close();
  } finally { await b.close(); server.kill(); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  if (fail) { console.log(`${fail} failed`); process.exit(1); }
  console.log("all passed");
})();
