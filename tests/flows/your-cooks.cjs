// DT282 (0.3.135, board Stories209; Coach Milan 11 November 20:45 to 21:40, Go): Your cooks leads to the cook. A tap on a
// cook's photo opens that cook: its photos, the foods as they were, when and how it tasted, your words. Add to the recipe's
// photos puts the photo shown into the gallery (the cover is chosen there); a photo already there says so. The row of
// photos offered from the cooks under the gallery is gone. Srpski and German fit.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3493", U = `http://127.0.0.1:${PORT}`;
const pic = (f) => "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "tests/flows", f)).toString("base64");
const A = pic("plate.jpg"), B = pic("front.jpg");
const F = (id) => seed.foods.find((f) => f.id === id);
const meal = { id: "m-s", title: "Egg sandwiches", items: [{ id: "a", food: F("f-bread"), grams: 100, locked: false }, { id: "b", food: F("f-egg"), grams: 208, locked: false }], portion: 308, steps: [], savedAt: "2026-11-10T10:00:00Z", photo: A, photos: [] };
const cards = [
  { id: "c1", meal: { ...meal, photo: undefined, photos: undefined }, recipeId: "m-s", status: "eaten", taste: "Good", notes: "More pepper next time.", createdAt: "2026-11-11T19:30:00Z", photo: B, coverAsk: "kept" },
  { id: "c2", meal: { ...meal, photo: undefined, photos: undefined }, recipeId: "m-s", status: "eaten", taste: "DaaM good", notes: "", createdAt: "2026-11-08T08:10:00Z", photo: A, coverAsk: "used" },
];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang = "en", width = 390) => {
    const ctx = await b.newContext({ viewport: { width, height: 1400 }, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: { ...seed, meals: [meal], feedback: cards }, lang });
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + "/my-recipes/m-s"); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  try {
    let { ctx, page } = await open();
    const own = () => page.evaluate(() => { const m = JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals[0]; return m.photoSigs ? m.photoSigs.filter(Boolean).length : [m.photo, ...(m.photos || [])].filter(Boolean).length; });
    ok(await page.locator(".rq-offer").count() === 0, "no row of photos offered from the cooks under the gallery");
    const cooks = page.locator(".rq-cooks");
    ok(await cooks.locator("button.rc-photo").count() === 2 && /Tap a photo to open that cook/.test(await cooks.textContent()), "Your cooks: each photo is a button, and the block says what a tap does");
    ok(await cooks.locator("button.rc-photo").evaluateAll((a) => a.every((x) => x.getBoundingClientRect().height >= 44)), "each photo is 44 px or more");
    await cooks.locator("button.rc-photo").first().click(); await page.waitForTimeout(500);
    const pm = page.locator(".rq-cook .past-meal");
    const when = await pm.locator(".pm-when").textContent();
    ok(await pm.count() === 1 && /Wednesday,? 11 November, \d\d:\d\d · Good/.test(when) && /Your words: More pepper next time\./.test(await pm.textContent()), "the cook opens: when, how it tasted, your words");
    ok(await pm.locator(".pm-food").count() === 2 && await pm.locator(".pm-photo").getAttribute("src") === B, "its photo large and the foods as they were");
    const add = pm.getByRole("button", { name: "Add to the recipe's photos" });
    ok(await add.count() === 1 && /It goes into the recipe's gallery\. The cover is chosen there\./.test(await pm.textContent()) && await own() === 1, "Add to the recipe's photos, and what it does");
    await add.click(); await page.waitForTimeout(500);
    ok(await own() === 2 && /In the recipe's photos/.test(await pm.textContent()) && await pm.getByRole("button", { name: "Add to the recipe's photos" }).count() === 0, "added: the gallery has two photos; the cook says In the recipe's photos");
    await pm.locator(".pm-back").click(); await page.waitForTimeout(500);
    ok(await page.locator(".rq-cook").count() === 0 && await page.locator(".rq-thumbs .rq-thumb").count() === 2, "back on the recipe page: the gallery has it, the cover unchanged");
    // the older cook: its photo is the cover already
    await page.locator(".rq-cooks button.rc-photo").nth(1).click(); await page.waitForTimeout(500);
    ok(/In the recipe's photos/.test(await page.locator(".rq-cook").textContent()), "a cook whose photo is already in the gallery says so");
    await ctx.close();
    for (const [l, wdt] of [["sr-Latn", 390], ["de", 360]]) {
      ({ ctx, page } = await open(l, wdt));
      await page.locator(".rq-cooks button.rc-photo").first().click(); await page.waitForTimeout(500);
      const t = await page.locator(".rq-cook").textContent();
      ok(!/Add to the recipe's photos|Your words|It goes into/.test(t) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${l}: the cook in the language, fits ${wdt} px`);
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
