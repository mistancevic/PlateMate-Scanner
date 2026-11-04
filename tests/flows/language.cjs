// DT203 (0.3.76, board Stories175 v2; Coach Milan 3 November 19:22 to 19:39, Go both): Settings, Language opens. English,
// Srpski (latinica), Deutsch coming soon. Choosing Srpski is kept on this phone, the Settings line says what is in Serbian, and
// the app's own calls to the server say the language (x-chef-lang), so Chef Mealan's AI answers come in Serbian. English again
// takes it back. Which of his fixed lines show in Serbian is Coach Milan's tick (src/srLines.test.ts).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.feedback = [];
const PORT = "3396", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    const heard = []; page.on("request", (r) => { if (r.url().includes("/api/version")) heard.push(r.headers()["x-chef-lang"] || ""); });
    await page.addInitScript((s) => { if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1"); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); }, seed);
    await require("./adult.cjs")(page);
    await page.goto(U + "/today"); await page.waitForTimeout(1000);
    await page.locator("header .menu-button").click(); await page.waitForTimeout(400);
    await page.locator(".menu-row").filter({ hasText: "Settings" }).first().click(); await page.waitForTimeout(300);
    const row = page.locator("button.menu-row").filter({ hasText: "Language" });
    ok(await row.count() === 1 && !/Coming soon/.test(await row.textContent()), "Language is a row that opens, no longer Coming soon");
    await page.evaluate(() => fetch("/api/version")); await page.waitForTimeout(300);
    ok(heard.length === 1 && heard[0] === "", "in English the app's calls carry no language");
    await row.click(); await page.waitForTimeout(300);
    const opts = page.locator(".lang-row");
    ok(await opts.count() === 3, "three choices");
    const t = await page.locator("main").textContent();
    ok(/English/.test(t) && /Srpski \(latinica\)/.test(t) && /Deutsch/.test(t) && /Coming soon/.test(t), "English, Srpski (latinica), Deutsch coming soon");
    ok(await page.locator('.lang-row[aria-checked="true"]').textContent().then((x) => /^English/.test(x)), "English is chosen at first");
    const h = await opts.evaluateAll((es) => es.map((e) => e.getBoundingClientRect().height));
    ok(h.every((x) => x >= 44), "each choice is at least 44 px: " + h.map(Math.round).join(", "));
    await opts.filter({ hasText: "Srpski" }).click(); await page.waitForTimeout(300);
    ok(await page.locator('.lang-row[aria-checked="true"]').textContent().then((x) => /^Srpski/.test(x)), "Srpski is chosen, ticked");
    ok(await page.evaluate(() => localStorage.getItem("chefmealan-lang")) === "sr-Latn", "kept on this phone");
    await page.evaluate(() => fetch("/api/version")); await page.waitForTimeout(300);
    ok(heard[1] === "sr-Latn", "the app's calls now say the language, so his AI answers come in Serbian");
    await page.locator(".lang-row.settings-soon").click({ force: true }); await page.waitForTimeout(200);
    ok(await page.evaluate(() => localStorage.getItem("chefmealan-lang")) === "sr-Latn", "Deutsch does nothing yet");
    await page.locator(".menu-head button.link").first().click(); await page.waitForTimeout(300);
    const back = page.locator("button.menu-row").filter({ hasText: "Language" });
    if (await back.count()) ok(/Chef Mealan speaks Srpski \(latinica\)\. The screens are in English for now\./.test(await back.textContent()), "the Settings line says what is in Serbian so far");
    else ok(false, "back on Settings");
    await page.reload(); await page.waitForTimeout(800);
    ok(await page.evaluate(() => localStorage.getItem("chefmealan-lang")) === "sr-Latn", "still Srpski after opening again");
    // DT203 release 2 (0.3.77): numbers follow the language at once; a word shows in Srpski only once Coach Milan ticked it
    await page.goto(U + "/plate"); await page.waitForTimeout(1200);
    const head = await page.locator("header").first().textContent();
    ok(/PD \d+,\d/.test(head), "in Srpski the header's PD has a decimal comma: " + head.replace(/\s+/g, " ").slice(0, 80));
    const main = await page.locator("main").textContent();
    ok(/On the plate/.test(main) && !/Na tanjiru/.test(main), "a line not ticked yet stays English");
    await page.evaluate(() => { localStorage.removeItem("chefmealan-lang"); }); await page.reload(); await page.waitForTimeout(800);
    ok(/PD \d+\.\d/.test(await page.locator("header").first().textContent()), "English again: a decimal point");
    await ctx.close();
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.slice(0, 2).join(" | ") : ""}`);
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} failed` : "all passed"); process.exit(fail ? 1 : 0);
})();
