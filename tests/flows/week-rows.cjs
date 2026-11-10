// DT277 (0.3.128, board Stories206; Coach Milan 10 November 21:54 to 22:53, Go): Me, Training week. A day shows it can be
// opened: a pencil on a day with training, a plus on a day with none. The whole row is the button, at least 44 px high.
// The small line under the card is gone. German at 360 px fits.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const PORT = "3498", U = `http://127.0.0.1:${PORT}`;
const T = { work: true, kind: "hiit", intensity: "moderate", when: "day", minutes: 45 }, N = { work: true, kind: "rest" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  try {
    for (const [lang, width] of [["en", 390], ["sr-Latn", 390], ["de", 360]]) {
      const ctx = await b.newContext({ viewport: { width, height: 1100 }, timezoneId: "Europe/Berlin" });
      const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
      await page.addInitScript(({ s, plan, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
        localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
        localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, plan, lifestyle: { meals: 3, window: { from: "08:00", to: "19:00" } } }));
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
        if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: seed, plan: [T, N, T, N, T, N, N], lang });
      await require("./adult.cjs")(page);
      await page.goto(U + "/me/training-week").catch(() => {}); await page.waitForTimeout(1200);
      if (!(await page.locator(".agenda-row").count())) { await page.goto(U + "/"); await page.waitForTimeout(900); await require("./me.cjs")(page); await page.locator(".menu-row").nth(0).waitFor(); await page.locator(".menu-row").filter({ has: page.locator("svg.lucide-calendar-days") }).first().click(); await page.waitForTimeout(700); }
      const rows = page.locator(".agenda-row");
      ok(await rows.count() === 7, `${lang}: seven days`);
      const icons = await rows.evaluateAll((a) => a.map((r) => (r.querySelector(".agenda-go svg")?.getAttribute("class") ?? "").match(/lucide-(pencil|plus)/)?.[1] ?? "none"));
      ok(icons.join() === "pencil,plus,pencil,plus,pencil,plus,plus", `${lang}: a pencil on a training day, a plus on a day with none: ` + icons.join());
      const hs = await rows.evaluateAll((a) => a.map((r) => Math.round(r.getBoundingClientRect().height)));
      ok(hs.every((h) => h >= 44), `${lang}: every row is at least 44 px high: ` + hs.join());
      ok(await rows.evaluateAll((a) => a.every((r) => { const w = r.querySelector(".agenda-what"); return w.scrollHeight <= w.clientHeight + 1 && r.scrollHeight <= r.clientHeight + 1; })), `${lang}: no line is cut`);
      ok(await page.locator(".week-card-foot").count() === 0, `${lang}: the line under the card is gone`);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${lang}: fits the width`);
      if (lang === "en") { await rows.nth(0).click(); await page.waitForTimeout(400); ok(await page.locator(".agenda-open").count() === 1, "a tap on the row opens the day"); await rows.nth(0).click(); await page.waitForTimeout(300); ok(await page.locator(".agenda-open").count() === 0, "a second tap closes it"); }
      await page.screenshot({ path: `/tmp/claude-0/-home-claude/a3625ff7-4226-57ca-879e-055f53d2dca0/scratchpad/week-${lang}.png` }).catch(() => {});
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
