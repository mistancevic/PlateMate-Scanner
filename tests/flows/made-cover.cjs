// JOURNEY INVARIANT (DT84 and DT85, Milan 23 October 20:58, 24 October 00:46 and 09:44, from Tester 3's call): after a meal is
// made from a recipe, the recipe page shows the recipe first: the photo, then the Made today card under it. The photo taken
// while making it becomes the cover of a recipe with no photo of its own (no cover, or one Chef Mealan drew), with a line that
// says so, Change the cover, and Remove it behind a second tap. A cover of your own stays. Share with the coach sits in the
// Made today line only for a person with a coach. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const PHOTO = fs.readFileSync(path.resolve(__dirname, "front.jpg"));
const f = (n) => seed.foods.find((x) => x.name === n);
seed.items = []; seed.feedback = [];
const bowl = (id, title, extra = {}) => ({ id, title, savedAt: "2026-10-20T08:00:00Z", portion: 400, items: [["Chicken breast, cooked", 150], ["Rice, cooked", 200], ["Greek yogurt 2%", 50]].map(([n, g], i) => ({ id: id + i, food: f(n), grams: g, locked: true })), steps: ["Warm the chicken and the rice.", "Top with the yogurt."], ...extra });
const own = "data:image/jpeg;base64," + fs.readFileSync(path.resolve(__dirname, "front.jpg")).toString("base64");
seed.meals = [bowl("bowl", "Chicken rice bowl"), bowl("mine", "Rice bowl with a cover", { photo: own })];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3249", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); sessionStorage.setItem("seeded", "1"); } localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const make = async (title) => {
    await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(600);
    await page.getByText(title, { exact: true }).last().click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: /^(Make it|Change it first)$/ }).first().click(); await page.waitForTimeout(900);
    await page.getByRole("button", { name: /^(Keep it as it is|Make it as it is|Lock the recipe)$/ }).first().click(); await page.waitForTimeout(800);
    await page.getByRole("button", { name: /^(I'm making it|Lock the recipe)$/ }).click(); await page.waitForTimeout(500);
    await page.locator("label.plate-photo").filter({ hasText: "Take a photo" }).locator("input").setInputFiles([{ name: "plate.jpg", mimeType: "image/jpeg", buffer: PHOTO }]); await page.waitForTimeout(900);
    await page.getByRole("button", { name: /^(On to How was it\?|Rate it)$/ }).click(); await page.waitForTimeout(500);
    await page.getByRole("button", { name: "DaaM good" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(1200);
  };
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3249/"); await page.waitForTimeout(900);
    await make("Chicken rice bowl");
    let s = await st(); const m = s.meals.find((x) => x.id === "bowl"), card = s.feedback[0];
    const has = (r) => Boolean(r.photo || (r.photoSigs ?? []).some(Boolean));
    ok(has(m) && card.coverAsk === "used", "the photo from making it is the cover of a recipe with none: " + JSON.stringify({ photo: !!m.photo, sigs: m.photoSigs, ask: card.coverAsk }));
    ok(await page.locator(".rq-hero img").count() === 1 && await page.locator(".rq-hero-empty").count() === 0, "the page shows it as the cover");
    ok(/Your photo from today is the cover\. When you share with members, you choose which photo they see\./.test(await page.locator("main").textContent()), "a line says so");
    const order = await page.evaluate(() => { const h = document.querySelector(".rq-hero"), l = document.querySelector(".rq-landed"); return h && l ? Boolean(h.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING) : null; });
    ok(order === true, "the Made today card sits under the photo, not between the title and the photo");
    ok(/Made today/.test(await page.locator(".rq-landed").textContent()) && await page.locator(".rq-share-link").count() === 0, "no share without a coach");
    await page.getByRole("button", { name: "Remove the cover" }).click(); await page.waitForTimeout(200);
    ok(has((await st()).meals.find((x) => x.id === "bowl")) && await page.locator(".rq-hero img").count() === 1, "Remove it waits for a second tap");
    await page.getByRole("button", { name: "Remove the cover" }).click(); await page.waitForTimeout(500);
    ok(!has((await st()).meals.find((x) => x.id === "bowl")) && await page.locator(".rq-hero-empty").count() === 1, "the second tap removes it");
    await make("Rice bowl with a cover");
    s = await st();
    ok(await page.evaluate(() => document.querySelector(".rq-hero img")?.getAttribute("src")?.length) > 0 && s.feedback[0].coverAsk !== "used", "a cover of your own stays: the card did not take it");
    ok(/Your photo from today is the cover/.test(await page.locator("main").textContent()) === false, "and no line says otherwise");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
