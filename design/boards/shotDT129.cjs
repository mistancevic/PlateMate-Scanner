// Boards DT129 and DT130 (Milan 26 October 12:00). DT129: the letters block, a subtle header of macro names above the letters,
// the grams, one word under them (low, match, high), and Against your planned day as the title above the table; B: the table
// out of the PD block as its own segment. DT130: Your photos inside the meal camera, as for labels; B: read it later.
// Drawn in the browser; nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3324", U = `http://127.0.0.1:${PORT}`;
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
    // the cells as they are, read off the page: letter, grams
    const readCells = (p) => p.evaluate(() => [...document.querySelectorAll(".readout .letter-cell")].map((c) => ({ l: c.querySelector(".letters")?.textContent.trim(), g: c.querySelector(".letter-g")?.textContent.trim() })));
    const word = (l) => l.endsWith("?") ? "no value" : l.endsWith("+") ? "high" : l.endsWith("-") ? "very low" : l === l.toUpperCase() ? "match" : "low";
    const NAMES = ["Fat", "Carbs", "Fibre", "Protein"];
    // DT129 Now
    let p = await setup(); await crop(p, "r129now");
    const cells = (await readCells(p)).map((c, k) => ({ ...c, n: NAMES[k], w: word(c.l) })); await p.close();
    // DT129 A: inside the PD block: the title above, the header of names, the letter, the grams, one word
    p = await setup();
    await p.evaluate(({ mark, NOTE, cells }) => {
      const row = document.querySelector(".readout .letters-row"); if (!row) return;
      const cell = (c) => '<div style="flex:1;min-width:0;background:rgba(255,255,255,.26);border-radius:9px;padding:6px 8px;display:flex;flex-direction:column;gap:2px">'
        + '<div style="font-size:11.5px;font-weight:700;opacity:.8;letter-spacing:.02em">' + c.n + '</div>'
        + '<div style="font-family:ui-monospace,Menlo,monospace;font-size:18px;font-weight:700;line-height:1.1">' + c.l + '</div>'
        + '<div style="font-size:12.5px;font-weight:900;white-space:nowrap">' + c.g + '</div>'
        + '<div style="font-size:12.5px;font-weight:600;white-space:nowrap;opacity:.95">' + c.w + '</div></div>';
      const d = document.createElement("div"); d.style.cssText = "background:rgba(255,255,255,.16);color:inherit;border-radius:10px;padding:8px;" + mark;
      d.innerHTML = '<div style="font-size:12.5px;font-weight:700;opacity:.9;margin:0 2px 6px">Against your planned day</div><div style="display:flex;gap:6px">' + cells.map(cell).join("") + '</div>';
      row.replaceWith(d);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Variant A: the table stays in the PD block. Against your planned day is its title, above it. Each cell: the macro's name, subtle (Fat, Carbs, Fibre, Protein), the letter, the grams, and one word that never wraps: low, match, high, very low, no value. The letters keep their meaning; the word says it for the first weeks. A tap still opens the numbers per 100 kcal.";
      d.closest(".plate-card").appendChild(n);
    }, { mark, NOTE, cells });
    await crop(p, "r129a"); await p.close();
    // DT129 B: the table out of the PD block, its own segment, label style, one row per macro
    p = await setup();
    await p.evaluate(({ mark, NOTE, cells }) => {
      const row = document.querySelector(".readout .letters-row"); if (!row) return;
      const readout = row.closest(".readout"); row.closest(".readout-letters")?.remove();
      const seg = document.createElement("section"); seg.style.cssText = "background:#fff;border:1px solid #d1dcf0;border-radius:14px;padding:10px 12px;margin:10px 0;color:#172742;" + mark;
      const tr = (c, k) => '<div style="display:grid;grid-template-columns:1fr 46px 56px 76px;align-items:baseline;padding:7px 0;' + (k ? 'border-top:1px solid #e3eaf6;' : '') + '">'
        + '<span style="font-size:15px;font-weight:700">' + c.n + '</span>'
        + '<span style="font-family:ui-monospace,Menlo,monospace;font-size:16px;font-weight:700;color:#1f5fc7">' + c.l + '</span>'
        + '<span style="font-size:15px;font-weight:900;text-align:right">' + c.g + '</span>'
        + '<span style="font-size:13px;font-weight:600;color:#5b6b8a;text-align:right">' + c.w + '</span></div>';
      seg.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px"><b style="font-size:16px">Against your planned day</b><small style="color:#1f5fc7;font-weight:700">The numbers ›</small></div>'
        + '<div style="display:grid;grid-template-columns:1fr 46px 56px 76px;font-size:11.5px;font-weight:700;color:#8a97ad;letter-spacing:.04em;text-transform:uppercase;padding:4px 0"><span>Macro</span><span></span><span style="text-align:right">Plate</span><span style="text-align:right">Your day</span></div>'
        + cells.map(tr).join("");
      readout.after(seg);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Variant B: the PD block keeps only what is the plate itself: the number, fits your plan, kcal, protein, grams. The reading against your planned day moves out, under it, as its own segment, the way a nutrition label reads on a pack: one row per macro in the label order, the name, the letter, the grams, the word. White, so it is clearly the comparison and not the plate. Taller by about a row; nothing in it can wrap.";
      seg.after(n);
    }, { mark, NOTE, cells });
    await crop(p, "r129b"); await p.close();

    // DT130 Now: the Plate's Photo of my meal opens the phone's own picker, no camera of ours
    p = await setup([], "");
    await p.evaluate(({ mark, NOTE }) => { const b = document.querySelector(".mp-button"); if (!b) return; b.style.cssText += ";" + mark; const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Now (0.2.108): Photo of my meal is a file field. On a phone it opens the camera straight away; there is no way to pick a photo already taken, and no frame or hint as the label scan has."; b.parentElement.after(n); }, { mark, NOTE });
    await shot(p, "r130now"); await p.close();
    // DT130 A: the same camera as for labels, a Meal mode, Your photos bottom left
    p = await setup([], "");
    await p.locator(".ways button").filter({ hasText: "Scan" }).click(); await p.waitForTimeout(1500);
    await p.evaluate(({ mark, PH }) => {
      const t = document.querySelector(".cam-title"); if (t) t.textContent = "Photo of my meal";
      const modes = document.querySelector(".cam-modes"); if (modes) { for (const b of modes.querySelectorAll("button")) { b.classList.remove("on", "bg-white"); b.setAttribute("aria-pressed", "false"); } const m = modes.querySelector("button").cloneNode(true); m.textContent = "Meal"; m.classList.add("on", "bg-white"); m.style.cssText = mark; modes.appendChild(m); }
      const say = document.querySelector(".cam-say"); if (say) say.textContent = "The whole plate, from above";
      const v = document.querySelector("video"); if (v) { const img = document.createElement("img"); img.src = PH; img.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover"; v.after(img); v.style.display = "none"; }
      const fr = document.querySelector(".cam-frame-area"); if (fr) fr.innerHTML = '<div style="position:absolute;left:50%;top:50%;width:300px;height:300px;transform:translate(-50%,-50%);border:3px solid rgba(255,255,255,.9);border-radius:50%"></div>';
      const g = document.querySelector(".cam-gallery"); if (g) g.style.cssText += ";" + mark;
      for (const el of document.querySelectorAll("span, small, div")) if (el.children.length === 0 && /Auto shot/.test(el.textContent)) el.textContent = "Tap to take it";
    }, { mark, PH });
    await p.waitForTimeout(300); await p.screenshot({ path: `${R}/r130cam.png` }); console.log("shot r130cam");
    await p.close();
    // DT130 A: a photo from Your photos: whose plate, and when
    p = await setup([], "");
    await p.evaluate(({ mark, NOTE, PH }) => {
      const card = document.querySelector(".plate-card"); if (!card) return;
      const q = document.createElement("div"); q.style.cssText = mark + ";background:#fff;padding:12px;margin:4px 0 10px;border-radius:14px";
      const chip = (t, primary) => '<span style="display:block;text-align:center;border:1.5px solid #2e7be8;border-radius:999px;padding:9px 12px;font-weight:900;font-size:14px;color:' + (primary ? '#fff' : '#1f5fc7') + ';background:' + (primary ? '#2e7be8' : '#fff') + ';margin-top:8px">' + t + '</span>';
      q.innerHTML = '<div style="display:flex;gap:10px;align-items:center"><img src="' + PH + '" style="width:72px;height:72px;border-radius:10px;object-fit:cover;border:2px solid #2e7be8"><div style="font-size:14px;line-height:1.4"><b>A photo from 12:40 today.</b> Whose plate is it?</div></div>'
        + chip("Mine, I ate it at 12:40", true) + chip("Mine, I am eating it now") + chip("Not mine: an idea to cook");
      card.insertBefore(q, card.firstChild);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "A photo picked from Your photos asks one thing before the read: whose plate, and when. The time comes from the photo (12:40) and a tap on it changes it. Mine, I ate it at 12:40: the read lands, and Ate it logs it at 12:40, in the meal that time belongs to. Mine, now: as from the camera. Not mine (a friend's dinner on WhatsApp, a plate online): the read lands as an idea, no Ate it.";
      q.after(n);
    }, { mark, NOTE, PH });
    await crop(p, "r130whose"); await p.close();
    // DT130 A: not mine, an idea: the buttons change
    p = await setup(items, "Quark bowl");
    await p.evaluate(({ mark, NOTE, PH }) => {
      const card = document.querySelector(".plate-card"); if (!card) return;
      const top = document.createElement("div"); top.style.cssText = mark + ";background:#eef3fc;padding:8px 10px;margin:4px 0 10px;font-size:13.5px;color:#172742;display:flex;gap:10px;align-items:center;border-radius:12px";
      top.innerHTML = '<img src="' + PH + '" style="width:64px;height:64px;border-radius:10px;object-fit:cover;flex:none"><div><b>An idea from a photo.</b> Four foods read, amounts estimated (~). Not logged: it is not your plate.</div>';
      card.insertBefore(top, card.firstChild);
      const btn = (t, pr) => '<span style="flex:1;min-width:120px;text-align:center;border:1.5px solid #2e7be8;border-radius:999px;padding:9px 10px;font-weight:900;font-size:14px;color:' + (pr ? '#fff' : '#1f5fc7') + ';background:' + (pr ? '#2e7be8' : '#fff') + '">' + t + '</span>';
      const say = document.createElement("div"); say.style.cssText = mark + ";background:#fff;padding:10px 12px;margin:10px 0;border-radius:14px;font-size:14.5px;line-height:1.45";
      say.innerHTML = '<b>Chef Mealan:</b> A breakfast bowl, about 420 to 520 kcal and 40 g protein. Sized for your breakfast it fits your day.<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">' + btn("Fit it to my breakfast", true) + btn("Save as an idea") + btn("Put it in my plan") + '</div>';
      card.after(say);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Not mine: the same read, the same gates, but the buttons are for cooking it, not for logging it. Fit it to my breakfast sizes it for you; Save as an idea puts it in Mine with the photo as its picture and Chef Mealan's idea mark; Put it in my plan picks a day and a meal.";
      say.after(n);
    }, { mark, NOTE, PH });
    await crop(p, "r130idea", "main"); await p.close();
    // DT130 B: read it later: the photo waits on Today
    p = await fresh([]);
    await p.goto(U + "/"); await p.waitForTimeout(1500);
    await p.evaluate(({ mark, NOTE, PH }) => {
      const c = document.querySelector(".mp-card"); if (!c) return;
      const d = document.createElement("div"); d.style.cssText = mark + ";background:#fff;border-radius:16px;padding:12px 14px;margin:10px 0";
      d.innerHTML = '<b style="font-size:16px">Plates to read · 2</b><div style="display:flex;gap:10px;margin-top:8px">' + ['12:40', '08:15'].map((t) => '<div style="text-align:center"><img src="' + PH + '" style="width:84px;height:84px;border-radius:12px;object-fit:cover"><br><small style="color:#5b6b8a">' + t + '</small></div>').join("") + '</div><small style="display:block;color:#5b6b8a;margin-top:6px">Tap one to read it: Chef Mealan puts it on the Plate, logged at the time of the photo.</small>';
      c.after(d);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Variant B: Read later. In the meal camera, after the shutter, two buttons: Read now and Keep for later. Kept photos wait on Today as Plates to read, with their time; a tap reads one onto the Plate, and Ate it logs it at the photo's time. Nothing goes to the AI until you tap. The share from WhatsApp or the browser straight into Chef Mealan comes later: it needs Chef Mealan installed as an app on the phone, which it is not yet.";
      d.after(n);
    }, { mark, NOTE, PH });
    await shot(p, "r130later"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
