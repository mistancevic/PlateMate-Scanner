// Members' foods (0.2.97, canvas Page 2, board Stories68, DT115; Milan 24 October 19:00 and 25 October 01:47 to 02:05): one
// catalogue of every reviewed scan. Two members on one server (in memory, no Firestore): Tester 2 in Belgrade with tuna in
// brine, Tester 3 in Cyprus with fresh tuna, and you in Munich with tuna in olive oil. Checked: a reviewed food travels once
// (no photo); Find a food shows Members' foods, your market first; Also seen by members under your own tuna; Add to my foods
// copies it; the barcode scan answers from the catalogue before Open Food Facts; the swap list reaches the catalogue with the
// same tuna in another state first and the difference per can.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, favorite: false, ...extra });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, { serving: { grams: 50, name: "bar" } });
const YE = F("yeast", "Active dry yeast", 325, 40, 7, 41, { favorite: true }), FL = F("flour", "Wheat flour, type 405", 364, 10, 1, 76), OIL = F("oil", "Olive oil", 884, 0, 100, 0);
const SKYR = F("skyr", "Skyr, natural", 63, 11, 0.2, 4), COLA = F("cola", "Cola", 42, 0, 0, 10.6), WHEY = F("whey", "Whey protein powder, vanilla", 380, 78, 5, 7, { serving: { grams: 30, name: "scoop" } });
seed.foods = [BAR, YE, FL, OIL, SKYR, COLA, WHEY, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 50, locked: false }];
seed.cooking = ["dried oregano", "lemon zest"]; // left behind by a dinner, as on Milan's phone
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const U = "http://127.0.0.1:3267";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3267", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  // the other members' scans, as their apps send them
  const post = (region, foods) => fetch(U + "/api/members/foods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ region, foods }) }).then((r) => r.json());
  const r1 = await post("belgrade", [{ name: "Tuna in brine, drained", brand: "Eva", barcode: "3850102001234", calories: 105, protein: 24, fats: 1, carbs: 0, fiber: 0, source: "label", photo: "data:image/png;base64,xxx" }]);
  const r2 = await post("cyprus", [{ name: "Τόνος σε νερό", brand: "Trata", barcode: "5201054000011", calories: 103, protein: 24, fats: 0.8, carbs: 0, fiber: 0, source: "label" }, { name: "Tuna steak, fresh", brand: "", calories: 130, protein: 28, fats: 1.5, carbs: 0, fiber: 0, source: "label" }, { name: "Tuna in water, drained", brand: "Rio Mare", barcode: "8004030044005", calories: 99, protein: 23, fats: 0.5, carbs: 0, fiber: 0, source: "label", serving: { grams: 52, name: "can" } }]);
  ok(r1.shared === 1 && r2.shared === 3, "the other members' reviewed scans are in the catalogue: " + JSON.stringify([r1, r2]));
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-25T12:10:00"));
  const TU = F("tuna-oil", "Tuna in olive oil, drained", 190, 25, 10, 0, { brand: "Rio Mare", barcode: "8004030044012", serving: { grams: 52, name: "can" }, reviewedAt: "2026-10-20T10:00:00Z", source: "label", photo: "data:image/png;base64,yyy" });
  const RI = F("rice", "Rice, cooked", 130, 2.7, 0.3, 28, { reviewedAt: "2026-10-20T10:00:00Z", source: "label" });
  seed.foods = [TU, RI, ...seed.foods]; seed.items = [{ id: "a", food: TU, grams: 104, locked: false }, { id: "b", food: RI, grams: 200, locked: false }]; seed.cooking = undefined; seed.meals = [];
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-region", "munich");
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { week: 5 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  let shared = null;
  await page.route("**/api/members/foods", async (r) => { if (r.request().method() === "POST") shared = r.request().postDataJSON(); await r.continue(); });
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Tuna with rice: a plain lunch.", around: "Tuna in olive oil, drained", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/search**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ products: [] }) }));
  const text = async (sel = "main") => (await page.locator(sel).first().textContent()).replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  await page.goto(U + "/foods"); await page.waitForTimeout(5500);
  // your reviewed foods went up once, without the photo
  ok(shared && shared.region === "munich" && shared.foods.length === 2 && shared.foods.some((f) => f.name === "Tuna in olive oil, drained" && f.barcode === "8004030044012") && !JSON.stringify(shared).includes("base64"), "DT115: your two reviewed foods travel once, no photo, no starter foods: " + (shared ? shared.foods.map((f) => f.name).join(", ") : "nothing sent"));
  const sentNote = await page.evaluate(() => localStorage.getItem("chefmealan-shared-foods"));
  ok(sentNote && Object.keys(JSON.parse(sentNote)).length >= 2, "DT115: what was sent is noted, so nothing goes twice");
  // Find a food (changed by DT125, 0.2.104): one list; your tuna first, then the members' tins, your market first, then the basic tuna
  await page.getByLabel("Find a food").fill("tuna"); await page.waitForTimeout(1200);
  const mf = page.locator(".rows .row-member");
  ok(await mf.count() === 4, "DT115, DT125: the four foods the others scanned as rows of the one list: " + await mf.count());
  const names = await mf.locator(".name-link").allTextContents();
  ok(names.includes("Τόνος σε νερό") && !names.includes("Tuna in olive oil, drained"), "DT115, 0.2.100: the Greek tuna found by the English word, never your own: " + names.join(", "));
  const order = await page.locator(".rows .row").allTextContents();
  ok(/Tuna in olive oil/.test(order[0]) && /Tuna in water, drained/.test(order[1]) && /basic food/.test(order[order.length - 1]), "DT125: yours first, then members', your market (Munich) first, the basic food last");
  // 0.2.100: and the other way round, the Serbian word finds them all
  await page.getByLabel("Find a food").fill("tunjevina"); await page.waitForTimeout(1200);
  ok((await page.locator(".rows .row-member").count()) >= 3, "0.2.100: tunjevina finds the tuna of every language");
  await page.getByLabel("Find a food").fill("tuna"); await page.waitForTimeout(1200);
  const mt = (await mf.allTextContents()).join(" ");
  ok(/seen in Belgrade/.test(mt) && /seen in Cyprus/.test(mt) && /no barcode/.test(mt), "DT115: each says where it was seen; a food without a barcode says so");
  ok(await page.locator(".also-seen").count() === 0 && await page.locator(".members-foods").count() === 0, "DT125: the old groups and the line under your tuna are gone; one list");
  // Take it copies it
  await mf.filter({ hasText: "Tuna in water" }).getByRole("button", { name: "Take it" }).click(); await page.waitForTimeout(600);
  let s = await st();
  const copy = s.foods.find((f) => f.name === "Tuna in water, drained");
  ok(copy && copy.calories === 99 && copy.barcode === "8004030044005" && copy.source === "Members' foods" && /checked by a member/.test(copy.notes), "DT115: a copy in your foods with the values and the source");
  // 0.2.101: the pack's photo from Open Food Facts travels as a link when the server could fetch it; here the workspace cannot reach OFF, so the row shows the icon and the copy has no photo
  ok(!copy.photo || /^https:\/\/images\.openfoodfacts\.org\//.test(copy.photo), "0.2.101: a copy's photo is only ever an Open Food Facts link: " + (copy.photo || "none"));
  ok(await page.locator(".rows .row-member").count() === 3 && await page.locator(".rows .row").filter({ hasText: "Tuna in water, drained" }).count() === 1, "DT125: the copied food is one row, yours, never twice");
  // 0.2.103: the copy is found by the English word on the Plate, and the Greek tin opens its card before you take it
  ok(Array.isArray(copy.aliases) && copy.aliases.includes("tunjevina"), "0.2.103: the copy carries the other languages' words: " + JSON.stringify(copy.aliases));
  await page.locator(".rows .row-member .name-link", { hasText: "Τόνος" }).click(); await page.waitForTimeout(600);
  ok(/Τόνος σε νερό/.test(await text(".food-card, .sheet, main")) && await page.getByRole("button", { name: /Close/ }).count() >= 1, "0.2.103: a member's food opens its card");
  await page.getByRole("button", { name: /Close/ }).first().click(); await page.waitForTimeout(400);
  // the barcode answers from the catalogue before Open Food Facts
  const prod = await page.evaluate(async () => (await fetch("/api/product/3850102001234")).json());
  ok(prod.members === true && prod.product_name === "Tuna in brine, drained" && /Members' foods · checked by a member on 2026/.test(prod.source) && prod.calories === 105, "DT115: a barcode a member checked answers from the catalogue: " + prod.source);
  // the swap list on the Plate: the same tuna in another state leads, with the difference per can
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(900);
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods.push({ ...s.foods.find((f) => f.name === "Tuna in water, drained"), id: "sr-tuna", name: "Tunjevina u maslinovom ulju", brand: "Eva", barcode: undefined, aliases: ["tuna", "thunfisch"] }); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await page.reload(); await page.waitForTimeout(1500);
  await page.getByLabel("Search all my foods").fill("tuna"); await page.waitForTimeout(500);
  ok((await page.locator(".rows .row-food").allTextContents()).some((t) => /Tunjevina u maslinovom ulju/.test(t)), "0.2.103: tuna finds Tunjevina in the Plate's search");
  await page.getByLabel("Search all my foods").fill(""); await page.waitForTimeout(300);
  await require("./swipe.cjs")(page, page.locator(".swipe-fg", { hasText: "Tuna" }).locator(".name-link, .thumb").first(), "left"); await page.waitForTimeout(1500);
  const rows = await page.locator(".sheet .row-button").allTextContents();
  ok(rows.length > 0 && /^\W*Tuna in (water|brine)/.test(rows[0]) && /the same tuna, another state/.test(rows[0]) && /kcal less per can/.test(rows[0]), "DT115: the same tuna in another state leads the swaps, with the difference per can: " + rows[0]?.slice(0, 160));
  ok(rows.some((r) => /a member's food, seen in Belgrade/.test(r)), "DT115: a member's food in the list says so and where it was seen");
  ok(!rows.some((r) => /Tuna steak, fresh/.test(r)), "DT115: a food without a barcode seen only in Cyprus is not offered in Munich");
  ok(!rows.some((r) => /yeast/i.test(r)), "0.2.96: no ingredient in the swap list");
  await page.locator(".sheet .row-button", { hasText: "Tuna in brine" }).click(); await page.waitForTimeout(700);
  s = await st();
  ok(s.items[0].food.name === "Tuna in brine, drained" && s.foods.some((f) => f.name === "Tuna in brine, drained" && f.source === "Members' foods"), "DT115: taking a member's swap copies the food into your library");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
