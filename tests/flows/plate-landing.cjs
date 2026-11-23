// Story DT308 Release 2, the landing (0.3.155, boards Stories236 and 238; Coach Milan 17 November, Go 20:30), with DT310
// (board Stories240, Go 20:30). The Plate with foods is the one landing: On your plate; the result; Fit to my target directly
// under it, white with a blue border when the plate fits and solid blue with Chef Mealan's hat when it misses your target;
// the foods; + Add more to your plate, which opens the three tiles and the list in place, with an X; Prepare it under it.
// The old row Manual, Scan, Photo of my meal, Say what you have, + Add a food and Quick picks are gone. A dish from a recipe is
// one row with its name and weight, its foods under it. DT310: a choice is a white chip; chosen, it is light blue with a dark
// blue border and a tick. Not in this release: the meal line No meal selected, the calendar, What do you do with it?
// 0.3.157 (DT308, the meal model, and DT311; Coach Milan, Go 18 November 11:14), changed by the stories: Empty plate stands in the row above the foods, and the card's top says only On your plate (DT311). The read ends with What do you do with it?, three white choices; Ate it and the marked meal bring Did you eat it? back, whose chips this walkthrough looks at (DT308.4).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (n) => seed.foods.find((f) => f.name.startsWith(n));
seed.items = []; seed.feedback = []; seed.title = "";
seed.meals = [{ id: "m1", title: "Oat bowl with banana", items: [["Oats", 60], ["Milk", 250], ["Banana", 100]].map(([f, g], k) => ({ id: "m1" + k, food: F(f), grams: g, locked: true })), portion: 410, savedAt: "2026-10-12T10:00:00Z" }];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3536", U = `http://127.0.0.1:${PORT}`;
const PLATE = fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg"));
const READ = { dish: "Grilled chicken with rice", foods: [
  { name: "Chicken breast, grilled", grams: 180, low: 140, high: 240, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" },
  { name: "Rice, cooked", grams: 150, low: 120, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "medium" }], unsure: null };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1, permissions: ["camera"] });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3, window: { from: "07:00", to: "21:00" } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const sent = [];
  await page.route("**/api/plate-photo", async (r) => { sent.push(r.request().postDataJSON()); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }); });
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A plain lunch plate.", around: "", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
  const text = async (sel = "main") => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const toPlate = async () => { await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600); };
  const chips = async () => (await page.locator(".pa-chip").allTextContents()).map((s) => s.replace(/\s+/g, " ").trim());


  const card = page.locator(".plate-card").first();
  const mainText = async () => ((await page.locator("main").innerText()) ?? "").replace(/\s+/g, " ");
  const top = (sel) => page.locator(sel).first().evaluate((x) => x.getBoundingClientRect().top);
  const find = async (name) => { await (await require("./more.cjs")(page)).fill(name); await page.waitForTimeout(400); await page.locator(".row-food").filter({ hasText: name }).first().getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(700); };
  try {
    await page.goto(U + "/plate"); await page.waitForTimeout(1500);
    // from the list onto the landing
    await find("Skyr");
    ok((await card.locator(".card-top span").first().textContent()) === "On your plate" && !/Empty plate/.test(await card.locator(".card-top").textContent()) && /Empty plate/.test(await card.locator(".plate-acts").textContent()), "DT308.7, changed by DT311 (0.3.157): the card's top says only On your plate; Empty plate stands in the row above the foods");
    const order = [await top(".plate-card .readout"), await top(".plate-card .fit-top"), await top(".plate-card .rows .row-food, .plate-card .rows .swipe-fg"), await top(".plate-card .swipe-line"), await top(".plate-card .add-more-open"), await top(".plate-card .prepare-it")];
    ok(order.every((y, i) => i === 0 || y > order[i - 1]), "DT308.7: the order: the result, Fit to my target, the foods, the swipe line, + Add more to your plate, Prepare it: " + order.map(Math.round).join(", "));
    const fitBtn = card.locator(".fit-top");
    const cw = (await card.boundingBox()).width, fb = await fitBtn.boundingBox(), rb = await card.locator(".readout").boundingBox();
    ok((await fitBtn.textContent()).trim() === "Fit to my target" && fb.height >= 44 && Math.abs(fb.width - rb.width) < 2 && fb.y - (rb.y + rb.height) < 30 && fb.width > cw * 0.8, "DT308.7: Fit to my target stands directly under the result, as wide as it");
    ok(/fits your plan|above your plan/.test(await card.locator(".readout").textContent()) /* DT338 AC4 (0.3.179): above On plan the words say the band */ && /pill-action/.test(await fitBtn.getAttribute("class")) && !/pill-primary/.test(await fitBtn.getAttribute("class")) && await fitBtn.evaluate((x) => getComputedStyle(x).backgroundColor) === "rgb(255, 255, 255)" && await fitBtn.locator("svg").count() === 1, "DT310.3: the plate fits: Fit to my target is white with a blue border, with the hat");
    const m1 = await mainText();
    ok(await page.getByRole("button", { name: /^(Manual|Scan|Photo of my meal|Say what you have|\+ Add a food)$/ }).count() === 0 && !/Quick picks|From all your foods/.test(m1) && await page.locator(".plate-search").count() === 0, "DT308.7: gone from the plate with foods: Manual, Scan, Photo of my meal, Say what you have, + Add a food, Quick picks");
    const prep = card.locator(".prepare-it"), ab = await card.locator(".add-more-open").boundingBox(), pb = await prep.boundingBox();
    ok((await card.locator(".add-more-open").textContent()).trim() === "+ Add more to your plate" && ab.height >= 44 && (await prep.textContent()).trim() === "Prepare it ›" && pb.height >= 44 && Math.abs(pb.width - ab.width) < 2 && !/pill-primary/.test(await prep.getAttribute("class")), "DT308.7: + Add more to your plate, and Prepare it under it, both as wide as the card, neither filled");
    // + Add more to your plate opens the tiles and the list in place
    await card.locator(".add-more-open").click(); await page.waitForTimeout(400);
    const more = card.locator(".add-more");
    const xb = await more.locator(".add-more-top .icon").boundingBox();
    ok(await more.count() === 1 && (await more.locator(".add-more-top b").textContent()) === "Add more to your plate" && xb.width >= 44 && xb.height >= 44 && await more.locator(".add-more-top .icon").getAttribute("aria-label") === "Close" && await card.locator(".add-more-open").count() === 0, "DT308.7: it opens in place, with its title and an X of at least 44 px that says Close");
    const tiles = (await more.locator(".ways-three > *").allInnerTexts()).map((x) => x.trim());
    const ends = (await more.locator(".list-ends button").allInnerTexts()).map((x) => x.trim());
    ok(tiles.join(" | ") === "Recipe photo | Recipe link | Photo or scan" && (await more.locator(".ways-head").allInnerTexts()).join() === "From the list" && await more.getByLabel("Search all foods").count() === 1 && ends.join(" | ") === "See all foods | Add manually" && await more.locator(".row-food").count() === 0, "DT308.7: the same three tiles, then From the list: the search, See all foods, Add manually; no foods until you search");
    await more.getByLabel("Search all foods").fill("Rice"); await page.waitForTimeout(400);
    await more.locator(".row-food").filter({ hasText: "Rice, cooked" }).first().getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(700);
    ok((await st()).items.length === 2 && await card.locator(".add-more").count() === 1, "DT308.7: + Add on a food puts it on the plate at once; the list stays open for the next one");
    await more.locator(".add-more-top .icon").click(); await page.waitForTimeout(300);
    ok(await card.locator(".add-more").count() === 0 && await card.locator(".add-more-open").count() === 1, "DT308.7: the X closes it again");
    // a plate that misses the target: Fit is the one solid blue button, with the hat
    await page.getByRole("button", { name: /Empty plate/ }).click(); await page.getByRole("button", { name: /Tap again to empty/ }).click(); await page.waitForTimeout(500);
    await find("Nutella");
    const fit2 = page.locator(".plate-card .fit-top");
    ok(/under your/.test(await page.locator(".plate-card .readout").first().textContent()) && /pill-primary/.test(await fit2.getAttribute("class")) && await fit2.locator("svg").count() === 1 && await fit2.evaluate((x) => getComputedStyle(x).backgroundColor) === "rgb(42, 114, 217)" && await fit2.evaluate((x) => getComputedStyle(x).color) === "rgb(255, 255, 255)", "DT310.3: the plate misses your target: Fit to my target is solid blue with white words, with Chef Mealan's hat");
    // a dish from your recipes: one row with its name and weight, its foods under it
    await page.getByRole("button", { name: /Empty plate/ }).click(); await page.getByRole("button", { name: /Tap again to empty/ }).click(); await page.waitForTimeout(500);
    await page.locator("nav.bottom-nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
    await page.locator(".recipe-tile").filter({ hasText: "Oat bowl with banana" }).click(); await page.waitForTimeout(600);
    await page.getByRole("button", { name: "Change it first", exact: true }).click(); await page.waitForTimeout(900);
    const dish = page.locator(".plate-card .dish-one");
    ok(await dish.count() === 1 && (await dish.locator("b").textContent()) === "Oat bowl with banana" && /^\d+ g$/.test((await dish.locator("small").textContent()).trim()) && await page.locator(".plate-card .rows.dish-foods .swipe-fg, .plate-card .rows.dish-foods .row-food").count() >= 3, "DT308.3: a dish is one row with its name and weight; its foods stand under it: " + (await dish.textContent()));
    const db = await dish.boundingBox(), fr = await page.locator(".plate-card .rows.dish-foods").boundingBox();
    ok(fr.y >= db.y + db.height - 1 && fr.x > db.x, "DT308.3: the foods are under the dish's row, set in from it");
    ok(await page.locator(".plate-card .add-more-open").count() === 1, "DT308.7: a recipe on the plate has + Add more to your plate too");
    // DT310: a chosen chip is light blue with a dark blue border and a tick
    await page.getByRole("button", { name: /Empty plate/ }).click(); await page.getByRole("button", { name: /Tap again to empty/ }).click(); await page.waitForTimeout(500);
    await page.locator("nav.bottom-nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600);
    await page.locator(".mp-button").click(); await page.waitForTimeout(1500);
    await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(700);
    await page.locator(".cam-analyze").click(); await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(2000);
    // changed by DT308.4 (0.3.157): the read ends with What do you do with it?, three white choices; Ate it and the marked meal bring Did you eat it?
    ok(await page.locator(".read-view .plate-end .pill").count() === 3 && await page.locator(".read-view .plate-end .pill-primary").count() === 0 && await page.locator(".read-view .plate-end .pill").evaluateAll((xs) => xs.every((x) => getComputedStyle(x).backgroundColor === "rgb(255, 255, 255)")), "DT310, DT308.4: Save it, Plan it and Ate it are choices: all three white");
    await page.locator(".read-view .pe-ate").click(); await page.waitForTimeout(300);
    ok(await page.locator(".read-view .pe-ate").evaluate((x) => getComputedStyle(x).backgroundColor === "rgb(218, 230, 251)"), "DT310: the choice tapped is light blue while its calendar is open");
    await page.locator(".read-view .pcal-row.on").click(); await page.waitForTimeout(500);
    const chipsEat = page.locator(".rv-eat .pa-opt");
    const look = (loc) => loc.evaluate((x) => { const c = getComputedStyle(x), b = getComputedStyle(x, "::before"); return { bg: c.backgroundColor, border: c.borderTopColor, tick: b.content }; });
    const before = await look(chipsEat.first());
    ok(await chipsEat.count() === 3 && before.bg === "rgb(255, 255, 255)" && !/✓/.test(before.tick) && await page.locator(".rv-eat .pill-primary").count() === 0, "DT310.1: a choice is a white chip; all three look the same until you choose");
    await chipsEat.first().click(); await page.waitForTimeout(300);
    const after = await look(page.locator(".rv-eat .pa-opt.on"));
    ok(after.bg === "rgb(218, 230, 251)" && after.border === "rgb(42, 114, 217)" && /✓/.test(after.tick) && await page.locator(".rv-eat .pa-opt.on").count() === 1, "DT310.1: chosen, it is light blue with a dark blue border and a tick: " + JSON.stringify(after));
    // in Serbian and German
    for (const [lang, a1, a2] of [["sr-Latn", "Na tvom tanjiru", "+ Dodaj još na svoj tanjir"], ["de", "Auf deinem Teller", "+ Mehr auf deinen Teller legen"]]) {
      await page.evaluate((l) => { localStorage.setItem("chefmealan-lang", l); const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = s.items.slice(0, 1); s.photo = undefined; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, lang);
      await page.goto(U + "/plate"); await page.waitForTimeout(1400);
      const got = [await page.locator(".plate-card .card-top span").first().textContent(), ((await page.locator(".plate-card .add-more-open").textContent().catch(() => "")) ?? "").trim()];
      ok(got[0] === a1 && got[1] === a2, `the landing in ${lang}: ${got.join("; ")}`);
    }
  } catch (e) { ok(false, "the walkthrough ran to its end: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
