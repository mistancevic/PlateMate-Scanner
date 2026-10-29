// DT155 (Coach Milan 29 October 15:30): Explorer, Carbs, the same template as Protein and Fats
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3332", U = `http://127.0.0.1:${PORT}`;
const CARB = require("/home/claude/boards/carb155.cjs");
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
  const dayCarb = Math.round((goals.calories - goals.protein * 4 - goals.fats * 9) / 4), mealCarb = Math.round(dayCarb / 3);  // the app's macroSplit
  const foods = Object.values(CARB(mealCarb, 1 / 3));
  const page2 = async (sort, keep, note) => {
    await page.goto(U + "/me"); await page.waitForTimeout(900);
    await page.evaluate(({ foods, sort, mark, NOTE, mealCarb, dayCarb, keep, note }) => {
      for (const n of document.querySelectorAll("header *, .top *")) if (n.childElementCount === 0 && n.textContent.trim() === "Me") n.textContent = "Explorer";
      const main = document.querySelector("main") ?? document.body; const meal = "lunch";
      const list = [...foods].sort((a, b) => (sort === "gi" ? a.gi - b.gi : b.carbP - a.carbP)).filter((f) => !keep || keep.includes(f.k));
      const R = (label, val, frac, line, ok, bold) => `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><small style="width:118px;font-size:11.5px;line-height:1.15;${bold ? "font-weight:900;color:#172742" : ""}">${label}</small><span style="position:relative;flex:1;height:8px;border-radius:4px;background:#eef2f9"><i style="position:absolute;left:0;top:0;bottom:0;width:${Math.max(Math.min(frac, 1) * 100, 1.5)}%;border-radius:4px;background:${ok ? "#13916a" : "#5b8def"}"></i>${line ? '<i style="position:absolute;left:66.7%;top:-3px;bottom:-3px;width:2px;background:#172742;opacity:.55"></i>' : ""}</span><small style="min-width:84px;text-align:right;font-size:11.5px;font-weight:${bold ? 900 : 800};color:${ok ? "#13916a" : "#172742"}">${val}</small></div>`;
      const KV = (label, val) => `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><small style="width:118px;font-size:11.5px">${label}</small><small style="flex:1;text-align:right;font-size:11.5px;font-weight:900;color:#172742">${val}</small></div>`;
      const H = (t, sub) => `<div style="margin-top:14px;padding-top:10px;border-top:1px solid #e3e9f4"><b style="display:block;font-size:11.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#123a7a">${t}</b>${sub ? `<small style="display:block;color:#5b6b8a;font-size:11.5px;margin-top:1px">${sub}</small>` : ""}</div>`;
      const g = (v) => v.toFixed(2); const S = 60;
      const card = (f) => { const fibreOk = f.fibreP >= f.fibreMeal;
        return `<section class="card" style="margin:10px 0;padding:14px 16px">
        <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">${f.icon}</span><b style="flex:1;font-size:16px">${f.name}</b><span class="pdpill pdpill-${f.pd >= 6.5 ? "high" : "low"}" style="font-weight:900">PD ${f.pd.toFixed(1)}</span></div>
        ${H("One portion", `Every number below is for one normal portion. ${f.carb} g of every 100 g is carbohydrate.`)}
        ${KV("Portion", f.portion)}
        ${KV("Per 100 g", `${f.carb} g carbs, ${f.kcal} kcal`)}
        ${H(`Carbs for your ${meal}`, `Your ${meal} has room for about ${mealCarb} g of carbs. This portion brings ${f.closes} % of it.`)}
        ${R("Carbs", `${f.carbP} of ${mealCarb} g`, f.closes / 150, true)}
        ${H("Fibre and sugar", `A day needs at least 25 g of fibre, so about ${f.fibreMeal} g a ${meal}; free sugars stay under 10 % of your energy, and the sugar inside whole fruit doesn't count as free. ${fibreOk ? "This portion covers the fibre." : "This portion brings part of the fibre."}`)}
        ${R("Fibre", `${f.fibreP} of ${f.fibreMeal} g`, f.fibreP / f.fibreMeal / 1.5, true, fibreOk)}
        ${R("Sugars", `${f.sugarP} g`, f.sugarP / S)}
        ${H("The family members", `Starch, sugars and fibre. This portion is mostly ${f.mem.starch >= f.mem.sugar ? "starch" : "sugars"}. Grams, on the same scale for every food.`)}
        ${R("Starch and other carbs", `${g(f.mem.starch)} g`, f.mem.starch / S)}
        ${R("Sugars", `${g(f.mem.sugar)} g`, f.mem.sugar / S)}
        ${R("Fibre", `${g(f.mem.fibre)} g`, f.mem.fibre / S, false, false, true)}
        ${H("Quality", "How fast the carbs reach your blood. GI: 55 or less is low, 70 or more is high. GL counts the portion: GI times its carbs without fibre, divided by 100.")}
        <div style="display:flex;gap:10px;align-items:baseline;padding:6px 0"><b style="width:40px;font-size:12.5px">GI</b><b style="width:90px;font-size:15px">${f.gi}, ${f.band === "between low and high" ? "in between" : f.band}</b><small style="flex:1;font-size:11px;line-height:1.3">Atkinson 2008, Table 1: ${f.giRow}</small></div>
        <div style="display:flex;gap:10px;align-items:baseline;padding:6px 0;border-top:1px solid #eef2f9"><b style="width:40px;font-size:12.5px">GL</b><b style="width:90px;font-size:15px">${f.gl}</b><small style="flex:1;font-size:11px;line-height:1.3">For this portion, calculated by the same paper's method</small></div>
        ${H("How to use it", "When and how this food serves you best.")}
        <small style="display:block;margin-top:6px;padding:6px 8px;border-radius:10px;background:#eaf1fd;color:#123a7a;font-size:12.5px"><b>Best use:</b> ${f.best}</small>
        <small style="display:block;margin-top:6px;font-size:12.5px;color:#172742"><b>Pairs with:</b> ${f.pair}</small>
        <small style="display:block;margin-top:10px;color:#5b6b8a;font-size:11px">Source: ${f.src}.</small>
      </section>`; };
      main.innerHTML = `<div style="padding:4px 16px 24px">
        <div class="moments" role="radiogroup" style="padding:4px;margin-bottom:8px"><button class="choice">Protein</button><button class="choice">Fats</button><button class="choice on">Carbs</button></div>
        <div class="step-head"><h2 style="margin:6px 0 4px;font-size:24px">Not all carbs are equal</h2>
        <p style="margin:0 0 10px;color:#5b6b8a;line-height:1.45">Carbohydrate is the family. Its members are starch, sugars and fibre. Each food brings them in its own mix, and they reach your blood at different speeds. Each food here is one portion against one meal: how much of the meal's carbs it brings, and which members.</p></div>
        <div class="moments" role="radiogroup" style="padding:4px;margin-bottom:8px">${["Breakfast", "Lunch", "Dinner"].map((m) => `<button class="choice ${m === "Lunch" ? "on" : ""}">${m}</button>`).join("")}</div>
        <small style="display:block;margin:0 0 8px;color:#123a7a;font-weight:700">Your lunch: about ${mealCarb} g of carbs, from your ${dayCarb} g a day.</small>
        <div class="moments" role="radiogroup" style="padding:4px"><button class="choice ${sort === "gi" ? "on" : ""}">Lowest GI</button><button class="choice ${sort === "meal" ? "on" : ""}">Most of the meal</button></div>
        ${list.map(card).join("")}
        <small style="display:block;margin-top:12px;color:#5b6b8a">Sources. Carbs, fibre and sugars per 100 g: USDA FoodData Central, SR Legacy, the row named on each card; starch and other carbs is what remains, calculated. GI: Atkinson, Foster-Powell and Brand-Miller 2008, International Tables of Glycemic Index and Glycemic Load Values, Diabetes Care, Table 1, the mean of several studies; GL calculated by its method. Fibre, at least 25 g a day for adults: WHO 2023 carbohydrate guideline and EFSA. Free sugars under 10 % of energy: WHO 2015 sugars guideline. Educational, approximate, not medical advice.</small>
      </div>`;
      if (note) { const at = document.querySelector(".step-head"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; at?.before(d); }
    }, { foods, sort, mark, NOTE, mealCarb, dayCarb, keep, note });
  };
  await page2("gi", ["lentils"], "New: Carbs, the same story as Protein and Fats. Lentils first by GI: the steadiest carb here, and nearly twice a lunch's fibre.");
  await shot("r155a");
  await page2("meal", ["pasta", "potato"], "New: Most of the meal. Pasta is low GI, 49, but 200 g brings two thirds of a lunch's carbs, so its GL, 29, is among the highest here: GL counts the portion. Potatoes are high GI, 78.");
  await shot("r155b");
  await page2("gi", ["banana", "apple"], "New: fruit. The sugar inside whole fruit isn't free sugar, and the fibre comes with it.");
  await shot("r155c");
  await b.close(); server.kill();
})();
