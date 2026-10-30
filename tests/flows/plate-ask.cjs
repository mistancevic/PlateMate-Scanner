// JOURNEY (0.2.113, board Stories87, DT131; Milan 27 October 13:52 and 14:37 "Go"): when a batch of foods is about to land on a
// plate that has foods (a photo read, Make it from Recipes, a meal from Plan), the Plate asks first: Add to my plate, or
// Start a new plate; Drop the photo or Keep my plate leaves it as it is. No question on an empty plate.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const Fd = (re) => seed.foods.find((f) => re.test(f.name));
seed.meals = [{ id: "m-lentil", title: "Lentil soup", items: [{ id: "l1", food: Fd(/^Eggs/), grams: 120, locked: true }, { id: "l2", food: Fd(/^Oats/), grams: 60, locked: true }], portion: 180, savedAt: "2026-10-20T10:00:00Z" }];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3278", U = `http://127.0.0.1:${PORT}`;
const PLATE = fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg"));
// the plate photo with an EXIF block: DateTimeOriginal, as a phone's camera writes it
const withExif = (when) => {
  const le = (n, b) => { const x = Buffer.alloc(b); b === 2 ? x.writeUInt16LE(n) : x.writeUInt32LE(n); return x; };
  const tiff = Buffer.concat([Buffer.from("II"), le(42, 2), le(8, 4), le(1, 2), le(0x8769, 2), le(4, 2), le(1, 4), le(26, 4), le(0, 4),
    le(1, 2), le(0x9003, 2), le(2, 2), le(20, 4), le(44, 4), le(0, 4), Buffer.from(when + "\0", "ascii")]);
  const app1 = Buffer.concat([Buffer.from("Exif\0\0", "binary"), tiff]);
  const head = Buffer.from([0xff, 0xe1, (app1.length + 2) >> 8, (app1.length + 2) & 255]);
  return Buffer.concat([PLATE.subarray(0, 2), head, app1, PLATE.subarray(2)]);
};
const READ = { dish: "Grilled chicken with rice and salad", foods: [
  { name: "Chicken breast, grilled", grams: 180, low: 140, high: 240, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" },
  { name: "Rice, cooked", grams: 150, low: 120, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "medium" },
  { name: "Mixed salad, dressed", grams: 90, low: 60, high: 120, calories: 60, protein: 1.2, fats: 4.5, carbs: 3.5, fiber: 1.5, confidence: "medium" },
], unsure: null };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1, permissions: ["camera"] });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3, window: { from: "07:00", to: "21:00" } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const sent = [];
  await page.route("**/api/plate-photo", async (r) => { sent.push(r.request().postDataJSON()); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }); });
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A plain lunch plate.", around: "", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
  const text = async (sel = "main") => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ");
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const pick = async (when) => { await page.locator(".camera-ui input[type=file]").setInputFiles({ name: "plate.jpg", mimeType: "image/jpeg", buffer: withExif(when) }); await page.waitForTimeout(1200); };
  const toPlate = async () => { await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(600); };
  const chips = async () => (await page.locator(".pa-chip").allTextContents()).map((s) => s.replace(/\s+/g, " ").trim());

  const typed = async () => { await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const f = (re) => s.foods.find((x) => re.test(x.name));
    s.items = [{ id: "c1", food: f(/^Chicken breast, cooked/i) || s.foods[0], grams: 180, locked: false }, { id: "c2", food: f(/^Rice/) || s.foods[1], grams: 150, locked: false }]; s.title = "Chicken and rice"; s.photo = undefined; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }); await page.reload(); await page.waitForTimeout(1500); };
  const shoot = async () => { await page.locator(".mp-button").click(); await page.waitForTimeout(1500); await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(2000); };
  await page.goto(U + "/plate"); await page.waitForTimeout(1500);
  await typed();
  ok((await st()).items.length === 2, "the plate holds chicken and rice, typed in");
  // a photo onto a plate that has foods: the question, Add first
  await shoot();
  ok(sent.length === 1 && (await st()).items.length === 2, "DT131: the photo is read; nothing lands yet");
  const ask = await text(".plate-ask");
  ok(/Your plate already has 2 foods: Chicken and rice\.\s?The photo read 3 foods: chicken breast ~180 g, rice ~150 g, mixed salad ~90 g\./.test(ask), "DT131: the card names what is there and what waits: " + ask.slice(0, 160));
  const btns = (await page.locator(".plate-ask .pa-go button").allTextContents()).join();
  ok(btns === "Add to my plate,Start a new plate" && (await page.locator(".plate-ask .pill-primary").textContent()) === "Add to my plate" && /Drop the photo/.test(ask), "DT131: for a photo, Add to my plate first, Start a new plate, Drop the photo: " + btns);
  await page.getByRole("button", { name: "Add to my plate" }).click(); await page.waitForTimeout(500);
  let s = await st();
  ok(s.items.length === 5 && s.title === "Chicken and rice" && s.items.filter((i) => i.est).length === 3 && s.photo && await page.locator(".plate-ask").count() === 0, "DT131: Add: five foods, yours as they were, the photo's three marked ~, the name kept, the photo on the plate");
  // Start a new plate
  await typed(); await shoot();
  await page.getByRole("button", { name: "Start a new plate" }).click(); await page.waitForTimeout(500);
  s = await st();
  ok(s.items.length === 3 && s.items.every((i) => i.est) && s.title === "Grilled chicken with rice and salad", "DT131: Start a new plate: only the photo's foods, the read's name");
  // Drop the photo
  await typed(); await shoot();
  await page.getByRole("button", { name: "Drop the photo" }).click(); await page.waitForTimeout(400);
  s = await st();
  ok(s.items.length === 2 && s.title === "Chicken and rice" && !s.photo && await page.locator(".plate-ask").count() === 0, "DT131: Drop the photo: the plate as it was");
  // a recipe from Recipes onto the plate: Start a new plate first, Keep my plate
  await typed();
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(1200);
  await page.getByText("Lentil soup").first().click(); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^(Make it|Change it first)/ }).first().click(); await page.waitForTimeout(900);
  const ask2 = await text(".plate-ask");
  ok(/Your plate already has 2 foods: Chicken and rice\.\s?Lentil soup from your recipes has 2 foods\./.test(ask2) && (await page.locator(".plate-ask .pa-go button").allTextContents()).join() === "Start a new plate,Add to my plate" && /Keep my plate/.test(ask2), "DT131: a recipe: Start a new plate first, Add to my plate, Keep my plate: " + ask2.slice(0, 140));
  await page.getByRole("button", { name: "Keep my plate" }).click(); await page.waitForTimeout(400);
  s = await st();
  ok(s.items.length === 2 && s.title === "Chicken and rice", "DT131: Keep my plate: nothing changes");
  // an empty plate: no question
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = []; s.title = ""; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }); await page.reload(); await page.waitForTimeout(1500);
  await shoot();
  ok(await page.locator(".plate-ask").count() === 0 && (await st()).items.length === 3, "DT131: an empty plate: the photo lands at once, no question");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
