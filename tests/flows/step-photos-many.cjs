// DT276 step 3 (0.3.130, board Stories205; Coach Milan 10 November 21:24 to 22:37, Go): several photos at once. Add photos to
// the steps on the recipe page takes several from the phone; Photos on the steps shows each on its step, one per step from
// step 1, the rest on no step; a tap on a photo moves it. Save puts them on the steps (added, nothing replaced) and keeps the
// ones on no step in the recipe's photos. Cancel saves nothing.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path"), zlib = require("node:zlib");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const PORT = "3499", U = `http://127.0.0.1:${PORT}`;
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg")).toString("base64");
// a small picture of one colour, a different one for each n
const crc = (b) => { let c, x = ~0; for (const y of b) { c = (x ^ y) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; x = (x >>> 8) ^ c; } return ~x >>> 0; };
const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const png = (n) => { const S = 16, row = Buffer.concat([Buffer.from([0]), Buffer.concat(Array(S).fill(Buffer.from([(n * 53) % 256, (n * 97) % 256, (n * 151) % 256])))]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(Array(S).fill(row)))), chunk("IEND", Buffer.alloc(0))]); };
const files = (n, from = 1) => Array.from({ length: n }, (_, i) => ({ name: `p${from + i}.png`, mimeType: "image/png", buffer: png(from + i) }));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const STEPS = ["Stir the skyr smooth.", "Add the oats.", "Serve."];
seed.meals = [{ id: "m-b", title: "Skyr bowl", items: [{ id: "b1", food: F(/^Skyr/), grams: 250, locked: false }, { id: "b2", food: F(/^Oats/), grams: 40, locked: false }], portion: 290, steps: STEPS, savedAt: "2026-11-07T22:58:00Z", stepPics: [PHOTO, null, null], stepPicMeta: [{ by: "me", step: STEPS[0] }, null, null] }];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1500 }, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    const meal = async () => (await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")))).meals.find((x) => x.id === "m-b");
    const onStep = async (k) => { const m = await meal(), list = m.stepPics || m.stepPicSigs || []; return (m.stepPicMeta || []).filter((x, n) => x && x.step === m.steps[k] && list[n]).length; };
    const gallery = async () => { const m = await meal(); return m.photoSigs ? m.photoSigs.filter(Boolean).length : [m.photo, ...(m.photos || [])].filter(Boolean).length; };
    const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    await page.goto(U + "/my-recipes/m-b"); await page.waitForTimeout(1500);
    const add = page.locator(".rq-steps").getByRole("button", { name: "Add photos to the steps" });
    ok(await add.count() === 1 && (await add.boundingBox()).height >= 44 && /Pick several at once from your phone\. Then you place each one on its step\./.test(await page.locator(".rq-steps").textContent()), "the recipe page has Add photos to the steps under the steps, and says what it does");
    ok(await page.locator(".rq-steps input[type=file][multiple]").count() === 1, "it takes several photos at once");
    const pick = async (list) => { await page.locator(".rq-steps input[type=file][multiple]").setInputFiles(list); await page.locator(".spp").waitFor({ timeout: 8000 }); await page.waitForTimeout(300); };
    // ---- five photos, three steps ----
    await pick(files(5));
    const sheet = page.locator(".spp"), steps = sheet.locator(".spp-step");
    ok(/Photos on the steps/.test(await sheet.textContent()) && await steps.count() === 4, "Photos on the steps opens: the three steps and On no step");
    const counts = async () => Promise.all([0, 1, 2, 3].map((i) => steps.nth(i).locator(".publish-photo").count()));
    ok((await counts()).join() === "1,1,1,2" && await steps.nth(0).locator(".spp-has").count() === 1, "one new photo on each step from step 1, two on no step; step 1's own picture stays: " + (await counts()).join());
    ok(/No picture yet/.test(await steps.nth(1).textContent()) === false && /Kept in the recipe's photos\./.test(await steps.nth(3).textContent()), "On no step says they are kept in the recipe's photos");
    // a tap on a photo: Move this photo to, the steps and No step
    await steps.nth(3).locator(".publish-photo").first().click(); await page.waitForTimeout(200);
    const mv = sheet.locator(".spp-move");
    ok(await mv.count() === 1 && (await mv.locator("button").allTextContents()).join() === "1,2,3,No step" && await mv.locator("button").evaluateAll((a) => a.every((x) => x.getBoundingClientRect().height >= 44 && x.getBoundingClientRect().width >= 44)), "a tap on a photo: Move this photo to 1, 2, 3 or No step, each 44 px or more");
    await mv.getByRole("button", { name: "Step 1" }).click(); await page.waitForTimeout(200);
    ok((await counts()).join() === "2,1,1,1" && await sheet.locator(".spp-move").count() === 0, "moved to step 1: two new photos there, one left on no step");
    await steps.nth(2).locator(".publish-photo").first().click(); await sheet.locator(".spp-move").getByRole("button", { name: "No step" }).click(); await page.waitForTimeout(200);
    ok((await counts()).join() === "2,1,0,2" && /No picture yet/.test(await steps.nth(2).textContent()), "step 3's photo moved to no step; step 3 says No picture yet");
    ok(await onStep(0) === 1 && await gallery() === 0, "nothing is saved yet");
    await sheet.getByRole("button", { name: "Save the photos" }).click(); await page.waitForTimeout(900);
    ok(await page.locator(".spp").count() === 0 && await onStep(0) === 3 && await onStep(1) === 1 && await onStep(2) === 0, "Save: step 1 has three pictures (its own and two new), step 2 one, step 3 none");
    ok(await gallery() === 2, "the two on no step are in the recipe's photos: " + await gallery());
    ok(await page.locator(".rq-on-steps button").count() === 4 && /1 of 3/.test(await page.locator(".rq-step-wide-next").first().textContent()), "the recipe page shows them: four On the steps, 1 of 3 on step 1");
    // ---- Cancel saves nothing ----
    await pick(files(2, 20));
    await page.locator(".spp").getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(400);
    ok(await page.locator(".spp").count() === 0 && await onStep(0) === 3 && await onStep(1) === 1 && await gallery() === 2, "Cancel saves nothing");
    // ---- more photos than the recipe's photos have room for ----
    await pick(files(12, 40));
    ok(/The recipe's photos have no room for all of these\. Put them on a step to keep them\./.test(await page.locator(".spp .spp-step").nth(3).textContent()), "twelve picked, nine on no step, room for four: the page says so");
    // ---- Srpski and German, with the page open ----
    await page.locator(".spp").getByRole("button", { name: "Cancel" }).click();
    for (const l of ["sr-Latn", "de"]) {
      await page.evaluate((l) => localStorage.setItem("chefmealan-lang", l), l);
      await page.setViewportSize({ width: l === "de" ? 360 : 390, height: 1500 });
      await page.goto(U + "/my-recipes/m-b"); await page.waitForTimeout(1500);
      ok(!/Add photos to the steps/.test(await page.locator(".rq-steps").textContent()) && await fits(), `${l}: the recipe page in the language, fits the width`);
      await pick(files(5, 60 + (l === "de" ? 10 : 0)));
      await page.locator(".spp .spp-step").nth(3).locator(".publish-photo").first().click(); await page.waitForTimeout(200);
      const t = await page.locator(".spp").textContent();
      ok(!/Photos on the steps|Move this photo to|No step|Save the photos|Cancel|On no step|Kept in/.test(t) && await fits(), `${l}: Photos on the steps in the language, fits the width: ` + (await page.locator(".spp .spp-title").textContent()));
      if (process.env.SHOT && l === "de") await page.screenshot({ path: process.env.SHOT });
      await page.locator(".spp .link").last().click(); await page.waitForTimeout(300);
    }
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
