// DT266 (0.3.116, board Stories197; Coach Milan 8 November 16:44 to 17:09, Go): the certifications. The home page's Who's behind
// it gets a carousel of six thumbnails, one and a half in view; a tap opens the whole certificate and ‹ › move on; /about lists
// all six one under another with one line each.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const PORT = "3491", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const text = async (sel) => ((await page.locator(sel).first().innerText()) || "").replace(/\s+/g, " ").trim();
  try {
    await page.goto(U + "/?home"); await page.waitForTimeout(1200);
    ok(await page.locator(".l-behind .cert-card").count() === 6, "six certificates under Who's behind it");
    const names = await page.locator(".cert-card b").allInnerTexts();
    // DT297 (0.3.146): the AI certificates first, then nutrition and the rest
    ok(names[0] === "AI Product Management Certificate" && names[1] === "AI Mastery" && names[2] === "Certified Nutrition Coach" && names[3] === "10X Fitness Coaching Certification" && names[5] === "Certified Business Coach", "AI first, then nutrition, business last: " + names.join(" | "));
    const vis = await page.evaluate(() => { const s = document.querySelector(".cert-strip").getBoundingClientRect(); const c = [...document.querySelectorAll(".cert-card")].map((x) => x.getBoundingClientRect()); return { first: c[0].right <= s.right + 1, secondCut: c[1].left < s.right && c[1].right > s.right }; });
    ok(vis.first && vis.secondCut, "one whole and a half: the second is cut by the edge");
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "the carousel does not widen the page");
    const srcs = await page.locator(".cert-card img").evaluateAll((xs) => xs.map((x) => x.getAttribute("src")));
    ok(srcs.every((s) => /\/landing\/certs\/[a-z-]+-s\.webp$/.test(s)), "thumbnails are the small files: " + srcs[0]);
    for (const s of srcs.slice(0, 2)) { const r = await fetch(U + s); ok(r.ok, `${s} is served`); }
    // a tap opens the whole certificate
    await page.locator(".cert-card").nth(3).click(); await page.waitForTimeout(400);
    ok(await page.locator(".cert-view").count() === 1 && /10X Fitness Coaching Certification · 2023/.test(await text(".cert-view-top")), "a tap opens the whole certificate: " + await text(".cert-view-top"));
    ok(/\/landing\/certs\/fitness\.webp$/.test(await page.locator(".cert-view img").getAttribute("src")), "full size, not the thumbnail");
    ok(await text(".cert-view-nav small") === "4 of 6", "4 of 6");
    await page.locator(".cert-view-nav .link").nth(1).click(); await page.waitForTimeout(300);
    ok(/Holobody/.test(await text(".cert-view-top")), "› goes to the next");
    const small = await page.locator(".cert-view button").evaluateAll((xs) => xs.filter((x) => x.getBoundingClientRect().height > 0 && x.getBoundingClientRect().height < 44).map((x) => x.className));
    ok(small.length === 0, "buttons at least 44 px: " + small.join(", "));
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    ok(await page.locator(".cert-view").count() === 0, "Escape closes it");
    // /about
    await page.goto(U + "/about"); await page.waitForTimeout(1000);
    ok(await page.locator(".cert-list .cert-item").count() === 6, "/about lists all six");
    const biz = await page.evaluate(() => (document.querySelectorAll(".cert-item p")[5]?.textContent || "").trim());
    ok(/Coaching coaches on the business with Chef Mealan/.test(biz), "the business line: " + biz);
    const full = await page.evaluate(() => [...document.querySelectorAll(".cert-item img")].map((x) => Math.round(x.getBoundingClientRect().width)));
    ok(full.every((w) => w > 300), "full width on /about: " + full[0]);
    // in Srpski and German the names stay, the hints change
    for (const [l, hint] of [["sr-Latn", "sertifikat"], ["de", "Zertifikat"]]) {
      await page.evaluate((l) => localStorage.setItem("chefmealan-lang", l), l);
      await page.goto(U + "/?home"); await page.waitForTimeout(1000);
      const h = await page.evaluate(() => document.querySelector(".cert-hint")?.textContent || "");
      ok(new RegExp(hint, "i").test(h), `${l}: ${h}`);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${l}: no sideways scroll`);
    }
    await page.evaluate(() => localStorage.removeItem("chefmealan-lang"));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
