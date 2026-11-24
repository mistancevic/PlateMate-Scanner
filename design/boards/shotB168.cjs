// Board B168 (seen while drawing B166, 23 November 2026; Coach Milan 24 November 07:04 and 07:07: fix it, one portion).
// With DT349 (13:44 to 14:50): the header is the meal: title, photo (a placeholder picture with its buttons on it), the PD card
// for the whole meal (the Plate's card, PdCard, its numbers under it), the Nutrition table with 1 portion, all and 100 g. The
// portions to cook are chips at the top of Foods, saved; the Cook it card goes. Before: main, 0.3.192 (BEFORE_ROOT, this repo,
// built). New: one scratch build of main with it (/home/claude/work/b168, not committed). Nothing in the repo changes.
const path = require("node:path"), fs = require("node:fs"), { spawn } = require("node:child_process");
const NEW_ROOT = process.env.BOARD_ROOT || "/home/claude/work/b168", OLD_ROOT = process.env.BEFORE_ROOT || path.resolve(__dirname, "../..");
const { chromium } = require(NEW_ROOT + "/node_modules/playwright");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs168"; fs.mkdirSync(R, { recursive: true });
const seed = JSON.parse(fs.readFileSync(path.join(OLD_ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats, fiber, extra = {}) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, ...extra });
const Q = food("q", "Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0, { barcode: "4056489000001" }), P = food("p", "Frischer Blätterteig", 400, 6, 36, 25, 1.5, { barcode: "4056489000002" }),
  E = food("e", "Eggs", 143, 12.6, 0.7, 9.5, 0, { source: "Reference table", refId: "egg" }), F = food("f", "Feta Leicht", 180, 17, 1, 12, 0, { barcode: "4056489000003" });
const it = (id, f, g, part) => ({ id, food: f, grams: g, locked: false, ...(part ? { part } : {}) });
const I = { q: it("a", Q, 250, "Filling"), p: it("b", P, 375, "Base"), e: it("d", E, 122, "Filling"), f: it("h", F, 150, "Filling") };
const recipe = { id: "m-burek", title: "Lazy Burek", items: Object.values(I), makes: { n: 4, unit: "portions" }, portion: 224, savedAt: "2026-11-23T16:00:00Z", steps: ["Mix, lay out, bake at 200 °C for 25 minutes."] };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5;white-space:normal`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const serve = async (root, port) => { const s = spawn(process.execPath, ["dist/server.cjs"], { cwd: root, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await sleep(500); } } return s; };
(async () => {
  const b = await chromium.launch();
  const open = async (port, url = "/my-recipes/m-burek") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-24T08:00:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, Q, P, E, F], meals: [recipe], feedback: [] });
    await require(path.join(OLD_ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(`http://127.0.0.1:${port}${url}`); await sleep(1500);
    await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; }"; document.head.append(st); });
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => {
    const pick = (s) => (s.startsWith("JS:") ? [eval(s.slice(3))].flat().filter(Boolean) : [...document.querySelectorAll(s)]);
    for (const m of marks) pick(m).forEach((e) => (e.style.cssText += ";" + MARK));
    const t = pick(sel)[0]; if (!t) return "missing " + sel; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement(where, n); return "ok"; }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove()));
  const shot = async (p, name, from, to) => { await sleep(400);
    const r = await p.evaluate(([from, to]) => { const pick = (q) => (q.startsWith('JS:') ? eval(q.slice(3)) : document.querySelector(q)); const a = pick(from).getBoundingClientRect(), e = pick(to)?.getBoundingClientRect(); const notes = [...document.querySelectorAll(".board-note")].map((n) => n.getBoundingClientRect().bottom);
      return { y: a.top + scrollY - 12, h: Math.max(e ? e.bottom : a.bottom, ...notes) - a.top + 26 }; }, [from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name, Math.round(r.h)); };
  const ROWS = "JS:document.querySelector('.rq-readout .readout-mid small')";
  let s1, s2;
  try {
    // ---- B168.1 before, main 0.3.192 ----
    s1 = await serve(OLD_ROOT, "3719");
    let p = await open("3719");
    console.log(await note(p, ".rq-readout", "One portion: 549 kcal, 224 g, in one small line. I tap the letters.", [".rq-readout .letters-row", ROWS]));
    await shot(p, "68-1a", "main", ".board-note"); await clean(p);
    await p.locator(".rq-readout .letters-row").click(); await sleep(500);
    console.log(await note(p, ".rq-readout", "The numbers open inside the card. Under <b>One portion</b> they say Total 897 g and 2,194 kcal: the whole recipe, 4 portions. The card says 549 kcal and 224 g; the Nutrition table below says 1 portion, 224 g.", [".rq-readout .nt-total", ROWS]));
    await shot(p, "68-1b", ".rq-readout", "section.nt-card"); await clean(p);
    for (let i = 0; i < 3; i++) { await p.locator("section.rq-cook .rq-cook-row").getByRole("button").first().click(); await sleep(300); }
    console.log(await note(p, "section.rq-cook", "Cook it, three times −: it says <b>1 portions</b>, and the foods are for 1. It sits under the PD card, but the card does not follow it; it is about cooking, and looks like a button.", ["section.rq-cook .rq-cook-row"]));
    await shot(p, "68-1c", "section.rq-cook", ".board-note"); await p.context().close();
    // ---- the Plate, main: the card the recipe page takes ----
    p = await open("3719", "/plate");
    for (const n of ["Skyr", "Oats", "Banana"]) { await (await require(path.join(OLD_ROOT, "tests/flows/more.cjs"))(p)).fill(n); await sleep(400); await p.locator(".row-food").filter({ hasText: n }).first().getByRole("button", { name: /Add/ }).click(); await sleep(700); }
    const x = p.locator(".add-more-top button").first(); if (await x.count()) { await x.click(); await sleep(300); }
    await p.locator(".readout .letters-row").first().click(); await sleep(500);
    console.log(await note(p, ".plate-card .nt", "The Plate's PD card: Energy, Weight and Protein as rows, the numbers under the card. The recipe page takes this card; the Plate becomes the same component, nothing on it changes.", [".plate-card .readout"]));
    await shot(p, "68-3a", ".plate-card .readout", ".board-note"); await p.context().close();
    s1.kill();
    // ---- new, scratch build ----
    s2 = await serve(NEW_ROOT, "3720");
    p = await open("3720");
    const FOODS = "section.rq-foods", CHIPS = ".rq-portion-chips";
    console.log(await note(p, ".rq-nopic", "<b>New:</b> no photo yet is a placeholder picture of a meal, in the photo's place; its two buttons sit on it.", [".rq-nopic"]));
    console.log(await note(p, ".rq-readout", "<b>New:</b> the PD card is the whole meal, as the recipe makes it: All 4 portions, 2,194 kcal, 897 g, 93 g. The Plate's card: rows, PD's tap to the scale.", [ROWS, "JS:document.querySelector('.rq-readout .readout-top span')"]));
    console.log(await note(p, FOODS, "<b>New:</b> the portions to cook are chips at the top of Foods: 1, 2, 4 as written, 8. The grams follow; it is saved with the recipe; Start cooking cooks it. No Cook it card.", [CHIPS]));
    await shot(p, "68-2a", "main", "JS:document.querySelectorAll('.board-note')[2]"); await clean(p);
    await p.locator(".rq-readout .letters-row").click(); await sleep(500);
    console.log(await note(p, ".rq-readout + .nt", "<b>New:</b> the numbers open under the card, as on the Plate, and count the whole meal: Total 897 g and 2,194 kcal, as the card says. One portion and 100 g are in the Nutrition table.", [".rq-readout + .nt .nt-total"]));
    await shot(p, "68-2b", ".rq-readout", ".board-note"); await clean(p);
    await p.locator(".rq-readout .letters-row").click(); await sleep(300);
    await p.locator(CHIPS + " .choice").first().click(); await sleep(500);
    console.log(await note(p, FOODS, "<b>New:</b> 1 portion chosen: the foods are for 1: 63 g, 1 egg, 38 g, 94 g. The header stays the meal as the recipe makes it.", [CHIPS]));
    await shot(p, "68-2c", FOODS, ".board-note"); await p.context().close();
  } catch (e) { console.log("ERR", e.message.slice(0, 400)); } finally { await b.close(); s1?.kill(); s2?.kill(); }
})();
