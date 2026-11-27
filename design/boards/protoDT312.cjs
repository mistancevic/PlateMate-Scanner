// Prototype DT312 (Coach Milan 27 November 2026, 20:25: it is complex to follow design screens for such big changes; make a
// prototype). Clean pictures of the new flow, without board notes, from the scratch build of main with the change
// (BOARD_ROOT, /home/claude/work/b312, not committed), and the place of every button that leads on. genProtoDT312.py turns
// them into one artboard that plays on the canvas: three paths, tap the ringed places.
process.env.ROWS = "new";
const path = require("node:path"), fs = require("node:fs"), { spawn } = require("node:child_process");
// ROWS=new shoots the new rows on a scratch build of main with the change (BOARD_ROOT, /home/claude/work/b312, not committed)
const NEW = process.env.ROWS === "new";
const ROOT = NEW ? (process.env.BOARD_ROOT || "/home/claude/work/b312") : (process.env.BEFORE_ROOT || path.resolve(__dirname, "../.."));
const { chromium } = require(path.resolve(__dirname, "../../node_modules/playwright"));
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/proto312"; fs.mkdirSync(R, { recursive: true });
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats, fiber, extra = {}) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, table: undefined, icon: undefined, places: [], ...extra });
const Q = food("q", "Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0, { barcode: "4056489000001" }), P = food("p", "Frischer Blätterteig", 400, 6, 36, 25, 1.5, { barcode: "4056489000002" }),
  E = food("e", "Eggs", 143, 12.6, 0.7, 9.5, 0, { source: "Reference table", refId: "egg" }), F = food("f", "Feta Leicht", 180, 17, 1, 12, 0, { barcode: "4056489000003" });
const it = (id, f, g, part) => ({ id, food: f, grams: g, locked: false, ...(part ? { part } : {}) });
const burek = { id: "m-burek", title: "Lazy Burek", kitchen: "Balkan", items: [it("a", Q, 250, "Filling"), it("b", P, 375, "Base"), it("d", E, 122, "Filling"), it("h", F, 150, "Filling")], makes: { n: 4, unit: "portions" }, portion: 224, savedAt: "2026-11-23T16:00:00Z",
  steps: ["Mix 250 g Körniger Frischkäse, 122 g eggs and 150 g Feta Leicht.", "Lay out 375 g Frischer Blätterteig, spread the filling, roll it up.", "Bake at 200 °C for 25 minutes."] };
const omelette = { id: "m-om", title: "Feta omelette", kitchen: "Balkan", items: [it("o1", E, 122), it("o2", F, 50)], portion: 172, savedAt: "2026-11-20T08:00:00Z", steps: ["Whisk 2 eggs with 50 g Feta Leicht.", "Cook in a hot pan for 4 minutes."] };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5;white-space:normal`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = process.env.PORT || "3772";
const serve = async () => { const s = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${PORT}/`); break; } catch { await sleep(500); } } return s; };
const M = {};
(async () => {
  const s = await serve(); const b = await chromium.launch();
  const open = async (url) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-26T12:10:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, Q, P, E, F], meals: [burek, omelette], feedback: [] });
    await require(path.resolve(__dirname, "../../tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A Balkan pie.", around: "", better_as: "" }) }));
    await p.goto(`http://127.0.0.1:${PORT}${url}`); await sleep(1800);
    await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; } .toast, .snack { display: none !important; } *:has(> .cook-mode) > *:not(.cook-mode), body:has(.cook-mode) header, body:has(.cook-mode) .topbar { display: none !important; } .cook-mode { position: static !important; overflow: visible !important; } .plate-card > .plate-end > .prepare-it.pill-primary, .plate-card > .ways-out-col > .pill-primary { position: static !important; box-shadow: none !important; width: 100% !important; } main { padding-bottom: 24px !important; }"; document.head.append(st); });
    return p;
  };
  // q: a CSS selector, or JS: an expression that gives elements
  const Q_ = `const q = (s) => (s.startsWith("JS:") ? [eval(s.slice(3))].flat().filter(Boolean) : [...document.querySelectorAll(s)]);`;
  const note = (p, sel, html, marks = []) => p.evaluate(([Q_, sel, html, marks, MARK, NOTE]) => { eval(Q_ + "globalThis.__q = q"); const q = globalThis.__q;
    for (const m of marks) q(m).forEach((e) => { e.dataset.bm = "1"; e.style.cssText += ";" + MARK; });
    const t = q(sel)[0]; if (!t) return "missing " + sel; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement("afterend", n); return "ok"; }, [Q_, sel, html, marks, MARK, NOTE]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[data-bm]").forEach((e) => { e.style.outline = ""; delete e.dataset.bm; }); });
  // a whole screen (one tall picture), or from one element to another when the screen starts lower down
  const shot = async (p, name, from, to) => { await p.mouse.move(2, 2); await sleep(400);
    if (!from) { await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log(name, "full"); return; }
    const r = await p.evaluate(([Q_, from, to]) => { eval(Q_ + "globalThis.__q = q"); const q = globalThis.__q; const a = q(from)[0].getBoundingClientRect(), e = to ? q(to)[0]?.getBoundingClientRect() : null; const notes = [...document.querySelectorAll(".board-note")].map((n) => n.getBoundingClientRect().bottom);
      return { y: a.top + scrollY - 12, h: Math.max(e ? e.bottom : a.bottom, ...notes) - a.top + 26 }; }, [Q_, from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name, Math.round(r.h)); };
  // the design rules, measured: height (D10), corners (D16), weight, and the space above and below (D15)
  const measure = (p, key, sel) => p.evaluate(([Q_, sel]) => { eval(Q_ + "globalThis.__q = q"); const q = globalThis.__q; const e = q(sel)[0]; if (!e) return null; const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    const vis = (x) => x && x.getBoundingClientRect().height > 0 && getComputedStyle(x).display !== "none";
    let pr = e.previousElementSibling; while (pr && !vis(pr)) pr = pr.previousElementSibling; let nx = e.nextElementSibling; while (nx && !vis(nx)) nx = nx.nextElementSibling;
    return { h: Math.round(r.height), r: parseFloat(cs.borderTopLeftRadius), fw: cs.fontWeight, fs: parseFloat(cs.fontSize), above: pr ? Math.round(r.top - pr.getBoundingClientRect().bottom) : null, below: nx ? Math.round(nx.getBoundingClientRect().top - r.bottom) : null }; }, [Q_, sel]).then((m) => { M[key] = m; console.log("measure", key, JSON.stringify(m)); return m; });
  const px = (m) => (m ? `${m.h} px high${m.h < 44 ? ", under 44 px (D10)" : ""}, corners ${m.r >= 99 ? "round" : m.r + " px"}${m.r < 99 && m.r !== 14 ? ", not 14 px (D16)" : ""}` : "not found");
  const stored = (p, id) => p.evaluate((id) => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === id), id);
  const grams = (p, re, g) => p.getByLabel(re).first().fill(String(g)).then(() => p.getByLabel(re).first().press("Enter")).then(() => sleep(700));
  const tap = async (p, name) => { await p.getByRole("button", { name }).first().click(); await sleep(1000); };
  const S = {};
  const btnAny = (t) => `JS:[...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === ${JSON.stringify(t)}).pop()`;
  const rect = (p, sel) => p.evaluate(([Q_, sel]) => { eval(Q_ + "globalThis.__q = q"); const e = globalThis.__q(sel)[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; }, [Q_, sel]);
  const PIN = ".plate-card > .plate-end > .prepare-it.pill-primary, .plate-card > .ways-out-col > .pill-primary";
  // one screen: the picture, the places to tap (each with where it leads), and the pinned main step, drawn by the artboard itself
  const snap = async (p, id, title, spots = [], pin = null) => { await p.mouse.move(2, 2); await sleep(450);
    const out = []; for (const [sel, to] of spots) { const r = await rect(p, sel); if (r) out.push({ ...r, to }); else console.log("NO SPOT", id, sel); }
    if (pin) await p.evaluate((PIN) => document.querySelectorAll(PIN).forEach((e) => { e.dataset.hid = "1"; e.style.setProperty("display", "none", "important"); }), PIN);
    await p.screenshot({ path: `${R}/${id}.png`, fullPage: true });
    if (pin) await p.evaluate(() => document.querySelectorAll("[data-hid]").forEach((e) => { e.style.removeProperty("display"); delete e.dataset.hid; }));
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    S[id] = { title, h, spots: out, ...(pin ? { pin: { label: pin[0], to: pin[1] } } : {}) }; console.log(id, h, out.length); };
  const addFood = async (p, f) => { if (await p.getByRole("button", { name: "+ Add more to your plate" }).count()) { await p.getByRole("button", { name: "+ Add more to your plate" }).click(); await sleep(500); }
    await p.getByPlaceholder("Search all foods").fill(f); await sleep(800); await p.getByRole("button", { name: /^\+? ?Add$/ }).first().click(); await sleep(700); await p.getByRole("button", { name: "Close" }).first().click().catch(() => {}); await sleep(300); };
  const setLunch = async (q) => { await q.getByRole("button", { name: "Change what this plate is" }).click(); await sleep(700); await q.locator(".pcal-row").filter({ hasText: /Lunch/ }).first().click(); await sleep(600); await q.getByRole("button", { name: "Close" }).first().click().catch(() => {}); await sleep(400); };
  const toDone = async (p) => { for (let i = 0; i < 25 && !(await p.locator(".cook-to-eat").count()); i++) { const s1 = p.getByRole("button", { name: /Step 1 ›/ }).first(); if (await s1.count()) await s1.click(); else await p.locator(".cook-mode").getByRole("button", { name: /^Next ›|^Done/ }).first().click(); await sleep(350); } };
  const STY = ".toast, .snack { display: none !important; } header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; } *:has(> .cook-mode) > *:not(.cook-mode), body:has(.cook-mode) header, body:has(.cook-mode) .topbar { display: none !important; } .cook-mode { position: static !important; overflow: visible !important; } .plate-card > .plate-end > .prepare-it.pill-primary, .plate-card > .ways-out-col > .pill-primary { position: static !important; box-shadow: none !important; width: 100% !important; } main { padding-bottom: 24px !important; }";
  const restyle = (q) => q.evaluate((t) => { const st = document.createElement("style"); st.textContent = t; document.head.append(st); }, STY);
  const NEXT = "JS:[...document.querySelectorAll('.cook-mode button')].find((b) => /^Next ›/.test(b.innerText.trim()))", STEP1 = "JS:[...document.querySelectorAll('.cook-mode button')].find((b) => /Step 1 ›/.test(b.innerText.trim()))", CLOSE = "JS:[...document.querySelectorAll('.cook-mode button')].find((b) => /Close/.test(b.innerText.trim()))";
  const LUNCH = "JS:[...document.querySelectorAll('.eat-cal .pcal-row')].find((e) => /Lunch/.test(e.innerText))";
  try {
    // ---- path A: a recipe, lunch set ----
    let p = await open("/my-recipes/m-burek");
    await snap(p, "a1", "Lazy Burek, the recipe", [[btnAny("Put it on the Plate"), "a2"], ["JS:[...document.querySelectorAll('.rq-steps button')].find((b) => b.innerText.trim() === 'Start cooking')", "a3"]]);
    await tap(p, "Put it on the Plate"); await setLunch(p);
    await snap(p, "a2", "The Plate, lunch set", [], ["Start cooking ›", "a3"]);
    await tap(p, "Start cooking ›"); await p.getByRole("button", { name: "Buttons only" }).click(); await sleep(400);
    await snap(p, "a3", "The cook: get it ready", [[STEP1, "a4"], [NEXT, "a4"], [CLOSE, "a3x"]]);
    await p.getByRole("button", { name: /Step 1 ›/ }).first().click(); await sleep(600);
    await snap(p, "a4", "The cook: step 1 of 3", [[NEXT, "a5"], [CLOSE, "a3x"]]);
    await p.getByRole("button", { name: "✕ Close" }).click(); await sleep(1200);
    await snap(p, "a3x", "Today, while cooking", [[btnAny("Go on ›"), "a4"]]);
    await p.getByRole("button", { name: "Go on ›" }).click(); await sleep(1200); await toDone(p);
    await snap(p, "a5", "The cook: done", [[".cook-to-eat", "a6"]]);
    await p.locator(".cook-to-eat").click(); await sleep(1300);
    await snap(p, "a6", "Today, cooked", [[btnAny("I ate it ›"), "a7"]]);
    // the clock moves on; the page is drawn again by leaving Today and coming back (a reload loses the Plate's meal in the scratch: to mend in the build)
    await p.clock.setFixedTime(new Date("2026-11-26T14:20:00+01:00")); const navTo = (name) => p.evaluate((name) => [...document.querySelectorAll(".bottom-nav button")].find((b) => b.innerText.trim() === name)?.click(), name); await navTo("Plan"); await sleep(800); await navTo("Today"); await sleep(1200);
    await snap(p, "a6q", "Today, 14:20: it still waits", [[btnAny("I ate it ›"), "a7"], [btnAny("Not yet"), "a6"]]);
    await p.getByRole("button", { name: "I ate it ›" }).click(); await sleep(2000);
    await snap(p, "a7", "Today, logged as lunch", [[".meal-how", "a8"]]);
    await p.getByRole("button", { name: "How was it? ›" }).first().click(); await sleep(900);
    await snap(p, "a8", "How was it?", [[".pm-save-changes", "a9"], [".pm-cancel", "a7"]]);
    await p.getByRole("button", { name: "DaaM good" }).click(); await p.getByRole("button", { name: "Save changes" }).click(); await sleep(1000);
    await snap(p, "a9", "Today, the end of this path", []);
    await p.context().close();
    // ---- path B: a new dish, no meal set ----
    p = await open("/plate");
    await snap(p, "b1", "The Plate, empty", [["JS:[...document.querySelectorAll('button')].filter((b) => /Add/.test(b.innerText))[7]", "b2"]]);
    await p.getByRole("button", { name: /Add/ }).nth(7).click(); await sleep(600); await addFood(p, "Salmon");
    await snap(p, "b2", "The Plate, eggs and salmon", [[btnAny("Write my own"), "b3"]], ["Start cooking ›", "b5"]);
    await tap(p, "Write my own"); await p.getByLabel(/Your steps/).fill("Fry the salmon for 3 minutes on each side.\nScramble the egg next to it."); await sleep(300);
    await snap(p, "b3", "The Plate, writing the steps", [[btnAny("Keep my steps"), "b4"]], ["Start cooking ›", "b5"]);
    await tap(p, "Keep my steps");
    await snap(p, "b4", "The Plate, steps kept", [], ["Start cooking ›", "b5"]);
    await tap(p, "Start cooking ›"); await p.getByRole("button", { name: "Buttons only" }).click(); await sleep(400);
    await snap(p, "b5", "The cook: get it ready", [[STEP1, "b6"], [NEXT, "b6"]]);
    await toDone(p);
    await snap(p, "b6", "The cook: done", [[".cook-to-eat", "b7"]]);
    await p.locator(".cook-to-eat").click(); await sleep(1300);
    await snap(p, "b7", "Today, ready to eat", [[".cs-main", "b8"]]);
    await p.locator(".cs-main").click(); await sleep(1500);
    await snap(p, "b8", "Which meal was it?", [[LUNCH, "b9"]]);
    await p.locator(".eat-cal .pcal-row").filter({ hasText: /Lunch/ }).first().click(); await sleep(1800);
    await snap(p, "b9", "Today, logged as lunch", [[".meal-how", "b10"]]);
    await p.getByRole("button", { name: "How was it? ›" }).first().click(); await sleep(900);
    await snap(p, "b10", "How was it?", [[".pm-save-changes", "b9"], [".pm-cancel", "b9"]]);
    await p.context().close();
    // ---- path C: a plate that is ready to eat ----
    p = await open("/plate"); await addFood(p, "Skyr"); await addFood(p, "Banana");
    await snap(p, "c1", "The Plate, skyr and a banana", [], ["Eat it ›", "c2"]);
    await tap(p, "Eat it ›");
    await snap(p, "c2", "Today, ready to eat", [[".cs-main", "c3"]]);
    await p.locator(".cs-main").click(); await sleep(1500);
    await snap(p, "c3", "Which meal was it?", [[LUNCH, "c4"]]);
    await p.locator(".eat-cal .pcal-row").filter({ hasText: /Lunch/ }).first().click(); await sleep(1800);
    await snap(p, "c4", "Today, logged as lunch", [[".meal-how", "c5"]]);
    await p.getByRole("button", { name: "How was it? ›" }).first().click(); await sleep(900);
    await snap(p, "c5", "How was it?", [[".pm-save-changes", "c4"], [".pm-cancel", "c4"]]);
    await p.context().close();
  } catch (e) { console.log("ERR", e.message.slice(0, 500)); } finally { fs.writeFileSync(`${R}/screens.json`, JSON.stringify(S, null, 1)); await b.close(); s.kill(); }
})();
