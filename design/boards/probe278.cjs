// DT247 (0.3.96, board Stories183; Coach Milan 6 November, "Ok. A. We will test it", Go 12:24): two dishes in one meal.
// A second photo soon after a meal asks once: Dessert to your dinner, or its own snack; within an hour Dessert is the main
// button. One meal, two dishes: each keeps its own photo and foods; the meal adds them up; tap a dish to work on it, and a
// change goes to that dish only. Fit to my target works on the dish you are on and counts the other as it is.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/pm290", PORT = "3493", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync("/home/claude/pm290/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.meals = []; seed.items = [];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "estimate", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const CAKE = { dish: "Brownie cheesecake", foods: [{ name: "Brownie cheesecake", grams: 110, low: 90, high: 140, calories: 380, protein: 6, fats: 24, carbs: 36, fiber: 1, confidence: "medium" }], unsure: null };
const day = (h, m) => new Date(2026, 10, 6, h, m).toISOString();
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync("/home/claude/pm290/tests/flows/plate.jpg").toString("base64");
const SALAD = [["r1", F("ch", "Chicken thigh, grilled", 209, 26, 11, 0), 120], ["r2", F("cu", "Cucumber", 15, 0.7, 0.1, 3.6), 120], ["r3", F("fe", "Feta cheese", 264, 14, 21, 4), 40]].map(([id, food, grams]) => ({ id, food, grams, locked: false }));
const DINNER = { date: "2026-11-06", slotId: "dinner", name: "Dinner", time: "20:00" };
const salad = (at) => ({ id: "salad", meal: { id: "ms", title: "Chicken salad with feta", items: SALAD, portion: 280, savedAt: at }, status: "eaten", taste: "", notes: "", createdAt: at, slot: DINNER, photo: PHOTO, photos: [PHOTO] });
const cakeCard = { id: "cake", meal: { id: "mc", title: "Brownie cheesecake", items: [{ id: "k1", food: F("bc", "Brownie cheesecake", 380, 6, 24, 36), grams: 110, locked: false }], portion: 110, savedAt: day(19, 55) }, status: "eaten", taste: "", notes: "", createdAt: day(19, 55), slot: DINNER, course: "dessert" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"], ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (state, { clock = day(20, 0) } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "en-GB", timezoneId: "Europe/Berlin", permissions: ["camera"] });
    const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message)); await p.clock.setFixedTime(new Date(clock));
    await p.addInitScript(({ s }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { s: state });
    await require("/home/claude/pm290/tests/flows/adult.cjs")(p);
    for (const r of ["cover", "dish", "meal", "members/foods**"]) await p.route(`**/api/${r}`, (x) => x.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CAKE) }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1600);
    if (/could not be read/.test(await p.locator("body").innerText())) throw new Error("the seed is not a valid state");
    return p;
  };
  const photo = async (p) => { await p.locator(".mp-button").first().click(); await p.waitForTimeout(1500); await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(400); if (await p.locator(".cam-analyze").count()) await p.locator(".cam-analyze").click(); await p.waitForTimeout(2500); };
  const saved = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1") || "{}"));
  const main = (p) => p.locator("main").innerText();
  const text = async (l) => ((await l.count()) ? (await l.first().innerText()).replace(/\s+/g, " ") : "none");
  const R = "/home/claude/boards/rs";
  try {
    let p = await open({ ...seed, feedback: [salad(day(19, 59))] }); await photo(p);
    await p.screenshot({ path: R + "/x278a.png", fullPage: true });
    await p.locator(".dish-ask .ca-go button").nth(1).click(); await p.waitForTimeout(1200);
    await p.screenshot({ path: R + "/x278b.png", fullPage: true });
    console.log(await p.locator("main").innerText());
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
