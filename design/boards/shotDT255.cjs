// Board DT255 (Coach Milan 7 November 22:17 to 22:20): cook mode's voice commands in Srpski and German. "Now": 0.3.109 (main
// dist), the words said through the stand-in speech, as the walkthroughs do. "New": the answer drawn in by DOM, blue outline and note.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3485", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const items = [[250, F("i0", "Pasulj, kuvan", 127, 8.7, 0.5, 23)], [120, F("i1", "Crni luk", 40, 1.1, 0.1, 9)], [15, F("i2", "Suncokretovo ulje", 884, 0, 100, 0)]].map(([g, f]) => ({ id: f.id, grams: g, food: f, locked: false }));
const SR = ["Iseci [[i:i1|crni luk]] na tanke polukrugove i propržite ga na [[i:i2|ulju]] 10 minuta, dok ne omekša.", "Dodaj [[i:i0|pasulj]], sve stavi u vatrostalnu posudu i peci 40 minuta na 200 °C."];
const DE = ["Schneide die [[i:i1|Zwiebel]] in dünne Halbringe und brate sie 10 Minuten im [[i:i2|Öl]], bis sie weich ist.", "Gib die [[i:i0|Bohnen]] dazu, gib alles in eine Auflaufform und backe es 40 Minuten bei 200 °C."];
const meal = (steps) => ({ id: "m-pr", title: "Prebranac", items, portion: 385, steps, savedAt: "2026-11-06T18:00:00Z" });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (lang, steps) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-07T18:30:00"));
    await p.addInitScript(([s, lang]) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("chefmealan-cook-voice", "on");
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }
      const synth = { speak: (u) => queueMicrotask(() => u.onend && u.onend()), cancel: () => {}, getVoices: () => [] }; Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      window.__recs = []; window.SpeechRecognition = function () { const me = this; window.__recs.push(me); me.start = () => { me.on = true; }; me.stop = () => { me.on = false; }; }; }, [{ ...seed, meals: [meal(steps)] }, lang]);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/my-recipes/m-pr"); await p.waitForTimeout(1200);
    await p.locator(".rq-start button, .rq-steps button").filter({ hasText: /Počni da kuvaš|Kochen starten/ }).first().click(); await p.waitForTimeout(1200);
    const ask = p.locator(".rq-lang-cook"); if (await ask.count()) { await ask.locator(".ca-go button").nth(1).click(); await p.waitForTimeout(1000); }
    const sk = p.locator(".cook-ready-skip"); if (await sk.count()) { await sk.click(); await p.waitForTimeout(500); }
    return p;
  };
  const hear = (p, t) => p.evaluate((t) => { const r = window.__recs.filter((x) => x.on).at(-1); r.onresult({ results: [{ 0: { transcript: t }, isFinal: true, length: 1 }] }); }, t);
  const note = (p, t) => p.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const e = document.querySelector(".cook-step"); e.before(d); }, { t, NOTE });
  const answer = (p, said, ans, mark) => p.evaluate(({ said, ans, mark }) => { const h = document.querySelector(".cook-heard"); const bs = h.querySelectorAll("b"); bs[0].textContent = said; bs[1].textContent = ans; h.style.cssText += ";" + mark; const hint = h.querySelector(".cook-can-say"); if (hint) hint.remove(); }, { said, ans, mark });
  const chip = (p, label, mark) => p.evaluate(({ label, mark }) => { const t = document.createElement("div"); t.className = "cook-timers"; t.innerHTML = `<button class="cook-timer" style="${mark}">⏱ ${label}</button>`; document.querySelector(".cook-step").before(t); }, { label, mark });
  const stepBtn = (p, label, mark) => p.evaluate(({ label, mark }) => { const s = document.querySelector(".cook-step"); if (s.querySelector(".cook-timer-start")) return; const d = document.createElement("div"); d.className = "cook-step-actions"; d.innerHTML = `<button class="pill cook-timer-start" style="${mark}">${label}</button>`; s.append(d); }, { label, mark });
  const shot = async (p, name) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };

  // Srpski
  let p = await open("sr-Latn", SR); await hear(p, "tajmer 5 minuta"); await p.waitForTimeout(400);
  await note(p, "Now (0.3.109): tajmer 5 minuta is not understood: Izvini, ponovi? The step says 10 minuta, and there is no timer button: the app reads minutes in English only.");
  await shot(p, "r255a");
  p = await open("sr-Latn", SR); await hear(p, "tajmer 5 minuta"); await p.waitForTimeout(400);
  await answer(p, "tajmer 5 minuta", "Tajmer (Crni luk): 5 minuta.", mark); await chip(p, "Crni luk 5:00", mark); await stepBtn(p, "⏱ Pokreni tajmer od 10 min", mark);
  await note(p, "New: tajmer 5 minuta starts a timer, said back in Srpski. The step's 10 minuta gets its timer button too. Also: podesi tajmer na 10 minuta, tajmer pet minuta, pola sata.");
  await shot(p, "r255b");
  p = await open("sr-Latn", SR); await hear(p, "tajmer 5 minuta"); await p.waitForTimeout(400);
  await answer(p, "koliko pasulja", "250 g pasulja. U koraku 2.", mark);
  await note(p, "New: koliko pasulja finds pasulj, whatever its ending (pasulja, luka, ulja). Also: šta je ostalo (what is left) and idi na korak 2, korak dva (go to a step).");
  await shot(p, "r255c");
  // Deutsch
  p = await open("de", DE); await hear(p, "Timer 5 Minuten"); await p.waitForTimeout(400);
  await note(p, "Now (0.3.109): Timer 5 Minuten is not understood: Entschuldige, sag das noch mal? The step says 10 Minuten, with no timer button.");
  await shot(p, "r255d");
  p = await open("de", DE); await hear(p, "Timer 5 Minuten"); await p.waitForTimeout(400);
  await answer(p, "Timer 5 Minuten", "Timer (Zwiebel): 5 Minuten.", mark); await chip(p, "Zwiebel 5:00", mark); await stepBtn(p, "⏱ Timer für 10 Min. starten", mark);
  await note(p, "New: Timer 5 Minuten, Timer auf 10 Minuten, eine halbe Stunde. The step's 10 Minuten gets its timer button.");
  await shot(p, "r255e");
  p = await open("de", DE); await hear(p, "Timer 5 Minuten"); await p.waitForTimeout(400);
  await answer(p, "was fehlt noch", "Danach noch 1 Schritt. Als Nächstes: Gib die 250 g Bohnen dazu …", mark);
  await note(p, "New: was fehlt noch (or was kommt noch) says what is left; wie viel Zwiebeln finds Zwiebel; zu Schritt 2, Schritt zwei goes there.");
  await shot(p, "r255f");
  await b.close(); server.kill();
})();
