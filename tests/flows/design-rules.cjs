// JOURNEY INVARIANT (Milan, 20 October 2026, 07:06 to 07:30, boards DS1 and DS2): the design system's button rules.
// A: one filled, wide button per screen, the main step; every other action is outlined. B: a card's buttons share one row
// under everything else in the card, the card's full width. C: an answer is a chip, never a button. D: Today has no wide
// button; a next meal with nothing planned is a card with Pick a meal and Make it on the Plate. E: Back sits top left,
// above the step bar, and says where it goes. Never rewrite these lines to fit a change.
// Added by stories DS4 G and DS5 H (Milan 08:49 to 09:30, boards DS4 and DS5): a page's title comes first, under Back: a
// recipe's name before its photo. On /built a choice is chips, and a link inside a sentence is underlined.
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
const U = "http://127.0.0.1:3242";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3242", GEMINI_API_KEY: "" }, stdio: "ignore" });
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
  const filled = (page, scope = "main") => page.locator(scope).locator("button.pill, a.pill").evaluateAll((bs) => bs.filter((b) => { const r = b.getBoundingClientRect(); return r.width > 4 && /rgb\(46, 123, 232\)|rgb\(31, 95, 199\)/.test(getComputedStyle(b).backgroundColor); }).map((b) => b.textContent.trim()));
  const row = (loc) => loc.evaluateAll((bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width)]; }));
  try {
    // ---- B and C on Today, 13:00 ----
    const page = await open("2026-10-19T11:00:00Z");
    const card = page.locator(".next-planned").first(), cb = await card.boundingBox();
    const nb = await row(card.locator(".next-planned-acts button"));
    ok(nb.length === 2 && nb[0][1] === nb[1][1] && Math.abs(nb[0][2] - nb[1][2]) <= 2 && nb[0][0] - cb.x <= 16 && cb.x + cb.width - (nb[1][0] + nb[1][2]) <= 16, "B: I ate it and Change it share one row, the card's full width, equal widths");
    const ask = page.locator(".missed-ask").first(), ab = await ask.boundingBox(), mb = await row(ask.getByRole("button"));
    ok(mb.length === 3 && new Set(mb.map((x) => x[1])).size === 1 && mb[0][0] - ab.x <= 4 && ab.x + ab.width - (mb[2][0] + mb[2][2]) <= 4, "B: Did you have it? I ate it, Change it, Skipped it, one row, edge to edge");
    const carry = page.locator(".carry-acts button");
    ok(await carry.count() === 3 && (await carry.evaluateAll((bs) => bs.every((b) => b.classList.contains("choice") && !b.classList.contains("pill")))), "C: How did it carry you? answers are chips");
    // ---- A: the recipe page has one filled button, Make it; the Plate's food list adds are outlined ----
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
    await page.locator(".recipe-tile, .recipe-card").filter({ hasText: "Sarma" }).first().click(); await page.waitForTimeout(900);
    ok(JSON.stringify(await filled(page)) === JSON.stringify(["Make it"]), "A: the recipe page's one filled button is Make it: " + (await filled(page)).join(", "));
    ok(await page.getByRole("button", { name: "Write my own" }).evaluate((b) => b.classList.contains("pill")), "A, B: Write my own is a button next to the other way, not a link");
    const rb = await page.locator("main button").filter({ hasText: /^\s*Recipes\s*$/ }).first().boundingBox(), hero = await page.locator(".rq-hero").first().boundingBox();
    ok(rb && hero && rb.y < hero.y && rb.x < 60, "E: the recipe page's Back, Recipes, sits top left above the photo");
    const nb2 = await page.locator(".rq-name").first().boundingBox();
    ok(nb2 && rb && hero && nb2.y > rb.y && nb2.y < hero.y, "G: the recipe's name comes first, under Back, before the photo");
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(800);
    const f0 = await filled(page);
    ok(f0.length <= 1 && !f0.some((t) => /Add/.test(t)), "A: on the Plate no Add in the food list is filled: " + f0.join(", "));
    // ---- E: Back on a Plate step, top left above the step bar, and where it goes ----
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
    await page.locator(".recipe-tile, .recipe-card").filter({ hasText: "Sarma" }).first().click(); await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Make it", exact: true }).click(); await page.waitForTimeout(1200);
    for (let i = 0; i < 3 && !(await page.locator(".step-head .back-top").count()); i++) { const go = page.getByRole("button", { name: /^(Make it as it is|Keep it as it is|Lock the recipe|Fit to my target)$/ }).first(); if (await go.count()) { await go.click(); await page.waitForTimeout(1000); } }
    const bk = page.locator(".step-head .back-top").first();
    const bt = await bk.boundingBox(), sb = await page.locator(".step-head .phase-bar").first().boundingBox();
    ok(bt && sb && bt.y < sb.y && bt.x < 60 && /^Back to /.test((await bk.textContent()).trim()), "E: Back sits top left, above the step bar: " + (await bk.textContent()).trim());
    ok(await page.locator("main .back:not(.back-top)").count() === 0, "E: no Back at the bottom of the step");
    // ---- D: Today has no wide button; a next meal with nothing planned is a card ----
    const p2 = await open("2026-10-19T19:40:00Z");
    ok(await p2.locator(".next-meal .pill-wide").count() === 0, "D: in the evening Today has no wide button");
    ok(/Check tomorrow/.test(await p2.locator(".tomorrow-plan").textContent()), "D: the Tomorrow card still opens tomorrow's plan");
    const p3 = await open("2026-10-19T09:30:00Z", { "2026-10-19": { breakfast: PLAN["2026-10-19"].breakfast }, "2026-10-20": PLAN["2026-10-20"] });
    const open3 = p3.locator(".next-open");
    ok(await open3.count() === 1 && /Nothing planned yet/.test(await open3.textContent()) && await p3.locator(".next-meal .pill-wide").count() === 0, "D: lunch with nothing planned is a card, not a wide button");
    ok(JSON.stringify((await open3.getByRole("button").allTextContents()).map((t) => t.trim())) === JSON.stringify(["Pick a meal", "Make it on the Plate"]), "D: Pick a meal, Make it on the Plate");
    await open3.getByRole("button", { name: "Make it on the Plate" }).click(); await p3.waitForTimeout(900);
    ok(/What are you craving\?/.test(await p3.locator("main").textContent()), "D: Make it on the Plate opens the Plate for lunch");
    // ---- F: a food of yours with no fat or carbs: the plus, the note names it, and its name opens it in Foods ----
    const p5 = await open("2026-10-19T11:00:00Z");
    await p5.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const f = { ...s.foods[0], id: "bar1", name: "Protein bar", calories: 380, protein: 30, fats: null, carbs: null };
      s.foods.push(f); s.feedback.push({ id: "fbar", meal: { id: "mbar", title: "Protein bar", items: [{ id: "i1", food: f, grams: 60, locked: true }], portion: 60, savedAt: "2026-10-19T08:00:00Z" }, status: "eaten", taste: "", notes: "", createdAt: "2026-10-19T08:30:00.000Z" });
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
    await p5.reload(); await p5.waitForTimeout(1500); await p5.locator("nav button").filter({ hasText: "Today" }).click(); await p5.waitForTimeout(700);
    const gt = (await p5.locator("section.plan").textContent()).replace(/\s+/g, " ");
    ok(/\d+\+ ?of \d+ g fat/.test(gt) && /Why the \+: Protein bar has no fat or carbs value, so fat and carbs are counted without it\. The real numbers are higher\./.test(gt) && !/at least/.test(gt), "F: 11+ of 93 g fat, and the note: Why the +: Protein bar has no fat or carbs value, so fat and carbs are counted without it.");
    await p5.locator(".macro-gap").getByRole("button", { name: "Protein bar" }).click(); await p5.waitForTimeout(900);
    ok(/Protein bar/.test(await p5.locator("main").textContent()) && await p5.locator(".macro-gap").count() === 0, "F: its name opens it in Foods");
    // ---- H: /built: a choice is chips; a link in a sentence is underlined; one filled button at the books ----
    const p4 = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p4.goto(U + "/built"); await p4.waitForTimeout(1500);
    const modes = await p4.locator(".bt-modes button").evaluateAll((bs) => bs.map((x) => getComputedStyle(x).backgroundColor));
    ok(modes.length === 2 && !modes.some((c) => /rgb\(46, 123, 232\)/.test(c)), "H: The parts or Follow a craving: two chips, neither filled");
    ok(await p4.locator(".bt-sub a").first().evaluate((a) => getComputedStyle(a).textDecorationLine === "underline"), "H: a link inside a sentence is underlined");
    const btns = await p4.locator(".bt-btn").evaluateAll((bs) => bs.map((x) => [x.textContent.trim(), /rgb\(46, 123, 232\)/.test(getComputedStyle(x).backgroundColor)]));
    ok(JSON.stringify(btns.filter((x) => x[1]).map((x) => x[0])) === JSON.stringify(["Notify me"]), "H: Notify me is the one filled button: " + JSON.stringify(btns));
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "ran to the end: " + e.message.split("\n")[0]); }
  finally { await b.close(); server.kill(); }
  console.log(fails.length ? `${fails.length} failed` : "all passed");
  process.exit(fails.length ? 1 : 0);
})();
