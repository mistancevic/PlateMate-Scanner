// DT267 (0.3.117, board Stories200; Coach Milan 9 November, Go; from Tester 2): a meal eaten on a past day keeps its picture on
// Plan. The row shows the picture, the whole row opens the meal: the photo large, its other photos, the numbers, the foods
// with grams. Cook again only for a meal from a recipe; any other says Open, and inside Put it on the Plate again.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const items = [[120, food("b", "Sourdough bread", 250, 9, 48, 1.5)], [60, food("h", "Cooked ham", 115, 20, 1, 3.5)], [55, food("e", "Fried egg", 196, 13.6, 0.8, 15)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const PIC = "/landing/hero/curry-m.webp", PIC2 = "/landing/hero/curry-l.webp";
const recipe = { id: "m-r", title: "Ham and egg toast", items: structuredClone(items), portion: 235, savedAt: "2026-11-01T10:00:00.000Z" };
seed.meals = [recipe];
seed.feedback = [
  { id: "f1", meal: { id: "m-out", title: "Croque madame with salad", items, portion: 235, savedAt: "2026-11-07T11:05:00.000Z" }, status: "eaten", taste: "", notes: "", createdAt: "2026-11-07T11:05:00.000Z", photo: PIC, photos: [PIC, PIC2] },
  { id: "f2", meal: structuredClone(recipe), recipeId: "m-r", status: "eaten", taste: "", notes: "", createdAt: "2026-11-07T18:30:00.000Z" },
];
const PORT = "3489", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "Europe/Berlin" });
  const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-11-09T14:42:00+01:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 62, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const toSat = async () => { await page.goto(U + "/"); await page.waitForTimeout(900); await page.locator("nav button").filter({ hasText: /^(Plan)$/ }).click(); await page.waitForTimeout(800);
    await page.locator(".week-arrow").first().click(); await page.waitForTimeout(600); await page.getByRole("tab").filter({ hasText: /7/ }).first().click(); await page.waitForTimeout(700); };
  try {
    await toSat();
    const rows = page.locator(".past-plate.past-eaten");
    ok(await rows.count() === 2, "two eaten meals on Saturday");
    const out = rows.filter({ hasText: "Croque madame" }), rec = rows.filter({ hasText: "Ham and egg toast" });
    ok((await out.locator("img.log-photo").getAttribute("src")) === PIC, "the meal read from a photo shows its picture");
    ok(await out.getByRole("button", { name: "Open ›" }).count() === 1 && await out.getByRole("button", { name: "Cook again" }).count() === 0, "a meal with no recipe says Open, not Cook again");
    ok(await rec.getByRole("button", { name: "Cook again" }).count() === 1, "a meal from a recipe keeps Cook again");
    const small = await rows.locator("button").evaluateAll((xs) => xs.filter((x) => x.getBoundingClientRect().height < 44).length);
    ok(small === 0, "the row's buttons are at least 44 px");
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "the day fits the width");
    // the whole row opens the meal
    await out.locator("b").first().click(); await page.waitForTimeout(500);
    const pm = page.locator(".past-meal");
    ok(await pm.count() === 1 && (await pm.locator("h3").innerText()) === "Croque madame with salad", "a tap on the row opens the meal");
    ok((await pm.locator(".pm-photo").getAttribute("src")) === PIC, "the photo, large");
    ok(await pm.locator(".pm-thumb").count() === 2, "its other photos under it");
    await pm.locator(".pm-thumb").nth(1).click(); await page.waitForTimeout(200);
    ok((await pm.locator(".pm-photo").getAttribute("src")) === PIC2, "a tap on a small photo shows it large");
    const foods = await pm.locator(".pm-food").allInnerTexts();
    ok(foods.length === 3 && /Sourdough bread\s*120 g/.test(foods[0].replace(/\n/g, " ")), "the foods with their grams: " + foods.join(" | ").replace(/\n/g, " "));
    ok(/kcal/.test(await pm.locator(".pm-nums").innerText()) && /PD/.test(await pm.locator(".pm-nums").innerText()), "the numbers: " + (await pm.locator(".pm-nums").innerText()).replace(/\n/g, " "));
    ok(await pm.getByRole("button", { name: "Put it on the Plate again" }).count() === 1 && await pm.getByRole("button", { name: "Save in My recipes" }).count() === 1, "Put it on the Plate again, and Save in My recipes");
    const low = await pm.locator("button").evaluateAll((xs) => xs.filter((x) => x.getBoundingClientRect().height < 44).map((x) => x.className));
    ok(low.length === 0, "every button at least 44 px: " + low.join(", "));
    // back to the day
    await pm.locator(".pm-back").click(); await page.waitForTimeout(400);
    ok(await page.locator(".past-meal").count() === 0 && await rows.count() === 2, "back returns to Saturday");
    // Open opens too; Put it on the Plate again goes to the Plate with the foods
    await out.getByRole("button", { name: "Open ›" }).click(); await page.waitForTimeout(400);
    await page.locator(".past-meal").getByRole("button", { name: "Put it on the Plate again" }).click(); await page.waitForTimeout(900);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
    ok(/\/plate$/.test(page.url()) && st.items.length === 3 && st.feedback.length === 2, "the Plate holds its three foods; nothing new is logged");
    // the recipe's meal opened: Cook again inside, no Save
    await toSat();
    await rows.filter({ hasText: "Ham and egg toast" }).locator("b").first().click(); await page.waitForTimeout(400);
    ok(await page.locator(".past-meal").getByRole("button", { name: "Cook again" }).count() === 1 && await page.locator(".past-meal .pm-save").count() === 0, "a recipe's meal: Cook again, no Save in My recipes");
    ok(await page.locator(".past-meal .pm-thumb").count() === 0, "one photo or none: no row of small photos");
    // Srpski and German
    for (const l of ["sr-Latn", "de"]) {
      await page.evaluate((l) => localStorage.setItem("chefmealan-lang", l), l);
      await page.goto(U + "/plan"); await page.waitForTimeout(900);
      await page.locator(".week-arrow").first().click(); await page.waitForTimeout(600); await page.getByRole("tab").filter({ hasText: /7/ }).first().click(); await page.waitForTimeout(700);
      const o = page.locator(".past-plate.past-eaten").filter({ hasText: "Croque madame" });
      ok(!/Open/.test(await o.innerText()), `${l}: the row in the language: ` + (await o.locator("button").innerText()));
      await o.locator("b").first().click(); await page.waitForTimeout(400);
      ok(!/Put it on the Plate again|Save in My recipes/.test(await page.locator(".past-meal").innerText()), `${l}: the meal in the language`);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${l}: fits the width`);
    }
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
