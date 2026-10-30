// The recipe's page (0.2.5+r11, canvas board S3, R7 to R11, Milan 12 October 2026). R7: a tile is one tap, no buttons,
// the cover and where the recipe is. R8: the recipe's page, photos first: × deletes after Sure?, Add adds, the plate
// photos from the times it was made are offered. R9: ‹ › move the picked photo; first place is the cover. R10: Make it
// (the recipe on the Plate, unchanged) and Edit recipe. R11: edit mode, grams, × a food, Add a food, steps, Save changes
// or Cancel. A long name never makes the page wider than the phone. A live recipe whose page has a photo and the app none
// takes the page's photo once as its cover, and a removed cover never comes back from the page.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = [];
const PLATE = path.resolve(__dirname, "plate.jpg"), FRONT = path.resolve(__dirname, "front.jpg");
const plateData = "data:image/jpeg;base64," + fs.readFileSync(PLATE).toString("base64");
process.on("unhandledRejection", (e) => { console.log("FAIL " + (e && e.message ? e.message : e)); process.exit(1); });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3186" }, stdio: ["ignore", "pipe", "pipe"] });
  for (let i = 0; i < 60; i++) { try { await fetch("http://127.0.0.1:3186/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 360, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript(([s, plate]) => {
    if (localStorage.getItem("seeded")) return;
    const f = (id) => s.foods.find((x) => x.id === id);
    const emc = { id: "m-emc", title: "Eggs, Milk 1.5% & Chicken", items: [{ id: "a", food: f("f-egg"), grams: 120, locked: true }, { id: "b", food: f("f-milk"), grams: 100, locked: true }, { id: "c", food: f("f-chicken"), grams: 80, locked: false }], portion: 300, savedAt: "2026-10-11T08:00:00Z", steps: ["Whisk the eggs with the milk."] };
    const oats = { id: "m-oats", title: "Oats, skyr and banana", items: [{ id: "d", food: f("f-oats"), grams: 60, locked: true }, { id: "e", food: f("f-skyr"), grams: 150, locked: false }], portion: 210, savedAt: "2026-10-10T08:00:00Z" };
    s.meals = [emc, oats];
    // a card from the time the oats were made, with its plate photo
    s.feedback = [{ id: "c1", meal: oats, status: "eaten", taste: "Good", notes: "", createdAt: "2026-10-10T09:00:00Z", photo: plate }];
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { meals: 3 } }));
    localStorage.setItem("seeded", "1");
  }, [seed, plateData]);
  // the Eggs recipe is live on the site with a photo (R4): the account says so, and the page serves the photo
  let served = 0;
  await page.route("**/api/my-recipes", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ cook: true, direct: true, recipes: [{ mealId: "m-emc", slug: "eggs-milk-chicken", title: "Eggs, Milk 1.5% & Chicken", hasPhoto: true, status: "live", items: [], steps: [], makes: 1, servingName: "serving", perServing: { kcal: 365, protein: 43.8 } }] }) }));
  await page.route("**/r/eggs-milk-chicken/photo.jpg", (r) => { served++; r.fulfill({ contentType: "image/jpeg", body: fs.readFileSync(PLATE) }); });
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3186/my-recipes"); await page.waitForTimeout(1500);
  const tile = (t) => page.locator(".recipe-tile").filter({ hasText: t });
  const meal = (id) => page.evaluate((id) => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === id), id);
  const wide = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  // R7: the tile
  ok(served >= 1 && await tile("Eggs, Milk").locator("img").count() === 1, `R4: the live recipe takes its page's photo as the cover (${served} fetch)`);
  ok(await tile("Eggs, Milk").locator(".pill, .recipe-tile-photos").count() === 0 && /Live on chefmealan\.com/.test(await tile("Eggs, Milk").locator(".tile-state").textContent()), "R7: no buttons on the tile; it says Live on chefmealan.com");
  ok(await tile("Oats").locator("img").count() === 1, "R7: a recipe without photos of its own still shows its card's plate photo");
  // R8: the recipe's page
  await tile("Eggs, Milk").click(); await page.waitForTimeout(500);
  ok(await page.locator(".rq-hero img").count() === 1 && /Cover/.test(await page.locator(".rq-hero").textContent()), "R8: the page opens with the cover large");
  ok(await wide() <= 0, "the long name never makes the page wider than the phone (360 px)");
  ok(/365/.test(await page.locator(".rq-readout").textContent()) && /43\.8/.test(await page.locator(".rq-readout").textContent()), "R8: the recipe's numbers: 365 kcal, 43.8 g protein");
  // × asks Sure? before deleting
  await page.getByRole("button", { name: "Delete photo 1" }).click(); await page.waitForTimeout(150);
  ok(await page.locator(".rq-hero img").count() === 1, "R9: × asks Sure? first; nothing is deleted on the first tap");
  await page.getByRole("button", { name: "Delete photo 1" }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".rq-hero-empty").count() === 1, "R9: the second tap deletes the photo");
  await page.getByRole("button", { name: "Recipes", exact: true }).first().click(); await page.waitForTimeout(300);
  await page.reload(); await page.waitForTimeout(1500);
  ok(await tile("Eggs, Milk").locator("img").count() === 0, "R4: a removed cover never comes back from the page");
  // Add twice; the second photo moves to first place and becomes the cover
  await tile("Eggs, Milk").click(); await page.waitForTimeout(400);
  const add = page.locator('.rq input[type="file"]');
  await add.setInputFiles(PLATE); await page.waitForTimeout(800);
  await add.setInputFiles(FRONT); await page.waitForTimeout(800);
  ok(await page.locator(".rq-thumbs .publish-photo:not(.add)").count() === 2, "R8: Add adds a photo, twice");
  const second = await page.locator(".rq-thumbs .publish-photo.on img").getAttribute("src");
  await page.getByRole("button", { name: "Move the photo earlier" }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".rq-hero img").getAttribute("src") === second && /Cover/.test(await page.locator(".rq-hero").textContent()), "R9: ‹ moves the photo to first place: the cover");
  // R11: Edit recipe: chicken 80 to 100 g; the numbers follow; Cancel leaves the recipe as it was; Save changes keeps it
  await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(200);
  ok(await page.locator(".rq-editing").count() === 1, "R11: Editing the recipe");
  await page.getByLabel("Grams of Chicken breast, cooked").fill("100"); await page.waitForTimeout(150);
  ok(/398/.test(await page.locator(".rq-readout").textContent()) && /50(\.0)?\s*g protein/.test(await page.locator(".rq-readout").textContent()) && /12\.6/.test(await page.locator(".rq-readout").textContent()), "R11: the numbers follow as you type: 398 kcal, 50 g protein, PD 12.6");
  await page.getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(200);
  ok((await meal("m-emc")).items.find((i) => i.id === "c").grams === 80, "R11: Cancel leaves the recipe as it was");
  await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(200);
  await page.getByLabel("Grams of Chicken breast, cooked").fill("100");
  await page.getByRole("button", { name: "Remove Milk 1.5%" }).click();
  await page.getByRole("button", { name: "Add a food" }).click(); await page.getByLabel("Search my foods").fill("skyr"); await page.waitForTimeout(150);
  await page.locator(".rq-find-row").first().click(); await page.waitForTimeout(150);
  // Changed by story DT83 (Milan 23 October 2026): an Add right after a Remove asks whether the new food takes the removed
  // one's place; a food of its own asks for its grams instead of putting in 100 g
  await page.getByRole("button", { name: "No, a food of its own" }).click(); await page.waitForTimeout(150);
  await page.getByLabel("Grams of Skyr, natural").fill("100"); await page.waitForTimeout(150);
  // R13 (0.2.5+r16, board S4): one field per step, Enter starts the next; the foods as chips with their amounts
  await page.getByRole("textbox", { name: "Step 1" }).fill("Whisk "); await page.getByRole("button", { name: /^Put 120 g Eggs/ }).click(); await page.waitForTimeout(150);
  await page.getByRole("textbox", { name: "Step 1" }).press("End");
  await page.getByRole("textbox", { name: "Step 1" }).press("Enter"); await page.waitForTimeout(150);
  await page.getByRole("textbox", { name: "Step 2" }).type("Fold in "); await page.getByRole("button", { name: /^Put 100 g Chicken/ }).click(); await page.waitForTimeout(150);
  ok(/100 g chicken breast/.test(await page.getByRole("textbox", { name: "Step 2" }).textContent()) && /Skyr, natural is not in any step yet/.test(await page.locator(".st-note").textContent()), "R13a: a tap on a food puts it in the step with its amount; a food in no step is named: " + (await page.getByRole("textbox", { name: "Step 2" }).textContent()) + " | " + (await page.locator(".st-note").allTextContents()).join("/"));
  await page.getByRole("textbox", { name: "Step 2" }).press("End"); await page.getByRole("textbox", { name: "Step 2" }).type("and cook slowly.");
  await page.getByRole("button", { name: "+ Add a step" }).click(); await page.waitForTimeout(150);
  await page.getByRole("textbox", { name: "Step 3" }).type("Serve with "); await page.getByRole("button", { name: /^Put 100 g Skyr/ }).click(); await page.waitForTimeout(150);
  ok(/Every food is in a step/.test(await page.locator(".st-note").textContent()), "R13a: every food in a step says so");
  await page.getByLabel("Grams of Chicken breast, cooked").fill("120"); await page.waitForTimeout(200);
  ok(/120 g chicken breast/.test(await page.getByRole("textbox", { name: "Step 2" }).textContent()), "R13b: the amount in the step follows the foods: 120 g");
  await page.getByLabel("Grams of Chicken breast, cooked").fill("100"); await page.waitForTimeout(200);
  ok(/Live on chefmealan\.com: the live page changes only with Change live page/.test(await page.locator(".rq").textContent()), "R11: a live recipe says the live page changes only with Change live page");
  await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(300);
  const m1 = await meal("m-emc");
  ok(m1.items.map((i) => `${i.food.name}:${i.grams}`).join(",") === "Eggs:120,Chicken breast, cooked:100,Skyr, natural:100" && m1.steps.length === 3 && /\[\[i:c\|chicken breast\]\]/.test(m1.steps[1]) && m1.portion === 320, "R11: Save changes keeps the foods, the grams and the steps: " + m1.items.map((i) => `${i.food.name} ${i.grams}`).join(", "));
  ok(/Whisk 2 eggs \(L\)/.test(await page.locator(".rq-steps").textContent()) && /Fold in 100 g chicken breast and cook slowly\./.test(await page.locator(".rq-steps").textContent()), "R13: the steps read with the amounts on the recipe's page: " + (await page.locator(".rq-steps").textContent()));
  // R10: Make it puts the recipe on the Plate and leaves the recipe as it is
  await page.getByRole("button", { name: "Change it first", exact: true }).click(); await page.waitForTimeout(600);
  ok(new URL(page.url()).pathname === "/plate" && await page.getByRole("button", { name: /^(Fit to my target|Make it an? \w+)$/ }).count() === 1, "R10: Make it opens the recipe on the Plate");
  ok(JSON.stringify((await meal("m-emc")).items) === JSON.stringify(m1.items), "R10: Make it leaves the recipe as it is");
  // the photos stay after a reload, the cover first; the oats are offered their plate photo
  await page.goto("http://127.0.0.1:3186/my-recipes"); await page.waitForTimeout(1800);
  ok(await tile("Eggs, Milk").locator("img").getAttribute("src") === second, "the photos stay after a reload, the cover first");
  await tile("Oats").click(); await page.waitForTimeout(400);
  ok(await page.locator(".rq-offer .rph-offer").count() === 1, "R8: the plate photos from the times it was made are offered");
  await page.locator(".rq-offer .rph-offer").first().click(); await page.waitForTimeout(300);
  ok(await page.locator(".rq-hero img").count() === 1 && await page.locator(".rq-offer").count() === 0, "R8: a tap adds the plate photo to the recipe, as its cover");
  // Delete recipe says what goes first (0.2.22, IM22): its photos go with it
  await page.getByRole("button", { name: "Delete recipe" }).click(); await page.waitForTimeout(150);
  ok((await meal("m-oats")) !== undefined && /Its photo, from this phone and from your account\./.test(await page.locator(".dl-card").textContent()), "IM22: Delete recipe says what goes first: its photo");
  await page.locator(".dl-card .dl-go").click(); await page.waitForTimeout(300);
  ok((await meal("m-oats")) === undefined && await page.locator(".rq").count() === 0 && /Its picture leaves your account with the next save\./.test(await page.locator(".dl-done").textContent()), "IM22: Delete recipe deletes the recipe and goes back to Recipes, saying what was done");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed");
  process.exit(fail ? 1 : 0);
})();
