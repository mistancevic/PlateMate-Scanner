// JOURNEY (0.2.105 and 0.2.106, boards Stories72 and Stories74, DT126 and DT126c; Milan 25 October 13:48 to 15:12): Recipes
// is one list under one bar, no tabs. One search over the title, the foods (in any of the pilot's languages) and the cook;
// Made by and Kitchen as drop-downs with counts; chips that stack; a sort; the line that says what is shown of what. Idle,
// the list is grouped by who made it, two rows per group and a line for the rest. A recipe shared without a name is found
// by the search and counted under A member without a name; a recipe of yours shared without your name says so on its tile.
const { chromium } = require("playwright");
const path = require("node:path"); const S = { MAIN: path.resolve(__dirname, "../..") };
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(S.MAIN + "/tests/flows/seed.json", "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, extra = {}) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: `2026-10-2${id.slice(1)}T10:00:00Z`, ...extra }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4, { steps: ["Blend.", "Fry thin."], kitchen: "Balkan" });
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1, { members: { id: "x1", kitchen: null, named: false, sent: "" } });
const coachQ = meal("m5", "Quark bowl, berries", [[/^Quark/, 300], [/^Whey/, 20], [/^Apple/, 100]], 1, { from: "coach" });
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8, { steps: ["Roll.", "Simmer two hours."], kitchen: "Balkan" });
const quark = meal("m4", "Quark with apple", [[/^Quark/, 250], [/^Apple/, 150]], 1);
seed.items = []; seed.meals = [crepes, sarma, pudding, quark, coachQ]; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const it = (name, grams, calories, protein, fats, carbs) => ({ id: name.slice(0, 6) + grams, grams, food: { name, brand: "", calories, protein, fats, carbs, fiber: 0, readyToEat: true } });
const R = (id, title, name, kitchen, items, steps, sharedAt, made, mine = false) => ({ id, title, name, kitchen, items, steps, sharedAt, updatedAt: sharedAt, made, mine, cover: null, coverKind: "drawn" });
const SHARED = [
  R("s1", "Protein first", "Marko", "Mediterranean", [it("Chicken breast, raw", 600, 120, 22.5, 2.6, 0), it("Rice, cooked", 400, 130, 2.7, 0.3, 28), it("Greek yoghurt", 200, 59, 10, 0.4, 3.6)], ["Grill.", "Serve."], "2026-10-23T18:00:00Z", 2),
  R("s2", "Tuna salata", "", null, [it("Tunina v oljčnem olju", 160, 190, 25, 10, 0), it("Greek yoghurt", 200, 59, 10, 0.4, 3.6), it("Apple", 150, 52, 0.3, 0.2, 14), it("Red onion", 57, 40, 1.1, 0.1, 9)], ["Drain.", "Mix."], "2026-10-23T19:30:00Z", 1),
  R("s3", "Sarma", "Darinka", "Balkan", [it("Beef mince, raw", 500, 215, 18.6, 15, 0), it("Rice, raw", 200, 360, 6.6, 0.6, 79), it("Sauerkraut leaves", 600, 19, 0.9, 0.1, 4)], ["Roll.", "Simmer two hours."], "2026-10-22T12:00:00Z", 3),
  R("s4", "Nina's chicken stir fry", "Nina", "Asian", [it("Chicken breast, raw", 400, 120, 22.5, 2.6, 0), it("Rice, cooked", 400, 130, 2.7, 0.3, 28)], ["Fry hot and fast."], "2026-10-21T12:00:00Z", 0),
  R("s5", "Overnight oats with skyr", "", null, [it("Oats", 60, 372, 13.5, 7, 58.7), it("Skyr, natural", 200, 63, 11, 0.2, 4)], ["Mix and leave overnight."], "2026-10-20T12:00:00Z", 4),
];
const PORT = 3268, U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: S.MAIN, env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errors = [];
  const open = async (list) => {
    const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-25T12:00:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-12T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members", (r) => r.request().method() === "GET" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ owner: false, recipes: list }) }) : r.continue());
    await page.goto(U + "/my-recipes"); await page.waitForTimeout(1200);
    return page;
  };
  const titles = (page) => page.locator(".recipe-tile .tile-name").allTextContents();
  const count = (page) => page.locator(".rb-count").textContent();
  const lines = async (page) => (await page.locator(".rb-line").allTextContents()).map((x) => x.replace(/\s+/g, " ").trim());
  // DT347 (0.3.199): the filters sit in the Filters panel, closed with Show N recipes; the sort is a chip that opens six chips
  const panel = async (page) => { if (!(await page.locator("#rb-filters").count())) { await page.locator(".rb-filters-chip").click(); await page.waitForTimeout(200); } return page.locator("#rb-filters"); };
  const closePanel = async (page) => { if (await page.locator("#rb-filters").count()) { await page.locator("#rb-filters .rb-panel-actions .pill-primary").click(); await page.waitForTimeout(300); } };
  const filt = async (page, name) => { await (await panel(page)).getByRole("button", { name, exact: true }).click(); await page.waitForTimeout(300); await closePanel(page); };
  const sortBy = async (page, name) => { await page.locator(".rb-sort-chip").click(); await page.waitForTimeout(200); await page.locator("#rb-sort").getByRole("button", { name, exact: true }).click(); await page.waitForTimeout(300); };
  const section = (page, title) => page.evaluate((title) => { const out = []; let on = false; for (const el of document.querySelectorAll("#rb-filters > *")) { if (el.classList.contains("rb-sheet-title")) { on = el.textContent.trim() === title; continue; } if (on && el.classList.contains("rb-line")) out.push(el.textContent.replace(/\s+/g, " ").trim()); } return out; }, title);

  const groupTitles = (page) => page.locator(".rc-group-title").allTextContents();
  // idle: no tabs, one bar, the groups
  let page = await open(SHARED);
  ok(await page.getByRole("tab").count() === 0 && await page.locator(".rb").count() === 1, "DT126c: no tabs; one bar on top of Recipes");
  ok((await groupTitles(page)).join(" | ") === "Made by me · 4 | Made by your coach · 1 | Made by members · 5", "DT126c: idle, three groups with counts: " + (await groupTitles(page)).join(" | "));
  ok((await titles(page)).length === 2 + 1 + 2 && /10 recipes/.test(await count(page)), "DT126c: two rows per group and a line for the rest; the line says 10 recipes");
  // changed by B164 (0.3.198): the line is a button with the whole group's count, Show all 4 of mine
  ok(await page.getByRole("button", { name: "Show all 4 of mine" }).count() === 1 && await page.getByRole("button", { name: "Show all 5 from members" }).count() === 1, "DT126c: the rest behind a button per group (B164)");
  // B164 (0.3.198, board B164, canvas Page 6; Coach Milan, Go 26 November 2026, 10:52): the button and the titles, measured
  const b164 = await page.evaluate(() => { const m = document.querySelector(".rc-more"), g = m.closest(".rc-group"), t = [...g.querySelectorAll(".recipe-tile")], r = m.getBoundingClientRect();
    const title = getComputedStyle(document.querySelector(".rc-group-title"));
    return { h: Math.round(r.height), full: Math.abs(r.width - g.getBoundingClientRect().width) < 2, outlined: m.classList.contains("pill") && !m.classList.contains("pill-primary"), above: Math.round(r.top - t[t.length - 1].getBoundingClientRect().bottom), between: Math.round(t[1].getBoundingClientRect().top - t[0].getBoundingClientRect().bottom), size: title.fontSize, weight: Number(title.fontWeight) }; });
  ok(b164.h >= 44 && b164.full && b164.outlined && b164.above === b164.between, "B164 AC1: Show all 4 of mine, the outlined button across the row, 44 px, as far under the last recipe as two recipes are apart: " + JSON.stringify(b164));
  ok(b164.size === "18px" && b164.weight >= 700, "B164 AC4: each group's title is a section heading, 18 px and bold: " + b164.size + " " + b164.weight);
  ok(/is about|Set your goal|planned in full/.test(await page.locator(".rc-lead").textContent({ timeout: 3000 }).catch(() => "")), "DT126c: the members' group says your portion for the meal ahead: " + await page.locator(".rc-lead").textContent({ timeout: 1000 }).catch(() => "(none)"));
  await page.getByLabel("Search recipes").fill("pudding"); await page.waitForTimeout(400);
  ok(/Shared with members, without your name/.test(await page.locator(".recipe-tile").filter({ hasText: "Chocolate quark pudding" }).textContent()), "DT126c: your recipe shared without your name says so on its tile");
  await page.getByLabel("Clear the search").click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Show all 5 from members" }).click(); await page.waitForTimeout(400);
  ok((await titles(page)).length === 5 && /5 of 10 recipes · Made by: members/.test(await count(page)) && /Made by: members/.test(await page.getByRole("button", { name: /^Made by/ }).textContent()), "DT126c and B164 AC2: Show all 5 from members opens Made by: members, all five");
  // the search
  await page.getByRole("button", { name: "Clear all" }).click(); await page.waitForTimeout(300);
  await page.getByLabel("Search recipes").fill("tuna"); await page.waitForTimeout(400);
  ok((await titles(page)).join() === "Tuna salata" && /1 of 10 recipes/.test(await count(page)) && (await groupTitles(page)).join() === "Made by members · 1", "DT126: tuna finds Tuna salata by its food, in Slovenian, under its group: " + (await titles(page)).join());
  ok(/shared by a member/.test(await page.locator(".recipe-tile").first().textContent()), "DT126: shared without a name, it says shared by a member");
  await page.getByLabel("Search recipes").fill("quark"); await page.waitForTimeout(400);
  ok((await groupTitles(page)).join(" | ") === "Made by me · 2 | Made by your coach · 1" && (await titles(page)).length === 3, "DT126c: quark: the hits of two groups, every one shown, the empty group gone");
  await page.getByLabel("Search recipes").fill("darinka"); await page.waitForTimeout(400);
  ok((await titles(page)).join() === "Sarma", "DT126: the cook's name finds her recipe");
  await page.getByLabel("Clear the search").click(); await page.waitForTimeout(300);
  // Made by
  await page.getByRole("button", { name: /^Made by/ }).click(); await page.waitForTimeout(200);
  ok((await lines(page)).join(",") === "All10,Me4, one shared without your name,Your coach1,All members5,Darinka1,Marko1,Nina1,A member without a name2", "DT126c: Made by: all, me, the coach, the cooks with counts, a member without a name: " + (await lines(page)).join(","));
  await page.locator(".rb-line").filter({ hasText: "A member without a name" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).sort().join() === "Overnight oats with skyr,Tuna salata" && /Made by: a member without a name/.test(await count(page)), "DT126c: A member without a name shows the two unnamed");
  await page.getByRole("button", { name: /^Made by/ }).click(); await page.locator(".rb-line").filter({ hasText: "Your coach" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).join() === "Quark bowl, berries" && /made=coach/.test(page.url()), "DT126c: Made by: your coach, and the address says made=coach");
  await page.getByRole("button", { name: "Clear all" }).click(); await page.waitForTimeout(300);
  // chips stack; the count line names them
  await filt(page, "Fits my day"); // changed by DT347: inside Filters
  ok((await titles(page)).filter((t) => t === "Sarma").length === 1 && /9 of 10 recipes · Fits my day/.test(await count(page)), "DT126: Fits my day drops Darinka's sarma, PD 5.9 under your 6.5; your own sarma stays: " + await count(page));
  await filt(page, "No cooking");
  const nc = await titles(page);
  ok(!nc.includes("Protein first") && !nc.includes("Nina's chicken stir fry") && nc.includes("Tuna salata") && /Fits my day · No cooking/.test(await count(page)), "DT126: No cooking stacks on it, and the line names both: " + await count(page));
  await page.getByRole("button", { name: "Clear all" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).length === 5 && /10 recipes/.test(await count(page)), "DT126: Clear all brings the idle list back");
  // the sort, inside the members' group
  await page.getByRole("button", { name: /^Made by/ }).click(); await page.locator(".rb-line").filter({ hasText: "Marko" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Made by: Marko/ }).click(); await page.locator(".rb-line").filter({ hasText: "All" }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Show all 5 from members" }).click(); await page.waitForTimeout(300); // B164
  await sortBy(page, "Highest PD"); // changed by DT347: the sort is a chip
  const byPd = await titles(page);
  ok(byPd[0] === "Protein first" && byPd[1] === "Tuna salata" && byPd[4] === "Sarma", "DT126: Highest PD: Protein first, Tuna salata, ... Sarma last: " + byPd.join(" | "));
  await sortBy(page, "Most made");
  ok((await titles(page))[0] === "Overnight oats with skyr", "DT126: Most made puts the oats, made 4 times, first");
  await panel(page); // changed by DT347: Kitchen is a block of the Filters panel
  ok((await section(page, "Kitchen")).join(",") === "All kitchens10,Asian1,Balkan1,Mediterranean1", "DT126: Kitchen: one line per kitchen with its count, over the rows the other filters leave: " + (await section(page, "Kitchen")).join(","));
  await page.locator("#rb-filters .rb-line").filter({ hasText: "Balkan" }).click(); await page.waitForTimeout(300); await closePanel(page);
  ok((await titles(page)).join() === "Sarma" && /Kitchen: Balkan/.test(await count(page)) && /Filters · 1/.test(await page.locator(".rb-filters-chip").textContent()), "DT126 and DT347: the pick shows in the line, and the chip says Filters · 1");
  await page.getByRole("button", { name: "Clear all" }).click(); await page.waitForTimeout(300);
  // the chips on mine: With my foods
  await filt(page, "With my foods");
  ok((await titles(page)).includes("Chocolate quark pudding") && !(await titles(page)).includes("Protein first") && /With my foods/.test(await count(page)), "DT126: With my foods keeps the recipes whose every food is in your list");
  await page.close();

  // as the cook sees it: his own shared recipes are not repeated under members
  const MINE = SHARED.map((r) => (r.id === "s1" || r.id === "s2" ? { ...r, mine: true } : r));
  page = await open(MINE);
  ok((await groupTitles(page)).join(" | ") === "Made by me · 4 | Made by your coach · 1 | Made by members · 3", "DT126c: a recipe of yours shared with members is one row, under me: " + (await groupTitles(page)).join(" | "));
  await page.close();

  // DT347 (0.3.199, board DT347, canvas Page 6; Coach Milan, Go 26 November 2026, 12:52): the bar
  { const q = await open(SHARED); const R = q.locator(".rb");
    const row = (await R.locator(".rb-chips").first().getByRole("button").allTextContents()).map((x) => x.trim());
    const hs = await R.locator(".rb-chips").first().getByRole("button").evaluateAll((bs) => bs.map((b) => Math.round(b.getBoundingClientRect().height)));
    ok(JSON.stringify(row) === JSON.stringify(["Newest ▾", "Made by: All ▾", "Filters ▾"]) && hs.every((h) => h >= 44) && !(await R.getByRole("button", { name: "Fits my day" }).count()) && !(await R.locator(".rb-sort").count()), "DT347 AC1: one row, Newest, Made by: All, Filters, 44 px; nothing else at rest: " + row.join(" | ") + " " + hs.join(","));
    const all = await q.evaluate(() => [...document.querySelectorAll(".rc-group")].map((g) => g.querySelector(".recipe-tile .tile-name")?.textContent));
    ok(all[0] === "Quark with apple", "DT347 AC2: Newest by default: my newest recipe, saved 24 October, leads Made by me: " + all.join(" | "));
    await q.locator(".rb-sort-chip").click(); await q.waitForTimeout(200);
    const sorts = (await q.locator("#rb-sort .choice").allTextContents()).map((x) => x.replace("✓", "").trim());
    ok(sorts.join(",") === "Newest,For your day,Most made,Highest PD,Quickest,A to Z" && /on/.test(await q.locator("#rb-sort .choice").first().getAttribute("class")), "DT347 AC3: six sort chips, Newest first and chosen: " + sorts.join(","));
    await q.locator("#rb-sort").getByRole("button", { name: "Highest PD", exact: true }).click(); await q.waitForTimeout(300);
    ok((await q.locator(".rb-sort-chip").textContent()).trim() === "Highest PD ▾" && !(await q.locator("#rb-sort").count()), "DT347 AC3: a tap picks Highest PD and closes the chips");
    await q.locator(".rb-filters-chip").click(); await q.waitForTimeout(300);
    const heads = (await q.locator("#rb-filters .rb-sheet-title").allTextContents()).map((x) => x.trim());
    const hstyle = await q.locator("#rb-filters .rb-sheet-title").first().evaluate((e) => getComputedStyle(e).fontSize);
    ok(heads.join(",") === "Kitchen,Meal,PD,For me" && hstyle === "18px" && /Show 10 recipes/.test(await q.locator("#rb-filters .rb-panel-actions").textContent()), "DT347 AC4: the panel: Kitchen, Meal, PD, For me as 18 px headings, Show 10 recipes: " + heads.join(","));
    ok((await section(q, "PD")).join(",").startsWith("Any PD,PD under 4,PD 4 to 6") && (await section(q, "PD")).join(",").includes("PD 8 and more"), "DT347 AC6: PD by ranges: " + (await section(q, "PD")).join(","));
    ok((await section(q, "For me")).join(",") === "Fits my day,No cooking,With my foods", "DT347 AC4: For me holds the three, as rows");
    await q.locator("#rb-filters").getByRole("button", { name: "No cooking", exact: true }).click(); await q.waitForTimeout(300);
    await q.locator("#rb-filters").getByRole("button", { name: "With my foods", exact: true }).click(); await q.waitForTimeout(300);
    const show = (await q.locator("#rb-filters .rb-panel-actions .pill-primary").textContent()).trim();
    await q.locator("#rb-filters .rb-panel-actions .pill-primary").click(); await q.waitForTimeout(300);
    ok(/^Show \d+ recipes?$/.test(show) && !(await q.locator("#rb-filters").count()) && (await q.locator(".rb-filters-chip").textContent()).trim() === "Filters · 2 ▾" && /No cooking · With my foods/.test(await count(q)), `DT347 AC5: ${show} closes the panel; the chip says Filters · 2: ` + await count(q));
    await q.locator(".rb-filters-chip").click(); await q.waitForTimeout(200);
    await q.locator("#rb-filters").getByRole("button", { name: "Clear all" }).click(); await q.waitForTimeout(200);
    await q.locator("#rb-filters .rb-line").filter({ hasText: /^PD 4 to 6/ }).click(); await q.waitForTimeout(300);
    await q.locator("#rb-filters .rb-panel-actions .pill-primary").click(); await q.waitForTimeout(300);
    ok(/PD 4 to 6/.test(await count(q)) && (await q.locator(".recipe-tile").count()) >= 1, "DT347 AC6: PD 4 to 6 filters the list and the line says so: " + await count(q));
    await q.locator(".rb-count").getByRole("button", { name: "Clear all" }).click(); await q.waitForTimeout(300);
    await q.getByRole("button", { name: /^Made by/ }).first().click(); await q.waitForTimeout(200); await q.locator("#rb-madeBy .rb-line").filter({ hasText: /^Me/ }).first().click(); await q.waitForTimeout(300);
    ok(/^Made by: me ▾$/i.test((await q.getByRole("button", { name: /^Made by/ }).first().textContent()).trim()), "DT347 AC7: Made by: me");
    await q.close(); }
  for (const [lang, sortWord] of [["sr-Latn", null], ["de", null]]) {
    const q = await open(SHARED); await q.evaluate((l) => localStorage.setItem("chefmealan-lang", l), lang); await q.reload(); await q.waitForTimeout(1500);
    const row = (await q.locator(".rb .rb-chips").first().getByRole("button").allTextContents()).map((x) => x.trim());
    await q.locator(".rb-filters-chip").click(); await q.waitForTimeout(300);
    const heads = (await q.locator("#rb-filters .rb-sheet-title").allTextContents()).map((x) => x.trim()); const show = (await q.locator("#rb-filters .rb-panel-actions .pill-primary").textContent()).trim();
    ok(row.length === 3 && !row.some((x) => /^(Newest|Filters)/.test(x)) && heads.length === 4 && !/Show/.test(show), `DT347 AC8 ${lang}: ${row.join(" | ")} / ${heads.join(", ")} / ${show}`);
    if (lang === "sr-Latn") ok(row[1] === "Od: Sve ▾", "B172 (0.3.200): Srpski Made by is neutral, Od: Sve: " + row[1]);
    await q.close();
  }
  // B164 AC5: in Srpski and German, the same button with the number
  for (const [lang, want] of [["sr-Latn", "Prikaži sve moje (4)"], ["de", "Alle 4 von mir zeigen"]]) {
    const q = await open(SHARED); await q.evaluate((l) => localStorage.setItem("chefmealan-lang", l), lang); await q.reload(); await q.waitForTimeout(1500);
    const txt = ((await q.locator(".rc-more").first().textContent()) || "").trim();
    ok(txt === want, `B164 AC5 ${lang}: ${txt}`); await q.close();
  }
  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await b.close(); server.kill();
  if (fails.length) { console.log(`${fails.length} FAILED`); process.exit(1); } else console.log("all ok");
})();
