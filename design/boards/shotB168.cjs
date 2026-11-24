// Board B168 (seen while drawing B166, 23 November 2026; Coach Milan 24 November 07:04 and 07:07: fix it, one portion).
// The PD card says One portion, its numbers table showed the whole recipe. One scratch build of main, 0.3.192
// (/home/claude/work/b168, not committed); there the flag board-new gives the table one portion. Nothing in the repo changes.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/b168";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs168", PORT = "3719", U = `http://127.0.0.1:${PORT}`;
fs.mkdirSync(R, { recursive: true });
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats, fiber, extra = {}) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, ...extra });
const Q = food("q", "Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0, { barcode: "4056489000001" }), P = food("p", "Frischer Blätterteig", 400, 6, 36, 25, 1.5, { barcode: "4056489000002" }),
  E = food("e", "Eggs", 143, 12.6, 0.7, 9.5, 0, { source: "Reference table", refId: "egg" }), F = food("f", "Feta Leicht", 180, 17, 1, 12, 0, { barcode: "4056489000003" });
const it = (id, f, g, part) => ({ id, food: f, grams: g, locked: false, ...(part ? { part } : {}) });
const I = { q: it("a", Q, 250, "Filling"), p: it("b", P, 375, "Base"), e: it("d", E, 122, "Filling"), f: it("h", F, 150, "Filling") };
const tok = (x, n) => `[[i:${x.id}|${n}]]`;
const recipe = { id: "m-burek", title: "Lazy Burek", items: Object.values(I), makes: { n: 4, unit: "portions" }, portion: 224, savedAt: "2026-11-23T16:00:00Z",
  steps: [`Preheat your oven to 200 °C. Mix ${tok(I.q, "Körniger Frischkäse Tworog 2,5% Fett")}, ${tok(I.e, "eggs")} and ${tok(I.f, "Feta Leicht")} in a bowl.`, `Lay out ${tok(I.p, "Frischer Blätterteig")} on baking paper.`, "Pour the filling in and bake at 200 °C for 25 minutes."] };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5;white-space:normal`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await sleep(500); } }
  const b = await chromium.launch();
  const open = async (isNew) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-23T23:50:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, Q, P, E, F], meals: [recipe], feedback: [] });
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-burek"); await sleep(1500);
    if (isNew) { await p.evaluate(() => localStorage.setItem("board-new", "1")); await p.reload(); await sleep(1500); }
    await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; }"; document.head.append(st); });
    return p;
  };
  // a note after (or before) an element; marks get the blue outline
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => {
    const pick = (s) => (s.startsWith("JS:") ? [eval(s.slice(3))].flat().filter(Boolean) : [...document.querySelectorAll(s)]);
    for (const m of marks) pick(m).forEach((e) => (e.style.cssText += ";" + MARK));
    const t = pick(sel)[0]; if (!t) return "missing " + sel; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement(where, n); return "ok"; }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove()));
  // one tall picture from the top of `from` to the bottom of `to` (and of every note); wide shows the page past the phone's edge
  const shot = async (p, name, from, to, wide = false) => { await sleep(400);
    const r = await p.evaluate(([from, to]) => { const pick = (s) => (s.startsWith("JS:") ? [eval(s.slice(3))].flat()[0] : document.querySelector(s));
      const a = pick(from).getBoundingClientRect(), e = pick(to)?.getBoundingClientRect(); const notes = [...document.querySelectorAll(".board-note")].map((n) => n.getBoundingClientRect().bottom);
      return { y: a.top + scrollY - 12, h: Math.max(e ? e.bottom : a.bottom, ...notes) - a.top + 26, sw: document.documentElement.scrollWidth }; }, [from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: wide ? r.sw : 390, height: r.h } }); console.log(name, Math.round(r.h), r.sw); };
  try {
    for (const isNew of [false, true]) {
      const k = isNew ? "2" : "1";
      const p = await open(isNew);
      console.log(await note(p, ".rq-readout", isNew ? "No change: One portion, 549 kcal, 224 g. I tap the letters." : "One portion: 549 kcal, 224 g. I tap the letters.", [".rq-readout .letters-row"]));
      await shot(p, `68-${k}a`, "main", ".board-note"); await clean(p);
      await p.locator(".rq-readout .letters-row").click(); await sleep(500);
      if (!isNew) console.log(await note(p, ".rq-readout", "Under <b>One portion</b> the numbers say Total 897 g and 2,194 kcal: the whole recipe, 4 portions. The card above says 549 kcal and 224 g; the Nutrition table below says 1 portion, 224 g.", [".rq-readout .nt-total", "JS:document.querySelector('.rq-readout .readout-mid small')"]));
      else console.log(await note(p, ".rq-readout", "<b>New:</b> the numbers are one portion: Total 224 g and 549 kcal, fat 34 g, protein 23 g, the same as the card and the Nutrition table's 1 portion. The whole recipe stays in the Nutrition table, column All 4. The letters do not change: they are per 100 kcal.", [".rq-readout .nt-total", "JS:document.querySelector('.rq-readout .readout-mid small')"]));
      await shot(p, `68-${k}b`, ".rq-readout", "section.nt-card"); await p.context().close();
    }
  } catch (e) { console.log("ERR", e.message.slice(0, 400)); } finally { await b.close(); server.kill(); }
})();
