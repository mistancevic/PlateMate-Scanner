// JOURNEY INVARIANT (Milan, 18 October 2026, 21:08 to 22:11, story R16 on canvas board RS15): see the dish and its PD first;
// nothing breaks the layout. Reading a recipe shows the dish's picture on top (the page's own photo from a link, your first
// screenshot from screenshots), for you only, never published; then where it came from; then the PD block, the same as on the
// Plate, in place of a small line. On the recipe page the PD block sits under Where it came from. The Nutrition table has one
// set of columns for the whole card: every number sits under its heading and none leaves the card. Never rewrite these lines
// to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const ICON = fs.readFileSync(path.join(ROOT, "public/icon-192.png"));
const it = (name, written, grams, role, calories, protein, fats, carbs, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats, carbs, optional: false, part });
const PHOTO = "https://img.example.com/fritters.png";
const read = { url: "https://example.com/apple-fritters/", photo: PHOTO, recipe: { title: "Deliciously Moist Apple Fritters with Brown Butter Glaze", source: "Sally McKenney, Sally's Baking Addiction", servings: 12, servingsUnit: "fritters", servingsHow: "recipe", stated: null, steps: ["Mix the dough.", "Fry in batches."], items: [
  it("All-purpose flour", "4 1/2 cups (563g)", 563, "carb", 364, 10, 1, 76, "Dough"), it("Whole milk", "1 cup", 240, "dairy", 61, 3.2, 3.3, 4.8, "Dough"),
  it("Granulated sugar", "1/2 cup", 100, "sweet", 387, 0, 0, 100, "Dough"), it("Apples, peeled and diced", "3 cups", 360, "fruit", 52, 0.3, 0.2, 14, "Filling"),
  it("Confectioners' sugar", "3 cups", 360, "sweet", 389, 0, 0, 100, "Glaze")] } };
const U = "http://127.0.0.1:3233";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3233", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (state) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-18T19:00:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      localStorage.setItem("seeded", "1"); }, state);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("https://img.example.com/**", (r) => r.fulfill({ status: 200, contentType: "image/png", body: ICON }));
    return page;
  };
  // every number column lines up across the rows, and no row runs past the card
  const tableFits = (page, scope) => page.evaluate((scope) => {
    const card = document.querySelector(`${scope} .nt-card`); if (!card) return "no table";
    const rows = [...card.querySelectorAll(".nt-row")];
    const rights = rows.map((r) => [...r.children].slice(1).map((c) => Math.round(c.getBoundingClientRect().right)));
    const same = rights.every((x) => JSON.stringify(x) === JSON.stringify(rights[0]));
    const inside = rows.every((r) => r.scrollWidth <= r.clientWidth + 1) && rows.every((r) => [...r.children].every((c) => c.getBoundingClientRect().right <= card.getBoundingClientRect().right + 1));
    return same && inside ? "ok" : JSON.stringify({ same, inside, rights });
  }, scope);
  const before = (page, a, bSel) => page.evaluate(([a, bSel]) => { const x = document.querySelector(a), y = document.querySelector(bSel); return !!x && !!y && Boolean(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING); }, [a, bSel]);
  try {
    // ---- a link: the page's photo, then where it came from, then PD ----
    const page = await open(seed);
    await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }));
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
    await page.getByLabel("Link to a recipe").fill(read.url);
    await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(1000);
    ok(await page.locator(".in-card .in-picture").getAttribute("src") === PHOTO && await page.locator(".in-card .in-picture").evaluate((i) => i.naturalWidth > 0), "the read shows the page's photo of the dish on top");
    ok(await before(page, ".in-card .in-picture", ".in-card .rq-readout") && /One fritter/.test(await page.locator(".in-card .rq-readout").textContent()) && /PD/.test(await page.locator(".in-card .rq-readout").textContent()), "then where it came from, then the PD block for one fritter");
    ok(!/One fritter: \d/.test(await page.locator(".in-card").textContent()), "the small PD line is gone");
    ok(/Sally's Baking Addiction/.test(await page.locator(".in-card").textContent()) && !/&#039;/.test(await page.locator(".in-card").textContent()), "where it came from reads as letters");
    const readFit = await tableFits(page, ".in-card"); ok(readFit === "ok", "the read's Nutrition table: numbers line up, none leaves the card " + readFit);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
    const recipe = st.meals.find((m) => /Apple Fritters/.test(m.title));
    ok(recipe?.source?.photo === PHOTO, "the recipe keeps the page's photo with where it came from, for you only");
    // ---- the recipe page: PD under Where it came from; the table fits ----
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
    await page.locator(".recipe-tile").first().click(); await page.waitForTimeout(900);
    ok(await page.locator(".rq-readout").count() === 1 && await before(page, ".rq-readout", ".rq-foods") && /Where it came from/.test(await page.locator(".rq-readout").evaluate((r) => r.previousElementSibling?.textContent ?? "")), "the recipe page: PD right under Where it came from, before the foods");
    const pageFit = await tableFits(page, ""); ok(pageFit === "ok", "the recipe page's Nutrition table: numbers line up, none leaves the card " + pageFit);
    await page.context().close();
    // ---- screenshots: the first screenshot is the picture ----
    const p2 = await open(seed);
    await p2.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipe: read.recipe }) }));
    await p2.goto(U + "/plate"); await p2.waitForTimeout(1300);
    await p2.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: ICON }]);
    await p2.waitForTimeout(600); await p2.getByRole("button", { name: "Read it" }).click(); await p2.waitForTimeout(900);
    ok(/^data:image\//.test(await p2.locator(".in-card .in-picture").getAttribute("src")), "from screenshots, the first screenshot is the picture");
    await p2.context().close();
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
