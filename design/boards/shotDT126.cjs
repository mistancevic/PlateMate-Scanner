// Board DT126 (Milan 25 October 13:49: "we need some search bar in the recipes. Also filtering with several additional
// options. Sorting as well"; 13:48: Tester 3's Tuna salata was there all along, shared without his name, and the cook chip
// hid it). Now: 0.2.104, the Members tab with the Marko chip on. New: the same pages with the search, the filter chips, the
// sort and the honest cook chip drawn in the browser. Nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3313", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, extra = {}) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-2" + (id.length % 5) + "T10:00:00Z", ...extra }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4, { steps: ["Blend.", "Fry thin."], kitchen: "Balkan" });
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1);
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8, { steps: ["Roll.", "Simmer two hours."], kitchen: "Balkan" });
const quark = meal("m4", "Quark with apple", [[/^Quark/, 250], [/^Apple/, 150]], 1);
seed.items = []; seed.meals = [crepes, sarma, pudding, quark]; seed.feedback = [];
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
    // a: Now, Members with the Marko chip on: one recipe, the tuna salad gone
    let p = await fresh(SHARED);
    await p.getByRole("tab", { name: "Members" }).click(); await p.waitForTimeout(900);
    await p.getByRole("group", { name: "Members" }).getByRole("button", { name: "Marko" }).click(); await p.waitForTimeout(500);
    await shot(p, "r126now"); await p.close();
    // b: New, Members, the search for tuna across all members: the tuna salad, shared without a name, is found
    p = await fresh(SHARED);
    await p.getByRole("tab", { name: "Members" }).click(); await p.waitForTimeout(900);
    await draw(p, { bar: BAR("tuna", [], "Newest", "1 of 5 recipes"), hide: ["Protein first", "Sarma", "Davorka's chicken stir fry", "Overnight oats with skyr"],
      note: "One search over Members: the title, the foods in it, the cook's name. Tuna finds Tuna salata by its food, in any of the pilot's languages. It was shared without a name, so it says shared by a member. The two chip rows of today (members, kitchens) go: with ten kitchens and thirty members they are a wall. Kitchen and Member are drop-downs in the bar, one line each, with counts inside. The other chips: Moment (by the recipe's share of the day), Fits my day (PD at or above today's target), No cooking, With my foods (every food already in your list). Several at once. The allergy filter stays silent and always on. Sort: Newest, Most made, Highest PD, Quickest (fewest steps), A to Z. The line under the bar says what is shown of what." });
    await shot(p, "r126search"); await p.close();
    // c: New, Members, two filters and a sort: No cooking, Fits my day, Highest PD
    p = await fresh(SHARED);
    await p.getByRole("tab", { name: "Members" }).click(); await p.waitForTimeout(900);
    await draw(p, { bar: BAR("", ["day", "nocook"], "Highest PD", "2 of 5 recipes · No cooking · Fits my day"), hide: ["Sarma", "Davorka's chicken stir fry", "Overnight oats with skyr"],
      note: "Filters stack. No cooking keeps recipes whose steps need no pot (the culinary rules' needsCooking, the same line the day gate uses). Fits my day keeps PD at or above today's target. Highest PD puts Protein first before Tuna salata. A tap on a lit chip clears it; the search and the chips work together." });
    await shot(p, "r126filter"); await p.close();
    // d: New, Members as Marko sees it: the Member drop-down open, his own line counts the unnamed one too
    const MINE = SHARED.map((r) => (r.id === "s1" || r.id === "s2" ? { ...r, mine: true } : r));
    p = await fresh(MINE);
    await p.getByRole("tab", { name: "Members" }).click(); await p.waitForTimeout(900);
    SHEET = sheet("MEMBER", [["All members", "5", false], ["You", "2, one without your name", true], ["Darinka", "1", false], ["Davorka", "1", false], ["Without a name", "2", false]]);
    await p.evaluate(({ mark }) => {
      for (const t of document.querySelectorAll(".recipe-tile")) { const n = t.querySelector(".tile-name")?.textContent.trim(); if (n !== "Protein first" && n !== "Tuna salata") t.style.display = "none"; }
      const tuna = [...document.querySelectorAll(".recipe-tile")].find((x) => x.querySelector(".tile-name")?.textContent.trim() === "Tuna salata"); if (tuna) { const sm = tuna.querySelector(".recipe-tile-body small"); if (sm) { sm.textContent = "shared by you, without your name"; sm.style.cssText = mark + ";display:inline-block;padding:2px 6px"; } }
    }, { mark });
    await draw(p, { bar: BAR("", ["member"], "Newest", "2 of 5 recipes · Member: you"),
      note: "The Member drop-down, open, as the cook sees it. One line per member with a count, most recipes first, and You at the top. Show my name stays his choice per recipe, but his own line counts all of his: You · 2, one without your name, and the unnamed one reads shared by you, without your name, with the switch one tap away on its page. Everyone else finds that recipe under Without a name, as shared by a member. Thirty members are thirty lines in a sheet, not thirty chips. Kitchen opens the same way, with the recipe count per kitchen." });
    SHEET = "";
    await shot(p, "r126cook"); await p.close();
    // e: New, Mine with the same bar
    p = await fresh(SHARED);
    await draw(p, { bar: BAR("", ["kitchen"], "Most made", "2 of 4 recipes · Kitchen: Balkan"), hide: ["Chocolate quark pudding", "Quark with apple"],
      note: "The same bar on Mine, the same drop-downs, chips and sorts, so one habit serves both tabs. Member reads Shared: with members, with Coach Milan, not shared here. Coach's list on Clients gets the search only, for now." });
    await shot(p, "r126mine"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
