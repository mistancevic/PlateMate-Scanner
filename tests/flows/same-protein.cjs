// Today and Me show the same protein (0.2.5+r18): with a quick goal and each day its own, Today worked the day out from
// the profile (180 g) while Me showed the goal (105 g). A goal not calculated from the profile keeps its protein and fat
// on every day; the day's energy moves with the training. Checked for the three ways a goal is set.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3198" }, stdio: ["ignore", "pipe", "pipe"] });
  for (let i = 0; i < 60; i++) { try { await fetch("http://127.0.0.1:3198/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  for (const source of ["quick", "profile", "exact"]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1400 } }); const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript(([s, source]) => { if (localStorage.getItem("seeded")) return;
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1977, heightCm: 184, weightKg: 95, plan: Array(7).fill({ work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }), lifestyle: { meals: 3 } }));
      localStorage.setItem("seeded", "1"); }, [seed, source]);
    await require("./adult.cjs")(page);
    const protein = async (url) => { await page.goto(`http://127.0.0.1:3198${url}`); await page.waitForTimeout(1300); return page.evaluate(() => { const s = [...document.querySelectorAll("small")].find((x) => /^(of [\d,]+ )?g protein$/.test(x.textContent.trim())); const of = s?.textContent.trim().match(/^of ([\d,]+)/); return s ? (of ? of[1] : s.parentElement.querySelector("b").textContent.trim()) : null; }); }; // R5 (Milan 17:23 to 19:00, board RS13): on Today the target is "of N g protein" under what is eaten
    const today = await protein("/today"), me = await protein("/me");
    ok(today && today === me, `a ${source} goal: Today ${today} g protein, Me ${me} g`);
    await ctx.close();
  }
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed");
  process.exit(fail ? 1 : 0);
})();
