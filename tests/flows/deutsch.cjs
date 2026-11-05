// DT238 (0.3.92, board Stories179; Coach Milan 5 November 11:36, Go): Deutsch (Beta). Settings, Language has three choices;
// Deutsch is kept on this phone, the page says lang="de", the app's calls say de, and the screens are in German. German words
// are long, so the layout gets four fixes in German only: Today's buttons wrap into rows and stay on one line each, the Plate's
// Fit and Prepare go one under the other, a wide button takes two lines, and on a 360 px phone the goal line goes under a long
// title. No button's words are cut. English does not move.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.feedback = [];
const PORT = "3399", U = `http://127.0.0.1:${PORT}`;
// a button whose words run past its own edge
const cut = () => [...document.querySelectorAll("button, .pill")].filter((e) => { const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).display === "none") return false;
  if (e.scrollWidth > e.clientWidth + 1) return true; for (const c of e.querySelectorAll("*")) { const q = c.getBoundingClientRect(); if (q.width && q.right > r.right + 1) return true; } return false; }).map((e) => e.textContent.trim()).filter(Boolean);
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (width, lang) => {
    const ctx = await b.newContext({ viewport: { width, height: 844 }, locale: "de-DE", timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript(({ s, lang }) => { if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1"); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); if (lang) localStorage.setItem("chefmealan-lang", lang); }, { s: seed, lang });
    await require("./adult.cjs")(page);
    return page;
  };
  try {
    // pick Deutsch in Settings, Language
    let page = await open(390, null);
    const heard = []; page.on("request", (r) => { if (r.url().includes("/api/version")) heard.push(r.headers()["x-chef-lang"] || ""); });
    await page.goto(U + "/today"); await page.waitForTimeout(1000);
    ok(await page.evaluate(() => document.documentElement.lang) === "en", "in English the page says lang=en");
    await page.locator("header .menu-button").click(); await page.waitForTimeout(400);
    await page.locator(".menu-row").filter({ hasText: "Settings" }).first().click(); await page.waitForTimeout(300);
    await page.locator("button.menu-row").filter({ hasText: "Language" }).click(); await page.waitForTimeout(300);
    const de = page.locator(".lang-row").filter({ hasText: "Deutsch (Beta)" });
    ok(await de.count() === 1, "Deutsch (Beta) is a choice");
    await de.click(); await page.waitForTimeout(400);
    ok(await page.evaluate(() => localStorage.getItem("chefmealan-lang")) === "de", "Deutsch is kept on this phone");
    ok(await page.evaluate(() => document.documentElement.lang) === "de", "the page says lang=de");
    ok(/Sprache|Deutsch \(Beta\)/.test(await page.locator("main").textContent()), "the Language page is in German");
    await page.evaluate(() => fetch("/api/version")); await page.waitForTimeout(300);
    ok(heard[heard.length - 1] === "de", "the app's calls say de, so Chef Mealan answers in German");
    // Today in German: the three buttons, each on one line, the main one alone on its row
    await page.goto(U + "/today"); await page.waitForTimeout(1200);
    ok(/Heute/.test(await page.locator("nav, .bottom-nav").first().textContent()), "the bar is in German: Heute");
    const acts = page.locator(".next-planned-acts .pill");
    if (await acts.count() === 3) {
      const r = await acts.evaluateAll((es) => es.map((e) => { const q = e.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(e); const tops = new Set([...rg.getClientRects()].filter((x) => x.width > 1).map((x) => Math.round(x.top))); return { top: Math.round(q.top), w: Math.round(q.width), lines: tops.size, t: e.textContent.trim() }; }));
      ok(r.every((x) => x.lines === 1), "each Today button stays on one line: " + r.map((x) => `${x.t} (${x.lines})`).join(", "));
      ok(r[0].top < r[1].top && r[1].top === r[2].top, "the main button takes its own row, the other two share the next");
      ok(/Mittagessen|Frühstück|Abendessen|Snack/.test(r[0].t), "the meal keeps its capital: " + r[0].t);
    } else ok(false, "Today shows the three buttons of an empty day");
    ok((await page.evaluate(cut)).length === 0, "no button is cut on Today");
    // the Plate: Fit and Prepare, never cut
    await page.goto(U + "/plate"); await page.waitForTimeout(1200);
    const fit = page.locator(".ways-out .pill-wide");
    if (await fit.count() >= 2) { const t = await fit.evaluateAll((es) => es.map((e) => Math.round(e.getBoundingClientRect().top))); ok(t[0] < t[1], "on the Plate Fit and Prepare go one under the other"); }
    ok((await page.evaluate(cut)).length === 0, "no button is cut on the Plate: " + (await page.evaluate(cut)).join(" · "));
    await page.context().close();
    // a smaller phone, 360 px: the head and Plan
    page = await open(360, "de");
    for (const r of ["/foods", "/plan", "/today", "/my-recipes"]) {
      await page.goto(U + r); await page.waitForTimeout(1000);
      // Today's head has no goal line; the others do
      const head = await page.evaluate(() => { const e = document.querySelector(".topbar .ref"); const m = document.querySelector(".topbar .menu-button"); return { cutRef: !!e && e.scrollWidth > e.clientWidth + 1, inside: m.getBoundingClientRect().right <= window.innerWidth }; });
      ok(head && !head.cutRef && head.inside, `${r} at 360 px: the goal line is whole, the menu button on the screen`);
      ok((await page.evaluate(cut)).length === 0, `${r} at 360 px: no button is cut: ` + (await page.evaluate(cut)).join(" · "));
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${r} at 360 px: nothing scrolls sideways`);
    }
    await page.context().close();
    // English does not move: Today's buttons share one row
    page = await open(390, null); await page.goto(U + "/today"); await page.waitForTimeout(1000);
    const en = await page.locator(".next-planned-acts .pill").evaluateAll((es) => es.map((e) => Math.round(e.getBoundingClientRect().top)));
    ok(en.length === 3 && new Set(en).size === 1, "in English Today's three buttons stay on one row");
    await page.context().close();
  } finally { await b.close(); server.kill(); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  if (fail) { console.log(`${fail} failed`); process.exit(1); }
  console.log("all passed");
})();
