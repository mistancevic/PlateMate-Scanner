// DT143 to DT146 (0.3.38, board Stories146; Anna's two blind runs of 22 October, checked again on 0.3.37; Coach Milan
// 1 November 10:48 Go): Anna's setup, then her first day. DT143: while today is empty, one card with three ways (pick lunch,
// plan the day, log what you ate), no Earlier before her first day, yesterday only on day two. DT144: setup's table shows
// each day's PD; Plan says today's kcal target like Today, the range in words; Me's Goal row says average day and protein
// every day. DT146: 45 to 60 min stays a range; a toast shows at the top, under the title bar.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.foods = []; seed.meals = []; seed.feedback = [];
const PORT = "3318", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "en-GB" });
  const page = await ctx.newPage();
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  try {
    await page.clock.install({ time: new Date("2026-11-02T11:00:00") });
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1998, heightCm: 168, weightKg: 60, lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-11-02T09:00:00Z", consentBodyAt: "2026-11-02T09:00:00Z", declaredAt: "2026-11-02T09:00:00Z", aiConfirmedAt: "2026-11-02T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    const txt = async (sel = "main") => ((await page.locator(sel).first().innerText()) || "").replace(/\s+/g, " ");
    // setup, as Anna did it: three moderate evenings of 45 to 60 minutes, Build muscle, each day its own
    await page.goto(U + "/"); await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /^Edit$/ }).first().click(); await page.waitForTimeout(400);
    for (const d of ["Monday", "Wednesday", "Friday"]) {
      await page.getByRole("button", { name: new RegExp(`^${d}:`) }).click(); await page.waitForTimeout(150);
      await page.getByRole("group", { name: `${d}, how hard` }).getByRole("button", { name: "Moderate", exact: true }).click(); await page.waitForTimeout(150);
      await page.getByRole("group", { name: `${d}, how long` }).getByRole("button", { name: "45 to 60 min" }).click();
      await page.getByRole("group", { name: `${d}, when` }).getByRole("button", { name: "Evening" }).click(); await page.waitForTimeout(150);
    }
    await page.locator(".calc-way").getByRole("button", { name: /^Done$/ }).last().click(); await page.waitForTimeout(400);
    await page.locator(".goal-pick").nth(3).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Each day its own" }).click(); await page.waitForTimeout(400);
    // DT144: each day's PD in setup's table
    const pds = await page.locator(".day-table .dt-pd").allTextContents();
    ok(pds.length === 7 && pds[0] === "PD 5.6" && pds[1] === "PD 6.2", "DT144: setup's table shows each day's PD: " + pds.join(", "));
    await page.getByRole("button", { name: /^Apply from today/ }).click(); await page.waitForTimeout(800);
    const step = page.locator(".shop-step");
    await step.getByRole("group", { name: "Where do you live and shop?" }).getByRole("button", { name: "Munich", exact: true }).click(); await page.waitForTimeout(600);
    await step.getByRole("button", { name: /^Done: to Today/ }).click(); await page.waitForTimeout(1200);
    // DT146: the toast shows at the top, under the title bar
    const tb = await page.locator(".toast").first().boundingBox().catch(() => null);
    ok(tb && tb.y < 140, "DT146: the toast shows at the top: y " + (tb && Math.round(tb.y)));
    // DT143: her first day, one card, three ways; no Earlier
    let t = await txt();
    const card = page.locator(".next-empty");
    ok(await card.count() === 1 && /Your first day/.test(await card.innerText()) && /Nothing planned or eaten yet today/.test(await card.innerText()), "DT143: one card on her first day: Your first day, nothing planned or eaten");
    const acts = (await card.getByRole("button").allTextContents()).join("|");
    ok(acts === "Pick a meal for lunch|Plan the day|Log what you ate", "DT143: its three ways: " + acts);
    ok(await page.locator("section.meals-card").count() === 0 && !/Nothing planned so far Go to Plan/.test(t) && (await page.locator(".tomorrow-plan").count()) === 1, "DT143: no empty plan card, no empty meals card; Tomorrow stays");
    ok(!/Earlier/.test(t) && !/Saturday 31 October/.test(t), "DT143: no Earlier on her first day");
    await card.getByRole("button", { name: "Plan the day" }).click(); await page.waitForTimeout(800);
    // DT144 and DT146 on Plan
    t = await txt();
    ok(/of 2,050 kcal today/.test(t) && /a planned day fits from 1,850 to 2,250/.test(t), "DT144: Plan says today's kcal target and the range in words: " + (t.match(/of [\d,]+ kcal[^.]{0,60}/) || [""])[0]);
    ok(/Strength, moderate, 45 to 60 min/.test(t) && !/55 min/.test(t), "DT146: the training row keeps 45 to 60 min");
    // DT144: Me's Goal row
    await page.goto(U + "/me"); await page.waitForTimeout(1200);
    ok(/1,950 kcal on an average day, 115 g protein every day/.test(await txt()), "DT144: Me's Goal row says average day and protein every day");
    // DT143: day two, Earlier shows yesterday only; a planned meal brings the usual cards back
    await page.clock.setFixedTime(new Date("2026-11-03T11:00:00"));
    await page.goto(U + "/"); await page.waitForTimeout(1500);
    t = await txt();
    ok(/Earlier yesterday/.test(t) && /Yesterday, Monday 2 November/.test(t) && !/Sunday 1 November/.test(t), "DT143: day two: Earlier shows yesterday only");
    ok(await page.locator(".next-empty").count() === 1 && /^Today$/.test((await page.locator(".next-empty .next-head").innerText()).trim()), "DT143: an empty day after the first says Today");
    await page.locator(".next-empty").getByRole("button", { name: "Log what you ate" }).click(); await page.waitForTimeout(600);
    ok(/\/plate|journey/.test(page.url()) || await page.locator(".plate, .journey").count() > 0, "DT143: Log what you ate opens the Plate");
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
