// Board DT126b (Milan 25 October 15:00 to 15:02: "the search is universal and relates to any tab"; "tabs are also part of the
// filter selection"). Now: 0.2.105, a bar per tab. New: one bar above the tabs, From as a field of the one filter set, a search
// folds the tabs into one list grouped by source. Drawn in the browser; nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3315", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, extra = {}) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-2" + (id.length % 5) + "T10:00:00Z", ...extra }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4, { steps: ["Blend.", "Fry thin."], kitchen: "Balkan" });
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1);
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8, { steps: ["Roll.", "Simmer two hours."], kitchen: "Balkan" });
const quark = meal("m4", "Quark with apple", [[/^Quark/, 250], [/^Apple/, 150]], 1);
const coachQ = meal("m5", "Quark bowl, berries", [[/^Quark/, 300], [/^Whey/, 20], [/^Apple/, 100]], 1, { from: "coach" });
seed.items = []; seed.meals = [crepes, sarma, pudding, quark, coachQ]; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const it = (name, grams, calories, protein, fats, carbs) => ({ id: name.slice(0, 6) + grams, grams, food: { name, brand: "", calories, protein, fats, carbs, fiber: 0, readyToEat: true } });
const S = (id, title, name, kitchen, items, steps, sharedAt, made, mine = false) => ({ id, title, name, kitchen, items, steps, sharedAt, updatedAt: sharedAt, made, mine, cover: null, coverKind: "drawn" });
const SHARED = [
  S("s1", "Protein first", "Marko", "Mediterranean", [it("Chicken breast, raw", 600, 120, 22.5, 2.6, 0), it("Rice, cooked", 400, 130, 2.7, 0.3, 28), it("Greek yoghurt", 200, 59, 10, 0.4, 3.6)], ["Grill.", "Serve."], "2026-10-23T18:00:00Z", 2),
  S("s2", "Tuna salata", "", null, [it("Tunina v oljčnem olju", 160, 190, 25, 10, 0), it("Greek yoghurt", 200, 59, 10, 0.4, 3.6), it("Apple", 150, 52, 0.3, 0.2, 14), it("Red onion", 57, 40, 1.1, 0.1, 9)], ["Drain.", "Mix."], "2026-10-23T19:30:00Z", 1),
  S("s3", "Sarma", "Darinka", "Balkan", [it("Beef mince, raw", 500, 215, 18.6, 15, 0), it("Rice, raw", 200, 360, 6.6, 0.6, 79), it("Sauerkraut leaves", 600, 19, 0.9, 0.1, 4)], ["Roll.", "Simmer two hours."], "2026-10-22T12:00:00Z", 3),
  S("s4", "Davorka's chicken stir fry", "Davorka", "Asian", [it("Chicken breast, raw", 400, 120, 22.5, 2.6, 0), it("Rice, cooked", 400, 130, 2.7, 0.3, 28)], ["Fry hot and fast."], "2026-10-21T12:00:00Z", 0),
  S("s5", "Overnight oats with skyr", "", null, [it("Oats", 60, 372, 13.5, 7, 58.7), it("Skyr, natural", 200, 63, 11, 0.2, 4)], ["Mix and leave overnight."], "2026-10-20T12:00:00Z", 4),
];
const mark = `outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px`;
const NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const fresh = async (list) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-10-25T13:50:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/members", (r) => r.request().method() === "GET" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ owner: false, recipes: list }) }) : r.continue());
    await p.goto(U + "/my-recipes"); await p.waitForTimeout(1500);
    return p;
  };
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (p, name) => { await p.waitForTimeout(350); await flat(p); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot", name); };
  // the bar: search, filter chips, sort; drawn above the head card of Members or the list of Mine
  let SHEET = "";
  const sheet = (title, rows) => `<div style="margin-top:10px;border:1.5px solid #c9d5ea;border-radius:12px;padding:8px 12px;background:#f6f9ff"><b style="font-size:12px;letter-spacing:.04em;color:#5b6b8a">${title}</b>${rows.map(([t, c, lit]) => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid #e3eaf6;font-size:14px;font-weight:${lit ? 900 : 600};color:${lit ? "#1f5fc7" : "#172742"}"><span>${lit ? "✔ " : ""}${t}</span><span style="color:#5b6b8a;font-weight:600">${c}</span></div>`).join("")}</div>`;
  const BAR = (q, on, sort, n) => {
    const chip = (t, isOn) => `<span style="border:1.5px solid ${isOn ? "#2e7be8" : "#c9d5ea"};border-radius:999px;padding:5px 11px;font-size:13px;font-weight:800;color:${isOn ? "#fff" : "#1f5fc7"};background:${isOn ? "#2e7be8" : "#fff"};white-space:nowrap">${t}</span>`;
    return `<div style="${mark};padding:10px;background:#fff;margin:0 0 10px">
      <div style="display:flex;align-items:center;gap:8px;border:1.5px solid #c9d5ea;border-radius:12px;padding:9px 12px;font-size:15px;color:${q ? "#172742" : "#8a97ad"}"><span>🔍</span><span style="flex:1">${q || "Search recipes, foods in them, cooks"}</span>${q ? '<span style="color:#8a97ad">✕</span>' : ""}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${chip(on.includes("kitchen") ? "Kitchen: Balkan ▾" : "Kitchen ▾", on.includes("kitchen"))}${chip(on.includes("member") ? "Member: you ▾" : "Member ▾", on.includes("member"))}${chip("Moment ▾", on.includes("moment"))}${chip("Fits my day", on.includes("day"))}${chip("No cooking", on.includes("nocook"))}${chip("With my foods", on.includes("mine"))}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12.5px;color:#5b6b8a;flex-wrap:wrap"><b style="color:#172742">Sort</b>${["Newest", "Most made", "Highest PD", "Quickest", "A to Z"].map((t) => `<span style="font-weight:${t === sort ? 900 : 600};color:${t === sort ? "#1f5fc7" : "#5b6b8a"};text-decoration:${t === sort ? "underline" : "none"}">${t}</span>`).join('<span style="color:#c9d5ea">·</span>')}</div>
      <div style="margin-top:8px;font-size:12.5px;color:#5b6b8a">${n}</div>${SHEET || ""}</div>`;
  };
  const draw = (p, o) => p.evaluate(({ o, NOTE }) => {
    const main = document.querySelector("main"); if (!main) return;
    const head = main.querySelector(".mb-head") ?? main.querySelector(".segments")?.nextElementSibling ?? main;
    const d = document.createElement("div"); d.innerHTML = o.bar; head.parentElement.insertBefore(d.firstElementChild, head);
    if (o.hideHead) head.style.display = "none";
    for (const row of main.querySelectorAll(".mb-chips")) row.style.display = "none";
    if (o.shelf) { const s = main.querySelector(".mb-shelf"); if (s) s.textContent = o.shelf; }
    for (const [sel, text] of o.chips ?? []) { const c = [...main.querySelectorAll(".mb-chips .choice")].find((x) => x.textContent.trim() === sel); if (c) c.textContent = text; }
    for (const t of o.hide ?? []) { const tile = [...main.querySelectorAll(".recipe-tile")].find((x) => x.querySelector(".tile-name")?.textContent.trim() === t); if (tile) tile.style.display = "none"; }
    for (const [t, line] of o.lines ?? []) { const tile = [...main.querySelectorAll(".recipe-tile")].find((x) => x.querySelector(".tile-name")?.textContent.trim() === t); if (tile) { const sm = tile.querySelector(".recipe-tile-body small"); if (sm) sm.textContent = line; } }
    if (o.note) { const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = o.note; (main.querySelector(".mb-head") ?? d.firstElementChild ?? main).after?.(n) ?? main.appendChild(n); if (o.hideHead) main.querySelector(".segments").after(n); }
  }, { o, NOTE });
  try {
    const chip = (t, on) => `<span style="border:1.5px solid ${on ? "#2e7be8" : "#c9d5ea"};border-radius:999px;padding:5px 11px;font-size:13px;font-weight:800;color:${on ? "#fff" : "#1f5fc7"};background:${on ? "#2e7be8" : "#fff"};white-space:nowrap">${t}</span>`;
    const bar2 = (q, on, sort, n, sheet) => `<div style="${mark};padding:10px;background:#fff;margin:0 0 10px">
      <div style="display:flex;align-items:center;gap:8px;border:1.5px solid #c9d5ea;border-radius:12px;padding:9px 12px;font-size:15px;color:${q ? "#172742" : "#8a97ad"}"><span>🔍</span><span style="flex:1">${q || "Search all recipes, the foods in them, who made them"}</span>${q ? '<span style="color:#8a97ad">✕</span>' : ""}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${chip(on.from ? "From: " + on.from + " ▾" : "From ▾", !!on.from)}${chip(on.kitchen ? "Kitchen: " + on.kitchen + " ▾" : "Kitchen ▾", !!on.kitchen)}${chip("Moment ▾", false)}${chip("Fits my day", !!on.day)}${chip("No cooking", !!on.nocook)}${chip("With my foods", false)}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12.5px;color:#5b6b8a;flex-wrap:wrap"><b style="color:#172742">Sort</b>${["For your day", "Newest", "Most made", "Highest PD", "Quickest", "A to Z"].map((t) => `<span style="font-weight:${t === sort ? 900 : 600};color:${t === sort ? "#1f5fc7" : "#5b6b8a"};text-decoration:${t === sort ? "underline" : "none"}">${t}</span>`).join('<span style="color:#c9d5ea">·</span>')}</div>
      ${n ? `<div style="margin-top:8px;font-size:12.5px;color:#5b6b8a">${n}</div>` : ""}${sheet || ""}</div>`;
    const tabs = (counts, lit) => `<div style="display:flex;gap:6px;padding:4px;background:#e4ecfa;border-radius:999px;margin:0 0 12px;${mark}">${counts.map(([t, c]) => `<div style="flex:1;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:900;font-size:15px;color:#1f5fc7;background:${lit === t ? "#fff" : "transparent"}">${t}<span style="font-weight:700;color:${c === "0" ? "#8a97ad" : "#1f5fc7"}">${c}</span></div>`).join("")}</div>`;
    const group = (t, c) => `<div style="font-size:12px;font-weight:800;letter-spacing:.05em;color:#5b6b8a;margin:14px 0 4px">${t.toUpperCase()} · ${c}</div>`;
    const tile = (name, line, state) => `<div style="background:#fff;border-radius:16px;border:1px solid #d1dcf0;overflow:hidden;margin-bottom:10px"><div style="height:70px;background:#dfe8f8;display:flex;align-items:center;justify-content:center;color:#5b6b8a;font-size:24px">🍽</div><div style="padding:10px 14px"><b style="font-size:16px">${name}</b><br><small style="color:#5b6b8a">${line}</small>${state ? `<br><span style="display:inline-block;margin-top:6px;background:#e3f3e8;color:#1d7a46;border-radius:8px;padding:3px 8px;font-size:12.5px;font-weight:800">${state}</span>` : ""}</div></div>`;
    const sheetHtml = (title, rows) => `<div style="margin-top:10px;border:1.5px solid #c9d5ea;border-radius:12px;padding:8px 12px;background:#f6f9ff"><b style="font-size:12px;letter-spacing:.04em;color:#5b6b8a">${title}</b>${rows.map(([t, c, lit]) => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-top:1px solid #e3eaf6;font-size:14px;font-weight:${lit ? 900 : 600};color:${lit ? "#1f5fc7" : "#172742"}"><span>${lit ? "✔ " : ""}${t}</span><span style="color:#5b6b8a;font-weight:600">${c}</span></div>`).join("")}</div>`;
    // replace the whole Recipes body under the header: the bar, the tabs, the list
    const page2 = (p, html, noteText) => p.evaluate(({ html, noteText, NOTE }) => {
      const main = document.querySelector("main"); if (!main) return;
      const seg = main.querySelector(".segments"); const keep = [];
      for (const el of [...main.children]) { if (el === seg || (el.compareDocumentPosition(seg) & Node.DOCUMENT_POSITION_PRECEDING)) el.style.display = "none"; }
      const d = document.createElement("div"); d.innerHTML = html; main.insertBefore(d, seg);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = noteText; d.appendChild(n);
    }, { html, noteText, NOTE });
    // a: Now, two bars: Members' and Mine's, each with its own state
    let p = await fresh(SHARED);
    await p.getByRole("tab", { name: "Members" }).click(); await p.waitForTimeout(900);
    await p.getByLabel("Search recipes").fill("quark"); await p.waitForTimeout(400);
    await shot(p, "r126bNowM"); await p.close();
    p = await fresh(SHARED);
    await shot(p, "r126bNowMine"); await p.close();
    // b: New, idle: one bar above the tabs; the tabs as today, with their counts
    p = await fresh(SHARED);
    await page2(p, bar2("", {}, "Newest", "") + tabs([["Mine", "4"], ["Coach's", "1"], ["Members", "5"]], "Mine")
      + tile("Quark with apple", "One portion · 300 kcal · 29 g protein · PD 9.6", "") + tile("Chocolate quark pudding", "One portion · 420 kcal · 42 g protein · PD 10.0", "Shared with members") + tile("Sarma", "One portion · 454 kcal · 38 g protein · PD 8.4 · makes 8", "") + tile("DaaM good protein crêpes", "One portion · 320 kcal · 28 g protein · PD 8.7 · makes 4", ""),
      "One bar for Recipes, above the tabs. One filter set for the whole tab: the search, From, Kitchen, Moment, the three chips, the sort. Nothing typed and nothing lit: the tabs browse as today, Mine open, and each tab carries its count. A tab is a shortcut for From: Mine, Coach's, Members. The bar keeps its state when you switch tabs.");
    await shot(p, "r126bIdle"); await p.close();
    // c: New, typing folds the tabs into one list grouped by source
    p = await fresh(SHARED);
    await page2(p, bar2("quark", {}, "Newest", "3 of 10 recipes") + tabs([["Mine", "2"], ["Coach's", "1"], ["Members", "0"]], null)
      + group("Mine", "2") + tile("Quark with apple", "One portion · 300 kcal · 29 g protein · PD 9.6", "") + tile("Chocolate quark pudding", "One portion · 420 kcal · 42 g protein · PD 10.0", "Shared with members")
      + group("Coach's", "1") + tile("Quark bowl, berries", "From Coach Milan · one portion · 380 kcal · 44 g protein · PD 11.6", "")
      + group("Members", "0") + `<small style="color:#5b6b8a">Nothing from members for quark.</small>`,
      "Quark typed: the tabs fold into counts, none lit, and the list is one, grouped by source, Mine first, then Coach's, then Members, each group with its count. A row keeps the line of its source (one portion on Mine, your portion for the meal ahead on Members). The line under the bar says 3 of 10. Clear the field and the tabs come back as they were.");
    await shot(p, "r126bSearch"); await p.close();
    // d: New, the From drop-down: the tabs as lines, then the people
    p = await fresh(SHARED);
    await page2(p, bar2("", { from: null }, "Newest", "", sheetHtml("FROM", [["All", "10", true], ["Mine", "4", false], ["Coach Milan", "1", false], ["Members, all", "5", false], ["Marko", "1", false], ["Darinka", "1", false], ["Davorka", "1", false], ["Without a name", "2", false]])) + tabs([["Mine", "4"], ["Coach's", "1"], ["Members", "5"]], null),
      "From, open. The three tabs are its first lines, then each member with a count, then Without a name. One pick narrows everything else in the bar to that source; the matching tab lights. Tapping a lit tab clears From. On Mine a recipe shared with members is still Mine: From says where it came from, Shared (in the row's state) says where it went.");
    await shot(p, "r126bFrom"); await p.close();
    // e: New, a chip with no search: all sources, grouped; then a tab narrows it
    p = await fresh(SHARED);
    await page2(p, bar2("", { nocook: true, day: true }, "Highest PD", "4 of 10 recipes · Fits my day · No cooking") + tabs([["Mine", "2"], ["Coach's", "1"], ["Members", "1"]], null)
      + group("Mine", "2") + tile("Chocolate quark pudding", "One portion · 420 kcal · 42 g protein · PD 10.0", "Shared with members") + tile("Quark with apple", "One portion · 300 kcal · 29 g protein · PD 9.6", "")
      + group("Coach's", "1") + tile("Quark bowl, berries", "From Coach Milan · one portion · 380 kcal · 44 g protein · PD 11.6", "")
      + group("Members", "1") + tile("Tuna salata", "shared by a member · made once", "Your lunch: 995 g · 916 kcal · PD 11.7"),
      "Two chips lit, nothing typed: the same fold. Every source answers the chips, grouped, with the counts in the tab row. Tap Members now and the list narrows to that group with From: Members in the chip; tap it again and the groups return. Sort works inside each group; For your day sorts Members' group the way the tab does today.");
    await shot(p, "r126bChips"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
