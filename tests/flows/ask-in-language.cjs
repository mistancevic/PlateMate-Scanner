// B137 (0.3.140; Coach Milan 12 November 13:30, Go 13:33): opened from a scanned food, Chef Mealan on the Plate writes the
// question into the field in the app's language, never in English. Srpski and German.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = [];
const PORT = "3503", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    for (const [lang, want] of [["sr-Latn", /^Skenirano: Nutella \(.+\)\. Tvoj predlog: .+\. Moja izmena: $/], ["de", /^Gescannt: Nutella \(.+\)\. Dein Vorschlag: .+\. Was ich ändern würde: $/], ["en", /^I scanned Nutella for regular meal\. You suggested .+\. What I'd change: $/]]) {
      const ctx = await b.newContext({ viewport: { width: 390, height: 1000 } }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
      await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
        localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
        if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: seed, lang });
      await require("./adult.cjs")(page);
      await page.goto(U + "/foods"); await page.waitForTimeout(1500);
      await page.locator("button").filter({ hasText: /^Nutella$/ }).first().click(); await page.waitForTimeout(600);
      ok(await page.locator(".mix-tip").count() === 1, `${lang}: Nutella's card has Mix it`);
      await page.locator(".mix-tip button.link").last().click(); await page.waitForTimeout(800);
      const q = await page.locator(".helper input").first().inputValue().catch(() => "");
      ok(want.test(q), `${lang}: the question in the field: ${q}`);
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
