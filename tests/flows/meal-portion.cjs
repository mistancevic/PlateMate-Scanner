// JOURNEY (0.2.116, board Stories92, DT135; Milan 27 October 15:34 "Everything should follow this approach", Go at 17:00): a
// food's portion grows with the meal. One meal a day is 3 meals of three a day: pasta up to 900 g cooked, cheese up to 240 g;
// the least stays; yeast keeps 3 to 10 g; Add puts a food on in the middle of the meal's range (penne 200 g, not 80 g).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const F2 = (id, name, calories, protein, fats, carbs, fiber = null) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, table: undefined });
const SM = F2("salmon", "Salmon, baked", 208, 20, 13, 0), RI = F2("rice2", "Rice, cooked", 130, 2.7, 0.3, 28, 0.4), AV = F2("avo", "Avocado", 160, 2, 15, 9, 7), OL = F2("oil2", "Olive oil", 884, 0, 100, 0, 0),
  CH = F2("chk2", "Chicken breast, grilled", 165, 31, 3.6, 0, 0), SA = F2("sal2", "Mixed salad, dressed", 60, 1.2, 4.5, 3.5, 1.5), PA = F2("pasta2", "Pasta, cooked", 158, 5.8, 0.9, 31, 1.8), GO = F2("gouda2", "Gouda cheese", 356, 25, 27, 2.2, 0), TS = F2("ts2", "Tomato sauce", 50, 1.5, 2, 7, 1.5), PE = F2("penne3", "Penne, dry", 360, 13, 1.5, 72, 3), YE = F2("yeast3", "Dry yeast", 325, 40, 7.6, 15, 27);
seed.foods = [...seed.foods, SM, RI, AV, OL, CH, SA, PA, GO, TS, PE, YE];

seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3297", U = `http://127.0.0.1:${PORT}`;
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
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 1, window: { from: "18:00", to: "19:00" } } }));
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

  const put = async (its, title) => { await page.evaluate(([its, title]) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = its.map(([id, g], k) => ({ id: "i" + k, food: s.foods.find((f) => f.id === id), grams: g, locked: false })); s.title = title; s.photo = undefined; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === "platemate-pilot-v1") return; return o.call(this, k, v); }; }, [its, title]); await page.reload(); await page.waitForTimeout(1800); };
  await page.goto(U + "/"); await page.waitForTimeout(1500);
  await toPlate();
  const lines = async () => (await page.locator(".gate-line").allTextContents()).map((s) => s.replace(/\s+/g, " ").trim());
  await put([["pasta2", 1000], ["gouda2", 150], ["ts2", 400]], "Pasta with tomato sauce and cheese");
  let l = await lines();
  ok(l.includes("1000 g is over your meal's portion of pasta, 100 to 900 g."), "DT135: 1,000 g pasta is over your meal's portion, 100 to 900 g: " + l.join(" | "));
  ok(!l.some((x) => /gouda/i.test(x)), "DT135: 150 g cheese is within your meal's portion, up to 240 g");
  await put([["pasta2", 800], ["gouda2", 150], ["ts2", 400]], "Pasta with tomato sauce and cheese");
  l = await lines();
  ok(!l.some((x) => /portion of (pasta|gouda)/i.test(x)), "DT135: 800 g pasta and 150 g cheese, no portion line: " + l.join(" | "));
  await put([["pasta2", 800], ["yeast3", 20]], "Pasta");
  l = await lines();
  ok(l.some((x) => /^20 g is over a portion of dry yeast, 3 to 10 g\./.test(x)), "DT135: yeast keeps 3 to 10 g: " + l.join(" | "));
  await put([], "");
  await page.getByLabel("Search all my foods").fill("Penne"); await page.waitForTimeout(600);
  await page.locator(".row-food").filter({ hasText: "Penne, dry" }).first().getByRole("button", { name: /Add/ }).click(); await page.waitForTimeout(800);
  const pen = (await st()).items.find((i) => i.food.id === "penne3");
  ok(pen && pen.grams === 200, "DT135: Add puts penne on at 200 g, the middle of the meal's 40 to 360 g: " + (pen && pen.grams));
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
