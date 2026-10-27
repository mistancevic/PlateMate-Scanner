// HP2 (0.2.114, board Stories90; Milan 27 October 14:25 to 15:34): the home page's short clips, recorded from the real app on
// test data. Start from anything: a barcode, a nutrition label, a group of labels, a photo of the meal; one plate; recipes for
// your day; the shopping list. The AI's answers are stand-ins (page.route) and the pack is invented (Fjell Skyr): no real brand.
// Run after npm run build: node scripts/record-home-clips.cjs. Writes public/landing/way-*.mp4, .webm and .webp, only when every
// rule in docs/rules/home-clips.md passes (HC1 to HC9); a failed rule stops the run and lists what failed.
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
const ASSETS = path.join(ROOT, "design/home-clips");
const photo = (f) => (fs.existsSync(path.join(ASSETS, f)) ? "data:image/jpeg;base64," + fs.readFileSync(path.join(ASSETS, f)).toString("base64") : null);
// HC2: a real EAN-13, so the app's own scanner reads it from the camera picture
const CODE12 = "400604012345";
const CODE = CODE12 + String((10 - [...CODE12].reduce((n, d, k) => n + Number(d) * (k % 2 ? 3 : 1), 0) % 10) % 10);
const ean13 = (code, x0, y0, m, h) => {
  const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
  const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
  const Rr = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
  const P = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"][Number(code[0])];
  const bits = "101" + [...code.slice(1, 7)].map((d, k) => (P[k] === "L" ? L : G)[Number(d)]).join("") + "01010" + [...code.slice(7)].map((d) => Rr[Number(d)]).join("") + "101";
  return [...bits].map((b, k) => (b === "1" ? `<rect x="${x0 + k * m}" y="${y0}" width="${m}" height="${h}" fill="#111"/>` : "")).join("");
};
// HC6: made-up packs only. The back of a skyr cup, the barcode where the camera's barcode frame is
const BARCODE = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960"><rect width="720" height="960" fill="#cdbb9f"/><rect x="150" y="150" width="420" height="640" rx="30" fill="#f7f5ef" stroke="#d8d2c4" stroke-width="4"/><rect x="150" y="190" width="420" height="90" fill="#2e5d8f"/><text x="360" y="252" font-family="Georgia" font-size="50" fill="#fff" text-anchor="middle">Fjell</text><text x="360" y="320" font-family="Arial" font-weight="700" font-size="26" fill="#2e5d8f" text-anchor="middle">SKYR natural · 450 g</text><rect x="196" y="352" width="328" height="170" fill="#fff"/>${ean13(CODE, 210, 362, 3, 130)}<text x="360" y="515" font-family="monospace" font-size="24" text-anchor="middle">${CODE[0]} ${CODE.slice(1, 7)} ${CODE.slice(7)}</text><text x="360" y="600" font-family="Arial" font-size="20" fill="#555" text-anchor="middle">Keep refrigerated. Best before: see lid.</text></svg>`);
const LABEL_ROWS = [["Energy", "276 kJ / 66 kcal"], ["Fat", "0.3 g"], ["of which saturates", "0.2 g"], ["Carbohydrate", "3.8 g"], ["of which sugars", "3.8 g"], ["Protein", "11.6 g"], ["Salt", "0.1 g"]];
const LABEL = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960"><rect width="720" height="960" fill="#e9e2d0"/><rect x="190" y="230" width="340" height="470" fill="#fff" stroke="#222" stroke-width="3"/><text x="206" y="272" font-family="Arial" font-weight="700" font-size="24">Nutrition declaration</text><text x="206" y="302" font-family="Arial" font-size="19">per 100 g</text>${LABEL_ROWS.map(([a, b], i) => `<line x1="206" x2="514" y1="${320 + i * 52}" y2="${320 + i * 52}" stroke="#222" stroke-width="1.5"/><text x="206" y="${354 + i * 52}" font-family="Arial" font-size="19">${a}</text><text x="514" y="${354 + i * 52}" font-family="Arial" font-size="19" text-anchor="end">${b}</text>`).join("")}</svg>`);
// HC4: three packs in one picture
// the camera shows the middle of the picture (x 140 to 580 of 720): the three packs stand there
const cup = (x, top, name, line, color) => `<rect x="${x}" y="${top}" width="136" height="250" rx="16" fill="#f7f5ef" stroke="#d8d2c4" stroke-width="3"/><rect x="${x}" y="${top + 26}" width="136" height="58" fill="${color}"/><text x="${x + 68}" y="${top + 66}" font-family="Georgia" font-size="${name.length > 6 ? 22 : 28}" fill="#fff" text-anchor="middle">${name}</text><text x="${x + 68}" y="${top + 126}" font-family="Arial" font-weight="700" font-size="18" fill="${color}" text-anchor="middle">${line}</text>`;
const GROUP = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960"><rect width="720" height="960" fill="#cdbb9f"/>${cup(146, 360, "Fjell", "SKYR", "#2e5d8f")}${cup(292, 340, "Kornfeld", "OATS", "#8a5a1f")}${cup(438, 360, "Nusshof", "PEANUT", "#b3261e")}</svg>`);
const MEAL = photo("meal.jpg");
const RECIPE_PHOTOS = { m1: photo("recipe-crepes.jpg"), m2: photo("recipe-pudding.jpg"), m3: photo("recipe-sarma.jpg") };
const SKYR = { success: true, product_name: "Fjell Skyr natural", brand: "Fjell", basis: "100g", calories: 66, protein: 11.6, fats: 0.3, carbs: 3.8, fiber: 0, notes: "", error_reason: "", table: [], source: "Product database · review required" };
const LABEL_READ = { ...SKYR, source: "Label photo · review required", table: LABEL_ROWS.map(([name, v]) => ({ name, amount: Number(String(v).match(/([\d.]+) ?k?c?a?l?$/)?.[1] ?? 0), unit: /kcal/.test(v) ? "kcal" : "g" })) };
const GROUP_READ = { entities: [
  { ...SKYR },
  { product_name: "Kornfeld Oats", brand: "Kornfeld", calories: 372, protein: 13.5, fats: 7, carbs: 58.7, fiber: 10 },
  { product_name: "Nusshof Peanut butter", brand: "Nusshof", calories: 588, protein: 25, fats: 50, carbs: 20, fiber: 6 }] };
const READ = { dish: "Grilled chicken with rice and salad", foods: [
  { name: "Chicken breast, grilled", grams: 180, low: 140, high: 240, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" },
  { name: "Rice, cooked", grams: 150, low: 120, high: 200, calories: 130, protein: 2.7, fats: 0.3, carbs: 28, fiber: 0.4, confidence: "medium" },
  { name: "Mixed salad, dressed", grams: 90, low: 60, high: 120, calories: 60, protein: 1.2, fats: 4.5, carbs: 3.5, fiber: 1.5, confidence: "medium" }], unsure: null };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const fails = []; const rule = (ok, id, what) => { console.log(`${ok ? "ok  " : "FAIL"} ${id} ${what}`); if (!ok) fails.push(`${id} ${what}`); };
  // HC5 before anything: the photos must be there
  rule(Boolean(MEAL), "HC5", `the meal photo: ${path.relative(ROOT, path.join(ASSETS, "meal.jpg"))}`);
  for (const [id, f] of [["m1", "recipe-crepes.jpg"], ["m2", "recipe-pudding.jpg"], ["m3", "recipe-sarma.jpg"]]) rule(Boolean(RECIPE_PHOTOS[id]), "HC5", `a recipe photo: design/home-clips/${f}`);
  // HC9: the page says what the clips are
  rule(/Clips of the app on test data/.test(fs.readFileSync(path.join(ROOT, "src/screens/LandingScreen.tsx"), "utf8")), "HC9", "the section says the clips are the app on test data");
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await sleep(500); } }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clips-"));
  // the camera sees a picture: each one becomes a fake camera feed, so the photos taken in the clip show it too
  const feeds = {};
  { const b0 = await chromium.launch(); const pg = await b0.newPage({ viewport: { width: 720, height: 960 } });
    for (const [k, src] of [["barcode", BARCODE], ["label", LABEL], ["group", GROUP], ["meal", MEAL]]) {
      if (!src) continue;
      const fit = k === "meal" ? `<img src="${src}" style="position:absolute;inset:0;width:720px;height:960px;object-fit:cover;filter:blur(18px) brightness(.8)"><img src="${src}" style="position:absolute;left:20px;top:237px;width:680px">` : `<img src="${src}" style="width:720px;height:960px;object-fit:cover">`;
      await pg.setContent(`<body style="margin:0;position:relative;width:720px;height:960px;overflow:hidden">${fit}</body>`); await sleep(400);
      const png = path.join(tmp, `${k}.png`); await pg.screenshot({ path: png });
      feeds[k] = path.join(tmp, `${k}.y4m`);
      execFileSync("ffmpeg", ["-y", "-loop", "1", "-i", png, "-t", "2", "-r", "15", "-vf", "scale=720:960,format=yuv420p", feeds[k]], { stdio: "ignore" });
    }
    await b0.close(); }
  const made = [];
  const clip = async (name, run, x = {}) => {
    const dir = path.join(tmp, name); fs.mkdirSync(dir);
    const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", ...(x.feed && feeds[x.feed] ? [`--use-file-for-fake-video-capture=${feeds[x.feed]}`] : [])] });
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
    // HC1: a ring where every tap lands, a finger for every swipe; counted, so the rule can check them
    await page.addInitScript(() => {
      window.__rings = 0; window.__swipes = 0;
      const put = (x, y, cls) => { const d = document.createElement("div"); d.className = cls; d.style.left = x + "px"; d.style.top = y + "px"; document.body.appendChild(d); setTimeout(() => d.remove(), 900); };
      addEventListener("DOMContentLoaded", () => { const st = document.createElement("style"); st.textContent = `.hc-ring{position:fixed;z-index:2147483647;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(46,123,232,.28);border:3px solid rgba(46,123,232,.9);pointer-events:none;animation:hc-ring .8s ease-out forwards}@keyframes hc-ring{0%{transform:scale(.5);opacity:1}70%{opacity:1}100%{transform:scale(1.35);opacity:0}}.hc-swipe{position:fixed;z-index:2147483647;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(46,123,232,.35);border:3px solid rgba(46,123,232,.9);pointer-events:none;animation:hc-swipe .8s ease-in-out forwards}@keyframes hc-swipe{0%{transform:translateY(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateY(var(--dy));opacity:0}}`; document.head.appendChild(st); });
      addEventListener("pointerdown", (e) => { window.__rings++; put(e.clientX, e.clientY, "hc-ring"); }, true);
      window.__swipe = (x, y, dy) => { window.__swipes++; const d = document.createElement("div"); d.className = "hc-swipe"; d.style.left = x + "px"; d.style.top = y + "px"; d.style.setProperty("--dy", -dy * 0.4 + "px"); document.body.appendChild(d); setTimeout(() => d.remove(), 900); };
    });
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Grilled chicken with rice and salad: a plain lunch plate.", around: "", better_as: "" }) }));
    await page.route("**/api/product/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SKYR) }));
    await page.route("**/api/scan", (r) => { const group = r.request().postDataJSON()?.mode === "group"; r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(group ? GROUP_READ : LABEL_READ) }); });
    await page.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }));
    const t0 = Date.now();
    await page.goto(U + (x.path || "/plate")); await sleep(1600);
    let from = (Date.now() - t0) / 1000, lastAct = from, taps = 0, swipes = 0;
    const act = { 
      // a tap: a real click, so the ring is drawn where it lands
      tap: async (loc, wait = 900) => { await loc.click(); taps++; lastAct = (Date.now() - t0) / 1000; await sleep(wait); },
      // a swipe up the screen by dy pixels, drawn as a finger
      swipe: async (dy, wait = 1200, y = 600) => { await page.mouse.move(200, y); await page.evaluate(([y, dy]) => window.__swipe(200, y, dy), [y, dy]); swipes++; await page.mouse.wheel(0, dy); lastAct = (Date.now() - t0) / 1000; await sleep(wait); },
      mark: () => { from = (Date.now() - t0) / 1000; },
    };
    let checks = {};
    try { checks = (await run(page, act)) || {}; } catch (e) { rule(false, "run", `${name}: ${e.message.split("\n")[0]}`); }
    await sleep(1700);
    const drawn = await page.evaluate(() => ({ rings: window.__rings, swipes: window.__swipes })).catch(() => ({ rings: -1, swipes: -1 }));
    const end = (Date.now() - t0) / 1000;
    const video = page.video(); await ctx.close(); await b.close(); const raw = await video.path();
    const len = end - from;
    rule(drawn.rings === taps && drawn.swipes === swipes && taps + swipes > 0, "HC1", `${name}: ${taps} taps, ${drawn.rings} rings; ${swipes} swipes, ${drawn.swipes} drawn`);
    rule(end - lastAct >= 1.5, "HC7", `${name}: the last screen held ${(end - lastAct).toFixed(1)} s`);
    rule(len >= 6 && len <= 12.5, "HC8", `${name}: ${len.toFixed(1)} s`);
    for (const [k, v] of Object.entries(checks)) rule(Boolean(v.ok), k, `${name}: ${v.what}`);
    made.push({ name, raw, from, len });
  };
  // HC7: fade in and out to the page's background, so the loop reads as a new start
  const encode = ({ name, raw, from, len }) => {
    const base = path.join(OUT, `way-${name}`), t = Math.min(len, 12.5);
    const vf = `fade=t=in:st=0:d=0.3:color=0xEEF3FC,fade=t=out:st=${(t - 0.4).toFixed(2)}:d=0.4:color=0xEEF3FC`;
    const cut = ["-y", "-ss", from.toFixed(2), "-i", raw, "-t", t.toFixed(2), "-an", "-vf", vf];
    execFileSync("ffmpeg", [...cut, "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${base}.mp4`], { stdio: "ignore" });
    execFileSync("ffmpeg", [...cut, "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-deadline", "good", "-cpu-used", "4", `${base}.webm`], { stdio: "ignore" });
    execFileSync("ffmpeg", ["-y", "-ss", "0.6", "-i", `${base}.mp4`, "-frames:v", "1", "-c:v", "libwebp", "-quality", "70", `${base}.webp`], { stdio: "ignore" });
    console.log("clip", name, `${len.toFixed(1)} s`);
  };
  // every click goes through a.tap, so every ring is counted (HC1)
  const manual = async (page, a) => { const sw = page.locator(".auto-switch"); if (await sw.count() && /Auto shot/.test(await sw.textContent())) await a.tap(sw, 200); };
  const openScan = async (page, a) => { await a.tap(page.getByRole("button", { name: "Scan", exact: true }).first(), 0); await page.locator(".auto-switch").waitFor({ timeout: 4000 }).catch(() => {}); await manual(page, a); await sleep(500); };
  const toMode = async (page, a, m) => { await a.tap(page.locator(".cam-modes button").filter({ hasText: m }), 500); };
  const saveFood = async (page, a) => {
    await a.tap(page.getByText(/I checked the values/).first(), 600);
    await a.tap(page.getByRole("button", { name: /Confirm & save food/ }), 2000);
  };
  const onPlate = (page, name) => page.locator(".plate-card").getByText(name).count().then((n) => n > 0).catch(() => false);
  try {
    await clip("barcode", async (page, a) => {
      await openScan(page, a); await toMode(page, a, "Barcode"); a.mark();
      // the app's scanner reads the code from the camera picture; nothing is typed
      await page.getByText(/Code read/).waitFor({ timeout: 8000 }).catch(() => {});
      const read = await page.getByText(/Code read/).first().textContent().catch(() => "");
      await sleep(1100);
      await a.tap(page.getByRole("button", { name: "Use the code only" }), 2400);
      await a.swipe(520, 1000);
      await saveFood(page, a);
      return { HC2: { ok: read.includes(CODE), what: `the scanner read the code on the pack: ${read.trim()} (pack: ${CODE})` }, HC3: { ok: await onPlate(page, "Fjell Skyr natural"), what: "the food is on the plate" } };
    }, { feed: "barcode" });
    await clip("label", async (page, a) => {
      await openScan(page, a); await toMode(page, a, "Label"); a.mark(); await sleep(1000);
      await a.tap(page.locator("#camera-shutter-button"), 900);
      await a.tap(page.getByRole("button", { name: /^Analyze/ }), 3000);
      await a.swipe(520, 1400);
      const energy = await page.locator("input").evaluateAll((xs) => xs.map((x) => x.value)).catch(() => []);
      await saveFood(page, a);
      return { HC3: { ok: energy.includes("66") && await onPlate(page, "Fjell Skyr natural"), what: `the app's table holds the label's 66 kcal, then the food is on the plate` } };
    }, { feed: "label" });
    await clip("group", async (page, a) => {
      await openScan(page, a); await toMode(page, a, "Group"); a.mark(); await sleep(1000);
      await a.tap(page.locator("#camera-shutter-button"), 900);
      await a.tap(page.getByRole("button", { name: /^Analyze/ }), 3600);
      const all = (await page.locator("main").textContent().catch(() => "")) || "";
      const found = ["Fjell Skyr natural", "Kornfeld Oats", "Nusshof Peanut butter"].filter((n) => all.includes(n));
      return { HC4: { ok: found.length === 3, what: `three packs in the picture, ${found.length} named at the end` } };
    }, { feed: "group" });
    if (MEAL) await clip("meal", async (page, a) => {
      await a.tap(page.locator(".mp-button"), 1000); a.mark(); await sleep(900);
      await a.tap(page.locator("#camera-shutter-button"), 2600);
      await a.swipe(650, 1500); await a.swipe(450, 1200);
    }, { feed: "meal" });
    const Fx = (id, name, calories, protein, fats, carbs, fiber) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, table: undefined });
    const CH = Fx("chk", "Chicken breast, grilled", 165, 31, 3.6, 0, 0), RI = Fx("rice", "Rice, cooked", 130, 2.7, 0.3, 28, 0.4), SA = Fx("sal", "Mixed salad, dressed", 60, 1.2, 4.5, 3.5, 1.5);
    await clip("plate", async (page, a) => {
      await sleep(1200);
      await a.tap(page.locator(".letters-row").first(), 1600);
      await a.swipe(380, 1400);
      await a.tap(page.locator(".nt").getByRole("button", { name: /Per 100 kcal/ }), 600);
    }, { state: { foods: [...seed.foods, CH, RI, SA], title: "Grilled chicken with rice and salad", items: [{ id: "a", food: CH, grams: 180, locked: false }, { id: "b", food: RI, grams: 150, locked: false }, { id: "c", food: SA, grams: 90, locked: false }] } });
    const withPhoto = (m) => (RECIPE_PHOTOS[m.id] ? { ...m, photo: RECIPE_PHOTOS[m.id] } : m);
    const meals = [crepes, sarma, pudding].map(withPhoto);
    const PLAN = {}; ["20", "21", "22", "23", "24", "25", "26"].forEach((d, i) => { PLAN[`2026-10-${d}`] = { breakfast: planned(crepes, "mine"), lunch: i % 2 ? planned(sarma, "mine") : planned(pudding, "coach") }; });
    await clip("recipes", async (page, a) => {
      await a.tap(page.locator("nav button").filter({ hasText: "Recipes" }), 1800);
      await a.swipe(420, 1500); await a.swipe(420, 1500);
      const tiles = await page.evaluate(() => [...document.querySelectorAll("main .recipe-tile")].map((t) => Boolean(t.querySelector("img"))));
      return { HC5: { ok: tiles.length >= 3 && tiles.every(Boolean), what: `every recipe tile shows its photo (${tiles.filter(Boolean).length} of ${tiles.length})` } };
    }, { meals, plan: PLAN, time: "2026-10-20T14:00:00Z", path: "/plan" });
    await clip("shop", async (page, a) => {
      await sleep(900); await a.tap(page.locator(".plan-shop"), 1400);
      await a.tap(page.getByRole("dialog", { name: "Shopping lists" }).getByRole("button", { name: /Make shopping list/ }), 1500);
      const rows = page.locator(".shop-row"); await a.tap(rows.nth(1), 1100); await a.tap(rows.nth(3), 600);
    }, { meals, plan: PLAN, time: "2026-10-20T14:00:00Z", path: "/plan" });
  } catch (e) { rule(false, "run", e.message.split("\n")[0]); }
  server.kill();
  if (fails.length) { console.log(`\n${fails.length} rule(s) failed; no clip was replaced:\n  ${fails.join("\n  ")}`); process.exit(1); }
  for (const m of made) encode(m);
  console.log(`\nall rules passed (HC1 to HC9); ${made.length} clips written`);
})();
