// DT228 v2 (0.3.63, board Stories168; Coach Milan 2 November 19:50 to 22:00, Go). Help Chef Mealan read the meal: under the
// photo on the Plate, the photos with ＋ Photo and a line in your words; Read it again sends them all in one read. When the read
// cannot tell what a food is, Chef Mealan asks once (pork, veal, chicken or fish?); a tap changes the food and keeps its grams.
// A photo from Your photos has the same line before the read. The reads are stand-ins (no AI here).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3393", U = `http://127.0.0.1:${PORT}`;
const PLATE = fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg"));
const pic = "data:image/jpeg;base64," + PLATE.toString("base64");
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined, table: undefined, places: [] });
const fish = F("fi", "Fish fillet, breaded, fried", 230, 14, 12, 16), pot = F("po", "Roasted potatoes", 150, 2.5, 6, 22);
const items = [{ id: "a", grams: 180, locked: false, est: { low: 140, high: 220 }, food: fish }, { id: "b", grams: 150, locked: false, est: { low: 110, high: 200 }, food: pot }];
const READ = { dish: "Pork schnitzel with roasted potatoes", foods: [
  { name: "Pork schnitzel, breaded, pan-fried", grams: 180, low: 140, high: 220, calories: 250, protein: 25, fats: 14, carbs: 8, fiber: 0.5, confidence: "medium" },
  { name: "Roasted potatoes", grams: 150, low: 110, high: 200, calories: 150, protein: 2.5, fats: 6, carbs: 22, fiber: 2.2, confidence: "medium" }],
  unsure: null, which: { name: "Pork schnitzel, breaded, pan-fried", question: "under the breading, is it pork, veal, chicken or fish?", options: [
    { name: "Pork schnitzel, breaded, pan-fried", calories: 250, protein: 25, fats: 14, carbs: 8, fiber: 0.5 }, { name: "Veal schnitzel, breaded, pan-fried", calories: 230, protein: 26, fats: 11, carbs: 8, fiber: 0.5 },
    { name: "Chicken schnitzel, breaded, pan-fried", calories: 240, protein: 24, fats: 12, carbs: 9, fiber: 0.5 }, { name: "Fish fillet, breaded, fried", calories: 230, protein: 14, fats: 12, carbs: 16, fiber: 0.8 }] } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [], sent = [];
  const open = async (s, at = "/") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1, permissions: ["camera"] });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-02T12:00:00") });
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3, window: { from: "07:00", to: "21:00" } } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    }, s);
    await require("./adult.cjs")(page);
    await page.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ dish: "", foods: [], unsure: null }) }));
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await page.goto(U + at); await page.waitForTimeout(1300);
    return { ctx, page };
  };
  const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  try {
    let { ctx, page } = await open({ ...seed, items, title: "Breaded fish with roasted potatoes", photo: { image: pic, at: "2026-11-02T11:50:00" } }, "/plate");
    await page.unroute("**/api/plate-photo");
    await page.route("**/api/plate-photo", (r) => { sent.push(r.request().postDataJSON()); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }); });
    const help = page.locator(".mp-help");
    ok(/Help Chef Mealan read it/.test(await help.textContent()) && await help.locator(".mp-help-photos img").count() === 1 && /＋ Photo/.test(await help.textContent()) && (await help.locator(".pill-primary").textContent()).trim() === "Read it again", "under the photo: Help Chef Mealan read it, the photo, ＋ Photo, Read it again");
    await help.locator(".mp-help-add input").setInputFiles(path.join(ROOT, "tests/flows/plate.jpg")); await page.waitForTimeout(800);
    await help.getByLabel("Tell Chef Mealan what it is").fill("pork schnitzel, breaded, Augustiner");
    ok(await help.locator(".mp-help-photos img").count() === 2 && (await help.locator(".pill-primary").textContent()).trim() === "Read it again with 2 photos and this", "＋ Photo adds one; the button says what goes: Read it again with 2 photos and this");
    await help.locator(".pill-primary").click(); await page.waitForTimeout(1800);
    const st = await store(page);
    ok(sent.length === 1 && sent[0].note === "pork schnitzel, breaded, Augustiner" && sent[0].more?.length === 1 && st.items.length === 2 && /Pork schnitzel/.test(st.items[0].food.name) && st.photo.note === "pork schnitzel, breaded, Augustiner" && st.photo.more?.length === 1, "one read with both photos and the words; the new foods replace the old");
    const ask = page.locator(".mp-which");
    ok(/One thing I cannot tell from the photo: under the breading, is it pork, veal, chicken or fish\?/.test(await ask.textContent()) && JSON.stringify((await ask.locator(".choice").allTextContents()).map((x) => x.trim())) === JSON.stringify(["Pork schnitzel", "Veal schnitzel", "Chicken schnitzel", "Fish fillet"]), "Chef Mealan asks what the food is: four kinds, the read's guess on");
    await ask.getByRole("button", { name: "Veal schnitzel" }).click(); await page.waitForTimeout(500);
    const s2 = await store(page), veal = s2.items.find((i) => /Veal schnitzel/.test(i.food.name));
    ok(!!veal && veal.grams === 180 && veal.food.protein === 26 && !s2.photo.which && await page.locator(".mp-which").count() === 0, "a tap changes the food to veal; its grams stay; the question goes");
    await ctx.close();
    // ---- a photo from Your photos: the same line before the read ----
    ({ ctx, page } = await open({ ...seed, items: [] }, "/plate"));
    await page.unroute("**/api/plate-photo");
    await page.route("**/api/plate-photo", (r) => { sent.push(r.request().postDataJSON()); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }); });
    await page.locator(".mp-button").click(); await page.waitForTimeout(1500);
    await page.locator(".camera-ui input[type=file]").setInputFiles(path.join(ROOT, "tests/flows/plate.jpg")); await page.waitForTimeout(1200);
    ok(/Tell Chef Mealan what it is, if you like/.test(await page.locator(".pa").textContent()), "a photo from Your photos: the line under the chips");
    await page.locator(".pa-note input").fill("veal, Wiener Schnitzel");
    await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(1800);
    ok(sent[sent.length - 1].note === "veal, Wiener Schnitzel", "its words go with the read");
    await ctx.close();
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok");
  process.exit(fail ? 1 : 0);
})();
