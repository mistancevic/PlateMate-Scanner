// DT280 (0.3.132, board Stories207; Coach Milan 11 November 07:46 to 18:12, Go): one gallery for the recipe. Every photo
// of the recipe in one row, the cover first; a step number on a step's photo. The cover is chosen in the gallery: a tap
// picks a photo, and under the row come Make it the cover, On step (or No step) and Delete this photo. 12 photos per recipe,
// steps included: when 12 are in, Add goes and the line says the gallery is full; a photo taken while cooking then stays
// with the cook. Srpski and German fit 360 px. DT283 (0.3.137): a picked photo asks Who made it?; Drawn by AI shows as an
// AI tag in the gallery, AI · Beta on the cover and on its step.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path"), zlib = require("node:zlib");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const PORT = "3496", U = `http://127.0.0.1:${PORT}`;
const crc = (b) => { let c, x = ~0; for (const y of b) { c = (x ^ y) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; x = (x >>> 8) ^ c; } return ~x >>> 0; };
const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const png = (n) => { const S = 16, row = Buffer.concat([Buffer.from([0]), Buffer.concat(Array(S).fill(Buffer.from([(n * 53) % 256, (n * 97) % 256, (n * 151) % 256])))]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(Array(S).fill(row)))), chunk("IEND", Buffer.alloc(0))]); };
const D = (n) => "data:image/png;base64," + png(n).toString("base64");
const F = (re) => seed.foods.find((f) => re.test(f.name));
const STEPS = ["Stir the skyr smooth.", "Add the oats.", "Serve."];
const base = (extra) => ({ id: "m-b", title: "Skyr bowl", items: [{ id: "b1", food: F(/^Skyr/), grams: 250, locked: false }, { id: "b2", food: F(/^Oats/), grams: 40, locked: false }], portion: 290, steps: STEPS, savedAt: "2026-11-07T22:58:00Z", ...extra });
const me = (k) => ({ by: "me", step: STEPS[k] });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (meal, width = 390, lang = "en") => {
    const ctx = await b.newContext({ viewport: { width, height: 1400 }, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: { ...seed, meals: [meal] }, lang });
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + "/my-recipes/m-b"); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  try {
    // the cover D1, a photo of the dish D2, step 1: D3 and D4, step 3: D5
    let { ctx, page } = await open(base({ photo: D(1), photos: [D(2)], stepPics: [D(3), null, D(5), D(4)], stepPicMeta: [me(0), null, me(2), me(0)] }));
    const m = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals[0]);
    const own = async () => { const x = await m(); return x.photoSigs ? x.photoSigs.filter(Boolean).length : [x.photo, ...(x.photos || [])].filter(Boolean).length; };
    const onStep = async (k) => { const x = await m(), list = x.stepPics || x.stepPicSigs || []; return (x.stepPicMeta || []).filter((y, n) => y && y.step === x.steps[k] && list[n]).length; };
    const thumbs = page.locator(".rq-thumbs .rq-thumb");
    const srcs = () => thumbs.locator("img").evaluateAll((a) => a.map((x) => x.getAttribute("src")));
    ok(await thumbs.count() === 5 && (await srcs())[0] === D(1), "one gallery: five photos, the cover first");
    ok(/Cover/.test(await thumbs.nth(0).textContent()) && (await page.locator(".rq-step-tag").allTextContents()).join() === "1,1,3", "the cover says Cover; the step photos carry 1, 1 and 3; the dish photos carry none");
    ok(/^Photos: 5 of 12\. The first is the cover\. A number shows the step a photo is on\. Tap a photo to change it\.$/.test(await page.locator(".rq-hint").textContent()), "the line under it: Photos: 5 of 12, the first is the cover");
    ok(await page.locator(".rq-on-steps").count() === 0 && await page.locator(".rq-del, .rq-move").count() === 0, "no second row On the steps, no × and no ‹ › on the photos");
    // the cover picked: it says so; no Make it the cover
    await thumbs.nth(0).locator("button").click(); await page.waitForTimeout(200);
    const pick = page.locator(".rq-gal-pick");
    ok(/This photo is the cover\./.test(await pick.textContent()) && await pick.getByRole("button", { name: "Make it the cover" }).count() === 0, "the cover picked: This photo is the cover, no Make it the cover");
    // a step photo picked: Make it the cover, On step with its step on, Delete
    await thumbs.nth(3).locator("button").click(); await page.waitForTimeout(200);
    const s4 = (await srcs())[3];
    ok(await pick.getByRole("button", { name: "Make it the cover" }).count() === 1 && await pick.getByRole("button", { name: "Step 1" }).getAttribute("aria-pressed") === "true" && /Delete this photo/.test(await pick.textContent()), "a step photo picked: Make it the cover, On step with step 1 on, Delete this photo");
    ok(await page.locator(".rq-hero img").getAttribute("src") === s4, "the picked photo shows large");
    ok(await pick.locator("button").evaluateAll((a) => a.every((x) => x.getBoundingClientRect().height >= 44 && x.getBoundingClientRect().width >= 44)), "every choice is 44 px or more");
    await pick.getByRole("button", { name: "Make it the cover" }).click(); await page.waitForTimeout(500);
    ok((await srcs())[0] === s4 && /Cover/.test(await thumbs.nth(0).textContent()) && (await page.locator(".rq-step-tag").first().textContent()) === "1", "Make it the cover: it is first, says Cover, and keeps its step number");
    ok(await thumbs.count() === 5 && await onStep(0) === 2 && await own() === 3, "it stays on its step; the gallery shows it once (five photos); the old cover is the second");
    ok(await page.locator(".rq-gal-pick").count() === 0 && await page.locator(".rq-hero img").getAttribute("src") === s4, "the choices close; the cover shows large");
    // the dish photo D2 on step 2: it leaves the recipe's own photos
    const i2 = (await srcs()).indexOf(D(2));
    await thumbs.nth(i2).locator("button").click(); await page.waitForTimeout(200);
    ok(await pick.getByRole("button", { name: "No step" }).getAttribute("aria-pressed") === "true", "a photo of the dish: No step is on");
    await pick.getByRole("button", { name: "Step 2" }).click(); await page.waitForTimeout(500);
    ok(await onStep(1) === 1 && await own() === 2 && await thumbs.count() === 5 && (await page.locator(".rq-step-tag").allTextContents()).sort().join() === "1,1,2,3", "On step 2: it is on step 2 and out of the dish photos; still five photos");
    ok(await page.locator(".rq-steps .rp-steps li").nth(1).locator(".rq-step-wide img").count() === 1, "step 2 shows it on the page");
    // No step: back among the dish photos
    await pick.getByRole("button", { name: "No step" }).click(); await page.waitForTimeout(500);
    ok(await onStep(1) === 0 && await own() === 3, "No step: off step 2, a photo of the dish again");
    // a tap on a step's photo lower on the page picks it in the gallery
    const step3 = await page.locator(".rq-steps .rp-steps li").nth(2).locator(".rq-step-wide-pic img").getAttribute("src");
    await page.locator(".rq-steps .rp-steps li").nth(2).locator(".rq-step-wide-pic").click(); await page.waitForTimeout(500);
    ok(await page.locator(".rq-thumbs .publish-photo.on img").getAttribute("src") === step3 && await pick.getByRole("button", { name: "Step 3" }).getAttribute("aria-pressed") === "true", "a tap on step 3's photo picks it in the gallery");
    // Delete this photo, Sure? first
    await pick.locator(".rq-gal-del").click(); await page.waitForTimeout(200);
    ok(await onStep(2) === 1, "Delete this photo asks Sure? first");
    await pick.locator(".rq-gal-del").click(); await page.waitForTimeout(500);
    ok(await onStep(2) === 0 && await thumbs.count() === 4 && /Photos: 4 of 12/.test(await page.locator(".rq-hint").textContent()), "the second tap deletes it: Photos: 4 of 12");
    await ctx.close();
    // ---- a full gallery: 12 photos ----
    const pics = Array.from({ length: 8 }, (_, i) => D(20 + i)), stepPics = [D(40), D(41), null, D(42), D(43)], stepPicMeta = [me(0), me(1), null, me(0), me(1)];
    ({ ctx, page } = await open(base({ photo: pics[0], photos: pics.slice(1), stepPics, stepPicMeta })));
    ok(await page.locator(".rq-thumbs .rq-thumb").count() === 12 && await page.locator(".rq-thumbs .rph-add").count() === 0, "12 photos: no Add in the gallery");
    ok(/^Photos: 12 of 12, the gallery is full\. Delete one to add another\.$/.test(await page.locator(".rq-hint").textContent()) && await page.getByRole("button", { name: "Add photos to the steps" }).isDisabled(), "the line says the gallery is full; Add photos to the steps is off");
    // a photo taken while cooking stays with the cook
    await page.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(1300);
    const cm = page.locator(".cook-mode"); await cm.waitFor({ timeout: 8000 });
    for (const n of ["Buttons only", "Step 1 ›"]) { const x = cm.getByRole("button", { name: n, exact: true }); if (await x.count()) { await x.click(); await page.waitForTimeout(300); } }
    await cm.getByRole("button", { name: /Close/ }).click(); await page.waitForTimeout(600);
    await page.locator(".mk-step").nth(2).locator(".mk-photo.empty").click(); await page.locator(".pp-camera input").setInputFiles({ name: "s.png", mimeType: "image/png", buffer: png(90) }); await page.waitForTimeout(900);
    const x = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals[0]);
    ok(!(x.stepPicMeta || []).some((y) => y && y.step === "Serve.") && await page.locator(".mk-step").nth(2).locator(".mk-pic").count() === 1, "a full gallery: a photo taken while cooking shows on its step in Make, and stays with the cook");
    await ctx.close();
    // ---- DT283 (0.3.137, board Stories210): Who made it?, chosen in the gallery ----
    ({ ctx, page } = await open(base({ photo: D(1), photos: [D(2)], stepPics: [D(3), null, null], stepPicMeta: [me(0), null, null] })));
    const gp = page.locator(".rq-gal-pick"), tags = page.locator(".rq-thumbs .rq-ai-tag");
    await page.locator(".rq-thumbs .rq-thumb").nth(1).locator("button").click(); await page.waitForTimeout(300);
    ok(await gp.getByText("Who made it?").count() === 1 && await gp.getByRole("button", { name: "My photo" }).getAttribute("aria-pressed") === "true" && await tags.count() === 0, "a picked photo asks Who made it?; My photo is chosen; no AI tags");
    await gp.getByRole("button", { name: "Drawn by AI" }).click(); await page.waitForTimeout(500);
    ok(await gp.getByRole("button", { name: "Drawn by AI" }).getAttribute("aria-pressed") === "true" && await page.locator(".rq-thumbs .rq-thumb").nth(1).locator(".rq-ai-tag").textContent() === "AI", "Drawn by AI: the photo carries the AI tag in the gallery");
    let mm = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals[0]);
    ok(Array.isArray(mm.photoAi) && mm.photoAi.length === 1, "the recipe keeps which own photo was drawn by AI");
    await gp.getByRole("button", { name: "Make it the cover" }).click(); await page.waitForTimeout(500);
    ok(/AI · Beta/.test(await page.locator(".rq-hero").first().textContent()), "as the cover, the big photo says AI · Beta");
    await page.reload(); await page.waitForTimeout(1500);
    ok(await page.locator(".rq-thumbs .rq-thumb").nth(0).locator(".rq-ai-tag").count() === 1, "opened again: still marked");
    // a step photo: marked on its step, where cook mode reads it
    await page.locator(".rq-thumbs .rq-thumb").nth(2).locator("button").click(); await page.waitForTimeout(300);
    await gp.getByRole("button", { name: "Drawn by AI" }).click(); await page.waitForTimeout(500);
    mm = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals[0]);
    ok(mm.stepPicMeta[0].by === "ai" && /AI · Beta/.test(await page.locator(".rq-steps .rp-steps li").nth(0).textContent()), "a step photo marked Drawn by AI: its step says AI · Beta");
    await gp.getByRole("button", { name: "My photo" }).click(); await page.waitForTimeout(500);
    mm = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals[0]);
    ok(mm.stepPicMeta[0].by === "me" && await tags.count() === 1, "back to My photo: the mark goes");
    await ctx.close();
    // ---- Srpski and German, the choices open ----
    for (const [lang, width] of [["sr-Latn", 390], ["de", 360]]) {
      ({ ctx, page } = await open(base({ photo: D(1), photos: [D(2)], stepPics: [D(3), null, D(5)], stepPicMeta: [me(0), null, me(2)] }), width, lang));
      await page.locator(".rq-thumbs .rq-thumb").nth(2).locator("button").click(); await page.waitForTimeout(300);
      const t = await page.locator(".rq-gal-pick").textContent() + (await page.locator(".rq-hint").textContent());
      ok(!/Make it the cover|On step|No step|Delete this photo|Who made it|My photo|Drawn by AI|Photos: \d/.test(t) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${lang}: the gallery and its choices in the language, fit ${width} px: ` + t.slice(0, 80));
      if (process.env.SHOT && lang === "de") await page.screenshot({ path: process.env.SHOT });
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
