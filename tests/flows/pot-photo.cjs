// JOURNEY (B144, 0.3.150, board Stories225; Coach Milan 15 November 19:04 to 19:12, Go 19:22): a photo of a pot of soup. The
// form before the read is the same form, with choices that adapt: a first look says it is a pot, so the form asks how much of
// it is yours (The whole pot, My portion); for a meal it asks which dish of that meal it is, with Chef Mealan's guess ticked;
// your words have a box with room for a list. The read gets your answers and your words. When your words list what is in the
// dish, the plate gets those foods as its rows; the cooking foods are named and not counted. Under the photo, what you chose and
// what you said stay in view. The whole pot becomes a recipe with portions, opened as a whole recipe is. A starter is one dish of
// the meal and is not judged as the whole meal. Wrong foods? opens the same form again, with your answers. The reads are stand-ins.
// Changed by story DT305 (0.3.151, boards Stories230 and Stories231; Coach Milan 15 November 22:43 "one step less", 16 November
// Go 11:35): the dish row left the photo screen: Chef Mealan's guess of the dish goes with the read and shows under the photo.
// The box asks Anything Chef Mealan should know?. After a read of your own portion the read shows alone; Change the foods
// opens the plate, where Wrong foods? still has both rows.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3533", U = `http://127.0.0.1:${PORT}`;
const WORDS = "mushrooms, carrots, onion, garlic, white carrot, sour cream, chicken bouillon, parsley, pepper, vlašac";
const f = (name, grams, calories, protein, fats, carbs, fiber) => ({ name, grams, low: Math.round(grams * 0.7), high: Math.round(grams * 1.3), calories, protein, fats, carbs, fiber, confidence: "medium" });
const READ = (portion) => ({ dish: "Creamy mushroom vegetable soup", foods: [f("Mushrooms", 400, 22, 3.1, 0.3, 3.3, 1), f("Carrots", 200, 41, 0.9, 0.2, 9.6, 2.8), f("Onion", 120, 40, 1.1, 0.1, 9.3, 1.7), f("Parsnip", 120, 75, 1.2, 0.3, 18, 4.9), f("Garlic", 10, 149, 6.4, 0.5, 33, 2.1), f("Sour cream, 20 %", 200, 193, 2.4, 20, 2.9, 0)].map((x) => (portion ? { ...x, grams: Math.round(x.grams / 4), low: Math.round(x.low / 4), high: Math.round(x.high / 4) } : x)),
  unsure: null, which: null, course: "starter", vessel: "pot", serves: 4, cooking: ["chicken bouillon", "parsley", "pepper", "chives"] });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [], sent = [];
  const open = async (look = { vessel: "pot", course: "starter" }) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1, permissions: ["camera"] });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-15T18:00:00") });
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.route("**/api/plate-look", (r) => (look ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(look) }) : r.fulfill({ status: 503, contentType: "application/json", body: "{}" })));
    await page.route("**/api/plate-photo", (r) => { const q = r.request().postDataJSON(); sent.push({ share: q.share, course: q.course, note: q.note }); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ(q.share === "portion")) }); });
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "", around: "", betterAs: "meal", holds: "" }) }));
    await page.route("**/api/members/foods**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, foods: [] }) }));
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    await (await require("./more.cjs")(page, "mp")).click(); await page.waitForTimeout(1500);
    await page.locator(".camera-ui input[type=file]").setInputFiles(path.join(ROOT, "tests/flows/pot.jpg")); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const on = (loc) => loc.locator(".pa-opt.on").allInnerTexts().then((x) => x.map((t) => t.replace("✓", "").trim()));
  try {
    // ---- the whole pot, a starter ----
    let { ctx, page } = await open();
    const pa = page.locator(".pa");
    ok(/It looks like a pot\. How much of it is yours\?/.test(await pa.locator(".pa-share").innerText()) && (await on(pa.locator(".pa-share"))).join() === "The whole pot", "a pot: the form asks how much of it is yours, The whole pot ticked");
    ok(await pa.locator(".pa-dish").count() === 0, "DT305: the photo screen does not ask which dish it is");
    ok(await pa.locator("textarea").count() === 1 && /Anything Chef Mealan should know\?/.test(await pa.innerText()), "your words have a box with room for a list");
    ok(await pa.locator(".pa-row .pa-opt").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "every chip of the new rows is 44 px or more");
    await pa.locator("textarea").fill(WORDS);
    await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(2200);
    ok(sent.length === 1 && sent[0].share === "whole" && sent[0].course === "starter" && sent[0].note === WORDS, "the read gets your answers and your words: " + JSON.stringify(sent[0]).slice(0, 80));
    let st = await store(page);
    const pot = st.meals.find((m) => m.id === st.photo.pot);
    ok(!!pot && pot.makes.n === 4 && pot.items.length === 6 && st.items.length === 6 && st.fromRecipe === pot.id && st.course === "starter", "the whole pot is a recipe of 4 portions, on the plate with its six foods, as the dinner's starter");
    let t = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    ok(/The whole recipe/.test(t) && /Sized for your dinner/.test(t) && /One portion, as the recipe makes it/.test(t) && /From your photo\./.test(t), "it opens as a whole recipe does: The whole recipe, Sized for your dinner, One portion; From your photo");
    ok(/The whole pot · Starter of your dinner/.test(t) && t.includes("You said: " + WORDS), "under the photo, what you chose and what you said stay in view");
    ok(/For cooking, not counted:/.test(t) && ["chicken bouillon", "parsley", "pepper", "chives"].every((c) => t.includes(c)), "the cooking foods are named, not counted");
    await ctx.close();
    // ---- my portion ----
    ({ ctx, page } = await open());
    await page.locator(".pa-share .pa-opt").nth(1).click(); await page.locator(".pa-screen textarea").fill(WORDS);
    await page.getByRole("button", { name: "Read the plate" }).click(); await page.waitForTimeout(2200);
    st = await store(page);
    ok(sent[sent.length - 1].share === "portion" && st.items.length === 6 && !st.photo.pot && !st.fromRecipe && st.items[0].grams === 100 && st.course === "starter", "My portion: the six foods at one portion's amounts, no recipe made");
    t = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    ok(/My portion · Starter of your dinner/.test(t) && /For cooking, not counted:/.test(t), "My portion · Starter of your dinner, and the cooking foods");
    ok(!/This is a snack, not your dinner/.test(t) && !/More than half of this dinner's energy is fat/.test(t) && /Did you eat it\?/.test(t), "a starter is one dish of the dinner: not called a snack, not judged as the whole dinner; the card only asks");
    // Wrong foods? opens the same form, with your answers (DT305: on the plate, behind Change the foods)
    await page.locator(".rv-change .pill").click(); await page.waitForTimeout(600);
    await page.locator(".mp-again-link").click(); await page.waitForTimeout(300);
    const help = page.locator(".mp-help");
    ok((await on(help.locator(".pa-share"))).join() === "My portion" && (await on(help.locator(".pa-dish"))).join() === "Starter" && await help.locator("textarea").inputValue() === WORDS, "Wrong foods? opens the same form again, with your answers in it");
    await help.locator(".pa-dish .pa-opt").nth(1).click(); await help.locator(".pill-primary").click(); await page.waitForTimeout(2200);
    st = await store(page);
    ok(sent[sent.length - 1].course === "main" && sent[sent.length - 1].share === "portion" && !st.course && st.photo.dish === "main", "Main dish picked there: read again as the main dish");
    await ctx.close();
    // ---- a plate, and a look that did not answer: no pot row; Main dish ticked ----
    ({ ctx, page } = await open({ vessel: "plate", course: "main" }));
    ok(await page.locator(".pa .pa-share").count() === 0 && await page.locator(".pa .pa-dish").count() === 0, "a plate: no pot row, no dish row");
    await ctx.close();
    ({ ctx, page } = await open(null));
    ok(await page.locator(".pa .pa-share").count() === 0 && await page.locator(".pa .pa-dish").count() === 0 && await page.getByRole("button", { name: "Read the plate" }).count() === 1, "the first look did not answer: the photo screen still works");
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
