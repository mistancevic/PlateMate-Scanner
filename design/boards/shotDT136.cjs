// DT136, Foods by place (Milan 27 October 18:23 and 20:03; Tester 3 in Limassol sees Belgrade's foods)
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const REF = (id, name, aliases, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "Reference table", refId: id, aliases, calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, table: undefined, barcode: undefined, icon: undefined, notes: "Reference table." });
const BG = [REF("chicken-breast-raw", "Pileća prsa, sirova", ["Chicken breast, raw", "Hähnchenbrust, roh", "Пилећа прса, сирова"], 120, 22.5, 2.6, 0),
  REF("yogurt-plain", "Jogurt, 2,8 %", ["Yogurt, plain, whole", "Naturjoghurt, 3,5 %"], 61, 3.5, 3.3, 4.7),
  REF("rice-white-cooked", "Pirinač, kuvan", ["Rice, white, cooked", "Reis, weiß, gekocht"], 130, 2.7, 0.3, 28.2)];
seed.foods = [...seed.foods, ...BG];
const M = (name, brand, kcal, prot, seen) => ({ key: name + brand, name, brand, calories: kcal, protein: prot, fats: 3, carbs: 1, fiber: 0, readyToEat: false, source: "label", updatedAt: "2026-10-20T10:00:00Z", seenIn: seen });
const MEMBERS = [M("Chicken souvlaki, raw", "Kypros Farm", 150, 20, ["limassol"]), M("Pileći file", "Farma Avala", 110, 23, ["belgrade"]), M("Pileća pašteta", "Sava", 240, 12, ["belgrade"]), M("Pileće viršle", "Avala", 230, 13, ["belgrade"])];
const PORT = "3301", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date("2026-10-27T13:05:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("chefmealan-region", "limassol");
    localStorage.setItem("seeded", "1"); }, seed);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ foods: MEMBERS }) }));
  await page.route("**/api/search**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ products: [] }) }));
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name) => { await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const noteAfter = (sel, text, nth = 0) => page.evaluate(({ sel, text, NOTE, nth }) => { const el = document.querySelectorAll(sel)[nth]; if (!el) return; const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = text; el.after(d); }, { sel, text, NOTE, nth });
  const markEach = (sel, re) => page.evaluate(({ sel, re, mark }) => { for (const el of document.querySelectorAll(sel)) if (new RegExp(re).test(el.textContent)) el.style.cssText += ";" + mark; }, { sel, re, mark });
  const search = async () => { await page.goto(U + "/foods"); await page.waitForTimeout(1200); await page.getByLabel("Find a food").fill("chicken"); await page.waitForTimeout(1500); };

  // DT136a, now
  await search();
  await markEach(".rows .row", "seen in Belgrade|Pileća prsa");
  await noteAfter("p.group-label", "Now (0.2.118): Marko shops in Limassol. His search still lists Belgrade. Members' foods come from every place: Limassol's first, then all the others, each row saying a member's, seen in Belgrade. And a basic food keeps the name of the place it was added in: Pileća prsa, sirova, taken while his place was Belgrade.");
  await shot("r136a");

  // DT136b, new
  await search();
  await page.evaluate(({ mark }) => {
    const find = document.querySelector("section.find"); const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 4px;" + mark;
    row.setAttribute("role", "group");
    row.innerHTML = '<small style="width:100%;color:#3d4a63">Foods from</small><button class="choice on">Limassol</button><button class="choice">Belgrade</button><button class="choice">All places</button>';
    find.after(row);
    const rows = [...document.querySelectorAll(".rows .row")]; let hidden = 0, last = null;
    for (const r of rows) { if (/seen in Belgrade/.test(r.textContent)) { r.remove(); hidden++; } else if (/row-member/.test(r.className)) last = r; }
    if (last) { const s = document.createElement("small"); s.style.cssText = "display:block;padding:6px 12px;color:#3d4a63;" + mark; s.textContent = `${hidden} more from members in Belgrade. Tap Belgrade to see them.`; last.after(s); }
    for (const r of document.querySelectorAll(".rows .row")) { const n = r.querySelector(".name-link"); if (n && n.textContent === "Pileća prsa, sirova") { n.textContent = "Chicken breast, raw"; const sm = r.querySelector("small"); sm.textContent = "Protein base. Per 100 g: 120 kcal and 22.5 g protein. Also Pileća prsa, sirova."; r.style.cssText += ";" + mark; } }
    const gl = document.querySelector("p.group-label"); if (gl) gl.textContent = gl.textContent.replace(/\d+ foods/, (m) => `${parseInt(m) - hidden} foods`);
  }, { mark });
  await noteAfter("section.find", "New: chips say whose foods the search shows. Your place is on: Limassol. Belgrade's members' foods wait behind their chip, and a line says how many. All places shows every place, as today. Your own foods always show. A basic food takes the name of where you are now; the name it came with stays below it.");
  await shot("r136b");

  // DT136c, now: Where I shop
  await page.goto(U + "/me/shop"); await page.waitForTimeout(1200);
  await page.evaluate(({ mark }) => { const c = document.querySelector("section.card"); const lab = [...c.querySelectorAll("p.label")].find((x) => /Starter foods/.test(x.textContent)); if (lab) { lab.style.cssText += ";" + mark; const br = c.querySelector(".button-row"); if (br) br.style.cssText += ";" + mark; } }, { mark });
  await noteAfter("section.card .button-row", "Now: one place at a time, and the button only adds. Belgrade's foods, added first, stay when you move to Limassol; nothing takes them out but Remove on each food.");
  await shot("r136c");

  // DT136d, new: foods by place
  await page.goto(U + "/me/shop"); await page.waitForTimeout(1200);
  await page.evaluate(({ mark, NOTE }) => {
    const c = document.querySelector("section.card"); const lab = [...c.querySelectorAll("p.label")].find((x) => /Starter foods/.test(x.textContent));
    let el = lab; const drop = []; while (el) { drop.push(el); el = el.nextElementSibling; } drop.forEach((x) => x.remove());
    const box = document.createElement("div"); box.style.cssText = "margin-top:16px;" + mark;
    box.innerHTML = '<p class="label">Foods by place</p><small>Each place brings its foods: about twenty common ones, and the place\'s own (fifty in Limassol). Tap a place to add them; tap again to take them out.</small>' +
      '<div class="moments" style="margin-top:8px"><button class="choice on">Limassol · 70</button><button class="choice">Belgrade</button><button class="choice">Munich</button><button class="choice">Madrid</button></div>' +
      '<small style="display:block;margin-top:8px;color:#123a7a;font-weight:700">Belgrade is off: 2 foods you never used are out. Pileća prsa, sirova stays: it is in a meal you logged.</small>' +
      '<small style="display:block;margin-top:6px">Travelling? When you set where you travel to, its place is on for the trip and goes off when you are back.</small>';
    lab ? c.appendChild(box) : c.appendChild(box);
  }, { mark, NOTE });
  await noteAfter("section.card", "New: a chip per place, on or off. Off takes out that place's foods you never touched; a food you ate, put in a recipe, edited or scanned yourself is yours and stays. Nothing you logged changes.");
  await shot("r136d");
  await b.close(); server.kill();
})();
