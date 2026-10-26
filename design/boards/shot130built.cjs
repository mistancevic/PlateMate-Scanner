// JOURNEY (0.2.110, board Stories78, DT130 variant A; Milan 26 October 12:00, 15:45, 16:18 "An idea. Build"): Photo of my
// meal opens the same camera as Scan, with Meal as a fourth mode: the round frame, The whole plate, from above, the shutter,
// Your photos. The shutter reads at once. A photo from Your photos asks one thing on the Plate before the read: whose plate,
// and when. Three short chips, one on; nothing happens until Read the plate. Ate at 12:40 logs it then, in the meal that time
// belongs to. An idea: the same read and gates; the buttons are for cooking it (Fit it, Save as an idea, Put it in my plan)
// and nothing is logged; its photo is the recipe's picture, never offered to members. The read is a stand-in (no AI here).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3276", U = `http://127.0.0.1:${PORT}`;
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
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, permissions: ["camera"] });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3, window: { from: "07:00", to: "21:00" } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(page);
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

  const flat = (p = page) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const R = "/home/claude/boards/rs";
  const shot = async (name, full = true) => { await page.waitForTimeout(400); await page.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot " + name); };
  await page.goto(U + "/"); await page.waitForTimeout(1500);
  await page.locator(".mp-card").click(); await page.waitForTimeout(2000);
  await shot("b130cam", false);
  await page.locator(".cam-round").first().click(); await page.waitForTimeout(500);
  await toPlate();
  await page.locator(".mp-button").click(); await page.waitForTimeout(1500);
  await pick("2026:10:25 12:20:00");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".plate-card").screenshot({ path: `${R}/b130ask.png` }); console.log("shot b130ask");
  await page.locator(".pa-chip").filter({ hasText: "An idea" }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "Put it in my plan" }).click(); await page.waitForTimeout(300);
  await flat(); await shot("b130idea");
  await b.close(); server.kill();
})();
