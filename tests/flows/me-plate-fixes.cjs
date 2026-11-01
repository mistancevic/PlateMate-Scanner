// DT205 to DT207 (0.3.48; Coach Milan 1 November 19:42 findings, 19:54 Go). Profile keeps every answer as you go: no Save in the
// middle, Next: Goal the main button; Your summary, Plan your week, then Back comes back to Your summary; Shopping lists shows
// the earlier lists first, New shopping list its own button; a food added to a plate started hours ago asks Add or Start a
// new plate (DT206); a plate of only a drink gets no meal built around it.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const PORT = "3342", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8"));
const base = { ...seed.foods[0], photo: undefined, photos: undefined, table: undefined, icon: undefined, barcode: undefined, places: [] };
const F = (id, name, calories, protein, fats, carbs, extra = {}) => ({ ...base, id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber: 0, ...extra });
const CH = F("ch", "Chicken breast, cooked", 165, 31, 3.6, 0), RI = F("ri", "Rice, cooked", 130, 2.7, 0.3, 28);
const BEER = F("beer", "Augustiner Alkoholfrei Hell", 25, 0.3, 0, 5.6), SKYR = F("skyr", "Skyr", 63, 11, 0.2, 4);
seed.foods = [CH, RI, BEER, SKYR, ...seed.foods.filter((f) => !["ch", "ri", "beer", "skyr"].includes(f.id))]; seed.meals = []; seed.feedback = [];
const sixAgo = new Date(Date.now() - 6 * 3600000).toISOString();
seed.items = [{ id: "a", food: CH, grams: 170, locked: false }, { id: "b", food: RI, grams: 150, locked: false }]; seed.plateAt = sixAgo; seed.title = "Chicken and rice";
const list1 = { n: 1, madeAt: "2026-10-20T10:00:00Z", from: "2026-10-20", to: "2026-10-22", meals: 3, lines: [{ key: "skyr|", name: "Skyr", brand: "", grams: 500, meals: 2 }], without: [], carried: [], carriedFrom: null, ticked: ["skyr|"], doneAt: "2026-10-21T18:00:00Z" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const url = () => new URL(page.url()).pathname;
  try {
    await page.addInitScript(([s, l1]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("chefmealan-shopping-lists", JSON.stringify({ lists: [l1], carry: null }));
      localStorage.setItem("seeded", "1"); }, [seed, list1]);
    await require("./adult.cjs")(page);
    // DT206: a food added to a plate from six hours ago asks first
    await page.goto(U + "/foods"); await page.waitForTimeout(1500);
    await page.locator(".row").filter({ hasText: "Skyr" }).first().getByRole("button", { name: "Add to meal" }).click(); await page.waitForTimeout(800);
    const ask = page.locator(".plate-ask");
    ok(await ask.count() === 1 && /Skyr would join a plate from \d\d:\d\d|Skyr would join a plate from \w+day \d\d:\d\d/.test(await ask.textContent()), "DT206: a food for a plate from hours ago asks first: " + ((await ask.textContent().catch(() => "")) || "").slice(0, 120));
    await ask.getByRole("button", { name: "Start a new plate" }).click(); await page.waitForTimeout(600);
    const names = (await page.locator(".plate-card .name-link").allTextContents()).map((x) => x.trim());
    ok(names.join("|") === "Skyr", "Start a new plate: only the skyr: " + names.join(", "));
    // a fresh plate does not ask
    await page.goto(U + "/foods"); await page.waitForTimeout(1200);
    await page.locator(".row").filter({ hasText: "Rice, cooked" }).first().getByRole("button", { name: "Add to meal" }).click(); await page.waitForTimeout(700);
    ok(await page.locator(".plate-ask").count() === 0 && (await page.locator(".plate-card .name-link").count()) === 2, "a plate started now takes the next food without a question");
    // a drink alone is no meal to build around
    await page.evaluate((beer) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = [{ id: "z", food: beer, grams: 330, locked: false }]; s.plateAt = new Date().toISOString(); s.title = ""; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, BEER);
    await page.goto(U + "/plate"); await page.waitForTimeout(1500);
    ok(await page.getByRole("button", { name: /^Make it a |^Add foods for a / }).count() === 0, "DT206: a plate of only a drink offers no meal around it");
    // DT205: Profile keeps it as you go
    await require("./me.cjs")(page);
    await page.locator(".me-rows .menu-row").filter({ hasText: /^Profile/ }).first().click(); await page.waitForTimeout(500);
    ok(await page.getByRole("button", { name: "Save", exact: true }).count() === 0, "DT205: no Save button in the middle of Profile");
    await page.getByLabel(/^Weight, kg/).fill("93"); await page.waitForTimeout(1200);
    const kg = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).weightKg);
    ok(kg === 93 && /Kept as you go/.test(await page.locator(".saved-line").textContent()), "DT205: the weight is kept a moment after typing: " + kg);
    await page.getByLabel(/^Birth year/).fill("19"); await page.waitForTimeout(1200);
    ok((await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).birthYear)) === 1981 && /Not kept yet: the birth year needs four digits/.test(await page.locator(".saved-line").textContent()), "DT205: a birth year of two digits waits, and says so");
    await page.getByLabel(/^Birth year/).fill("1981"); await page.waitForTimeout(900);
    const next = page.getByRole("button", { name: /^Next: Goal/ });
    ok(await next.count() === 1 && /pill-primary/.test(await next.getAttribute("class")), "DT205: Next: Goal is the main button at the end");
    await next.click(); await page.waitForTimeout(500);
    ok(url() === "/me/goal", "Next: Goal opens Goal: " + url());
    // DT207e: Your summary, Plan your week, Back
    await page.goto(U + "/me/summary"); await page.waitForTimeout(1500);
    await page.locator(".sum-next button").filter({ hasText: "Plan your week" }).click(); await page.waitForTimeout(900);
    ok(url() === "/plan", "Plan your week opens Plan: " + url());
    await page.goBack(); await page.waitForTimeout(900);
    ok(url() === "/me/summary" && /Your summary/.test(await page.locator(".menu-title").textContent().catch(() => "")), "DT207e: Back from Plan comes back to Your summary: " + url());
    // DT207b: the earlier lists first
    await page.goto(U + "/plan"); await page.waitForTimeout(1500);
    const shop = page.getByRole("button", { name: /^Shopping lists$/ });
    ok(await shop.count() === 1, "DT207b: with an earlier list kept, the button says Shopping lists");
    await shop.click(); await page.waitForTimeout(500);
    const sheet = page.getByRole("dialog", { name: "Shopping lists" });
    const order = await sheet.evaluate((d) => { const e = d.querySelector(".shop-earlier"), n = d.querySelector(".shop-new"); return e && n ? Boolean(e.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING) : false; });
    ok(order && await sheet.locator(".shop-title").count() === 0, "DT207b: the earlier list first, then New shopping list, no form yet");
    await sheet.getByRole("button", { name: "New shopping list" }).click(); await page.waitForTimeout(400);
    ok(await sheet.getByRole("button", { name: /^Make shopping list 2/ }).count() === 1, "New shopping list opens the form for list 2");
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
