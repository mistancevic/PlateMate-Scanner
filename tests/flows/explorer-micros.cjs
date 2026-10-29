// DT158 and DT159 (0.3.2, canvas Page 2, boards Stories110 and Stories111; Coach Milan 29 October 18:22 "Then deploy to preview
// DT158 and DT159"): Explorer, Micros. By food: one portion against the day, every member against the EU reference intake on
// labels, the line at the whole day, green when covered; the members in three groups; vitamin D against EFSA too; what a label
// could say (7.5 % per 100 ml for a drink). By member: the twelve in three groups; Vitamin D and Vitamin C open their own page,
// the same sections, the EU health claims word for word, your day from EFSA by sex, the upper limit, foods against your day.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3334", U = `http://127.0.0.1:${PORT}`;
const SHOTS = process.env.SHOTS;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SHOTS ? 2 : 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-29T11:00:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
  await page.goto(U + "/"); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /^Explorer/ }).click(); await page.waitForTimeout(600);
  await page.locator(".ex-families").getByRole("radio", { name: "Micros" }).click(); await page.waitForTimeout(300);
  ok(await text(page.locator(".ex-h")) === "Not all micros are equal" && /^Micronutrients are the family\. Its members are the vitamins, fat-soluble and water-soluble, and the minerals\./.test(await text(page.locator(".ex-intro"))), "DT158: Micros, micronutrients the family");
  ok(await text(page.locator(".ex-meal")) === "Against the EU reference intakes on labels, the same for every adult." && await page.locator('[aria-label="Which meal"]').count() === 0, "DT158: against the day, no meal chips");
  const names = await page.locator(".ex-card .ex-title > b").allTextContents();
  ok(names.length === 8 && names[0] === "Spinach, raw" && names[7] === "Almonds", "DT158: eight foods, the most members first (DT162: red pepper brings vitamin A, counted the EFSA way): " + names.join(", "));
  const sp = page.getByRole("region", { name: "Spinach, raw", exact: true });
  const heads = await sp.locator(".ex-head > b").allTextContents();
  ok(heads.join("|") === "One portion|For your day|The family members|What a label could say|How to use it" && await sp.locator(".ex-head > small").count() === 5, "DT158: five sections, each with its goal: " + heads.join(" | "));
  ok(/This portion brings at least a third of the day's vitamin K, vitamin A, folate\./.test(await text(sp.locator(".ex-head > small").nth(1))), "DT158: For your day names the members it brings a third of");
  const rows = (await sp.locator(".ex-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(rows[2] === "Vitamin KK1 phylloquinone, K2 menaquinone290 µg · 386 %" && await sp.locator(".ex-row.ex-ok", { hasText: "Vitamin K" }).count() === 2, "DT158: vitamin K for almost four days, green, in For your day and among the members: " + rows[2]);
  ok((await sp.locator(".ex-group").allTextContents()).join("|") === "Vitamins, fat-soluble|Vitamins, water-soluble|Minerals" && await sp.locator(".ex-row .ex-need").count() === 15, "DT158: the twelve members in three groups, each with the line at the whole day");
  ok(/This one could say: High in vitamin A, Source of vitamin E, High in vitamin K, High in vitamin C, High in folate, Source of iron, Source of magnesium, Source of potassium\./.test(await text(sp.locator(".ex-head > small").nth(3))), "DT158: what a label could say, 15 % of the reference per 100 g");
  const salmon = page.getByRole("region", { name: "Salmon", exact: true });
  ok(/Vitamin D: the label's reference is 5 µg a day; EFSA sets 15 µg for adults\. Against EFSA, this portion brings 131 %\./.test(await text(salmon.locator(".ex-dnote"))), "DT158: salmon's vitamin D against EFSA's 15 µg too");
  const milk = page.getByRole("region", { name: "Milk, 1 %", exact: true });
  ok(await milk.locator(".ex-row", { hasText: /^Vitamin KK1 phylloquinone, K2 menaquinonenot reported$/ }).count() === 1 && /\(7\.5 % per 100 ml for a drink\)/.test(await text(milk.locator(".ex-head > small").nth(3))) && /High in calcium/.test(await text(milk.locator(".ex-head > small").nth(3))), "DT158: milk, not reported where the row has no value; a drink's rule per 100 ml");
  ok(/USDA SR Legacy, FDC 168462, spinach, raw/.test(await text(sp.locator(".ex-card-src"))) && /Regulation \(EU\) No 1169\/2011, Annex XIII, Part A/.test(await text(page.locator(".ex-sources"))), "DT158: the row on every card, the sources at the end");
  if (SHOTS) await sp.screenshot({ path: `${SHOTS}/micro-spinach.png` });
  // DT159: By member
  await page.getByRole("radiogroup", { name: "Start from" }).getByRole("radio", { name: "By member" }).click(); await page.waitForTimeout(300);
  ok(await text(page.locator(".ex-h")) === "The family members" && await page.locator(".ex-member").count() === 12 && (await page.locator("button.ex-member b").allTextContents()).map((x) => x.replace(/(retinol|D3|tocopherol|K1|ascorbic).*/, "")).join("|") === "Vitamin A|Vitamin D|Vitamin E|Vitamin K|Vitamin C", "DT159, DT162: By member, the twelve; A, D, E, K and C open a page");
  ok(await text(page.locator("button.ex-member", { hasText: "Vitamin D" })) === "Vitamin DD3 cholecalciferol, D2 ergocalciferolyour day 15 µg›" && await text(page.locator("button.ex-member", { hasText: "Vitamin C" })) === "Vitamin Cascorbic acidyour day 110 mg›", "DT159, DT162 (both names): your day on each, from EFSA, a man's for this profile");
  await page.locator("button.ex-member", { hasText: "Vitamin D" }).click(); await page.waitForTimeout(300);
  const d = page.getByRole("region", { name: "Vitamin D", exact: true });
  ok(await text(page.locator(".ex-h")) === "Vitamin DD3 cholecalciferol, D2 ergocalciferol" && (await d.locator(".ex-head > b").allTextContents()).join("|") === "What it is|What it does|How much a dayfor you|Where to find it|Combine it with|Too much", "DT159: the Vitamin D page, six sections");
  ok(/D3 \(cholecalciferol\)/.test(await text(d.locator(".ex-head > small").first())) && /Tripkovic 2012/.test(await text(d.locator(".ex-head > small").first())), "DT159: what it is, D3 and D2, and what the trials found");
  ok(await d.locator(".ex-quote").count() === 7 && /A food may say these only when it is at least a source of vitamin D\./.test(await text(d.locator(".ex-dnote").first())), "DT159: the seven EU claims, word for word");
  const dRows = (await d.locator(".ex-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  const dRange = await text(d.locator(".ex-range"));
  ok(dRange === "Your range15 to 100 µgFrom 15 µg, EFSA's adequate intake for adults, up to 100 µg, EFSA's upper limit for adults, from food and supplements together." && dRows.includes("On labelsEU reference intake, Regulation (EU) No 1169/20115 µg") && dRows.includes("Mushrooms, white, UV-exposed100 g, D226 µg · 175 %") && dRows.includes("Salmon, farmed, cooked150 g, form not reported20 µg · 131 %"), "DT159, DT160: how much a day as a range from your day to the upper limit, for you; foods against your day with the form: " + dRange);
  ok(/Not settled\. A review found vitamin D with K improved bone density \(Kuang 2020\)/.test(await text(d.locator(".ex-combine", { hasText: "Vitamin K2" }))), "DT159: K2 said as not settled");
  await page.getByRole("button", { name: "‹ The family members" }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".ex-member").count() === 12, "DT159: back to the family members");
  await page.locator("button.ex-member", { hasText: "Vitamin C" }).click(); await page.waitForTimeout(300);
  const c = page.getByRole("region", { name: "Vitamin C", exact: true });
  const cRows = (await c.locator(".ex-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  const cRange = await text(c.locator(".ex-range"));
  ok(cRange === "Your rangefrom 110 mg, no upper limitFrom 110 mg, EFSA's population reference intake for men (95 mg for women), with no upper limit: EFSA found not enough data to derive one." && cRows.includes("Red pepper, raw1 medium, 120 g154 mg · 140 %"), "DT159, DT160: Vitamin C, a man's day, no upper limit, the pepper the same row as on its card: " + cRange);
  ok(/^More claims, in short\./.test(await text(c.locator(".ex-more"))) && /Nyakundi 2026/.test(await text(c.locator(".ex-combine").first())), "DT159: the other claims in short, plant iron in the combine line");
  if (SHOTS) await c.screenshot({ path: `${SHOTS}/member-c.png` });
  // DT162 (0.3.4, board Stories114): Vitamin A, E and K pages; vitamin A the EFSA way on the cards and the pages alike
  await page.getByRole("button", { name: "‹ The family members" }).click(); await page.waitForTimeout(300);
  await page.locator("button.ex-member", { hasText: "Vitamin A" }).click(); await page.waitForTimeout(300);
  const va = page.getByRole("region", { name: "Vitamin A", exact: true });
  const aRows = (await va.locator(".ex-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(await text(page.locator(".ex-h")) === "Vitamin Aretinol; beta-carotene from plants" && await va.locator(".ex-quote").count() === 6 && await text(va.locator(".ex-range")) === "Your range750 to 3000 µgFrom 750 µg, EFSA's population reference intake for men (650 µg for women), up to 3000 µg, EFSA's upper limit for adults, for preformed vitamin A only: retinol from animal foods and supplements.", "DT162: Vitamin A, both names, six EU claims, 750 to 3000 µg");
  ok(aRows.includes("Beef liver, pan-fried100 g, retinol7761 µg · 1035 %") && await va.locator(".ex-row.ex-over", { hasText: "Beef liver" }).count() === 1 && await text(va.locator(".ex-warn")) === "Beef liver, pan-fried: one portion brings more retinol than the upper limit, 3000 µg. Once in a while, not every day." && aRows.includes("Spinach, rawA big handful, 60 g, beta-carotene563 µg · 75 %"), "DT162: liver over the upper limit, said plainly; spinach counted the EFSA way");
  await page.getByRole("button", { name: "‹ The family members" }).click(); await page.waitForTimeout(300);
  await page.locator("button.ex-member", { hasText: "Vitamin E" }).click(); await page.waitForTimeout(300);
  const ve = page.getByRole("region", { name: "Vitamin E", exact: true });
  ok(await ve.locator(".ex-quote").count() === 1 && /^Your range13 to 300 mg/.test(await text(ve.locator(".ex-range"))) && (await ve.locator(".ex-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).includes("AlmondsA handful, 30 g7.7 mg · 59 %") && /regeneration of the reduced form of vitamin E/.test(await text(ve.locator(".ex-combine").nth(1))), "DT162: Vitamin E, one claim, 13 to 300 mg, almonds 59 %, vitamin C renews it");
  await page.getByRole("button", { name: "‹ The family members" }).click(); await page.waitForTimeout(300);
  await page.locator("button.ex-member", { hasText: "Vitamin K" }).click(); await page.waitForTimeout(300);
  const vk = page.getByRole("region", { name: "Vitamin K", exact: true });
  const kRows = (await vk.locator(".ex-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(await vk.locator(".ex-quote").count() === 2 && /^Your rangefrom 70 µg, no upper limit/.test(await text(vk.locator(".ex-range"))) && kRows.includes("Spinach, rawA big handful, 60 g290 µg · 414 %") && kRows.some((r) => /^Cheddar30 g, K1; also 2\.6 µg K2 \(MK-4\), not counted in EFSA's value0\.7 µg · 1 %$/.test(r)), "DT162: Vitamin K, two claims, no upper limit; K2 named where USDA has it");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
