const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve("/home/claude/platemate-scanner/tests/flows", "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const F2 = (id, name, calories, protein, fats, carbs, fiber = null) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, table: undefined });
const SM = F2("salmon", "Salmon, baked", 208, 20, 13, 0), RI = F2("rice2", "Rice, cooked", 130, 2.7, 0.3, 28, 0.4), AV = F2("avo", "Avocado", 160, 2, 15, 9, 7), OL = F2("oil2", "Olive oil", 884, 0, 100, 0, 0),
  CH = F2("chk2", "Chicken breast, grilled", 165, 31, 3.6, 0, 0), SA = F2("sal2", "Mixed salad, dressed", 60, 1.2, 4.5, 3.5, 1.5), PA = F2("pasta2", "Pasta, cooked", 158, 5.8, 0.9, 31, 1.8), GO = F2("gouda2", "Gouda cheese", 356, 25, 27, 2.2, 0), TS = F2("ts2", "Tomato sauce", 50, 1.5, 2, 7, 1.5);
seed.foods = [...seed.foods, SM, RI, AV, OL, CH, SA, PA, GO, TS];

seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3292", U = `http://127.0.0.1:${PORT}`;
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
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ["camera"] });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 1, window: { from: "07:00", to: "21:00" } } }));
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

  const put = async (its, title) => { await page.evaluate(([its, title]) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = its.map(([id, g], k) => ({ id: "i" + k, food: s.foods.find((f) => f.id === id), grams: g, locked: false })); s.title = title; s.photo = undefined; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, [its, title]); await page.reload(); await page.waitForTimeout(1800); };
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name) => { await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const note = (sel, text) => page.evaluate(({ sel, text, NOTE }) => { const el = document.querySelector(sel); if (!el) return; const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = text; el.after(d); }, { sel, text, NOTE });
  await page.goto(U + "/plate"); await page.waitForTimeout(1200);
  await put([["pasta2", 1000], ["gouda2", 150], ["ts2", 400]], "Pasta with tomato sauce and cheese");
  await page.evaluate((mark) => { for (const el of document.querySelectorAll(".gate-line")) el.style.cssText += ";" + mark; }, mark);
  await note(".plate-card .row:last-of-type, .plate-card", "Now (0.2.113), one meal a day: the plate is one portion of the meal, yet each food is held to a portion sized for a meal of three a day. 1,000 g of pasta is over 100 to 300 g, 150 g of cheese over 20 to 80 g, so Fit stops at them and the lines read red.");
  await shot("r135now");
  await put([["pasta2", 1000], ["gouda2", 150], ["ts2", 400]], "Pasta with tomato sauce and cheese");
  await page.evaluate((mark) => { for (const el of document.querySelectorAll(".gate-line")) el.remove(); }, mark);
  await page.evaluate(({ NOTE }) => { const c = document.querySelector(".plate-card"); if (!c) return; const rows = c.querySelectorAll(".row"); const last = rows[rows.length - 1]; const d = document.createElement("div"); d.style.cssText = NOTE;
    d.textContent = "New: a food's portion grows with your meal. Your meal is 2,750 kcal; a meal of three a day would be 917, so the most of each food is 3 times: pasta up to 900 g cooked, cheese up to 240 g. The least stays as it is. 1,000 g of pasta reads as a little over your meal's portion (100 to 900 g); the cheese is within it. Fit, Shrink it to one portion and Chef Mealan's ideas use the same ranges. Yeast, baking powder, salt and pepper keep theirs: a dough does not grow with the meal. With 2 meals a day the most is 1.5 times; with 3 or more, as today."; (last || c).after(d); }, { NOTE });
  await page.evaluate(({ mark }) => { const rows = document.querySelectorAll(".plate-card .row"); const p = rows[0]; if (!p) return; const s = document.createElement("small"); s.className = "gate-line"; s.style.cssText = mark; s.textContent = "1,000 g is over your meal's portion of pasta, 100 to 900 g."; p.after(s); }, { mark });
  await shot("r135new");
  await b.close(); server.kill();
})();
