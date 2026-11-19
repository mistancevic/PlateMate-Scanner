// JOURNEY (0.2.110, board Stories78, DT130 variant A; Milan 26 October 12:00, 15:45, 16:18 "An idea. Build"): Photo of my
// meal opens the same camera as Scan, with Meal as a fourth mode: the round frame, The whole plate, from above, the shutter,
// Your photos. The shutter reads at once. A photo from Your photos asks one thing on the Plate before the read: whose plate,
// and when. Three short chips, one on; nothing happens until Read the plate. Ate at 12:40 logs it then, in the meal that time
// belongs to. An idea: the same read and gates; the buttons are for cooking it (Fit it, Save as an idea, Put it in my plan)
// and nothing is logged; its photo is the recipe's picture, never offered to members. The read is a stand-in (no AI here).
// Changed by story DT305 (0.3.151, boards Stories230 and Stories231; Coach Milan 16 November 2026, Go 11:35; the camera's
// button 11:55): the camera's button says Use this photo, since the tap no longer reads. Every photo waits on the photo
// screen; Chef Mealan asks nothing there: no chips, no time field. The photo fills in the meal line (a photo from 45 minutes
// ago is a lunch you ate at its time). The read shows alone; Did you eat it? All of it, then Done, logs it. Just looking is
// chosen behind the pencil, as the meal line's own question; a photo from last week is a meal of that day unless you say so.
// Drop the photo is Remove the photo.
// 0.3.157 (DT308, the meal model; Coach Milan, Go 18 November 11:14), changed by the story: a photo from earlier today no longer fills in the meal line: it says No meal selected, and the photo's time is the guess only when you say Ate it. Just looking is the last row of the calendar behind the pencil (just-looking.cjs).
// Changed by B150 (0.3.160, board B150; Coach Milan 19 November 01:00, Go): the meal line has the small title Meal and day and says No meal selected; Just looking is gone, and a photo read with no meal selected is a photo of yours (Don't count it makes it the kept plate, not-counted.cjs); a photo's meal is logged at the meal's time.
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

  // the Plate's Photo of my meal opens the meal camera (DT138: no longer on Today)
  await page.goto(U + "/plate"); await page.waitForTimeout(1500);
  await (await require("./more.cjs")(page, "mp")).click(); await page.waitForTimeout(1800);
  const modes = await page.locator(".cam-modes button").allTextContents();
  ok(await page.locator(".camera-ui").count() === 1 && (await text(".cam-title")) === "Photo of my meal", "DT130: Photo of my meal opens the camera, titled Photo of my meal");
  // Changed by story DT309 (0.3.153, board Stories239; Coach Milan 17 November 14:06, Go 14:12): the modes stand by how often they are used, Group, Barcode, Label, Meal
  ok(modes.join() === "Group,Barcode,Label,Meal" && await page.locator(".cam-modes button[aria-pressed=true]").textContent() === "Meal", "DT130, DT309: Meal is a fourth mode next to Group, Barcode and Label, and it is on: " + modes.join());
  ok(/The whole plate, from above/.test(await text(".cam-say")) && await page.locator(".meal-frame").count() === 1, "DT130: the round frame and the hint");
  ok(await page.locator(".auto-switch").count() === 0 && /Tap to take it/.test(await text(".cam-panel")) && await page.locator(".cam-gallery").count() === 1, "DT130: no auto shot; Tap to take it; Your photos bottom left");
  // DT228 v2 (0.3.63, board Stories168): the shutter stages the photo; a second one joins it; Read 2 photos reads them together
  ok(/The whole plate, from above\. Then the inside, another side, or the menu/.test(await text(".cam-say")), "DT228: the hint asks for the inside, another side or the menu too");
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(500);
  ok(sent.length === 0 && /1 photo of this meal/.test(await text(".cam-staged")) && (await page.locator(".cam-analyze").textContent()).trim() === "Use this photo", "DT228, DT305: the shutter stages it: 1 photo of this meal, Use this photo");
  await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(500);
  ok(/2 photos of this meal/.test(await text(".cam-staged")) && (await page.locator(".cam-analyze").textContent()).trim() === "Use 2 photos" && /The shutter adds a photo/.test(await text(".cam-panel")), "DT228, DT305: a second photo joins: Use 2 photos");
  await page.locator(".cam-analyze").click(); await page.waitForTimeout(1500);
  ok(sent.length === 0 && await page.locator(".camera-ui").count() === 0 && await page.locator(".pa-screen").count() === 1 && /A photo taken now\./.test(await text(".pa-from")) && await page.locator(".pa-chip").count() === 0, "DT305: the photos wait on the photo screen: A photo taken now., no chips, nothing read yet");
  await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(2200);
  const s1 = await st();
  ok(sent.length === 1 && /^data:image\/jpeg;base64,/.test(sent[0].image) && Array.isArray(sent[0].more) && sent[0].more.length === 1 && s1.photo?.more?.length === 1 && await page.locator(".camera-ui").count() === 0, "DT228: both photos go in one read; the camera closes");
  ok(s1.items.length === 3 && s1.photo && !s1.photo.who && s1.photo.view === "read" && /Your photo, 13:05\./.test(await text(".mp-big-say")), "DT130, DT305: from the camera it is the plate in front of you, shown as the read alone");
  await page.locator(".rv-change .pill").click(); await page.waitForTimeout(500);
  // DT278 (0.3.145): Don't count it, then Keep it ›, clears the Plate (Not mine is gone)
  await page.locator(".mp-say").getByRole("button", { name: "Don't count it" }).click(); await page.waitForTimeout(400);
  await page.locator(".sv-plate").getByRole("button", { name: "Keep it ›" }).click(); await page.waitForTimeout(400);

  // the Plate: Photo of my meal opens the same camera; a photo from Your photos asks first
  await toPlate();
  await (await require("./more.cjs")(page, "mp")).click(); await page.waitForTimeout(1500);
  ok(await page.locator(".cam-modes button[aria-pressed=true]").textContent() === "Meal", "DT130: the Plate's Photo of my meal opens the meal camera too");
  await pick("2026:10:25 12:20:00");
  ok(await page.locator(".camera-ui").count() === 0 && await page.locator(".plate-card .pa-screen").count() === 1, "DT130, DT305: a photo from Your photos lands on the photo screen");
  ok(sent.length === 1, "DT130: nothing is read before Read the plate");
  ok(/A photo from 12:20 today, from Your photos\./.test(await text(".pa-from")) && !/Whose plate/.test(await text(".pa-from")) && await page.locator(".pa-from").count() === 1 && await page.locator(".pa-photo").count() === 1, "DT130, DT213, DT305: the photo's own time, in Chef Mealan's line, and no question: " + await text(".pa-from"));
  ok(await page.locator(".pa-chip").count() === 0 && await page.locator(".pa-time").count() === 0 && /^No meal selected$/.test((await text(".plan-line")).trim().replace(/^\s*meal and day\s*/i, "")), "DT305: no chips and no time field; changed by DT308.5: the photo does not fill in the meal line: " + (await text(".plan-line")).slice(0, 40));
  await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(1800);
  const s2 = await st();
  ok(sent.length === 2 && s2.photo.who === "ate" && new Date(s2.photo.at).getHours() === 12 && new Date(s2.photo.at).getMinutes() === 20 && await page.locator(".pa").count() === 0, "DT130: Read the plate reads; the plate keeps the photo's time and who");
  ok(/Your photo, 12:20\./.test(await text(".mp-big-say")), "DT130: the photo line says the photo's time");
  // changed by DT308.5 (0.3.157): the read ends with What do you do with it?; Ate it marks the guess from the photo's time
  await page.locator(".read-view .pe-ate").click(); await page.waitForTimeout(300);
  ok(/From the photo, \w+ 12:20:/.test(await text(".read-view .plate-end")) && /Lunch/.test(await text(".read-view .pcal-row.on")), "DT308.5: Ate it: the calendar marks the lunch, from the photo's time, 12:20");
  await page.locator(".read-view .pcal-row.on").click(); await page.waitForTimeout(500);
  await page.locator(".rv-eat .pa-opt").filter({ hasText: "All of it" }).click(); await page.waitForTimeout(300);
  await page.locator(".rv-done").click(); await page.waitForTimeout(700);
  const s3 = await st();
  const eaten = s3.feedback.find((f) => f.status === "eaten");
  const hm = (x) => { const d = new Date(x); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  ok(eaten && (hm(eaten.createdAt) === eaten.slot.time || eaten.slot.time > hm(eaten.createdAt)) && hm(eaten.createdAt) !== "12:20" && /lunch/i.test(eaten.slot.name) && eaten.slot.date === "2026-10-25", "DT130, DT305, changed by B150: All of it and Done log it as lunch, today, at the lunch's time, or now while that time is still ahead (not the photo's 12:20): " + (eaten && hm(eaten.createdAt) + ", lunch at " + eaten.slot.time));

  // yesterday's photo: Ate at 19:10 starts on, as dinner; An idea instead
  await toPlate();
  await (await require("./more.cjs")(page, "mp")).click(); await page.waitForTimeout(1500);
  await pick("2026:10:24 19:10:00");
  ok(/A photo from yesterday, 19:10, from Your photos\./.test(await text(".pa-from")) && /^No meal selected$/.test((await text(".plan-line")).trim().replace(/^\s*meal and day\s*/i, "")), "DT130, DT305, changed by DT308.5: a photo from yesterday: the meal line still says No meal selected");
  // DT305: Just looking is the meal line's own answer, behind the pencil
  await require("./just-looking.cjs")(page);
  ok(/No meal selected/.test(await text(".plan-line")) && await page.locator(".pa-screen").count() === 1, "0.3.62, DT305, changed by B150: No meal selected behind the pencil; the photo waits");
  await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(1800);
  // changed by B150: the photo is read as yours with no meal selected; Don't count it makes it the kept plate, with the idea's buttons
  ok(sent.length === 3 && (await st()).photo.who !== "idea" && !(await st()).pick, "changed by B150: read with no meal selected: a photo of yours, no meal");
  await require("./not-counted.cjs")(page);
  const s4 = await st();
  ok(s4.photo.who === "idea" && /A photo with no meal selected\. 3 foods read, amounts estimated \(~\)\. Not logged/.test(await text(".mp-big-say")) && (await st()).pick === "exploring", "0.3.62, changed by B150: Don't count it: said in the photo line, not logged");
  const ib = (await page.locator(".mp-say .mp-idea-row button").allTextContents()).map((x) => x.trim());
  ok(ib.length === 3 && /^Fit it to my (lunch|dinner|meal)$/.test(ib[0]) && ib[1] === "Save as an idea" && ib[2] === "Put it in my plan" && (await page.locator(".mp-say .pill-primary").textContent()).trim() === ib[0], "DT130: the buttons are for cooking it, Fit first; no Ate it: " + ib.join(" | "));
  const say = await text(".mp-say small");
  ok(await page.getByRole("button", { name: "Fit to my target" }).count() === 0 && await page.getByRole("button", { name: /Lock the recipe|How to make it ›|How to eat it ›|Lock it and cook ›|Prepare it ›/ }).count() === 0, "DT130: an idea's buttons are only in Chef Mealan's card: no second Fit, no Lock");
  ok(/^Chef Mealan: A (lunch|dinner|meal) as the photo shows it: about [\d,]+ to [\d,]+ kcal and \d+ g protein\. Fit it and it is sized for your day\.$/.test(say), "DT130: Chef Mealan's line for an idea, by code: " + say);
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
  await (await require("./more.cjs")(page, "mp")).click(); await page.waitForTimeout(1500);
  await pick("2026:10:19 20:00:00");
  ok(/A photo from Monday 19 October, 20:00, from Your photos\./.test(await text(".pa-from")) && /No meal selected/.test(await text(".plan-line")), "DT130, DT305, changed by B150: a photo from last week; the meal line says No meal selected");
  await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(1800);
  ok((await st()).photo.who !== "idea" && !(await st()).pick, "changed by B150: the plate before was not counted; this new photo is read as yours, with no meal selected");
  await require("./not-counted.cjs")(page);
  await page.getByRole("button", { name: "Save as an idea" }).click(); await page.waitForTimeout(1200);
  const s6 = await st();
  ok(s6.meals.filter((m) => m.idea && m.idea.from === "photo").length === 2 && /It waits at the top of Mine until you make it/.test(await text()), "DT130: Save as an idea keeps it in Mine, at the top until made");
  // the tile says what it is
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(900);
  ok(/An idea from a photo, not made yet/.test(await text()), "DT130: the recipe tile: An idea from a photo, not made yet");

  // Drop the photo: nothing read, nothing kept
  await toPlate();
  await (await require("./more.cjs")(page, "mp")).click(); await page.waitForTimeout(1500);
  await pick("2026:10:25 11:00:00");
  await page.getByRole("button", { name: "Remove the photo" }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".pa").count() === 0 && sent.length === 4, "DT130, DT305: Remove the photo: the photo screen goes, nothing is read");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
