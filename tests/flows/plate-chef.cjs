// Story DT308.3 and DT308.3b (0.3.154, board Stories236; Coach Milan 17 November 2026, 16:10 to 18:29, Go 18:41): Chef Mealan
// HOWTO: eatNow (DT260): this walkthrough follows How to's situation eatNow; when it fails after a screen changed, update that situation's steps in src/i18n/en.json
// through his round icon. What are you craving?, his field and Find ideas are gone from the Plate. On the empty Plate his icon
// opens his chat over the Plate: one field, Type or say what you crave or have, no choices to make first. He reads whether
// your words are a craving or the foods you have. A craving: your own recipes, Coach's and the members' for what you typed
// (From your recipes only when one of yours matches), then Chef Mealan's ideas, up to three, all as the same small cards with
// + Add. A tap on an idea's title opens it short, its foods only, with a link at the end, See the whole recipe. The link opens
// the recipe as a page over the chat: An idea from Chef Mealan, not made yet; Back to Chef Mealan at the top, Save in My
// recipes and + Add at the bottom. + Add closes the chat and the dish is on your plate; the idea is kept in My recipes then,
// or on Save in My recipes, never by itself. Foods you have: one card, Your foods, with + Add, then Chef Mealan's ideas with
// them; nothing lands before your tap. Replaces the walkthrough craving-search (R17, DT301), whose card is gone.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (n) => seed.foods.find((f) => f.name.startsWith(n));
const meal = (id, title, parts, n, unit, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(n > 1 ? { makes: { n, unit } } : {}), ...(from ? { from } : {}) }; };
seed.items = []; seed.feedback = []; seed.title = "";
seed.meals = [meal("m1", "DaaM good protein crêpes", [["Eggs", 120], ["Milk", 250], ["Oats", 60], ["Whey", 30]], 4, "crêpes"), meal("m2", "Chocolate quark pudding", [["Quark", 250], ["Whey", 25], ["Nutella", 15], ["Milk", 50]], 1, "bowl", "coach"), meal("m3", "Chocolate banana oat bowl", [["Oats", 60], ["Milk", 250], ["Banana", 100], ["Nutella", 20]], 1, "bowl")];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const sf = (f) => ({ name: f.name, brand: f.brand, calories: f.calories, protein: f.protein, fats: f.fats, carbs: f.carbs, fiber: f.fiber, readyToEat: true });
const MEMBER = { id: "r1", title: "Chocolate protein mug cake", items: [{ id: "a", grams: 40, food: sf(F("Whey")) }, { id: "b", grams: 60, food: sf(F("Eggs")) }, { id: "c", grams: 10, food: sf(F("Nutella")) }], steps: [], kitchen: null, name: "Ana", cover: null, coverKind: "photo", sharedAt: "2026-10-15T10:00:00Z", updatedAt: "2026-10-15T10:00:00Z", made: 2 };
const IDEA = { title: "Protein tiramisu", why: "Coffee-soaked biscuits and a quark cream, like the real one.", how: ["Stir the quark with the whey until smooth.", "Dip the biscuits in cold coffee and lay them in a glass.", "Spoon the cream over and dust with cocoa."], items: [{ name: "Quark, low fat (Magerquark)", grams: 250, calories: 67, protein: 12, fats: 0.2, carbs: 4 }, { name: "Leibniz Butterkeks", grams: 30, calories: 470, protein: 7.6, fats: 14, carbs: 74 }, { name: "Whey protein powder", grams: 20, calories: 370, protein: 80, fats: 5, carbs: 5 }, { name: "Cocoa powder", grams: 5, calories: 228, protein: 20, fats: 14, carbs: 58 }] };
const IDEAS = [IDEA, { ...IDEA, title: "Tiramisu cups with skyr and a long name that runs over two lines" }, { ...IDEA, title: "Coffee quark cream" }];
const SAID = { dish: "Chicken and rice", foods: [
  { name: "Chicken breast, cooked", grams: 150, low: 110, high: 200, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "low" },
  { name: "Rice, cooked", grams: 150, low: 110, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "low" }], unsure: null };
const PORT = "3535", U = `http://127.0.0.1:${PORT}`;
const SHOTS = process.env.SHOTS || "";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  let crave = [], said = [];
  const open = async (lang) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SHOTS ? 2 : 1 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-18T15:30:00"));
    await page.addInitScript(([s, l]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      if (l) localStorage.setItem("chefmealan-lang", l);
      localStorage.setItem("seeded", "1"); }, [seed, lang || ""]);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipes: [MEMBER] }) }));
    await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A plain plate.", around: "", better_as: "" }) }));
    await page.route("**/api/crave", async (r) => { crave.push(JSON.parse(r.request().postData() || "{}")); await new Promise((y) => setTimeout(y, 500)); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ideas: IDEAS }) }); });
    await page.route("**/api/plate-said", async (r) => { const q = JSON.parse(r.request().postData() || "{}"); said.push(q); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(/chicken|piletina|hähnchen/i.test(q.text) ? SAID : { dish: "", foods: [], unsure: null }) }); });
    await page.goto(U + "/"); await page.waitForTimeout(1200);
    await page.locator("nav.bottom-nav button").nth(2).click(); await page.waitForTimeout(800);
    return page;
  };
  const st = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + ".png") }); };
  const ask = async (page, words) => { await page.locator(".pc-input input").fill(words); await page.locator(".pc-input input").press("Enter"); await page.waitForTimeout(300); };
  const groups = async (page) => (await page.locator(".pc-group").allTextContents()).map((s) => s.trim());
  const cardOf = (page, title) => page.locator(".pc-card").filter({ hasText: title });
  const tall = (loc) => loc.evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44));
  try {
    const page = await open();
    const fab = page.locator(".chat-fab");
    // the empty Plate: his field is gone from the page
    const main = ((await page.locator("main").textContent()) ?? "").replace(/\s+/g, " ");
    ok(await page.locator(".crave").count() === 0 && !/What are you craving|Find ideas/.test(main) && await page.getByRole("button", { name: "Say what you have" }).count() === 0, "DT308.3: on the empty Plate, What are you craving?, his field, Find ideas and Say what you have are gone");
    // his icon opens his chat over the Plate
    await fab.click(); await page.waitForTimeout(500);
    const sheet = page.locator(".pc-sheet");
    ok(await sheet.count() === 1 && await page.locator(".talk-overlay").count() === 0 && (await sheet.locator(".pc-head b").textContent()) === "Chef Mealan" && await page.locator(".plate-empty-pic").count() === 1, "DT308.3: his round icon opens his chat over the Plate; the Plate stays under it");
    ok(await sheet.locator(".pc-input input").getAttribute("placeholder") === "Type or say what you crave or have" && await sheet.locator(".pc-input input").count() === 1 && await sheet.locator(".choice, .chip, .moments").count() === 0, "DT308.3: one field, Type or say what you crave or have, and no choices to make first");
    const sb = await sheet.boundingBox(), xb = await sheet.locator(".pc-head .icon").boundingBox();
    ok(sb.y > 60 && Math.round(sb.y + sb.height) === 844 && xb.width >= 44 && xb.height >= 44 && await sheet.locator(".pc-head .icon").getAttribute("aria-label") === "Close", "DT308.3: the chat is a sheet from the bottom, with an X of at least 44 px that says Close");
    await shot(page, "b_chat");
    // the X closes it; a tap on the Plate behind it closes it too
    await sheet.locator(".pc-head .icon").click(); await page.waitForTimeout(300);
    ok(await page.locator(".pc-sheet").count() === 0 && (await st(page)).items.length === 0, "DT308.3: the X closes the chat and nothing else happens");
    await fab.click(); await page.waitForTimeout(400);
    await page.mouse.click(195, 40); await page.waitForTimeout(300);
    ok(await page.locator(".pc-sheet").count() === 0, "DT308.3: a tap outside the chat closes it too");

    // a craving that your recipes, Coach's and the members' answer too
    await fab.click(); await page.waitForTimeout(400);
    await ask(page, "chocolate");
    ok(await page.locator(".pc-said").textContent() === "chocolate" && await page.locator(".pc-sheet .thinking-card").count() === 1 && await page.locator(".pc-input input").isDisabled(), "DT308.3: your words stand in the chat, and Chef Mealan is seen working; one question at a time");
    await page.waitForTimeout(1500);
    const g1 = await groups(page);
    ok(g1.join(" | ") === "From your recipes | Coach's recipes | Members' recipes | Chef Mealan's ideas", "DT308.3: your recipes come first, then Coach's and the members', then Chef Mealan's ideas: " + g1.join(" | "));
    ok(await cardOf(page, "Chocolate banana oat bowl").count() === 1 && await cardOf(page, "Chocolate quark pudding").count() === 1 && await cardOf(page, "Chocolate protein mug cake").count() === 1 && await cardOf(page, "DaaM good protein crêpes").count() === 0, "DT308.3: the recipes that match what you typed, and no other");
    const cards = page.locator(".pc-card");
    ok(await cards.count() === 6 && await page.locator(".pc-card .pc-add").count() === 6 && (await page.locator(".pc-card .pc-add").allTextContents()).every((t) => t.trim() === "+ Add") && await tall(page.locator(".pc-card .pc-add")) && await page.locator(".pc-card .pc-pic").count() === 6, "DT308.3: every answer is the same small card: a small picture, the title, and + Add of at least 44 px");
    ok(/^about \d+ kcal · PD \d+(\.\d)?$/.test((await cardOf(page, "Protein tiramisu").locator(".pc-text small").textContent()).trim()), "DT308.3: a card says about how many kcal and its PD: " + await cardOf(page, "Protein tiramisu").locator(".pc-text small").textContent());
    const two = await cardOf(page, "Tiramisu cups with skyr").locator(".pc-text b").evaluate((x) => ({ h: x.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(x).lineHeight) }));
    ok(two.h <= two.lh * 2 + 1 && two.h > two.lh * 1.5, "DT308.3: a long title stands on two lines, and no more");
    ok(crave.length === 1 && crave[0].count === 3 && crave[0].craving === "chocolate" && said.length === 1 && said[0].orCraving === true, "DT308.3: Chef Mealan is asked once for three ideas, and once whether your words are foods you have");
    ok((await st(page)).meals.length === 3 && (await st(page)).items.length === 0, "DT308.3: nothing is kept and nothing lands by itself");

    // a craving none of your recipes answers: his ideas only
    await ask(page, "tiramisu"); await page.waitForTimeout(1500);
    const g2 = await groups(page);
    ok(g2.join(" | ") === "Chef Mealan's ideas" && await page.locator(".pc-card").count() === 3, "DT308.3: no recipe of yours matches: From your recipes is not shown, his ideas are, up to three: " + g2.join(" | "));
    await shot(page, "c_answer");

    // a tap on an idea's title opens it short
    const tira = cardOf(page, "Protein tiramisu").first();
    ok(await tall(tira.locator(".pc-title")), "DT308.3: the idea's title is at least 44 px to tap");
    await tira.locator(".pc-title").click(); await page.waitForTimeout(300);
    const openTxt = ((await tira.locator(".pc-open").textContent()) ?? "").replace(/\s+/g, " ");
    ok(/^For one serving250 g quark · 30 g leibniz butterkeks · 20 g whey protein powder · 5 g cocoa powder\. See the whole recipe ›$/.test(openTxt) && !/Stir the quark/.test(openTxt), "DT308.3: the idea opens in place and stays short, its foods only: " + openTxt);
    const whole = tira.locator(".pc-whole");
    ok(await whole.count() === 1 && !/pill/.test(await whole.getAttribute("class")) && await tall(whole) && await tira.locator(".pc-open button").count() === 1 && await whole.evaluate((x) => getComputedStyle(x).backgroundColor) === "rgba(0, 0, 0, 0)", "DT308.3: See the whole recipe is a link at the end of the text, not a second button, and at least 44 px");
    await shot(page, "e_open");
    // the whole recipe, as a page over the chat
    await whole.click(); await page.waitForTimeout(400);
    const pg = page.locator(".pc-page");
    const pgTxt = ((await pg.textContent()) ?? "").replace(/\s+/g, " ");
    ok(await pg.count() === 1 && (await pg.locator("h2").textContent()) === "Protein tiramisu" && /An idea from Chef Mealan, not made yet · about \d+ kcal · PD [\d.]+ · \d+ g protein/.test(pgTxt), "DT308.3: the whole recipe is a page over the chat, and says An idea from Chef Mealan, not made yet");
    ok(/For one serving250 g Quark, low fat \(Magerquark\)30 g Leibniz Butterkeks/.test(pgTxt) && /How to make itStir the quark with the whey until smooth\./.test(pgTxt) && await pg.locator(".pc-how li").count() === 3, "DT308.3: its foods with their grams, and how to make it");
    const back = await pg.locator(".pc-back").boundingBox(), bar = await pg.locator(".pc-page-bar").boundingBox();
    ok((await pg.locator(".pc-back").textContent()).trim() === "Back to Chef Mealan" && back.y === 0 && back.height >= 44 && Math.round(bar.y + bar.height) === 844, "DT308.3: Back to Chef Mealan stays at the top, the bar stays at the bottom");
    const btns = (await pg.locator(".pc-page-bar button").allTextContents()).map((s) => s.trim());
    ok(btns.join(" | ") === "Save in My recipes | + Add" && /pill-primary/.test(await pg.locator(".pc-page-bar button").nth(1).getAttribute("class")) && !/pill-primary/.test(await pg.locator(".pc-page-bar button").nth(0).getAttribute("class")) && await pg.locator(".pill-primary").count() === 1, "DT308.3: Save in My recipes, and + Add on the right as the one filled button");
    await shot(page, "f_page");
    await pg.locator(".pc-page-bar button").first().click(); await page.waitForTimeout(300);
    let s = await st(page);
    ok(s.meals.length === 4 && s.meals[0].title === "Protein tiramisu" && !!s.meals[0].idea && s.items.length === 0 && /Saved in My recipes/.test(await pg.locator(".pc-page-bar").textContent()), "DT308.3: Save in My recipes keeps the idea in My recipes, as an idea, and says Saved in My recipes; the plate stays empty");
    await pg.locator(".pc-back").click(); await page.waitForTimeout(300);
    ok(await page.locator(".pc-page").count() === 0 && await page.locator(".pc-sheet").count() === 1 && await page.locator(".pc-card").count() === 3, "DT308.3: Back to Chef Mealan brings you back to his answer");
    // + Add: the chat closes and the dish is on your plate
    await cardOf(page, "Coffee quark cream").locator(".pc-add").click(); await page.waitForTimeout(900);
    s = await st(page);
    ok(await page.locator(".pc-sheet").count() === 0 && s.items.length === 4 && s.title === "Coffee quark cream" && s.meals.length === 5 && s.meals[0].title === "Coffee quark cream", "DT308.3: + Add closes the chat, the dish is on your plate with its foods, and the idea is kept in My recipes");
    // on a plate with foods his icon answers about the plate, as before
    await fab.click(); await page.waitForTimeout(500);
    ok(await page.locator(".pc-sheet").count() === 0, "DT308.3: on a plate with foods his icon answers about the plate, as before");
    await page.context().close();

    // one of your own recipes from the chat
    const p2 = await open(); crave = []; said = [];
    await p2.locator(".chat-fab").click(); await p2.waitForTimeout(400);
    await ask(p2, "chocolate"); await p2.waitForTimeout(1500);
    await cardOf(p2, "Chocolate banana oat bowl").locator(".pc-add").click(); await p2.waitForTimeout(900);
    s = await st(p2);
    ok(await p2.locator(".pc-sheet").count() === 0 && s.items.length === 4 && s.meals.length === 3, "DT308.3: + Add on one of your recipes puts it on your plate; nothing new is kept");
    await p2.context().close();

    // DT308.3b: the foods you have
    const p3 = await open(); crave = []; said = [];
    await p3.locator(".chat-fab").click(); await p3.waitForTimeout(400);
    await ask(p3, "chicken breast, rice"); await p3.waitForTimeout(1500);
    const g3 = await groups(p3);
    ok(g3.join(" | ") === "Your foods | Chef Mealan's ideas with them", "DT308.3b: he read your words as foods: Your foods, then Chef Mealan's ideas with them: " + g3.join(" | "));
    const yours = p3.locator(".pc-card").first();
    ok((await yours.locator(".pc-text b").textContent()) === "Chicken breast, Rice" && (await yours.locator(".pc-text small").textContent()) === "about 150 g each, as estimates" && (await yours.locator(".pc-add").textContent()).trim() === "+ Add", "DT308.3b: one card for your foods, with about how much and + Add");
    ok((await st(p3)).items.length === 0 && await p3.locator(".pc-card").count() === 4, "DT308.3b: nothing lands before your tap; his ideas stand under your foods");
    await shot(p3, "h_foods");
    await yours.locator(".pc-add").click(); await p3.waitForTimeout(900);
    s = await st(p3);
    ok(await p3.locator(".pc-sheet").count() === 0 && s.items.length === 2 && s.items.every((i) => i.est) && s.items.map((i) => i.grams).join() === "150,150", "DT308.3b: + Add on Your foods closes the chat and the foods are on your plate as estimates");
    await p3.context().close();

    // in Serbian and German
    for (const [lang, field, ideas, foods] of [["sr-Latn", "Upiši ili reci šta ti se jede ili šta imaš", "Ideje od Chef Mealana sa njima", "Tvoje namirnice"], ["de", "Tipp oder sag, worauf du Lust hast oder was du hast", "Ideen von Chef Mealan damit", "Deine Lebensmittel"]]) {
      const q = await open(lang);
      await q.locator(".chat-fab").click(); await q.waitForTimeout(400);
      const ph = await q.locator(".pc-input input").getAttribute("placeholder");
      await ask(q, "chicken breast, rice"); await q.waitForTimeout(1500);
      const gg = await groups(q);
      ok(ph === field && gg.join(" | ") === `${foods} | ${ideas}`, `DT308.3: the chat in ${lang}: ${ph}; ${gg.join(" | ")}`);
      await q.context().close();
    }
  } catch (e) { ok(false, "the walkthrough ran to its end: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
