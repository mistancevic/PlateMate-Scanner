// JOURNEY INVARIANT (Milan, 7 October 2026, canvas boards R0 to R7): a coach publishes a recipe from the app: a photo, two
// lines, how many it makes, the steps, who sees it; the checks say high protein only at 20 % of the energy. The page at
// /r/<name> shows the photo, the numbers for one serving, PD, the goals it fits, the ingredients and steps, the nutrition;
// a visitor gets Ask for an invite where a member gets their amounts. /recipes lists it; a shared link previews the recipe.
// The Instagram images come from the same numbers. Never rewrite these lines to fit a change.
// Changed with Milan, 8 October 2026 (boards RG0 to RG4 and RF4): what is typed in the sheet is kept with the recipe as a
// draft, never public; See the page shows the page before anything goes live; everyone sees a recipe (no Who sees it); the
// steps stay with the recipe in the app; the page says From <first name>'s kitchen; only goals it truly fits get a tick;
// protein with one decimal. Unpublish takes it down: the link says This recipe was taken down and shows the others, the
// list leaves it out, and Publish again brings it back on the same link. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const jpg = "data:image/jpeg;base64," + fs.readFileSync(path.resolve(__dirname, "front.jpg")).toString("base64");
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🥣" });
const items = [[200, food("pf", "Protein flour", 357, 21, 59, 2.4, 5)], [500, food("pm", "Protein milk", 51, 7.5, 5, 0.1, 0)], [180, food("eg", "Eggs", 143, 12.6, 0.7, 9.5, 0)], [50, food("ms", "Mascarpone", 379, 3.4, 3.4, 39, 0)]].map(([g, f], i) => ({ id: "i" + i, grams: g, locked: false, food: f }));
seed.items = [];
seed.meals = [{ id: "m-crepes", title: "High protein crepes", items, portion: 930, savedAt: "2026-10-07T10:00:00Z" }];
seed.feedback = [{ id: "fb1", meal: seed.meals[0], status: "eaten", taste: "DaaM good", notes: "", createdAt: "2026-10-07T12:00:00Z", photo: jpg }];
const dl = process.argv[2] || null;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3188", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-coach", "1"); sessionStorage.setItem("seeded", "1"); } localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3188/"); await page.waitForTimeout(900);
    const myRecipes = async () => { await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(300); await page.getByRole("tab", { name: "My recipes" }).click(); await page.waitForTimeout(400); };
    await myRecipes();
    await page.getByRole("button", { name: "Publish", exact: true }).click(); await page.waitForTimeout(400);
    let sheet = page.locator(".publish-sheet");
    ok(await sheet.locator(".publish-photo:not(.add)").count() === 1, "the plate photo from the card is offered, and only that");
    ok(await sheet.getByText("Who sees it").count() === 0, "no Who sees it: everyone sees a recipe");
    await sheet.getByLabel("Two lines about it").fill("Thin, soft, and they roll without breaking.");
    await sheet.locator(".makes input").first().fill("12"); await sheet.getByLabel("What one serving is called").fill("crepe");
    await sheet.getByLabel("Time, minutes").fill("35");
    await sheet.getByLabel(/Steps, one per line/).fill("Whisk the eggs, the milk and the mascarpone.\nAdd the flour, rest 15 minutes.\nA thin layer in a hot pan, a minute a side.");
    await page.waitForTimeout(900);
    const checks = await sheet.locator(".publish-checks").textContent();
    ok(/High protein: 29 %/.test(checks) && /DaaM good/.test(checks) && /One crepe: 118 kcal/.test(checks), "the checks: high protein at 29 %, the rating, one crepe: " + checks.replace(/\s+/g, " "));
    // a draft: close, come back, it is all there; nothing is live
    await sheet.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(400);
    const row = page.locator(".recipe-row").filter({ hasText: "High protein crepes" });
    ok(/Draft/.test(await row.locator(".pub-state").textContent()), "My recipes: the recipe is a Draft");
    ok(/Steps \(3\)/.test(await row.textContent()), "the steps stay with the recipe in the app");
    ok((await page.evaluate(async () => (await fetch("/api/recipes/high-protein-crepes")).status)) === 404, "a draft is not on the site");
    await row.getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(400);
    sheet = page.locator(".publish-sheet");
    ok((await sheet.getByLabel("Two lines about it").inputValue()) === "Thin, soft, and they roll without breaking.", "the draft came back as it was typed");
    // See the page, before anything is live
    await sheet.getByRole("button", { name: "See the page" }).click(); await page.waitForTimeout(500);
    const pv = page.locator(".rp-preview");
    const pvText = (await pv.textContent()).replace(/\s+/g, " ");
    ok(/only you see this/.test(pvText) && /Nothing is live yet/.test(pvText) && /High protein crepes/.test(pvText) && /8\.7 g/.test(pvText), "See the page: the page as a visitor will see it, nothing live yet, protein 8.7 g");
    ok(/From our kitchen|From \w+'s kitchen/.test(pvText), "the byline says whose kitchen: " + (pvText.match(/From [^·]*kitchen/) || [""])[0]);
    if (dl) await page.screenshot({ path: path.join(dl, "preview.png") });
    await pv.locator(".rp-preview-bar").getByRole("button", { name: "Publish", exact: true }).click(); await page.waitForTimeout(1200);
    ok(await page.locator(".rp-preview").count() === 0 && /r\/high-protein-crepes/.test(await sheet.locator(".publish-link").textContent()), "published from the preview, with its link");
    const downloads = []; page.on("download", (d) => downloads.push(d));
    await sheet.getByRole("button", { name: /The Instagram images/ }).click(); await page.waitForTimeout(4000);
    ok(downloads.length === 5, "five images: four for the carousel, one for the reel: " + downloads.length);
    if (dl) for (const d of downloads) await d.saveAs(path.join(dl, d.suggestedFilename()));
    // the page, as a visitor sees it (no accounts here)
    await page.goto("http://127.0.0.1:3188/r/high-protein-crepes"); await page.waitForTimeout(1200);
    const body = await page.locator(".rp").textContent();
    ok(/High protein crepes/.test(body) && /118kcal/.test(body.replace(/\s/g, "")) && /PD 7\.3/.test(body) && /8\.7 g/.test(body), "the page: name, kcal, protein 8.7 g and PD for one crepe");
    const chips = await page.locator(".rp-fits .rp-chip").allTextContents();
    ok(chips.join(",") === "✓ Lose fat", "a tick only for the goal it truly fits, not for just above: " + chips.join(", "));
    ok(await page.locator(".rp-daam").count() === 1, "DaaM good on the photo");
    ok(await page.evaluate(async () => (await fetch("/r/high-protein-crepes/photo.jpg")).status) === 200, "its photo is served");
    ok(/Ask for an invite/.test(body) && /Protein flour/.test(body) && /Whisk the eggs/.test(body), "a visitor: the recipe, the steps, and Ask for an invite for the amounts");
    if (dl) await page.screenshot({ path: path.join(dl, "page.png"), fullPage: true });
    const html = await page.evaluate(async () => (await fetch("/r/high-protein-crepes")).text());
    ok(/og:title" content="High protein crepes · Chef Mealan"/.test(html) && /og:image" content="[^"]*\/r\/high-protein-crepes\/photo\.jpg"/.test(html), "a shared link previews the recipe and its photo");
    await page.goto("http://127.0.0.1:3188/recipes"); await page.waitForTimeout(900);
    ok(await page.locator(".rp-rcard").filter({ hasText: "High protein crepes" }).count() === 1, "All recipes lists it");
    // Unpublish: taken down
    await page.goto("http://127.0.0.1:3188/"); await page.waitForTimeout(900);
    await myRecipes();
    const row2 = page.locator(".recipe-row").filter({ hasText: "High protein crepes" });
    ok(/Live/.test(await row2.locator(".pub-state").textContent()), "My recipes: Live");
    await row2.getByRole("button", { name: "Change it" }).click(); await page.waitForTimeout(400);
    await page.locator(".publish-sheet").getByRole("button", { name: /Unpublish/ }).click(); await page.waitForTimeout(800);
    ok(/Taken down/.test(await page.locator(".publish-sheet .pub-state").textContent()), "Unpublish: the sheet says Taken down");
    await page.locator(".publish-sheet").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(300);
    ok(/Taken down/.test(await row2.locator(".pub-state").textContent()), "My recipes: Taken down");
    if (dl) await page.screenshot({ path: path.join(dl, "myrecipes.png") });
    await page.goto("http://127.0.0.1:3188/r/high-protein-crepes"); await page.waitForTimeout(1200);
    ok(/This recipe was taken down/.test(await page.locator(".rp").textContent()), "the old link says the recipe was taken down");
    if (dl) await page.screenshot({ path: path.join(dl, "down.png") });
    ok(await page.evaluate(async () => { const r = await fetch("/r/high-protein-crepes"); const t = await r.text(); return r.status === 410 && /noindex/.test(t); }), "search engines are told it's gone");
    ok(await page.evaluate(async () => (await (await fetch("/api/recipes")).json()).recipes.every((r) => r.slug !== "high-protein-crepes")), "All recipes leaves it out");
    // Publish again: the same link
    await page.goto("http://127.0.0.1:3188/"); await page.waitForTimeout(900);
    await myRecipes();
    await page.locator(".recipe-row").filter({ hasText: "High protein crepes" }).getByRole("button", { name: "Publish again" }).click(); await page.waitForTimeout(400);
    await page.locator(".publish-sheet").getByRole("button", { name: "Publish again" }).click(); await page.waitForTimeout(1200);
    ok(await page.evaluate(async () => (await fetch("/api/recipes/high-protein-crepes")).status) === 200, "Publish again: live on the same link");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
