// 0.3.134 (Coach Milan 11 November 20:42 to 20:57, on a call with a tester; Go 20:46). On her recipe: (1) a recipe with no photo
// of its own takes its latest cook's photo as its cover, by itself; a cover you delete does not come back from that cook.
// (2) A recipe with no photo at all has one place to add one (the card), not three. (3) A pack's piece with no name of its
// own says piece in the language, no English s, decimals in the language. (4) In Edit, eggs are counted. (5) The food
// buttons under the steps say the amount as the step does (4 eggs (M)). (6) A tap on a food that is in a step takes it out.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3494", U = `http://127.0.0.1:${PORT}`;
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg")).toString("base64");
const F = (id) => seed.foods.find((f) => f.id === id);
const bread = { ...F("f-bread"), id: "f-rog", name: "Roggen Vollkornbrot", serving: { name: "1", grams: 50 } };
const salad = { ...F("f-bread"), id: "f-sal", name: "Orijenta salata", calories: 20, protein: 1, carbs: 3, fats: 0.2, fiber: 1, serving: { name: "1", grams: 30 } };
const sandwich = { id: "m-s", title: "Sendviči sa jajima", items: [{ id: "a", food: bread, grams: 100, locked: false }, { id: "b", food: F("f-egg"), grams: 208, locked: false }, { id: "c", food: salad, grams: 20, locked: false }], portion: 328, steps: [], savedAt: "2026-11-11T10:00:00Z" };
const bare = { id: "m-bare", title: "Oats bowl", items: [{ id: "d", food: F("f-oats"), grams: 60, locked: false }], portion: 60, steps: [], savedAt: "2026-11-11T10:00:00Z" };
const card = { id: "c1", meal: { ...sandwich }, recipeId: "m-s", status: "eaten", taste: "Good", notes: "", createdAt: "2026-11-11T19:30:00Z", photo: PHOTO };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (at, lang = "en") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: { ...seed, meals: [sandwich, bare], feedback: [card] }, lang });
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + at); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const st = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  try {
    let { ctx, page } = await open("/my-recipes/m-s");
    // (1) the cook's photo is the cover
    let s = await st(page), m = s.meals.find((x) => x.id === "m-s");
    ok((m.photo === PHOTO || (m.photoSigs || []).filter(Boolean).length === 1) && s.feedback[0].coverAsk === "used", "(1) the recipe with no photo took its cook's photo as its cover; the cook is marked used");
    ok(await page.locator(".rq-hero img").count() === 1 && /Cover/.test(await page.locator(".rq-hero").textContent()) && await page.locator(".rq-hero-empty").count() === 0, "(1) the page opens with the photo large, as the cover");
    // deleted, it does not come back
    await page.locator(".rq-thumbs .publish-photo:not(.add)").first().click(); await page.locator(".rq-gal-del").click(); await page.locator(".rq-gal-del").click(); await page.waitForTimeout(800);
    s = await st(page); m = s.meals.find((x) => x.id === "m-s");
    ok(!m.photo && !(m.photoSigs || []).some(Boolean), "(1) a cover you delete does not come back from that cook");
    // (3) pieces in English
    const amounts = await page.locator(".rq-food").allTextContents();
    ok(amounts.some((t) => /Roggen Vollkornbrot\s*2 pieces/.test(t)) && !amounts.some((t) => /1s\b/.test(t)), "(3) a piece with no name says 2 pieces, not 2 1s: " + amounts.join(" | ").slice(0, 120));
    // (4) Edit: eggs counted
    await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(400);
    const eggRow = page.locator(".rq-food").filter({ hasText: "Eggs" });
    ok(await eggRow.locator(".ct-step").count() === 1 && /4 eggs/.test(await eggRow.textContent()) && await eggRow.locator("input").count() === 0, "(4) in Edit, eggs are counted: 4 eggs, with − and +");
    await eggRow.locator(".ct-step button").last().click(); await page.waitForTimeout(200);
    ok(/5 eggs/.test(await eggRow.textContent()), "(4) + makes it 5 eggs");
    await eggRow.locator(".ct-step button").first().click(); await page.waitForTimeout(200);
    // (5) the food buttons under the steps say the count
    await page.getByRole("textbox", { name: "Step 1" }).click().catch(() => {});
    const chips = await page.locator(".st-chip").allTextContents();
    ok(chips.some((t) => /^\+ 4 eggs/.test(t.trim())) && !chips.some((t) => /208 g Eggs/.test(t)), "(5) the button says + 4 eggs (M), not 208 g Eggs: " + chips.join(" | "));
    // (6) put the bread in the step, then take it out again with the same button
    await page.getByRole("textbox", { name: "Step 1" }).fill("Toast "); await page.locator(".st-chip").filter({ hasText: "Roggen" }).click(); await page.waitForTimeout(200);
    ok(await page.getByRole("textbox", { name: "Step 1" }).locator("[data-item]").count() === 1 && /^✓/.test((await page.locator(".st-chip").filter({ hasText: "Roggen" }).textContent()).trim()), "(6) the bread is in the step; its button says ✓");
    await page.locator(".st-chip").filter({ hasText: "Roggen" }).click(); await page.waitForTimeout(200);
    ok(await page.getByRole("textbox", { name: "Step 1" }).locator("[data-item]").count() === 0 && /^\+/.test((await page.locator(".st-chip").filter({ hasText: "Roggen" }).textContent()).trim()), "(6) a tap on ✓ takes it out of the step; the button says + again");
    await page.getByRole("button", { name: "+ Add a step" }).click(); await page.waitForTimeout(200);
    await page.locator(".st-chip").filter({ hasText: "Eggs" }).click(); await page.waitForTimeout(200);
    await page.locator(".st-chip").filter({ hasText: /eggs/ }).click(); await page.waitForTimeout(200);
    ok(await page.locator("[data-item]").count() === 0, "(6) a food in a step is never put in a second time by its ✓ button");
    await ctx.close();
    // (2) a recipe with no photo at all: one place to add one
    ({ ctx, page } = await open("/my-recipes/m-bare"));
    const card2 = await page.locator(".rq-nopic").count();
    ok(card2 === 0 || (await page.locator(".rq-hero-empty").count() === 0 && !(await page.locator(".rq-thumbs").isVisible())), `(2) no photo: ${card2 ? "the card is the one place to add one, no empty box, no Add tile" : "the empty box is the one place to add one"}`);
    ok(await page.locator(".rq-hero-empty, .rq-nopic").count() === 1, "(2) exactly one place to add a photo");
    await ctx.close();
    // (3) in Srpski: kom., a comma
    ({ ctx, page } = await open("/my-recipes/m-s", "sr-Latn"));
    const sr = (await page.locator(".rq-food").allTextContents()).join(" | ");
    ok(/2 kom\./.test(sr) && /0,7 kom\./.test(sr) && !/1s\b|0\.7/.test(sr), "(3) Srpski: 2 kom. and 0,7 kom.: " + sr.slice(0, 140));
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
