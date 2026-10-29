// DT151 (Coach Milan 29 October 09:52 to 09:54): Explorer, the MVP for the pitch: Menu below Foods, Not all proteins are equal
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3324", U = `http://127.0.0.1:${PORT}`;
// DT151 v3 (10:10): numbers checked against USDA FoodData Central; need from WHO/FAO/UNU 2007 (adult, per kg per day). Calculated in /home/claude/boards/eaa151.cjs.
const CALC = require("/home/claude/boards/eaa151.cjs")(85);
const FOODS = [
  { k: "whey", icon: "🥤", name: "Whey protein powder", portion: "One scoop, 30 g", pair: "Nothing: it is complete.", best: "After training: one scoop in water or milk. Fast to digest and the most leucine per gram, so it starts muscle repair quickest. Also lifts a breakfast short of protein." },
  { k: "chicken", icon: "🍗", name: "Chicken breast", portion: "150 g", pair: "Nothing: it is complete.", best: "The anchor of a main meal: 150 g brings most lunches and dinners to their protein. Lean, so the PD stays high whatever goes with it." },
  { k: "yogurt", icon: "🥣", name: "Greek yogurt, 0 %", portion: "200 g", pair: "Nothing: it is complete. It lifts oats and fruit.", best: "Breakfast or before sleep: its casein digests slowly and feeds amino acids for hours. Lifts oats and fruit to your PD." },
  { k: "salmon", icon: "🐟", name: "Salmon", portion: "150 g", pair: "Nothing: it is complete. Its fat is the good kind.", best: "Twice a week as a main meal: protein plus the omega-3 fats. Its own fat lowers the PD, so add vegetables, not more fat." },
  { k: "soy", icon: "🫘", name: "Soybeans, boiled", portion: "150 g", pair: "Complete for an adult. Rice or bread tops up methionine, its lowest.", best: "The plant anchor: the most complete plant protein, as tofu, edamame or beans. 150 g brings as much protein as a scoop of whey." },
  { k: "egg", icon: "🥚", name: "Egg", portion: "2 eggs, 100 g", pair: "Nothing: the reference protein. Half its energy is the yolk's fat.", best: "Breakfast, or to complete a plant meal. Two eggs are a third of a meal's protein, so add a third egg or egg whites, which also raise the PD." },
  { k: "lentils", icon: "🫘", name: "Lentils, boiled", portion: "200 g", pair: "Rice completes it: rice has the methionine lentils lack, lentils the lysine rice lacks.", best: "A plant lunch with rice: together complete, and the fibre keeps you full for hours. Count it as protein and carb together." },
  { k: "oats", icon: "🌾", name: "Oats, dry", portion: "50 g", pair: "Milk, skyr or yogurt completes it: dairy has the lysine oats lack.", best: "A breakfast carb, not a protein: 50 g gives 7 g protein. Cook it in milk or top it with skyr, which brings the lysine and the PD up." },
].map((f) => ({ ...f, ...CALC[f.k] }));
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
  const page2 = async (sort) => {
    await page.goto(U + "/me"); await page.waitForTimeout(900);
    await page.evaluate(({ FOODS, sort, mark }) => {
      for (const n of document.querySelectorAll("header *, .top *")) if (n.childElementCount === 0 && n.textContent.trim() === "Me") n.textContent = "Explorer";
      const main = document.querySelector("main") ?? document.body; const target = 6.5;
      const pd = (f) => f.pd;
      const list = [...FOODS].sort((a, b) => (sort === "pd" ? b.pd - a.pd : b.protein - a.protein));
      const N = { his: "Histidine", ile: "Isoleucine", leu: "Leucine", lys: "Lysine", saa: "Methionine + cysteine", aaa: "Phenylalanine + tyrosine", thr: "Threonine", trp: "Tryptophan", val: "Valine" };
      const g = (v) => v.toFixed(2);
      const you = (f) => f.pd >= target ? `Above your PD ${target}: one portion lifts a plate.` : `Below your PD ${target}: it needs a partner richer in protein.`;
      const card = (f) => `<section class="card" style="margin:10px 0;padding:14px 16px">
        <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">${f.icon}</span><b style="flex:1;font-size:16px">${f.name}</b><span class="pdpill pdpill-${f.pd >= target ? "high" : "low"}" style="font-weight:900">PD ${f.pd.toFixed(1)}</span></div>
        <small style="display:block;margin:4px 0 8px;color:#5b6b8a">${f.p} g protein · ${f.kcal} kcal per 100 g</small>
        <span style="display:inline-block;padding:3px 9px;border-radius:999px;font-size:12.5px;font-weight:800;background:#eaf1fd;color:#123a7a">${f.portion}: ${f.protein} g protein, ${f.por.leu.toFixed(1)} g leucine</span>
        <div style="margin-top:10px"><small style="display:block;font-weight:800;margin-bottom:4px">The nine essential amino acids in this portion, against your day</small>
          ${Object.entries(N).map(([k, n]) => { const pc = f.pct[k], w = Math.min(pc, 150) / 150 * 100, c = pc >= 100 ? "#13916a" : "#5b8def";
            return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0"><small style="width:96px;font-size:11px;line-height:1.1;${k === "leu" ? "font-weight:900" : ""}">${n}</small><span style="position:relative;flex:1;height:8px;border-radius:4px;background:#e8eef9"><i style="position:absolute;left:0;top:0;bottom:0;width:${w}%;border-radius:4px;background:${c}"></i><i style="position:absolute;left:66.7%;top:-2px;bottom:-2px;width:2px;background:#172742;opacity:.55"></i></span><small style="width:78px;text-align:right;font-size:11px;font-weight:800;color:${pc >= 100 ? "#13916a" : "#172742"}">${g(f.por[k])} of ${g(f.day[k])} g</small></div>`; }).join("")}
          <small style="display:block;color:#5b6b8a;font-size:11px;margin-top:2px">The line is your whole day, calculated for 85 kg. Green: this portion alone covers the day.</small></div>
        <small style="display:block;margin-top:6px;padding:6px 8px;border-radius:10px;background:#eaf1fd;color:#123a7a"><b>Best use:</b> ${f.best}</small>
        <small style="display:block;margin-top:6px"><b>Completes it:</b> ${f.pair}</small>
        <small style="display:block;margin-top:6px;color:#123a7a;font-weight:700">For you: ${you(f)}</small>
      </section>`;
      main.innerHTML = `<div style="padding:4px 16px 24px">
        <div class="step-head"><h2 style="margin:6px 0 4px;font-size:24px">Not all proteins are equal</h2>
        <p style="margin:0 0 10px;color:#5b6b8a;line-height:1.45">Protein is the surname. Whey, egg or lentil is the first name, and each behaves differently: how much protein per energy (PD), how complete it is, how much leucine it brings. Eight foods, one portion each, against what your body needs in a day.</p></div>
        <div class="moments" role="radiogroup" style="${mark};padding:4px"><button class="choice ${sort === "pd" ? "on" : ""}">By PD</button><button class="choice ${sort === "q" ? "on" : ""}">By portion</button></div>
        ${list.map(card).join("")}
        <small style="display:block;margin-top:12px;color:#5b6b8a">Amino acids: USDA FoodData Central. Your need: WHO, adults, per kg of body weight. Plant protein digests a little less, about 80 to 90 % against about 95 % for animal, so a plant portion gives a little less than its bars. Educational, approximate, not medical advice. Carbs and Fats come next.</small>
      </div>`;
    }, { FOODS, sort, mark });
  };
  await page2("pd");
  await page.evaluate((NOTE) => { const h = document.querySelector(".step-head"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New (version 3): each bar is grams in one portion against your whole day, calculated for your 85 kg. The line is 100 % of the day. Numbers checked against USDA. Then Best use, what completes it, and one line against your PD target."; h.before(d); }, NOTE);
  await shot("r151c");
  await page2("q");
  await page.evaluate((NOTE) => { const h = document.querySelector(".step-head"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New: By portion puts the most protein per portion first. 150 g of soybeans brings as much as a scoop of whey. The lowest bar shows what to pair: lentils lowest in methionine, so rice; oats lowest in lysine, so dairy."; h.before(d); }, NOTE);
  await shot("r151d");
  await b.close(); server.kill();
})();
