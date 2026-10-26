// Board DT129 v3 (Milan 26 October 13:20 and 13:27): the meal check is the heading of the PD block (Lunch · 103%) with a
// colourful icon: down under, check fits, up over, double thumbs for the DaaM Good spot. The quick line is the four letters
// only. No E: PD is the energy reading; the tapped table has no Energy row, energy heads it as on the EU label.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3326", U = `http://127.0.0.1:${PORT}`;
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
    const CH = F2("chicken", "Chicken breast, grilled", 165, 31, 3.6, 0, "🍗", { fiber: 0 }), RI = F2("rice", "Rice, cooked", 130, 2.7, 0.3, 28, "🍚", { fiber: 0.4 }), SA = F2("salad", "Mixed salad, dressed", 60, 1.2, 4.5, 3.5, "🥗", { fiber: 1.5 }), OL = F2("oil", "Olive oil", 884, 0, 100, 0, "🫒", { fiber: 0 });
    const lunch = [{ id: "a", food: CH, grams: 250, locked: false }, { id: "b", food: RI, grams: 300, locked: false }, { id: "c", food: SA, grams: 120, locked: false }, { id: "d", food: OL, grams: 8, locked: false }];
    const DAY = { kcal: 2750, protein: 180, fats: 90, carbs: 300, fiber: 38.5 };
    const sum = (its) => { const t = { kcal: 0, protein: 0, fats: 0, carbs: 0, fiber: 0, fibNull: false }; for (const it of its) { const f = it.food, g = it.grams / 100; t.kcal += f.calories * g; t.protein += f.protein * g; t.fats += (f.fats ?? 0) * g; t.carbs += (f.carbs ?? 0) * g; if (f.fiber == null) t.fibNull = true; else t.fiber += f.fiber * g; } return t; };
    const NAMES = [["fats", "Fat"], ["carbs", "Carbs"], ["fiber", "Fibre"], ["protein", "Protein"]];
    const readLetters = (p) => p.evaluate(() => [...document.querySelectorAll(".readout .letter-cell .letters")].map((e) => e.textContent.trim()));
    const mealKcal = (p) => p.evaluate(() => { const m = /(Breakfast|Lunch|Dinner) is about ([\d,]+) kcal/.exec(document.body.innerText); return m ? { word: m[1].toLowerCase(), kcal: Number(m[2].replace(",", "")) } : null; });
    const SC = F2("schnitzel", "Pork schnitzel, breaded, fried", 290, 20, 18, 12, "🍖", { fiber: 0.5 }), FR = F2("fries", "Fries", 312, 3.4, 15, 41, "🍟", { fiber: 3.5 });
    const big = [{ id: "a", food: SC, grams: 300, locked: false }, { id: "b", food: FR, grams: 250, locked: false }];
    const thumb = (c) => '<svg width="13" height="13" viewBox="0 0 24 24" fill="' + c + '" stroke="' + c + '" stroke-width="1.5" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
    const ICON = { under: { bg: "#fff4d6", fg: "#c98400", g: "↓", word: "under" }, fits: { bg: "#e3f6ea", fg: "#1d8a4c", g: "✓", word: "fits" }, over: { bg: "#ffe3e0", fg: "#d23b2f", g: "↑", word: "over" }, daam: { bg: "#e3f6ea", fg: "#1d8a4c", g: "", word: "DaaM Good" } };
    const status = (pct) => pct < 90 ? "under" : pct > 110 ? "over" : "fits";
    const quick = async (p, its, o = {}) => {
      const ls = await readLetters(p), m = (await mealKcal(p)) ?? { word: "lunch", kcal: 917 }, t = sum(its);
      const pct = Math.round((t.kcal / m.kcal) * 100), share = m.kcal / DAY.kcal, st = o.snack ? null : o.daam ? "daam" : status(pct);
      await p.evaluate(({ mark, NOTE, ls, pct, word, st, ICON, thumbs, rows, energy, o }) => {
        const ro = document.querySelector(".readout"); if (!ro) return;
        // the heading: the meal check, with its icon
        const top = ro.querySelector(".readout-top > span");
        if (top) {
          const ic = st ? ICON[st] : null;
          const badge = ic ? '<span title="' + ic.word + '" style="display:inline-flex;align-items:center;justify-content:center;gap:1px;min-width:22px;height:22px;padding:0 4px;border-radius:999px;background:' + ic.bg + ';color:' + ic.fg + ';font-weight:900;font-size:14px;margin-left:6px;vertical-align:middle;box-shadow:0 0 0 1.5px rgba(255,255,255,.7)">' + (st === "daam" ? thumbs : ic.g) + '</span>' : "";
          top.innerHTML = '<span style="font-size:15px;font-weight:900;opacity:1">' + (o.snack ? "Snack · " + o.snackPct + "% of your day" : word.charAt(0).toUpperCase() + word.slice(1) + " · " + pct + "%") + '</span>' + badge;
          top.parentElement.style.opacity = "1"; top.parentElement.style.alignItems = "center"; top.style.cssText += ";" + mark + ";padding:2px 6px;border-radius:8px";
        }
        // the quick line: the four letters only
        const row = ro.querySelector(".letters-row"); const wrap = row?.closest(".readout-letters");
        const d = document.createElement("div"); d.style.cssText = "display:flex;align-items:center;background:rgba(255,255,255,.2);color:inherit;border-radius:10px;padding:8px 12px;margin-top:8px;white-space:nowrap;" + mark;
        const sep = '<span style="opacity:.5;padding:0 12px">│</span>';
        d.innerHTML = ls.map((l) => '<span style="font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:18px">' + l + '</span>').join(sep) + '<span style="margin-left:auto;opacity:.85">' + (o.open ? "⌃" : "›") + '</span>';
        if (wrap) wrap.replaceWith(d);
        if (o.open) {
          const seg = document.createElement("section"); seg.style.cssText = "background:#fff;border:1px solid #d1dcf0;border-radius:14px;padding:10px 12px;margin:10px 0;color:#172742;" + mark;
          const cols = "1fr 36px 74px 56px 46px";
          const tr = (r, k) => '<div style="display:grid;grid-template-columns:' + cols + ';align-items:baseline;padding:7px 0;border-top:1px solid #e3eaf6"><span style="font-size:15px;font-weight:700">' + r.n + '</span><span style="font-family:ui-monospace,Menlo,monospace;font-size:15px;font-weight:700;color:#1f5fc7">' + r.l + '</span><span style="font-size:15px;font-weight:900;text-align:right">' + r.g + '</span><span style="font-size:15px;text-align:right">' + r.m + '</span><span style="font-size:13px;color:#5b6b8a;text-align:right">' + r.d + '</span></div>';
          seg.innerHTML = '<b style="font-size:16px">Against your planned day</b>'
            + '<div style="display:grid;grid-template-columns:' + cols + ';align-items:baseline;padding:8px 0 6px;border-bottom:2px solid #172742;margin-top:4px"><span style="font-size:15px;font-weight:900">Energy</span><span></span><span style="font-size:15px;font-weight:900;text-align:right">' + energy.g + '</span><span style="font-size:15px;font-weight:900;text-align:right">' + energy.m + '</span><span style="font-size:13px;color:#5b6b8a;text-align:right">' + energy.d + '</span></div>'
            + '<div style="display:grid;grid-template-columns:' + cols + ';font-size:11.5px;font-weight:700;color:#8a97ad;letter-spacing:.04em;text-transform:uppercase;padding:6px 0 0"><span></span><span></span><span style="text-align:right">Plate</span><span style="text-align:right">' + word + '</span><span style="text-align:right">Day</span></div>'
            + rows.map(tr).join("")
            + '<div style="border-top:1px solid #e3eaf6;margin-top:4px;padding-top:8px;font-size:12.5px;color:#5b6b8a;line-height:1.45">Energy heads the table, as on a pack. A letter is the kind of food: grams per 100 kcal against your day\'s rate, the same however big the plate. The percentages are the amount: of what ' + word + ' has left, and of the whole day.<br><span style="color:#1f5fc7;font-weight:700">Per 100 kcal ›</span></div>';
          ro.after(seg);
        }
      }, { mark, NOTE, ls, pct, word: m.word, st, ICON, thumbs: thumb("#1d8a4c") + thumb("#1d8a4c"), o,
        energy: { g: Math.round(t.kcal) + " kcal", m: pct + "%", d: Math.round((t.kcal / DAY.kcal) * 100) + "%" },
        rows: NAMES.map(([k, n], q) => { const g = k === "fiber" && t.fibNull ? null : t[k]; return { n, l: ls[q], g: g === null ? "?" : Math.round(g) + " g", m: g === null ? "" : Math.round((g / (DAY[k] * share)) * 100) + "%", d: g === null ? "" : Math.round((g / DAY[k]) * 100) + "%" }; }) });
      return pct;
    };
    const say = (p, text) => p.evaluate(({ text, NOTE }) => { const el = document.querySelector(".readout"); if (!el) return; const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = text; (el.nextElementSibling?.tagName === "SECTION" ? el.nextElementSibling : el).after(n); }, { text, NOTE });
    let p = await setup(lunch, "Grilled chicken with rice and salad");
    await quick(p, lunch, { daam: true });
    await say(p, "The heading is the meal check: Lunch · 103%. Its icon: double thumbs only when the plate is the DaaM Good spot (a dish, the numbers and your day, all three). The line under the number is the four letters, nothing else. PD, the big number, is the energy reading; there is no E.");
    await crop(p, "r129v3daam"); await p.close();
    p = await setup(lunch.map((x) => x.id === "d" ? { ...x, grams: 4 } : x), "Grilled chicken with rice and salad");
    await quick(p, lunch, {});
    await say(p, "The size fits but the plate is not the DaaM Good spot (a gate says something): the green check, not the double thumbs.");
    await crop(p, "r129v3fits"); await p.close();
    p = await setup(items, "Quark bowl");
    await quick(p, items, {});
    await say(p, "Under: the amber arrow down. PD 8.2 and fits your plan, the letters fine, and Lunch · 53%: the kind of food is right, the amount is not.");
    await crop(p, "r129v3under"); await p.close();
    p = await setup(big, "Schnitzel with fries");
    await quick(p, big, {});
    await say(p, "Over: the red arrow up. Lunch at more than one and a half times its size.");
    await crop(p, "r129v3over"); await p.close();
    p = await setup(items, "Quark bowl");
    await quick(p, items, { open: true });
    await crop(p, "r129v3open"); await p.close();
    p = await setup(items.slice(2), "Apple and peanut butter");
    const t4 = sum(items.slice(2));
    await quick(p, items.slice(2), { snack: true, snackPct: Math.round((t4.kcal / DAY.kcal) * 100) });
    await say(p, "A snack, a dessert, a plate with no meal: the heading reads against the day, no icon.");
    await crop(p, "r129v3snack"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
