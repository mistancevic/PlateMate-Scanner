// DT160 version 2 (Coach Milan 29 October 18:02 to 19:06): ranges per family; fat on the week's average, carbs as the week's span; Calculated for you
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3338", U = `http://127.0.0.1:${PORT}`;
const MEM = require("/home/claude/boards/member159.cjs"); const MICRO = require("/home/claude/boards/micro158.cjs");
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
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name, full = true) => { await page.waitForTimeout(400); if (full) await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot " + name); };
  // the day's numbers, as the app keeps them after the profile
  await page.goto(U + "/"); await page.waitForTimeout(1200);
  const goals = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).goals);
  if (goals.fats == null) goals.fats = Math.round(goals.calories * FAT_SHARE / 9);  // the app's macroSplit
  console.log("goals", JSON.stringify(goals));
  const M = MICRO.M, NRV = MICRO.NRV;
  const base = async () => { await page.goto(U + "/me"); await page.waitForTimeout(900); };
  const frame = (inner, note) => page.evaluate(({ inner, note, NOTE, mark }) => {
    for (const n of document.querySelectorAll("header *, .top *")) if (n.childElementCount === 0 && n.textContent.trim() === "Me") n.textContent = "Explorer";
    const main = document.querySelector("main") ?? document.body;
    main.innerHTML = `<div style="padding:4px 16px 24px">${inner.replaceAll("MARK", mark)}</div>`;
    if (note) { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; main.firstElementChild.prepend(d); }
    window.scrollTo(0, 0);
  }, { inner, note, NOTE, mark });
  const H = (t, sub, first) => `<div style="${first ? "" : "margin-top:14px;padding-top:10px;border-top:1px solid #e3e9f4"}"><b style="display:block;font-size:11.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#123a7a">${t}</b>${sub ? `<small style="display:block;color:#5b6b8a;font-size:11.5px;margin-top:1px;line-height:1.35">${sub}</small>` : ""}</div>`;
  const Row = (label, val, frac, line, ok, sub) => `<div style="display:flex;align-items:center;gap:6px;margin:5px 0"><small style="width:132px;font-size:11.5px;line-height:1.15">${label}${sub ? `<br><span style="color:#5b6b8a;font-size:10.5px">${sub}</span>` : ""}</small><span style="position:relative;flex:1;height:8px;border-radius:4px;background:#eef2f9"><i style="position:absolute;left:0;top:0;bottom:0;width:${Math.max(Math.min(frac, 1) * 100, 1.5)}%;border-radius:4px;background:${ok ? "#13916a" : "#5b8def"}"></i>${line ? '<i style="position:absolute;left:66.7%;top:-3px;bottom:-3px;width:2px;background:#172742;opacity:.55"></i>' : ""}</span><small style="min-width:78px;text-align:right;font-size:11.5px;font-weight:800;color:${ok ? "#13916a" : "#172742"}">${val}</small></div>`;
  const KV = (label, val, sub) => `<div style="display:flex;align-items:baseline;gap:6px;margin:5px 0"><small style="flex:1;font-size:11.5px;line-height:1.3">${label}${sub ? `<br><span style="color:#5b6b8a;font-size:10.5px">${sub}</span>` : ""}</small><small style="text-align:right;font-size:12.5px;font-weight:900;color:#172742">${val}</small></div>`;
  const chips = (on) => `<div class="moments" role="radiogroup" style="padding:4px;margin-bottom:6px"><button class="choice">Protein</button><button class="choice">Fats</button><button class="choice">Carbs</button><button class="choice on">Micros</button></div><div class="moments" role="radiogroup" style="MARK;padding:4px;margin-bottom:8px"><button class="choice ${on === "food" ? "on" : ""}">By food</button><button class="choice ${on === "member" ? "on" : ""}">By member</button></div>`;
  // the app's calculate() for this profile (Maintain, 85 kg, a Training week of 3 rest, 1 light, 2 moderate, 1 hard):
  // protein 135 to 185 g, target 160 g; week average 2,500 kcal, fat 83 g; days: Mon strength 2,850 kcal 366 g carbs, Tue and Thu
  // strength 2,600 and 303 g, Fri mobility 2,400 and 253 g, rest days 2,300 and 228 g. Today, Thursday 29 October: 2,600 kcal.
  const avg = 2500, kcal = 2600, prot = 160, fat = 83, carb = 303, pr = { min: 135, max: 185 }, week = { lo: 228, hi: 366 };
  const fr = { min: Math.round(avg * 0.2 / 9), max: Math.round(avg * 0.35 / 9) }, cr = { min: Math.round(kcal * 0.45 / 4), max: Math.round(kcal * 0.6 / 4) };
  const sat = Math.round(avg * 0.1 / 9), sug = Math.round(kcal * 0.1 / 4);
  console.log({ avg, kcal, prot, fat, carb, pr, fr, cr, sat, sug });
  const FOR = '<span style="display:inline-block;margin-left:6px;padding:1px 7px;border-radius:9px;background:#e7f0ff;color:#1d5fc4;font-size:10.5px;font-weight:800;letter-spacing:0;text-transform:none;vertical-align:1px">for you</span>';
  const band = (label, lo, hi, you, unit, why, scale) => { const S = scale ?? hi * 1.3, L = (100 * lo) / S, Wd = (100 * (hi - lo)) / S, Y = you == null ? null : (100 * you) / S, inside = you == null || (you >= lo && you <= hi);
    return `<div style="margin:8px 0 10px"><div style="display:flex;align-items:baseline;gap:6px"><b style="flex:1;font-size:13px">${label}</b><small style="font-size:12.5px;font-weight:900;color:#172742">${hi == null ? `at least ${lo}` : lo === 0 ? `under ${hi}` : `${lo} to ${hi}`} ${unit}${you != null ? ` · yours ${you} ${unit}` : ""}</small></div>
      <span style="position:relative;display:block;height:10px;margin:5px 0 3px;border-radius:5px;background:#eef2f9">${hi == null ? `<i style="position:absolute;left:${L}%;right:0;top:0;bottom:0;border-radius:5px;background:#bfe6d6"></i>` : `<i style="position:absolute;left:${L}%;width:${Wd}%;top:0;bottom:0;border-radius:5px;background:#bfe6d6"></i>`}${Y != null ? `<i style="position:absolute;left:calc(${Y}% - 1.5px);top:-4px;bottom:-4px;width:3px;border-radius:2px;background:${inside ? "#13916a" : "#c2410c"}"></i>` : ""}</span>
      <small style="display:block;color:#5b6b8a;font-size:11px;line-height:1.35">${why}</small></div>`; };
  const weekBar = (lo, hi, today, why, scale) => { const L = (100 * lo) / scale, Wd = (100 * (hi - lo)) / scale, Y = (100 * today) / scale;
    return `<div style="margin:8px 0 10px"><div style="display:flex;align-items:baseline;gap:6px"><b style="flex:1;font-size:13px">Your week</b><small style="font-size:12.5px;font-weight:900;color:#172742">${lo} to ${hi} g · today ${today} g</small></div>
      <span style="position:relative;display:block;height:10px;margin:5px 0 3px;border-radius:5px;background:#eef2f9"><i style="position:absolute;left:${L}%;width:${Wd}%;top:0;bottom:0;border-radius:5px;background:#c9dbf8"></i><i style="position:absolute;left:calc(${Y}% - 1.5px);top:-4px;bottom:-4px;width:3px;border-radius:2px;background:#13916a"></i></span>
      <div style="display:flex;font-size:10.5px;color:#5b6b8a"><span style="position:relative;left:${L}%">rest day</span><span style="margin-left:auto;margin-right:${100 - L - Wd}%">Monday</span></div>
      <small style="display:block;color:#5b6b8a;font-size:11px;line-height:1.35;margin-top:2px">${why}</small></div>`; };
  const warn = (t) => `<small style="display:block;margin:2px 0 8px;padding:6px 8px;border-radius:8px;background:#fff1e6;color:#9a3412;font-size:11.5px;line-height:1.35">${t}</small>`;
  const yourDay = (rows, goal) => `<section class="card" style="${mark};padding:12px 14px;margin:6px 0 10px"><b style="display:block;font-size:11.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#123a7a">Your day${FOR}</b><small style="display:block;color:#5b6b8a;font-size:11.5px;margin:1px 0 4px;line-height:1.35">${goal}</small>${rows}</section>`;
  const calc = `<div style="${mark};background:#fff;padding:10px 12px;margin:4px 0 10px;font-size:13px;line-height:1.45;color:#172742"><b>Calculated for you.</b> Ranges and meal amounts here come from your goal and setup: Maintain, 85 kg, your Training week, three meals. Today is a strength day: ${kcal.toLocaleString("en")} kcal. Numbers marked ${FOR.replace("margin-left:6px", "margin-left:0")} change when they change. <a style="color:#2e7be8;font-weight:800;text-decoration:none;white-space:nowrap" href="#">Change them ›</a></div>`;
  const openEx = async (fam) => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300);
    await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(500); if (fam !== "Protein") { await page.locator(".ex-families").getByRole("radio", { name: fam }).click(); await page.waitForTimeout(300); } };
  const drawEx = (keep, day, note) => page.evaluate(({ keep, day, calc, note, NOTE, mark, FOR }) => {
    for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (["fixed", "sticky"].includes(cs.position) && el.getBoundingClientRect().top > 100) el.style.display = "none"; }
    document.querySelector(".toast")?.remove();
    for (const c of document.querySelectorAll(".ex-card")) if (c.getAttribute("aria-label") !== keep) c.remove();
    document.querySelector(".ex-book")?.remove();
    const fams = document.querySelector(".ex-families"); fams.insertAdjacentHTML("beforebegin", calc);
    document.querySelector(".ex-intro").insertAdjacentHTML("afterend", day);
    const m = document.querySelector(".ex-meal"); if (m) { m.insertAdjacentHTML("beforeend", FOR); m.style.cssText += ";" + mark + ";outline-offset:2px"; }
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; fams.parentElement.prepend(d);
    window.scrollTo(0, 0);
  }, { keep, day, calc, note, NOTE, mark, FOR });
  // a, Protein
  await openEx("Protein");
  await drawEx("Whey protein powder", yourDay(band("Protein", pr.min, pr.max, prot, "g", `1.6 to 2.2 g per kg of your 85 kg, because you train; 1.2 to 1.6 if you didn't. The same every day. Yours sits in the middle. ISSN 2017.`), "The range for your goal and your body, and where your number sits in it."),
    "New: a line at the top says the numbers are calculated for you, with a link to change them. Each family opens with Your day: the range for your goal, your number in it. Protein is the same every day, so it has one range.");
  await shot("r160a");
  // b, Fats
  await openEx("Fats");
  await drawEx("Olive oil", yourDay(band("Fat", fr.min, fr.max, fat, "g", `20 to 35 % of your week's average, ${avg.toLocaleString("en")} kcal, the same way your fat is set. Yours is 30 %, the same every day. EFSA, and the AND, DC and ACSM joint position 2016.`) + band("Saturated fat", 0, sat, null, "g", "Under 10 % of your week's average energy. WHO 2023.", fr.max * 1.3), "The range for your goal, and the limit for saturated fat. Fat stays the same every day, so it is counted on your week."),
    "New: Fats, Your day. The range is 20 to 35 % of your week's average energy, because your fat is set on it and stays the same every day. Counted on today's energy, the range would move while your 83 g stays.");
  await shot("r160b");
  // c, Carbs
  await openEx("Carbs");
  await drawEx("Oats, dry", yourDay(band("Carbohydrate today", cr.min, cr.max, carb, "g", `45 to 60 % of today's ${kcal.toLocaleString("en")} kcal, a strength day. Yours is ${Math.round((carb * 400) / kcal)} %: what is left after protein and fat. EFSA.`) +
      weekBar(week.lo, week.hi, carb, "Carbs move with the day: 228 g on a rest day, 366 g on Monday, your hardest day. Protein and fat stay the same.", cr.max * 1.3) +
      warn("On rest days and your mobility day your carbs are 40 to 42 % of the energy, below EFSA's 45 %, because protein and fat stay the same every day.") +
      band("Fibre", 25, null, null, "g", "At least 25 g a day. WHO 2023 and EFSA.", 60) + band("Free sugars", 0, sug, null, "g", "Under 10 % of today's energy. WHO 2015.", cr.max * 0.3), "Today's range, your week from the rest day to the hardest day, the fibre to reach, and the limit for free sugars."),
    "New: Carbs, Your day. Today's range is 45 to 60 % of today's energy. Below it, your week: from the rest day to the hardest day, today marked. When a day falls below the range, one line says which and why.");
  await shot("r160c");
  // d, Micros: Vitamin D, How much a day as a range
  const x = MEM.d;
  await base();
  await frame(`${calc}${chips("member")}<small style="display:block;color:#2e7be8;font-weight:800;margin:4px 0">‹ The family members</small><h2 style="margin:4px 0 4px;font-size:24px">Vitamin D</h2><section class="card" style="padding:14px 16px">` +
    H("What it is", x.is, true) +
    `<div style="${mark};outline-offset:4px;margin-top:14px;padding-top:10px;border-top:1px solid #e3e9f4"><b style="display:block;font-size:11.5px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#123a7a">How much a day${FOR}</b><small style="display:block;color:#5b6b8a;font-size:11.5px;margin-top:1px;line-height:1.35">From your day up to the upper limit. Your day comes from EFSA for an adult; the label's reference is the same for everyone.</small>` +
    band("Your range", 15, 100, null, "µg", "From 15 µg, EFSA's adequate intake for adults, up to 100 µg, EFSA's upper limit, from food and supplements together.", 130) +
    KV("On labels", "5 µg", "EU reference intake, Regulation (EU) No 1169/2011") + `</div>` +
    `<small style="display:block;margin-top:12px;color:#5b6b8a;font-size:11.5px;line-height:1.4">Vitamin C, the same section: from 110 mg, EFSA for a man (95 mg for a woman), with no upper limit set, so the bar has no end.</small></section>`,
    "New: on a member's page, How much a day becomes a range: from your day to the upper limit. It is marked for you: EFSA's values depend on age, and for some members, like vitamin C, on sex. Where no upper limit is set, the range has no end.");
  await shot("r160d");
  await b.close(); server.kill();
})();
