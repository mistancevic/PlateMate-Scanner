// JOURNEY (DT305, 0.3.151, boards Stories230 and Stories231; Coach Milan 16 November 2026, 07:46 to 11:21, Go 11:35): a photo of a
// meal, and what you do with the read. The Plate asks What are you craving?; Find ideas carries Chef Mealan's hat. Every photo
// of a meal waits on the photo screen before the read: the meal's title in the place of the question, still empty; the meal
// line as today; the photo, bigger, with Remove the photo beside it; one box, Anything Chef Mealan should know?; Read the
// plate, alone. Chef Mealan asks nothing about whose plate and when: the photo fills in the meal line. The read shows alone:
// the photo and its foods with Change the foods under them, always the result, what you said, his word. One question in its
// own block, chips white until chosen: Did you eat it? All of it, Half, Part of it, with the weight below once one is chosen;
// for a coming day, Is it for the plan?. Under everything, the two buttons of the read: Save in My recipes, Done. Done
// carries out what is chosen; nothing chosen, nothing is kept. Change the foods opens the plate as it was. The design rule
// added by this story: an answer to tick sits under its question in its own block; the buttons of a section sit under the
// whole section in one row. The reads are stand-ins.
// 0.3.157 (DT308, the meal model; Coach Milan, Go 18 November 11:14), changed by the story: no meal is guessed, and a photo no longer fills in the meal line: it says Meal and day not set. With no meal set the read ends with What do you do with it? Save it, Plan it, Ate it (DT308.4 to DT308.6); Save it is what Save in My recipes was. Ate it opens the calendar with the guess marked (the clock's, or an older photo's day and time), and after the tap the read goes on exactly as this story drew it: Did you eat it?, the weight, Save in My recipes and Done. For a coming day the calendar behind the pencil takes the place of Tomorrow and Done. Change the foods opens the plate, which now ends with What do you do with it?; Chef Mealan's card keeps his word, Add a food and Don't count it, and its Ate it and Ate half come back once the meal is set.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3533", U = `http://127.0.0.1:${PORT}`;
const os = require("node:os");
const YOU = "buckwheat pancakes, fried in butter";
const f = (name, grams, calories, protein, fats, carbs, fiber) => ({ name, grams, low: Math.round(grams * 0.7), high: Math.round(grams * 1.3), calories, protein, fats, carbs, fiber, confidence: "medium" });
const READ = { dish: "Pancakes with raspberries", foods: [f("Pancakes", 180, 227, 6.4, 9.7, 28, 1), f("Raspberries", 30, 52, 1.2, 0.7, 12, 6.5)], unsure: null, which: null, course: "main", vessel: "plate", serves: 1 };
const NOW = new Date("2026-11-16T19:00:00");
// a photo from Your photos carries its file's time: a copy of the plate, dated
const photoAt = (d) => { const p = path.join(os.tmpdir(), `dt305-${d.getTime()}.jpg`); fs.copyFileSync(path.join(ROOT, "tests/flows/plate.jpg"), p); fs.utimesSync(p, d, d); return p; };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [], sent = [];
  const open = async (file = null, look = { vessel: "plate", course: "main" }) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1, permissions: ["camera"] });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: NOW });
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.route("**/api/plate-look", (r) => (look ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(look) }) : r.fulfill({ status: 503, contentType: "application/json", body: "{}" })));
    await page.route("**/api/plate-photo", (r) => { const q = r.request().postDataJSON(); sent.push({ share: q.share, course: q.course, note: q.note }); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }); });
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", betterAs: "meal", holds: "" }) }));
    await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    if (file) { await (await require("./more.cjs")(page, "mp")).click(); await page.waitForTimeout(1500); await page.locator(".camera-ui input[type=file]").setInputFiles(file); await page.waitForTimeout(1500); }
    return { ctx, page };
  };
  const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const txt = async (page, sel = "main") => (await page.locator(sel).innerText()).replace(/\s+/g, " ");
  const justNow = () => photoAt(new Date(NOW.getTime() - 5 * 60000));
  const toRead = async (page, words) => { if (words) await page.locator(".pa-screen textarea").fill(words); await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(2200); };
  const chips = (page) => page.locator(".rv-eat .pa-opt");
  // changed by DT308.4 (0.3.157): with no meal set the read ends with What do you do with it?. Ate it opens the calendar with
  // the guess marked; a tap on it sets the meal, and the read goes on with Did you eat it?, as this story drew it
  const line = async (page) => (await page.locator(".plan-line").innerText()).replace(/\s+/g, " ").trim();
  const ateIt = async (page) => { await page.locator(".read-view .pe-ate").click(); await page.waitForTimeout(300); await page.locator(".read-view .pcal-row.on").click(); await page.waitForTimeout(500); };
  try {
    // ---- 1. to be informed: the Plate, the camera, the photo screen, the read, Done ----
    let { ctx, page } = await open();
    // Changed by story DT308 (0.3.154, board Stories236): What are you craving? and Find ideas are gone from the page; Photo or scan opens the camera
    ok(/Nothing on your plate yet\./.test(await txt(page, ".plate-empty-pic")) && await page.locator(".crave-find").count() === 0 && (await txt(page, ".mp-button")).trim() === "Photo or scan", "a: the empty Plate, with Photo or scan");
    await (await require("./more.cjs")(page, "mp")).click(); await page.waitForTimeout(1500);
    await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(600);
    await page.locator(".cam-analyze").click(); await page.waitForTimeout(1500);
    ok(sent.length === 0 && await page.locator(".camera-ui").count() === 0 && await page.locator(".pa-screen").count() === 1, "b to c: a photo you take waits on the photo screen; nothing is read yet");
    const title = page.locator(".step-head input.title-input");
    ok(await page.locator(".step-head h2").count() === 0 && await title.inputValue() === "" && await title.getAttribute("placeholder") === "Chef Mealan names it", "c: the meal's title takes the place of the question: still empty, Chef Mealan names it");
    ok(/^Meal and day not set$/.test(await line(page)) && await page.locator(".plan-line-pen").count() === 1, "c: changed by DT308.1: the meal line says Meal and day not set, with its pencil");
    let t = await txt(page, ".pa-screen");
    ok(/A photo taken now\./.test(t) && !/Whose plate/.test(t) && await page.locator(".pa-screen .pa-chip").count() === 0 && await page.locator(".pa-dish").count() === 0, "c: Chef Mealan says where the photo is from and asks nothing: no Ate at, Eating now, Just looking, no dish row");
    // Changed by story DT308 Release 2 (0.3.155, board Stories236, DT308.2): the photo screen is one card with the photo on top, as wide as the card
    const img = await page.locator(".pa-screen .pa-photo").boundingBox(), rm = await page.locator(".pa-remove").boundingBox(), cardBox = await page.locator("section.photo-screen").boundingBox();
    ok(img.width >= cardBox.width - 4 && img.height >= 200 && img.y - cardBox.y < 4 && rm.height >= 44 && rm.y > img.y + img.height && (await page.locator(".pa-remove").textContent()).trim() === "Remove the photo" && /pill-danger-line/.test(await page.locator(".pa-remove").getAttribute("class")), "c: one card, the photo on top as wide as the card; Remove the photo under it, 44 px, with the red border");
    ok(/Anything Chef Mealan should know\?/.test(t) && await page.locator(".pa-screen textarea").getAttribute("placeholder") === "What is in it, how it was cooked. You can leave it empty.", "c: one box: Anything Chef Mealan should know?, with grey text that says what goes in it");
    ok(await page.locator("main .pill-primary:visible").count() === 1 && (await page.locator(".pa-go .pill").allTextContents()).join("|").trim() === "Read the plate", "c: Read the plate, alone, the one filled button");
    ok(await page.locator(".crave-card, .ways, .plate-empty-pic, .all-foods").count() === 0 && !/Quick picks/.test(await txt(page)), "c: nothing else is on the screen: no ideas card, no empty plate, no ways to add, no Quick picks");
    await toRead(page, YOU);
    ok(sent.length === 1 && sent[0].note === YOU && sent[0].course === "main" && sent[0].share === undefined, "Read the plate reads, with your words and Chef Mealan's guess of the dish: " + JSON.stringify(sent[0]));
    let st = await store(page);
    ok(st.photo.view === "read" && st.items.length === 2 && await page.locator(".read-view").count() === 1 && await title.inputValue() === "Pancakes with raspberries" && /Read from your photo\. Tap an amount to correct it\./.test(await txt(page, ".step-head")), "d: the read alone, the title filled in: Pancakes with raspberries");
    t = await txt(page, ".read-view");
    ok(/Pancakes ~180 g/.test(t) && /Raspberries ~30 g/.test(t) && await page.locator(".read-view .readout").count() === 1 && t.includes("You said: " + YOU) && /Chef Mealan:/.test(t), "d: the photo's foods, always the result, what you said, and his word");
    ok(/^Meal and day not set$/.test(await line(page)) && /What do you do with it\? Save it Plan it Ate it$/.test(t.trim()) && await page.locator(".rv-eat, .rv-go").count() === 0, "d: changed by DT308.4: no meal is guessed, so the read ends with What do you do with it? Save it, Plan it, Ate it");
    await ateIt(page);
    t = await txt(page, ".read-view");
    ok(/^Dinner \w+, \d+ \w+, 20:00$/.test(await line(page)) && /Main dish of your dinner/.test(t), "d: Ate it, then the marked meal: the dinner is set in the line, and his guess of the dish says Main dish of your dinner");
    ok(!/Did you eat it\?.*Did you eat it\?/.test(t) && await page.locator(".rv-chef").count() === 1, "d: his word does not ask Did you eat it? again");
    ok((await page.locator(".rv-change .pill").textContent()).trim() === "Change the foods" && await page.locator(".rv-change .pill").evaluate((x) => x.getBoundingClientRect().height >= 44 && x.compareDocumentPosition(document.querySelector(".read-view .readout")) & 4), "d: Change the foods sits at the foods, above the result");
    ok((await page.locator(".rv-eat .pa-row-q").textContent()).trim() === "Did you eat it?" && (await chips(page).allTextContents()).join("|") === "All of it|Half|Part of it" && await page.locator(".rv-eat .pa-opt.on").count() === 0 && await page.locator(".rv-weight").count() === 0, "d: Did you eat it? All of it, Half, Part of it, white until chosen; no weight yet");
    ok(await chips(page).evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)) && await page.locator(".rv-go .pill").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "d: chips and buttons are 44 px or more");
    // the design rule this story adds: an answer under its question in its own block; the section's buttons under it, one row
    ok(await page.evaluate(() => { const q = document.querySelector(".rv-q"), go = document.querySelector(".rv-go"); const [a, b] = [...go.querySelectorAll(".pill")].map((x) => x.getBoundingClientRect()); return !q.contains(go) && !!(q.compareDocumentPosition(go) & 4) && q.firstElementChild.matches(".pa-row-q") && Math.abs(a.top - b.top) < 2 && a.left < b.left && go === document.querySelector(".read-view").lastElementChild; }), "design rule: the answer sits under its question in its own block; Save in My recipes and Done sit under the whole read, one row");
    ok((await page.locator(".rv-go .pill").allTextContents()).map((x) => x.trim()).join("|") === "Save in My recipes|Done" && await page.locator(".read-view .pill-primary").count() === 1 && /pill-primary/.test(await page.locator(".rv-done").getAttribute("class")) && /pill-action/.test(await page.locator(".rv-save").getAttribute("class")), "d: Save in My recipes on the left with the blue border, Done on the right, the one filled button");
    ok(await page.locator(".mp-say, .ways, .gate-card, .mp-again-link, .card-top").count() === 0 && !/Fit to my target|Quick picks|Empty plate/.test(await txt(page)), "d: nothing else: no plate tools, no Fit to my target, no Quick picks");
    await page.locator(".rv-done").click(); await page.waitForTimeout(900);
    st = await store(page);
    ok(st.items.length === 0 && !st.photo && st.feedback.length === 0 && st.meals.length === 0 && /Nothing on your plate yet\./.test(await txt(page, ".plate-empty-pic")) && /\/plate$/.test(page.url()), "e: Done with nothing chosen keeps nothing: back on the empty Plate");
    await ctx.close();

    // ---- 2. to keep it: Save in My recipes ----
    ({ ctx, page } = await open(justNow()));
    ok(/A photo from 18:55 today, from Your photos\./.test(await txt(page, ".pa-screen")), "a photo from Your photos says so, with its time");
    await toRead(page);
    await page.locator(".pe-save").click(); await page.waitForTimeout(500);
    st = await store(page);
    ok((await page.locator(".pe-save").textContent()).trim() === "✓ Saved in My recipes" && await page.locator(".pe-save").isDisabled() && st.meals.length === 1 && st.meals[0].title === "Pancakes with raspberries" && st.meals[0].items.length === 2 && st.meals[0].idea?.from === "photo" && !!(st.meals[0].photo || st.meals[0].photoSigs?.length) && st.items.length === 2, "Save it (Save in My recipes until 0.3.157) keeps it as a recipe from your photo, with its foods and photo; the button says Saved; the read stays");
    await ateIt(page);
    await page.locator(".rv-done").click(); await page.waitForTimeout(900);
    st = await store(page);
    ok(st.items.length === 0 && st.meals.length === 1 && st.feedback.length === 0, "Done: the recipe is kept, nothing counts");
    await ctx.close();

    // ---- 3. to count it for the day: All of it ----
    ({ ctx, page } = await open(justNow()));
    await toRead(page); await ateIt(page);
    await chips(page).nth(0).click(); await page.waitForTimeout(300);
    ok((await page.locator(".rv-eat .pa-opt.on").allTextContents()).join().replace("✓", "").trim() === "All of it" && await page.locator(".rv-grams").inputValue() === "210" && /g of 210 g\. Tap to correct it\./.test(await txt(page, ".rv-weight")), "All of it: chosen with the check mark; the weight shows below, 210 g of 210 g");
    await page.locator(".rv-done").click(); await page.waitForTimeout(1200);
    st = await store(page);
    ok(/\/today$/.test(page.url()) && st.feedback.length === 1 && st.feedback[0].status === "eaten" && st.feedback[0].meal.items.reduce((n, i) => n + i.grams, 0) === 210 && st.items.length === 0 && /Logged\. It's on Today\./.test(await txt(page, "body")), "Done counts it: on Today, the whole meal, Logged. It's on Today.");
    await ctx.close();

    // ---- 4. a part of it: Half, then Part of it with the grams typed ----
    ({ ctx, page } = await open(justNow()));
    await toRead(page); await ateIt(page);
    await chips(page).nth(1).click(); await page.waitForTimeout(300);
    ok(await page.locator(".rv-grams").inputValue() === "105" && (await page.locator(".rv-eat .pa-opt.on").allTextContents()).join().replace("✓", "").trim() === "Half", "Half fills the field: 105 g");
    await chips(page).nth(2).click(); await page.waitForTimeout(300);
    ok(await page.locator(".rv-grams").inputValue() === "" && await page.evaluate(() => document.activeElement?.classList.contains("rv-grams")), "Part of it: the field waits for your grams");
    await page.locator(".rv-done").click(); await page.waitForTimeout(500);
    ok((await store(page)).feedback.length === 0 && await page.locator(".read-view").count() === 1, "Part of it with no grams: Done waits for them");
    await page.locator(".rv-grams").fill("70"); await page.waitForTimeout(200);
    await page.locator(".rv-done").click(); await page.waitForTimeout(1200);
    st = await store(page);
    const eaten = st.feedback.filter((x) => x.status === "eaten");
    ok(st.feedback.length === 1 && eaten.length === 1 && Math.abs(eaten[0].meal.items.reduce((n, i) => n + i.grams, 0) - 70) <= 1 && /\/today$/.test(page.url()), "Done counts the 70 g you ate, as one meal on Today");
    await ctx.close();

    // ---- 5. to count it for the plan: the pencil, Tomorrow, the meal, Plan it ----
    ({ ctx, page } = await open(justNow()));
    await page.locator(".plan-line-pen").click(); await page.waitForTimeout(400);
    // changed by DT308.1 (0.3.157): the calendar behind the pencil: tomorrow, then its dinner; the tap closes it (no Done)
    await page.locator(".meal-line-open .pcal-day", { hasText: /^Tue 17$/ }).click(); await page.waitForTimeout(400);
    await page.locator(".meal-line-open .pcal-row", { hasText: /^\s*Dinner/ }).click(); await page.waitForTimeout(500);
    ok(await page.locator(".meal-line-open").count() === 0 && /^Dinner Tuesday, 17 November, 20:00 Goes into your plan\.$/.test(await line(page)), "behind the pencil: a tap on tomorrow's dinner sets it and closes the calendar");
    ok(await page.locator(".pa-screen").count() === 1, "the photo waits while you set the day and the meal");
    await toRead(page);
    t = await txt(page, ".read-view");
    ok(await page.locator(".rv-plan").count() === 1 && await page.locator(".rv-eat").count() === 0 && /Is it for the plan\?/.test(t) && /Plan it for Tuesday's dinner/.test(t) && await page.locator(".rv-chef").count() === 0, "a coming day: Is it for the plan? Plan it for Tuesday's dinner; no word about today");
    await page.locator(".rv-plan-chip").click(); await page.waitForTimeout(300);
    ok(/✓\s*Planned for Tuesday's dinner/.test(await txt(page, ".rv-plan")), "chosen: Planned for Tuesday's dinner");
    await page.locator(".rv-done").click(); await page.waitForTimeout(1200);
    st = await store(page);
    ok(/\/plan$/.test(page.url()) && /Planned for Tuesday's dinner\. It's on Plan\./.test(await txt(page, "body")) && st.items.length === 0 && st.feedback.length === 0, "Done puts it on the plan: Planned for Tuesday's dinner. It's on Plan.");
    await page.getByText("Tue 17", { exact: true }).first().click(); await page.waitForTimeout(600);
    ok(/Pancakes with raspberries/.test(await txt(page, "body")), "Tuesday's dinner on Plan is Pancakes with raspberries");
    await ctx.close();

    // ---- 6. a past day: a photo from yesterday fills in the meal line ----
    ({ ctx, page } = await open(photoAt(new Date("2026-11-15T19:40:00"))));
    ok(/A photo from yesterday, 19:40, from Your photos\./.test(await txt(page, ".pa-screen")) && /^Meal and day not set$/.test(await line(page)), "changed by DT308.5: a photo from yesterday does not fill in the meal line: Meal and day not set");
    await toRead(page);
    ok(await page.locator(".read-view").count() === 1 && await page.locator(".chef-ask").count() === 0 && /^Meal and day not set$/.test(await line(page)) && await page.locator(".rv-chef").count() === 0, "the read, with no page asking about an old plate in front of it; still no meal set");
    await page.locator(".read-view .pe-ate").click(); await page.waitForTimeout(300);
    ok(/Which meal\? From the photo, Sunday 19:40:/.test(await txt(page, ".read-view .plate-end")) && (await page.locator(".read-view .pcal-day.on").innerText()).trim() === "Sun 15" && /Dinner/.test(await page.locator(".read-view .pcal-row.on").innerText()), "Ate it: the calendar opens on the photo's day, yesterday, with the guess from the photo's time marked: Dinner");
    await page.locator(".read-view .pcal-row.on").click(); await page.waitForTimeout(500);
    ok(/^Dinner Sunday, 15 November, 19:40$/.test(await line(page)), "the tap sets yesterday's dinner in the line, at the photo's time");
    await chips(page).nth(0).click(); await page.waitForTimeout(300);
    await page.locator(".rv-done").click(); await page.waitForTimeout(1200);
    st = await store(page);
    ok(st.feedback.length === 1 && new Date(st.feedback[0].createdAt).getDate() === 15 && new Date(st.feedback[0].createdAt).getHours() === 19 && st.feedback[0].slot?.name === "Dinner" && /Logged for yesterday, 19:40\./.test(await txt(page, "body")), "Done counts it for yesterday's dinner: Logged for yesterday, 19:40.");
    await ctx.close();

    // ---- 7. to correct it or change it first ----
    ({ ctx, page } = await open(justNow()));
    await toRead(page);
    await page.locator(".read-view .mp-tag", { hasText: "Pancakes" }).click(); await page.waitForTimeout(300);
    await page.locator(".rv-amount").fill("200"); await page.locator(".rv-amount").blur(); await page.waitForTimeout(400);
    st = await store(page);
    ok(st.items.find((i) => /Pancakes/.test(i.food.name)).grams === 200 && /Pancakes ~?200 g/.test(await txt(page, ".read-view .mp-tags")), "an amount is corrected on the read, by a tap on it: 200 g");
    await page.locator(".rv-change .pill").click(); await page.waitForTimeout(700);
    st = await store(page);
    ok(!st.photo.view && st.items.length === 2 && await page.locator(".read-view").count() === 0 && await page.locator(".plate-end").count() === 1 && await page.locator(".mp-say").count() === 1 && await page.locator(".mp-say").getByRole("button", { name: /^Ate/ }).count() === 0 && /Fit to my target/.test(await txt(page)) && await page.locator(".rows .row, .rows > *").count() > 0, "Change the foods opens the plate as it is today, with these foods and its tools");
    await ctx.close();
    ok(errs.length === 0, "no page errors: " + errs.slice(0, 2).join(" | "));
  } finally { await b.close(); server.kill(); }
  console.log(fail ? `\n${fail} FAILED` : "\nall ok");
  process.exit(fail ? 1 : 0);
})();
