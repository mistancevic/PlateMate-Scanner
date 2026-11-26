// Board B164 (Coach Milan 26 November 2026, 10:32 to 10:33: Now, draw). Recipes, idle: each group shows two recipes and a line
// for the rest. In main the line is a small text link; it acts (it sets Made by), so it becomes the outlined button (D9),
// 44 px (D10), with the same space as between the recipes (D15). Before: main, 0.3.197 (BEFORE_ROOT, this repo, built). New:
// one scratch build of main with the change (/home/claude/work/b164, not committed). Members' names are invented.
const path = require("node:path"), fs = require("node:fs"), { spawn } = require("node:child_process");
const NEW_ROOT = process.env.BOARD_ROOT || "/home/claude/work/b164", OLD_ROOT = process.env.BEFORE_ROOT || path.resolve(__dirname, "../..");
const { chromium } = require(NEW_ROOT + "/node_modules/playwright");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs164"; fs.mkdirSync(R, { recursive: true });
const seed = JSON.parse(fs.readFileSync(path.join(OLD_ROOT, "tests/flows/seed.json"), "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, extra = {}) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: `2026-11-2${id.slice(1)}T10:00:00Z`, ...extra }; };
seed.items = []; seed.feedback = [];
seed.meals = [meal("m1", "Protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4, { kitchen: "Balkan" }), meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Milk/, 50]], 1),
  meal("m3", "Chicken and rice", [[/chicken/i, 800], [/^Rice/, 1200]], 8, { kitchen: "Balkan" }), meal("m4", "Quark with apple", [[/^Quark/, 250], [/^Apple/, 150]], 1), meal("m5", "Banana porridge", [[/^Oats/, 60], [/^Milk/, 200], [/^Banana/, 100]], 1)];
const it = (name, grams, calories, protein, fats, carbs) => ({ id: name.slice(0, 6) + grams, grams, food: { name, brand: "", calories, protein, fats, carbs, fiber: 0, readyToEat: true } });
const SR = (id, title, name, items, at) => ({ id, title, name, kitchen: null, items, steps: ["Mix."], sharedAt: at, updatedAt: at, made: 1, mine: false, cover: null, coverKind: "drawn" });
const SHARED = [SR("s1", "Grilled chicken bowl", "Sam", [it("Chicken breast, raw", 600, 120, 22.5, 2.6, 0), it("Rice, cooked", 400, 130, 2.7, 0.3, 28)], "2026-11-23T18:00:00Z"),
  SR("s2", "Tuna salad", "", [it("Tuna in olive oil", 160, 190, 25, 10, 0), it("Greek yoghurt", 200, 59, 10, 0.4, 3.6)], "2026-11-22T19:30:00Z"),
  SR("s3", "Overnight oats with skyr", "Ana", [it("Oats", 60, 372, 13.5, 7, 58.7), it("Skyr, natural", 200, 63, 11, 0.2, 4)], "2026-11-21T12:00:00Z"),
  SR("s4", "Lentil soup", "", [it("Red lentils, raw", 200, 350, 24, 1.5, 50), it("Carrot", 200, 41, 0.9, 0.2, 10)], "2026-11-20T12:00:00Z")];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5;white-space:normal`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const serve = async (root, port) => { const s = spawn(process.execPath, ["dist/server.cjs"], { cwd: root, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await sleep(500); } } return s; };
(async () => {
  const b = await chromium.launch();
  const open = async (port) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-26T10:40:00+01:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require(path.join(OLD_ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/members**", (r) => r.request().method() === "GET" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ owner: false, recipes: SHARED }) }) : r.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
    await p.goto(`http://127.0.0.1:${port}/my-recipes`); await sleep(1800);
    await p.evaluate(() => { const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav, nav { position: static !important; } .bottom-nav, .chat-fab { display: none !important; }"; document.head.append(st); });
    return p;
  };
  const note = (p, sel, html, marks = []) => p.evaluate(([sel, html, marks, MARK, NOTE]) => { const q = (s) => (s.startsWith("JS:") ? [eval(s.slice(3))].flat().filter(Boolean) : [...document.querySelectorAll(s)]);
    for (const m of marks) q(m).forEach((e) => { e.dataset.bm = "1"; e.style.cssText += ";" + MARK; });
    const t = q(sel)[0]; if (!t) return "missing " + sel; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement("afterend", n); return "ok"; }, [sel, html, marks, MARK, NOTE]);
  const shot = async (p, name, from, to) => { await p.mouse.move(2, 2); await sleep(400);
    const r = await p.evaluate(([from, to]) => { const q = (s) => (s.startsWith("JS:") ? eval(s.slice(3)) : document.querySelector(s)); const a = q(from).getBoundingClientRect(), e = to ? q(to)?.getBoundingClientRect() : null; const notes = [...document.querySelectorAll(".board-note")].map((n) => n.getBoundingClientRect().bottom);
      return { y: a.top + scrollY - 12, h: Math.max(e ? e.bottom : a.bottom, ...notes) - a.top + 26 }; }, [from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name, Math.round(r.h)); };
  // the space and the size of the line, measured
  const measure = (p) => p.evaluate(() => { const m = document.querySelector(".rc-more"), g = m.closest(".rc-group"), tiles = [...g.querySelectorAll(".recipe-tile")]; const last = tiles[tiles.length - 1].getBoundingClientRect(), r = m.getBoundingClientRect(), two = tiles.length > 1 ? Math.round(tiles[1].getBoundingClientRect().top - tiles[0].getBoundingClientRect().bottom) : null;
    return { h: Math.round(r.height), w: Math.round(r.width), above: Math.round(r.top - last.bottom), between: two }; });
  const MORE = "JS:[...document.querySelectorAll('.rc-more')]";
  for (const [row, root, port] of [["1", OLD_ROOT, "3733"], ["2", NEW_ROOT, "3734"]]) {
    const isNew = row === "2"; let s;
    try {
      s = await serve(root, port); const p = await open(port);
      const m = await measure(p); console.log(row, JSON.stringify(m));
      const first = "JS:document.querySelector('.rc-more')";
      console.log(await note(p, first, isNew
        ? `<b>New:</b> <b>Show all 5 of mine</b>, the outlined button (D9), the whole row, ${m.h} px high (D10), ${m.above} px under the last recipe, the same as between two recipes, ${m.between} px (D15). It does what the line did: Made by switches to me and the list opens. I tap it.`
        : `Under two of my recipes: <b>3 more of mine ›</b>, a small text link, ${m.h} px high, ${m.above} px under the last recipe (${m.between} px between two recipes). It acts: Made by switches to me. Text links only navigate (D9); a button is 44 px or more (D10). I tap it.`, [MORE]));
      const tt = await p.evaluate(() => { const t = document.querySelector(".rc-group-title"); return { size: getComputedStyle(t).fontSize, weight: getComputedStyle(t).fontWeight }; });
      console.log(await note(p, "JS:document.querySelector('.rc-group-title')", isNew
        ? `<b>New:</b> the group's title is a section heading, ${tt.size} and bold, as a card's heading (--fs-section): Made by me · 5.`
        : `The group's title, <b>Made by me · 5</b>, is in small label type, ${tt.size}: easy to miss.`, ["JS:[...document.querySelectorAll('.rc-group-title')]"]));
      await shot(p, `64-${row}a`, ".rc-group", "JS:[...document.querySelectorAll('.rc-group')].pop()");
      await p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove()));
      await p.locator(".rc-more").first().click(); await sleep(800);
      console.log(await note(p, "JS:[...document.querySelectorAll('.recipe-tile')].pop()", isNew ? "<b>No change:</b> Made by: me, all 5 of my recipes." : "Made by: me, all 5 of my recipes.", ["JS:document.querySelector('.rb-count') || document.querySelector('.rb')"]));
      await shot(p, `64-${row}b`, ".rb", "JS:[...document.querySelectorAll('.recipe-tile')].pop()");
      await p.context().close();
    } catch (e) { console.log("ERR", e.message.slice(0, 300)); } finally { s?.kill(); }
  }
  await b.close();
})();
