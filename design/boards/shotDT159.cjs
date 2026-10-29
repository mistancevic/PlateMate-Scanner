// DT159 (Coach Milan 29 October 17:58 to 18:02): Micros by member: Vitamin D and Vitamin C pages
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3337", U = `http://127.0.0.1:${PORT}`;
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
  // a, the list of members
  const day = { d: "15 µg", c: "110 mg" };
  const grp = (t, ids) => `<small style="display:block;margin:10px 0 4px;font-size:11.5px;font-weight:800;color:#123a7a">${t}</small>` + ids.map((m) => `<div class="menu-row" style="padding:10px 12px;background:#fff;border-radius:12px;margin:4px 0;display:flex;align-items:center;gap:10px;${["d", "c"].includes(m.id) ? "MARK" : ""}"><b style="flex:1;font-size:14px">${m.name}</b><small style="color:#5b6b8a">${day[m.id] ? `your day ${day[m.id]}` : "next"}</small><span style="color:#5b6b8a">›</span></div>`).join("");
  await base();
  await frame(chips("member") + `<h2 style="margin:6px 0 4px;font-size:24px">The family members</h2><p style="margin:0 0 6px;color:#5b6b8a;line-height:1.45">Start from a vitamin or mineral: what it is, what it does, how much a day, where to find it, and what to combine it with.</p>` +
    grp("Vitamins, fat-soluble", M.filter((m) => m.group === "fat")) + grp("Vitamins, water-soluble", M.filter((m) => m.group === "water")) + grp("Minerals", M.filter((m) => m.group === "min")),
    "New: Micros opens By food or By member. By member lists the twelve in their three groups; a tap opens the member's page. Vitamin D and Vitamin C first; the others follow the same page.");
  await shot("r159a", false);
  const memberPage = (x, part) => {
    const top = `${chips("member")}<small style="display:block;color:#2e7be8;font-weight:800;margin:4px 0">‹ The family members</small><h2 style="margin:4px 0 4px;font-size:24px">${x.name}</h2>`;
    const isS = H("What it is", x.is, true);
    const doesS = H("What it does", `What the EU allows a label to say, word for word. ${x.name} ...`) + x.does.map((d) => `<small style="display:block;margin:4px 0;padding-left:10px;border-left:3px solid #dae6fb;line-height:1.35">${d}</small>`).join("") + `<small style="display:block;margin-top:4px;color:#5b6b8a;font-size:11px">Regulation (EU) No 432/2012, Annex. A food may say these only when it is at least a source of ${x.name.replace("Vitamin", "vitamin")}.</small>` + (x.doesMore ? `<small style="display:block;margin-top:4px;font-size:11.5px;line-height:1.35"><b>More claims, in short.</b> ${x.doesMore}</small>` : "");
    const muchS = H("How much a day", `Your day comes from EFSA${x.name === "Vitamin C" ? ", for a man" : ""}; the label's reference is the same for everyone. ${x.ul ? `Above ${x.ul.v} ${x.unit} a day is too much.` : "No upper limit is set."}`) +
      KV("Your day", `${x.efsa.v} ${x.unit}`, `EFSA, ${x.efsa.kind}`) + KV("On labels", `${x.label} ${x.unit}`, "EU reference intake, Regulation (EU) No 1169/2011") + KV("Upper limit", x.ul ? `${x.ul.v} ${x.unit}` : "none set", x.ul ? x.ul.note : "EFSA: not enough data to derive one");
    const findS = H("Where to find it", `One normal portion against your day, ${x.efsa.v} ${x.unit}. The line is the whole day; green when one portion covers it.`) +
      x.foods.map((f) => { const v = f.per100 * f.g / 100, p = Math.round(100 * v / x.efsa.v); return Row(f.name, `${v < 10 ? v.toFixed(1) : Math.round(v)} ${x.unit} · ${p} %`, p / 150, true, p >= 100, `${f.portion}${f.form ? ", " + f.form : ""}`); }).join("") +
      `<small style="display:block;margin-top:4px;color:#5b6b8a;font-size:11px">Source: USDA FoodData Central, ${x.foods.map((f) => f.src.replace("USDA ", "")).join("; ")}.</small>`;
    const combS = H("Combine it with", "What helps your body use it, and why.") + x.combine.map((c) => `<div style="padding:6px 0;border-bottom:1px solid #eef2f9"><b style="font-size:12.5px">${c.with}</b><small style="display:block;line-height:1.35">${c.why}</small></div>`).join("");
    const tooS = H("Too much", x.much);
    const srcS = `<small style="display:block;margin-top:12px;color:#5b6b8a;font-size:11px">Sources. EU claims: Regulation (EU) No 432/2012. EFSA: ${x.name === "Vitamin D" ? "dietary reference values for vitamin D (2016), upper limit (2023)" : "dietary reference values for vitamin C (2013), overview of upper limits"}. ${x.name === "Vitamin D" ? "D3 and D2: Tripkovic 2012, Am J Clin Nutr. Vitamin K: Kuang 2020, Food Funct; Witham 2020, J Am Soc Nephrol." : "Iron over months: Nyakundi 2026, Am J Clin Nutr."} Foods: USDA FoodData Central. Educational, not medical advice.</small>`;
    return `<section class="card" style="padding:14px 16px">${part === 1 ? isS + doesS + muchS : part === 2 ? findS.replace('margin-top:14px;padding-top:10px;border-top:1px solid #e3e9f4', '') + combS + tooS + srcS : isS + doesS + muchS + findS + combS + tooS + srcS}</section>`.replace(/^/, top);
  };
  await base(); await frame(memberPage(MEM.d, 1), "New: the Vitamin D page. What it is: fat-soluble, D3 and D2, and what the trials found. What it does: the EU's authorised claims, word for word. How much a day: your 15 µg from EFSA, the label's 5 µg, the upper limit of 100 µg.");
  await shot("r159b");
  await base(); await frame(memberPage(MEM.d, 2), "New: where to find it, one portion against your day, with its form; what to combine it with and why, K2 said honestly; too much.");
  await shot("r159c");
  await base(); await frame(memberPage(MEM.c, 3), "New: the Vitamin C page, the same sections. A red pepper covers more than your day; it helps take up plant iron, an EU claim. No upper limit is set.");
  await shot("r159d");
  await b.close(); server.kill();
})();
