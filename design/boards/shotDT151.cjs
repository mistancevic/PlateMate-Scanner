// DT151 (Coach Milan 29 October 09:52 to 09:54): Explorer, the MVP for the pitch: Menu below Foods, Not all proteins are equal
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3324", U = `http://127.0.0.1:${PORT}`;
// DT151 v3 (10:10): numbers checked against USDA FoodData Central; need from WHO/FAO/UNU 2007 (adult, per kg per day). Calculated in /home/claude/boards/eaa151.cjs.
const MEALC = require("/home/claude/boards/eaa151.cjs").meal;
const FOODS = [
  { k: "whey", q: {"pdcaas": "1.00", "pdSrc": "Hertzler 2020, adults", "diaas": "1.09", "diSrc": "Phillips 2017, isolate", "aaSrc": "a typical whey label; cysteine and tyrosine from Hamarsland 2017 (BMC Nutrition). Your own brand's label replaces it"}, icon: "🥤", name: "Whey protein powder", portion: "One scoop, 30 g", pair: "Nothing: it is complete.", best: "After training: one scoop in water or milk. Fast to digest and the most leucine per gram, so it starts muscle repair quickest. Also lifts a breakfast short of protein." },
  { k: "chicken", q: {"pdcaas": "0.95", "pdSrc": "Boye 2012", "diaas": "1.08", "diSrc": "Phillips 2017", "aaSrc": "USDA SR Legacy 05062, breast, raw"}, icon: "🍗", name: "Chicken breast", portion: "150 g", pair: "Nothing: it is complete.", best: "The anchor of a main meal: 150 g brings most lunches and dinners to their protein. Lean, so the PD stays high whatever goes with it." },
  { k: "yogurt", q: {"pdcaas": "1.00", "pdSrc": "Hertzler 2020, milk, adults", "diaas": "1.14", "diSrc": "Phillips 2017, whole milk", "aaSrc": "USDA, Greek yogurt plain nonfat"}, icon: "🥣", name: "Greek yogurt, 0 %", portion: "200 g", pair: "Nothing: it is complete. It lifts oats and fruit.", best: "Breakfast or before sleep: its casein digests slowly and feeds amino acids for hours. Lifts oats and fruit to your PD." },
  { k: "salmon", q: {"pdcaas": null, "pdSrc": null, "diaas": null, "diSrc": null, "aaSrc": "USDA SR Legacy 15236, Atlantic, farmed, raw"}, icon: "🐟", name: "Salmon", portion: "150 g", pair: "Nothing: it is complete. Its fat is the good kind.", best: "Twice a week as a main meal: protein plus the omega-3 fats. Its own fat lowers the PD, so add vegetables, not more fat." },
  { k: "soy", q: {"pdcaas": "1.00", "pdSrc": "Hertzler 2020, adults", "diaas": "1.00", "diSrc": "Ertl 2016, soybeans", "aaSrc": "USDA SR Legacy 16109, boiled"}, icon: "🫘", name: "Soybeans, boiled", portion: "150 g", pair: "Nothing for its amino acids: complete for an adult. Rice or bread adds the protein to close the meal.", best: "The plant anchor: the most complete plant protein, as tofu, edamame or beans. 150 g brings as much protein as a scoop of whey." },
  { k: "egg", q: {"pdcaas": "1.00", "pdSrc": "Boye 2012", "diaas": "1.13", "diSrc": "Phillips 2017, hard boiled", "aaSrc": "USDA, egg whole raw"}, icon: "🥚", name: "Egg", portion: "2 eggs, 100 g", pair: "Nothing: the reference protein. Half its energy is the yolk's fat.", best: "Breakfast, or to complete a plant meal. Two eggs are a third of a meal's protein, so add a third egg or egg whites, which also raise the PD." },
  { k: "lentils", q: {"pdcaas": "0.80", "pdSrc": "Hertzler 2020, adults", "diaas": "0.75", "diSrc": "Hertzler 2020", "aaSrc": "USDA SR Legacy 16070, boiled"}, icon: "🫘", name: "Lentils, boiled", portion: "200 g", pair: "Rice completes it: rice has the methionine lentils lack, lentils the lysine rice lacks.", best: "A plant lunch with rice: together complete, and the fibre keeps you full for hours. Count it as protein and carb together." },
  { k: "oats", q: {"pdcaas": "0.62", "pdSrc": "Hertzler 2020, adults", "diaas": "0.54", "diSrc": "Rutherfurd 2015, cooked rolled", "aaSrc": "USDA SR Legacy 08120, dry"}, icon: "🌾", name: "Oats, dry", portion: "50 g", pair: "Milk, skyr or yogurt completes it: dairy has the lysine oats lack.", best: "A breakfast carb, not a protein: 50 g gives 7 g protein. Cook it in milk or top it with skyr, which brings the lysine and the PD up." },
];
const foodsFor = (mealP) => { const c = MEALC(mealP); return FOODS.map((f) => ({ ...f, ...c[f.k] })); };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-29T10:10:00"));
  await page.addInitScript(([s]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name, full = true) => { await page.waitForTimeout(400); if (full) await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot " + name); };
  const openMenu = async () => { await page.goto(U + "/"); await page.waitForTimeout(900); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(500); };
  // a, now: the Menu
  await openMenu();
  const foodsRow = await page.evaluate(() => !![...document.querySelectorAll(".menu-row")].find((r) => /^Foods/.test(r.textContent.trim())));
  console.log("foods row", foodsRow);
  await page.evaluate(({ NOTE }) => { const list = document.querySelector(".menu-row")?.parentElement; if (!list) return; const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "Now (0.2.131): the Menu has no Explorer. What makes protein foods different lives only in Chef Mealan's lines on a plate."; list.before(d); }, { NOTE });
  await shot("r151a", false);
  // b, new: Explorer below Foods
  await openMenu();
  await page.evaluate(({ mark, NOTE }) => {
    const rows = [...document.querySelectorAll(".menu-row")]; const foods = rows.find((r) => /^Foods/.test(r.textContent.trim())) ?? rows[rows.length - 1]; if (!foods) return;
    const ex = foods.cloneNode(true); ex.style.cssText += ";" + mark;
    const b = ex.querySelector("b, .menu-row-text b"); if (b) b.textContent = "Explorer"; const sm = ex.querySelector("small"); if (sm) sm.textContent = "Not all proteins are equal";
    const ic = ex.querySelector("svg"); if (ic) { const s = document.createElement("span"); s.textContent = "🔬"; s.style.cssText = "font-size:18px;width:22px;text-align:center"; ic.replaceWith(s); }
    foods.after(ex);
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New: Explorer, right below Foods. One tap opens Not all proteins are equal."; foods.parentElement.before(d);
  }, { mark, NOTE });
  await shot("r151b", false);
  // c and d, new: the page
  // the day's protein, from the app, as the Plan shows it; three meals share it, a snack half a meal
  await page.goto(U + "/plan"); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Chef Mealan", exact: true }).click(); await page.waitForTimeout(500);
  const dayP = Number(((await page.locator(".chat-screen .head p").first().textContent()).match(/kcal and (\d+) g/) || [])[1]);
  console.log("day protein", dayP);
  const MEALS = { Breakfast: Math.round(dayP / 3), Lunch: Math.round(dayP / 3), Dinner: Math.round(dayP / 3), Snack: Math.round(dayP / 6) };
  const page2 = async (sort, mealName) => {
    const mealP = MEALS[mealName], list0 = foodsFor(mealP);
    await page.goto(U + "/me"); await page.waitForTimeout(900);
    await page.evaluate(({ FOODS, sort, mark, mealName, mealP, dayP }) => {
      for (const n of document.querySelectorAll("header *, .top *")) if (n.childElementCount === 0 && n.textContent.trim() === "Me") n.textContent = "Explorer";
      const main = document.querySelector("main") ?? document.body; const target = 6.5; const meal = mealName.toLowerCase();
      const list = [...FOODS].sort((a, b) => (sort === "pd" ? b.pd - a.pd : b.closes - a.closes));
      const N = { his: "Histidine", ile: "Isoleucine", leu: "Leucine", lys: "Lysine", saa: "Methionine + cysteine", aaa: "Phenylalanine + tyrosine", thr: "Threonine", trp: "Tryptophan", val: "Valine" };
      const g = (v) => v.toFixed(2);
      const bar = (pc, h = 8) => { const w = Math.min(pc, 150) / 150 * 100, c = pc >= 100 ? "#13916a" : "#5b8def"; return `<span style="position:relative;flex:1;height:${h}px;border-radius:${h / 2}px;background:#e8eef9"><i style="position:absolute;left:0;top:0;bottom:0;width:${w}%;border-radius:${h / 2}px;background:${c}"></i><i style="position:absolute;left:66.7%;top:-2px;bottom:-2px;width:2px;background:#172742;opacity:.55"></i></span>`; };
      const row3 = (label, val, pc, small) => `<div style="margin-top:6px"><div style="display:flex;justify-content:space-between;gap:8px;font-size:${small ? 11.5 : 12.5}px;font-weight:${small ? 700 : 800}"><span>${label}</span><span style="white-space:nowrap;color:${pc >= 100 ? "#13916a" : "#172742"}">${val}</span></div><div style="display:flex;margin-top:3px">${bar(pc, small ? 6 : 8)}</div></div>`;
      const you = (f) => f.pd >= target ? `Above your PD ${target}: one portion lifts a plate.` : `Below your PD ${target}: it needs a partner richer in protein.`;
      // DT151 v8 (Milan 11:50): one pattern for every measure: the name on the left, the bar, the grams on the right; a line marks the meal's need where there is one
      const R = (label, val, frac, line, ok, bold, low) => `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><small style="width:118px;font-size:11.5px;line-height:1.15;${bold ? "font-weight:900;color:#172742" : ""}${low ? "font-weight:800;color:#8a5a00" : ""}">${label}</small><span style="position:relative;flex:1;height:8px;border-radius:4px;background:#eef2f9"><i style="position:absolute;left:0;top:0;bottom:0;width:${Math.max(Math.min(frac, 1) * 100, 1.5)}%;border-radius:4px;background:${ok ? "#13916a" : low ? "#f6b94a" : "#5b8def"}"></i>${line ? '<i style="position:absolute;left:66.7%;top:-3px;bottom:-3px;width:2px;background:#172742;opacity:.55"></i>' : ""}</span><small style="width:78px;text-align:right;font-size:11.5px;font-weight:${bold ? 900 : 800};color:${ok ? "#13916a" : "#172742"}">${val}</small></div>`;
      const KV = (label, val) => `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><small style="width:118px;font-size:11.5px">${label}</small><small style="flex:1;text-align:right;font-size:11.5px;font-weight:900;color:#172742">${val}</small></div>`;
      const H = (t, sub) => `<div style="margin-top:14px;padding-top:10px;border-top:1px solid #e3e9f4"><b style="display:block;font-size:11.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#123a7a">${t}</b>${sub ? `<small style="display:block;color:#5b6b8a;font-size:11.5px;margin-top:1px">${sub}</small>` : ""}</div>`;
      const card = (f) => `<section class="card" style="margin:10px 0;padding:14px 16px">
        <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">${f.icon}</span><b style="flex:1;font-size:16px">${f.name}</b><span class="pdpill pdpill-${f.pd >= target ? "high" : "low"}" style="font-weight:900">PD ${f.pd.toFixed(1)}</span></div>
        ${H("One portion", `Every number below is for one normal portion. PD, protein per 100 kcal, is ${f.pd.toFixed(1)}: ${f.pd >= target ? `above your ${target}, so one portion lifts a plate.` : `below your ${target}, so it needs a partner richer in protein.`}`)}
        ${KV("Portion", f.portion)}
        ${KV("Per 100 g", `${f.p} g protein, ${f.kcal} kcal`)}

        ${H(`Protein for your ${meal}`, `Your ${meal} needs about ${mealP} g of protein. This portion closes ${f.closes} % of it.`)}
        ${R("Protein", `${f.protein} of ${mealP} g`, f.closes / 150, true, f.closes >= 100)}
        ${H("Muscle building and repair", `A meal switches on muscle protein synthesis, how the body builds and repairs muscle, with about 10 g of essential amino acids, 2.5 g of them leucine. ${f.eaa >= 10 && f.leu >= 2.5 ? "This portion brings both." : f.eaa >= 10 ? "This portion brings the 10 g, not yet the leucine." : "This portion brings part of it."}`)}
        ${R("Essential amino acids", `${f.eaa.toFixed(1)} of 10 g`, f.eaa * 10 / 150, true, f.eaa >= 10)}
        ${R("of them, leucine", `${f.leu.toFixed(1)} of 2.5 g`, f.leu * 40 / 150, true, f.leu >= 2.5, true)}
        ${H("The family: nine essential amino acids", `Nine amino acids your body can't make, so food must bring them. ${f.lowest[1] < 1.15 ? `This portion brings all nine, its lowest only just: ${N[f.lowest[0]].toLowerCase()}.` : "This portion brings all nine, each with room to spare."} Grams, on the same scale for every food.`)}
        ${Object.entries(N).map(([k, n]) => { const low = f.lowest[0] === k && f.lowest[1] < 1.15; return R(`${n}${low ? " · its lowest" : ""}`, `${g(f.por[k])} g`, f.por[k] / 3.5, false, false, k === "leu", low); }).join("")}
        ${H("Quality", "Two scores for how well a protein covers the nine, once digested. 1.00 or more means complete.")}
        ${[["PDCAAS", f.q.pdcaas, f.q.pdSrc, "The older score, on many labels. It stops at 1.00."], ["DIAAS", f.q.diaas, f.q.diSrc, "The newer score, digestion counted. As published."]].map(([n, v, src, what], i) => `<div style="display:flex;gap:10px;align-items:baseline;padding:6px 0;${i ? "border-top:1px solid #eef2f9" : ""}"><b style="width:58px;font-size:12.5px">${n}</b><b style="width:64px;font-size:15px">${v ?? "none yet"}</b><small style="flex:1;font-size:11px;line-height:1.3">${what}<br><i style="font-style:normal;color:#5b6b8a">${src ?? "No published figure in our sources."}</i></small></div>`).join("")}
        ${H("How to use it", "When and how this food serves you best.")}
        <small style="display:block;margin-top:6px;padding:6px 8px;border-radius:10px;background:#eaf1fd;color:#123a7a"><b>Best use:</b> ${f.best}</small>
        <small style="display:block;margin-top:6px"><b>Completes it:</b> ${f.pair}</small>

        <small style="display:block;margin-top:10px;color:#5b6b8a;font-size:11px">Source: ${f.q.aaSrc}.</small>
      </section>`;
      main.innerHTML = `<div style="padding:4px 16px 24px">
        <div class="step-head"><h2 style="margin:6px 0 4px;font-size:24px">Not all proteins are equal</h2>
        <p style="margin:0 0 10px;color:#5b6b8a;line-height:1.45">Protein is the surname. Its first names are the amino acids: leucine, lysine, methionine and six more your body can't make. Each food brings the family in its own mix. Nobody eats one food all day, so each food here is one portion against one meal: how much of the meal it closes, and which of the family it brings.</p></div>
        <div class="moments meal-chips" role="radiogroup" style="${mark};padding:4px;margin-bottom:8px">${["Breakfast", "Lunch", "Dinner", "Snack"].map((m) => `<button class="choice ${m === mealName ? "on" : ""}">${m}</button>`).join("")}</div>
        <small style="display:block;margin:0 0 8px;color:#123a7a;font-weight:700">Your ${meal}: about ${mealP} g of protein, from your ${dayP} g a day.</small>
        <div class="moments" role="radiogroup" style="padding:4px"><button class="choice ${sort === "pd" ? "on" : ""}">By PD</button><button class="choice ${sort === "meal" ? "on" : ""}">Most of the meal</button></div>
        ${list.map(card).join("")}
        <section class="card book-card" style="${mark};margin:14px 0;padding:14px 16px;display:flex;gap:12px;align-items:center"><img src="/books/worthy-numbers-cover.webp" alt="" style="width:72px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.15)"><div><b style="font-size:15px">The why behind these numbers</b><small style="display:block;margin:4px 0 8px;color:#5b6b8a">Worthy Numbers, the free book: PD, protein quality and the label, in eleven short pages.</small><button class="pill pill-small pill-primary">Read the book</button></div></section>
        <small style="display:block;margin-top:12px;color:#5b6b8a">Sources. Amino acids, protein and energy: USDA FoodData Central, the row named on each card; whey from a typical label, with Hamarsland 2017 (BMC Nutrition) for cysteine and tyrosine. Need per gram of protein: WHO, FAO and UNU 2007, adults. 2.5 g of leucine and about 10 g of essential amino acids a meal: the amounts research most often cites for muscle repair. PDCAAS: Hertzler 2020 (Nutrients, Table 2, adult pattern) and Boye 2012 (British Journal of Nutrition). DIAAS as published: Phillips 2017, Rutherfurd 2015, Ertl 2016, Hertzler 2020; these use a young child's needs, so plant foods score lower than they would for an adult. Educational, approximate, not medical advice. Carbs and Fats come next.</small>
      </div>`;
    }, { FOODS: list0, sort, mark, mealName, mealP, dayP });
  };
  await page2("pd", "Lunch");
  await page.evaluate((NOTE) => { const h = document.querySelector(".step-head"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New (version 4): one portion against one meal. Pick the meal; its protein comes from your own target. Three bars: how much of the meal's protein it closes, leucine against the 2.5 g a meal needs for muscle repair, and the nine essential amino acids against about 10 g a meal. Then the family in grams, its lowest marked, PDCAAS and DIAAS with their sources, and the source of the numbers."; h.before(d); }, NOTE);
  const keepCards = (names, note) => page.evaluate(({ names, note, NOTE }) => { const cards = [...document.querySelectorAll("main section.card:not(.book-card)")]; for (const c of cards) if (!names.some((n) => c.textContent.includes(n))) c.remove(); if (note) { const last = [...document.querySelectorAll("main section.card:not(.book-card)")].pop(); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; last?.after(d); } }, { names, note, NOTE });
  await keepCards(["Whey protein"], "Then seven more cards the same way: chicken breast, Greek yogurt, soybeans, salmon, egg, lentils, oats. Next screens: the order by meal, the plant cards and the end of the page.");
  await shot("r151c");
  await page2("meal", "Lunch");
  await page.evaluate((NOTE) => { const h = document.querySelector(".step-head"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New: Most of the meal puts the food that closes most of your lunch first. Chicken closes most of your lunch. A scoop of whey closes two thirds but brings more leucine than a meal needs: that is why it suits after training. Two eggs close a third and fall short on leucine."; h.before(d); }, NOTE);
  await keepCards(["Chicken breast", "Salmon"], "Then soybeans, whey, Greek yogurt, lentils, egg, oats.");
  await shot("r151d");
  await page2("pd", "Lunch");
  await keepCards(["Salmon", "Lentils"], "Oats the same way: its lowest is lysine, and dairy completes it.");
  await page.evaluate((NOTE) => { const h = document.querySelector(".step-head"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New: salmon has no PDCAAS or DIAAS in our sources yet, and the card says so. Lentils only just cover methionine and cysteine per gram: amber, its lowest, and rice completes it."; h.before(d); }, NOTE);
  await shot("r151f");
  await page2("pd", "Breakfast");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.evaluate((NOTE) => { const bk = document.querySelector(".book-card"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New: the end of the page points to Worthy Numbers. Read the book opens its page; visits from here count as their own source, Explorer, next to QR and LinkedIn in Metrics."; bk?.before(d); bk?.scrollIntoView({ block: "center" }); }, NOTE);
  await shot("r151e", false);
  await b.close(); server.kill();
})();
