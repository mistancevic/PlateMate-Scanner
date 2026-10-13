// JOURNEY INVARIANT (Milan, 7 October 2026, canvas boards R0 to R7): a coach publishes a recipe from the app: a photo, two
// lines, how many it makes, the steps, who sees it; the checks say high protein only at 20 % of the energy. The page at
// /r/<name> shows the photo, the numbers for one serving, PD, the goals it fits, the ingredients and steps, the nutrition;
// a visitor gets Try Chef Mealan where a member gets their amounts. /recipes lists it; a shared link previews the recipe.
// The Instagram images come from the same numbers. Never rewrite these lines to fit a change. R12 (0.2.5+r13): Published band, the button sleeps until a change, Changes not published yet.
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
    const myRecipes = async () => { await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500); };
    // 0.2.5+r11 (board S3, R7 to R10): a tile opens the recipe's page; publishing lives on the page, under On chefmealan.com
    const openRecipe = async (t) => { if (await page.locator(".rq").count()) return; await page.locator(".recipe-tile").filter({ hasText: t }).click(); await page.waitForTimeout(400); };
    const pageState = () => page.locator(".rq-pub .pub-state").textContent();
    await myRecipes(); await openRecipe("High protein crepes");
    await page.locator(".rq-pub").getByRole("button", { name: "Publish", exact: true }).click(); await page.waitForTimeout(400);
    let sheet = page.locator(".publish-sheet");
    ok(await sheet.locator(".publish-photo:not(.add)").count() === 1, "the plate photo from the card is offered, and only that");
    ok(await sheet.getByText("Who sees it").count() === 0, "no Who sees it: everyone sees a recipe");
    await sheet.getByLabel("Two lines about it").fill("Thin, soft, and they roll without breaking.");
    await sheet.locator(".makes input").first().fill("12"); await sheet.getByLabel("What one serving is called").fill("crepe");
    await sheet.getByLabel("Time, minutes").fill("35");
    // R13 (0.2.5+r16): one field per step; Enter starts the next
    const stepLines = ["Whisk the eggs, the milk and the mascarpone.", "Add the flour, rest 15 minutes.", "A thin layer in a hot pan, a minute a side."];
    for (const [k, t] of stepLines.entries()) {
      const f = sheet.getByRole("textbox", { name: `Step ${k + 1}` });
      await f.fill(t); if (k < stepLines.length - 1) { await f.press("End"); await f.press("Enter"); await page.waitForTimeout(120); }
    }
    await page.waitForTimeout(900);
    const checks = await sheet.locator(".publish-checks").textContent();
    ok(/High protein: 29 %/.test(checks) && /DaaM good/.test(checks) && /One crepe: 118 kcal/.test(checks), "the checks: high protein at 29 %, the rating, one crepe: " + checks.replace(/\s+/g, " "));
    // a draft: close, come back, it is all there; nothing is live
    await sheet.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(400);
    ok(/Draft/.test(await pageState()), "the recipe's page: the recipe is a Draft");
    ok(await page.locator(".rq-steps li").count() === 3, "the steps stay with the recipe in the app");
    ok((await page.evaluate(async () => (await fetch("/api/recipes/high-protein-crepes")).status)) === 404, "a draft is not on the site");
    await page.locator(".rq-pub").getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(400);
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
    const nut = await page.locator(".rp-card").filter({ hasText: "Nutrition" }).locator(".rp-3 > span").allTextContents();
    ok(nut.join(",") === "Energy,Fat,Carbohydrate,Fibre,Protein", "the nutrition table in the EU order: " + nut.join(", "));
    const chips = await page.locator(".rp-fits .rp-chip").allTextContents();
    ok(chips.join(",") === "✓ Lose fat", "a tick only for the goal it truly fits, not for just above: " + chips.join(", "));
    ok(await page.locator(".rp-daam").count() === 1, "DaaM good on the photo");
    ok(await page.evaluate(async () => (await fetch("/r/high-protein-crepes/photo.jpg")).status) === 200, "its photo is served");
    ok(/Try Chef Mealan/.test(body) && /Protein flour/.test(body) && /Whisk the eggs/.test(body), "a visitor: the recipe, the steps, and Try Chef Mealan for the amounts");
    if (dl) await page.screenshot({ path: path.join(dl, "page.png"), fullPage: true });
    const html = await page.evaluate(async () => (await fetch("/r/high-protein-crepes")).text());
    ok(/og:title" content="High protein crepes · Chef Mealan"/.test(html) && /og:image" content="[^"]*\/r\/high-protein-crepes\/photo\.jpg"/.test(html), "a shared link previews the recipe and its photo");
    await page.goto("http://127.0.0.1:3188/recipes"); await page.waitForTimeout(900);
    ok(await page.locator(".rp-rcard").filter({ hasText: "High protein crepes" }).count() === 1, "All recipes lists it");
    // Unpublish: taken down
    await page.goto("http://127.0.0.1:3188/"); await page.waitForTimeout(900);
    await myRecipes();
    const row2 = page.locator(".recipe-tile").filter({ hasText: "High protein crepes" });
    ok(/Live on chefmealan\.com/.test(await row2.locator(".tile-state").textContent()), "My recipes: Live on chefmealan.com");
    await openRecipe("High protein crepes");
    ok(await page.locator(".rq-pub").getByRole("link", { name: "See live page" }).count() === 1, "R10: See live page");
    ok(await page.locator(".rq-pub .pub-pending").count() === 0, "R12c: right after Publish nothing is waiting to be published " + (await page.locator(".rq-pub .pub-pending").getAttribute("title").catch(() => "")));
    await page.locator(".rq-pub").getByRole("button", { name: "Change live page" }).click(); await page.waitForTimeout(400);
    await page.locator(".publish-sheet").getByRole("button", { name: /Unpublish/ }).click(); await page.waitForTimeout(800);
    ok(/Taken down/.test(await page.locator(".publish-sheet .pub-state").textContent()), "Unpublish: the sheet says Taken down");
    await page.locator(".publish-sheet").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(300);
    ok(/Taken down/.test(await pageState()), "the recipe's page: Taken down");
    if (dl) await page.screenshot({ path: path.join(dl, "myrecipes.png") });
    await page.goto("http://127.0.0.1:3188/r/high-protein-crepes"); await page.waitForTimeout(1200);
    ok(/This recipe was taken down/.test(await page.locator(".rp").textContent()), "the old link says the recipe was taken down");
    if (dl) await page.screenshot({ path: path.join(dl, "down.png") });
    ok(await page.evaluate(async () => { const r = await fetch("/r/high-protein-crepes"); const t = await r.text(); return r.status === 410 && /noindex/.test(t); }), "search engines are told it's gone");
    ok(await page.evaluate(async () => (await (await fetch("/api/recipes")).json()).recipes.every((r) => r.slug !== "high-protein-crepes")), "All recipes leaves it out");
    // Publish again: the same link
    await page.goto("http://127.0.0.1:3188/"); await page.waitForTimeout(900);
    await myRecipes();
    await openRecipe("High protein crepes");
    await page.locator(".rq-pub").getByRole("button", { name: "Publish again" }).click(); await page.waitForTimeout(400);
    await page.locator(".publish-sheet").getByRole("button", { name: "Publish again" }).click(); await page.waitForTimeout(1200);
    ok(await page.evaluate(async () => (await fetch("/api/recipes/high-protein-crepes")).status) === 200, "Publish again: live on the same link");
    // R12 (0.2.5+r13, board S4): Publish says it worked; the button sleeps until something changes
    const ps = page.locator(".publish-sheet"), goBtn = ps.locator(".publish-ways .pill-primary");
    ok(/✓ Published/.test(await ps.locator(".pub-band.done").textContent()) && await ps.locator(".pub-band.done a", { hasText: "See live page" }).count() === 1, "R12a: a band says Published, with See live page");
    ok((await goBtn.textContent()) === "Published, no changes" && await goBtn.isDisabled(), "R12a: with no change the button reads Published, no changes and sleeps");
    await ps.getByLabel("Two lines about it").fill("Thin, soft, and they roll. 29 % of the energy is protein."); await page.waitForTimeout(700);
    ok(/Changes not published yet/.test(await ps.locator(".pub-band.changed").textContent()) && /Changed: Two lines about it\./.test(await ps.locator(".pub-band.changed").textContent()) && await ps.locator(".pub-band.done").count() === 0, "R12b: a change says Changes not published yet, and what changed");
    ok((await goBtn.textContent()) === "Publish the changes" && !(await goBtn.isDisabled()), "R12b: the change wakes Publish the changes");
    await ps.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(400);
    ok(/Published\. High protein crepes is live on chefmealan\.com/.test(await page.locator(".toast").textContent().catch(() => "")), "R12c: closing after a publish says so once");
    ok(/Changes not published yet/.test(await page.locator(".rq-pub").textContent()) && await page.locator(".rq-pub").getByRole("button", { name: "Publish the changes" }).count() === 1, "R12c: the recipe's page says Changes not published yet, with Publish the changes");
    // one tap on the recipe's page publishes (0.2.5+r14, Milan 22:53: it opened the sheet and needed a second tap)
    await page.locator(".rq-pub").getByRole("button", { name: "Publish the changes" }).click(); await page.waitForTimeout(1500);
    ok(/✓ Published/.test(await ps.locator(".pub-band.done").textContent().catch(() => "")) && (await goBtn.textContent()) === "Published, no changes" && /29 % of the energy/.test(await page.evaluate(async () => (await (await fetch("/api/recipes/high-protein-crepes")).json()).recipe.lines)), "R12: one tap on Publish the changes puts the new lines live; the sheet shows Published and the button sleeps");
    await ps.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(400);
    ok(/Change live page/.test(await page.locator(".rq-pub").textContent()) && !/Changes not published yet/.test(await page.locator(".rq-pub").textContent()), "R12c: with nothing new, the recipe's page offers Change live page");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
