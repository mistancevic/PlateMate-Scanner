// /built and the scroll fix (0.2.5+r9, canvas board B, 12 October 2026; BP1, 0.3.51, board Stories160): How Chef Mealan is built opens for anyone; the
// blueprint answers a tap and walks a craving; the Worth Building loops (B8: PlateMate, Chef Mealan's six cards, loop 3 with the preview step); the books with
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
  for (const [w, h, tag] of [[1200, 900, "desktop"], [390, 844, "phone"], [360, 780, "small phone"], [900, 900, "tablet"]]) {
    const page = await b.newPage({ viewport: { width: w, height: h } });
    const errs = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.goto("http://127.0.0.1:3197/built"); await page.waitForSelector(".bt h1");
    const F = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../src/builtFacts.json"), "utf8"));
    ok(/One product manager, one AI, three beta testers/.test(await page.locator(".bt h1").textContent()), `${tag}: BP1, /built opens without signing in, the title names no month`);
    ok(/a senior product manager with 20 years/.test(await page.locator(".bt-lead").textContent()), `${tag}: BP1, the lead names the product role first`);
    const facts = (await page.locator(".bt-facts").innerText()).replace(/\s+/g, " ");
    ok(new RegExp(`Live since 30 September 2026, version ${F.version.replace(/\./g, "\\.")} today`).test(facts) && facts.includes(`${F.releases} releases`) && facts.includes(`about ${F.perDay} a day`) && facts.includes(`${F.unitTests} · ${F.walkthroughs}`) && facts.includes(`${F.evalCases} eval cases`) && /3 beta testers one of them a coach/.test(facts), `${tag}: BP1, the five facts come from builtFacts.json: ${facts}`);
    // the two buttons stand apart; See it work opens the video in place
    const [t1, t2] = await page.locator(".bt-actions").first().locator(".bt-btn").evaluateAll((bs) => bs.map((x) => x.getBoundingClientRect()));
    ok(t1 && t2 && (t2.top >= t1.bottom + 8 || t2.left >= t1.right + 8) && t1.height >= 44 && t2.height >= 44, `${tag}: BP1, the two buttons have room between them, 44 px tall`);
    await page.getByRole("button", { name: "See it work", exact: true }).click();
    ok(await page.locator(".bt-video video").count() === 1 && /see-it-work\.mp4/.test(await page.locator(".bt-video video").evaluate((v) => v.currentSrc || v.querySelector("source")?.src || v.src)), `${tag}: BP1 v5, See it work (no timing in the label) opens the new video in place`);
    // the system: every box holds its words; on a phone the parts stand in a column with the server's four neighbours
    const over = await page.evaluate(() => [...document.querySelectorAll(".bt-gnode")].filter((n) => n.scrollHeight > n.clientHeight + 1 || n.scrollWidth > n.clientWidth + 1).length);
    ok(over === 0 && await page.locator(".bt-gnode").count() >= 8, `${tag}: BP1, the system's eight parts each hold their words (${over} overflow)`);
    if (w < 680) ok(await page.locator(".bt-graph-col").count() === 1 && await page.locator(".bt-graph-side .bt-gnode").count() === 5, `${tag}: BP1, on a phone the system stands in a column`);
    else {
      const outside = await page.evaluate(() => { const d = document.querySelector(".bt-graph").getBoundingClientRect(); return [...document.querySelectorAll(".bt-gnode")].filter((n) => { const x = n.getBoundingClientRect(); return x.right > d.right + 0.5 || x.bottom > d.bottom + 0.5; }).length; });
      ok(outside === 0, `${tag}: BP1, the graph is scaled to its box (${outside} outside)`);
    }
    const tags = await page.locator(".bt-tags .bt-tagpill").evaluateAll((xs) => xs.map((x) => Math.round(x.getBoundingClientRect().top)));
    ok(tags.length === 4 && new Set(tags).size === 1, `${tag}: BP1, Code, Rules, LLM, Human in one row`);
    // one path, its steps one under the other
    const steps = await page.locator(".bt-path .bt-step").evaluateAll((xs) => xs.map((x) => x.getBoundingClientRect().top));
    ok(steps.length === 7 && steps.every((t, i) => i === 0 || t > steps[i - 1]), `${tag}: BP1, Photo of my meal in seven steps, one below the other`);
    ok(/Preview, then promote to production/.test(await page.locator(".bt-flow").textContent()), `${tag}: BP1, how a change is made ends on production`);
    const pics = await page.locator(".bt-thumbs img").evaluateAll((is) => Promise.all(is.map((i) => { i.loading = "eager"; return new Promise((r) => { if (i.complete && i.naturalWidth) return r(i.naturalWidth); i.onload = () => r(i.naturalWidth); setTimeout(() => r(i.naturalWidth), 5000); }); })));
    ok(pics.length === 3 && pics.every((x) => x > 0), `${tag}: BP1, the three boards load as pictures`);
    ok(new RegExp(`Unit tests ${F.unitTests}`).test((await page.locator(".bt-checks").innerText()).replace(/\s+/g, " ")), `${tag}: BP1, how we know it works, with the counted numbers`);
    // the playbook in loops, folded (B8 inside): loop 1 PlateMate, loop 2's six cards, loop 3
    ok(!(await page.locator(".bt-wb").isVisible()), `${tag}: BP1, the loops start folded`);
    await page.locator(".bt-loops summary").click();
    const loops = await page.locator(".bt-loop h3").allTextContents();
    ok(/^Loop 1: PlateMate/.test(loops[0] ?? "") && /^Loop 3: training/.test(loops[1] ?? "") && /Product Faculty/.test(await page.locator(".bt-loop").first().textContent()), `${tag}: B8, loop 1 is PlateMate, the Product Faculty capstone, then loop 3`);
    const wb = await page.locator(".bt-wb li > b").allTextContents();
    ok(wb.join(",") === "Direction,Discovery,Design,Develop,Deploy,Delta", `${tag}: B8, loop 2 has the six Worth Building decisions: ${wb.join(", ")}`);
    const card = page.locator(".bt-wb li").last();
    ok(/The question/i.test(await card.textContent()) && /Record: notes from the testers/.test(await card.textContent()) && /Mixed:/.test(await card.textContent()) && /Carried forward/i.test(await card.textContent()), `${tag}: B8, each card has the question, the record, the decision, the verdict and what was carried forward`);
    ok(/Loop 4, now:/.test(await page.locator(".bt-sub", { hasText: "Loop 4" }).textContent()), `${tag}: BP1, loop 4 is named, now`);
    ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, `${tag}: the page is never wider than the screen, the loops open`);
    // books: the cover loads; the notify button stays inside its box; the button waits for an email
    await page.locator(".bt-book img").scrollIntoViewIfNeeded();
    const img = await page.locator(".bt-book img").evaluate((i) => new Promise((r) => { if (i.complete && i.naturalWidth) return r(i.naturalWidth); i.onload = () => r(i.naturalWidth); setTimeout(() => r(i.naturalWidth), 5000); }));
    ok(img > 0, `${tag}: B6, the Worth Building cover loads`);
    const inside = await page.evaluate(() => { const n = document.querySelector(".bt-notify").getBoundingClientRect(), bt = document.querySelector(".bt-notify .bt-btn").getBoundingClientRect(); return bt.right <= n.right && bt.left >= n.left && document.documentElement.scrollWidth <= innerWidth; });
    ok(inside, `${tag}: B6, Notify me sits inside its box, and the page has no sideways scroll`);
    ok(await page.locator(".bt-notify .bt-btn").isDisabled(), `${tag}: Notify me waits for an email`);
    const mail = page.getByRole("link", { name: "Email Milan" });
    ok(await mail.getAttribute("href") === "mailto:hello@chefmealan.com?subject=About%20Chef%20Mealan%20and%20building%20with%20AI" && await page.getByRole("link", { name: "Connect on LinkedIn" }).count() === 1, `${tag}: BP1, Email Milan with the subject, and Connect on LinkedIn`);
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
