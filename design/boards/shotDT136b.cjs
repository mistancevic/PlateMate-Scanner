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
const KJ = { ...seed.foods[0], id: "kajmak", name: "Kajmak", brand: "Mlekara Sava", source: "label", calories: 330, protein: 6, fats: 33, carbs: 2, fiber: 0, photo: undefined, photos: undefined, table: undefined, barcode: "8600000000017", icon: undefined, notes: "" };
seed.foods = [...seed.foods, ...BG, KJ];
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

  // DT136b, new: the search by place, with tags
  await search();
  await page.evaluate(({ mark }) => {
    const find = document.querySelector("section.find"); const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 4px;" + mark;
    row.innerHTML = '<small style="width:100%;color:#3d4a63">Foods from</small><button class="choice on">Limassol</button><button class="choice">Belgrade · 14</button><button class="choice">All places</button>';
    find.after(row);
    let hidden = 0, last = null;
    for (const r of [...document.querySelectorAll(".rows .row")]) { if (/seen in Belgrade/.test(r.textContent)) { r.remove(); hidden++; } else if (/row-member/.test(r.className)) last = r; }
    if (last) { const s = document.createElement("small"); s.style.cssText = "display:block;padding:6px 12px;color:#3d4a63;" + mark; s.textContent = `${hidden} more from members in Belgrade. Tap Belgrade to see them.`; last.after(s); }
    for (const r of document.querySelectorAll(".rows .row")) { const n = r.querySelector(".name-link"); if (n && n.textContent === "Pileća prsa, sirova") { n.textContent = "Chicken breast, raw"; r.querySelector("small").textContent = "Protein base. Per 100 g: 120 kcal and 22.5 g protein. Also Pileća prsa, sirova. Sold everywhere."; r.style.cssText += ";" + mark; } }
    const gl = document.querySelector("p.group-label"); if (gl) gl.textContent = gl.textContent.replace(/\d+ foods/, (m) => `${parseInt(m) - hidden} foods`);
  }, { mark });
  await noteAfter("section.find", "New: every food knows where it is sold. The search shows your place (Limassol), foods sold everywhere (eggs, oats, chicken breast) and your trip's place while its switch is on. Belgrade's foods are kept, behind their chip, and come back when you pick Belgrade. A basic food takes the name of where you are.");
  await shot("r136b");

  // DT136d, new: Where I shop, your place and the places in your foods
  await page.goto(U + "/me/shop"); await page.waitForTimeout(1200);
  await page.evaluate(({ mark }) => {
    const c = document.querySelector("section.card"); const lab = [...c.querySelectorAll("p.label")].find((x) => /Starter foods/.test(x.textContent));
    const box = document.createElement("div"); box.style.cssText = "margin-top:16px;" + mark;
    box.innerHTML = '<p class="label">Places in your foods</p><small>Each food you add is tagged with the place you are in. Your place is always in your search; the others only when you turn them on, or travel there.</small>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span><b>Limassol</b><small style="display:block">your place · 62 foods</small></span><small>always on</small></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span><b>Belgrade</b><small style="display:block">14 foods · 2 from the starter set</small></span><button class="choice">Off</button></div>' +
      '<small style="display:block;margin-top:10px">Off keeps the foods: your logs and recipes stay as they are. To delete Belgrade\'s foods you never used: <a class="link">Delete 9 unused</a>.</small>';
    if (lab) lab.before(box);
  }, { mark });
  await noteAfter("section.card", "New, for Marko: Belgrade is a place in his foods, off. Nothing from Belgrade shows in his Limassol search; it is one tap away when he goes there again. Starter foods stay as today, for your place.");
  await shot("r136d");

  // DT136e, new: a trip on Plan
  await page.goto(U + "/plan"); await page.waitForTimeout(1400);
  await page.evaluate(({ mark }) => {
    const head = document.querySelector("section.plan-head"); const card = document.createElement("section"); card.className = "card"; card.style.cssText = "margin:10px 0;" + mark;
    card.innerHTML = '<div class="card-top"><span>✈ Trip to Belgrade · Mon 3 to Mon 10 November</span><a class="link">Change</a></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span><b>Belgrade\'s foods in my search</b><small style="display:block">On by itself on 3 November, off after 10 November. Turn it on now to plan and shop ahead.</small></span><button class="choice on">On</button></div>' +
      '<small style="display:block;margin-top:8px">Foods you add on these days are tagged Belgrade.</small>';
    head.after(card);
  }, { mark });
  await noteAfter("section.plan-head", "New: a trip lives on Plan, with its place and its days. Its switch puts the place's foods in your search: on for the trip's days, and yours to turn on earlier or off any time. Home stays on.");
  await shot("r136e");

  // DT136f, new: the food card says where it is sold
  await page.goto(U + "/foods"); await page.waitForTimeout(1200);
  await page.getByLabel("Find a food").fill("kajmak"); await page.waitForTimeout(900);
  await page.locator(".name-link").filter({ hasText: "Kajmak" }).first().click(); await page.waitForTimeout(800);
  await page.evaluate(({ mark }) => {
    const h = document.querySelector(".foodcard-head"); const d = document.createElement("div"); d.style.cssText = "margin:8px 0;padding:8px 10px;" + mark;
    d.innerHTML = '<small style="display:block;color:#3d4a63">Sold in</small><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px"><button class="choice on">Belgrade ✕</button><button class="choice">+ A place</button><button class="choice">Everywhere</button></div><small style="display:block;margin-top:6px">Tagged when you scanned it on your trip, 5 November.</small>';
    h.after(d);
  }, { mark });
  await noteAfter(".foodcard-head", "New: the card shows the food's places. You can add one (you found it in Limassol too) or say it is sold everywhere. A food you add at home is tagged with your place.");
  await page.evaluate(() => { const bd = document.querySelector(".sheet-backdrop"); for (const el of document.querySelectorAll("main > *")) if (!el.contains(bd)) el.style.display = "none"; for (const el of document.querySelectorAll(".sheet-backdrop, .sheet")) { el.style.position = "static"; el.style.maxHeight = "none"; el.style.overflow = "visible"; } });
  await shot("r136f");
  await b.close(); server.kill();
})();
