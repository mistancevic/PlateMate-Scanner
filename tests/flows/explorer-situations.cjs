// 0.3.29: The gut, The liver, The brain (DT185 to DT187): all eight families have a page.
// 0.3.28: Muscle and Bone (DT183, DT184), read at the month.
// 0.3.27: Hormones' other four members, Hunger hormones, Cortisol, Testosterone, Oestrogen, each with Your case at its horizon.
// 0.3.26 (DT181 v2, DT183 to DT186): The body's first pages, Glucose and insulin, Glycogen, The fat store, and the situation
// Fat burning. DT180 to DT187 (0.3.25, boards Stories129 to Stories136; Coach Milan 31 October 13:12 "Let's code Explorer"): three parts, one
// search bar, The body's map, the Situations list, and the first situation page, A bad night's sleep, with Your case in five parts.
// (The head of this file follows explorer.cjs.) Earlier: DT151 Explorer, Not
// all proteins are equal, in the Menu below Foods. Each food is one portion against one meal: the meal's protein from the day
// (120 g a day, three meals: 40 g a lunch), Closes N %, muscle building and repair (about 10 g of essential amino acids, 2.5 g
// of them leucine), the family of nine in grams with leucine in bold and its lowest marked only when it is close, PDCAAS and
// DIAAS with their sources, How to use it, the source of the numbers; Worthy Numbers at the end, counted as Explorer.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = [];
// this week's record: dinners later each day, a chocolate at 22:30 twice, coffee at 16:30 once
const eaten = (date, time, title, which, foods) => ({ id: date + time, status: "eaten", createdAt: `${date}T${time}:00`, which: which || "", taste: "", notes: "", meal: { id: "m" + date + time, title, items: (foods && foods.length ? foods : [title]).map((n) => ({ ...seed.foods[0], id: n, name: n })).map((f) => ({ id: f.id, grams: 100, locked: false, food: f })), portion: 100, savedAt: "" } });
seed.feedback = [eaten("2026-10-30", "20:00", "Chicken rice bowl", "dinner"), eaten("2026-10-31", "20:30", "Chicken rice bowl", "dinner"), eaten("2026-11-01", "21:40", "Chicken rice bowl", "dinner"), eaten("2026-10-31", "22:30", "Chocolate"), eaten("2026-11-01", "22:30", "Chocolate"), eaten("2026-11-01", "16:30", "Coffee", "", ["Coffee, black"])];
const PORT = "3339", U = `http://127.0.0.1:${PORT}`;
const SHOTS = process.env.SHOTS;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SHOTS ? 2 : 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-11-02T08:10:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, wake: "early", bed: "mid" }, plan: [{ work: true, kind: "strength", intensity: "hard", at: "17:30" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: false, kind: "rest" }, { work: false, kind: "rest" }] }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
  await page.goto(U + "/"); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(800);
  const parts = page.getByRole("radiogroup", { name: "Which part" });
  ok(await parts.count() === 1 && (await parts.locator(".choice").allTextContents()).join(",") === "Nutrients,The body,Situations", "three parts above the families");
  ok((await parts.getByRole("radio", { name: "Nutrients" }).getAttribute("aria-checked")) === "true" && await page.locator(".ex-families").count() === 1 && await text(page.locator(".ex-h")) === "Not all proteins are equal", "Nutrients first, as before");
  const hs = await page.locator(".ex-parts .choice, .ex-search-field").evaluateAll((xs) => xs.map((x) => Math.round(x.getBoundingClientRect().height)));
  ok(hs.every((h) => h >= 44), "the bar and the chips 44 px or more: " + hs.join(","));
  // the search bar
  const field = page.getByLabel("Search Explorer");
  await field.fill("leuc"); await page.waitForTimeout(300);
  ok((await page.locator(".ex-hit b").first().textContent()) === "Leucine", "search: leuc finds Leucine first");
  await field.fill("coffee"); await page.waitForTimeout(300);
  const hits = await page.locator(".ex-hit b").allTextContents();
  ok(hits.includes("Coffee after 14:00"), "search: coffee finds the sleep page's line: " + hits.join(" | "));
  await page.locator(".ex-hit").filter({ hasText: "A bad night's sleep: " }).first().click(); await page.waitForTimeout(500);
  ok(await text(page.locator(".ex-h")) === "A bad night's sleep" && (await parts.getByRole("radio", { name: "Situations" }).getAttribute("aria-checked")) === "true", "a hit opens its page, and the part follows");
  // The body: the map
  await parts.getByRole("radio", { name: "The body" }).click(); await page.waitForTimeout(400);
  const fams = await page.locator(".ex-map .menu-row b").allTextContents();
  ok(fams.join(",") === "Muscle,The fat store,Glycogen,Bone,The gut,The liver,Hormones,The brain", "The body: the map of eight families: " + fams.join(","));
  await page.locator(".ex-map .menu-row").filter({ hasText: "The gut" }).click(); await page.waitForTimeout(300);
  ok(await text(page.locator(".ex-h")) === "The gut" && /starts in the mouth/.test(await text(page.locator(".explorer"))), "a family opens its page (0.3.29: every family has one)");
  await page.getByRole("button", { name: "‹ The body" }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".ex-map").count() === 1, "back to the map");
  // Situations: the list and the page
  await parts.getByRole("radio", { name: "Situations" }).click(); await page.waitForTimeout(400);
  const sits = await page.locator(".ex-map .menu-row b").allTextContents();
  ok(sits[0] === "A bad night's sleep" && sits.length === 6, "Situations: the list, a bad night's sleep first: " + sits.join(","));
  await page.locator(".ex-map .menu-row").first().click(); await page.waitForTimeout(600);
  const pg = await text(page.locator(".explorer"));
  ok(/What it does to the day/.test(pg) && /about 385 kcal/.test(pg) && /Al Khatib et al\. 2017/.test(pg), "theory first: what it does, with its paper");
  ok(/What causes it/.test(pg) && /Coffee after 14:00/.test(pg) && /Drake et al\. 2013/.test(pg) && /never no carbs at night/.test(pg), "what causes it, and the mixed evidence on carbs at night said");
  ok(/When it helps, when it hurts/.test(pg) && await page.locator(".ex-verdict").count() === 4, "when it helps, when it hurts: four rows");
  if (process.env.SHOT) { await page.screenshot({ path: process.env.SHOT + "-sleep.png", fullPage: true }); }
  ok(/Your case, today/.test(pg) && /Bed 22:00 to midnight, up before 6:00/.test(pg) && /Dinner eaten at 20:00, 20:30, 21:40/.test(pg) && /after 21:30 on 2 evenings/.test(pg) && /Coffee after 14:00 on 1 day/.test(pg), "your case reads the settings and this week's record");
  ok(/Trend against trajectory/.test(pg) && /about 50 minutes later each day/.test(pg) && /dinner back at 20:00/.test(pg), "the trend carried on against what the goal needs, and the one change");
  ok(/never a condition|Never a condition/.test(pg) && /see your doctor/.test(pg), "the wellness line");
  const taps = await page.locator(".ex-tap").evaluateAll((xs) => xs.map((x) => Math.round(x.getBoundingClientRect().height)));
  ok(taps.length === 3 && taps.every((h) => h >= 44), "three taps, 44 px or more: " + taps.join(","));
  const labels = await page.locator(".ex-tap b").allTextContents();
  ok(/more protein and fibre/.test(labels[0]) && /snack slot in the afternoon/.test(labels[1]) && /Today's training easy, or a walk/.test(labels[2]), "the taps: " + labels.join(" | "));
  // the training tap: today, this date only
  await page.locator(".ex-tap").nth(2).click(); await page.waitForTimeout(500);
  const personal = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal") || "{}"));
  ok(personal.dated?.["2026-11-02"]?.intensity === "easy" && personal.plan[0].intensity === "hard", "training easy today only; the week stays hard");
  // the chat starts with this page's questions
  const chips = await page.locator(".ex-chipq .choice").allTextContents();
  ok(chips.join("|") === "Why am I hungrier today?|What do I eat tonight?|Should I train today?", "three chips on the page");
  await page.locator(".ex-chipq .choice").first().click(); await page.waitForTimeout(800);
  const chat = await text(page.locator("body"));
  ok(/Why am I hungrier today\?/.test(chat), "a chip asks Chef Mealan the question");
  // 0.3.26: The body's first pages: Hormones lists its members, Glucose and insulin opens with Your case
  await page.goto(U + "/"); await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(800);
  await parts.getByRole("radio", { name: "The body" }).click(); await page.waitForTimeout(400);
  const states = await page.locator(".ex-map .menu-row .ex-state").allTextContents();
  ok(states.join(",") === "›,›,›,›,›,›,›,›", "the map: all eight families have pages: " + states.join(","));
  // 0.3.29: The gut, The liver, The brain
  for (const [name, need, caseTitle, caseNeed] of [["The gut", /more than 30 different plants/, /Your case: this week/, /different plants on the plates|No plates ticked/], ["The liver", /fat burning fell 73 %/, /Your case: today/, /A drink on|No drink on the record/], ["The brain", /10 runners after two hours/, /Your case: this week/, /Ticks on Today/]]) {
    await page.locator(".ex-map .menu-row").filter({ hasText: name }).first().click(); await page.waitForTimeout(500);
    const hp = await text(page.locator(".explorer"));
    ok(await text(page.locator(".ex-h")) === name && need.test(hp) && caseTitle.test(hp) && caseNeed.test(hp) && /your doctor|a doctor or a therapist/.test(hp), `${name}: the page, its paper's number, the case, the wellness line`);
    if (name === "The brain") { ok(!/depression|anxiety|ADHD/i.test(hp), "The brain names no condition"); if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT + "-brain.png", fullPage: true }); }
    const hh = await page.locator(".ex-tap").evaluateAll((xs) => xs.map((x) => Math.round(x.getBoundingClientRect().height)));
    ok(hh.length >= 1 && hh.every((h) => h >= 44), `${name}: taps 44 px or more: ` + hh.join(","));
    await page.getByRole("button", { name: "‹ The body" }).click(); await page.waitForTimeout(300);
  }
  // 0.3.28: Muscle and Bone
  await page.locator(".ex-map .menu-row").filter({ hasText: "Muscle" }).first().click(); await page.waitForTimeout(500);
  let mp = await text(page.locator(".explorer"));
  ok(await text(page.locator(".ex-h")) === "Muscle" && /0\.4 g of protein per kg/.test(mp) && /Schoenfeld and Aragon 2018/.test(mp) && /8 % smaller, 23 % weaker/.test(mp), "Muscle: the page with its papers");
  ok(/Your case: this month/.test(mp) && /about 34 g a meal/.test(mp) && /Strength 1 day a week/.test(mp) && /Keep the strength day/.test(mp), "Muscle: your case reads the weight, the training week and the plates");
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT + "-muscle.png", fullPage: true });
  await page.getByRole("button", { name: "‹ The body" }).click(); await page.waitForTimeout(300);
  await page.locator(".ex-map .menu-row").filter({ hasText: "Bone" }).first().click(); await page.waitForTimeout(500);
  mp = await text(page.locator(".explorer"));
  ok(await text(page.locator(".ex-h")) === "Bone" && /2\.9 %/.test(mp) && /LIFTMOR/.test(mp) && /Calcium 950 mg a day/.test(mp) && /Vitamin D in the dark months/.test(mp), "Bone: the page, EFSA's day for calcium, the dark months' tap");
  await page.locator(".ex-tap").filter({ hasText: "Vitamin D in the dark months" }).click(); await page.waitForTimeout(500);
  ok((await parts.getByRole("radio", { name: "Nutrients" }).getAttribute("aria-checked")) === "true" && /Micros/.test(await text(page.locator(".explorer"))), "the tap opens Micros under Nutrients");
  await parts.getByRole("radio", { name: "The body" }).click(); await page.waitForTimeout(400);
  await page.locator(".ex-map .menu-row").filter({ hasText: "Hormones" }).click(); await page.waitForTimeout(400);
  const members = await page.locator(".ex-map .menu-row b").allTextContents();
  ok(await text(page.locator(".ex-h")) === "Hormones" && members.length === 5 && /Glucose and insulin/.test(members[0]) && members.some((m) => /Testosterone/.test(m)) && members.some((m) => /Oestrogen/.test(m)), "Hormones: five members, glucose first: " + members.join(" | "));
  // 0.3.27: every member has a page
  const mstates = await page.locator(".ex-map .menu-row .ex-state").allTextContents();
  ok(mstates.every((s) => s === "›"), "Hormones: all five members open a page: " + mstates.join(","));
  for (const [name, need, caseTitle] of [["Hunger hormones", /18 % lower and ghrelin 28 % higher/, /Your case: today/], ["Cortisol", /37 % higher/, /Your case: today/], ["Testosterone", /10 to 15 %/, /Your case: this month/], ["Oestrogen", /30 kcal per kg of lean mass/, /Your case: this month/]]) {
    await page.locator(".ex-map .menu-row").filter({ hasText: name }).first().click(); await page.waitForTimeout(500);
    const hp = await text(page.locator(".explorer"));
    ok(await text(page.locator(".ex-h")) === name && need.test(hp) && caseTitle.test(hp) && /When it helps, when it hurts/.test(hp) && /your doctor/.test(hp), `${name}: the page, its paper's number, the case at its horizon, the wellness line`);
    if (name === "Hunger hormones") ok(/after 21:30 on 2 of six evenings/.test(hp), "Hunger: the case reads this week's late snacks");
    if (name === "Cortisol") ok(/Coffee after 14:00 on 1 of six days/.test(hp) && /Coffee before 14:00 only/.test(hp), "Cortisol: the case reads this week's coffee, and the tap");
    if (name === "Testosterone") { ok(/Strength 1 day a week/.test(hp) && /Keep the strength day/.test(hp), "Testosterone: the case reads the training week"); if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT + "-testosterone.png", fullPage: true }); }
    const hh = await page.locator(".ex-tap").evaluateAll((xs) => xs.map((x) => Math.round(x.getBoundingClientRect().height)));
    ok(hh.length >= 1 && hh.every((h) => h >= 44), `${name}: taps 44 px or more: ` + hh.join(","));
    await page.getByRole("button", { name: "‹ Hormones" }).click(); await page.waitForTimeout(300);
  }
  await page.locator(".ex-map .menu-row").first().click(); await page.waitForTimeout(600);
  let bp = await text(page.locator(".explorer"));
  ok(/Glucose and insulin/.test(await text(page.locator(".ex-h"))) && /When it helps, when it hurts/.test(bp) && /Source:/.test(bp), "Glucose and insulin: the page with its sources");
  ok(/Your case: the next meal/.test(bp) && /3 meals a day/.test(bp) && /Your carbs today/.test(bp), "your case reads the next meal from the clock and the plan");
  ok(/A training day: the meal after the session/.test(bp), "today's training was made easy above: the meal after the session is where carbs land");
  if (process.env.SHOT) { await page.screenshot({ path: process.env.SHOT + "-glucose.png", fullPage: true }); }
  const bt = await page.locator(".ex-tap").evaluateAll((xs) => xs.map((x) => Math.round(x.getBoundingClientRect().height)));
  ok(bt.length >= 1 && bt.every((h) => h >= 44), "the taps 44 px or more: " + bt.join(","));
  await page.getByRole("button", { name: "‹ Hormones" }).click(); await page.waitForTimeout(300);
  ok(await text(page.locator(".ex-h")) === "Hormones", "back to the family");
  await page.getByRole("button", { name: "‹ The body" }).click(); await page.waitForTimeout(300);
  // Glycogen and The fat store open straight from the map
  await page.locator(".ex-map .menu-row").filter({ hasText: "Glycogen" }).first().click(); await page.waitForTimeout(500);
  bp = await text(page.locator(".explorer"));
  ok(/Only what was used gets refilled/.test(bp) && /Your case: today/.test(bp) && /Muscle glycogen will be used/.test(bp), "Glycogen: only what was used gets refilled; today is a training day");
  await page.getByRole("button", { name: "‹ The body" }).click(); await page.waitForTimeout(300);
  await page.locator(".ex-map .menu-row").filter({ hasText: "The fat store" }).click(); await page.waitForTimeout(500);
  bp = await text(page.locator(".explorer"));
  ok(/The fat store/.test(await text(page.locator(".ex-h"))) && /Your case: this week/.test(bp) && /days by the plan/.test(bp), "The fat store: your case reads the week by the plan");
  if (process.env.SHOT) { await page.screenshot({ path: process.env.SHOT + "-fat.png", fullPage: true }); }
  // the situation Fat burning, and its links back into The body
  await parts.getByRole("radio", { name: "Situations" }).click(); await page.waitForTimeout(400);
  await page.locator(".ex-map .menu-row").filter({ hasText: "Fat burning" }).click(); await page.waitForTimeout(600);
  bp = await text(page.locator(".explorer"));
  ok(/Fat burning: what is true when/.test(await text(page.locator(".ex-h"))) && /What is true during a session/.test(bp) && /What is true over the day/.test(bp) && /Your case: this week/.test(bp), "Fat burning: the session, the day, your case");
  await page.locator(".menu-row").filter({ hasText: "The body: Glycogen" }).click(); await page.waitForTimeout(500);
  ok(await text(page.locator(".ex-h")) === "Glycogen" && (await parts.getByRole("radio", { name: "The body" }).getAttribute("aria-checked")) === "true", "a situation page opens a body page, and the part follows");
  // search reaches a body line
  await field.fill("insulin"); await page.waitForTimeout(300);
  const bh = await page.locator(".ex-hit b").allTextContents();
  ok(bh.length > 0 && (await page.locator(".ex-hit-part").first().textContent()) === "The body", "search: insulin finds The body: " + bh.slice(0, 3).join(" | "));
  await page.locator(".ex-hit").first().click(); await page.waitForTimeout(500);
  ok(/Glucose and insulin/.test(await text(page.locator(".ex-h"))), "the hit opens Glucose and insulin");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} failed` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
