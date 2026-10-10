// JOURNEY INVARIANT (Milan, 7 October 2026, canvas boards W0 to W2; moved to Me on 10 October 2026, Y1 column 17): a quiet Weigh in line on Me; tap, type, save;
// the answer is the 7-day average, never a judgement on one morning. Me › Goal shows the last 4 weeks: the chart, the 7-day
// average then and now, the change against what the goal expects, and the verdict in plain words. A weigh-in can be removed.
// Someone who declared a difficult relationship with eating sees no weigh-ins and no trend.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3198", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  // four weeks of weigh-ins, rising about 0.1 kg a week, none today
  const ymd = (n) => { const d = new Date(Date.now() - n * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const weighIns = []; for (let n = 27; n >= 1; n--) if (n % 2 === 1 || n < 7 || n > 21) weighIns.push({ date: ymd(n), kg: Math.round((96 + (27 - n) * 0.013 + ((n * 7) % 5 - 2) * 0.15) * 10) / 10 });
  const open = async (situations) => {
    const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
    const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.errs = errs;
    await page.addInitScript(([s, w, sit]) => {
      if (localStorage.getItem("seeded")) return; localStorage.setItem("seeded", "1");
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "gainsteady", setBy: "you", setAt: new Date(Date.now() - 30 * 864e5).toISOString(), source: "calc" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "male", birthYear: 1981, heightCm: 182, weightKg: 96, trainingAge: "3p", steps: "8to12", weighIns: w }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: sit, allergies: [], flags: [], consentBodyAt: "2026-10-05T10:00:00Z", consentBy: "self", none: sit.length === 0, declaredAt: "2026-10-05T10:00:00Z", adultAt: "2026-10-05T09:00:00Z" }));
    }, [seed, weighIns, situations]);
    await page.goto("http://127.0.0.1:3198/"); await page.waitForTimeout(900);
    return page;
  };
  try {
    const page = await open([]);
    ok(await page.getByRole("button", { name: /Weigh in/ }).count() === 0, "Today has no weigh-in line any more (it lives on Me)");
    await require("./me.cjs")(page);
    const line = page.getByRole("button", { name: /Weigh in/ });
    ok(await line.count() === 1 && /7-day average/.test(await line.textContent()), "Me has a quiet Weigh in line with the 7-day average: " + (await line.textContent()).trim());
    await line.click(); await page.waitForTimeout(150);
    await page.getByLabel("Your weight, kg").fill("96.4"); await page.getByRole("button", { name: /^Save$/ }).click(); await page.waitForTimeout(300);
    const body = await page.locator("body").textContent();
    ok(/Saved\. Your 7-day average is \d+\.\d kg\./.test(body), "saving answers with the 7-day average, not a judgement");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).weighIns);
    ok(saved.length === weighIns.length + 1 && saved[saved.length - 1].kg === 96.4, "today's weigh-in is kept");
    await page.locator(".me-rows .menu-row").filter({ hasText: /^Goal/ }).first().click(); await page.waitForTimeout(400);
    const trend = page.getByRole("region", { name: "The last 4 weeks" });
    const tt = await trend.textContent();
    ok(await trend.locator("svg").count() === 1 && /7-day average/.test(tt) && /in 3 weeks/.test(tt) && /expected for Build muscle · Steady/.test(tt), "the last 4 weeks: chart, averages, change and what Steady expects");
    ok(/On track|Faster than expected|Slower than expected/.test(tt), "a verdict in plain words: " + (tt.match(/On track|Faster than expected|Slower than expected/) || [""])[0]);
    await trend.getByRole("button", { name: "Your weigh-ins" }).click(); await page.waitForTimeout(150);
    const rm = trend.getByRole("button", { name: /Remove the weigh-in/ }).first();
    await rm.click(); await page.waitForTimeout(100); await rm.click(); await page.waitForTimeout(300);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).weighIns.length);
    ok(after === saved.length - 1, "a weigh-in can be removed");
    ok(page.errs.length === 0, "no page errors" + (page.errs.length ? ": " + page.errs.join("; ") : ""));
    // an eating situation: no weigh-ins, no trend
    const e = await open(["eating"]);
    await require("./me.cjs")(e);
    ok(await e.getByRole("button", { name: /Weigh in/ }).count() === 0, "with an eating situation, Me has no weigh-in line");
    await e.locator(".me-rows .menu-row").filter({ hasText: /^Goal/ }).first().click(); await e.waitForTimeout(400);
    ok(await e.getByRole("region", { name: "The last 4 weeks" }).count() === 0, "and Me › Goal shows no trend");
  } catch (err) { ok(false, "walkthrough error: " + err.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
