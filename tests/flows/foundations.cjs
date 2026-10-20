// JOURNEY INVARIANT (Milan, 20 October 2026, 07:30 to 08:21, board DS3): the foundations. The app's font is Nunito, served
// from chefmealan.com, never from Google. Every colour on the app's screens is one of the 20 named colours (or black for the
// camera), every text size one of 8 (84, 24, 18, 16, 15, 13, 12.5, 11.5), every weight one of 4 (400, 600, 700, 900).
// Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(from ? { from } : {}) }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4);
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1, "coach");
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8);
seed.items = []; seed.meals = [crepes, sarma, pudding];
const one = (m) => { const w = m.items.reduce((s, i) => s + i.grams, 0), r = m.portion / w; const items = m.items.map((i) => ({ ...i, grams: Math.round(i.grams * r) })); return { ...m, items, portion: items.reduce((s, i) => s + i.grams, 0) }; };
seed.feedback = [{ id: "f1", meal: one(crepes), status: "eaten", recipeId: "m1", taste: "", notes: "", createdAt: "2026-10-19T06:10:00.000Z" }];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const planned = (m, source) => { const w = m.items.reduce((s, i) => s + i.grams, 0), r = Math.min(1, m.portion / w); const k = m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0) * r, p = m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0) * r; return { title: m.title, kcal: Math.round(k), protein: Math.round(p), source, mealId: m.id, items: m.items, portion: m.portion }; };
let PLAN = { "2026-10-19": { breakfast: planned(crepes, "mine"), lunch: planned(sarma, "mine"), dinner: planned(pudding, "coach") }, "2026-10-20": { breakfast: planned(crepes, "mine") } };
const U = "http://127.0.0.1:3243";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3243", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (at, plan = PLAN) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date(at));
    await page.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-12T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z" }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      localStorage.setItem("chefmealan-planned", JSON.stringify(plan));
      localStorage.setItem("seeded", "1"); }, [seed, plan]);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipes: [] }) }));
    await page.goto(U + "/"); await page.waitForTimeout(1500);
    await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(700);
    return page;
  };
  const TOKENS = ["#eef3fc", "#ffffff", "#dae6fb", "#f6f8fc", "#d1dcf0", "#172742", "#5b6b8a", "#123a7a", "#2e7be8", "#1f5fc7", "#13916a", "#e3f4ea", "#155c34", "#f6b94a", "#fff4e0", "#8a5a00", "#f0705c", "#fdecea", "#a33a2b", "#35cf9e", "#000000"];
  const SIZES = [84, 24, 18, 16, 15, 13, 12.5, 11.5], WEIGHTS = ["400", "600", "700", "900"];
  const audit = (page, screen) => page.evaluate(([screen, TOKENS, SIZES, WEIGHTS]) => {
    const hex = (c) => { const m = c.match(/rgba?\(([^)]*)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); if (p.length > 3 && p[3] === 0) return null; return "#" + p.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, "0")).join(""); };
    const bad = { colour: new Map(), size: new Map(), weight: new Map() };
    const note = (m, k, e) => { if (!m.has(k)) m.set(k, (e.className && typeof e.className === "string" ? e.className.split(" ")[0] : e.tagName) + ": " + (e.textContent || "").trim().slice(0, 24)); };
    for (const e of document.querySelectorAll("#root *")) {
      if (e.closest("svg, nav .sr-only, .sr-only")) continue;
      const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
      const c = getComputedStyle(e); if (c.visibility === "hidden" || c.display === "none") continue;
      const props = ["backgroundColor", "color"]; if (parseFloat(c.borderTopWidth) > 0) props.push("borderTopColor"); if (parseFloat(c.borderBottomWidth) > 0) props.push("borderBottomColor"); if (parseFloat(c.borderLeftWidth) > 0) props.push("borderLeftColor");
      for (const p of props) { if (p === "color" && ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue; const h = hex(c[p]); if (h && !TOKENS.includes(h)) note(bad.colour, `${p} ${h}`, e); }
      if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
        const fs = parseFloat(c.fontSize); if (!SIZES.includes(fs)) note(bad.size, fs + "px", e);
        if (!WEIGHTS.includes(c.fontWeight)) note(bad.weight, c.fontWeight, e);
      }
    }
    const f = (m) => [...m.entries()].map(([k, v]) => `${k} (${v})`);
    return { screen, colour: f(bad.colour), size: f(bad.size), weight: f(bad.weight) };
  }, [screen, TOKENS, SIZES, WEIGHTS]);
  try {
    const fontReq = [];
    const page = await open("2026-10-19T11:00:00Z");
    page.on("request", (r) => /font|woff/.test(r.url()) && fontReq.push(r.url()));
    await page.reload(); await page.waitForTimeout(1500);
    await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(700);
    await page.evaluate(() => document.fonts.ready);
    const faces = await page.evaluate(() => [...document.fonts].filter((f) => f.family.replace(/"/g, "") === "Nunito" && f.status === "loaded").map((f) => f.weight));
    ok(fontReq.length > 0 && fontReq.every((u) => u.startsWith(U)) && !fontReq.some((u) => /google/.test(u)), "the font comes from the app's own address, never Google: " + fontReq.length + " files");
    ok(["400", "700", "900"].every((w) => faces.includes(w)), "Nunito is loaded: " + [...new Set(faces)].join(", "));
    const results = [];
    results.push(await audit(page, "Today"));
    for (const [tab, name] of [["Plan", "Plan"], ["Plate", "Plate"], ["Recipes", "Recipes"]]) { await page.locator("nav button").filter({ hasText: tab }).click(); await page.waitForTimeout(800); results.push(await audit(page, name)); }
    await page.locator(".recipe-tile, .recipe-card").filter({ hasText: "Sarma" }).first().click(); await page.waitForTimeout(900);
    results.push(await audit(page, "the recipe page"));
    await page.getByRole("button", { name: "Menu" }).click(); await page.waitForTimeout(500);
    await page.locator("button").filter({ hasText: /^Me/ }).first().click(); await page.waitForTimeout(900);
    results.push(await audit(page, "Me"));
    for (const r of results) {
      ok(r.colour.length === 0, `${r.screen}: every colour is a named one${r.colour.length ? ": " + r.colour.join("; ") : ""}`);
      ok(r.size.length === 0, `${r.screen}: every text size is one of 8${r.size.length ? ": " + r.size.join("; ") : ""}`);
      ok(r.weight.length === 0, `${r.screen}: every weight is 400, 600, 700 or 900${r.weight.length ? ": " + r.weight.join("; ") : ""}`);
    }
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "ran to the end: " + e.message.split("\n")[0]); }
  finally { await b.close(); server.kill(); }
  console.log(fails.length ? `${fails.length} failed` : "all passed");
  process.exit(fails.length ? 1 : 0);
})();
