// DT158 (Coach Milan 29 October 16:16 to 17:42): Explorer, Micros: vitamins and minerals against the day
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3336", U = `http://127.0.0.1:${PORT}`;
const MICRO = require("/home/claude/boards/micro158.cjs");
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
  const foods = Object.values(MICRO()); const M = MICRO.M, NRV = MICRO.NRV;
  const page2 = async (sort, keep, note) => {
    await page.goto(U + "/me"); await page.waitForTimeout(900);
    await page.evaluate(({ foods, sort, mark, NOTE, keep, note, M, NRV }) => {
      for (const n of document.querySelectorAll("header *, .top *")) if (n.childElementCount === 0 && n.textContent.trim() === "Me") n.textContent = "Explorer";
      const main = document.querySelector("main") ?? document.body;
      const list = [...foods].sort((a, b) => b.top.length - a.top.length).filter((f) => !keep || keep.includes(f.k));
      const R = (label, val, frac, line, ok, bold) => `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><small style="width:118px;font-size:11.5px;line-height:1.15;${bold ? "font-weight:900;color:#172742" : ""}">${label}</small><span style="position:relative;flex:1;height:8px;border-radius:4px;background:#eef2f9"><i style="position:absolute;left:0;top:0;bottom:0;width:${Math.max(Math.min(frac, 1) * 100, 1.5)}%;border-radius:4px;background:${ok ? "#13916a" : "#5b8def"}"></i>${line ? '<i style="position:absolute;left:66.7%;top:-3px;bottom:-3px;width:2px;background:#172742;opacity:.55"></i>' : ""}</span><small style="min-width:96px;text-align:right;font-size:11.5px;font-weight:${bold ? 900 : 800};color:${ok ? "#13916a" : "#172742"}">${val}</small></div>`;
      const KV = (label, val) => `<div style="display:flex;align-items:center;gap:6px;margin:4px 0"><small style="width:118px;font-size:11.5px">${label}</small><small style="flex:1;text-align:right;font-size:11.5px;font-weight:900;color:#172742">${val}</small></div>`;
      const H = (t, sub) => `<div style="margin-top:14px;padding-top:10px;border-top:1px solid #e3e9f4"><b style="display:block;font-size:11.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#123a7a">${t}</b>${sub ? `<small style="display:block;color:#5b6b8a;font-size:11.5px;margin-top:1px">${sub}</small>` : ""}</div>`;
      const SUB = (t) => `<small style="display:block;margin:8px 0 2px;font-size:11.5px;font-weight:800;color:#123a7a">${t}</small>`;
      const fmt = (v, u) => v === null ? "not reported" : `${v < 10 ? v.toFixed(1) : Math.round(v)} ${u}`;
      const card = (f) => {
        const rowOf = (m) => { const p = f.pct[m.id]; return R(m.name, p === null ? "not reported" : `${fmt(f.amt[m.id], m.unit)} · ${p} %`, (p ?? 0) / 150, true, p !== null && p >= 100); };
        const low = (n) => n.replace(/^Vitamin /, "vitamin ").replace(/^(Folate|Calcium|Iron|Magnesium|Potassium|Zinc)$/, (x) => x.toLowerCase()); const yes = f.claims.map((c) => (c.high ? "High in " : "Source of ") + low(c.name));
        return `<section class="card" style="margin:10px 0;padding:14px 16px">
        <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">${f.icon}</span><b style="flex:1;font-size:16px">${f.name}</b><span class="pdpill pdpill-${f.pd >= 6.5 ? "high" : "low"}" style="font-weight:900">PD ${f.pd.toFixed(1)}</span></div>
        ${H("One portion", "Every number below is for one normal portion.")}
        ${KV("Portion", f.portion)}
        ${KV("Per 100 g", `${f.kcal} kcal, ${f.p} g protein`)}
        ${H("For your day", `Vitamins and minerals count per day, not per meal. ${f.top.length ? `This portion brings at least a third of the day's ${f.top.map((m) => m.name.replace("Vitamin ", "vitamin ").replace(/^(Folate|Calcium|Iron|Magnesium|Potassium|Zinc)$/, (x) => x.toLowerCase())).join(", ")}.` : "This portion brings less than a third of the day of each."}`)}
        ${f.top.map(rowOf).join("")}
        ${H("The family members", "Vitamins and minerals. Fat-soluble vitamins are stored and need some fat in the meal; water-soluble ones aren't stored, so you need them more often. Each bar is this portion against the EU reference intake on labels; the line is the whole day.")}
        ${SUB("Vitamins, fat-soluble")}${M.filter((m) => m.group === "fat").map(rowOf).join("")}
        ${SUB("Vitamins, water-soluble")}${M.filter((m) => m.group === "water").map(rowOf).join("")}
        ${SUB("Minerals")}${M.filter((m) => m.group === "min").map(rowOf).join("")}
        ${f.pct.d !== null && f.pct.d > 0 ? `<small style="display:block;margin-top:4px;color:#5b6b8a;font-size:11px">Vitamin D: the label's reference is 5 µg a day; EFSA sets 15 µg for adults. Against EFSA, this portion brings ${Math.round(f.pct.d / 3)} %.</small>` : ""}
        ${H("What a label could say", `By EU rules, a food may say it is a source of a vitamin or mineral with 15 % of the reference per 100 g, and high in it with twice that. ${yes.length ? `This one could say: ${yes.join(", ")}.` : "This one could claim none of them."}`)}
        ${H("How to use it", "When and how this food serves you best.")}
        <small style="display:block;margin-top:6px;padding:6px 8px;border-radius:10px;background:#eaf1fd;color:#123a7a;font-size:12.5px"><b>Best use:</b> ${f.best}</small>
        <small style="display:block;margin-top:6px;font-size:12.5px;color:#172742"><b>Pairs with:</b> ${f.pair}</small>
        <small style="display:block;margin-top:10px;color:#5b6b8a;font-size:11px">Source: ${f.src}.</small>
      </section>`; };
      main.innerHTML = `<div style="padding:4px 16px 24px">
        <div class="moments" role="radiogroup" style="${mark};padding:4px;margin-bottom:8px"><button class="choice">Protein</button><button class="choice">Fats</button><button class="choice">Carbs</button><button class="choice on">Micros</button></div>
        <div class="step-head"><h2 style="margin:6px 0 4px;font-size:24px">Not all micros are equal</h2>
        <p style="margin:0 0 10px;color:#5b6b8a;line-height:1.45">Micronutrients are the family. Its members are the vitamins, fat-soluble and water-soluble, and the minerals. You need them in milligrams and micrograms, every day. Each food here is one portion against your day: which members it brings, and how much.</p></div>
        <small style="display:block;margin:0 0 8px;color:#123a7a;font-weight:700">Against the EU reference intakes on labels, the same for every adult.</small>
        ${list.map(card).join("")}
        <small style="display:block;margin-top:12px;color:#5b6b8a">Sources. Vitamins and minerals per 100 g: USDA FoodData Central, the row named on each card. Reference intakes: Regulation (EU) No 1169/2011, Annex XIII, Part A. Source of and high in: 15 % of the reference per 100 g, and twice that, Regulation (EC) No 1924/2006. Vitamin D for adults, 15 µg: EFSA. Educational, approximate, not medical advice.</small>
      </div>`;
      if (note) { const at = document.querySelector(".step-head"); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; at?.before(d); }
    }, { foods, sort, mark, NOTE, keep, note, M, NRV });
  };
  await page2(null, ["spinach"], "New: Micros, the fourth family. Against the day, not the meal: vitamins and minerals count per day. The members in three groups: fat-soluble vitamins, water-soluble vitamins, minerals. Spinach: vitamin K for almost four days.");
  await shot("r158a");
  await page2(null, ["salmon"], "New: salmon has real vitamin D: four times the label's 5 µg. EFSA sets 15 µg for adults, so the card says that too.");
  await shot("r158b");
  await page2(null, ["lentils", "pepper"], "New: lentils bring the day's folate and plant iron; a red pepper brings two days of vitamin C, which helps take up that iron.");
  await shot("r158c");
  await b.close(); server.kill();
})();
