// DT164 (Coach Milan 29 October 21:37 to 21:59): Foods, a fifth chip: one food through every lens, against your goal
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3344", U = `http://127.0.0.1:${PORT}`;
const F = require("/home/claude/boards/foods164.json");
const FAT_SHARE = Number(/FAT_SHARE = ([\d.]+)/.exec(fs.readFileSync(path.join(ROOT, "src/personal.ts"), "utf8"))[1]);
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-29T10:10:00"));
  await page.addInitScript(([s]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name, keep) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const openMicros = async () => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(600); await page.locator(".ex-families").getByRole("radio", { name: "Micros" }).click(); await page.waitForTimeout(300); };
  const fmt = (v) => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
  const FOR = '<span class="ex-for">for you</span>';
  // a member page in the app's own classes, from the data
  const openEx = async (fam) => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(600); if (fam !== "Protein") { await page.locator(".ex-families").getByRole("radio", { name: fam }).click(); await page.waitForTimeout(300); } };
  // the meal and the PD target, as the app has them for this profile
  await openEx("Protein");
  const pdRef = await page.evaluate(() => { const m = /above your ([\d.]+)/.exec(document.querySelector(".ex-card .ex-head small")?.textContent ?? ""); return m ? m[1] : "6.2"; });
  const H = (t, g, extra = "") => `<div class="ex-head"${extra}><b>${t}</b><small>${g}</small></div>`;
  const Row = (name, val, frac, ok, sub, need = true) => `<div class="ex-row${ok ? " ex-ok" : ""}"><small class="ex-name">${name}${sub ? `<span class="ex-sub">${sub}</span>` : ""}</small><span class="ex-bar"><i style="width:${Math.max(Math.min(frac, 1) * 100, 1.5)}%"></i>${need ? '<i class="ex-need"></i>' : ""}</span><small class="ex-val">${val}</small></div>`;
  const Pair = (n, v) => `<div class="ex-row ex-pair"><small class="ex-name">${n}</small><small class="ex-val">${v}</small></div>`;
  const lensHead = (t, g, fam) => `<div class="ex-head" style="display:block"><b style="display:flex;justify-content:space-between">${t}<a style="font-size:11px;letter-spacing:0;text-transform:none;color:#2e7be8;text-decoration:none">Open in ${fam} ›</a></b><small>${g}</small></div>`;
  const goalLine = (mark2, t) => `<div style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><b style="width:18px;flex-shrink:0;color:${mark2 === "✓" ? "#13916a" : "#5b6b8a"}">${mark2}</b><small style="line-height:1.35">${t}</small></div>`;
  const NA = (t) => `<small class="ex-src" style="display:block;margin:4px 0">${t}</small>`;
  const foodCard = (o) => `<section class="card ex-card" style="${mark};outline-offset:4px"><div class="ex-title"><span class="ex-icon">${o.icon}</span><b>${o.name}</b><span class="pdpill pdpill-${o.pd >= Number(pdRef) ? "high" : "low"}">PD ${o.pd.toFixed(1)}</span></div>
    ${H("One portion", `Every number below is for one normal portion, from one USDA row for every lens.`)}${Pair("Portion", o.portion)}<div class="ex-row ex-pair"><small class="ex-name">Per 100 g</small><small class="ex-val" style="white-space:normal;flex:1;line-height:1.3">${o.per100}</small></div>
    <div class="ex-head"><b>For your goal<span class="ex-for">for you</span></b><small>Maintain: what this portion does for your lunch and your day, from the numbers below.</small></div>
    ${o.goal.map(([m2, t]) => goalLine(m2, t)).join("")}
    ${o.lenses.join("")}
    ${H("What a label could say", `By EU rules. This one could say: ${o.claims.join(", ")}.`)}
    <small class="ex-src ex-card-src">Source: ${o.src}</small></section>`;
  const list = (opened, note) => page.evaluate(({ F, opened, note, NOTE, mark, html, PDREF }) => {
    for (const el of document.querySelectorAll(".ex-families .choice")) el.classList.remove("on");
    const fams = document.querySelector(".ex-families"); fams.insertAdjacentHTML("beforeend", `<button class="choice on" style="${mark};outline-offset:2px">Foods</button>`);
    for (const n of [...fams.parentElement.children]) if (n !== fams && !n.classList.contains("ex-calc")) n.remove();
    const names = Object.values(F).sort((a, b) => a.name.localeCompare(b.name));
    const pdOf = (f) => (f.fams.protein?.pd ?? f.fams.micros?.pd ?? null);
    const row = (f) => `<div class="menu-row" style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin:5px 0;background:#fff;border:1px solid #e3e9f4;border-radius:12px"><span style="font-size:20px">${f.icon}</span><b style="flex:1;font-size:14px">${f.name}<small style="display:block;font-weight:500;color:#5b6b8a;font-size:11.5px">${Object.values(f.portions)[0]}</small></b>${pdOf(f) !== null ? `<span class="pdpill pdpill-${pdOf(f) >= PDREF ? "high" : "low"}" style="font-size:11px">PD ${pdOf(f).toFixed(1)}</span>` : ""}<span style="color:#5b6b8a">›</span></div>`;
    if (opened) fams.insertAdjacentHTML("afterend", `<small style="display:block;color:#2e7be8;font-weight:800;margin:8px 0 4px">‹ Every food</small><h2 class="ex-h">${opened}</h2>` + html);
    else fams.insertAdjacentHTML("afterend", `<h2 class="ex-h">Every food, every lens</h2><p class="ex-intro">Each food once, through all four families: its protein, its fats, its carbs, its vitamins and minerals, and what one portion does for your goal. Tap a food to open it.</p><div class="moments ex-chips"><button class="choice on">A to Z</button><button class="choice">By PD</button></div>` + names.map(row).join(""));
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; document.querySelector(".ex-calc").before(d); window.scrollTo(0, 0);
  }, { F, opened, note, NOTE, mark, PDREF: Number(pdRef), html: opened ? foodCard(OPEN[opened]) : "" });
  const pct = (a, b) => Math.round((100 * a) / b);
  const OPEN = {
    "Lentils, boiled": { name: "Lentils, boiled", icon: "🫘", pd: 7.8, portion: "200 g", per100: "116 kcal, 9.02 g protein, 20.1 g carbs, 0.38 g fat", src: "USDA SR Legacy, FDC 172421, lentils, boiled: the same row for every lens.",
      goal: [["✓", "Fibre: 15.8 g, almost twice your lunch's 8.3 g."], ["✓", "Folate: 181 % of the day in one portion; iron 48 %, potassium 37 %."], ["◐", `Protein: 18 g, a third of your lunch's 53 g. PD 7.8, above your ${pdRef}: it lifts a plate.`], ["◐", "Carbs: 40 g, 40 % of your lunch's 101 g, and slow: GI 32."], ["·", "Fats: almost none, 0.8 g."]],
      lenses: [lensHead("Protein", "Its lowest member is methionine with cysteine, just short of the need: rice completes it.", "Protein") + Row("Protein", "18 of 53 g", 0.34 / 1.5, false) + Row("Essential amino acids", "6.6 of 10 g", 0.66 / 1.5, false) + Row("of them, leucine", "1.3 of 2.5 g", 0.52 / 1.5, false),
        lensHead("Fats", "Mostly polyunsaturated, and very little.", "Fats") + Row("Fat", "0.8 of 28 g", 0.03 / 1.5, false) + Row("Saturated", "0.1 of 9.6 g", 0.01 / 1.5, false),
        lensHead("Carbs", "Mostly starch, low GI.", "Carbs") + Row("Carbs", "40.2 of 101 g", 0.4 / 1.5, false) + Row("Fibre", "15.8 of 8.3 g", 1.9 / 1.5, true) + Pair("GI", "32, low"),
        lensHead("Vitamins and minerals", "Against the label's reference for the day; the three it brings most of. All eighteen in Micros.", "Micros") + Row("Vitamin B9", "362 µg · 181 %", 1.81 / 1.5, true, "folate") + Row("Iron", "6.7 mg · 48 %", 0.48 / 1.5, false) + Row("Potassium", "738 mg · 37 %", 0.37 / 1.5, false)],
      claims: ["Source of protein", "High protein", "Low saturated fat", "Source of fibre", "High fibre", "Low sugars", "Source of thiamine", "High in folate", "Source of iron", "Source of potassium"] },
    "Salmon": { name: "Salmon", icon: "🐟", pd: 10.7, portion: "150 g, cooked", per100: "206 kcal, 22.1 g protein, 12.3 g fat, 0 g carbs", src: "USDA SR Legacy, FDC 175168, salmon, Atlantic, farmed, cooked, dry heat: the same row for every lens. Until now Protein and Fats used the raw row, 15236.",
      goal: [["✓", "Omega-3: 3225 mg EPA and DHA, about thirteen days of EFSA's 250 mg."], ["✓", `Protein: 33 g, 63 % of your lunch's 53 g; 14.1 g essential amino acids and 2.7 g leucine, enough for muscle building at one meal. PD 10.7, above your ${pdRef}.`], ["✓", "Vitamin D: four times the label's 5 µg; B12 168 %."], ["◐", "Fats: 18.5 g, two thirds of your lunch's 28 g; 3.6 g saturated, 38 % of its limit."], ["·", "Carbs: none."]],
      lenses: [lensHead("Protein", "Complete: all nine with room to spare.", "Protein") + Row("Protein", "33.2 of 53 g", 0.63 / 1.5, false) + Row("Essential amino acids", "14.1 of 10 g", 1.41 / 1.5, true) + Row("of them, leucine", "2.7 of 2.5 g", 1.08 / 1.5, true),
        lensHead("Fats", "Mostly polyunsaturated: the omega-3 EPA and DHA.", "Fats") + Row("Fat", "18.5 of 28 g", 0.66 / 1.5, false) + Row("Saturated", "3.6 of 9.6 g", 0.37 / 1.5, false) + Row("EPA and DHA", "3225 of 250 mg", 1.5, true),
        lensHead("Carbs", "None: salmon is protein and fat.", "Carbs") + Row("Carbs", "0 of 101 g", 0, false),
        lensHead("Vitamins and minerals", "The ones it brings most of, against the label's reference.", "Micros") + Row("Vitamin D", "20 µg · 393 %", 1.5, true, "D3 cholecalciferol, D2 ergocalciferol") + Row("Vitamin B12", "4.2 µg · 168 %", 1.12, true, "cobalamin") + Row("Vitamin B3", "12 mg · 75 %", 0.5, false, "niacin")],
      claims: ["Source of protein", "High protein", "High unsaturated fat", "Source of omega-3", "High omega-3", "High in vitamin D", "High in thiamine", "High in niacin", "Source of pantothenic acid", "High in vitamin B6", "Source of folate", "High in vitamin B12", "Source of potassium"] },
    "Whey protein powder": { name: "Whey protein powder", icon: "🥤", pd: 24.3, portion: "One scoop, 30 g", per100: "370 kcal, 90 g protein", src: "a typical whey label; cysteine and tyrosine from Hamarsland 2017. Your own brand's label replaces it.",
      goal: [["✓", "Muscle building: 14.3 g essential amino acids and 3.3 g leucine, enough for one meal on its own."], ["◐", `Protein: 27 g, half your lunch's 53 g. PD 24.3, far above your ${pdRef}.`], ["·", "Fats, carbs, vitamins and minerals: not on our table. Whey has no USDA row: your brand's label has them."]],
      lenses: [lensHead("Protein", "Complete: all nine with room to spare.", "Protein") + Row("Protein", "27 of 53 g", 0.51 / 1.5, false) + Row("Essential amino acids", "14.3 of 10 g", 1.43 / 1.5, true) + Row("of them, leucine", "3.3 of 2.5 g", 1.32 / 1.5, true),
        lensHead("Fats", "", "Fats") + NA("Not on our table: no USDA row for whey."), lensHead("Carbs", "", "Carbs") + NA("Not on our table: no USDA row for whey."), lensHead("Vitamins and minerals", "", "Micros") + NA("Not on our table: no USDA row for whey.")],
      claims: ["Source of protein", "High protein"] },
  };
  await openEx("Protein");
  await list(null, "New: Foods, the fifth chip. Every food the Explorer knows, once, A to Z: 24 foods. Tap one to open it through all four families.");
  await shot("r164a");
  await openEx("Protein");
  await list("Lentils, boiled", "New: a food opened. For your goal first: what this portion does for your lunch and your day, from the numbers, best first. Then each family in two or three rows, with a way into the full card.");
  await shot("r164b");
  await openEx("Protein");
  await list("Salmon", "New: one row per food for every lens. Salmon becomes the cooked row everywhere: until now Protein and Fats used raw salmon, so its protein card moves from 30.6 to 33.2 g a portion.");
  await shot("r164c");
  await openEx("Protein");
  await list("Whey protein powder", "New: what isn't on our table is said. Whey has no USDA row, so its fats, carbs, vitamins and minerals say so, and point to your brand's label.");
  await shot("r164d");
  // e, Micros keeps only By member
  await openEx("Micros"); await page.getByRole("radio", { name: "By member" }).click(); await page.waitForTimeout(300);
  await page.evaluate(({ note, NOTE, mark }) => {
    document.querySelector('[aria-label="Start from"]')?.remove();
    const h = document.querySelector(".ex-h"); h.style.cssText = mark + ";outline-offset:4px";
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; document.querySelector(".ex-calc").before(d); window.scrollTo(0, 0);
  }, { note: "New: Micros opens straight on its members. By food moves up into Foods, so the same card doesn't live in two places.", NOTE, mark });
  await shot("r164e");
  await b.close(); server.kill();
})();
