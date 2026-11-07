// 0.3.109 (Coach Milan 7 November 21:03): an automatic accessibility check at every release, so nothing gets worse. axe-core
// runs the WCAG 2.2 AA rules (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) on every main screen in English, and on the most
// used ones in Srpski and German, then on the home page in all three. A finding names the screen, the rule and an example.
// The full manual pass (screen readers, large text) is parked until there is a reason for it (DT235).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.feedback = [];
const F = (id, name, calories, protein, fats, carbs, fiber = 0) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber, photo: undefined, photos: undefined, icon: undefined, barcode: undefined, places: [] });
const salmon = [[180, F("sa", "Salmon fillet, raw", 208, 20, 13, 0)], [150, F("rc", "Basmati rice, dry", 356, 8.5, 0.9, 78, 1.3)], [120, F("br", "Broccoli", 34, 2.8, 0.4, 7, 2.6)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const state = { ...seed, meals: [{ id: "m-sa", title: "Salmon, rice and broccoli", items: salmon, portion: 450, steps: ["Cook the rice.", "Bake the salmon 12 minutes.", "Steam the broccoli."], savedAt: "2026-11-01T18:00:00Z" }], items: salmon, title: "Salmon, rice and broccoli" };
const PORT = "3407", B = `http://127.0.0.1:${PORT}`;
const ALL = ["/today", "/plan", "/plate", "/my-recipes", "/foods", "/me", "/me/profile", "/me/goal", "/me/lifestyle", "/me/training-week", "/me/shop", "/me/coach", "/me/summary", "/me/calendar", "/me/account", "/menu", "/menu/support", "/menu/about"];
const MOST = ["/today", "/plan", "/plate", "/foods", "/me"];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(B + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const check = async (page, name) => {
    await page.evaluate(AXE);
    const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id} (${x.nodes.length}): ${x.nodes[0].target.join(" ")} ${(x.nodes[0].failureSummary || "").split("\n")[1] || ""}`.slice(0, 220)));
    ok(v.length === 0, `${name}: WCAG 2.2 AA, automatic` + (v.length ? " | " + v.join(" | ") : ""));
  };
  const app = async (lang) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install({ time: new Date("2026-11-07T12:30:00") });
    await page.addInitScript(([s, lang]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      if (lang) localStorage.setItem("chefmealan-lang", lang);
      localStorage.setItem("chefmealan-personal", JSON.stringify({ name: "Milan", dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 4 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [state, lang]);
    await require("./adult.cjs")(page);
    return page;
  };
  try {
    for (const [lang, routes] of [[null, ALL], ["sr-Latn", MOST], ["de", MOST]]) {
      const page = await app(lang), tag = lang || "en";
      for (const r of routes) { await page.goto(B + r); await page.waitForTimeout(1100); await check(page, `${tag} ${r}`); }
      await page.goto(B + "/my-recipes/m-sa"); await page.waitForTimeout(1100); await check(page, `${tag} the recipe page`);
      const go = page.locator(".rq-start button, .rq-steps button").filter({ hasText: /Start cooking|Kochen starten|Počni da kuvaš/ }).first();
      if (await go.count()) { await go.click(); await page.waitForTimeout(1000); const ask = page.locator(".rq-lang-cook"); if (await ask.count()) { await ask.locator(".ca-go button").nth(1).click(); await page.waitForTimeout(1000); } await check(page, `${tag} cook mode`); }
      await page.context().close();
    }
    for (const p of ["/?home", "/sr?home", "/de?home"]) {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
      await page.goto(B + p); await page.waitForTimeout(1200); await check(page, `the home page ${p}`); await ctx.close();
    }
  } finally { await b.close(); server.kill(); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  if (fail) { console.log(`${fail} failed`); process.exit(1); }
  console.log("all passed");
})();
