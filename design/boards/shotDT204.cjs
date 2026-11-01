// Board DT204 (Coach Milan 1 November 17:57 to 18:19; Tester 2's lunch photo of 30 October): one language for food names (the
// app's language first, the market's name under it), the tortellini icon, one decimal point, no portion lines on the parts
// of a dish read from a photo. Drawn into 0.3.46; nothing in the repo changes.
const ROOT = "/home/claude/platemate-scanner";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3329", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const base = { ...seed.foods[0], photo: undefined, photos: undefined, table: undefined, icon: undefined, barcode: undefined };
const EST = (id, name, calories, protein, fats, carbs, fiber) => ({ ...base, id, name, brand: "estimate", source: "estimate", calories, protein, fats, carbs, fiber, readyToEat: true, notes: "Read from a photo of the meal. Values are a chef's estimate per 100 g." });
const REF = (id, refId, name, aliases, calories, protein, fats, carbs, fiber) => ({ ...base, id, name, brand: "", basis: "100g", refId, aliases, calories, protein, fats, carbs, fiber, source: "Reference table", readyToEat: true, notes: "Reference table. Per 100 g. Carbohydrate without fibre." });
const TORT = { ...EST("tort", "Tortellini", 290, 12, 9, 40, 2), brand: "", source: "label", notes: "" };
const PESTO = EST("pesto", "Creamy pesto sauce", 260, 4, 25, 6, 1), MUSH = EST("mush", "Mushrooms, sliced", 28, 3, 0.5, 3, 1);
const SPIN = REF("spin", "spinach", "Spanać", ["Spinach, raw", "Spinat, roh", "Спанаћ"], 23, 2.9, 0.4, 1.4, 2.2);
const RICE = REF("rice", "rice-white-cooked", "Pirinač, kuvan", ["Rice, white, cooked", "Reis, weiß, gekocht", "Пиринач, куван"], 130, 2.7, 0.3, 27.8, 0.4);
const EGG = REF("egg", "egg", "Jaje, celo", ["Egg, whole, raw", "Ei, ganz", "Јаје, цело"], 143, 12.6, 9.5, 0.7, 0);
const YOG = REF("yog", "yogurt-plain", "Jogurt, 2,8 %", ["Yogurt, plain, whole", "Naturjoghurt, 3,5 %", "Јогурт, 2,8 %"], 61, 3.5, 3.3, 4.7, 0);
const TUNA = { ...base, id: "tunj", name: "Tunjevina", brand: "", source: "label", calories: 116, protein: 25.5, fats: 0.8, carbs: 0, fiber: 0 };
seed.foods = [TORT, PESTO, MUSH, SPIN, RICE, EGG, YOG, TUNA]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: TORT, grams: 130, locked: false }, { id: "b", food: PESTO, grams: 90, locked: false, est: { low: 60, high: 120 } }, { id: "c", food: MUSH, grams: 75, locked: false, est: { low: 50, high: 100 } }, { id: "d", food: SPIN, grams: 30, locked: false }];
seed.title = "Tortellini with spinach pesto";
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px";
const NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const fresh = async (where) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "sr-RS" });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-10-30T14:39:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-region", "belgrade");
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1975, heightCm: 168, weightKg: 64, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Tortellini in a creamy spinach pesto with mushrooms: one dish.", around: "", better_as: "" }) }));
    await p.goto(U + where); await p.waitForTimeout(2000);
    return p;
  };
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } for (const t of document.querySelectorAll(".toast")) t.style.display = "none"; window.scrollTo(0, 0); });
  const shot = async (p, name, sel) => { await p.waitForTimeout(350); await flat(p); await p.waitForTimeout(200); if (sel) await p.locator(sel).first().screenshot({ path: `${R}/${name}.png` }); else await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot", name); };
  const mode = process.argv[2] || "all";
  try {
    // the Plate
    for (const v of ["now", "new"]) {
      const p = await fresh("/plate");
      await p.evaluate(({ v, mark, NOTE }) => {
        const note = (el, t, where = "before") => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; el[where](d); };
        const rows = [...document.querySelectorAll(".plate-card .row")];
        const rowOf = (n) => rows.find((r) => r.querySelector(".name-link")?.textContent.trim() === n);
        const card = document.querySelector(".plate-card");
        const readout = [...document.querySelectorAll("span")].find((s) => /under your/.test(s.textContent) && s.children.length === 0);
        if (v === "now") {
          for (const r of rows) if (r.nextElementSibling?.classList.contains("gate-line") || r.querySelector(".gate-line")) r.style.cssText += ";" + mark;
          if (readout) readout.style.cssText += ";" + mark;
          note(card, "Now, as on Tester 2's phone (30 October, a phone set to Serbian, market Belgrade). 1. Spanać is in Serbian: it is in the food table, and the table names foods for the market. The other three are the AI's reads, in English. 2. Tortellini has the cake icon: the icon rule finds torte inside Tortellini. 3. 5,1 under your 8,2 follows the phone's comma; the big number and PD in the header use a point. 4. Three red portion lines on one dish: 30 g of spinach in the sauce is not a side of spinach, and 90 g of a creamy pesto sauce on pasta is ordinary; 5 to 40 g is pesto by the spoon.");
        } else {
          const sp = rowOf("Spanać"); if (sp) { const n = sp.querySelector(".name-link"); n.textContent = "Spinach"; sp.style.cssText += ";" + mark; }
          const tr = rowOf("Tortellini"); if (tr) { const ic = [...tr.querySelectorAll("*")].filter((e) => e.textContent.includes("🍰")).sort((a, b) => a.textContent.length - b.textContent.length)[0]; if (ic) ic.innerHTML = ic.innerHTML.replace("🍰", "🍝"); tr.style.cssText += ";" + mark; }
          for (const g of document.querySelectorAll(".plate-card .gate-line")) if (/portion of/.test(g.textContent)) g.remove();
          if (readout) { readout.textContent = readout.textContent.replace(/(\d),(\d)/g, "$1.$2"); readout.style.cssText += ";" + mark; }
          for (const e of document.querySelectorAll(".plate-card *")) if (e.children.length === 0 && /\d,\d/.test(e.textContent)) e.textContent = e.textContent.replace(/(\d),(\d)/g, "$1.$2");
          note(card, "New. 1. Every food on the plate in the app's language, English: Spinach. Its Serbian name stays with the food (Foods, the shopping list, search). 2. Tortellini gets the pasta icon; torte counts only as a word of its own. 3. One decimal point everywhere while the app is in English: 5.1 under your 8.2. 4. A plate read from a photo of one dish shows no portion lines on the dish's parts; the check of the whole plate against your lunch stays. A plate you build yourself keeps its portion lines.");
        }
      }, { v, mark, NOTE });
      await shot(p, `r204${v === "now" ? "a" : "b"}`);
      await p.context().close();
    }
    // Foods
    for (const v of ["now", "new"]) {
      const p = await fresh("/foods");
      await p.evaluate(({ v, mark, NOTE }) => {
        const list = document.querySelector(".list, .food-list, main") || document.body;
        const note = (t) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; const f = [...document.querySelectorAll("*")].find((e) => e.children.length === 0 && e.textContent.trim() === "Find a food"); let at = f; while (at && at.parentElement && !at.parentElement.querySelector("input")) at = at.parentElement; (at || list).before(d); };
        const EN = { "Spanać": ["Spinach, raw", "Spanać"], "Pirinač, kuvan": ["Rice, white, cooked", "Pirinač, kuvan"], "Jaje, celo": ["Egg, whole, raw", "Jaje, celo"], "Jogurt, 2,8 %": ["Yogurt, plain, whole", "Jogurt, 2,8 %"] };
        for (const b of [...document.querySelectorAll("*")].filter((e) => e.children.length === 0 && EN[e.textContent.trim()])) {
          const t = b.textContent.trim();
          if (!EN[t]) continue;
          const row = b.closest(".row, li") || b.parentElement.parentElement;
          if (v === "now") { row.style.cssText += ";" + mark; continue; }
          b.textContent = EN[t][0];
          const s = document.createElement("small"); s.style.cssText = "display:block;font-weight:800;color:#1f5fc7"; s.textContent = "In shops in Serbia: " + EN[t][1]; s.style.cssText += ";font-size:13px;margin:2px 0 4px"; b.parentElement.after(s); row.style.cssText += ";" + mark;
        }
        if (v === "new") for (const e of [...document.querySelectorAll("*")].filter((e) => e.children.length === 0 && e.textContent.includes("🍰"))) e.textContent = e.textContent.replace("🍰", "🍝");
        if (v === "now") note("Now: the foods from the food table carry their Serbian names, because the market is Belgrade (Foods by place, DT136). Tunjevina is a name she typed herself.");
        else note("New: the food table's foods in the app's language, with the name on the shop shelf under them. A food you named yourself keeps your name (Tunjevina). A packed product keeps the name printed on the pack. When Serbian comes as the app's language, the two swap: Spanać on top, Spinach under it. Foods already in a library switch by themselves, unless you renamed them.");
      }, { v, mark, NOTE });
      await shot(p, `r204${v === "now" ? "c" : "d"}`);
      await p.context().close();
    }
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
