// JOURNEY (0.2.108, board Stories75, DT127; Milan 25 October 14:26 to 16:29): a photo of the meal in front of you. One tap on
// Today or the Plate, the read lands on the Plate as estimates (~, a range, a tap to correct), the photo stays on it (small in
// the line, large with the foods over it), the three gates read it, Chef Mealan's line says what to do by code, and the
// buttons log it now: Ate it, Ate half (the other half kept on Today), Not mine. A food read from the photo gets no
// ingredient line (the olive oil in the dressing). The read is a stand-in (no AI here).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3272", U = `http://127.0.0.1:${PORT}`;
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg")).toString("base64");
const READ = { dish: "Grilled chicken with rice and salad", foods: [
  { name: "Chicken breast, grilled", grams: 180, low: 140, high: 240, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" },
  { name: "Rice, cooked", grams: 150, low: 120, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "medium" },
  { name: "Mixed salad, dressed", grams: 90, low: 60, high: 120, calories: 60, protein: 1.2, fats: 4.5, carbs: 3.5, fiber: 1.5, confidence: "medium" },
  { name: "Olive oil", grams: 8, low: 5, high: 15, calories: 884, protein: 0, fats: 100, carbs: 0, fiber: 0, confidence: "low" },
], unsure: { name: "Chicken breast, grilled", options: [180, 350] } };
const BIG = { dish: "Schnitzel with fries", foods: [
  { name: "Pork schnitzel, breaded, fried", grams: 300, low: 240, high: 360, calories: 290, protein: 20, fats: 18, carbs: 12, fiber: 0.5, confidence: "medium" },
  { name: "Fries", grams: 250, low: 200, high: 320, calories: 312, protein: 3.4, fats: 15, carbs: 41, fiber: 3.5, confidence: "medium" },
], unsure: null };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await (await b.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1, permissions: ["camera"] })).newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3, window: { from: "07:00", to: "21:00" } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  let read = READ; const sent = [];
  await page.route("**/api/plate-photo", async (r) => { sent.push(r.request().postDataJSON()); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }); });
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A plain lunch plate.", around: "", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
  const text = async (sel = "main") => (await page.locator(sel).first().textContent()).replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  // 0.2.110 (DT130): Photo of my meal opens the meal camera; the shutter reads at once
  const snap = async (sel) => { await page.locator(sel).click(); await page.waitForTimeout(1500); await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(2000); };

  // Today: one tap
  await page.goto(U + "/"); await page.waitForTimeout(1500);
  ok(await page.locator(".mp-card").count() === 1 && /Photo of my meal/.test(await text(".mp-card")), "DT127: Today has Photo of my meal");
  await snap(".mp-card");
  ok(sent.length === 1 && /^data:image\/jpeg;base64,/.test(sent[0].image) && Array.isArray(sent[0].library), "DT127: the photo goes to the read, with your food names");
  ok(/\/plate/.test(page.url()) || await page.locator(".plate-card").count() === 1, "DT127: the read lands on the Plate");
  // the rows as estimates, the photo in the line
  const s1 = await st();
  ok(s1.items.length === 4 && s1.items.every((i) => i.est && i.est.low <= i.grams && i.grams <= i.est.high) && s1.title === "Grilled chicken with rice and salad", "DT127: four rows at the read's grams, each an estimate with its range; the dish is the title");
  ok(s1.items.some((i) => /salad/i.test(i.food.name) && i.food.source === "estimate" && i.food.calories === 60) && s1.foods.some((f) => /salad/i.test(f.name)), "DT127: the dressed salad is an estimate with the read's values, added to your foods");
  ok(await page.locator(".mp-line img").count() === 1 && /Your photo, 13:05\. 4 foods read, amounts estimated/.test(await text(".mp-line")), "DT127: the photo small in the line on top, with the time");
  ok(await page.locator(".plate-card .mp-est").count() === 4, "DT127: a ~ before each estimated amount");
  // no ingredient line for the oil read from the photo
  ok(await page.locator(".gate-card").count() === 1 && !/Olive oil is an ingredient/.test(await text(".gate-card")), "DT127: the olive oil read from the photo gets no ingredient line (C6 note)");
  // the one question
  ok(/is the chicken breast about 180 g or 350 g\?/.test(await text(".mp-ask")), "DT127: one question, the food the read is least sure about, two amounts");
  await page.locator(".mp-ask").getByRole("button", { name: "~350 g" }).click(); await page.waitForTimeout(500);
  const s2 = await st();
  ok(s2.items.find((i) => /chicken/i.test(i.food.name)).grams === 350 && !s2.items.find((i) => /chicken/i.test(i.food.name)).est && !s2.photo.unsure && await page.locator(".mp-ask").count() === 0, "DT127: the answer sets the amount, drops its estimate and closes the question");
  ok(await page.locator(".plate-card .mp-est").count() === 3, "DT127: the corrected row has no ~");
  // the photo large, with the foods over it
  await page.locator(".mp-line").click(); await page.waitForTimeout(300);
  const tags = await page.locator(".mp-tags span").allTextContents();
  ok(await page.locator(".mp-big img").count() === 1 && tags.length === 4 && tags.some((t) => /^Chicken breast 350 g$/.test(t)) && tags.some((t) => /^Rice ~150 g$/.test(t)), "DT127: the photo large, each food named over it at its amount: " + tags.join(" | "));
  await page.getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(200);
  // Chef Mealan's line and the buttons
  const say = await text(".mp-say");
  ok(/^Chef Mealan: Eat it as it is\. About [\d,]+( to [\d,]+)? kcal and \d+ g protein, a full lunch for your day/.test(say), "DT127: the line by code: eat it as it is, the energy as a range, the protein: " + say);
  const btns = await page.locator(".mp-say .button-row button").allTextContents();
  ok(btns.join() === "Ate it,Ate half,Add a food,Not mine" && await page.locator(".mp-say .pill-primary").textContent() === "Ate it", "DT127: the buttons, the advice first: " + btns.join());
  // Ate it logs it now, with the photo, at the meal of the moment
  await page.getByRole("button", { name: "Ate it", exact: true }).click(); await page.waitForTimeout(600);
  const s3 = await st();
  const card = s3.feedback.find((f) => f.status === "eaten");
  ok(card && card.meal.title === "Grilled chicken with rice and salad" && card.slot && /lunch/i.test(card.slot.name) && !card.meal.items.some((i) => i.est), "DT127: Ate it logs the plate as eaten, as lunch; the estimate marks do not travel");
  // the photos live in their own store, not in the saved state: the card on Today shows it
  ok(await page.locator(".card").filter({ hasText: "Grilled chicken with rice and salad" }).locator("img").count() >= 1, "DT127: the card on Today carries the photo");
  ok(s3.items.length === 0 && !s3.photo && /Today/.test(await text("header, .topbar, main")), "DT127: the plate is empty and the photo gone; back on Today");
  // the restaurant plate: one portion (changed by DT133, 0.2.113: portions, not half)
  read = BIG;
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600);
  ok(await page.locator(".mp-button").count() === 1, "DT127: the Plate has Photo of my meal next to Manual and Scan");
  await snap(".mp-button");
  const big = await text(".mp-say");
  ok(/^Chef Mealan: Be aware: this plate is about 2 portions of your (lunch|dinner), about [\d,]+ to [\d,]+ kcal for a (lunch|dinner) of about [\d,]+\. Eat one portion and keep the rest\./.test(big), "DT133: the big plate in portions, by code from the size line: " + big);
  ok((await page.locator(".mp-say .button-row button").allTextContents()).slice(0, 2).join() === "Ate one portion,Ate it all", "DT133: Ate one portion first, then Ate it all");
  await page.getByRole("button", { name: "Ate one portion" }).click(); await page.waitForTimeout(600);
  const s4 = await st();
  const half = s4.feedback.filter((f) => f.meal.title.startsWith("Schnitzel"));
  ok(half.length === 2 && half.some((f) => f.status === "eaten" && f.meal.items[0].grams === 150) && half.some((f) => f.status === "prepared" && /the other portion$/.test(f.meal.title)), "DT133: one portion logged as eaten, the other portion kept on Today");
  // Not mine clears it
  read = READ;
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600);
  await snap(".mp-button");
  await page.getByRole("button", { name: "Not mine" }).click(); await page.waitForTimeout(400);
  const s5 = await st();
  ok(s5.items.length === 0 && !s5.photo, "DT127: Not mine empties the plate and drops the photo");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
