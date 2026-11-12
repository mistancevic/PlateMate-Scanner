// B139 (0.3.141, board Stories214; Coach Milan 12 November 14:02 to 14:41, Go 14:45): a ✓ only on what is done. Next on Today:
// Change it on the left, I ate it on the right, no ✓. After I ate it the meal is in Today's meals with ✓ Eaten, by the plan,
// and on its card Undo (while you stay on Today) and Change or delete ›, which opens the meal with Change it and a red-border
// Delete this meal. Serbian and German.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const F = (n) => seed.foods.find((x) => x.name === n);
seed.meals = [{ id: "sarma", title: "Sarma with skyr", savedAt: "2026-10-01T08:00:00Z", portion: 400, items: [["Rice, cooked", 150], ["Chicken breast, cooked", 150], ["Skyr, natural", 100]].map(([n, g], i) => ({ id: "s" + i, food: F(n), grams: g, locked: true })) },
  { id: "oats", title: "Oats with skyr", savedAt: "2026-10-01T08:00:00Z", portion: 260, items: [["Oats", 60], ["Skyr, natural", 200]].map(([n, g], i) => ({ id: "o" + i, food: F(n), grams: g, locked: true })) }];
const planned = { "2026-11-12": { lunch: { title: "Sarma with skyr", kcal: 610, protein: 52, source: "mine", mealId: "sarma", items: seed.meals[0].items }, dinner: { title: "Oats with skyr", kcal: 420, protein: 34, source: "mine", mealId: "oats", items: seed.meals[1].items } } };
const PORT = "3505", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang = "en", width = 390) => {
    const ctx = await b.newContext({ viewport: { width, height: 1400 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-12T12:40:00+01:00"));
    await page.addInitScript(({ s, planned, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-planned", JSON.stringify(planned));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: seed, planned, lang });
    await require("./adult.cjs")(page);
    await page.goto(U + "/today"); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const cards = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).feedback);
  try {
    let { ctx, page } = await open();
    const acts = page.locator(".next-planned-acts button");
    const names = (await acts.allInnerTexts()).map((x) => x.trim());
    ok(names.join(" | ") === "Change it | I ate it", "Next: Change it on the left, I ate it on the right: " + names.join(" | "));
    const ate = page.locator(".next-planned-acts").getByRole("button", { name: "I ate it" });
    ok(await ate.locator("svg").count() === 0, "I ate it has no ✓");
    ok(await page.locator("button.pill-primary").filter({ hasText: /I ate/ }).evaluateAll((xs) => xs.every((x) => !x.querySelector("svg"))), "no I ate it button on Today carries a ✓");
    await ate.click(); await page.waitForTimeout(800);
    const row = page.locator(".meals-card .log-card").first();
    ok((await row.locator(".plan-mark").innerText()).trim() === "✓ Eaten, by the plan", "the meal says ✓ Eaten, by the plan");
    ok(await row.getByRole("button", { name: "Undo" }).count() === 1 && await row.getByRole("button", { name: "Change or delete ›" }).count() === 1, "on its card: Undo and Change or delete ›");
    ok(await row.locator(".meal-row-acts button").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "both are 44 px or more");
    await row.getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(800);
    ok((await cards(page)).length === 0 && /Next: lunch/i.test(await page.locator("main").innerText()), "Undo: nothing logged, lunch is next again");
    await page.locator(".next-planned-acts").getByRole("button", { name: "I ate it" }).click(); await page.waitForTimeout(800);
    await page.locator("nav button").filter({ hasText: /^Plan$/ }).click(); await page.waitForTimeout(600);
    await page.locator("nav button").filter({ hasText: /^Today$/ }).click(); await page.waitForTimeout(800);
    const row2 = page.locator(".meals-card .log-card").first();
    ok(await row2.getByRole("button", { name: "Undo" }).count() === 0 && await row2.getByRole("button", { name: "Change or delete ›" }).count() === 1, "back on Today later: no Undo, Change or delete stays");
    await row2.getByRole("button", { name: "Change or delete ›" }).click(); await page.waitForTimeout(700);
    const pm = page.locator(".past-meal");
    ok(/Sarma with skyr/.test(await pm.innerText()) && (await pm.locator(".pm-back").innerText()).trim() === "‹ Today" && await pm.getByRole("button", { name: "Change it" }).count() === 1, "it opens the meal: ‹ Today, Change it");
    const del = pm.getByRole("button", { name: "Delete this meal" });
    ok(await del.evaluate((x) => x.classList.contains("pill") && getComputedStyle(x).borderTopWidth !== "0px" && x.getBoundingClientRect().height >= 44), "Delete this meal is a button with a border, 44 px or more");
    await del.click(); await page.waitForTimeout(200);
    await pm.getByRole("button", { name: "Sure? Delete this meal" }).click(); await page.waitForTimeout(800);
    ok((await cards(page)).length === 0 && await page.locator(".past-meal").count() === 0 && /Next: lunch/i.test(await page.locator("main").innerText()), "deleted: back on Today, lunch is next again");
    await ctx.close();
    for (const [lang, width, tag, re] of [["sr-Latn", 390, "✓ Pojedeno, po planu", /Izmeni ili obriši/], ["de", 360, "✓ Gegessen, nach Plan", /Ändern oder löschen/]]) {
      ({ ctx, page } = await open(lang, width));
      await page.locator(".next-planned-acts button.pill-primary").click(); await page.waitForTimeout(800);
      const r = page.locator(".meals-card .log-card").first();
      ok((await r.locator(".plan-mark").innerText()).trim() === tag && re.test(await r.innerText()) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${lang}: ${tag}, the buttons in the language, fits ${width} px`);
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
