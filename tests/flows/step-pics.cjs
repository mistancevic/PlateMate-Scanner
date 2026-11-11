// DT276 (board Stories205; Coach Milan 10 November 21:24 to 22:37, Go). Step 1 (0.3.127): a step's picture is the recipe's and
// every place shows it: the recipe page, cook mode and Make's tick list. Step 2 (0.3.129): a step can have two or more
// pictures. A new photo is added next to the others, nothing is replaced, nothing is asked; the first is the one the recipe
// page shows; a picture can be made the first or taken off the step; the step pictures show among the recipe's photos.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.feedback = []; seed.items = [];
const PORT = "3497", U = `http://127.0.0.1:${PORT}`;
const PHOTO = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "tests/flows/plate.jpg")).toString("base64");
const FRONT = "data:image/jpeg;base64," + fs.readFileSync(path.join(ROOT, "tests/flows/front.jpg")).toString("base64");
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const F = (re) => seed.foods.find((f) => re.test(f.name));
const STEPS = ["Stir the skyr smooth.", "Add the oats.", "Serve."];
seed.meals = [{ id: "m-b", title: "Skyr bowl", items: [{ id: "b1", food: F(/^Skyr/), grams: 250, locked: false }, { id: "b2", food: F(/^Oats/), grams: 40, locked: false }], portion: 290, steps: STEPS, savedAt: "2026-11-07T22:58:00Z", stepPics: [PHOTO, null, null, FRONT], stepPicMeta: [{ by: "me", step: STEPS[0] }, null, null, { by: "me", step: STEPS[0] }] }];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
    const picsOf = async (k) => { const m = (await st()).meals.find((x) => x.id === "m-b"); const list = m.stepPics || m.stepPicSigs || []; return (m.stepPicMeta || []).map((x, n) => (x && x.step === m.steps[k] && list[n] ? list[n] : null)).filter(Boolean); };
    // the saved copy names the pictures by their fingerprints once they are stored as files
    const slots = async () => { const m = (await st()).meals.find((x) => x.id === "m-b"); return m.stepPics || m.stepPicSigs || []; };
    await page.goto(U + "/my-recipes/m-b"); await page.waitForTimeout(1500);
    // ---- the recipe page ----
    ok(await page.locator(".rq-steps .rq-step-wide img").count() === 1 && /1 of 2/.test(await page.locator(".rq-step-wide-next").textContent()), "the recipe page shows step 1's first picture, and 1 of 2");
    // DT281 (0.3.131): photo first. The number at the top left, the photo wide to its right, the words under the photo
    const lay = await page.evaluate(() => { const li = document.querySelector(".rq-steps .rp-steps li"), num = li.querySelector(":scope > span"), pic = li.querySelector(".rq-step-wide-pic"), txt = li.querySelector(".rp-step-text"); const n = num.getBoundingClientRect(), a = pic.getBoundingClientRect(), t = txt.getBoundingClientRect(); return { numLeft: n.right <= a.left, top: Math.abs(n.top - a.top) < 6, under: t.top >= a.bottom - 1, wide: a.width > 250, noPic: document.querySelectorAll(".rq-steps .rp-steps li")[2].querySelector(".rq-step-wide") === null }; });
    ok(lay.numLeft && lay.top && lay.under && lay.wide && lay.noPic, "DT281: the number at the top left, the photo wide beside it, the words under it; a step with no photo has none: " + JSON.stringify(lay));
    await page.locator(".rq-step-wide-next").click(); await page.waitForTimeout(200);
    ok(/2 of 2/.test(await page.locator(".rq-step-wide-next").textContent()), "DT281: 1 of 2 shows the second");
    ok(await page.locator(".rq-on-steps button").count() === 2 && /On the steps/.test(await page.locator(".rq-on-steps").textContent()), "the two step pictures show among the recipe's photos, On the steps");
    // ---- cook mode: one after another ----
    await page.locator(".rq-steps").getByRole("button", { name: "Start cooking", exact: true }).click(); await page.waitForTimeout(1300);
    const cm = page.locator(".cook-mode"); await cm.waitFor({ timeout: 8000 });
    for (const n of ["Buttons only", "Step 1 ›"]) { const x = cm.getByRole("button", { name: n, exact: true }); if (await x.count()) { await x.click(); await page.waitForTimeout(300); } }
    const inCook = await cm.locator("img.cook-pic").getAttribute("src").catch(() => null);
    ok(!!inCook && /1 of 2/.test(await cm.locator(".cook-pic-next").textContent()), "cook mode shows step 1's first picture, 1 of 2");
    await cm.locator(".cook-pic-next").click(); await page.waitForTimeout(300);
    const second = await cm.locator("img.cook-pic").getAttribute("src");
    ok(second !== inCook && /2 of 2/.test(await cm.locator(".cook-pic-next").textContent()), "a tap shows the second, 2 of 2");
    ok(await cm.getByRole("button", { name: "Add another photo" }).count() === 1 && await cm.getByRole("button", { name: "Take it again" }).count() === 0, "the link says Add another photo, not Take it again");
    await cm.getByRole("button", { name: /Close/ }).click(); await page.waitForTimeout(600);
    // ---- Make's tick list ----
    const rows = page.locator(".mk-step");
    ok(await rows.count() === 3, "Make lists the three steps");
    ok(await rows.nth(0).locator(".mk-pic").count() === 2 && await rows.nth(0).locator(".mk-pic img").first().getAttribute("src") === inCook, "Make's tick list shows both pictures of step 1, the same first one");
    ok(await rows.nth(0).locator(".mk-photo.empty").count() === 1, "step 1 still has + Photo for one more");
    // DT281 (0.3.131): in Make the photos and + Photo sit above the words, on every step; the tick at the top left
    const mk = await rows.evaluateAll((a) => a.map((st) => { const pics = st.querySelector(".mk-pics").getBoundingClientRect(), add = st.querySelector(".mk-photo.empty").getBoundingClientRect(), words = st.querySelector(".mk-check > span:last-child").getBoundingClientRect(), box = st.querySelector(".mk-box").getBoundingClientRect();
      return add.bottom <= words.top && pics.bottom <= words.top + 1 && box.right <= pics.left && box.top >= pics.top && box.bottom <= pics.top + 48 && add.height >= 44 && Math.abs(words.left - pics.left) < 4; }));
    ok(mk.every(Boolean), "DT281: on every step the photos and + Photo sit above the words, aligned with them; the tick at the top left beside the photos: " + mk.join());
    ok(await rows.nth(1).locator(".mk-photo.empty").count() === 1 && await rows.nth(1).locator(".mk-pic").count() === 0 && await rows.nth(2).locator(".mk-pic").count() === 0, "steps 2 and 3 have no picture and say + Photo");
    // a third photo on step 1: added, nothing replaced, nothing asked
    const before = await picsOf(0);
    await rows.nth(0).locator(".mk-photo.empty").click(); await page.locator(".pp-camera input").setInputFiles({ name: "s.png", mimeType: "image/png", buffer: PNG }); await page.waitForTimeout(900);
    let now = await picsOf(0);
    ok(now.length === 3 && now[0] === before[0] && now[1] === before[1] && await rows.nth(0).locator(".mk-pic").count() === 3, "a new photo on a pictured step is the third; the two stay");
    ok(await page.locator(".plate-ask, .pic-ask, [role=dialog]").count() === 0, "nothing is asked");
    // a photo on step 2, which had none: its first, at its own place
    await rows.nth(1).locator(".mk-photo.empty").click(); await page.locator(".pp-camera input").setInputFiles({ name: "s.png", mimeType: "image/png", buffer: PNG }); await page.waitForTimeout(900);
    const m2 = (await st()).meals[0];
    ok(!!(await slots())[1] && m2.stepPicMeta[1].step === STEPS[1] && await rows.nth(1).locator(".mk-pic").count() === 1, "the first photo of step 2 sits at step 2's place");
    // a tap shows it large: make it first
    await rows.nth(0).locator(".mk-pic").nth(2).click(); await page.waitForTimeout(300);
    const open = rows.nth(0).locator(".mk-pic-open");
    ok(await open.count() === 1 && await open.getByRole("button", { name: "Make it first" }).count() === 1 && /The first photo is the one the recipe page and Watch the steps show\./.test(await open.textContent()), "a tap on the third shows it large, with Make it first and why");
    ok(await open.locator("button").evaluateAll((a) => a.every((b) => b.getBoundingClientRect().height >= 44)), "its buttons are 44 px or more");
    await open.getByRole("button", { name: "Make it first" }).click(); await page.waitForTimeout(400);
    const firsted = await picsOf(0);
    ok(firsted.length === 3 && firsted[0] === now[2] && firsted.includes(now[0]) && await page.locator(".mk-pic-open").count() === 0, "it is the first now; the old first is still on the step");
    // the first has no Make it first; Remove from this step takes it off, the next is the first
    await rows.nth(0).locator(".mk-pic").first().click(); await page.waitForTimeout(300);
    ok(await page.locator(".mk-pic-open").getByRole("button", { name: "Make it first" }).count() === 0, "the first picture has no Make it first");
    await page.locator(".mk-pic-open").getByRole("button", { name: "Remove from this step" }).click(); await page.waitForTimeout(400);
    now = await picsOf(0);
    ok(now.length === 2 && !now.includes(firsted[0]) && (await slots())[0] === now[0] && await rows.nth(0).locator(".mk-pic").count() === 2, "removed: two left, and the next one took the first place");
    await rows.nth(0).locator(".mk-pic").first().click(); await page.waitForTimeout(300);
    await page.setViewportSize({ width: 360, height: 1400 }); await page.waitForTimeout(300);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Make's list with a picture open fits 360 px");
    if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
    await page.setViewportSize({ width: 390, height: 1400 });
    // ---- the recipe page again: the sheet lists them ----
    await page.goto(U + "/my-recipes/m-b"); await page.waitForTimeout(1500);
    ok(await page.locator(".rq-on-steps button").count() === 3, "On the steps shows the three pictures (two of step 1, one of step 2)");
    await page.locator(".rq-steps .rq-step-wide-pic").first().click(); await page.waitForTimeout(400);
    const sheet = page.locator(".sp-sheet");
    ok(await sheet.locator(".sp-all button").count() === 2 && /This step's photos/.test(await sheet.textContent()), "the step's sheet lists its two photos");
    await sheet.locator(".sp-all button").nth(1).click(); await page.waitForTimeout(200);
    await sheet.getByRole("button", { name: "Make it first" }).click(); await page.waitForTimeout(400);
    const swapped = await picsOf(0);
    ok(swapped[0] === now[1] && swapped.length === 2, "Make it first from the sheet");
    await page.locator(".rq-steps .rq-step-wide-pic").first().click(); await page.waitForTimeout(400);
    await sheet.locator(".sp-all button").nth(1).click(); await page.waitForTimeout(200);
    await sheet.getByRole("button", { name: "Remove this picture" }).click(); await page.waitForTimeout(400);
    const last = await picsOf(0);
    ok(last.length === 1 && last[0] === swapped[0] && await page.locator(".rq-step-wide-next").count() === 0, "Remove this picture takes the chosen one off; the first stays, no +1");
    // ---- Srpski and German ----
    for (const l of ["sr-Latn", "de"]) {
      await page.evaluate((l) => localStorage.setItem("chefmealan-lang", l), l);
      await page.setViewportSize({ width: l === "de" ? 360 : 390, height: 1400 });
      await page.goto(U + "/my-recipes/m-b"); await page.waitForTimeout(1500);
      ok(!/On the steps/.test(await page.locator(".rq-on-steps").textContent()) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${l}: the recipe page in the language, fits the width: ` + (await page.locator(".rq-on-steps b").textContent()));
    }
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
