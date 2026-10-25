// JOURNEY (0.2.105, board Stories72, DT126; Milan 25 October 13:48 to 14:26): the recipes bar on Members and Mine. One
// search over the title, the foods (in any of the pilot's languages) and the cook; Kitchen and Member as drop-downs with
// counts; chips that stack; a sort; the line that says what is shown of what. A recipe shared without a name is found by
// the search and counted under Without a name; the cook sees it under You, "2, one without your name".
const { chromium } = require("playwright");
const path = require("node:path"); const S = { MAIN: path.resolve(__dirname, "../..") };
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(S.MAIN + "/tests/flows/seed.json", "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, extra = {}) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: `2026-10-2${id.slice(1)}T10:00:00Z`, ...extra }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4, { steps: ["Blend.", "Fry thin."], kitchen: "Balkan" });
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1, { members: { id: "x1", kitchen: null, named: false, sent: "" } });
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8, { steps: ["Roll.", "Simmer two hours."], kitchen: "Balkan" });
const quark = meal("m4", "Quark with apple", [[/^Quark/, 250], [/^Apple/, 150]], 1);
seed.items = []; seed.meals = [crepes, sarma, pudding, quark]; seed.feedback = [];
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

  // Members: the search
  let page = await open(SHARED);
  await page.getByRole("tab", { name: "Members" }).click(); await page.waitForTimeout(900);
  ok(await page.locator(".mb-chips").count() === 0 && await page.locator(".rb").count() === 1, "DT126: the two chip rows are gone; the bar is on top of Members");
  ok((await titles(page)).length === 5 && /5 of 5 recipes/.test(await count(page)), "DT126: all five, and the line says 5 of 5");
  await page.getByLabel("Search recipes").fill("tuna"); await page.waitForTimeout(400);
  ok((await titles(page)).join() === "Tuna salata" && /1 of 5 recipes/.test(await count(page)), "DT126: tuna finds Tuna salata by its food, in Slovenian: " + (await titles(page)).join());
  ok(/shared by a member/.test(await page.locator(".recipe-tile").first().textContent()), "DT126: shared without a name, it says shared by a member");
  await page.getByLabel("Search recipes").fill("darinka"); await page.waitForTimeout(400);
  ok((await titles(page)).join() === "Sarma", "DT126: the cook's name finds her recipe");
  await page.getByLabel("Clear the search").click(); await page.waitForTimeout(300);
  // the Member drop-down and the unnamed
  await page.getByRole("button", { name: /^Member/ }).click(); await page.waitForTimeout(200);
  ok((await lines(page)).join(",") === "All members5,Darinka1,Davorka1,Marko1,Without a name2", "DT126: Member: all, the cooks with counts, Without a name · 2: " + (await lines(page)).join(","));
  await page.locator(".rb-line").filter({ hasText: "Without a name" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).sort().join() === "Overnight oats with skyr,Tuna salata" && /Member: without a name/.test(await count(page)), "DT126: Without a name shows the two unnamed");
  // chips stack; the count line names them
  await page.getByRole("button", { name: /^Member: without a name/ }).click(); await page.locator(".rb-line").filter({ hasText: "All members" }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Fits my day" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).length === 4 && !(await titles(page)).includes("Sarma") && /4 of 5 recipes · Fits my day/.test(await count(page)), "DT126: Fits my day drops the sarma, PD 5.9 under your 6.5: " + (await titles(page)).join());
  await page.getByRole("button", { name: "No cooking" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).sort().join() === "Overnight oats with skyr,Tuna salata" && /2 of 5 recipes · Fits my day · No cooking/.test(await count(page)), "DT126: No cooking stacks on it: the two with no pot, and the line names both: " + await count(page));
  await page.getByRole("button", { name: "Clear all" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).length === 5, "DT126: Clear all brings every recipe back");
  // the sort
  await page.getByRole("button", { name: "Highest PD" }).click(); await page.waitForTimeout(300);
  const byPd = await titles(page);
  ok(byPd[0] === "Protein first" && byPd[1] === "Tuna salata" && byPd[4] === "Sarma", "DT126: Highest PD: Protein first, Tuna salata, ... Sarma last: " + byPd.join(" | "));
  await page.getByRole("button", { name: "Most made" }).click(); await page.waitForTimeout(300);
  ok((await titles(page))[0] === "Overnight oats with skyr", "DT126: Most made puts the oats, made 4 times, first");
  await page.getByRole("button", { name: "Kitchen" }).click(); await page.waitForTimeout(200);
  ok((await lines(page)).join(",") === "All kitchens5,Asian1,Balkan1,Mediterranean1", "DT126: Kitchen: one line per kitchen with its count: " + (await lines(page)).join(","));
  await page.locator(".rb-line").filter({ hasText: "Balkan" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).join() === "Sarma" && /Kitchen: Balkan/.test(await count(page)) && /Kitchen: Balkan/.test(await page.getByRole("button", { name: /^Kitchen/ }).textContent()), "DT126: the pick shows in the chip and in the line");
  await page.close();

  // as the cook sees it: his unnamed recipe counts under You
  const MINE = SHARED.map((r) => (r.id === "s1" || r.id === "s2" ? { ...r, mine: true } : r));
  page = await open(MINE);
  await page.getByRole("tab", { name: "Members" }).click(); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^Member/ }).click(); await page.waitForTimeout(200);
  ok((await lines(page))[1] === "You2, one without your name", "DT126: You · 2, one without your name: " + (await lines(page))[1]);
  await page.locator(".rb-line").filter({ hasText: "You" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).sort().join() === "Protein first,Tuna salata" && /shared by you, without your name/.test(await page.locator(".recipe-tile").filter({ hasText: "Tuna salata" }).textContent()), "DT126: both of his, and the unnamed one says shared by you, without your name");
  await page.close();

  // Mine: the same bar, Shared in place of Member
  page = await open(SHARED);
  ok(await page.locator(".rb").count() === 1 && await page.getByRole("button", { name: /^Shared/ }).count() === 1 && await page.getByRole("button", { name: /^Member/ }).count() === 0, "DT126: Mine has the bar, with Shared in place of Member");
  ok(/4 of 4 recipes/.test(await count(page)), "DT126: Mine: 4 of 4");
  await page.getByLabel("Search recipes").fill("quark"); await page.waitForTimeout(400);
  ok((await titles(page)).sort().join() === "Chocolate quark pudding,Quark with apple" && /2 of 4 recipes/.test(await count(page)), "DT126: quark finds the two quark recipes: " + (await titles(page)).join());
  await page.getByLabel("Clear the search").click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /^Kitchen/ }).click(); await page.locator(".rb-line").filter({ hasText: "Balkan" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).sort().join() === "DaaM good protein crêpes,Sarma", "DT126: Kitchen: Balkan on Mine: the crêpes and the sarma");
  await page.getByRole("button", { name: /^Kitchen: Balkan/ }).click(); await page.locator(".rb-line").filter({ hasText: "All kitchens" }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /^Shared/ }).click(); await page.locator(".rb-line").filter({ hasText: "With members" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).join() === "Chocolate quark pudding" && /Shared with members/.test(await count(page)), "DT126: Shared: with members keeps the one shared");
  await page.getByRole("button", { name: "With my foods" }).click(); await page.waitForTimeout(300);
  ok((await titles(page)).length === 1 && /With my foods/.test(await count(page)), "DT126: With my foods on Mine: every food of the pudding is in your list");
  ok(await page.getByRole("button", { name: "For your day" }).count() === 0, "DT126: For your day, the Members rank, is not a sort on Mine");
  await page.close();

  ok(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await b.close(); server.kill();
  if (fails.length) { console.log(`${fails.length} FAILED`); process.exit(1); } else console.log("all ok");
})();
