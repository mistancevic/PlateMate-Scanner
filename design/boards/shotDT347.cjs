// Board DT347 (Coach Milan 23 November 2026, 19:03; 26 November 10:43: sort as chips, Newest first and the default, the tension of
// so many chips; 11:26: draw). The Recipes bar at rest: three chips, Made by, Filters, the sort; each opens its choices under the
// row as chips. Before: main, 0.3.198 (BEFORE_ROOT, this repo, built). New: a scratch build of main with the change
// (/home/claude/work/b347, not committed). Members' names are invented.
const path = require("node:path"), fs = require("node:fs"), { spawn } = require("node:child_process");
const NEW_ROOT = process.env.BOARD_ROOT || "/home/claude/work/b347", OLD_ROOT = process.env.BEFORE_ROOT || path.resolve(__dirname, "../..");
const { chromium } = require(NEW_ROOT + "/node_modules/playwright");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs347"; fs.mkdirSync(R, { recursive: true });
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
  // what the bar shows at rest: its buttons and chips, and its height
  const count = (p) => p.evaluate(() => { const rb = document.querySelector(".rb"); const els = [...rb.querySelectorAll("button")].filter((b) => b.offsetParent && !b.closest(".clear-field") && !/clear/i.test(b.getAttribute("aria-label") || "")); return { n: els.length, h: Math.round(rb.getBoundingClientRect().height), chip: Math.round(rb.querySelector(".choice")?.getBoundingClientRect().height || 0) }; });
  const RB = ".rb";
  for (const [row, root, port] of [["1", OLD_ROOT, "3735"], ["2", NEW_ROOT, "3736"]]) {
    const isNew = row === "2"; let s;
    try {
      s = await serve(root, port); const p = await open(port);
      const c = await count(p); console.log(row, JSON.stringify(c));
      console.log(await note(p, RB, isNew
        ? `<b>New:</b> at rest, under the search, three chips: <b>Made by ▾</b>, <b>Filters ▾</b>, <b>Newest ▾</b> (the sort, showing its choice). ${c.n} things to tap, the bar ${c.h} px high. Chips are ${c.chip} px (D10), round (D16). <b>Newest</b> is the default sort. I tap Filters.`
        : `At rest the bar shows ${c.n} things to tap: Made by, Kitchen, Moment, Fits my day, No cooking, With my foods, then Sort with six words in a row. The bar is ${c.h} px high, its chips ${c.chip} px. The sort is text, its default For your day. I tap Kitchen.`, [RB]));
      await shot(p, `47-${row}a`, RB, RB); await p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove()));
      if (isNew) { await p.locator(".rb-chips").first().getByRole("button", { name: /^Filters/ }).click(); await sleep(500);
        console.log(await note(p, "#rb-filters", "<b>New:</b> Filters opens under the row: Kitchen ▾, Moment ▾ and the chips Fits my day, No cooking, With my foods. White until chosen, blue with a check when chosen (D6). With two set, the chip says <b>Filters · 2</b>. I tap Newest ▾.", ["#rb-filters"])); }
      else { await p.getByRole("button", { name: /^Kitchen/ }).first().click(); await sleep(500);
        console.log(await note(p, "#rb-kitchen", "Kitchen opens its list under the chips; the chips and the sort stay on screen.", ["#rb-kitchen"])); }
      await shot(p, `47-${row}b`, RB, RB); await p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove()));
      if (isNew) { await p.locator(".rb-sort-chip").click(); await sleep(500);
        console.log(await note(p, "#rb-sort", "<b>New:</b> the sort opens as chips, Newest first: Newest, For your day, Most made, Highest PD, Quickest, A to Z. One is chosen; a tap picks and closes it.", ["#rb-sort"])); }
      else { await p.getByRole("button", { name: /^Kitchen/ }).first().click(); await sleep(300);
        console.log(await note(p, ".rb-sort", "The sort: six words as text links, For your day underlined as chosen. A choice of one is a chip (D3).", [".rb-sort"])); }
      await shot(p, `47-${row}c`, RB, RB);
      if (isNew) { await p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove())); await p.locator("#rb-sort").getByRole("button", { name: "Newest" }).click(); await sleep(300);
        await p.locator(".rb-chips").first().getByRole("button", { name: /^Filters/ }).click(); await sleep(300);
        await p.locator("#rb-filters").getByRole("button", { name: "Fits my day" }).click(); await sleep(300); await p.locator("#rb-filters").getByRole("button", { name: "No cooking" }).click(); await sleep(300);
        await p.locator(".rb-chips").first().getByRole("button", { name: /^Filters/ }).click(); await sleep(500);
        console.log(await note(p, RB, "<b>New:</b> with Fits my day and No cooking chosen and Filters closed, the chip says <b>Filters · 2</b>, blue; the line under says what is shown, with Clear all.", [".rb-chips .rb-drop.on"]));
        await shot(p, `47-${row}d`, RB, RB); }
      await p.context().close();
    } catch (e) { console.log("ERR", e.message.slice(0, 300)); } finally { s?.kill(); }
  }
  await b.close();
})();
