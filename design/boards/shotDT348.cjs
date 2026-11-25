// Board DT348 (Coach Milan 23 November 2026, 23:50 to 23:59, Next; 25 November 20:18: draw). One button to add a step:
// + Step here between steps and after the last one; + Add a step goes. One editor (StepsEditor) writes the steps in Edit recipe
// and in the publish sheet. Before: main, 0.3.196 (BEFORE_ROOT, this repo, built). New: one scratch build of main with the
// change (/home/claude/work/b348, not committed).
const path = require("node:path"), fs = require("node:fs"), { spawn } = require("node:child_process");
const NEW_ROOT = process.env.BOARD_ROOT || "/home/claude/work/b348", OLD_ROOT = process.env.BEFORE_ROOT || path.resolve(__dirname, "../..");
const { chromium } = require(NEW_ROOT + "/node_modules/playwright");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs348"; fs.mkdirSync(R, { recursive: true });
const seed = JSON.parse(fs.readFileSync(path.join(OLD_ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const F = (id) => seed.foods.find((f) => f.id === id);
const it = (id, f, g) => ({ id, food: f, grams: g, locked: false });
const I = { o: it("a", F("f-oats"), 60), m: it("b", F("f-milk"), 200), b: it("c", F("f-banana"), 100) };
const tok = (x, n) => `[[i:${x.id}|${n}]]`;
const recipe = { id: "m-oats", title: "Banana porridge", items: Object.values(I), portion: 360, savedAt: "2026-11-25T12:00:00Z",
  steps: [`Bring ${tok(I.m, "milk")} to a simmer.`, `Stir in ${tok(I.o, "oats")} and cook for 5 minutes.`] };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5;white-space:normal`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const serve = async (root, port) => { const s = spawn(process.execPath, ["dist/server.cjs"], { cwd: root, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await sleep(500); } } return s; };
(async () => {
  const b = await chromium.launch();
  const open = async (port) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-25T20:30:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-coach", "1");
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, meals: [recipe], feedback: [] });
    await require(path.join(OLD_ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(`http://127.0.0.1:${port}/my-recipes/m-oats`); await sleep(1500);
    await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; }"; document.head.append(st); });
    return p;
  };
  const note = (p, sel, html, marks = []) => p.evaluate(([sel, html, marks, MARK, NOTE]) => { const q = (s) => (s.startsWith("JS:") ? [eval(s.slice(3))].flat().filter(Boolean) : [...document.querySelectorAll(s)]);
    for (const m of marks) q(m).forEach((e) => { e.dataset.bm = "1"; e.style.cssText += ";" + MARK; });
    const t = q(sel)[0]; if (!t) return "missing " + sel; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement("afterend", n); return "ok"; }, [sel, html, marks, MARK, NOTE]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[data-bm]").forEach((e) => { e.style.outline = ""; delete e.dataset.bm; }); });
  const shot = async (p, name, from, to) => { await p.mouse.move(2, 2); await sleep(400);
    const r = await p.evaluate(([from, to]) => { const q = (s) => (s.startsWith("JS:") ? eval(s.slice(3)) : document.querySelector(s)); const a = q(from).getBoundingClientRect(), e = to ? q(to)?.getBoundingClientRect() : null; const notes = [...document.querySelectorAll(".board-note")].map((n) => n.getBoundingClientRect().bottom);
      return { y: a.top + scrollY - 12, h: Math.max(e ? e.bottom : a.bottom, ...notes) - a.top + 26 }; }, [from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name, Math.round(r.h)); };
  const ED = "section.rq-steps";
  const LAST = "JS:document.querySelector('section.rq-steps .st-add, section.rq-steps .st-after')";
  const BETWEEN = "JS:[...document.querySelectorAll('section.rq-steps .st-between:not(.st-after)')]";
  const runs = [["1", OLD_ROOT, "3727"], ["2", NEW_ROOT, "3728"]];
  for (const [row, root, port] of runs) {
    const isNew = row === "2"; let s;
    try {
      s = await serve(root, port);
      const p = await open(port);
      await p.getByRole("button", { name: "Edit recipe", exact: true }).click(); await sleep(900);
      console.log(await note(p, "JS:document.querySelector('section.rq-steps .st-between:not(.st-after)')", isNew
        ? "<b>No change:</b> + Step here between two steps."
        : "Between two steps: <b>+ Step here</b>, a dashed button.", [BETWEEN]));
      console.log(await note(p, LAST, isNew
        ? "<b>New:</b> after the last step, the same button: <b>+ Step here</b>. + Add a step goes. One kind of button for one job. I tap it."
        : "After the last step: <b>+ Add a step</b>, a filled button of another kind, for the same job. I tap it.", [LAST]));
      await shot(p, `48-${row}a`, ED, ED); await clean(p);
      await p.locator(LAST.slice(3).includes("st-add") ? "section.rq-steps .st-add, section.rq-steps .st-after" : "").first().click(); await sleep(600);
      console.log(await note(p, "JS:[...document.querySelectorAll('section.rq-steps .st-row')].pop()", isNew
        ? "<b>No change:</b> step 3 opens, empty, ready to write. Below it, + Step here again."
        : "Step 3 opens, empty, ready to write. Below it, + Add a step again.", ["JS:[...document.querySelectorAll('section.rq-steps .st-row')].pop()"]));
      await shot(p, `48-${row}b`, ED, ED); await clean(p);
      // the publish sheet writes steps with the same editor
      await p.goto(`http://127.0.0.1:${port}/my-recipes/m-oats`); await sleep(1500);
      await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; }"; document.head.append(st); });
      await p.locator(".rq-pub").getByRole("button", { name: /^(Publish|Continue)$/ }).click(); await sleep(900);
      const SH = "JS:document.querySelector('.publish-sheet .st')";
      const SLAST = "JS:document.querySelector('.publish-sheet .st-add, .publish-sheet .st-after')";
      console.log(await note(p, SLAST, isNew ? "<b>New:</b> the publish sheet writes steps with the same editor, so it changes the same way: + Step here after the last step."
        : "The publish sheet writes the steps with the same editor: + Step here between, + Add a step after the last.", [SLAST, "JS:[...document.querySelectorAll('.publish-sheet .st-between:not(.st-after)')]"]));
      await p.setViewportSize({ width: 390, height: 1800 }); await sleep(400);
      await p.evaluate(() => document.querySelector(".publish-sheet .st").scrollIntoView({ block: "start" })); await sleep(400); await p.mouse.move(2, 2);
      const r = await p.evaluate(() => { const a = document.querySelector(".publish-sheet .st").closest("section, .card, div").getBoundingClientRect(); const z = [...document.querySelectorAll(".board-note")].map((n) => n.getBoundingClientRect().bottom); return { y: a.top - 12, h: Math.max(a.bottom, ...z) - a.top + 26 }; });
      await p.screenshot({ path: `${R}/48-${row}c.png`, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(`48-${row}c`, Math.round(r.h));
      await p.context().close();
    } catch (e) { console.log("ERR", e.message.slice(0, 300)); } finally { s?.kill(); }
  }
  await b.close();
})();
