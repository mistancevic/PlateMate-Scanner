// Recipe photos (0.2.5+r10, canvas board S3, R4 to R6, Milan 12 October 2026): a recipe keeps its own photos. The tile
// shows the cover and opens Photos; Take and Gallery add one; a picked photo becomes the cover or is removed; plate photos
// from the times it was made are offered; the photos stay after a reload. A published recipe whose page has a photo and
// the app none takes the page's photo once as its cover, and a removed cover never comes back from the page.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = [];
const PLATE = path.resolve(__dirname, "plate.jpg");
const plateData = "data:image/jpeg;base64," + fs.readFileSync(PLATE).toString("base64");
process.on("unhandledRejection", (e) => { console.log("FAIL " + (e && e.message ? e.message : e)); process.exit(1); });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3186" }, stdio: ["ignore", "pipe", "pipe"] });
  for (let i = 0; i < 60; i++) { try { await fetch("http://127.0.0.1:3186/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript(([s, plate]) => {
    if (localStorage.getItem("seeded")) return;
    const f = (id) => s.foods.find((x) => x.id === id);
    const emc = { id: "m-emc", title: "Eggs, Milk 1.5% & Chicken", items: [{ id: "a", food: f("f-egg"), grams: 120, locked: true }, { id: "b", food: f("f-milk"), grams: 100, locked: true }, { id: "c", food: f("f-chicken"), grams: 80, locked: false }], portion: 300, savedAt: "2026-10-11T08:00:00Z" };
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
  await page.route("**/api/my-recipes", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ cook: true, direct: true, recipes: [{ mealId: "m-emc", slug: "eggs-milk-chicken", title: "Eggs, Milk 1.5% & Chicken", hasPhoto: true, status: "live", items: [], steps: [], makes: 1, servingName: "serving", perServing: { kcal: 400, protein: 40 } }] }) }));
  await page.route("**/r/eggs-milk-chicken/photo.jpg", (r) => { served++; r.fulfill({ contentType: "image/jpeg", body: fs.readFileSync(PLATE) }); });
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3186/my-recipes"); await page.waitForTimeout(1500);
  const tile = (t) => page.locator(".recipe-tile").filter({ hasText: t });
  ok(served >= 1 && await tile("Eggs, Milk").locator(".recipe-tile-photo img").count() === 1, `R4: the live recipe takes its page's photo as the cover (${served} fetch)`);
  ok(/Photos/.test(await tile("Eggs, Milk").locator(".recipe-tile-photos").textContent()), "R4: the cover carries Photos");
  ok(await tile("Oats").locator(".recipe-tile-photo img").count() === 1, "R4: a recipe without photos of its own still shows its card's plate photo");
  // R5: Photos of the Eggs recipe: the cover large, Remove takes it off, and the page's photo does not come back
  await tile("Eggs, Milk").locator(".recipe-tile-photo").click(); await page.waitForTimeout(300);
  ok(await page.locator(".recipe-photos .rph-hero img").count() === 1 && /Cover/.test(await page.locator(".recipe-photos .rph-hero").textContent()), "R5: the sheet shows the cover large, marked Cover");
  await page.getByRole("button", { name: "Remove" }).click(); await page.waitForTimeout(200);
  ok(await page.locator(".recipe-photos .rph-empty").count() === 1, "R5: Remove takes the only photo off");
  await page.getByRole("button", { name: "Close" }).click();
  await page.reload(); await page.waitForTimeout(1500);
  ok(await tile("Eggs, Milk").locator(".recipe-tile-photo img").count() === 0 && /Add a photo/.test(await tile("Eggs, Milk").locator(".recipe-tile-photos").textContent()), "R4: a removed cover never comes back from the page; the tile offers Add a photo");
  // Gallery adds two photos; the second becomes the cover; the plate photo of the oats card is offered on the oats recipe
  await tile("Eggs, Milk").locator(".recipe-tile-photo").click(); await page.waitForTimeout(300);
  const gallery = page.locator('.recipe-photos input[type="file"]:not([capture])');
  await gallery.setInputFiles(PLATE); await page.waitForTimeout(800);
  await gallery.setInputFiles(path.resolve(__dirname, "front.jpg")); await page.waitForTimeout(800);
  ok(await page.locator(".recipe-photos .publish-photos").first().locator(".publish-photo:not(.add) img").count() === 2, "R5: Gallery adds a photo, twice");
  ok(await page.locator('.recipe-photos input[type="file"][capture="environment"]').count() === 1, "R5: Take opens the camera");
  const second = await page.locator(".recipe-photos .publish-photo.on img").getAttribute("src");
  await page.getByRole("button", { name: "Make it the cover" }).click(); await page.waitForTimeout(200);
  ok(await page.locator(".recipe-photos .rph-hero img").getAttribute("src") === second && /Cover/.test(await page.locator(".recipe-photos .rph-hero").textContent()), "R6: the picked photo becomes the cover");
  await page.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(300);
  ok(await tile("Eggs, Milk").locator(".recipe-tile-photo img").getAttribute("src") === second, "R6: the tile follows at once");
  await page.reload(); await page.waitForTimeout(1800);
  ok(await tile("Eggs, Milk").locator(".recipe-tile-photo img").getAttribute("src") === second, "the photos stay after a reload, the cover first");
  await tile("Oats").locator(".recipe-tile-photo").click(); await page.waitForTimeout(300);
  ok(/From the times you made it/.test(await page.locator(".recipe-photos").textContent()), "R5: the plate photos from the recipe's cards are offered");
  await page.locator(".recipe-photos .rph-offer").first().click(); await page.waitForTimeout(300);
  ok(await page.locator(".recipe-photos .rph-hero img").count() === 1 && await page.locator(".recipe-photos .rph-offer").count() === 0, "R5: a tap adds the plate photo to the recipe, as its cover");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed");
  process.exit(fail ? 1 : 0);
})();
