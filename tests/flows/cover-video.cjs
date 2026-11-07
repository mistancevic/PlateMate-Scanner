// DT254 (0.3.105, board Stories187; Coach Milan 7 November 12:16 to 13:24, Go): the cover is the recipe's video. A recipe whose
// every step has a picture: the page opens and the cover plays the steps once, without sound, the step under the picture; a
// tap opens the player with the words; then it rests on the cover with ▶ in the middle, and ▶ plays it again. Its tile in
// Recipes has ▶ in the middle of its cover. A phone set to reduce motion does not play by itself. Fewer pictures: a photo.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const PORT = "3406", B = `http://127.0.0.1:${PORT}`;
const PIC = "data:image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "front.jpg")).toString("base64");
const COVER = "data:image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "plate.jpg")).toString("base64");
const F = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
const items = [[160, F("c", "Chicken breast, raw", 120, 22.5, 2.6, 0)], [80, F("r", "Basmati rice, dry", 356, 8.5, 0.9, 78)]].map(([g, f]) => ({ id: f.id, grams: g, food: f, locked: false }));
const STEPS = ["Cook [[i:r|rice]] for 12 minutes.", "Cut [[i:c|chicken]] into strips.", "Fry the chicken 6 minutes.", "Put it all in a bowl."];
const withPics = (id, title, n) => ({ id, title, items, portion: 240, steps: STEPS, stepPics: STEPS.map((_, k) => (k < n ? PIC : null)), stepPicMeta: STEPS.map((t, k) => (k < n ? { by: "me", step: t } : null)), photos: [COVER], savedAt: "2026-11-01T18:00:00Z" });
const state = { ...seed, meals: [withPics("m-v", "Chicken rice bowl", 4), withPics("m-p", "Rice and chicken", 3)] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (url, { calm = false, width = 390 } = {}) => {
    const ctx = await b.newContext({ viewport: { width, height: 844 }, reducedMotion: calm ? "reduce" : "no-preference" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-07T13:30:00") });
    await page.addInitScript((s) => {
      if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
        sessionStorage.setItem("seeded", "1"); }
    }, state);
    await require("./adult.cjs")(page);
    await page.goto(B + url); await page.waitForTimeout(1200);
    return page;
  };
  const src = (page) => page.evaluate(() => document.querySelector(".rq-video .rq-video-pic img")?.src);
  try {
    let page = await open("/my-recipes/m-v");
    const v = page.locator(".rq-video");
    ok(await v.count() === 1 && await page.locator(".rq-video.playing").count() === 1, "the page opens and the cover plays");
    ok(await src(page) === PIC && /STEP 1 OF 4 · NO SOUND · TAP FOR THE WORDS/.test(await v.textContent()) && await v.locator(".rq-video-bar span").count() === 4, "step 1's picture, which step under it, a bar of four");
    ok(await v.locator(".rq-hero .watch-play").count() === 0 && await v.locator(".rq-hero .rph-cover").count() === 0, "nothing on the picture while it plays");
    await page.clock.runFor(5500); await page.waitForTimeout(200);
    ok(/STEP 2 OF 4/.test(await v.textContent()) && await v.locator(".rq-video-bar span.on").count() === 1, "5 seconds: step 2");
    ok(await page.locator(".watch-card").count() === 0, "the separate Watch the steps card is gone");
    await page.clock.runFor(16000); await page.waitForTimeout(300);
    ok(await page.locator(".rq-video.playing").count() === 0 && await src(page) === COVER && await v.locator(".watch-play").count() === 1, "after the last step it rests on the cover, ▶ in the middle");
    ok(/Watch with the words ›/.test(await v.textContent()) && /4 steps, about 20 seconds/.test(await v.textContent()) && await v.locator(".rph-cover").count() === 1, "Watch with the words, 4 steps, about 20 seconds; Cover");
    const play = await v.locator(".rq-video-pic").boundingBox(); ok(play && play.height >= 44, "▶ is a large button");
    await v.locator(".rq-video-pic").click(); await page.waitForTimeout(200);
    ok(await page.locator(".rq-video.playing").count() === 1 && /STEP 1 OF 4/.test(await v.textContent()), "▶ plays it again, from step 1");
    await v.locator(".rq-video-pic").click(); await page.waitForTimeout(400);
    ok(await page.locator(".sp-player").count() === 1 && await page.locator(".rq-video.playing").count() === 0, "a tap while it plays opens the player with the words, and it stops");
    await page.locator(".sp-player").getByRole("button", { name: /Close/ }).click(); await page.waitForTimeout(300);
    await v.getByRole("button", { name: "Watch with the words ›" }).click(); await page.waitForTimeout(300);
    ok(await page.locator(".sp-player").count() === 1, "Watch with the words opens the player too");
    await page.context().close();

    // reduce motion: it does not play by itself
    page = await open("/my-recipes/m-v", { calm: true });
    ok(await page.locator(".rq-video").count() === 1 && await page.locator(".rq-video.playing").count() === 0 && await page.locator(".rq-video .watch-play").count() === 1, "reduce motion: it rests on the cover with ▶; nothing plays by itself");
    await page.context().close();

    // a recipe with a step without its picture: the cover stays a photo
    page = await open("/my-recipes/m-p");
    ok(await page.locator(".rq-video").count() === 0 && await page.locator(".rq-hero img").count() === 1, "three pictures of four: the cover stays a photo");
    await page.context().close();

    // Recipes: ▶ in the middle of the cover of a recipe with a video, not on the other
    page = await open("/my-recipes", { width: 360 });
    const tv = page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }), tp = page.locator(".recipe-tile").filter({ hasText: "Rice and chicken" });
    ok(await tv.locator(".tile-play").count() === 1 && await tp.locator(".tile-play").count() === 0, "the tile of the recipe with a video has ▶; the other none");
    const c = await tv.locator(".recipe-tile-cover").boundingBox(), pb = await tv.locator(".tile-play").boundingBox();
    ok(c && pb && Math.abs(pb.x + pb.width / 2 - (c.x + c.width / 2)) < 2 && Math.abs(pb.y + pb.height / 2 - (c.y + c.height / 2)) < 2, "▶ sits in the middle of the cover");
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "nothing scrolls sideways at 360");
    await page.context().close();
  } finally { await b.close(); server.kill(); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  if (fail) { console.log(`${fail} failed`); process.exit(1); }
  console.log("all passed");
})();
