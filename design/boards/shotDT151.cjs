// DT151 (Coach Milan 29 October 09:52 to 09:54): Explorer, the MVP for the pitch: Menu below Foods, Not all proteins are equal
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3324", U = `http://127.0.0.1:${PORT}`;
// the design's data.js (Design Explorer: Macros), per 100 g; DIAAS and the limiting amino acid from its quality field. To be checked.
const FOODS = [
  { icon: "🥤", name: "Whey protein powder", kcal: 370, p: 90, leu: 11.0, diaas: 1.09, complete: true, short: "", pair: "Nothing: it is complete. Fast, so it suits after training.", serve: "One scoop, 30 g: 27 g protein, 3.3 g leucine." , eaa: {"his": 1.26, "ile": 2.3, "leu": 2.07, "lys": 2.35, "met": 1.46, "phe": 1.33, "thr": 3.29, "trp": 3.15, "val": 1.62}, best: "After training: one scoop in water or milk. Fast to digest, the most leucine per gram, so it starts muscle repair quickest. Also lifts a breakfast short of protein." },
  { icon: "🍗", name: "Chicken breast", kcal: 120, p: 22.5, leu: 1.7, diaas: 1.10, complete: true, short: "", pair: "Nothing: it is complete.", serve: "150 g: 34 g protein, 2.6 g leucine." , eaa: {"his": 2.15, "ile": 1.72, "leu": 1.28, "lys": 1.89, "met": 1.73, "phe": 1.6, "thr": 1.84, "trp": 1.93, "val": 1.27}, best: "The anchor of a main meal: 150 g brings most lunches and dinners to their protein. Lean, so the PD stays high whatever goes with it." },
  { icon: "🥣", name: "Greek yogurt, 2 %", kcal: 59, p: 10, leu: 1.0, diaas: 1.14, complete: true, short: "", pair: "Nothing: it is complete. Lifts oats and fruit.", serve: "200 g: 20 g protein, 2.0 g leucine." , eaa: {"his": 1.87, "ile": 2.07, "leu": 1.69, "lys": 1.78, "met": 1.56, "phe": 2.0, "thr": 1.96, "trp": 2.33, "val": 1.74}, best: "Breakfast or before sleep: its casein digests slowly and feeds amino acids for hours. Lifts oats and fruit to your PD." },
  { icon: "🐟", name: "Salmon", kcal: 208, p: 20, leu: 1.6, diaas: 1.09, complete: true, short: "", pair: "Nothing: it is complete. Its fat is the good kind.", serve: "150 g: 30 g protein, 2.4 g leucine." , eaa: {"his": 1.97, "ile": 1.53, "leu": 1.37, "lys": 2.03, "met": 1.88, "phe": 1.56, "thr": 1.91, "trp": 1.92, "val": 1.32}, best: "Twice a week as a main meal: protein plus the omega-3 fats. Its own fat lowers the PD, so add vegetables, not more fat." },
  { icon: "🥚", name: "Egg", kcal: 143, p: 12.6, leu: 1.1, diaas: 1.13, complete: true, short: "", pair: "Nothing: the reference protein. Half its energy is the yolk's fat.", serve: "2 eggs, 104 g: 13 g protein, 1.1 g leucine." , eaa: {"his": 1.81, "ile": 1.61, "leu": 1.39, "lys": 1.49, "met": 0.83, "phe": 2.1, "thr": 1.89, "trp": 2.41, "val": 1.28}, best: "The plant anchor: the most complete plant protein, as tofu, edamame or beans. With rice or bread it is complete." },
  { icon: "🫘", name: "Soybeans, boiled", kcal: 173, p: 16.6, leu: 1.4, diaas: 0.90, complete: true, short: "methionine", pair: "Rice or bread tops up the little methionine it lacks.", serve: "150 g: 25 g protein, 2.0 g leucine." , eaa: {"his": 1.56, "ile": 1.81, "leu": 1.46, "lys": 1.61, "met": 1.94, "phe": 2.16, "thr": 1.92, "trp": 2.21, "val": 1.75}, best: "Breakfast, or to complete a plant meal: the reference protein. Egg whites raise the PD of an omelette." },
  { icon: "🫘", name: "Lentils, boiled", kcal: 116, p: 9, leu: 0.65, diaas: 0.63, complete: false, short: "methionine", pair: "Rice completes it: rice has the methionine lentils lack, lentils the lysine rice lacks.", serve: "200 g: 18 g protein, 1.3 g leucine." , eaa: {"his": 1.85, "ile": 1.44, "leu": 1.22, "lys": 1.56, "met": 0.56, "phe": 1.96, "thr": 1.55, "trp": 1.48, "val": 1.28}, best: "A plant lunch with rice: together complete, and the fibre keeps you full for hours. Count it as protein and carb together." },
  { icon: "🌾", name: "Oats, dry", kcal: 389, p: 13, leu: 1.0, diaas: 0.57, complete: false, short: "lysine", pair: "Milk, skyr or yogurt completes it: dairy has the lysine oats lack.", serve: "50 g: 6.5 g protein, 0.5 g leucine." , eaa: {"his": 1.49, "ile": 1.28, "leu": 1.28, "lys": 0.91, "met": 1.01, "phe": 2.06, "thr": 1.44, "trp": 2.31, "val": 1.36}, best: "A breakfast carb, not a protein: cook it in milk or top it with skyr, which brings the lysine oats lack and the PD up." },
];
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
      const pd = (f) => (100 * f.p) / f.kcal;
      const list = [...FOODS].sort((a, b) => (sort === "pd" ? pd(b) - pd(a) : b.diaas - a.diaas));
      const qual = (f) => f.diaas >= 1 ? `Complete, top quality · DIAAS ${f.diaas.toFixed(2)}` : f.complete ? `Complete, a little short of ${f.short} · DIAAS ${f.diaas.toFixed(2)}` : `Incomplete: short of ${f.short} · DIAAS ${f.diaas.toFixed(2)}`;
      const qc = (f) => f.diaas >= 1 ? "background:#e3f4ea;color:#155c34" : f.complete ? "background:#fff4e0;color:#8a5a00" : "background:#fdecea;color:#a33a2b";
      const you = (f) => pd(f) >= target ? `Above your PD ${target}: one portion lifts a plate.` : `Below your PD ${target}: it needs a partner richer in protein.`;
      const card = (f) => `<section class="card" style="margin:10px 0;padding:14px 16px">
        <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">${f.icon}</span><b style="flex:1;font-size:16px">${f.name}</b><span class="pdpill pdpill-${pd(f) >= target ? "high" : "low"}" style="font-weight:900">PD ${pd(f).toFixed(1)}</span></div>
        <small style="display:block;margin:4px 0 8px;color:#5b6b8a">${f.p} g protein · ${f.kcal} kcal per 100 g</small>
        <span style="display:inline-block;padding:3px 9px;border-radius:999px;font-size:12.5px;font-weight:800;${qc(f)}">${qual(f)}</span>
        <div style="margin-top:10px"><small style="display:block;font-weight:800;margin-bottom:4px">The nine essential amino acids, against what your body needs</small>
          ${Object.entries({ his: "Histidine", ile: "Isoleucine", leu: "Leucine", lys: "Lysine", met: "Methionine", phe: "Phenylalanine", thr: "Threonine", trp: "Tryptophan", val: "Valine" }).map(([k, n]) => { const v = f.eaa[k], w = Math.min(v, 2) / 2 * 100, c = v >= 1 ? "#13916a" : v >= 0.75 ? "#f6b94a" : "#f0705c";
            return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0"><small style="width:92px;font-size:11.5px;${k === "leu" ? "font-weight:900" : ""}">${n}</small><span style="position:relative;flex:1;height:8px;border-radius:4px;background:#e8eef9"><i style="position:absolute;left:0;top:0;bottom:0;width:${w}%;border-radius:4px;background:${c}"></i><i style="position:absolute;left:50%;top:-2px;bottom:-2px;width:2px;background:#172742;opacity:.55"></i></span><small style="width:40px;text-align:right;font-size:11.5px;font-weight:800;color:${c}">${Math.round(v * 100)}%</small></div>`; }).join("")}
          <small style="display:block;color:#5b6b8a;font-size:11px;margin-top:2px">The line is 100 %, what you need per gram of protein. Below it, the food is short of that one.</small></div>
        <small style="display:block;margin-top:8px"><b>Leucine</b> ${f.leu.toFixed(f.leu < 1 ? 2 : 1)} g per 100 g: the amino acid that switches on muscle repair. ${f.serve}</small>
        <small style="display:block;margin-top:6px;padding:6px 8px;border-radius:10px;background:#eaf1fd;color:#123a7a"><b>Best use:</b> ${f.best}</small>
        <small style="display:block;margin-top:6px"><b>Completes it:</b> ${f.pair}</small>
        <small style="display:block;margin-top:6px;color:#123a7a;font-weight:700">For you: ${you(f)}</small>
      </section>`;
      main.innerHTML = `<div style="padding:4px 16px 24px">
        <div class="step-head"><h2 style="margin:6px 0 4px;font-size:24px">Not all proteins are equal</h2>
        <p style="margin:0 0 10px;color:#5b6b8a;line-height:1.45">Protein is the surname. Whey, egg or lentil is the first name, and each behaves differently: how much protein per energy (PD), how complete it is, how much leucine it brings. Eight foods, per 100 g.</p></div>
        <div class="moments" role="radiogroup" style="${mark};padding:4px"><button class="choice ${sort === "pd" ? "on" : ""}">By PD</button><button class="choice ${sort === "q" ? "on" : ""}">By quality</button></div>
        ${list.map(card).join("")}
        <small style="display:block;margin-top:12px;color:#5b6b8a">Quality is DIAAS: how well a food's protein covers what your body needs, 1.00 and up is complete. Educational, approximate, not medical advice. Carbs and Fats come next.</small>
      </div>`;
    }, { FOODS, sort, mark });
  };
  await page2("pd");
  await page.evaluate((NOTE) => { const h = document.querySelector(".step-head"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New (version 2): eight protein foods, each with PD, quality, all nine essential amino acids as bars against what your body needs (the short one shows red or amber), leucine, Best use (when and how), what completes it, and one line against your PD target."; h.before(d); }, NOTE);
  await shot("r151c");
  await page2("q");
  await page.evaluate((NOTE) => { const h = document.querySelector(".step-head"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New: By quality puts the complete proteins first. The bars show why: soy dips at methionine, lentils further, oats at lysine; rice and dairy fill those gaps."; h.before(d); }, NOTE);
  await shot("r151d");
  await b.close(); server.kill();
})();
