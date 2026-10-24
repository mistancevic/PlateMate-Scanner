// Boards DT93 and DT94 (Milan 24 October 13:58 to 14:01, from his first real test of 0.2.87): the culinary gate, Fit in place,
// and three phases (Craft, Make, Feedback). Now: 0.2.87 with Milan's plate: a protein bar, active dry yeast, peanut butter.
// New: the same pages with the change drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/built-wt";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3295", U = `http://127.0.0.1:${PORT}`;
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
  const b = await chromium.launch();
  const fresh = async (items = seed.items) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-10-24T13:47:00"));
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
  try {
    // ---- Now ----
    let p = await fresh(); await shot(p, "dt93NowPlate");
    await p.getByRole("button", { name: "Fit to my target" }).click(); await p.waitForTimeout(1500); await shot(p, "dt93NowFit");
    await p.close();
    // ---- New: DT93, the gate on the Plate ----
    p = await fresh([{ id: "a", food: BAR, grams: 150, locked: false }, { id: "b", food: YE, grams: 10, locked: false }, { id: "c", food: PB, grams: 150, locked: false }]);
    await phases(p, 0);
    await rowOf(p, "Clean Protein Bar Peanut Love"); await rowOf(p, "Active dry yeast"); await rowOf(p, "Peanut butter");
    await p.evaluate(({ NOTE }) => {
      const line = (name, txt) => { const r = document.querySelector(`[data-draw="${name}"]`); if (!r) return; const s = document.createElement("small"); s.textContent = txt; s.style.cssText = "display:block;color:#b3261e;font-weight:700;margin:-6px 12px 8px 64px"; r.after(s); };
      line("Clean Protein Bar Peanut Love", "150 g is 3 bars. One bar is 50 g.");
      line("Peanut butter", "150 g is a jar's third. A portion is 15 to 40 g.");
      const ro = document.querySelector(".readout"); if (ro) { ro.querySelector(".readout-mid span").textContent = "not a lunch yet"; ro.querySelector(".readout-mid small").textContent = "1,528 kcal, about 2 lunches · 101 g protein · 310 g"; }
      const ways = document.querySelector(".ways-out"); if (ways) { const d = document.createElement("div"); d.style.cssText = NOTE; d.innerHTML = `<b>Chef Mealan:</b> a bar, yeast and peanut butter do not make a lunch. The yeast needs a dough, and the bar is a snack on its own.<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="pill pill-small pill-primary">Make it a lunch around the bar</button><button class="pill pill-small">Make it a snack</button><button class="pill pill-small">Keep it as it is</button></div>`; ways.before(d); }
    }, { NOTE });
    await shot(p, "dt93NewGate"); await p.close();
    // ---- New: DT93b, Fit in place, within the ranges ----
    p = await fresh([{ id: "a", food: BAR, grams: 50, locked: false }, { id: "b", food: YE, grams: 10, locked: false }, { id: "c", food: PB, grams: 30, locked: false }]);
    await phases(p, 0);
    await rowOf(p, "Clean Protein Bar Peanut Love"); await rowOf(p, "Peanut butter"); await rowOf(p, "Active dry yeast");
    await p.evaluate(({ NOTE, mark }) => {
      const sug = (name, txt) => { const r = document.querySelector(`[data-draw="${name}"]`); if (!r) return; const s = document.createElement("small"); s.innerHTML = txt; s.style.cssText = "display:block;color:#1f5fc7;font-weight:700;margin:-6px 12px 8px 64px"; r.after(s); };
      sug("Peanut butter", "Chef Mealan suggests 20 g, in its 15 to 40 g. <u>Use it</u>");
      sug("Active dry yeast", "Stays at 10 g: Fit never moves a food past its portion.");
      const ro = document.querySelector(".readout"); if (ro) { ro.querySelector(".readout-mid span").textContent = "0.4 under your 6.5, the most these foods reach"; ro.querySelector(".readout-mid small").textContent = "350 kcal · 21 g protein · 80 g"; ro.style.cssText += ";" + mark; }
      const ways = document.querySelector(".ways-out"); if (ways) { const d = document.createElement("div"); d.style.cssText = NOTE; d.innerHTML = `These foods top out at PD 6.1 within their portions, and 350 kcal is half a lunch. Chef Mealan can:<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="pill pill-small pill-primary">Add foods for a lunch</button><button class="pill pill-small">Swap a food</button><button class="pill pill-small">Ask Chef Mealan</button></div><small style="display:block;margin-top:6px;color:#5b6b8a">Ask Chef Mealan opens the chat with this plate in it, and three chips: Swap a food · Make it a lunch · Make it a snack.</small>`; ways.before(d); }
      for (const b of document.querySelectorAll(".ways-out button")) if (/Fit to my target/.test(b.textContent)) b.textContent = "Fit again";
      for (const c of document.querySelectorAll("main section, main div")) if (/Add one of these from your foods/.test(c.textContent) && c.getBoundingClientRect().height < 700 && c.querySelector("button")) { c.style.display = "none"; break; }
    }, { NOTE, mark });
    await shot(p, "dt93NewFit"); await p.close();
    // ---- New: DT94, the end of Craft: name, steps, Lock the recipe ----
    p = await fresh([{ id: "a", food: BAR, grams: 50, locked: false }, { id: "d", food: seed.foods.find((f) => f.id === "f-bread"), grams: 80, locked: false }, { id: "e", food: seed.foods.find((f) => f.id === "f-banana"), grams: 120, locked: false }, { id: "c", food: PB, grams: 20, locked: false }]);
    await phases(p, 0);
    await p.evaluate(({ NOTE, mark }) => {
      const ro = document.querySelector(".readout"); if (ro) { ro.querySelector(".readout-top span").textContent = "This lunch"; ro.querySelector(".readout-mid b").textContent = "6.6"; ro.querySelector(".readout-mid span").textContent = "in your range"; ro.querySelector(".readout-mid small").textContent = "692 kcal · 46 g protein · 270 g"; ro.className = "readout readout-fit-high"; }
      for (const c of document.querySelectorAll("main section, main div")) if (/Add one of these from your foods/.test(c.textContent) && c.getBoundingClientRect().height < 700 && c.querySelector("button")) { c.style.display = "none"; break; }
      const ways = document.querySelector(".ways-out"); if (ways) {
        const st = document.createElement("section"); st.className = "card"; st.style.cssText = mark + ";margin:10px 0";
        st.innerHTML = `<b>Steps</b><small class="muted">Chef Mealan's, at your amounts. Change any word.</small><ol class="rp-steps"><li><span>1</span><div class="rp-step-text">Toast <b class="st-amt">80 g wholegrain bread</b>.</div></li><li><span>2</span><div class="rp-step-text">Spread <b class="st-amt">20 g peanut butter</b> and lay <b class="st-amt">120 g banana</b> in slices on top.</div></li><li><span>3</span><div class="rp-step-text">Eat <b class="st-amt">50 g protein bar</b> on the side, or crumble it over the banana.</div></li></ol>`;
        ways.before(st);
        const d = document.createElement("div"); d.style.cssText = NOTE; d.innerHTML = `<b>Lock the recipe</b> ends Craft. The name, the foods, the amounts and the steps stay as they are from here. Make and Feedback change nothing about the recipe.`; ways.before(d);
        ways.innerHTML = `<button class="pill pill-primary pill-wide" style="${mark}">Lock the recipe</button><button class="pill pill-wide">Keep it as it is</button>`;
      }
      const h = document.querySelector(".title-input, .step-head input"); if (h) { h.value = "Peanut banana toast"; h.setAttribute("value", "Peanut banana toast"); }
    }, { NOTE, mark });
    await shot(p, "dt94NewCraft"); await p.close();
    // ---- New: DT94b, Make: the locked recipe, tick the steps, photos, how it went, in one screen ----
    p = await fresh([{ id: "a", food: BAR, grams: 50, locked: false }, { id: "d", food: seed.foods.find((f) => f.id === "f-bread"), grams: 80, locked: false }, { id: "e", food: seed.foods.find((f) => f.id === "f-banana"), grams: 120, locked: false }, { id: "c", food: PB, grams: 20, locked: false }]);
    await p.getByRole("button", { name: "Keep it as it is" }).click(); await p.waitForTimeout(900);
    await p.locator(".way").first().click().catch(() => {}); await p.getByRole("button", { name: /I'm making it/ }).first().click().catch(() => {}); await p.waitForTimeout(900);
    await phases(p, 1);
    await p.evaluate(({ NOTE, mark }) => {
      const h = document.querySelector("main h1, main h2"); if (h) h.textContent = "Make: Peanut banana toast";
      const sub = h && h.nextElementSibling; if (sub && /photo/i.test(sub.textContent)) sub.textContent = "Tick the steps as you go. A photo while it is on the counter, then how it went.";
      const d = document.createElement("section"); d.className = "card"; d.style.cssText = mark + ";margin:10px 0";
      d.innerHTML = `<b>The steps</b><div class="mk-check on"><span class="mk-box">✓</span><span>Toast <b class="st-amt">80 g wholegrain bread</b>.</span></div><div class="mk-check"><span class="mk-box"></span><span>Spread <b class="st-amt">20 g peanut butter</b> and lay <b class="st-amt">120 g banana</b> in slices on top.</span></div><div class="mk-check"><span class="mk-box"></span><span>Eat <b class="st-amt">50 g protein bar</b> on the side.</span></div>`;
      const first = document.querySelector("main .label, main p.label"); if (first) first.before(d);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "One screen for Make: the steps to tick, the photos, how it went and how much you ate. Nothing here changes the recipe."; if (first) first.before(n);
    }, { NOTE, mark });
    await shot(p, "dt94NewMake"); await p.close();
    // ---- New: DT94c, Feedback ----
    p = await fresh([{ id: "a", food: BAR, grams: 50, locked: false }, { id: "d", food: seed.foods.find((f) => f.id === "f-bread"), grams: 80, locked: false }, { id: "c", food: PB, grams: 20, locked: false }]);
    await p.getByRole("button", { name: "Keep it as it is" }).click(); await p.waitForTimeout(900);
    await p.locator(".way").first().click().catch(() => {}); await p.getByRole("button", { name: /I'm making it/ }).first().click().catch(() => {}); await p.waitForTimeout(700);
    await p.getByRole("button", { name: "On to How was it?" }).click(); await p.waitForTimeout(700); await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(300);
    await phases(p, 2);
    await p.evaluate(({ NOTE }) => {
      const h = document.querySelector("main h1, main h2"); if (h) h.textContent = "Feedback: Peanut banana toast";
      const nm = [...document.querySelectorAll("label.field")].find((l) => /Name it/.test(l.textContent)); if (nm) { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "The name was set in Craft, so no Name it here. How was it, a line for your coach, Save in My recipes, Share with Coach Milan."; nm.replaceWith(d); }
    }, { NOTE });
    await shot(p, "dt94NewFeedback"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
