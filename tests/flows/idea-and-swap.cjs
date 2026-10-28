// JOURNEY (0.2.129, DT148, board Stories100 version 2; Tester 3, UX2 and Bug 1; Coach Milan 28 October 23:10 and 23:39 Go):
// Marko asked for a cheesecake from the box on top of the Plate. While Chef Mealan works, a card that moves and counts the
// seconds. The idea is to read: its foods as points with grams, How to make it, then Put it on my plate; nothing to edit on the
// card. Chef Mealan is told where you shop. On the Plate, one line says swipe left to swap, right to remove; + Add a food sits
// right under the last food and opens the search there. Swap (rule C51) lists the same kind first, your foods before the basic
// foods sold where you shop, never the food swapped away under another name; other kinds wait behind one line. One word: + Add.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3321", U = `http://127.0.0.1:${PORT}`;
const IDEA = { idea: { title: "Cheesecake cup", why: "Creamy and sweet like cheesecake, with toasted oats for the base.", how: ["Toast the oats in a dry pan for 3 minutes, until they smell nutty.", "Stir the honey into the quark.", "Slice the strawberries.", "In a glass: oats, then quark, then strawberries on top."], items: [
  { name: "Quark, low fat", grams: 200, calories: 67, protein: 12, fats: 0.3, carbs: 4 },
  { name: "Oats", grams: 30, calories: 372, protein: 13.5, fats: 7, carbs: 59 },
  { name: "Strawberries", grams: 120, calories: 32, protein: 0.7, fats: 0.3, carbs: 7.7 },
  { name: "Honey", grams: 10, calories: 304, protein: 0.3, fats: 0, carbs: 82 } ] } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  try {
    const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript(([s]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-28T16:00:00Z", consentBodyAt: "2026-10-28T16:00:00Z", declaredAt: "2026-10-28T16:00:00Z", aiConfirmedAt: "2026-10-28T16:00:00Z" }));
      localStorage.setItem("chefmealan-region", "limassol"); localStorage.setItem("seeded", "1"); }, [seed]);
    await require("./adult.cjs")(page);
    let hold = true, asked = null;
    await page.route("**/api/members", (r) => r.fulfill({ json: { recipes: [] } }));
    await page.route("**/api/crave", async (r) => { asked = JSON.parse(r.request().postData() || "{}"); while (hold) await new Promise((x) => setTimeout(x, 100)); r.fulfill({ json: IDEA }); });
    const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
    await page.goto(U + "/plate"); await page.waitForTimeout(1500);
    await page.getByLabel("What are you craving?").fill("cheesecake"); await page.waitForTimeout(500);
    await page.getByRole("button", { name: /Ask Chef Mealan/ }).first().click(); await page.waitForTimeout(2300);
    // the wait moves and counts
    const card = page.locator(".thinking-card");
    ok(await card.count() === 1 && await card.locator(".thinking-hat img").count() === 1 && await card.locator(".thinking-bar i").count() === 1, "a thinking card: the hat, the bar");
    const anim = await card.locator(".thinking-hat img").evaluate((x) => getComputedStyle(x).animationName);
    ok(anim === "hat-stir", "the hat stirs: " + anim);
    ok(/Chef Mealan is making an idea for cheesecake/.test(await card.textContent()) && /sold in Limassol · [1-9] s/.test(await card.textContent()), "it says what and counts the seconds: " + (await card.textContent()).replace(/\s+/g, " "));
    ok(asked && asked.place === "Limassol" && Array.isArray(asked.library), "Chef Mealan is told where you shop: " + asked?.place);
    hold = false; await page.waitForTimeout(1500);
    // the idea to read
    const idea = page.locator(".crave-idea");
    ok((await idea.locator(".crave-foods li").allTextContents()).join("|") === "200 g Quark, low fat (Magerquark)|30 g Oats|120 g Strawberries|10 g Honey", "the foods as points with their grams: " + (await idea.locator(".crave-foods li").allTextContents()).join(", "));
    ok(await idea.locator(".crave-how li").count() === 4 && /Toast the oats/.test(await idea.locator(".crave-how").textContent()), "How to make it, in steps");
    ok(await idea.getByRole("button", { name: /Swap|Add/ }).count() === 0, "nothing to edit on the card");
    ok(/To change a food, put it on your plate: swap, remove, add and the amounts are all there\./.test(await idea.textContent()), "the card says where changes happen");
    ok((await st()).meals.find((m) => m.title === "Cheesecake cup")?.idea?.how?.length === 4, "the steps are kept with the idea");
    await idea.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1200);
    // the Plate: the swipe line and + Add a food under the foods
    ok(/Swipe a food left to swap it, right to remove it\./.test(await page.locator(".plate-card").textContent()), "one line says how to swap and remove");
    const under = await page.evaluate(() => { const rows = document.querySelector(".plate-card .rows"); const add = document.querySelector(".add-here-open"); return !!rows && !!add && rows.compareDocumentPosition(add) & 4 && add.getBoundingClientRect().top - rows.getBoundingClientRect().bottom < 80; });
    ok(!!under, "+ Add a food sits right under the last food");
    await page.locator(".add-here-open").click(); await page.waitForTimeout(300);
    await page.getByLabel("Find a food to add").fill("yog"); await page.waitForTimeout(500);
    const here = page.locator(".add-here");
    ok(/Greek yogurt 2%/.test(await here.textContent()) && await here.getByRole("button", { name: "Take it" }).count() === 0, "the search opens there, with your foods; no Take it");
    const basic = here.locator(".row-basic").first();
    ok(await basic.count() === 1 && /joins your foods/.test(await basic.textContent()) && await basic.getByRole("button", { name: "Add" }).count() === 1, "a basic food: + Add, and the line says it joins your foods");
    await here.locator(".row-food").filter({ hasText: "Greek yogurt 2%" }).getByRole("button", { name: "Add" }).click(); await page.waitForTimeout(500);
    ok((await st()).items.some((i) => /Greek yogurt/.test(i.food.name)), "+ Add puts it on the plate");
    await here.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(200);
    // swap Quark: the same kind first, never Quark again
    const row = page.locator(".swipe-fg").filter({ hasText: "Quark" }).first(); const bb = await row.boundingBox();
    await page.mouse.move(bb.x + bb.width - 60, bb.y + bb.height / 2); await page.mouse.down();
    for (let k = 1; k <= 10; k++) await page.mouse.move(bb.x + bb.width - 60 - k * 15, bb.y + bb.height / 2);
    await page.mouse.up(); await page.waitForTimeout(800);
    const sheet = page.locator(".sheet");
    const names = await sheet.locator(".row-text b").allTextContents();
    ok(names.length > 0 && !names.some((n) => /quark/i.test(n)), "no Quark under another name: " + names.slice(0, 5).join(", "));
    ok(/The same kind of food, like quark/i.test(await sheet.textContent()) && /^(Cottage cheese|Skyr)/.test(names[0]), "the same kind first, your foods first: " + names.slice(0, 4).join(", "));
    ok(names.some((n) => /Sheep's milk yoghurt, Cypriot|Anari/.test(n)), "a Cypriot food sold in Limassol is offered");
    ok(await sheet.locator(".swap-more").count() === 1 && /Other kinds: /.test(await sheet.locator(".swap-more").textContent()) && !names.some((n) => /Whey|ice cream|Nutella/i.test(n)), "other kinds wait behind one line");
    const cy = sheet.locator(".row-button").filter({ hasText: /Sheep's milk yoghurt, Cypriot/ }).first();
    ok(/Basic food sold in Limassol; joins your foods/.test(await cy.textContent()), "the line says where it is sold and that it joins your foods");
    await cy.click(); await page.waitForTimeout(600);
    const s = await st();
    ok(s.items.some((i) => /Sheep's milk yoghurt/.test(i.food.name)) && s.foods.some((f) => /Sheep's milk yoghurt/.test(f.name) && f.refId === "cy-yoghurt-sheep") && !s.items.some((i) => /^Quark/.test(i.food.name)), "picked: it takes Quark's place and joins your foods");
    // the bottom search reads + Add too
    await page.getByLabel("Search all my foods").fill("kefir"); await page.waitForTimeout(600);
    ok(await page.getByRole("button", { name: "Take it" }).count() === 0, "no Take it in the Plate's search");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
