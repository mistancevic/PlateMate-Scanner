// DT285 (0.3.139, board Stories212; Coach Milan 12 November 09:44, Go): a meal about to be saved as eaten with a photo that a
// meal of that same day already has asks first. The Plate's Did you eat it?: Update that meal keeps one record at its own time
// with the plate's amounts; Keep both saves a second meal; Back saves nothing; a photo from another day asks nothing.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const F = (id) => seed.foods.find((f) => f.id === id);
const it = (id, food, grams) => ({ id, food: F(food), grams, locked: false });
const PIC = "/landing/hero/quesadilla-m.webp";
const recipe = { id: "m-s", title: "Egg sandwiches", items: [it("a", "f-bread", 100), it("b", "f-egg", 184), it("c", "f-chicken", 40)], portion: 324, steps: ["Toast the bread."], savedAt: "2026-11-05T10:00:00Z" };
const logged = (at) => ({ id: "c1", meal: { ...recipe, items: [it("a1", "f-bread", 100), it("b1", "f-egg", 250), it("c1x", "f-chicken", 93)], portion: 443 }, recipeId: "m-s", status: "eaten", taste: "", notes: "", createdAt: at, photo: PIC, slot: { date: at.slice(0, 10), slotId: "breakfast", name: "Breakfast", time: "08:00" } });
const plate = { items: [it("p1", "f-bread", 50), it("p2", "f-egg", 92), it("p3", "f-chicken", 20)], title: "Egg sandwiches", fromRecipe: "m-s", photo: { image: PIC, at: "2026-11-11T20:10:00.000Z" } };
const PORT = "3502", U = `http://127.0.0.1:${PORT}`;
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
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: { ...seed, meals: [recipe], feedback: cards, ...plate }, lang });
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + "/plate"); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const st = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const ateIt = (page) => page.locator(".chef-ask").getByRole("button", { name: "Ate it", exact: true });
  const Y = "2026-11-11T09:08:00.000Z";
  try {
    // ---- Update that meal ----
    let { ctx, page } = await open([logged(Y)]);
    ok(await ateIt(page).count() === 1, "the Plate asks about yesterday's plate: Did you eat it?");
    await ateIt(page).click(); await page.waitForTimeout(500);
    const ask = page.locator(".same-ask");
    ok(await ask.count() === 1 && /This photo is already a meal of Wednesday\./.test(await ask.innerText()), "Ate it asks first: " + (await ask.innerText().catch(() => "")).replace(/\n/g, " | ").slice(0, 120));
    ok(/Wednesday, breakfast, 10:08/.test(await ask.locator(".same-meal").innerText()) && /Egg sandwiches, 443 g/.test(await ask.locator(".same-meal").innerText()), "it shows the earlier meal");
    ok((await st(page)).feedback.length === 1, "nothing saved while it asks");
    ok(await ask.locator("button").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "its buttons are 44 px or more");
    await ask.getByRole("button", { name: "Update that meal" }).click(); await page.waitForTimeout(800);
    let s = await st(page);
    ok(s.feedback.length === 1 && s.feedback[0].id === "c1" && s.feedback[0].createdAt === Y && s.feedback[0].slot.name === "Breakfast", "Update that meal: one record, its time and its meal of the day");
    ok((() => { const g = s.feedback[0].meal.items.map((x) => Math.round(x.grams)); return g[0] === 50 && g[2] === 20 && g[1] < 150; })() && s.feedback[0].photo === PIC, "it takes the plate's amounts (eggs counted as the Plate counts them); its photo stays: " + s.feedback[0].meal.items.map((x) => x.grams).join() + " " + String(s.feedback[0].photo).slice(0, 40));
    ok(s.items.length === 0 && !s.photo, "the Plate is cleared, as after Ate it");
    await ctx.close();
    // ---- Keep both ----
    ({ ctx, page } = await open([logged(Y)]));
    await ateIt(page).click(); await page.waitForTimeout(500);
    await page.locator(".same-ask").getByRole("button", { name: "Keep both" }).click(); await page.waitForTimeout(800);
    s = await st(page);
    ok(s.feedback.filter((f) => f.status === "eaten").length === 2 && s.feedback.some((f) => f.id === "c1" && f.meal.portion === 443), "Keep both: two meals, the first as it was");
    await ctx.close();
    // ---- Back ----
    ({ ctx, page } = await open([logged(Y)]));
    await ateIt(page).click(); await page.waitForTimeout(500);
    await page.locator(".same-ask").getByRole("button", { name: "Back" }).click(); await page.waitForTimeout(500);
    s = await st(page);
    ok(s.feedback.length === 1 && s.items.length === 3 && await page.locator(".same-ask").count() === 0 && await ateIt(page).count() === 1, "Back: nothing saved, the Plate asks again");
    await ctx.close();
    // ---- another day: nothing asked ----
    ({ ctx, page } = await open([logged("2026-11-10T09:08:00.000Z")]));
    await ateIt(page).click(); await page.waitForTimeout(800);
    s = await st(page);
    ok(await page.locator(".same-ask").count() === 0 && s.feedback.filter((f) => f.status === "eaten").length === 2, "the same photo on another day: saved, nothing asked");
    await ctx.close();
    // ---- Srpski and German ----
    for (const [lang, width] of [["sr-Latn", 390], ["de", 360]]) {
      ({ ctx, page } = await open([logged(Y)], width, lang));
      await page.locator(".chef-ask .ca-go .pill-primary").first().click(); await page.waitForTimeout(500);
      const t = await page.locator(".same-ask").innerText();
      ok(!/This photo|Update that meal|Keep both|Back\b|Wednesday/.test(t) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${lang}: in the language, fits ${width} px: ` + t.replace(/\n/g, " | ").slice(0, 110));
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
