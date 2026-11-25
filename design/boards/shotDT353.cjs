// Board DT353 (Coach Milan 25 November 2026, 16:25 and 16:26: draw so we discuss it): a member's recipe page in the same
// structure as my own recipe's page (DT349, 0.3.193). Before: main, 0.3.194 (BEFORE_ROOT, this repo, built). New: one scratch
// build of main with the change (/home/claude/work/b353, not committed). The members' list is served by a mock: one recipe,
// Lazy Burek, shared by a member named Sam (an invented name; testers are never named on a board).
const path = require("node:path"), fs = require("node:fs"), { spawn } = require("node:child_process");
const NEW_ROOT = process.env.BOARD_ROOT || "/home/claude/work/b353", OLD_ROOT = process.env.BEFORE_ROOT || path.resolve(__dirname, "../..");
const { chromium } = require(NEW_ROOT + "/node_modules/playwright");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs353"; fs.mkdirSync(R, { recursive: true });
const seed = JSON.parse(fs.readFileSync(path.join(OLD_ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const fd = (name, calories, protein, carbs, fats, fiber) => ({ name, brand: "", calories, protein, carbs, fats, fiber, basis: "100g", source: "label" });
const items = [{ id: "a", grams: 250, part: "Filling", food: fd("Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0) }, { id: "d", grams: 122, part: "Filling", food: { ...fd("Eggs", 143, 12.6, 0.7, 9.5, 0), source: "Reference table" } },
  { id: "h", grams: 150, part: "Filling", food: fd("Feta Leicht", 180, 17, 1, 12, 0) }, { id: "b", grams: 375, part: "Base", food: fd("Frischer Blätterteig", 400, 6, 36, 25, 1.5) }];
const tok = (id, n) => `[[i:${id}|${n}]]`;
const shared = { id: "s-burek", title: "Lazy Burek", items, steps: [`Mix ${tok("a", "Körniger Frischkäse Tworog 2,5% Fett")}, ${tok("d", "eggs")} and ${tok("h", "Feta Leicht")}.`, `Lay out ${tok("b", "Frischer Blätterteig")}, pour the filling in and bake at 200 °C for 25 minutes.`],
  kitchen: "Balkan", name: "Sam", cover: null, coverKind: "drawn", sharedAt: "2026-11-24T18:00:00Z", updatedAt: "2026-11-24T18:00:00Z", made: 2 };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5;white-space:normal`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const serve = async (root, port) => { const s = spawn(process.execPath, ["dist/server.cjs"], { cwd: root, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await sleep(500); } } return s; };
(async () => {
  const b = await chromium.launch();
  const open = async (port) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-25T16:30:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, meals: [], feedback: [] });
    await require(path.join(OLD_ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/members**", (r) => r.request().method() === "GET" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipes: [shared] }) }) : r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    await p.goto(`http://127.0.0.1:${port}/`); await sleep(1500);
    await p.locator("nav button").filter({ hasText: "Recipes" }).click(); await sleep(1500);
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
  const TILE = "JS:[...document.querySelectorAll('.recipe-tile')].find((t) => /Lazy Burek/.test(t.textContent))";
  const tileOpen = async (p) => { await p.locator(".recipe-tile").filter({ hasText: "Lazy Burek" }).first().click(); await sleep(900); };
  let s1, s2;
  try {
    s1 = await serve(OLD_ROOT, "3723");
    let p = await open("3723");
    console.log(await note(p, TILE, "A member's recipe in the list: its tile says my portion for the meal ahead. I tap it.", [TILE]));
    await shot(p, "53-1a", TILE, ".board-note"); await clean(p); await tileOpen(p);
    console.log(await note(p, ".mb-yours", "The page opens on <b>my portion</b> for the meal ahead: grams of the whole, then kcal, protein and PD in three tiles.", [".mb-yours", ".rp-stats"]));
    console.log(await note(p, "JS:[...document.querySelectorAll('.rq-foods > b')].pop()", "Foods for your portion, then the steps, for my portion.", []));
    console.log(await note(p, "JS:[...document.querySelectorAll('.rq button.pill')].pop()", "Make it puts my portion on the Plate; Keep in mine copies the recipe.", ["JS:[...document.querySelectorAll('.rq button.pill')]"]));
    await shot(p, "53-1b", ".rq", ".rq"); await p.context().close(); s1.kill();
    s2 = await serve(NEW_ROOT, "3724");
    p = await open("3724");
    console.log(await note(p, TILE, "<b>No change:</b> the tile still says my portion for the meal ahead: that is where I browse.", []));
    await shot(p, "53-2a", TILE, ".board-note"); await clean(p); await tileOpen(p);
    console.log(await note(p, ".rq-readout", "<b>New:</b> the page opens on the recipe as the member wrote it: the PD card is PdCard, the whole recipe. The same as my own recipe's page (DT349).", [".rq-readout"]));
    console.log(await note(p, "section.rq-foods", "<b>New:</b> Foods as written; the steps say the recipe's amounts. A shared recipe does not carry how many it makes, so there is no Servings card (open, see the board).", ["section.rq-foods"]));
    console.log(await note(p, "section.rq-actions", "<b>New:</b> What do you do with it? First a note: Sam's recipe as written, and where each way leads. Then the actions: Plan it as it is, Put it on the Plate (was Make it) to change foods, Save to My recipes (was Keep in mine) to choose the servings. Plan it has ⌄: it opens in place. No Servings card on this page: it is for deciding. I tap Plan it.", ["section.rq-actions .mb-decide", "section.rq-actions"]));
    await shot(p, "53-2b", ".rq", ".rq"); await clean(p);
    await p.locator("section.rq-actions").getByRole("button", { name: "Plan it" }).click(); await sleep(500);
    await p.locator("section.rq-actions .pcal-rows").getByText("Dinner").first().click(); await sleep(500);
    console.log(await note(p, "section.rq-actions", "<b>New:</b> Plan it stays white, with ⌃: it is open, a tap closes it. With a day and a meal, my <b>portion</b> is calculated: grams, kcal and protein for my dinner. The PD is the recipe's. The one filled button is the main step, Put it in the plan (design rules D1, D6).", ["section.rq-actions .rq-choice-line", "JS:[...document.querySelectorAll('section.rq-actions button')].find((b) => /Plan it/.test(b.textContent))"]));
    await shot(p, "53-2c", "section.rq-actions", ".board-note"); await p.context().close();
  } catch (e) { console.log("ERR", e.message.slice(0, 300)); } finally { await b.close(); s1?.kill(); s2?.kill(); }
})();
