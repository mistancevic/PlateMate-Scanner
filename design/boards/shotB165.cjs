// Board B165 and B166 (Coach Milan 23 November 2026, 22:26, screenshots from his phone; 23:33: draw both on one board).
// B165: a long food chip runs past the step field in Edit recipe. B166: the small lines of the numbers inside the recipe's
// PD card are white on white. One scratch build of main, 0.3.191 (/home/claude/work/b165, not committed). The new screens
// are a sketch: the same real page, with the proposed CSS put into the page in the browser. Nothing in the repo changes.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/b165";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs165", PORT = "3718", U = `http://127.0.0.1:${PORT}`;
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
// the sketch of the change: B165 lets the chip wrap inside its own box; B166 gives the table's small lines the table's colours
const NEW_CSS = `.st-food { display: inline; white-space: nowrap; -webkit-box-decoration-break: slice; box-decoration-break: slice; padding: 2px 7px; line-height: inherit; }
.st-food.st-long { white-space: normal; overflow-wrap: anywhere; } .st-field { line-height: 2.1; }
.readout .nt small, .readout .nt p { color: var(--ink); }
.readout .nt .nt-note, .readout .nt .nt-sub, .readout .nt small.muted { color: var(--muted); }`;
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
    await p.evaluate(([isNew, css]) => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; }" + (isNew ? css : ""); document.head.append(st); }, [isNew, NEW_CSS]);
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
  const STEPS = `JS:[...document.querySelectorAll("section.card")].find((x) => (x.querySelector("b, h2, h3")?.textContent || "").trim() === "Steps")`;
  const ESTEPS = `JS:document.querySelector(".st-food").closest("section")`;
  const LONG = `JS:document.querySelector(".st-food")`;
  try {
    for (const isNew of [false, true]) {
      const k = isNew ? "2" : "1";
      // ---- B165: the recipe page's steps, Edit recipe, the steps in the editor ----
      let p = await open(isNew);
      const EBTN = `JS:[...document.querySelectorAll("main button")].find((x) => x.textContent.trim() === "Edit recipe")`;
      console.log(await note(p, EBTN, isNew ? "No change: the steps here already wrap." : "The steps here wrap. I tap Edit recipe.", [EBTN]));
      await shot(p, `65-${k}a`, STEPS, ".board-note"); await clean(p);
      await p.getByRole("button", { name: "Edit recipe" }).click(); await sleep(1200);
      if (isNew) await p.evaluate(() => { for (const c of document.querySelectorAll(".st-food")) { const f = c.closest(".st-field"), cs = getComputedStyle(f), room = f.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        if (c.getBoundingClientRect().width > room) { c.classList.add("st-long"); c.textContent = c.textContent.replace(/^(\S+) (\S+) (\S+)/, "$1\u00a0$2\u00a0$3"); } } });
      if (!isNew) await p.evaluate(() => { const n = document.createElement("div"); n.id = "edge"; n.style.cssText = `position:absolute;left:390px;top:0;width:0;height:${document.documentElement.scrollHeight}px;border-left:3px dashed #c0392b;z-index:9`; document.body.append(n); });
      if (!isNew) console.log(await note(p, ESTEPS, "The chip <b>250 g Körniger Frischkäse Tworog 2,5% Fett</b> never wraps: it runs past the step's field and the card, to 416 px on a 390 px phone (the red line). The whole page moves sideways.", [LONG]));
      else console.log(await note(p, ESTEPS, "<b>New:</b> a chip too long for the line goes on to the next line like text, its ends open where it breaks, so it reads as one chip; the comma stays right after it. 250&nbsp;g stays with Körniger. A chip that fits moves down whole. Lines have space between them. The page stays 390 px wide.", [".st-field"]));
      await shot(p, `65-${k}b`, ESTEPS, ".board-note", !isNew); await p.context().close();
      // ---- B166: the PD card, the numbers, Per 100 kcal ----
      p = await open(isNew);
      console.log(await note(p, ".rq-readout", isNew ? "No change. I tap the letters." : "One portion's PD. I tap the letters.", [".rq-readout .letters-row"]));
      await shot(p, `66-${k}a`, "main", ".board-note"); await clean(p);
      await p.locator(".rq-readout .letters-row").click(); await sleep(500);
      if (!isNew) console.log(await note(p, ".rq-readout", "After Total an empty space, then Per 100 kcal far down. The space is the note under the table (and the fibre line, when a food has no fibre value): white text on the white table.", [".rq-readout .nt-note", ".rq-readout .nt-fibre"]));
      else console.log(await note(p, ".rq-readout", "<b>New:</b> the note under Total reads in grey, as on the Plate; the fibre line too, when there is one. No empty space.", [".rq-readout .nt-note", ".rq-readout .nt-fibre"]));
      await shot(p, `66-${k}b`, ".rq-readout", ".board-note"); await clean(p);
      await p.locator(".rq-readout .nt-more").click(); await sleep(500);
      if (!isNew) console.log(await note(p, ".rq-readout", "Per 100 kcal opened: its four lines and the note under them are white on light blue, barely visible.", [".rq-readout .letters-lines"]));
      else console.log(await note(p, ".rq-readout", "<b>New:</b> Per 100 kcal's lines in dark text, the note under them in grey.", [".rq-readout .letters-lines"]));
      await shot(p, `66-${k}c`, ".rq-readout", ".board-note"); await p.context().close();
    }
  } catch (e) { console.log("ERR", e.message.slice(0, 400)); } finally { await b.close(); server.kill(); }
})();
