// DT154 (Coach Milan 29 October 14:47 and 14:48): Explorer, Fats, the same template as Protein
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3330", U = `http://127.0.0.1:${PORT}`;
const FAT = require("/home/claude/boards/fat154.cjs");
const FAT_SHARE = Number(/FAT_SHARE = ([\d.]+)/.exec(fs.readFileSync(path.join(ROOT, "src/personal.ts"), "utf8"))[1]);
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
  // the day's numbers, as the app keeps them after the profile
  await page.goto(U + "/"); await page.waitForTimeout(1200);
  const goals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).goals);
  if (goals.fats == null) goals.fats = Math.round(goals.calories * FAT_SHARE / 9);  // the app's macroSplit
  console.log("goals", JSON.stringify(goals));
  const mealFat = Math.round(goals.fats / 3), mealKcal = Math.round(goals.calories / 3);
  const foods = Object.values(FAT(mealFat, mealKcal));
  const page2 = async (sort, keep, note, noteAt) => {
    await page.goto(U + "/me"); await page.waitForTimeout(900);
    await page.evaluate(({ foods, sort, mark, NOTE, mealFat, mealKcal, goals, keep, note, noteAt }) => {
      for (const n of document.querySelectorAll("header *, .top *")) if (n.childElementCount === 0 && n.textContent.trim() === "Me") n.textContent = "Explorer";
      const main = document.querySelector("main") ?? document.body; const meal = "lunch";
      const list = [...foods].sort((a, b) => (sort === "q" ? b.us - a.us : b.fatP - a.fatP)).filter((f) => !keep || keep.includes(f.k));
      const R = (label, val, frac, line, ok, bold, low, over) => `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><small style="width:118px;font-size:11.5px;line-height:1.15;${bold ? "font-weight:900;color:#172742" : ""}${low ? "padding-left:10px" : ""}">${label}</small><span style="position:relative;flex:1;height:8px;border-radius:4px;background:#eef2f9"><i style="position:absolute;left:0;top:0;bottom:0;width:${Math.max(Math.min(frac, 1) * 100, 1.5)}%;border-radius:4px;background:${over ? "#f0705c" : ok ? "#13916a" : "#5b8def"}"></i>${line ? '<i style="position:absolute;left:66.7%;top:-3px;bottom:-3px;width:2px;background:#172742;opacity:.55"></i>' : ""}</span><small style="width:84px;text-align:right;font-size:11.5px;font-weight:${bold ? 900 : 800};color:${over ? "#a33a2b" : ok ? "#13916a" : "#172742"}">${val}</small></div>`;
      const KV = (label, val) => `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><small style="width:118px;font-size:11.5px">${label}</small><small style="flex:1;text-align:right;font-size:11.5px;font-weight:900;color:#172742">${val}</small></div>`;
      const H = (t, sub) => `<div style="margin-top:14px;padding-top:10px;border-top:1px solid #e3e9f4"><b style="display:block;font-size:11.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#123a7a">${t}</b>${sub ? `<small style="display:block;color:#5b6b8a;font-size:11.5px;margin-top:1px">${sub}</small>` : ""}</div>`;
      const g = (v) => v.toFixed(2);
      const S = 15;
      const card = (f) => { const over = f.sfaP > f.sfaMeal; const n3low = f.mem.n3 < 0.05;
        return `<section class="card" style="margin:10px 0;padding:14px 16px">
        <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">${f.icon}</span><b style="flex:1;font-size:16px">${f.name}</b><span class="pdpill pdpill-${f.pd >= 6.5 ? "high" : "low"}" style="font-weight:900">PD ${f.pd.toFixed(1)}</span></div>
        ${H("One portion", `Every number below is for one normal portion. ${f.fat} g of every 100 g is fat.`)}
        ${KV("Portion", f.portion)}
        ${KV("Per 100 g", `${f.fat} g fat, ${f.kcal} kcal`)}
        ${H(`Fat for your ${meal}`, `Your ${meal} has room for about ${mealFat} g of fat. This portion brings ${f.closes} % of it.`)}
        ${R("Fat", `${f.fatP} of ${mealFat} g`, f.closes / 150, true, false)}
        ${H("Heart health", `Two numbers matter most: saturated fat, under 10 % of your energy, so about ${f.sfaMeal} g a ${meal}; and the omega-3 fats EPA and DHA, about 250 mg a day. ${over ? "This portion goes over the saturated share." : f.epadha >= 250 ? "This portion stays under the saturated share and covers the omega-3." : "This portion stays under the saturated share."}`)}
        ${R("Saturated fat", `${f.sfaP} of ${f.sfaMeal} g`, f.sfaP / f.sfaMeal / 1.5, true, false, false, false, over)}
        ${R("Omega-3, EPA + DHA", `${f.epadha} of 250 mg`, f.epadha / 250 / 1.5, true, f.epadha >= 250)}
        ${H("The family members", `Three kinds of fat, and among the polyunsaturated the omega-6 and omega-3 your body can't make. This portion is mostly ${({ sfa: "saturated", mufa: "monounsaturated", pufa: "polyunsaturated" })[["sfa", "mufa", "pufa"].sort((a, b) => f.mem[b] - f.mem[a])[0]]}. Grams, on the same scale for every food.`)}
        ${R("Saturated", `${g(f.mem.sfa)} g`, f.mem.sfa / S)}
        ${R("Monounsaturated", `${g(f.mem.mufa)} g`, f.mem.mufa / S)}
        ${R("Polyunsaturated", `${g(f.mem.pufa)} g`, f.mem.pufa / S)}
        ${R("of them, omega-6", `${g(f.mem.la)} g`, f.mem.la / S, false, false, false, true)}
        ${R("of them, omega-3", `${g(f.mem.n3)} g`, f.mem.n3 / S, false, false, true, true)}
        ${R("Trans", f.mem.trans === null ? "not reported" : `${g(f.mem.trans)} g`, (f.mem.trans ?? 0) / S)}
        ${H("Quality", "Two ratios people use to judge a fat, calculated from the food table. Unsaturated to saturated: the higher, the better. Omega-6 to omega-3: the lower, the more omega-3 it brings.")}
        ${[["Unsaturated : saturated", `${f.us} : 1`], ["Omega-6 : omega-3", n3low ? "almost no omega-3" : `${f.n6n3} : 1`]].map(([n, v], i) => `<div style="display:flex;gap:10px;align-items:baseline;padding:6px 0;${i ? "border-top:1px solid #eef2f9" : ""}"><b style="flex:1;font-size:12.5px">${n}</b><b style="font-size:15px">${v}</b></div>`).join("")}
        ${H("How to use it", "When and how this food serves you best.")}
        <small style="display:block;margin-top:6px;padding:6px 8px;border-radius:10px;background:#eaf1fd;color:#123a7a;font-size:12.5px"><b>Best use:</b> ${f.best}</small>
        <small style="display:block;margin-top:6px;font-size:12.5px;color:#172742"><b>Pairs with:</b> ${f.pair}</small>
        <small style="display:block;margin-top:10px;color:#5b6b8a;font-size:11px">Source: ${f.src}.</small>
      </section>`; };
      main.innerHTML = `<div style="padding:4px 16px 24px">
        <div class="moments fam-chips" role="radiogroup" style="${mark};padding:4px;margin-bottom:8px"><button class="choice">Protein</button><button class="choice on">Fats</button><button class="choice" style="opacity:.5">Carbs, next</button></div>
        <div class="step-head"><h2 style="margin:6px 0 4px;font-size:24px">Not all fats are equal</h2>
        <p style="margin:0 0 10px;color:#5b6b8a;line-height:1.45">Fat is the family. Its members are saturated, monounsaturated and polyunsaturated fats, and among the polyunsaturated the omega-6 and omega-3 your body can't make. Each food brings them in its own mix. Each food here is one portion against one meal: how much of the meal's fat it brings, and which members.</p></div>
        <div class="moments" role="radiogroup" style="padding:4px;margin-bottom:8px">${["Breakfast", "Lunch", "Dinner"].map((m) => `<button class="choice ${m === "Lunch" ? "on" : ""}">${m}</button>`).join("")}</div>
        <small style="display:block;margin:0 0 8px;color:#123a7a;font-weight:700">Your lunch: about ${mealFat} g of fat and ${mealKcal} kcal, from your ${goals.fats} g and ${goals.calories.toLocaleString("en-GB")} kcal a day.</small>
        <div class="moments" role="radiogroup" style="padding:4px"><button class="choice ${sort === "q" ? "on" : ""}">Best fat quality</button><button class="choice ${sort === "meal" ? "on" : ""}">Most of the meal</button></div>
        ${list.map(card).join("")}
        <small style="display:block;margin-top:12px;color:#5b6b8a">Sources. Fats per 100 g: USDA FoodData Central, SR Legacy, the row named on each card; omega-3 is 18:3 as USDA reports it, plus EPA, DPA and DHA. Saturated fat under 10 % of energy: WHO 2023, Saturated fatty acid and trans-fatty acid intake for adults and children. EPA and DHA, 250 mg a day for adults: EFSA, Dietary Reference Values, summary report 2017. Educational, approximate, not medical advice.</small>
      </div>`;
      if (note) { const at = noteAt ? [...document.querySelectorAll("main section.card")].find((c) => c.textContent.includes(noteAt)) : document.querySelector(".step-head"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; at?.before(d); }
    }, { foods, sort, mark, NOTE, mealFat, mealKcal, goals, keep, note, noteAt });
  };
  await page2("q", ["olive"], "New: Explorer gets the family chips: Protein, Fats, Carbs next. Fats tells the same story as Protein: one portion against one meal, in six sections, every measure the same row.");
  await shot("r154a");
  await page2("q", ["salmon", "walnuts"], "New: salmon covers the omega-3 for more than a week; walnuts bring the plant omega-3, ALA, but no EPA or DHA.", null);
  await shot("r154b");
  await page2("meal", ["butter", "cheddar"], "New: butter and cheddar. Saturated fat is a limit, not a goal: 30 g of cheddar uses two thirds of a lunch's share. The bar turns red when a portion goes over.", null);
  await shot("r154c");
  await b.close(); server.kill();
})();
