// /built and the scroll fix (0.2.5+r9, canvas board B, 12 October 2026): How Chef Mealan is built opens for anyone; the
// blueprint answers a tap and walks a craving; the six Worth Building decisions with Deploy's preview step; the books with
// the cover, the notify box inside its frame on a phone; the product role first. Every tab and Plate step opens at the top.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = [];
process.on("unhandledRejection", (e) => { console.log("FAIL " + (e && e.message ? e.message : e)); process.exit(1); });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3197" }, stdio: ["ignore", "pipe", "pipe"] });
  for (let i = 0; i < 60; i++) { try { await fetch("http://127.0.0.1:3197/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  for (const [w, h, tag] of [[1200, 900, "desktop"], [390, 844, "phone"]]) {
    const page = await b.newPage({ viewport: { width: w, height: h } });
    const errs = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.goto("http://127.0.0.1:3197/built"); await page.waitForSelector(".bt h1");
    ok(/A product built with AI/.test(await page.locator(".bt h1").textContent()), `${tag}: /built opens without signing in`);
    ok(/Milan Stancevic, a senior product manager and founder/.test(await page.locator(".bt-lead").textContent()), `${tag}: B1, the lead names the product role first`);
    // the blueprint: a tap on The AI fills the panel; Follow a craving walks six steps
    await page.locator(".bt-node", { hasText: "The AI" }).click();
    ok(/The AI/.test(await page.locator(".bt-panel h3").textContent()) && /calculator decides/.test(await page.locator(".bt-panel").textContent()), `${tag}: B2, a tap on The AI shows the part and the decision`);
    await page.getByRole("tab", { name: "Follow a craving" }).click();
    await page.getByRole("button", { name: "Next step" }).click();
    ok(/step 2 of 6/.test(await page.locator(".bt-panel .k").textContent()) && (await page.locator(".bt-edge.lit").count()) === 2, `${tag}: B3, step 2 lights the path to the AI`);
    // the playbook, with the preview step
    const wb = await page.locator(".bt-wb li b").allTextContents();
    ok(wb.join(",") === "Direction,Discovery,Design,Develop,Deploy,Delta", `${tag}: B7, the six Worth Building decisions: ${wb.join(", ")}`);
    ok(/Preview first, like staging/.test(await page.locator(".bt-wb .deploy").textContent()) && (await page.locator(".bt-pipe i").count()) === 4, `${tag}: B7, Deploy carries the preview step and Build, Preview, Live, Roll back`);
    // books: the cover loads; the notify button stays inside its box; the button waits for an email
    await page.locator(".bt-book img").scrollIntoViewIfNeeded();
    const img = await page.locator(".bt-book img").evaluate((i) => new Promise((r) => { if (i.complete && i.naturalWidth) return r(i.naturalWidth); i.onload = () => r(i.naturalWidth); setTimeout(() => r(i.naturalWidth), 5000); }));
    ok(img > 0, `${tag}: B6, the Worth Building cover loads`);
    const inside = await page.evaluate(() => { const n = document.querySelector(".bt-notify").getBoundingClientRect(), bt = document.querySelector(".bt-notify .bt-btn").getBoundingClientRect(); return bt.right <= n.right && bt.left >= n.left && document.documentElement.scrollWidth <= innerWidth; });
    ok(inside, `${tag}: B6, Notify me sits inside its box, and the page has no sideways scroll`);
    ok(await page.locator(".bt-notify .bt-btn").isDisabled(), `${tag}: Notify me waits for an email`);
    ok(/Product builder by day\. Fitness and nutrition coach after hours\./.test(await page.locator(".bt-role").textContent()), `${tag}: B1, Who builds opens with the product role`);
    ok(errs.length === 0, `${tag}: no page errors ${errs.join(" | ")}`);
    await page.close();
  }
  // the book sign-up refuses a missing book and a wrong email, without storing anything
  const bad = await fetch("http://127.0.0.1:3197/api/book-notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "no", books: ["worth-eating"], elapsed: 5000 }) });
  const none = await fetch("http://127.0.0.1:3197/api/book-notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "a@b.de", books: [], elapsed: 5000 }) });
  ok(bad.status === 400 && none.status === 400, `the book sign-up checks the email and the book (${bad.status}, ${none.status})`);
  const phone = await fetch("http://127.0.0.1:3197/api/access-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Test", email: "t@test.de", phone: "call me", elapsed: 5000 }) });
  ok(phone.status === 400, `HP12: a request with a wrong mobile number is refused (${phone.status})`);
  // every tab and every Plate step opens at the top
  const page = await b.newPage({ viewport: { width: 390, height: 700 } });
  await page.addInitScript((s) => {
    if (!localStorage.getItem("seeded")) {
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { meals: 3 } }));
      localStorage.setItem("seeded", "1");
    }
  }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3197/today"); await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 400)); await page.waitForTimeout(200);
  const before = await page.evaluate(() => scrollY);
  await page.getByRole("button", { name: /^Plan$/ }).click(); await page.waitForTimeout(400);
  ok(before > 0 && (await page.evaluate(() => scrollY)) === 0, `a tab opens at the top (Today was at ${before}, Plan at ${await page.evaluate(() => scrollY)})`);
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.getByRole("button", { name: /^Today$/ }).click(); await page.waitForTimeout(400);
  ok((await page.evaluate(() => scrollY)) === 0, "back on Today, Today opens at the top");
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed");
  process.exit(fail ? 1 : 0);
})();
