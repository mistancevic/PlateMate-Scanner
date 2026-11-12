// DT284 (0.3.138, board Stories211; Coach Milan 12 November 08:24, Go; a tester's meal was recorded twice because a past meal
// could not be changed): the rows of Every time you ate it open their meal; a past meal has Change it and Delete this meal,
// from Recipes and from Plan. A change stays the same meal at its own time; a delete asks Sure? first and takes the meal out
// of the recipe's lists and its day. Srpski and German fit 360 px.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const F = (id) => seed.foods.find((f) => f.id === id);
const it = (id, food, grams) => ({ id, food: F(food), grams, locked: false });
const PIC = "/landing/hero/quesadilla-m.webp", PIC2 = "/landing/hero/curry-m.webp";
const recipe = { id: "m-s", title: "Egg sandwiches", items: [it("a", "f-bread", 100), it("b", "f-egg", 184), it("c", "f-chicken", 40)], portion: 324, steps: ["Toast the bread."], savedAt: "2026-11-05T10:00:00Z" };
const logged = { id: "c1", meal: { ...recipe, items: [it("a1", "f-bread", 100), it("b1", "f-egg", 250), it("c1x", "f-chicken", 93)], portion: 443 }, recipeId: "m-s", status: "eaten", taste: "", notes: "", createdAt: "2026-11-11T09:08:00.000Z", photo: PIC };
const twice = { id: "c2", meal: { ...recipe, items: [it("a2", "f-bread", 50), it("b2", "f-egg", 92), it("c2x", "f-chicken", 20)], portion: 162 }, recipeId: "m-s", status: "eaten", taste: "DaaM good", notes: "", createdAt: "2026-11-11T20:13:00.000Z", photo: PIC, prep: { went: "as" } };
const PORT = "3501", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (cards, width = 390, lang = "en") => {
    const ctx = await b.newContext({ viewport: { width, height: 1000 }, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-12T08:30:00+01:00"));
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: { ...seed, meals: [recipe], feedback: cards }, lang });
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + "/my-recipes/m-s"); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const cards = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).feedback);
  try {
    // ---- Recipes: the double goes, the first one is changed ----
    let { ctx, page } = await open([logged, twice]);
    const rows = page.locator(".rq-eats .re-open");
    ok(await rows.count() === 2 && /21:13 · cooked/.test(await rows.nth(0).innerText()) && /10:08 · logged/.test(await rows.nth(1).innerText()), "Every time you ate it: two rows, each a button");
    ok(await rows.evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "the rows are 44 px or more");
    await rows.nth(0).click(); await page.waitForTimeout(600);
    const pm = page.locator(".past-meal");
    ok(await pm.count() === 1 && /21:13/.test(await pm.locator(".pm-when").innerText()), "a row opens its meal");
    ok(await pm.getByRole("button", { name: "Change it" }).count() === 1 && await pm.getByRole("button", { name: "Delete this meal" }).count() === 1, "the meal offers Change it and Delete this meal");
    await pm.getByRole("button", { name: "Delete this meal" }).click(); await page.waitForTimeout(300);
    ok((await cards(page)).length === 2 && await pm.getByRole("button", { name: "Sure? Delete this meal" }).count() === 1 && /It leaves Wednesday,? 11 November in Plan/.test(await pm.innerText()), "Delete asks Sure? first and says where it leaves");
    await pm.getByRole("button", { name: "Keep it" }).click(); await page.waitForTimeout(300);
    ok(await pm.getByRole("button", { name: "Delete this meal" }).count() === 1 && (await cards(page)).length === 2, "Keep it: nothing deleted");
    await pm.getByRole("button", { name: "Delete this meal" }).click(); await page.waitForTimeout(200);
    await pm.getByRole("button", { name: "Sure? Delete this meal" }).click(); await page.waitForTimeout(800);
    let cs = await cards(page);
    ok(cs.length === 1 && cs[0].id === "c1" && await page.locator(".past-meal").count() === 0 && await rows.count() === 1, "Sure: the double is gone; back on the recipe, one row");
    await rows.nth(0).click(); await page.waitForTimeout(600);
    await pm.getByRole("button", { name: "Change it" }).click(); await page.waitForTimeout(400);
    const form = pm.locator(".pm-form");
    const chips = await form.locator(".pm-chips").first().locator("button").allInnerTexts();
    ok(chips.join(" | ") === "Half a portion, 162 g | 1 portion, 324 g | As logged, 443 g", "How much: " + chips.join(" | "));
    ok(await form.getByRole("button", { name: "As logged, 443 g" }).getAttribute("aria-pressed") === "true", "As logged is chosen until you change it");
    ok(await form.locator("button, textarea").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "every control in the form is 44 px or more");
    await form.getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(300);
    ok(await form.count() === 0 && (await cards(page))[0].meal.portion === 443, "Cancel: nothing changed");
    await pm.getByRole("button", { name: "Change it" }).click(); await page.waitForTimeout(300);
    await form.getByRole("button", { name: "Half a portion, 162 g" }).click();
    await form.getByRole("button", { name: "DaaM good" }).click();
    await form.locator("textarea").fill("Half a portion, changed on the call.");
    await form.locator('input[type="file"]').setInputFiles(path.join(ROOT, "tests/flows/front.jpg")); await page.waitForTimeout(1200);
    await form.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(800);
    cs = await cards(page);
    ok(cs.length === 1 && cs[0].id === "c1" && cs[0].createdAt === "2026-11-11T09:08:00.000Z", "Save changes: still one meal, at its own time");
    ok(cs[0].meal.portion === 162 && cs[0].meal.items.map((x) => x.grams).join() === "50,92,20" && cs[0].taste === "DaaM good" && cs[0].notes === "Half a portion, changed on the call." && cs[0].photo !== PIC, "the amount, the taste, the words and the photo changed");
    ok(/Wholegrain bread\s*50 g/.test((await pm.locator(".pm-foods").innerText()).replace(/\n/g, " ")) && /DaaM good/.test(await pm.locator(".pm-when").innerText()), "the open meal shows the change at once");
    await pm.locator(".pm-back").click(); await page.waitForTimeout(500);
    ok(/10:08 · logged/.test(await rows.nth(0).innerText()) && /Half a portion, 162 g · DaaM good/.test(await rows.nth(0).innerText()), "the row says it: " + (await rows.nth(0).innerText()).replace(/\n/g, " "));
    await page.reload(); await page.waitForTimeout(1500);
    ok(/Half a portion, 162 g/.test(await rows.nth(0).innerText()), "opened again: still changed");
    await ctx.close();
    // ---- Plan: the same buttons on a past day ----
    ({ ctx, page } = await open([logged, { ...twice, recipeId: undefined, meal: { ...twice.meal, id: "m-x", title: "Toast with eggs" } }]));
    await page.locator("nav button").filter({ hasText: /^(Plan)$/ }).click(); await page.waitForTimeout(800);
    await page.getByRole("tab").filter({ hasText: /11/ }).first().click(); await page.waitForTimeout(700);
    const eaten = page.locator(".past-plate.past-eaten");
    ok(await eaten.count() === 2, "Plan, Wednesday: two eaten meals");
    await eaten.filter({ hasText: "Toast with eggs" }).locator("b").first().click(); await page.waitForTimeout(500);
    ok(await page.locator(".past-meal").getByRole("button", { name: "Change it" }).count() === 1, "a past meal opened from Plan offers Change it");
    await page.locator(".past-meal").getByRole("button", { name: "Change it" }).click(); await page.waitForTimeout(300);
    const pc = await page.locator(".pm-form .pm-chips").first().locator("button").allInnerTexts();
    ok(pc.join(" | ") === "Half of it, 81 g | As logged, 162 g", "a meal with no recipe: Half of it, or As logged: " + pc.join(" | "));
    await page.locator(".pm-form").getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(200);
    await page.locator(".past-meal").getByRole("button", { name: "Delete this meal" }).click(); await page.waitForTimeout(200);
    await page.locator(".past-meal").getByRole("button", { name: "Sure? Delete this meal" }).click(); await page.waitForTimeout(800);
    ok(await page.locator(".past-meal").count() === 0 && await eaten.count() === 1 && (await cards(page)).length === 1, "deleted from Plan: the day keeps one meal");
    await ctx.close();
    // ---- Srpski and German ----
    for (const [lang, width] of [["sr-Latn", 390], ["de", 360]]) {
      ({ ctx, page } = await open([logged], width, lang));
      await page.locator(".rq-eats .re-open").first().click(); await page.waitForTimeout(600);
      await page.locator(".past-meal .pm-change").click(); await page.waitForTimeout(300);
      await page.locator(".past-meal").evaluate((x) => x); const t = await page.locator(".pm-form").innerText();
      await page.locator(".pm-form .pm-cancel").click(); await page.locator(".past-meal .pm-delete").click(); await page.waitForTimeout(200);
      const t2 = await page.locator(".past-meal .pm-edit").innerText();
      ok(!/Change this meal|How much|As logged|Save changes|Cancel|Sure\?|Keep it|It leaves/.test(t + t2) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${lang}: in the language and fits ${width} px: ` + (t + " " + t2).replace(/\n/g, " ").slice(0, 110));
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
