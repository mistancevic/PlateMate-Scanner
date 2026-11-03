// Board DT203 (Coach Milan 3 November 19:22 to 19:24, Draw): Serbian (Latin) first, Chef Mealan first: his lines, his answers, the
// safety lines and cook mode's words in Serbian, the screens still English. Now: 0.3.74 (main dist on 3399).
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3399";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8"));
const crepePic = "data:image/webp;base64," + fs.readFileSync("/home/claude/platemate-scanner/public/landing/hero/waffle-m.webp").toString("base64");
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
const F = (id, name, calories, protein, fats, carbs, fiber = 0) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber, photo: undefined, photos: undefined, icon: undefined, barcode: undefined, table: undefined, places: [] });
const crepes = [[104, F("eg", "Eggs", 143, 12.6, 9.5, 0.7)], [100, F("mi", "Milk 1.5%", 47, 3.4, 1.5, 4.9)], [35, F("wf", "Wheat flour, white", 364, 10, 1, 76, 2.7)], [25, F("wh", "vanilla whey protein powder", 380, 78, 6, 8)], [180, F("qu", "Quark, low fat (Magerquark)", 67, 12, 0.2, 4)], [81, F("ba", "Banana", 89, 1.1, 0.3, 22.8, 2.6)], [15, F("cc", "chocolate chips", 500, 5, 28, 60, 4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Whisk [[i:eg|eggs]], [[i:mi|milk]], [[i:wf|wheat flour]] and [[i:wh|vanilla whey protein powder]] in a bowl until smooth.", "Heat a pan on the stovetop at 180 °C. Pour in batter and cook each crêpe for 2 minutes per side until golden.", "Stir [[i:qu|quark]] in a bowl until creamy. Slice [[i:ba|banana]] into thin pieces.", "Fill the crêpes, fold them over, and scatter [[i:cc|chocolate chips]] on top to serve."];
const TITLE = "Vanilla protein crepes with sweet quark and banana";
const salmon = [[180, F("sa", "Salmon fillet, raw", 208, 20, 13, 0)], [150, F("rc", "Basmati rice, dry", 356, 8.5, 0.9, 78, 1.3)], [120, F("br", "Broccoli", 34, 2.8, 0.4, 7, 2.6)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const recipe = { id: "m-cr", title: TITLE, items: crepes, portion: 540, steps: STEPS, stepsFor: crepes.map((i) => i.food.name), savedAt: "2026-11-02T16:40:00Z" };
seed.feedback = [];
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const fresh = async (state = {}, path = "/today") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB", timezoneId: "Europe/Berlin" });
    const p = await ctx.newPage();
    const s = { ...seed, meals: [recipe, { id: "m-sa", title: "Salmon, rice and broccoli", items: salmon, portion: 450, steps: ["Cook the rice.", "Bake the salmon 12 minutes.", "Steam the broccoli."], savedAt: "2026-11-01T18:00:00Z" }], items: [], title: "", ...state };
    await p.addInitScript((s) => {
      window.SpeechRecognition = function () { this.start = () => {}; this.stop = () => {}; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-region", "munich"); localStorage.setItem("chefmealan-cook-voice", "on");
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, s);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1500);
    return p;
  };
  const hide = (p) => p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, .chat-fab, [class*=fab]")) t.style.display = "none"; for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (cs.position !== "fixed" || el.closest(".cook-mode") || el.classList.contains("cook-mode")) continue; if (el.tagName === "NAV" || el.querySelector("nav")) { if (el.getBoundingClientRect().top > 100) { el.style.position = "static"; document.body.appendChild(el); } } else el.style.display = "none"; } });
  const shot = async (p, name, full = true) => { await p.waitForTimeout(300); await hide(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot", name); };
  const note = (p, t, where = "main") => p.evaluate(({ t, NOTE, where }) => { document.querySelector(".bnote")?.remove(); const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const m = document.querySelector(where) || document.querySelector("main"); m.prepend(d); }, { t, NOTE, where });
  const cut = async (p, name, sel, h = 1300) => { await p.waitForTimeout(300); await hide(p); const y = await p.evaluate((sel) => { const e = document.querySelector(sel); return e ? Math.max(0, e.getBoundingClientRect().top + scrollY - 120) : 0; }, sel); await p.setViewportSize({ width: 390, height: h }); await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(250); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };


  // ---- DT203 release 3 (Coach Milan 3 November 23:47, Draw): the Plate in Srpski (latinica), drawn on 0.3.76 ----
  const SR = {
    "Plate": "Tanjir", "Maintain": "Održavanje", "today": "danas", "What are you craving?": "Šta ti se jede?",
    "Add your foods. Chef Mealan sets the amounts.": "Dodaj svoje namirnice. Chef Mealan određuje količine.",
    "Finds dishes in your recipes, Coach's, the members' and": "Traži jela u tvojim receptima, u receptima trenera i članova, kod",
    "'s, and your foods. Add PD 7+ to keep only dishes at PD 7 or more.": "a i u tvojim namirnicama. Dodaj PD 7+ i ostaju samo jela sa PD 7 ili više.",
    "Dinner, 20:00 by the clock · Off the plan · Regular meal · A mix": "Večera, 20:00 po satu · Van plana · Običan obrok · Mešavina",
    "On the plate": "Na tanjiru", "Nothing on the plate yet.": "Tanjir je još prazan.", "Add a food": "Dodaj namirnicu",
    "Manual": "Ručno", "Scan": "Skeniraj", "Photo of my meal": "Slika mog obroka", "Say what you have": "Reci šta imaš",
    "Start from a recipe": "Počni od recepta", "Screenshot": "Snimak ekrana", "Link": "Link", "Fit to my target": "Uklopi u moj cilj",
    "Add one food first.": "Prvo dodaj jednu namirnicu.", "builds the": "gradi", "dinner": "večeru", "around it.": "oko nje.",
    "Quick picks": "Brzi izbor", "Add": "Dodaj", "typical values, check your pack ·": "tipične vrednosti, proveri pakovanje ·",
    "See all": "Pogledaj svih", "foods": "namirnica", "Today": "Danas", "Recipes": "Recepti",
    "Greek yogurt 2%": "Grčki jogurt 2%", "Quark, low fat (Magerquark)": "Kvark, posni (Magerquark)", "Cottage cheese (Hüttenkäse)": "Zrnasti sir (Hüttenkäse)",
    "Eggs": "Jaja", "Chicken breast, cooked": "Pileća prsa, kuvana", "Milk 1.5%": "Mleko 1.5%", "Wheat flour, white": "Pšenično brašno, belo",
    "From My recipes. Change what you like, then Fit to my target or Keep it as it is.": "Iz Mojih recepata. Promeni šta želiš, pa Uklopi u moj cilj ili Ostavi kako jeste.",
    "Empty plate": "Isprazni tanjir", "Dinner": "Večera", "fits your plan": "uklapa se u plan", "Energy": "Energija", "Weight": "Težina", "Protein": "Proteini",
    "A food here is cooked, so these foods are made together. Is this one dish? Grouped into parts, Fit keeps each part's proportions and the steps go part by part.": "Jedna od ovih namirnica je kuvana, pa se spremaju zajedno. Da li je ovo jedno jelo? Kad ih podeliš na delove, Uklopi čuva odnos svakog dela, a koraci idu deo po deo.",
    "Filling": "Fil", "eggs, milk 1.5%, wheat flour, vanilla whey protein powder, quark, chocolate chips": "jaja, mleko 1.5%, pšenično brašno, vanilla whey protein powder, kvark, chocolate chips",
    "Topping": "Preliv", "Group it like this": "Grupiši ovako", "Change the parts": "Promeni delove", "No, separate foods": "Ne, posebne namirnice",
    "Group into parts": "Grupiši u delove", "Remove": "Ukloni", "Swap": "Zameni", "Chef Mealan can change this amount.": "Chef Mealan može da promeni ovu količinu.",
    "2 eggs": "2 jaja", "1 banana": "1 banana", "XS · 81 g peeled": "XS · 81 g oljušteno",
    "35 g is under a portion of wheat flour, 40 to 250 g.": "35 g je ispod porcije. Pšenično brašno: 40 do 250 g.",
    "Swipe a food left to swap it, right to remove it.": "Povuci namirnicu ulevo da je zameniš, udesno da je ukloniš.",
    "+ Add a food": "+ Dodaj namirnicu", "Prepare it ›": "Pripremi ›", "I had it": "Pojeo sam", "I skipped it": "Preskočio sam",
    "Your plate from yesterday, 13:10. Salmon, rice and broccoli. Did you eat it?": "Tvoj tanjir od juče, 13:10. Salmon, rice and broccoli. Da li si to pojeo?",
    "Ate it": "Pojeo sam", "Save for later": "Sačuvaj za kasnije", "Keep working on it": "Nastavi da radiš na njemu", "Clear it": "Isprazni ga",
    "Your numbers changed with your profile. An average day is now 2,450 kcal and 135 g protein.": "Tvoji brojevi su se promenili sa profilom. Prosečan dan je sada 2,450 kcal i 135 g proteina.",
  };
  const FULL = [
    [/^Večera is about/, "Večera je oko 817 kcal od tvojih 2.450, uz PD 5,5 ili više. Chef Mealan dodaje šta treba da večera bude u svom opsegu. Ostavi kako jeste uzima tanjir kakav jeste."],
    [/is an ingredient, not a food/, "Pšenično brašno, belo: to je sastojak, ne obrok. Treba mu jelo oko njega: testo, smesa, lonac. Samo za sebe nije večera."],
    [/^Take the/, "Izbaci: Pšenično brašno, belo"], [/^Ask\s*Chef Mealan\s*for a dish/, "Pitaj Chef Mealana za jelo oko njega"],
    [/could not read your plate/, "Chef Mealan nije mogao da pročita tvoj tanjir."], [/^Try again$/, "Pokušaj ponovo"],
    [/^Breakfast\s*isn't logged today/, "Doručak danas nije zapisan. Da li si doručkovao?"],
    [/^I had it:/, "Pojeo sam: večera ostaje oko 817 kcal. Preskočio sam: deo doručka prelazi na večeru, oko 1.225 kcal."],
    [/^Ate it saves it/, "Pojeo sam ga upisuje u juče, u obrok za koji je bio, u vreme kad je počeo. Sačuvaj za kasnije ga čuva da ga završiš drugi put, a Tanjir je slobodan. Nastavi da radiš na njemu ga otvara kakav jeste, i o ovom tanjiru se više ne pita. Isprazni ga prazni tanjir."],
  ];
  const PH = { "Crêpes, sarma, chocolate PD 7+…": "Palačinke, sarma, čokolada PD 7+…", "Search all my foods": "Pretraži sve moje namirnice" };
  const serbian = (p, marked = []) => p.evaluate(({ SR, PH, marked, mark, FULL: F0 }) => { const FULL = F0.map(([r, t]) => [new RegExp(r), t]);
    const num = (t) => t.replace(/(\d)\.(\d)/g, "$1\u0001$2").replace(/(\d),(\d{3})/g, "$1.$2").replace(/\u0001/g, ",");
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const ns = []; let n; while ((n = w.nextNode())) ns.push(n);
    for (const n of ns) { if (n.parentElement.closest(".bnote,script,style")) continue; const t = n.textContent.trim(); if (!t) continue; const s = SR[t]; if (s !== undefined) n.textContent = n.textContent.replace(t, s); n.textContent = num(n.textContent); }
    for (const e of document.querySelectorAll("input[placeholder],textarea[placeholder]")) if (PH[e.placeholder]) e.placeholder = PH[e.placeholder];
    for (const e of document.querySelectorAll("input")) if (/^\d+\.\d+$/.test(e.value)) e.value = e.value.replace(".", ",");
    for (const [re, t] of FULL) { const es = [...document.querySelectorAll("main p, main small, main div, main span, main button, main label")].filter((e) => re.test(e.innerText.trim())); for (const e of es) if (![...e.children].some((c) => re.test(c.innerText.trim()))) { e.textContent = t; break; } }
    for (const sel of marked) for (const e of document.querySelectorAll(sel)) e.style.cssText += ";" + mark;
  }, { SR, PH, marked, mark, FULL: FULL.map(([r, t]) => [r.source, t]) });
  const calm = (p) => p.evaluate(() => { document.querySelector('[aria-label="Dismiss message"]')?.click(); });
  // 1 the empty Plate, now and new
  let p = await fresh({ items: [], title: "" }, "/plate"); await calm(p); await p.waitForTimeout(300);
  await note(p, "Now (0.3.76): the empty Plate in English, also with Srpski chosen.");
  await cut(p, "r203f", "main", 1150);
  await p.setViewportSize({ width: 390, height: 844 });
  await serbian(p); await note(p, "New: the same Plate in Srpski. Numbers with a decimal comma. Packs keep the names on the pack (Nutella, Skyr).");
  await cut(p, "r203g", "main", 1150);
  await p.context().close();
  // 2 a recipe on the Plate
  p = await fresh({ items: crepes, title: TITLE }, "/plate"); await calm(p); await p.waitForTimeout(300);
  await note(p, "Now (0.3.76): a recipe on the Plate, in English.");
  await cut(p, "r203h", "main", 1250);
  await p.setViewportSize({ width: 390, height: 844 });
  await serbian(p); await note(p, "New: in Srpski. The recipe's own name stays as you wrote it. PD, the letters and Chef Mealan stay.");
  await cut(p, "r203i", "main", 1250);
  // 3 the foods
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate((mark) => { const s = [...document.querySelectorAll("small, p, span, div")].filter((e) => /^35 g je ispod porcije/.test(e.textContent.trim())).pop(); if (s) { s.style.cssText += ";" + mark; s.id = "por"; } }, mark);
  await note(p, "New: food names from the food table come in Serbian. Your own names stay as you typed them (vanilla whey protein powder). A food's name never sits inside a sentence, so no word changes its ending.", ".plate-items, main");
  await cut(p, "r203j", "#por", 1100);
  await p.context().close();
  // 4 a question, with his line from release 2
  p = await fresh({ items: salmon, title: "Salmon, rice and broccoli", plateAt: "2026-11-02T12:10:00Z" }, "/plate"); await calm(p); await p.waitForTimeout(300);
  await serbian(p, [".chef-line"]);
  await note(p, "New: his line and the buttons in Srpski. \"Pojeo sam\" follows your profile: a woman sees \"Pojela sam\".");
  await cut(p, "r203k", "main", 900);
  await b.close();
})();
