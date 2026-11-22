// DT336 (0.3.174, board Stories274; Go 22 November 2026, 20:47): a tea, coffee, water or salt read from a barcode with no
// values in the product database is saved as 0 with no question: one line says so, the values show 0, there is no box to
// tick, and its PD is said in words. On the Plate it adds its grams and no energy. Any other product with no values gets an
// amber heads-up, and saving it empty still stops, as today. A tea with values is as today.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3601", U = `http://127.0.0.1:${PORT}`;
const none = { calories: null, protein: null, fats: null, carbs: null, fiber: null, table: [], noValues: true, categories: [], source: "Open Food Facts · 2026-11-22" };
const TEA = { product_name: "Peppermint tea", brand: "Herbal & Co", barcode: "4009300000001", ...none };
const COFFEE = { product_name: "Gold", brand: "Roast & Co", barcode: "4009300000003", ...none, categories: ["en:beverages", "en:coffees", "en:instant-coffees"] };
const BISCUIT = { product_name: "Oat biscuits", brand: "Bake & Co", barcode: "4009300000002", ...none };
const CRISPS = { product_name: "Salt and vinegar crisps", brand: "Crunch & Co", barcode: "4009300000005", ...none };
const TEA_VALUES = { product_name: "Green tea", brand: "Leaf & Co", barcode: "4009300000004", ...none, calories: 1, protein: 0, fats: 0, carbs: 0.2, fiber: null, noValues: false };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (product) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"], timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.route("**/api/product/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(product) }));
    await page.route("**/api/offphoto**", (r) => r.fulfill({ status: 404, contentType: "application/json", body: "{}" }));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.goto(U + "/"); await page.waitForTimeout(900);
    await require("./foods.cjs")(page);
    await page.addStyleTag({ content: ".chat-fab { display: none !important }" });
    await page.getByRole("button", { name: "Add a food" }).click(); await page.waitForTimeout(200);
    await (await require("./more.cjs")(page, "scan")).click(); await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /^Barcode$/ }).click(); await page.waitForTimeout(300);
    await page.locator('input[aria-label="Type the barcode"]').fill(product.barcode); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Use the code only" }).click(); await page.waitForTimeout(1500);
    return page;
  };
  const value = (page, name) => page.locator(".label-table .lt-row").filter({ hasText: new RegExp(`^${name}`) }).locator("input").inputValue();
  const box = (page) => page.getByLabel(/I checked the values/).count();
  const stored = (page, name) => page.evaluate((n) => JSON.parse(localStorage.getItem("platemate-pilot-v1")).foods.find((x) => x.name === n) ?? null, name);
  try {
    // AC1: the tea's label check
    let page = await open(TEA);
    ok(await page.locator(".zero-line").first().innerText() === "Tea has almost no calories, so it is saved as 0 kcal.", "DT336 AC1: one line says Tea has almost no calories, so it is saved as 0 kcal.");
    ok((await Promise.all(["Energy", "Fat", "Carbohydrate", "Protein"].map((n) => value(page, n)))).every((v) => v === "0"), "DT336 AC1: energy, fat, carbohydrate and protein show 0");
    ok(await box(page) === 0, "DT336 AC1: there is no box I checked the values");
    ok(await page.locator(".none-line").count() === 0, "DT336 AC1: no heads-up for the tea");
    // AC4 on the label check
    ok(await page.locator(".fit-none").innerText() === "No PD: it has 0 kcal.", "DT336 AC4: the label check says No PD: it has 0 kcal.");
    // AC2: saved with no question
    await page.getByRole("button", { name: /Confirm & save food/ }).click(); await page.waitForTimeout(1300);
    ok(await page.locator(".notice").count() === 0, "DT336 AC2: nothing else is asked");
    const t = await stored(page, "Peppermint tea");
    ok(t && t.calories === 0 && t.protein === 0, "DT336 AC2: saved with 0 kcal and 0 protein");
    ok(t && /No values on the pack\./.test(t.notes), "DT336 AC2: its notes say No values on the pack");
    ok(t && t.zeroKind === "tea" && t.dbEmpty === undefined, "DT336: saved as a tea with no values; nothing of the check is kept");
    // AC4 on the card
    const card = page.locator(".readout-none");
    ok(await card.count() === 1 && /No PD: it has 0 kcal\./.test(await card.innerText()), "DT336 AC4: its card says No PD: it has 0 kcal.");
    ok(!/On plan|\?/.test(await card.innerText()), "DT336 AC4: never a question mark and never On plan");
    // AC5: on the Plate with skyr, oats and a banana, energy and protein stay, the weight grows by the tea's grams
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    const close = page.getByRole("button", { name: "Close" }).first(); if (await close.count()) { await close.click(); await page.waitForTimeout(300); }
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(900);
    const addFood = async (n) => { await (await require("./more.cjs")(page)).fill(n); await page.waitForTimeout(400); await page.locator(".row-food").filter({ hasText: n }).first().getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(700); };
    for (const n of ["Skyr", "Oats", "Banana"]) await addFood(n);
    const readout = async () => (await page.locator(".readout").first().innerText()).replace(/\s+/g, " ");
    const num = (s, re) => Number((s.match(re) || [])[1]?.replace(",", ""));
    const before = await readout();
    await addFood("Peppermint tea");
    const after = await readout();
    const teaG = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); return (s.items || []).find((i) => i.food?.name === "Peppermint tea")?.grams ?? null; });
    ok(teaG > 0, `DT336 AC5: the tea is on the plate, ${teaG} g`);
    ok(num(before, /Energy ([\d,]+) kcal/) === num(after, /Energy ([\d,]+) kcal/) && num(before, /Protein ([\d.]+) g/) === num(after, /Protein ([\d.]+) g/), `DT336 AC5: the plate's energy and protein stay (${before} / ${after})`);
    ok(num(after, /Weight ([\d,]+) g/) - num(before, /Weight ([\d,]+) g/) === teaG, "DT336 AC5: its weight grows by the tea's grams");
    await page.context().close();
    // AC3: a coffee by its category
    page = await open(COFFEE);
    ok(await page.locator(".zero-line").first().innerText() === "Coffee has almost no calories, so it is saved as 0 kcal.", "DT336 AC3: a coffee by its category is handled as the tea");
    ok(await box(page) === 0, "DT336 AC3: no box for the coffee");
    await page.getByRole("button", { name: /Confirm & save food/ }).click(); await page.waitForTimeout(1300);
    const c = await stored(page, "Gold");
    ok(c && c.calories === 0 && c.zeroKind === "coffee", "DT336 AC3: the coffee is saved as 0, with no question");
    await page.context().close();
    // AC7: a biscuit with no values
    page = await open(BISCUIT);
    const heads = page.locator(".none-line");
    ok(await heads.count() === 1 && (await heads.innerText()).trim() === "The name is read, but the database has no values for this product. Type them from the nutrition table on the pack, then save.", "DT336 AC7: one amber line says the database has no values, type them from the pack");
    ok(await heads.locator("svg").count() === 1 && /warn-box/.test(await heads.getAttribute("class")), "DT336 AC7: the warn-box look, with the warning triangle");
    ok((await Promise.all(["Energy", "Protein"].map((n) => value(page, n)))).every((v) => v === ""), "DT336 AC7: the values are empty");
    ok(await box(page) === 1, "DT336 AC7: the box I checked the values is there");
    ok(await page.locator(".zero-line").count() === 0, "DT336 AC7: the biscuit is never 0");
    await page.getByRole("button", { name: /Confirm & save food/ }).click(); await page.waitForTimeout(600);
    const lines = await page.locator(".notice").allInnerTexts();
    ok(lines.includes("Energy and protein are required to calculate PD.") && lines.some((l) => /Confirm the label/.test(l)), "DT336 AC7: saving it empty still stops with the same lines as today");
    ok(await stored(page, "Oat biscuits") === null, "DT336 AC7: nothing is saved");
    await page.getByLabel("Energy").fill("420"); await page.waitForTimeout(200);
    ok(await heads.count() === 0, "DT336: the heads-up goes once a value is typed");
    await page.context().close();
    // the words that block the 0: salt and vinegar crisps are never 0
    page = await open(CRISPS);
    ok(await page.locator(".zero-line").count() === 0 && await page.locator(".none-line").count() === 1, "DT336: salt and vinegar crisps get the heads-up, never 0");
    await page.context().close();
    // AC8: a tea with values
    page = await open(TEA_VALUES);
    ok(await value(page, "Energy") === "1" && await box(page) === 1, "DT336 AC8: a tea with values shows the database's values and the box, as today");
    ok(await page.locator(".zero-line").count() === 0 && await page.locator(".none-line").count() === 0, "DT336 AC8: no new line for a tea with values");
    await page.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
