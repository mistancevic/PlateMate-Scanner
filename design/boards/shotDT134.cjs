// Board DT134 (one meal a day) and the letters at an edge (DT132b). Milan 27 October 14:21.


// Drawn in the browser; nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3328", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join("/home/claude/platemate-scanner", "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, icon, brand = "estimate") => ({ ...seed.foods[0], id, name, brand, source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, icon, table: undefined });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, "🍫", "Clean"), YE = F("yeast", "Active dry yeast", 325, 40, 7, 41, "🍞"), PB = F("pb", "Peanut butter", 588, 25, 50, 20, "🥜");
seed.foods = [BAR, YE, PB, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 150, locked: false }, { id: "b", food: YE, grams: 10, locked: false }, { id: "c", food: PB, grams: 150, locked: false }];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const mark = `outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px`;
const NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const fresh = async (items = seed.items) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ["camera"] });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, items });
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1500);
    return p;
  };
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (p, name) => { await p.waitForTimeout(350); await flat(p); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot", name); };
  const note = (p, sel, html, where = "after") => p.evaluate(({ sel, html, where, NOTE }) => { const el = document.querySelector(sel); if (!el) return false; const d = document.createElement("div"); d.innerHTML = html; d.style.cssText = NOTE; el[where](d); return true; }, { sel, html, where, NOTE });
  const rowOf = (p, name) => p.evaluate((name) => { const e = [...document.querySelectorAll(".plate-card .name-link")].find((x) => x.textContent.trim() === name); let r = e; while (r && !r.classList.contains("row")) r = r.parentElement; if (r) r.setAttribute("data-draw", name); return !!r; }, name);
  // the three-phase bar in place of the five steps
  const phases = (p, on) => p.evaluate(({ on, mark }) => { const bar = document.querySelector(".step-bar"); if (!bar) return; const d = document.createElement("div"); d.style.cssText = "display:flex;gap:8px;margin:6px 0 2px;" + mark + ";padding:6px";
    d.innerHTML = ["Craft", "Make", "Feedback"].map((t, i) => `<div style="flex:1;text-align:center;font-weight:800;font-size:13px;color:${i <= on ? "#1f5fc7" : "#8a97ad"}"><div style="height:6px;border-radius:3px;background:${i <= on ? "#2e7be8" : "#d1dcf0"};margin-bottom:4px"></div>${t}</div>`).join(""); bar.replaceWith(d); }, { on, mark });
  const dataUrl = (f) => "data:image/jpeg;base64," + fs.readFileSync(`${R}/${f}`).toString("base64");
  const PH = dataUrl("photo-chicken.jpg");
  try {
    const F2 = (id, name, calories, protein, fats, carbs, icon, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, icon, ...extra });
    const QU = F2("quark", "Quark, low fat", 67, 12, 0.3, 4, "🥛"), OA = F2("oats", "Oats", 372, 13.5, 7, 58.7, "🌾", { fiber: 10 }), AP = F2("apple", "Apple", 52, 0.3, 0.2, 14, "🍎", { fiber: 2.4 }), PBt = F2("pb2", "Peanut butter", 588, 25, 50, 20, "🥜", { fiber: 6 });
    const items = [{ id: "a", food: QU, grams: 250, locked: false }, { id: "b", food: OA, grams: 40, locked: false }, { id: "c", food: AP, grams: 150, locked: false }, { id: "d", food: PBt, grams: 15, locked: false }];
    const setup = async (its = items, title = "Quark bowl") => { const p = await fresh([]);
      await p.evaluate(({ extra, items, title }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = items; s.fromRecipe = undefined; s.title = title; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [QU, OA, AP, PBt], items: its, title });
      await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Quark, oats, apple and peanut butter: a breakfast bowl.", around: "", better_as: "" }) }));
      await p.reload(); await p.waitForTimeout(1800); return p; };
    const crop = async (p, name, sel = ".plate-card") => { await p.waitForTimeout(300); await flat(p); const el = p.locator(sel).first(); await el.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
    // DT134 Now: Lifestyle offers 2 to 5
    let p = await fresh([]);
    await p.locator("nav button").filter({ hasText: "Plan" }).click(); await p.waitForTimeout(900); await p.getByRole("button", { name: /Slots and times/ }).first().click(); await p.waitForTimeout(1200);
    const meals = async () => p.evaluate(() => { const s = [...document.querySelectorAll(".setting, section, div")].find((x) => x.querySelector && /^Meals a day/.test((x.textContent || "").trim()) && x.querySelectorAll("button").length >= 4 && x.querySelectorAll("button").length <= 6); return !!s; });
    const mark1 = (p, re) => p.evaluate(({ re, mark }) => { const el = [...document.querySelectorAll("*")].filter((x) => x.children.length > 1 && new RegExp(re).test((x.textContent || "").trim())).sort((a, b) => a.textContent.length - b.textContent.length)[0]; if (el) { el.style.cssText += ";" + mark; el.setAttribute("data-draw", "1"); } return !!el; }, { re, mark });
    await mark1(p, "^Meals a day");
    await note(p, "[data-draw]", "Now (0.2.112): Meals a day offers 2, 3, 4 and 5 or more. One meal a day cannot be set, so the app plans and sizes two meals for someone who eats one.");
    await shot(p, "r134now"); await p.close();
    // DT134 New: 1 to 5, one meal time, the window an hour from it
    p = await fresh([]);
    await p.locator("nav button").filter({ hasText: "Plan" }).click(); await p.waitForTimeout(900); await p.getByRole("button", { name: /Slots and times/ }).first().click(); await p.waitForTimeout(1200);
    await mark1(p, "^Meals a day");
    await p.evaluate(({ mark }) => {
      const box = document.querySelector("[data-draw]"); if (!box) return;
      const chips = box.querySelectorAll("button"); const first = chips[0]; const one = first.cloneNode(true); one.textContent = "1"; first.parentElement.insertBefore(one, first);
      for (const c of box.querySelectorAll("button")) { c.classList.remove("on"); c.setAttribute("aria-pressed", "false"); } one.classList.add("on"); one.setAttribute("aria-pressed", "true");
      const times = document.querySelector(".slot-times"); if (times) { const lab = times.querySelector("label"); [...times.querySelectorAll("label")].slice(1).forEach((x) => x.remove()); if (lab) { lab.querySelector("span").textContent = "Your meal"; lab.querySelector("input").value = "18:00"; } times.style.cssText += ";" + mark; }
      const w = document.querySelector(".window-line"); if (w) { w.textContent = "One meal a day at 18:00. Eating window: 18:00 to 19:00, an hour from your meal. It carries your whole day: about 2,750 kcal and 180 g protein."; w.style.cssText += ";" + mark; }
    }, { mark });
    await note(p, ".window-line", "New: 1 in Meals a day. One time, named Your meal. The eating window is an hour from it, so a snack later in the evening reads outside the window, as for anyone with a window. The line says what the one meal carries. Not offered under 18: a teen profile keeps 2 to 5.");
    await shot(p, "r134new"); await p.close();
    // DT134 New: the Plate for one meal a day
    const PA = F2("pasta", "Pasta, cooked", 158, 5.8, 0.9, 31, "🍝", { fiber: 1.8 }), CS = F2("gouda", "Gouda cheese", 356, 25, 27, 2.2, "🧀"), TS = F2("tsauce", "Tomato sauce", 50, 1.5, 2, 7, "🍅", { fiber: 1.5 });
    const big = [{ id: "a", food: PA, grams: 1000, locked: false, est: { low: 750, high: 1250 } }, { id: "b", food: CS, grams: 150, locked: false, est: { low: 113, high: 188 } }, { id: "c", food: TS, grams: 400, locked: false, est: { low: 300, high: 500 } }];
    p = await fresh([]);
    await p.evaluate(({ extra, its, PH }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = its; s.title = "Pasta with tomato sauce and cheese"; s.photo = { image: PH, at: "2026-10-25T13:05:00", unsure: null }; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [PA, CS, TS], its: big, PH });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Pasta with tomato sauce and cheese.", around: "", better_as: "" }) }));
    await p.reload(); await p.waitForTimeout(1800);
    await p.evaluate(({ mark }) => {
      const r = document.querySelector(".readout"); if (r) { const h = r.querySelector(".rd-head span, .rd-title, b"); r.style.cssText += ";" + mark; }
      for (const el of document.querySelectorAll(".readout *")) if (el.children.length === 0 && /^Lunch$/.test(el.textContent.trim())) el.textContent = "Your meal";
      for (const el of document.querySelectorAll(".readout *")) if (el.children.length === 0 && /not a lunch yet/.test(el.textContent)) el.textContent = "fits your plan";
      const big = document.querySelector(".gate-big"); if (big) big.remove();
      for (const el of document.querySelectorAll(".plate-card small, .plate-card .row small")) if (/is over a portion of/.test(el.textContent)) { el.textContent = el.textContent.replace(/is over a portion of ([^,]+), [\d]+ to [\d]+ g\./, "is a lot of $1 for one plate, and right for one meal a day."); el.style.color = "#5b6b8a"; }
      const s = document.querySelector(".mp-say"); if (s) { s.style.cssText += ";" + mark; const t = s.querySelector("small"); if (t) t.innerHTML = "<b>Chef Mealan:</b> Eat it as it is. About 1,740 to 2,890 kcal and 102 g protein: your one meal, most of your day. Protein is short: 102 of 180 g. Add a protein side and it carries the day."; }
    }, { mark });
    await note(p, ".mp-say", "New, one meal a day: the same 2,314 kcal pasta is one portion, not three: the meal is the whole day. The portion lines under the foods change too: a portion today is sized for a meal of 3, so 1,000 g of pasta reads as over. For one meal a day, Chef Mealan's portions scale with the meal, and Fit may go past them. Open: the portion sizes for one meal a day.");
    await shot(p, "r134plate"); await p.close();

    // DT132b: the letters at an edge, only in the table
    const SM = F2("salmon", "Salmon, baked", 208, 20, 13, 0, "🐟"), RI = F2("rice", "Rice, cooked", 130, 2.7, 0.3, 28, "🍚", { fiber: 0.4 }), AV = F2("avo", "Avocado", 160, 2, 15, 9, "🥑", { fiber: 7 });
    p = await fresh([]);
    await p.evaluate(({ extra, its }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = its; s.title = "Salmon bowl"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [SM, RI, AV], its: [{ id: "a", food: SM, grams: 200, locked: false }, { id: "b", food: RI, grams: 100, locked: false }] });
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Salmon bowl.", around: "", better_as: "" }) }));
    await p.reload(); await p.waitForTimeout(1800);
    await p.locator(".letters-row").first().click(); await p.waitForTimeout(300);
    await p.locator(".nt").getByRole("button", { name: /Per 100 kcal/ }).click(); await p.waitForTimeout(300);
    const lines = await p.evaluate(({ mark }) => { const box = document.querySelector(".letters-lines"); if (!box) return ""; box.style.cssText += ";" + mark;
      const ls = [...box.querySelectorAll("small")]; const out = ls.map((x) => x.textContent);
      // the letter whose value sits closest to a band edge gets the mark, in words only
      for (const x of ls) { const m = /^([A-Za-z]+[+\-?]?) (\w+): ([\d.]+) g per 100 kcal, .* your day's ([\d.]+)\./.exec(x.textContent); if (!m) continue; const ratio = +m[3] / +m[4];
        for (const e of [0.6, 0.9, 1.5]) if (Math.abs(ratio - e) / e < 0.05) { x.innerHTML = x.textContent.replace(/\.$/, "") + `. <b style="color:#9a5b00">~ On the edge of ${e === 1.5 ? "high" : e === 0.9 ? "as your day" : "close to none"}: ${ratio.toFixed(2)} times your day, the edge is ${e}.</b>`; } }
      return out.join(" | "); }, { mark });
    console.log("lines", lines);
    await note(p, ".letters-lines", "My suggestion for the letters: the quick line stays as it is, four letters, no marks; a mark there would crowd it and make every plate look unsure. The edge shows only where you read the numbers: in Per 100 kcal, a letter within 5 percent of a band edge says so, in amber words. The letter itself never changes between two looks.");
    await shot(p, "r132letters"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
