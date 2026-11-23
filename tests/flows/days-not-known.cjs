// B159 (0.3.186, board Stories286; Go 23 November 2026, 17:44): on a client's card, a day before the client's phone recorded
// activity, with nothing logged, reads o (not known), never not opened; a day with something logged keeps its colour; the key
// line names the o only when it shows. The example coach on Thursday 26 November, 13:30, with Sara (chefmealan-coach-demo-quiet):
// her phone recorded from yesterday (chefmealan-coach-demo-recorded 1), or never (none). AC2 and AC4: src/activity.test.ts.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const PORT = "3611", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (recorded) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1000 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-26T13:30:00+01:00"));
    await page.addInitScript(([s, recorded]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("chefmealan-coach-demo-quiet", "1"); if (recorded) localStorage.setItem("chefmealan-coach-demo-recorded", recorded); localStorage.setItem("seeded", "1"); }, [seed, recorded]);
    await require("./adult.cjs")(page);
    await page.goto(U + "/today?coachdemo"); await page.waitForTimeout(1500);
    await page.locator(".bottom-nav button").last().click(); await page.waitForTimeout(1200);
    return page;
  };
  const card = (page, name) => page.evaluate((name) => { const c = [...document.querySelectorAll("div.client-row:not(.cw-today)")].find((x) => x.querySelector(".client-head b").textContent.trim() === name);
    return { lv: [...c.querySelectorAll(".db-cell")].map((x) => x.dataset.level + (x.classList.contains("is-today") ? "*" : "")), key: c.querySelector(".db-key").textContent.trim() }; }, name);
  try {
    let page = await open("1");
    let sara = await card(page, "Sara");
    ok(sara.lv.slice(0, 4).join(" ") === "unknown unknown active opened*", "B159 AC1: recorded from yesterday: Monday and Tuesday not known, yesterday active, today opened: " + sara.lv.join(" "));
    ok(/o: not known, from before the app recorded it/.test(sara.key), "B159 AC3: the key names the o: " + sara.key);
    const lena = await card(page, "Lena");
    ok(!lena.lv.some((x) => x.startsWith("unknown")) && !/not known/.test(lena.key), "B159 AC3: Lena's phone recorded all her days: no o, the key does not name it: " + lena.lv.join(" "));
    await page.context().close();
    page = await open("none");
    sara = await card(page, "Sara");
    ok(sara.lv.slice(0, 4).join(" ") === "unknown unknown unknown unknown*", "B159 AC5: a phone that never recorded: every day with nothing logged is not known: " + sara.lv.join(" "));
    await page.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
