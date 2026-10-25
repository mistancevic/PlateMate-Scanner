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
  R("s4", "Davorka's chicken stir fry", "Davorka", "Asian", [it("Chicken breast, raw", 400, 120, 22.5, 2.6, 0), it("Rice, cooked", 400, 130, 2.7, 0.3, 28)], ["Fry hot and fast."], "2026-10-21T12:00:00Z", 0),
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

  const groupTitles = (page) => page.locator(".rc-group-title").allTextContents();
  // idle: no tabs, one bar, the groups
  let page = await open(SHARED);
  ok(await page.getByRole("tab").count() === 0 && await page.locator(".rb").count() === 1, "DT126c: no tabs; one bar on top of Recipes");
  ok((await groupTitles(page)).join(" | ") === "Made by me · 4 | Made by your coach · 1 | Made by members · 5", "DT126c: idle, three groups with counts: " + (await groupTitles(page)).join(" | "));
  ok((await titles(page)).length === 2 + 1 + 2 && /10 recipes/.test(await count(page)), "DT126c: two rows per group and a line for the rest; the line says 10 recipes");
  ok(await page.getByRole("button", { name: "2 more of mine ›" }).count() === 1 && await page.getByRole("button", { name: "3 more from members ›" }).count() === 1, "DT126c: the rest behind a line per group");
  ok(/is about|Set your goal|planned in full/.test(await page.locator(".rc-lead").textContent({ timeout: 3000 }).catch(() => "")), "DT126c: the members' group says your portion for the meal ahead: " + await page.locator(".rc-lead").textContent({ timeout: 1000 }).catch(() => "(none)"));
  await page.getByLabel("Search recipes").fill("pudding"); await page.waitForTimeout(400);
  ok(/Shared with members, without your name/.test(await page.locator(".recipe-tile").filter({ hasText: "Chocolate quark pudding" }).textContent()), "DT126c: your recipe shared without your name says so on its tile");
  await page.getByLabel("Clear the search").click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "3 more from members ›" }).click(); await page.waitForTimeout(400);
  ok((await titles(page)).length === 5 && /5 of 10 recipes · Made by: members/.test(await count(page)) && /Made by: members/.test(await page.getByRole("button", { name: /^Made by/ }).textContent()), "DT126c: more from members opens Made by: members, all five");
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
  ok((await lines(page)).join(",") === "All10,Me4, one shared without your name,Your coach1,All members5,Darinka1,Davorka1,Marko1,A member without a name2", "DT126c: Made by: all, me, the coach, the cooks with counts, a member without a name: " + (await lines(page)).join(","));
  await page.locator(".rb-line").filter({ hasText: "A member without a name" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).sort().join() === "Overnight oats with skyr,Tuna salata" && /Made by: a member without a name/.test(await count(page)), "DT126c: A member without a name shows the two unnamed");
  await page.getByRole("button", { name: /^Made by/ }).click(); await page.locator(".rb-line").filter({ hasText: "Your coach" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).join() === "Quark bowl, berries" && /made=coach/.test(page.url()), "DT126c: Made by: your coach, and the address says made=coach");
  await page.getByRole("button", { name: "Clear all" }).click(); await page.waitForTimeout(300);
  // chips stack; the count line names them
  await page.getByRole("button", { name: "Fits my day" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).filter((t) => t === "Sarma").length === 1 && /9 of 10 recipes · Fits my day/.test(await count(page)), "DT126: Fits my day drops Darinka's sarma, PD 5.9 under your 6.5; your own sarma stays: " + await count(page));
  await page.getByRole("button", { name: "No cooking" }).click(); await page.waitForTimeout(300);
  const nc = await titles(page);
  ok(!nc.includes("Protein first") && !nc.includes("Davorka's chicken stir fry") && nc.includes("Tuna salata") && /Fits my day · No cooking/.test(await count(page)), "DT126: No cooking stacks on it, and the line names both: " + await count(page));
  await page.getByRole("button", { name: "Clear all" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).length === 5 && /10 recipes/.test(await count(page)), "DT126: Clear all brings the idle list back");
  // the sort, inside the members' group
  await page.getByRole("button", { name: /^Made by/ }).click(); await page.locator(".rb-line").filter({ hasText: "Marko" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Made by: Marko/ }).click(); await page.locator(".rb-line").filter({ hasText: "All" }).first().click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "3 more from members ›" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Highest PD" }).click(); await page.waitForTimeout(300);
  const byPd = await titles(page);
  ok(byPd[0] === "Protein first" && byPd[1] === "Tuna salata" && byPd[4] === "Sarma", "DT126: Highest PD: Protein first, Tuna salata, ... Sarma last: " + byPd.join(" | "));
  await page.getByRole("button", { name: "Most made" }).click(); await page.waitForTimeout(300);
  ok((await titles(page))[0] === "Overnight oats with skyr", "DT126: Most made puts the oats, made 4 times, first");
  await page.getByRole("button", { name: /^Kitchen/ }).click(); await page.waitForTimeout(200);
  ok((await lines(page)).join(",") === "All kitchens10,Asian1,Balkan1,Mediterranean1", "DT126: Kitchen: one line per kitchen with its count, over the rows the other filters leave: " + (await lines(page)).join(","));
  await page.locator(".rb-line").filter({ hasText: "Balkan" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).join() === "Sarma" && /Kitchen: Balkan/.test(await count(page)) && /Kitchen: Balkan/.test(await page.getByRole("button", { name: /^Kitchen/ }).textContent()), "DT126: the pick shows in the chip and in the line");
  await page.getByRole("button", { name: "Clear all" }).click(); await page.waitForTimeout(300);
  // the chips on mine: With my foods
  await page.getByRole("button", { name: "With my foods" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).includes("Chocolate quark pudding") && !(await titles(page)).includes("Protein first") && /With my foods/.test(await count(page)), "DT126: With my foods keeps the recipes whose every food is in your list");
  await page.close();

  // as the cook sees it: his own shared recipes are not repeated under members
  const MINE = SHARED.map((r) => (r.id === "s1" || r.id === "s2" ? { ...r, mine: true } : r));
  page = await open(MINE);
  ok((await groupTitles(page)).join(" | ") === "Made by me · 4 | Made by your coach · 1 | Made by members · 3", "DT126c: a recipe of yours shared with members is one row, under me: " + (await groupTitles(page)).join(" | "));
  await page.close();

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await b.close(); server.kill();
  if (fails.length) { console.log(`${fails.length} FAILED`); process.exit(1); } else console.log("all ok");
})();
