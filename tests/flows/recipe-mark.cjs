// DT202 (0.3.75, board Stories174; Coach Milan 1 November 17:48, 3 November 19:22 to 19:39, Go): From the kitchen, or On paper.
// A recipe eaten from at least once says From the kitchen, with the day; one never cooked says On paper. Publishing asks I cooked
// this: the page says the same; the home page's From the kitchen shows the cooked ones only; the line about Milan says what is true.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🥣" });
const it = (rows) => rows.map(([g, f], i) => ({ id: "i" + f.id + i, grams: g, locked: false, food: f }));
const crepes = it([[200, food("pf", "Protein flour", 357, 21, 59, 2.4, 5)], [500, food("pm", "Protein milk", 51, 7.5, 5, 0.1, 0)], [180, food("eg", "Eggs", 143, 12.6, 0.7, 9.5, 0)]]);
const salmon = it([[180, food("sa", "Salmon fillet, raw", 208, 20, 0, 13, 0)], [150, food("rc", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3)]]);
seed.items = [];
seed.meals = [{ id: "m-cr", title: "Protein crepes", items: crepes, portion: 880, savedAt: "2026-10-07T10:00:00Z" }, { id: "m-sa", title: "Salmon and rice", items: salmon, portion: 330, savedAt: "2026-10-20T10:00:00Z" }];
seed.feedback = [{ id: "fb1", meal: seed.meals[0], recipeId: "m-cr", status: "eaten", taste: "Good", notes: "", createdAt: "2026-10-08T12:00:00Z" }];
const PORT = "3398", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript((s) => { if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1"); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-coach", "1");
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
    await require("./adult.cjs")(page);
    await page.goto(U + "/today"); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(600);
    const tile = (t) => page.locator(".recipe-tile").filter({ hasText: t });
    ok(await tile("Protein crepes").locator(".tile-mark.cooked").textContent() === "From the kitchen", "a recipe eaten from once: From the kitchen on its tile");
    ok(await tile("Salmon and rice").locator(".tile-mark.paper").textContent() === "On paper", "a recipe never cooked: On paper");
    await tile("Salmon and rice").click(); await page.waitForTimeout(500);
    ok(/^On paper/.test(await page.locator(".rq-mark").textContent()) && /not cooked yet\. Cook it once, to the end of Eat, and it says From the kitchen\./.test(await page.locator(".rq-mark").textContent()), "its page: On paper, and what makes it From the kitchen");
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(400);
    await tile("Protein crepes").click(); await page.waitForTimeout(500);
    ok(/From the kitchen/.test(await page.locator(".rq-mark").textContent()) && /Cooked first on 8 October/.test(await page.locator(".rq-mark").textContent()), "the cooked one says when it was first cooked");
    // ---- publishing: I cooked this ----
    await page.locator(".rq-pub").getByRole("button", { name: "Publish", exact: true }).click(); await page.waitForTimeout(500);
    const sheet = page.locator(".publish-sheet");
    const box = sheet.locator(".pub-cooked input");
    ok(await box.count() === 1 && await box.isChecked(), "the sheet asks I cooked this, on for a recipe with a cook of its own");
    await sheet.locator(".publish-ways").getByRole("button", { name: /^Publish/ }).click(); await page.waitForTimeout(1500);
    const list = await page.evaluate(async () => (await (await fetch("/api/recipes?limit=3&cooked=1")).json()).recipes);
    ok(list.length === 1 && list[0].title === "Protein crepes" && list[0].cooked === true, "the page keeps it: the home page's From the kitchen gets it");
    const pg = await ctx.newPage();
    await pg.goto(U + "/r/" + list[0].slug); await pg.waitForTimeout(900);
    ok(/From the kitchen/.test(await pg.locator(".rp-mark").first().textContent()), "the public page says From the kitchen");
    await pg.goto(U + "/?home"); await pg.waitForTimeout(1200);
    const behind = await pg.locator(".l-behind").textContent();
    ok(/The ones he has cooked are marked From the kitchen; the numbers come from labels and food tables\./.test(behind) && !/tried on himself/.test(behind), "the line about Milan says what is true");
    ok(await pg.locator(".l-kitchen .rp-rcard").count() === 1 && /From the kitchen/.test(await pg.locator(".l-kitchen .rp-rcard").textContent()), "the home page shows the cooked recipe, marked");
    await ctx.close();
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.slice(0, 2).join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all passed"); process.exit(fail ? 1 : 0);
})();
