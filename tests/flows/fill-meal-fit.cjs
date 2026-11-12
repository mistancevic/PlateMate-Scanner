// DT290 (0.3.144, board Stories217; Go 12 November 17:19): Fill knows which dishes suit which meal; Good for on the recipe.
// Built on the DT287 walkthrough's seed. DT287 (0.3.142, board Stories215; Coach Milan 12 November 13:28 and 13:32; brainstorm 15:00 to 15:35, Go 15:50): Fill the open
// slots, on the goal and a different week. Each open slot has two or three choices, each with why; the protein of the week
// rotates (chicken twice this week comes after fish); chips per slot: Another protein, Lighter, Something I crave; a tap picks;
// Put them in the plan, on the right, puts the picks in. Serbian.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = [];
const F = (n) => seed.foods.find((x) => x.name === n);
const beans = { id: "f-beans", name: "Kidney beans, cooked", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-01T10:00:00Z", readyToEat: true, calories: 127, protein: 8.7, fats: 0.5, carbs: 22.8, fiber: 6.4 };
seed.foods = [...seed.foods, beans];
const it = (id, food, g) => ({ id, food, grams: g, locked: true });
const R = (id, title, main, g) => ({ id, title, savedAt: "2026-10-01T08:00:00Z", items: [it(id + "a", main, g), it(id + "b", F("Rice, cooked"), 150)], portion: g + 150 });
seed.meals = [R("chk", "Chicken and rice", F("Chicken breast, cooked"), 170), R("sal", "Salmon and rice", F("Salmon, cooked"), 170), R("egg", "Eggs and rice", F("Eggs"), 220), R("bea", "Beans and rice", beans, 300)];
const ate = (d, id) => ({ id: "fb" + d, status: "eaten", taste: "", notes: "", createdAt: `2026-11-${String(12 - d).padStart(2, "0")}T13:00:00.000Z`, recipeId: "chk", meal: { ...seed.meals[0], id: "m" + d } });
seed.feedback = [ate(1), ate(2)];
const PORT = "3508", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang = "en", width = 390) => {
    const ctx = await b.newContext({ viewport: { width, height: 1400 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-12T07:00:00+01:00"));
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: seed, lang });
    await require("./adult.cjs")(page);
    await page.goto(U + "/plan"); await page.waitForTimeout(1500);
    await page.locator("button.plan-fill").click(); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const logOf = (page, ev) => page.evaluate((e) => JSON.parse(localStorage.getItem("chefmealan-log") || "[]").filter((x) => x.event === e), ev);
  try {
    let { ctx, page } = await open();
    const fill = page.locator(".fill-rows").last();
    const bf = fill.locator(".fill-slot").filter({ hasText: /Breakfast/ }).first();
    const names = await bf.locator(".fill-choice b").allInnerTexts();
    ok(names.length >= 2 && !names.some((n) => /^(Beans|Chicken|Salmon) and rice/.test(n)), "breakfast gets breakfasts, no beans, chicken or salmon with rice: " + names.join(", "));
    ok((await bf.locator(".fill-why").allInnerTexts()).some((x) => /^A breakfast · /.test(x)), "the why says it is a breakfast");
    const dinner = await fill.locator(".fill-slot").filter({ hasText: /Dinner/ }).first().locator(".fill-choice b").allInnerTexts();
    ok(dinner.some((n) => /and rice/.test(n)), "the rice dishes go to dinner: " + dinner.join(", "));
    await ctx.close();
    // the recipe page: Good for, Chef Mealan's guess lit; a tap makes it yours
    ({ ctx, page } = await open());
    await page.goto(U + "/my-recipes/bea"); await page.waitForTimeout(1500);
    const gf = page.locator(".rq-goodfor");
    const lit = await gf.locator("button[aria-pressed=true]").allInnerTexts();
    ok(lit.map((x) => x.replace("✓ ", "").trim()).join(",") === "Lunch,Dinner" && /from when you ate it and from its foods/.test(await gf.innerText()), "Good for: Lunch and Dinner, Chef Mealan's guess: " + lit.join(","));
    ok(await gf.locator("button").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "the chips are 44 px or more");
    await gf.getByRole("button", { name: "Breakfast" }).click(); await page.waitForTimeout(500);
    const g = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === "bea").goodFor);
    ok(JSON.stringify(g) === JSON.stringify(["breakfast", "lunch", "dinner"]) && /You set these/.test(await gf.innerText()), "a tap: yours now, " + JSON.stringify(g));
    await ctx.close();
    ({ ctx, page } = await open("sr-Latn", 390));
    await page.goto(U + "/my-recipes/bea"); await page.waitForTimeout(1500);
    ok(/Odgovara za/.test(await page.locator(".rq-goodfor").innerText()) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "sr-Latn: Odgovara za, fits 390 px");
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
