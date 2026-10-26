// JOURNEY (0.2.110, board Stories78, DT130 variant A; Milan 26 October 12:00, 15:45, 16:18 "An idea. Build"): Photo of my
// meal opens the same camera as Scan, with Meal as a fourth mode: the round frame, The whole plate, from above, the shutter,
// Your photos. The shutter reads at once. A photo from Your photos asks one thing on the Plate before the read: whose plate,
// and when. Three short chips, one on; nothing happens until Read the plate. Ate at 12:40 logs it then, in the meal that time
// belongs to. An idea: the same read and gates; the buttons are for cooking it (Fit it, Save as an idea, Put it in my plan)
// and nothing is logged; its photo is the recipe's picture, never offered to members. The read is a stand-in (no AI here).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3274", U = `http://127.0.0.1:${PORT}`;
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

  // Today: the card opens the meal camera
  await page.goto(U + "/"); await page.waitForTimeout(1500);
  await page.locator(".mp-card").click(); await page.waitForTimeout(1800);
  const modes = await page.locator(".cam-modes button").allTextContents();
  ok(await page.locator(".camera-ui").count() === 1 && (await text(".cam-title")) === "Photo of my meal", "DT130: Photo of my meal opens the camera, titled Photo of my meal");
  ok(modes.join() === "Barcode,Label,Group,Meal" && await page.locator(".cam-modes button[aria-pressed=true]").textContent() === "Meal", "DT130: Meal is a fourth mode next to Barcode, Label and Group, and it is on: " + modes.join());
  ok(/The whole plate, from above/.test(await text(".cam-say")) && await page.locator(".meal-frame").count() === 1, "DT130: the round frame and the hint");
  ok(await page.locator(".auto-switch").count() === 0 && /Tap to take it/.test(await text(".cam-panel")) && await page.locator(".cam-gallery").count() === 1, "DT130: no auto shot; Tap to take it; Your photos bottom left");
  // the shutter: read at once, as before
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(2200);
  const s1 = await st();
  ok(sent.length === 1 && /^data:image\/jpeg;base64,/.test(sent[0].image) && await page.locator(".camera-ui").count() === 0, "DT130: the shutter takes the photo and reads it at once; the camera closes");
  ok(s1.items.length === 3 && s1.photo && !s1.photo.who && /Your photo, 13:05\./.test(await text(".mp-line")), "DT130: from the camera it is the plate in front of you, as in 0.2.108");
  await page.locator(".mp-say").getByRole("button", { name: "Not mine" }).click(); await page.waitForTimeout(400);

  // the Plate: Photo of my meal opens the same camera; a photo from Your photos asks first
  await toPlate();
  await page.locator(".mp-button").click(); await page.waitForTimeout(1500);
  ok(await page.locator(".cam-modes button[aria-pressed=true]").textContent() === "Meal", "DT130: the Plate's Photo of my meal opens the meal camera too");
  await pick("2026:10:25 12:20:00");
  ok(await page.locator(".camera-ui").count() === 0 && await page.locator(".plate-card .pa").count() === 1, "DT130: a photo from Your photos lands on the Plate with one question");
  ok(sent.length === 1, "DT130: nothing is read before Read the plate");
  ok(/A photo from 12:20 today\.\s?Whose plate, and when\?/.test(await text(".pa-top")), "DT130: the photo's own time, from the photo: " + await text(".pa-top"));
  const c1 = await chips();
  ok(c1.length === 3 && /^✓\s?Ate at$/.test(c1[0]) && c1[1] === "Eating now" && c1[2] === "An idea" && await page.locator(".pa-time").inputValue() === "12:20", "DT130: three short chips, Ate at 12:20 on (45 minutes ago): " + c1.join(" | "));
  ok(await page.locator(".pa-chip.on").count() === 1 && await page.locator(".pa-chip[aria-checked=true]").count() === 1, "DT130: one chip on");
  const line1 = await text(".pa small");
  ok(/^Logged at 12:20, as lunch\. Tap the time to change it\.$/.test(line1), "DT130: the line says what the chip on does: " + line1);
  // the time changes with a tap; the chips change with a tap and nothing is read
  await page.locator(".pa-time").fill("12:30"); await page.waitForTimeout(200);
  ok(/^Logged at 12:30, as lunch/.test(await text(".pa small")), "DT130: a tap on the time changes it");
  await page.locator(".pa-chip").filter({ hasText: "Eating now" }).click(); await page.waitForTimeout(200);
  ok(/^As from the camera/.test(await text(".pa small")) && sent.length === 1, "DT130: Eating now: as from the camera; still nothing read");
  await page.locator(".pa-chip").filter({ hasText: "Ate at" }).click({ position: { x: 12, y: 17 } }); await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(1800);
  const s2 = await st();
  ok(sent.length === 2 && s2.photo.who === "ate" && new Date(s2.photo.at).getHours() === 12 && new Date(s2.photo.at).getMinutes() === 30 && await page.locator(".pa").count() === 0, "DT130: Read the plate reads; the plate keeps the time picked and who");
  ok(/Your photo, 12:30\./.test(await text(".mp-line")), "DT130: the photo line says the photo's time");
  await page.locator(".mp-say").getByRole("button", { name: "Ate it", exact: true }).click(); await page.waitForTimeout(700);
  const s3 = await st();
  const eaten = s3.feedback.find((f) => f.status === "eaten");
  ok(eaten && new Date(eaten.createdAt).getHours() === 12 && new Date(eaten.createdAt).getMinutes() === 30 && eaten.slot && /lunch/i.test(eaten.slot.name) && eaten.slot.date === "2026-10-25", "DT130: Ate it logs it at 12:30, as lunch, today");

  // yesterday's photo: Ate at 19:10 starts on, as dinner; An idea instead
  await toPlate();
  await page.locator(".mp-button").click(); await page.waitForTimeout(1500);
  await pick("2026:10:24 19:10:00");
  ok(/A photo from yesterday, 19:10\./.test(await text(".pa-top")) && /^Logged at 19:10, as dinner/.test(await text(".pa small")), "DT130: a photo from yesterday: Ate at 19:10, as dinner: " + await text(".pa small"));
  await page.locator(".pa-chip").filter({ hasText: "An idea" }).click(); await page.waitForTimeout(200);
  ok(await text(".pa small") === "Not logged. Chef Mealan reads it as an idea to cook.", "DT130: An idea: not logged, read as an idea to cook");
  await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(1800);
  const s4 = await st();
  ok(sent.length === 3 && s4.photo.who === "idea" && /An idea from a photo\. 3 foods read, amounts estimated \(~\)\. Not logged/.test(await text(".mp-line")), "DT130: the read lands as an idea, said in the photo line");
  const ib = (await page.locator(".mp-say .mp-idea-row button").allTextContents()).map((x) => x.trim());
  ok(ib.length === 3 && /^Fit it to my (lunch|dinner)$/.test(ib[0]) && ib[1] === "Save as an idea" && ib[2] === "Put it in my plan" && (await page.locator(".mp-say .pill-primary").textContent()).trim() === ib[0], "DT130: the buttons are for cooking it, Fit first; no Ate it: " + ib.join(" | "));
  const say = await text(".mp-say small");
  ok(await page.getByRole("button", { name: "Fit to my target" }).count() === 0 && await page.getByRole("button", { name: "Lock the recipe" }).count() === 0, "DT130: an idea's buttons are only in Chef Mealan's card: no second Fit, no Lock");
  ok(/^Chef Mealan: A (lunch|dinner) as the photo shows it: about [\d,]+ to [\d,]+ kcal and \d+ g protein\. Fit it and it is sized for your day\.$/.test(say), "DT130: Chef Mealan's line for an idea, by code: " + say);
  // Put it in my plan: a day and a meal, in chips; the idea goes to Mine and to the slot
  await page.getByRole("button", { name: "Put it in my plan" }).click(); await page.waitForTimeout(300);
  const days = await page.locator(".mp-plan .chips-row").first().locator("button").allTextContents();
  ok(days.length === 7 && days[0] === "Today" && days[1] === "Tomorrow" && await page.locator(".mp-plan .chips-row").first().locator("button[aria-pressed=true]").textContent() === "Tomorrow", "DT130: seven days, Tomorrow on: " + days.join(", "));
  await page.locator(".mp-plan .chips-row").nth(1).locator("button").filter({ hasText: "Dinner" }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Put it in tomorrow's dinner" }).click(); await page.waitForTimeout(1200);
  const s5 = await st();
  const idea = s5.meals[0];
  const planned = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned") || "{}"));
  ok(idea && idea.idea && idea.idea.from === "photo" && idea.photoSigs && idea.foreignPhotos && idea.foreignPhotos.length === 1 && idea.foreignPhotos[0] === idea.photoSigs[0] && !idea.items.some((i) => i.est), "DT130: kept in Mine as an idea, the photo its picture, marked as not yours");
  ok(planned["2026-10-26"] && planned["2026-10-26"].dinner && planned["2026-10-26"].dinner.mealId === idea.id, "DT130: and in tomorrow's dinner");
  ok(s5.feedback.length === s3.feedback.length && s5.items.length === 0 && !s5.photo, "DT130: an idea is never logged; the plate is empty after");
  ok(/An idea from a photo, in your plan and in Mine/.test(await text()), "DT130: it lands on the recipe, saying where it went");

  // an older photo starts on An idea; Save as an idea
  await toPlate();
  await page.locator(".mp-button").click(); await page.waitForTimeout(1500);
  await pick("2026:10:19 20:00:00");
  ok(/^✓\s?An idea$/.test((await chips())[2]) && /A photo from Monday 19 October, 20:00\./.test(await text(".pa-top")), "DT130: a photo from last week starts on An idea");
  await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Save as an idea" }).click(); await page.waitForTimeout(1200);
  const s6 = await st();
  ok(s6.meals.filter((m) => m.idea && m.idea.from === "photo").length === 2 && /It waits at the top of Mine until you make it/.test(await text()), "DT130: Save as an idea keeps it in Mine, at the top until made");
  // the tile says what it is
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(900);
  ok(/An idea from a photo, not made yet/.test(await text()), "DT130: the recipe tile: An idea from a photo, not made yet");

  // Drop the photo: nothing read, nothing kept
  await toPlate();
  await page.locator(".mp-button").click(); await page.waitForTimeout(1500);
  await pick("2026:10:25 11:00:00");
  await page.getByRole("button", { name: "Drop the photo" }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".pa").count() === 0 && sent.length === 4, "DT130: Drop the photo: the question goes, nothing is read");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
