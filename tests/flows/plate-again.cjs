// DT319 (0.3.183, board Stories283; Go 23 November 2026, 14:13): a meal I ate, opened from Plan: Put it on the Plate again is
// a copy for a new meal. One line says so (AC1); a plate that holds foods is asked first, Keep my plate changes nothing (AC2);
// an empty plate goes straight on (AC3); the copy has the meal's name, no meal set, and a change on it leaves the meal eaten
// as it was (AC4). Saturday's lunch, 21 November; the clock is Monday 23 November, 13:15.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const it = (g, f) => ({ id: f.id + "i", grams: g, locked: false, food: f });
const meal = [it(180, food("ch", "Chicken breast, cooked", 165, 31, 0, 3.6)), it(200, food("sp", "Sweet potato fries", 160, 2, 24, 6)), it(80, food("sl", "Green salad", 15, 1.2, 2, 0.2))];
seed.meals = [];
seed.feedback = [{ id: "f1", meal: { id: "m-out", title: "Chicken and sweet potato fries", items: meal, portion: 460, savedAt: "2026-11-21T12:40:00.000Z" }, status: "eaten", taste: "", notes: "", createdAt: "2026-11-21T12:40:00.000Z", slot: { date: "2026-11-21", slotId: "lunch" } }];
const onPlate = [it(200, food("sk", "Skyr", 63, 11, 4, 0.2)), it(120, food("bn", "Banana", 89, 1.1, 23, 0.3))];
const PORT = "3608", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (items) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1100 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-23T13:15:00+01:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 62, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, items });
    await require("./adult.cjs")(page);
    await page.goto(U + "/"); await page.waitForTimeout(900); await page.locator("nav button").filter({ hasText: /^(Plan)$/ }).click(); await page.waitForTimeout(800);
    await page.locator(".week-arrow").first().click(); await page.waitForTimeout(600); await page.getByRole("tab").filter({ hasText: /21/ }).first().click(); await page.waitForTimeout(700);
    await page.locator(".past-plate.past-eaten").first().locator("b").first().click(); await page.waitForTimeout(600);
    return page;
  };
  const st = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  try {
    let page = await open(onPlate);
    const pm = page.locator(".past-meal");
    ok((await pm.locator(".pm-copy-line").innerText()).trim() === "A copy of these foods, for a new meal. This meal stays as it is.", "DT319 AC1: one line says it is a copy for a new meal");
    await pm.locator(".pm-again").click(); await page.waitForTimeout(400);
    const ask = pm.locator(".pm-replace");
    ok(/^Your plate holds 2 foods: Skyr, Banana\. Put Chicken and sweet potato fries in their place\?$/.test((await ask.locator("b").innerText()).trim()), "DT319 AC2: the plate has foods, so it asks: " + (await ask.locator("b").innerText()).trim());
    ok(/past-meal|plan/.test(await page.locator("main").first().getAttribute("class") ?? "plan") && !/\/plate$/.test(page.url()), "DT319 AC2: still on the meal, not the Plate");
    await ask.getByRole("button", { name: "Keep my plate" }).click(); await page.waitForTimeout(300);
    let s = await st(page);
    ok(await pm.locator(".pm-replace").count() === 0 && s.items.map((i) => i.food.name).join() === "Skyr,Banana", "DT319 AC2: Keep my plate changes nothing");
    await pm.locator(".pm-again").click(); await page.waitForTimeout(300);
    await pm.getByRole("button", { name: "Replace them" }).click(); await page.waitForTimeout(1000);
    s = await st(page);
    ok(/\/plate$/.test(page.url()) && s.items.map((i) => i.food.name).join() === "Chicken breast, cooked,Sweet potato fries,Green salad", "DT319 AC4: the Plate holds the meal's three foods");
    ok(s.title === "Chicken and sweet potato fries", "DT319 AC4: the copy comes with its name: " + s.title);
    ok(!s.recorded && !s.plannedAt && /No meal selected/i.test(await page.locator(".meal-line").first().innerText()), "DT319 AC4: no meal set, bound to nothing: " + (await page.locator(".meal-line").first().innerText()).replace(/\s+/g, " "));
    // a change on the copy: the chicken from 180 g to 250 g, on the Plate
    const box = await page.evaluateHandle(() => [...document.querySelectorAll("main input")].find((x) => x.value === "180"));
    await box.asElement().fill("250"); await box.asElement().press("Enter"); await page.waitForTimeout(900);
    s = await st(page);
    ok(s.items[0].grams === 250, "DT319 AC4: the copy changed on the Plate: " + s.items[0].grams);
    ok(s.feedback.length === 1 && s.feedback[0].meal.items[0].grams === 180 && s.feedback[0].meal.title === "Chicken and sweet potato fries", "DT319 AC4: Saturday's lunch is as it was, and nothing new is logged");
    await page.context().close();
    // AC3: an empty plate goes straight on
    page = await open([]);
    await page.locator(".past-meal .pm-again").click(); await page.waitForTimeout(1000);
    s = await st(page);
    ok(/\/plate$/.test(page.url()) && s.items.length === 3 && s.title === "Chicken and sweet potato fries", "DT319 AC3: an empty plate: no question, the Plate with the foods and the name");
    await page.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
