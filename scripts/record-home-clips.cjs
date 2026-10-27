// HP2 (0.2.114, board Stories90; Milan 27 October 14:25 to 15:34): the home page's short clips, recorded from the real app on
// test data. Start from anything: a barcode, a nutrition label, a group of labels, a photo of the meal; one plate; recipes for
// your day; the shopping list. The AI's answers are stand-ins (page.route) and the pack is invented (Fjell Skyr): no real brand.
// Run after npm run build: node scripts/record-home-clips.cjs. Writes public/landing/way-*.mp4, .webm and .webp.
const { chromium } = require("playwright");
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const ROOT = path.resolve(__dirname, ".."), OUT = path.join(ROOT, "public/landing");
const PORT = "3296", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const Fd = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: Fd(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(from ? { from } : {}) }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4);
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1, "coach");
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8);
const planned = (m, source) => { const w = m.items.reduce((s, i) => s + i.grams, 0), r = Math.min(1, m.portion / w); const k = m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0) * r, p = m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0) * r; return { title: m.title, kcal: Math.round(k), protein: Math.round(p), source, mealId: m.id, items: m.items, portion: m.portion }; };
const svg = (x) => "data:image/svg+xml;base64," + Buffer.from(x).toString("base64");
const PACK = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#cdbb9f"/><rect x="120" y="140" width="360" height="520" rx="28" fill="#f7f5ef" stroke="#d8d2c4" stroke-width="4"/><rect x="120" y="190" width="360" height="120" fill="#2e5d8f"/><text x="300" y="262" font-family="Georgia" font-size="54" fill="#fff" text-anchor="middle">Fjell</text><text x="300" y="370" font-family="Arial" font-weight="700" font-size="44" fill="#2e5d8f" text-anchor="middle">SKYR</text><text x="300" y="412" font-family="Arial" font-size="26" fill="#2e5d8f" text-anchor="middle">natural · 450 g</text><rect x="190" y="460" width="220" height="150" fill="#fff"/>${Array.from({ length: 38 }, (_, i) => `<rect x="${200 + i * 5.3}" y="470" width="${(i * 7) % 3 + 1}" height="110" fill="#111"/>`).join("")}<text x="300" y="604" font-family="monospace" font-size="20" text-anchor="middle">4 006040 123456</text></svg>`);
const LABEL = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#e9e2d0"/><rect x="150" y="190" width="300" height="420" fill="#fff" stroke="#222" stroke-width="3"/><text x="165" y="228" font-family="Arial" font-weight="700" font-size="22">Nutrition declaration</text><text x="165" y="256" font-family="Arial" font-size="17">per 100 g</text>${[["Energy", "263 kJ / 63 kcal"], ["Fat", "0.2 g"], ["of which saturates", "0.1 g"], ["Carbohydrate", "4.0 g"], ["of which sugars", "4.0 g"], ["Protein", "11 g"], ["Salt", "0.1 g"]].map(([a, b], i) => `<line x1="165" x2="435" y1="${272 + i * 46}" y2="${272 + i * 46}" stroke="#222" stroke-width="1.5"/><text x="165" y="${302 + i * 46}" font-family="Arial" font-size="17">${a}</text><text x="435" y="${302 + i * 46}" font-family="Arial" font-size="17" text-anchor="end">${b}</text>`).join("")}</svg>`);
const PLATE = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "design/boards/photo-chicken.jpg")).toString("base64");
const SKYR = { success: true, product_name: "Fjell Skyr natural", brand: "Fjell", basis: "100g", calories: 66, protein: 11.6, fats: 0.3, carbs: 3.8, fiber: 0, notes: "", error_reason: "", table: [], source: "Product database · review required" };
const READ = { dish: "Grilled chicken with rice and salad", foods: [
  { name: "Chicken breast, grilled", grams: 180, low: 140, high: 240, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" },
  { name: "Rice, cooked", grams: 150, low: 120, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "medium" },
  { name: "Mixed salad, dressed", grams: 90, low: 60, high: 120, calories: 60, protein: 1.2, fats: 4.5, carbs: 3.5, fiber: 1.5, confidence: "medium" }], unsure: null };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await sleep(500); } }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clips-"));
  // the camera sees a picture: each one becomes a fake camera feed, so the photos taken in the clip show it too
  const feeds = {};
  { const b0 = await chromium.launch(); const pg = await b0.newPage({ viewport: { width: 720, height: 960 } });
    for (const [k, src] of [["pack", PACK], ["label", LABEL], ["plate", PLATE]]) {
      await pg.setContent(`<body style="margin:0"><img src="${src}" style="width:720px;height:960px;object-fit:cover"></body>`); await sleep(300);
      const png = path.join(tmp, `${k}.png`); await pg.screenshot({ path: png });
      feeds[k] = path.join(tmp, `${k}.y4m`);
      execFileSync("ffmpeg", ["-y", "-loop", "1", "-i", png, "-t", "2", "-r", "15", "-vf", "scale=720:960,format=yuv420p", feeds[k]], { stdio: "ignore" });
    }
    await b0.close(); }
  const clip = async (name, run, x = {}) => {
    const dir = path.join(tmp, name); fs.mkdirSync(dir);
    const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", ...(x.feed ? [`--use-file-for-fake-video-capture=${feeds[x.feed]}`] : [])] });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, permissions: ["camera"], timezoneId: "Europe/Berlin", recordVideo: { dir, size: { width: 390, height: 844 } } });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date(x.time || "2026-10-25T13:05:00"));
    const s = { ...seed, items: x.items ?? [], meals: x.meals ?? [], feedback: [], ...(x.state || {}) };
    await page.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-12T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z", aiConfirmedAt: "2026-10-05T08:00:00Z" }));
      if (plan) localStorage.setItem("chefmealan-planned", JSON.stringify(plan));
      localStorage.setItem("seeded", "1"); }, [s, x.plan || null]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Grilled chicken with rice and salad: a plain lunch plate.", around: "", better_as: "" }) }));
    await page.route("**/api/product/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SKYR) }));
    await page.route("**/api/scan", (r) => { const group = r.request().postDataJSON()?.mode === "group"; r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(group ? { entities: [SKYR] } : SKYR) }); });
    await page.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }));
    const t0 = Date.now();
    await page.goto(U + (x.path || "/plate")); await sleep(1600);
    let from = (Date.now() - t0) / 1000;
    // the clip starts where the run says (after the camera has opened), else when the page has loaded
    await run(page, () => { from = (Date.now() - t0) / 1000; });
    const video = page.video(); await ctx.close(); await b.close(); const raw = await video.path();
    const len = (Date.now() - t0) / 1000 - from;
    const base = path.join(OUT, `way-${name}`);
    const cut = ["-y", "-ss", from.toFixed(2), "-i", raw, "-t", Math.min(len, 12).toFixed(2), "-an"];
    execFileSync("ffmpeg", [...cut, "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${base}.mp4`], { stdio: "ignore" });
    execFileSync("ffmpeg", [...cut, "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-deadline", "good", "-cpu-used", "4", `${base}.webm`], { stdio: "ignore" });
    execFileSync("ffmpeg", ["-y", "-ss", "0.4", "-i", `${base}.mp4`, "-frames:v", "1", "-c:v", "libwebp", "-quality", "70", `${base}.webp`], { stdio: "ignore" });
    console.log("clip", name, `${len.toFixed(1)} s`);
  };
  const manual = async (page) => { const sw = page.locator(".auto-switch"); if (await sw.count() && /Auto shot/.test(await sw.textContent())) { await sw.click(); await sleep(200); } };
  const scan = async (page) => { await page.getByRole("button", { name: "Scan", exact: true }).first().click(); await page.locator(".auto-switch").waitFor({ timeout: 4000 }).catch(() => {}); await manual(page); await sleep(800); };
  const mode = async (page, m) => { await page.locator(".cam-modes button").filter({ hasText: m }).click(); await sleep(500); };
  try {
    await clip("barcode", async (page, mark) => {
      await scan(page); await manual(page); await mode(page, "Barcode"); mark(); await sleep(1400);
      const f = page.getByLabel("Type the barcode"); await f.click(); await f.pressSequentially("4006040123456", { delay: 70 }); await sleep(400);
      await page.getByRole("button", { name: "Look up" }).click(); await sleep(1200);
      await page.getByRole("button", { name: "Use the code only" }).click(); await sleep(3600);
    }, { feed: "pack" });
    await clip("label", async (page, mark) => {
      await scan(page); await manual(page); await mode(page, "Label"); mark(); await sleep(1300);
      await page.locator("#camera-shutter-button").click(); await sleep(1100);
      await page.getByRole("button", { name: /^Analyze/ }).click(); await sleep(4000);
    }, { feed: "label" });
    await clip("group", async (page, mark) => {
      await scan(page); await manual(page); await mode(page, "Group"); mark(); await sleep(1000);
      await page.locator("#camera-shutter-button").click(); await sleep(900);
      await page.locator("#camera-shutter-button").click(); await sleep(900);
      await page.getByRole("button", { name: /^Analyze/ }).click(); await sleep(4200);
    }, { feed: "pack" });
    await clip("meal", async (page, mark) => {
      await page.locator(".mp-button").click(); await sleep(1100); mark(); await sleep(1300);
      await page.locator("#camera-shutter-button").click(); await sleep(2600);
      await page.mouse.wheel(0, 700); await sleep(1600); await page.mouse.wheel(0, 500); await sleep(1800);
    }, { feed: "plate" });
    const Fx = (id, name, calories, protein, fats, carbs, fiber) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, table: undefined });
    const CH = Fx("chk", "Chicken breast, grilled", 165, 31, 3.6, 0, 0), RI = Fx("rice", "Rice, cooked", 130, 2.7, 0.3, 28, 0.4), SA = Fx("sal", "Mixed salad, dressed", 60, 1.2, 4.5, 3.5, 1.5);
    await clip("plate", async (page) => {
      await sleep(1400);
      await page.locator(".letters-row").first().click(); await sleep(1800);
      await page.mouse.wheel(0, 380); await sleep(1600);
      await page.locator(".nt").getByRole("button", { name: /Per 100 kcal/ }).click(); await sleep(2200);
    }, { state: { foods: [...seed.foods, CH, RI, SA], title: "Grilled chicken with rice and salad", items: [{ id: "a", food: CH, grams: 180, locked: false }, { id: "b", food: RI, grams: 150, locked: false }, { id: "c", food: SA, grams: 90, locked: false }] } });
    const PLAN = {}; ["20", "21", "22", "23", "24", "25", "26"].forEach((d, i) => { PLAN[`2026-10-${d}`] = { breakfast: planned(crepes, "mine"), lunch: i % 2 ? planned(sarma, "mine") : planned(pudding, "coach") }; });
    await clip("recipes", async (page) => {
      await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await sleep(2000);
      await page.mouse.wheel(0, 420); await sleep(1500); await page.mouse.wheel(0, 420); await sleep(1500); await page.mouse.wheel(0, -840); await sleep(1400);
    }, { meals: [crepes, sarma, pudding], plan: PLAN, time: "2026-10-20T14:00:00Z", path: "/plan" });
    await clip("shop", async (page) => {
      await page.locator(".plan-shop").click(); await sleep(1300);
      await page.getByRole("dialog", { name: "Shopping lists" }).getByRole("button", { name: /Make shopping list/ }).click(); await sleep(1600);
      const rows = page.locator(".shop-row"); await rows.nth(1).click(); await sleep(700); await rows.nth(3).click(); await sleep(1800);
    }, { meals: [crepes, sarma, pudding], plan: PLAN, time: "2026-10-20T14:00:00Z", path: "/plan" });
  } catch (e) { console.log("ERR", e.message); process.exitCode = 1; }
  server.kill();
})();
