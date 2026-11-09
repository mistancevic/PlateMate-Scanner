// DT268 steps 1 and 2 (0.3.118, 0.3.119, board Stories201; Coach Milan 9 November 21:46 to 23:44, Go): Served. A plate read as Exploring is kept
// on its own: the name and the dish as Chef Mealan read them; Scan another plate, mine or someone else's, joins the visit;
// nothing is logged. Recipes shows the visit as one card with its note; a Served plate opens with its photo, the honest line
// its numbers each with a range, and its foods; Share the numbers draws the picture and opens the share sheet; I ate this asks the day and the meal and puts your dishes in as one meal. The read is a stand-in (no AI here).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = [];
const F = (re) => seed.foods.find((f) => re.test(f.name));
seed.meals = [{ id: "m-bowl", title: "Skyr bowl", items: [{ id: "b1", food: F(/^Skyr/), grams: 250, locked: true }, { id: "b2", food: F(/^Oats/), grams: 40, locked: true }], portion: 290, savedAt: "2026-10-20T08:00:00Z", steps: ["Stir the skyr smooth."] }];
const PORT = "3490", U = `http://127.0.0.1:${PORT}`;
const PLATE = fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg"));
const fd = (name, grams, calories, protein, fats, carbs) => ({ name, grams, low: Math.round(grams * 0.8), high: Math.round(grams * 1.3), calories, protein, fats, carbs, fiber: 1, confidence: "medium" });
const READS = [
  { dish: "Meatballs in tomato sauce", course: "main", foods: [fd("Meatballs, beef and pork", 150, 240, 17, 17, 5), fd("Mashed potato", 95, 110, 2, 4, 16)], unsure: null },
  { dish: "Bruschetta", course: "starter", foods: [fd("Toasted bread", 60, 280, 9, 3, 52), fd("Tomato, diced", 80, 20, 1, 0.2, 4)], unsure: null },
  { dish: "Chicken quesadilla", course: "main", foods: [fd("Flour tortilla", 90, 310, 8, 8, 50), fd("Chicken, grilled", 80, 165, 31, 3.6, 0)], unsure: null },
  { dish: "Apple strudel", course: "soup", foods: [fd("Apple strudel", 120, 270, 3, 12, 37)], unsure: null },
];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 1, permissions: ["camera"], timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-07T13:05:00+01:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    // the stand-in share sheet: what would be shared is kept
    await page.addInitScript(() => { window.__shared = []; navigator.canShare = (d) => !!(d && d.files && d.files.length); navigator.share = async (d) => { window.__shared.push({ title: d.title, files: (d.files || []).map((f) => ({ name: f.name, type: f.type, size: f.size })) }); }; });
    let n = 0;
    await page.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READS[Math.min(n++, READS.length - 1)]) }));
    await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A classic.", around: "", better_as: "" }) }));
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
    const text = async (sel = "main") => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ");
    const file = { name: "plate.jpg", mimeType: "image/jpeg", buffer: PLATE };
    // ---- 1. a photo read as Exploring is kept as Served ----
    await page.goto(U + "/"); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(800);
    await page.locator(".mp-button").click(); await page.waitForTimeout(1500);
    await page.locator(".camera-ui input[type=file]").setInputFiles(file); await page.waitForTimeout(1200);
    await page.locator(".pa-chip").filter({ hasText: "Exploring" }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(1800);
    const sv = page.locator(".sv-plate");
    ok(await sv.count() === 1 && /Served\s*Kept in Recipes, under Served/.test(await text(".sv-head")), "the Plate says the plate is kept, marked Served");
    let s = await st();
    ok(s.served?.length === 1 && s.served[0].mine === true && s.served[0].dish === "main" && s.served[0].name === "Meatballs in tomato sauce" && s.served[0].items.length === 2 && /^data:image/.test(s.served[0].photo), "kept by itself: the name and the dish as read, the foods, the photo");
    ok(await sv.locator(".sv-name").inputValue() === "Meatballs in tomato sauce" && await sv.locator(".sv-by").count() === 2, "the name and the dish say filled by Chef Mealan");
    ok(await sv.getByRole("radio", { name: "Main" }).getAttribute("aria-checked") === "true" && await sv.getByRole("radio").count() === 5, "five dishes, Main set by the read");
    ok(s.feedback.length === 0 && /Nothing is logged/.test(await text(".sv-foot")), "nothing is logged");
    ok(await page.locator(".mp-say").getByRole("button", { name: "Save as an idea" }).count() === 1, "the idea's buttons stay as they were");
    ok(await sv.getByRole("button", { name: "Share the numbers" }).count() === 1, "the Plate's block has Share the numbers");
    // a tap corrects the dish; the name takes whose
    await sv.getByRole("radio", { name: "Dessert" }).click(); await page.waitForTimeout(300);
    ok((await st()).served[0].dish === "dessert" && await sv.locator(".sv-by").count() === 1, "a tap corrects the dish, and the dish no longer says filled by Chef Mealan");
    await sv.getByRole("radio", { name: "Main" }).click(); await page.waitForTimeout(200);
    await sv.locator(".sv-name").fill("Meatballs, mine"); await page.waitForTimeout(400);
    s = await st();
    ok(s.served.length === 1 && s.served[0].name === "Meatballs, mine" && s.served[0].dish === "main" && await sv.locator(".sv-by").count() === 0, "the name you type is the plate's name, one plate still");
    const low = await sv.locator("button, input").evaluateAll((xs) => xs.filter((x) => x.getBoundingClientRect().height < 44).map((x) => x.className));
    ok(low.length === 0, "every button and field at least 44 px: " + low.join(", "));
    // ---- 2. Scan another plate: another dish of mine joins the visit ----
    await sv.locator(".sv-mine").click(); await page.waitForTimeout(300);
    ok(await sv.locator(".pp-row").count() === 1, "Another dish of mine asks Camera or Gallery");
    await sv.locator(".pp-gallery input[type=file]").setInputFiles(file); await page.waitForTimeout(2200);
    s = await st();
    ok(s.served.length === 2 && s.served[0].name === "Bruschetta" && s.served[0].dish === "starter" && s.served[0].mine === true && s.served[0].visit === s.served[1].visit, "the first plate stays; the second is kept as a starter of mine, in the same visit");
    ok(await page.locator(".sv-name").inputValue() === "Bruschetta" && s.photo?.who === "idea", "the Plate now holds the second plate, still Exploring");
    // ---- 3. someone else's plate ----
    await page.locator(".sv-other").click(); await page.waitForTimeout(300);
    await page.locator(".sv-plate .pp-gallery input[type=file]").setInputFiles(file); await page.waitForTimeout(2200);
    s = await st();
    ok(s.served.length === 3 && s.served[0].name === "Chicken quesadilla" && s.served[0].mine === false && new Set(s.served.map((x) => x.visit)).size === 1 && s.feedback.length === 0, "a third plate, someone else's, in the same visit; still nothing logged");
    await page.locator(".sv-name").fill("Marko's quesadilla"); await page.waitForTimeout(300);
    // ---- 4. Recipes: the visit as one card ----
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(900);
    const g = page.locator(".sv-group");
    ok(/Served · 1 visit, 3 plates/.test(await text(".sv-group .rc-group-title")) && /Cooked in another kitchen\. Read from a photo, not weighed\./.test(await text(".sv-lead")), "Recipes has the Served group: " + await text(".sv-group .rc-group-title"));
    ok(await page.evaluate(() => { const a = document.querySelector(".sv-group"), b = [...document.querySelectorAll(".rc-group")].find((x) => !x.classList.contains("sv-group")); return !!a && !!b && a.getBoundingClientRect().top < b.getBoundingClientRect().top; }), "above Made by me");
    ok(/Saturday.* 7 November, lunch/.test(await text(".sv-visit-title b")), "with no note the visit is the day and the meal: " + await text(".sv-visit-title b"));
    const rows = await g.locator(".sv-row").allInnerTexts();
    ok(rows.length === 3 && /Bruschetta/.test(rows[0]) && /Starter/.test(rows[0]) && /Meatballs, mine/.test(rows[1]) && /Main/.test(rows[1]) && /Marko's quesadilla/.test(rows[2]) && !/Main|Starter/.test(rows[2]), "your dishes in the order of a meal with their dish, then the others: " + rows.map((x) => x.replace(/\n/g, " ")).join(" | "));
    ok(/Mine · about [\d,]+ kcal · \d+ g protein/.test(await text(".sv-part")) && /Others at the table/.test(await text(".sv-visit")), "Mine with its total, then Others at the table: " + await text(".sv-part"));
    // the chip shows Served alone
    await page.locator(".rb-served button").click(); await page.waitForTimeout(400);
    ok(/Served · 3/.test(await text(".rb-served")) && await page.locator(".rc-group").count() === 1, "the Served chip shows the Served group alone");
    await page.locator(".rb-served button").click(); await page.waitForTimeout(300);
    ok(await page.locator(".rc-group").count() === 2, "and off again shows the recipes too");
    // the note
    await g.locator(".sv-note-edit").click(); await page.waitForTimeout(200);
    await g.locator(".sv-note").fill("Café Jadran"); await g.getByRole("button", { name: "Save" }).click(); await page.waitForTimeout(400);
    s = await st();
    ok(/Café Jadran/.test(await text(".sv-visit-title b")) && /Saturday/.test(await text(".sv-visit-title small")) && s.served.every((x) => x.note === "Café Jadran"), "the note is the visit's title, the day under it, on every plate of the visit");
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Recipes fits the width");
    // ---- 5. a Served plate, open ----
    await g.locator(".sv-row").filter({ hasText: "Marko's quesadilla" }).click(); await page.waitForTimeout(500);
    const one = page.locator(".sv-one");
    ok(await one.locator("h3").innerText() === "Marko's quesadilla" && await one.locator(".sv-mark").count() === 1 && /Café Jadran/.test(await text(".sv-tags")), "the plate opens: its name, the Served mark, the visit");
    ok(/Read from a photo, not weighed\. A kitchen you did not cook in often uses more oil and butter/.test(await text(".sv-honest")), "the honest line");
    ok(await one.locator(".sv-food").count() === 2 && /^data:image/.test(await one.locator(".sv-photo").getAttribute("src")), "the photo and the foods as read");
    // step 2: the numbers, each with its range
    const nums = (await one.locator(".sv-num").allInnerTexts()).map((x) => x.replace(/\s+/g, " "));
    ok(nums.length === 5 && /^Energy about [\d,]+ kcal [\d,]+ to [\d,]+$/.test(nums[0]) && /^Protein about \d+ g \d+ to \d+ g$/.test(nums[1]) && /^Fat about/.test(nums[2]) && /^Carbs about/.test(nums[3]) && /^PD about [\d.]+ [\d.]+ to [\d.]+$/.test(nums[4]), "energy, protein, fat, carbs and PD, each about a number with its range: " + nums.join(" | "));
    const rg = (t) => { const m = t.replace(/,/g, "").match(/about ([\d.]+).*? ([\d.]+) to ([\d.]+)/); return m ? m.slice(1).map(Number) : [0, 0, 0]; };
    const [fm, fl, fh] = rg(nums[2]), [km, kl, kh] = rg(nums[0]);
    ok(kl < km && km < kh && fl <= fm && fm < fh && fh - fm > fm - fl, `the range holds the number; fat reaches further up than down (${fl}, ${fm}, ${fh})`);
    ok(/A guess with its range\. Fat can be higher than a photo shows/.test(await text(".sv-range-note")), "the line under the table says it is a guess");
    // Share the numbers: the picture, then the phone's share sheet
    await one.locator(".sv-share-it").click(); await page.waitForTimeout(1200);
    const sh = page.locator(".sv-share");
    ok(await sh.locator("h3").innerText() === "Share the numbers" && /^data:image\/jpeg/.test((await sh.locator("img.sv-picture").getAttribute("src")) ?? ""), "Share the numbers draws the picture");
    const dim = await sh.locator("img.sv-picture").evaluate((i) => new Promise((res) => { const j = new Image(); j.onload = () => res(j.naturalWidth + "x" + j.naturalHeight); j.src = i.src; }));
    ok(dim === "1080x1350", "the picture is 1080 by 1350: " + dim);
    await sh.getByRole("button", { name: "Send it ›" }).click(); await page.waitForTimeout(600);
    const shared = await page.evaluate(() => window.__shared);
    ok(shared.length === 1 && shared[0].files.length === 1 && shared[0].files[0].type === "image/jpeg" && /^marko-s-quesadilla\.jpg$/.test(shared[0].files[0].name) && shared[0].files[0].size > 20000, "Send it hands one picture to the share sheet: " + JSON.stringify(shared));
    ok(await sh.locator("button").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "its buttons are at least 44 px");
    await sh.locator(".sv-back").click(); await page.waitForTimeout(300);
    ok(await page.locator(".sv-one").count() === 1, "Back returns to the plate");
    ok(await one.getByRole("button", { name: /Start cooking|Cook again/ }).count() === 0 && await one.getByRole("button", { name: "I ate this" }).count() === 1 && await one.getByRole("button", { name: "Put it on the Plate" }).count() === 1, "no cooking; I ate this and Put it on the Plate");
    const low2 = await one.locator("button").evaluateAll((xs) => xs.filter((x) => x.getBoundingClientRect().height < 44).map((x) => x.className));
    ok(low2.length === 0, "every button at least 44 px: " + low2.join(", "));
    // Remove asks first
    await one.locator(".sv-remove").click(); await page.waitForTimeout(200);
    ok((await st()).served.length === 3 && await one.getByRole("button", { name: "Remove this plate" }).count() === 1, "Remove asks first");
    await one.getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(200);
    await one.locator(".sv-back").click(); await page.waitForTimeout(400);
    // ---- 6. I ate this, on a visit: your dishes as one meal ----
    await g.locator(".sv-row").filter({ hasText: "Meatballs, mine" }).click(); await page.waitForTimeout(400);
    await page.locator(".sv-one .sv-ate").click(); await page.waitForTimeout(400);
    const ate = page.locator(".sv-ate-card");
    ok(/When did you eat it\?/.test(await text(".sv-ate-card h3")) && await ate.locator(".sv-ate-dish").count() === 2 && /One meal\s*about [\d,]+ kcal · \d+ g protein/.test(await text(".sv-ate-total")), "it asks when; your two dishes and the one meal's total, not Marko's");
    ok(/^[\d,]+ to [\d,]+ kcal$/.test((await text(".sv-ate-range")).trim()), "the meal's range under the total: " + await text(".sv-ate-range"));
    ok(await ate.getByRole("radio", { name: /the day of the photo/ }).getAttribute("aria-checked") === "true" && await ate.getByRole("radio", { name: "Lunch" }).getAttribute("aria-checked") === "true", "the day of the photo and the meal by its time are set");
    ok(/Put it in Saturday's lunch, eaten/.test(await text(".sv-put")), "the button says where it goes: " + await text(".sv-put"));
    await ate.locator(".sv-put").click(); await page.waitForTimeout(600);
    s = await st();
    const fb = s.feedback[0];
    ok(s.feedback.length === 1 && fb.status === "eaten" && fb.meal.items.length === 4 && fb.meal.title === "Meatballs, mine" && fb.slot?.slotId === "lunch" && fb.slot?.date === "2026-11-07", "one meal logged: four foods, named after the main, in Saturday's lunch");
    ok(s.served.length === 3 && s.served.filter((x) => x.eatenAt).length === 2 && !s.served.find((x) => !x.mine).eatenAt, "the plates stay in Served; yours say they were eaten");
    ok(/In your day: Saturday/.test(await text(".sv-eaten")), "the open plate says it is in your day");
    await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(900);
    ok(/Meatballs, mine/.test(await text(".meals-card")) && /^(data:image|blob:)/.test((await page.locator(".meals-card img.log-photo").first().getAttribute("src")) ?? ""), "Today shows the meal with its photo");
    // ---- 7. Put it on the Plate; Remove ----
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(800);
    await page.locator(".sv-row").filter({ hasText: "Marko's quesadilla" }).click(); await page.waitForTimeout(400);
    await page.locator(".sv-one .sv-remove").click(); await page.locator(".sv-one .sv-remove-yes").click(); await page.waitForTimeout(400);
    s = await st();
    ok(s.served.length === 2 && await page.locator(".sv-one").count() === 0 && /1 visit, 2 plates/.test(await text(".sv-group .rc-group-title")), "Remove this plate takes it off and goes back to Recipes");
    await page.locator(".sv-row").filter({ hasText: "Bruschetta" }).click(); await page.waitForTimeout(400);
    await page.locator(".sv-one .sv-plate-it").click(); await page.waitForTimeout(900);
    s = await st();
    ok(/\/plate$/.test(page.url()) && s.items.length === 2 && !s.photo && s.served.length === 2, "Put it on the Plate: its foods are on the Plate, the plate stays in Served");
    // ---- 8. Don't keep it; a dish the read cannot name is a main ----
    await page.locator(".plate-empty-link").click(); await page.locator(".plate-empty-link").click(); await page.waitForTimeout(500);
    await page.locator(".mp-button").click(); await page.waitForTimeout(1500);
    await page.locator(".camera-ui input[type=file]").setInputFiles(file); await page.waitForTimeout(1200);
    await page.locator(".pa-chip").filter({ hasText: "Exploring" }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(1800);
    s = await st();
    ok(s.served.length === 3 && s.served[0].name === "Apple strudel" && s.served[0].dish === "main" && s.served[0].visit === s.served[1].visit, "a dish the read cannot name is a main; a plate soon after joins the visit");
    await page.locator(".sv-drop").click(); await page.waitForTimeout(400);
    s = await st();
    ok(s.served.length === 2 && s.items.length === 1 && /Not kept/.test(await text(".sv-off")), "Don't keep it: off the list, the Plate keeps its foods and says so");
    // ---- 9. Srpski and German ----
    for (const l of ["sr-Latn", "de"]) {
      await page.evaluate((l) => localStorage.setItem("chefmealan-lang", l), l);
      await page.setViewportSize({ width: l === "de" ? 360 : 390, height: 1500 });
      await page.goto(U + "/"); await page.waitForTimeout(900); await page.locator("nav button").nth(3).click(); await page.waitForTimeout(900);
      ok(!/Served|Mine ·|Others at the table/.test(await text(".sv-group")), `${l}: the group in the language: ` + (await text(".sv-group .rc-group-title")));
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${l}: Recipes fits the width`);
      await page.locator(".sv-row").first().click(); await page.waitForTimeout(400);
      ok(!/Read from a photo|I ate this|Put it on the Plate|Remove|Energy|about|Share the numbers/.test(await text(".sv-one")) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${l}: the plate in the language, fits the width: ` + (await page.evaluate(() => document.documentElement.scrollWidth + "/" + window.innerWidth)) + " " + ((await text(".sv-one")).match(/Read from a photo|I ate this|Put it on the Plate|Remove/) || [""])[0]); if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT + `/sv-${l}.png`, fullPage: true });
      await page.locator(".sv-one .sv-ate").click(); await page.waitForTimeout(400);
      ok(!/When did you eat|Put it in|Another day/.test(await text(".sv-ate-card")) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${l}: I ate this in the language, fits the width: ` + await text(".sv-put"));
    }
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok");
  process.exit(fail ? 1 : 0);
})();
