// 0.3.62 (Coach Milan 2 November 20:16 to 20:55, Go): a friend's dinner, read while Adding Wednesday's lunch, was stuck: no
// button showed. The photo's third chip is now Exploring (was An idea): the plate leaves the meal it was for, the pencil block
// says Exploring, that meal stays as it was and Chef Mealan says so; the idea's buttons show; nothing is logged; no eating
// window check. With the pencil block on Exploring first, a camera photo is Exploring too. The read is a stand-in (no AI here).
// Changed by story DT305 (0.3.151, boards Stories230 and Stories231; Coach Milan 16 November 2026, Go 11:35): the photo screen
// has no chips. Just looking is the meal line's own answer, behind the pencil, also while the photo waits; a photo you take
// waits on the photo screen too, and Read the plate reads it.
// Changed by B150 (0.3.160, board B150; Coach Milan 19 November 01:00, Go): Just looking and the X are gone. The last row of the calendar says No meal selected (just-looking.cjs taps it); a photo read with no meal selected is a photo of yours with no meal, and nothing is logged. Don't count it (not-counted.cjs) makes it the kept plate with the idea's buttons.
// 0.3.157 (DT308, the meal model; Coach Milan, Go 18 November 11:14), changed by the story: Just looking is the last row of the calendar behind the pencil (just-looking.cjs), in place of the chip under What is it for; a meal is tapped in that calendar, and with a meal set the X clears it first.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = [];
const F = (re) => seed.foods.find((f) => re.test(f.name));
const bowl = { id: "m-bowl", title: "Skyr bowl", items: [{ id: "b1", food: F(/^Skyr/), grams: 250, locked: true }, { id: "b2", food: F(/^Oats/), grams: 40, locked: true }, { id: "b3", food: F(/^Banana/), grams: 100, locked: true }], portion: 390, savedAt: "2026-10-20T08:00:00Z", steps: ["Stir the skyr smooth.", "Top with the oats and the sliced banana."] };
seed.meals = [bowl];
const k = (m) => ({ kcal: Math.round(m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0)), protein: Math.round(m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0)) });
const held = { title: "Skyr bowl", source: "mine", mealId: "m-bowl", items: bowl.items, portion: 390, ...k(bowl) };
const planned = { "2026-10-28": { dinner: held }, "2026-10-30": { breakfast: held } };
const PORT = "3392", U = `http://127.0.0.1:${PORT}`;
const PLATE = fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg"));
const withExif = (when) => {
  const le = (n, b) => { const x = Buffer.alloc(b); b === 2 ? x.writeUInt16LE(n) : x.writeUInt32LE(n); return x; };
  const tiff = Buffer.concat([Buffer.from("II"), le(42, 2), le(8, 4), le(1, 2), le(0x8769, 2), le(4, 2), le(1, 4), le(26, 4), le(0, 4),
    le(1, 2), le(0x9003, 2), le(2, 2), le(20, 4), le(44, 4), le(0, 4), Buffer.from(when + "\0", "ascii")]);
  const app1 = Buffer.concat([Buffer.from("Exif\0\0", "binary"), tiff]);
  const head = Buffer.from([0xff, 0xe1, (app1.length + 2) >> 8, (app1.length + 2) & 255]);
  return Buffer.concat([PLATE.subarray(0, 2), head, app1, PLATE.subarray(2)]);
};
const READ = { dish: "Schnitzel with roasted potatoes", foods: [
  { name: "Pork schnitzel, pan-fried", grams: 180, low: 140, high: 220, calories: 250, protein: 25, fats: 14, carbs: 8, fiber: 0.5, confidence: "medium" },
  { name: "Roasted potatoes", grams: 150, low: 110, high: 200, calories: 150, protein: 2.5, fats: 6, carbs: 22, fiber: 2.2, confidence: "medium" },
], unsure: null };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1, permissions: ["camera"] });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-29T20:16:00"));
    await page.addInitScript(([s, planned]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-planned", JSON.stringify(planned));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 }, window: { from: "10:00", to: "19:00" } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed, planned]);
    await require("./adult.cjs")(page);
    await page.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }));
    await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A classic dinner.", around: "", better_as: "" }) }));
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
    const text = async (sel = "main") => ((await page.locator(sel).first().textContent()) ?? "").replace(/\s+/g, " ");
    // ---- Adding Wednesday's lunch, then a friend's dinner: Exploring ----
    await page.goto(U + "/"); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(900);
    await page.getByRole("tab").filter({ hasText: /28/ }).first().click(); await page.waitForTimeout(600);
    await page.locator(".past-add .past-plate").filter({ hasText: "Lunch" }).getByRole("button", { name: "Add what you ate" }).click(); await page.waitForTimeout(1000);
    ok(/Adding Wednesday's lunch/.test(await text(".step-head")), "Adding Wednesday's lunch");
    const before = (await st()).feedback.length;
    await (await require("./more.cjs")(page, "mp")).click(); await page.waitForTimeout(1500);
    await page.locator(".camera-ui input[type=file]").setInputFiles({ name: "plate.jpg", mimeType: "image/jpeg", buffer: withExif("2026:10:29 19:40:00") }); await page.waitForTimeout(1200);
    ok(await page.locator(".pa-screen").count() === 1 && await page.locator(".pa-chip").count() === 0, "DT305: the photo waits on the photo screen, with no chips");
    await require("./just-looking.cjs")(page);
    ok(await page.locator(".pa-screen").count() === 1 && /No meal selected/.test(await text(".plan-line")), "DT305, changed by B150: No meal selected behind the pencil, while the photo waits");
    await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(1800);
    const s0 = await st();
    ok(s0.photo && s0.photo.who !== "idea" && !s0.pick && !s0.photo.meal && !/Adding Wednesday's lunch/.test(await text(".step-head")) && /No meal selected/.test(await text(".plan-line")) && s0.feedback.length === before, "B150: the plate leaves Wednesday's lunch; the line says No meal selected; nothing logged");
    await require("./not-counted.cjs")(page);
    const s1 = await st();
    ok(s1.photo?.who === "idea" && s1.pick === "exploring" && /No meal selected/.test(await text(".plan-line")), "B150: Don't count it keeps the plate out of the day; the line still says No meal selected");
    const pl = await text(".mp-big-say"); ok(/A photo with no meal selected\. 2 foods read/.test(pl), "the photo line says A photo with no meal selected: " + pl.slice(0, 80));
    const say = await text(".mp-say");
    ok(await page.locator(".mp-say").getByRole("button", { name: "Save as an idea" }).count() === 1 && await page.locator(".mp-say").getByRole("button", { name: "Put it in my plan" }).count() === 1, "the idea's buttons show: " + say.slice(0, 160));
    // DT268 (0.3.118): the Served block says "Your day stays as it was"; the check is about the gates, so it reads the Plate without that block
    const noServed = (await page.evaluate(() => { const m = document.querySelector("main").cloneNode(true); m.querySelectorAll(".sv-plate").forEach((x) => x.remove()); return m.textContent; })).replace(/\s+/g, " ");
    ok(!/Your day/.test(noServed) && !/eating window/.test(noServed), "no eating-window check while exploring");
    ok((await st()).feedback.length === before, "nothing logged");
    await page.locator(".plate-empty-link").click(); await page.locator(".plate-empty-link").click(); await page.waitForTimeout(500);
    // ---- the pencil block on Exploring first: a camera photo is Exploring too ----
    await require("./just-looking.cjs")(page);
    await (await require("./more.cjs")(page, "mp")).click(); await page.waitForTimeout(1500);
    await page.locator("#camera-shutter-button").click(); await page.waitForTimeout(400); await page.locator(".cam-analyze").click(); await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(2200);
    const s2a = await st();
    ok(s2a.photo && s2a.photo.who !== "idea" && !s2a.pick && s2a.feedback.length === before, "B150: No meal selected first: the camera's photo is read with no meal, and nothing is logged");
    await require("./not-counted.cjs")(page);
    const s2 = await st();
    ok(s2.photo?.who === "idea" && s2.pick === "exploring" && await page.locator(".mp-say").getByRole("button", { name: "Save as an idea" }).count() === 1, "B150: Don't count it: the idea's buttons show");
    // ---- 0.3.65: Exploring in the pencil box on a meal of the plan too ----
    await page.locator(".plate-empty-link").click(); await page.locator(".plate-empty-link").click(); await page.waitForTimeout(400);
    await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(900);
    await page.getByRole("tab").filter({ hasText: /28/ }).first().click(); await page.waitForTimeout(600);
    await page.locator(".past-add .past-plate").filter({ hasText: "Lunch" }).getByRole("button", { name: "Add what you ate" }).click(); await page.waitForTimeout(1000);
    // changed by B150 (0.3.160): no X on the line; the row No meal selected, behind the pencil, takes the meal off
    ok(await page.locator(".meal-line .plan-line-x").count() === 0 && await page.locator(".meal-line .plan-line-pen").count() === 1, "0.3.65, changed by B150: on Adding Wednesday's lunch the meal line has its pencil and no X");
    await require("./just-looking.cjs")(page); await page.waitForTimeout(300);
    ok(!/Adding Wednesday's lunch/.test(await text(".step-head")) && !(await st()).pick && /No meal selected/.test(await text(".plan-line")), "0.3.65, changed by B150: No meal selected leaves Wednesday's lunch");
    await ctx.close();
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all ok");
  process.exit(fail ? 1 : 0);
})();
