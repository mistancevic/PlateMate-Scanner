// A cover drawn by Chef Mealan and Members (0.2.11, canvas board CO, CO1 to CO4b; Milan 16 October 2026, 15:23 to 16:48).
// The drawing itself is Google's (no AI in the walkthroughs): /api/cover answers with a fixed picture here. What is checked
// is the app's part: which recipes get a picture and when, the label, the photo ask on the meal card, Use as cover, the
// For members panel, Share, a change reaching members, Take it back, the Members tab at your portion, allergies, the order,
// a member's recipe, Make it, Keep in mine, and the owner's take down. Members runs on the real local server.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const pic = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg")).toString("base64");
const F = (id, name, calories, protein) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs: 10, fats: 5, fiber: 0, photo: undefined, photos: undefined, icon: "🥣" });
const R = (id, title, list) => ({ id, title, items: list.map(([g, f], i) => ({ id: `${id}-i${i}`, grams: g, locked: false, food: f })), portion: list.reduce((n, [g]) => n + g, 0), savedAt: "2026-10-15T10:00:00Z" });
const sopska = R("m-sopska", "Šopska plate with bread", [[200, F("f-ch", "Chicken breast, cooked", 165, 31)], [150, F("f-co", "Cottage cheese", 98, 12)], [150, F("f-to", "Tomato", 18, 0.9)], [150, F("f-cu", "Cucumber", 15, 0.7)], [10, F("f-oi", "Olive oil", 884, 0)], [125, F("f-br", "Wholegrain bread", 250, 9)]]);
const crepes = R("m-crepes", "High protein crepes", [[200, F("f-pf", "Protein flour", 357, 21)], [500, F("f-pm", "Protein milk", 51, 7.5)]]);
const salad = R("m-salad", "Tuna salad", [[150, F("f-tu", "Tuna", 116, 26)], [200, F("f-le", "Lettuce", 15, 1.4)]]);
const withPhoto = R("m-photo", "Skyr bowl", [[250, F("f-sk", "Skyr, natural", 63, 11)]]);
seed.items = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
seed.meals = [sopska, crepes, salad, withPhoto];
seed.feedback = [
  { id: "fb-lunch", meal: sopska, status: "eaten", taste: "Good", notes: "", createdAt: "2026-10-16T13:10:00", recipeId: "m-sopska" },
  { id: "fb-skyr", meal: withPhoto, status: "eaten", taste: "Good", notes: "", createdAt: "2026-10-14T09:00:00", photo: pic },
];
const U = "http://127.0.0.1:3206";
const sf = (name, calories, protein) => ({ name, brand: "", calories, protein, fats: 5, carbs: 10, fiber: 0, readyToEat: true });
const stir = { title: "Chicken and broccoli stir-fry with rice", kitchen: "Balkan", steps: ["Fry [[i:a|chicken breast]] with [[i:b|broccoli]].", "Serve over [[i:c|rice]]."], items: [
  { id: "a", grams: 400, food: sf("Chicken breast, cooked", 165, 31) }, { id: "b", grams: 400, food: sf("Broccoli", 34, 2.8) }, { id: "c", grams: 500, food: sf("Rice, cooked", 130, 2.7) }, { id: "d", grams: 40, food: sf("Soy sauce", 53, 8) }, { id: "e", grams: 20, food: sf("Sesame oil", 884, 0) }] };
const salmon = { title: "Salmon with lemon potatoes", kitchen: "Mediterranean", steps: [], items: [{ id: "a", grams: 180, food: sf("Salmon, cooked", 208, 20) }, { id: "b", grams: 300, food: sf("Potatoes, boiled", 77, 2) }, { id: "c", grams: 10, food: sf("Olive oil", 884, 0) }] };
const toast = { title: "Toast with peanut butter", kitchen: null, steps: [], items: [{ id: "a", grams: 60, food: sf("Peanut butter", 588, 25) }, { id: "b", grams: 60, food: sf("Wholegrain bread", 250, 9) }] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3206", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  await page.clock.setFixedTime(new Date("2026-10-16T17:30:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: ["allergies"], flags: [], allergies: ["peanut"], none: false, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  // the drawing: a fixed picture for the first two recipes, then the day's ten are used up
  const asked = [];
  await page.route("**/api/cover", async (route) => { const body = JSON.parse(route.request().postData() || "{}"); asked.push(body); await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(asked.length <= 2 ? { image: pic } : { tomorrow: true }) }); });
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const meal = async (id) => (await st()).meals.find((m) => m.id === id);
  const recipes = async () => { await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(600); };

  // CO1: recipes kept without a photo get one drawn picture, one at a time; a recipe with a plate photo never does
  await page.goto(U + "/"); await page.waitForTimeout(4000);
  ok(asked.length === 3 && asked[0].recipeId === "m-sopska" && asked[0].items.length === 6 && asked[0].items[5].grams === 125, "CO1: Chef Mealan is asked for a picture of each recipe without a photo, with its foods and amounts: " + asked.map((a) => a.recipeId).join(", "));
  ok(!asked.some((a) => a.recipeId === "m-photo"), "CO1: the recipe whose card holds a plate photo gets no drawing");
  const s1 = await meal("m-sopska");
  // photos live in the phone's photo store; the saved data names them by fingerprint
  const coverOf = (m) => m.photoSigs?.[0] ?? null;
  ok(s1.cover?.state === "drawn" && s1.coverSig && coverOf(s1) === s1.coverSig, "CO1: the picture is the recipe's cover, known as drawn");
  ok((await meal("m-salad")).cover?.state === "tomorrow" && !coverOf(await meal("m-salad")), "CO1: past the day's ten, the recipe waits for tomorrow");
  await page.reload(); await page.waitForTimeout(1500);
  ok(asked.length === 3, "CO1: drawn once: nothing is asked again after a reload");
  await recipes();
  ok(/Picture by Chef Mealan/.test(await page.locator(".recipe-tile").filter({ hasText: "Šopska" }).textContent()), "CO1: the tile says Picture by Chef Mealan");
  ok(/Picture tomorrow/.test(await page.locator(".recipe-tile").filter({ hasText: "Tuna salad" }).textContent()), "CO1: the waiting recipe's tile says Picture tomorrow");
  await page.locator(".recipe-tile").filter({ hasText: "Šopska" }).click(); await page.waitForTimeout(500);
  ok(await page.locator(".rq-drawn").filter({ hasText: "Picture by Chef Mealan" }).count() === 1 && await page.getByRole("button", { name: "Add my photo" }).count() === 1 && !(await page.locator(".rq-thumbs").isVisible()), "CO1: the page shows the drawn cover, labelled, with Add my photo");
  ok(/drew it from your foods and amounts/.test(await page.locator(".rq-hint").textContent()), "CO1: the line says how it was drawn");

  // CO4: For members, on a recipe of yours
  const panel = page.locator(".mb-share");
  ok(/Not shared/.test(await panel.textContent()) && await panel.locator(".mb-cover").count() === 1 && /Picture by Chef Mealan/.test(await panel.locator(".mb-cover.on").textContent()), "CO4: Not shared; the cover members see is the drawn picture");
  ok(!(await panel.getByRole("switch").isChecked()) && /Off: members see it as a member's/.test(await panel.textContent()), "CO4: Show my first name is off until switched on");
  await panel.getByRole("button", { name: "Balkan" }).click();
  await panel.getByRole("button", { name: "Share with members" }).click(); await page.waitForTimeout(800);
  const shared = (await meal("m-sopska")).members;
  ok(shared?.id && shared.named === false && shared.kitchen === "Balkan", "CO4: shared, without the name, in the Balkan kitchen");
  ok(/Shared/.test(await panel.locator(".mb-state").textContent()) && /as a member, with the picture by Chef Mealan/.test(await panel.textContent()), "CO4b: Shared, as a member, with the picture by Chef Mealan");
  const api = (url, init = {}) => page.evaluate(async ([u, i]) => { const r = await fetch(u, i); let d = null; try { d = await r.json(); } catch {} return { status: r.status, d }; }, [url, init]);
  let list = (await api("/api/members")).d.recipes;
  ok(list.length === 1 && list[0].title === "Šopska plate with bread" && list[0].name === "" && list[0].coverKind === "drawn" && list[0].cover && !JSON.stringify(list[0]).includes("Good"), "CO4: members get the recipe and the cover, no name, no rating");
  // a change reaches members
  await page.getByRole("button", { name: /^Rename / }).click(); await page.locator(".rq-name-input").fill("Šopska plate with rye bread"); await page.locator(".rq-name-input").press("Enter"); await page.waitForTimeout(900);
  list = (await api("/api/members")).d.recipes;
  ok(list.length === 1 && list[0].title === "Šopska plate with rye bread" && list[0].cover, "CO4b: a change to the recipe reaches members, with the same cover");
  await page.locator(".rq-back").click(); await page.waitForTimeout(400);

  // CO2: Members, at your portion; another member's recipes, one with your declared allergy
  const as = (who, body) => api("/api/members", { method: "POST", headers: { "Content-Type": "application/json", "x-local-as": who }, body: JSON.stringify(body) });
  await as("davorka", { recipe: stir, cover: pic, coverKind: "drawn", named: true, name: "Davorka Bokic" });
  await as("member", { recipe: salmon, cover: pic, coverKind: "photo", named: false });
  await as("member", { recipe: toast, cover: null, coverKind: "drawn", named: false });
  await page.getByRole("tab", { name: "Members" }).click(); await page.waitForTimeout(900);
  ok(await page.getByRole("tab", { name: /^Mine/ }).count() === 1 && await page.getByRole("tab", { name: /^Coach's/ }).count() === 1, "CO2: the tabs read Mine, Coach's, Members");
  const head = (await page.locator(".mb-lead").textContent()).replace(/\s+/g, " ");
  const need = Number((head.match(/about ([\d,]+) kcal/) || [])[1]?.replace(",", ""));
  ok(/Dinner is about [\d,]+ kcal at PD 6\.4 or more/.test(head), "CO2: the line says the meal ahead, its size and the target: " + head);
  const tiles = page.locator(".recipe-tile");
  const titles = await tiles.locator(".tile-name").allTextContents();
  ok(!titles.includes("Toast with peanut butter"), "CO2: a recipe with your declared allergy is not shown");
  ok(titles.indexOf("Chicken and broccoli stir-fry with rice") < titles.indexOf("Salmon with lemon potatoes"), "CO2: at or above your target first: " + titles.join(" | "));
  const stirTile = (await tiles.filter({ hasText: "stir-fry" }).textContent()).replace(/\s+/g, " ");
  const tileKcal = Number((stirTile.match(/· ([\d,]+) kcal/) || [])[1]?.replace(",", ""));
  // the foods are rounded to 5 g each, so the portion lands near the meal's size, not on it
  ok(/Balkan · shared by Davorka/.test(stirTile) && /Your dinner: [\d,]+ g · [\d,]+ kcal · PD 9\.2/.test(stirTile) && Math.abs(tileKcal - need) <= need * 0.05, "CO2: Davorka's stir-fry at your dinner, within 5 % of its size: " + stirTile);
  ok(/under your 6\.4/.test(await tiles.filter({ hasText: "Salmon" }).textContent()) && /Photo by a member/.test(await tiles.filter({ hasText: "Salmon" }).textContent()), "CO2: the salmon is marked under your target, with a member's photo");
  ok(/shared by you/.test(await tiles.filter({ hasText: "rye bread" }).textContent()), "CO2: your own shared recipe is there, shared by you");
  await page.locator(".mb-chips").getByRole("button", { name: "Mediterranean" }).click(); await page.waitForTimeout(200);
  ok((await tiles.locator(".tile-name").allTextContents()).join() === "Salmon with lemon potatoes", "CO2: a kitchen filters the list");
  await page.locator(".mb-chips").getByRole("button", { name: "All" }).click(); await page.waitForTimeout(200);

  // CO3: a member's recipe at your portion
  await tiles.filter({ hasText: "stir-fry" }).click(); await page.waitForTimeout(500);
  const pageText = (await page.locator(".rq").textContent()).replace(/\s+/g, " ");
  ok(/Your dinner: [\d,]+ g of the 1,360 g it makes/.test(pageText) && /Foods for your portion/.test(pageText), "CO3: the recipe opens at your dinner");
  const grams = (await page.locator(".rq-food b").allTextContents()).map((x) => Number(x.replace(/[^\d]/g, "")));
  const stepTxt = (await page.locator(".rp-steps li").first().textContent()).replace(/\s+/g, " ");
  ok(stepTxt.includes(`${grams[0]} g chicken breast`) && stepTxt.includes(`${grams[1]} g broccoli`), "CO3: the amounts in the steps are your portion's: " + stepTxt);
  ok(await page.getByRole("button", { name: "Keep in mine" }).count() === 1 && await page.getByRole("button", { name: /Take it down/ }).count() === 1, "CO3: Keep in mine; the owner can take it down");
  await page.getByRole("button", { name: "Keep in mine" }).click(); await page.waitForTimeout(500);
  const kept = (await st()).meals.find((m) => m.memberOf);
  ok(kept && kept.from === "members" && kept.title === "Chicken and broccoli stir-fry with rice" && kept.items[0].grams === 400 && coverOf(kept) === kept.coverSig, "CO3: Keep in mine copies the recipe, its amounts and its drawn cover");
  await recipes(); await page.getByRole("tab", { name: "Members" }).click(); await page.waitForTimeout(700);
  await tiles.filter({ hasText: "stir-fry" }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Make it" }).click(); await page.waitForTimeout(800);
  const plate = await st();
  ok(plate.title === "Chicken and broccoli stir-fry with rice" && plate.items.map((i) => i.grams).join() === grams.join(), "CO3: Make it puts your portion on the plate");
  ok((await api("/api/members")).d.recipes.find((r) => r.title.includes("stir-fry")).made === 1, "CO3: made counts once for the cook");
  // the owner's take down
  await recipes(); await page.getByRole("tab", { name: "Members" }).click(); await page.waitForTimeout(700);
  await tiles.filter({ hasText: "Salmon" }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Take it down/ }).click(); await page.getByRole("button", { name: /Sure\?/ }).click(); await page.waitForTimeout(800);
  ok(!(await api("/api/members")).d.recipes.some((r) => r.title.startsWith("Salmon")), "the owner takes a recipe down for every member");
  // CO4b: Take it back
  await page.getByRole("tab", { name: /^Mine/ }).click(); await page.waitForTimeout(300);
  await page.locator(".recipe-tile").filter({ hasText: "rye bread" }).click(); await page.waitForTimeout(500);
  await page.locator(".mb-share").getByRole("button", { name: "Take it back" }).click(); await page.waitForTimeout(800);
  ok(!(await meal("m-sopska")).members && !(await api("/api/members")).d.recipes.some((r) => r.title.includes("rye")), "CO4b: Take it back removes it from Members");
  await page.locator(".rq-back").click(); await page.waitForTimeout(300);

  // CO1b and CO1c: the meal card on Today asks for a photo of the plate
  await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(700);
  const card = page.locator(".log-card:not(.carry-card)").filter({ hasText: "Šopska" });
  ok(/The cover of this recipe is a picture by Chef Mealan\. Take a photo of your plate\? It can become the cover\./.test(await card.textContent()), "CO1b: the meal card asks once for a photo of the plate");
  await card.locator('input[type="file"]').setInputFiles(path.join(ROOT, "tests/flows/front.jpg")); await page.waitForTimeout(900);
  ok(/Use this photo as the cover of Šopska plate with rye bread\?/.test(await card.textContent()), "CO1c: with the photo: Use as cover, or Keep it just for me");
  await card.getByRole("button", { name: "Use as cover" }).click(); await page.waitForTimeout(500);
  const s2 = await meal("m-sopska");
  ok(s2.photoSigs?.length === 2 && s2.photoSigs[0] !== s1.coverSig && s2.photoSigs[1] === s1.coverSig && (await st()).feedback.find((f) => f.id === "fb-lunch").coverAsk === "used", "CO1c: your photo is the cover; the drawn picture stays behind it");
  ok(await card.locator(".cover-ask").count() === 0, "CO1c: the card asks no more");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
