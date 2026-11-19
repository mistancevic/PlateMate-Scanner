// Helper for the walkthroughs of 0.3.157 (the meal model, DT308, and DT311): the app on a phone 390 wide on Sunday
// 15 November 2026, 18:00 in Berlin (the day and the time the boards Stories241 to 246 are drawn on), a person with three
// meals a day (07:30, 13:45, 20:00), no recipes, nothing logged, and the reads of a meal photo and of a recipe link answered
// in place of the AI. open() gives a page on the Plate with skyr, oats and a banana on it, or the foods asked for.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const PHOTO = { dish: "Grilled chicken with rice", foods: [
  { name: "Chicken breast, grilled", grams: 180, low: 140, high: 240, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" },
  { name: "Rice, cooked", grams: 150, low: 120, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "medium" }], unsure: null, which: null, course: "main", vessel: "plate", serves: 1 };
// the recipe a link reads: the Margherita pizza of recipe-import.cjs (5 foods, 2 pizzas)
const RSRC = fs.readFileSync(path.join(ROOT, "tests/flows/recipe-import.cjs"), "utf8"), ra = RSRC.indexOf("const read = ");
const RECIPE = eval("(" + RSRC.slice(ra + 13, RSRC.indexOf("\nconst ", ra + 10)).trim().replace(/;$/, "") + ")");
module.exports = async function start(PORT) {
  const U = `http://127.0.0.1:${PORT}`;
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const fails = [], errs = [];
  const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const addFood = async (p, n) => { await (await require("./more.cjs")(p)).fill(n); await p.waitForTimeout(400); await p.locator(".row-food").filter({ hasText: n }).first().getByRole("button", { name: /Add/ }).click(); await p.waitForTimeout(700); };
  const closeMore = async (p) => { const x = p.locator(".add-more-top button").first(); if (await x.count()) { await x.click(); await p.waitForTimeout(300); } };
  // o.foods: what is on the plate; o.time: the clock; o.seed(seed): change the saved state; o.planned: the plan; o.meals: 3 by default
  const open = async (o = {}) => {
    const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = []; seed.title = "";
    if (o.seed) o.seed(seed);
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin", permissions: ["camera"] }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
    await p.clock.install({ time: new Date(o.time || "2026-11-15T18:00:00+01:00") });
    await p.addInitScript(({ s, planned, meals }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals } }));
      if (planned) localStorage.setItem("chefmealan-planned", JSON.stringify(planned));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { s: seed, planned: o.planned || null, meals: o.meals || 3 });
    await require("./adult.cjs")(p);
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", betterAs: "meal", holds: "" }) }));
    await p.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/plate-look", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ vessel: "plate", course: "main" }) }));
    await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PHOTO) }));
    await p.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(RECIPE) }));
    await p.route("**/api/product/**", (r) => r.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "not in the database" }) }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1500);
    for (const n of o.foods || ["Skyr", "Oats", "Banana"]) await addFood(p, n);
    await closeMore(p);
    return p;
  };
  const main = async (p) => ((await p.locator("main").innerText()) ?? "").replace(/\s+/g, " ");
  const body = async (p) => ((await p.locator("body").innerText()) ?? "").replace(/\s+/g, " ");
  const st = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const plan = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned") || "{}"));
  // B150 (0.3.160): the meal line has a small title, Meal and day, drawn in capitals; line() gives what stands under it
  const line = async (p) => ((await p.locator(".meal-line").innerText()) ?? "").replace(/\s+/g, " ").trim().replace(/^meal and day\s+/i, "");
  const row = (p, meal, scope = "") => p.locator(`${scope} .pcal-row`).filter({ hasText: new RegExp("^\\s*(✓\\s*)?" + meal) }).first();
  const rows = async (p, scope = "") => (await p.locator(`${scope} .pcal-row`).allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  const tab = async (p, name) => { await p.locator("nav button").filter({ hasText: name }).click(); await p.waitForTimeout(700); };
  // the camera from + Add more to your plate; a photo taken now, or an older one from Your photos (Saturday 15:57)
  const toCam = async (p) => { await (await require("./more.cjs")(p, "mp")).click(); await p.waitForTimeout(1500); };
  const OLD = path.join(require("node:os").tmpdir(), `plate-old-${PORT}.jpg`); fs.copyFileSync(path.join(ROOT, "tests/flows/plate.jpg"), OLD); { const d0 = new Date("2026-11-14T15:57:00+01:00"); fs.utimesSync(OLD, d0, d0); }
  const toPhoto = async (p, old) => { await toCam(p); if (old) { await p.locator(".camera-ui input[type=file]").setInputFiles(OLD); await p.waitForTimeout(1800); } else { await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(700); await p.locator(".cam-analyze").click(); await p.waitForTimeout(1500); } };
  const readIt = async (p) => { await p.locator(".pa-go .pill").click(); await p.waitForTimeout(2500); };
  const end = async () => { if (errs.length) ok(false, "no page errors: " + errs.join(" | ")); await b.close(); server.kill(); process.exit(fails.length ? 1 : 0); };
  return { b, U, ok, fails, open, addFood, closeMore, main, body, st, plan, line, row, rows, tab, toCam, toPhoto, readIt, end, kill: () => { try { server.kill(); } catch {} } };
};
