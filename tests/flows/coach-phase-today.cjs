// B153 (0.3.170, board B153): the coach sees a client's first two weeks on the coach's today, not on the day her phone last saved.
// The coach demo: Lena is on day 6 of 14; her phone last saved 3 days ago (chefmealan-coach-demo-stale), on day 3. AC1 the outline
// is on today; AC2 the days since are amber; AC3 the days ahead are grey; AC4 her page says day 6 of 14 with the same squares;
// AC5 the full days under the bars are the green ones. Unchanged: with a phone that saved today the card is as before.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
process.on("unhandledRejection", (e) => { console.log("FAIL " + (e && e.message ? e.message : e)); process.exit(1); });
(async () => {
  const PORT = "3241", U = "http://127.0.0.1:" + PORT;
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (stale) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "en-GB" }); const p = await ctx.newPage();
    p.on("pageerror", (e) => errs.push(e.message));
    await p.route("**/api/access-requests", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ requests: [] }) }));
    await p.route("**/api/howto", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ testers: [] }) }));
    await p.addInitScript(([s, stale]) => { localStorage.setItem("chefmealan-coach-demo-stale", String(stale)); if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed, stale]);
    await require("./adult.cjs")(p);
    await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1500);
    await p.locator(".bottom-nav button").last().click(); await p.waitForTimeout(1200);
    return { p, ctx };
  };
  // DT340 (0.3.182): the squares carry the day's level; read as before: green full, today outlined, still to come, any other day gone by
  const states = (loc) => loc.evaluateAll((xs) => xs.map((x) => x.classList.contains("is-today") ? "today" : x.classList.contains("lvl-full") ? "good" : x.classList.contains("lvl-todo") ? "none" : "look"));
  try {
    // a phone that last saved 3 days ago
    let { p, ctx } = await open(3);
    const card = p.locator(".client-row").filter({ hasText: "Lena" }).first();
    ok(/day 6 of 14/.test(await card.innerText()), "B153: Lena's card says day 6 of 14");
    const st = await states(card.locator(".db-cell"));
    ok(st.length === 14 && st.indexOf("today") === 5 && st.filter((x) => x === "today").length === 1, `B153 AC1: the outline is on day 6, today: ${st.join(",")}`);
    ok(st[0] === "good" && st[1] === "good" && st.slice(2, 5).every((x) => x === "look"), "B153 AC2: days 3 to 5, from the day the phone saved, are amber");
    ok(st.slice(6).every((x) => x === "none"), "B153 AC3: days 7 to 14 are grey, still to come");
    const foot = (await card.locator(".db-foot").innerText()).replace(/\s+/g, " ");
    ok(/^2 full days/.test(foot), `B153 AC5: the full days are the green ones: ${foot}`);
    await card.locator(".client-open").click(); await p.waitForTimeout(1200);
    const burn = p.locator(".ft-burn").first();
    ok(/DAY 6 OF 14/i.test(await burn.locator(".ft-caps").innerText()), "B153 AC4: her page says day 6 of 14");
    const sq = await burn.locator(".ft-sq").evaluateAll((xs) => xs.map((x) => ["full", "part", "today", "todo"].find((k) => x.classList.contains(k))));
    ok(JSON.stringify(sq.map((x) => ({ full: "good", part: "look", today: "today", todo: "none" })[x])) === JSON.stringify(st), "B153 AC4: her page has the same squares as her card");
    await ctx.close();
    // unchanged: a phone that saved today draws the same as before
    ({ p, ctx } = await open(0));
    const st0 = await states(p.locator(".client-row").filter({ hasText: "Lena" }).first().locator(".db-cell"));
    ok(st0.indexOf("today") === 5 && st0[2] === "look" && st0[3] === "good" && st0[4] === "good", `B153 unchanged: a phone that saved today keeps its days: ${st0.join(",")}`);
    const nina = p.locator(".client-row").filter({ hasText: "Nina" }).first();
    ok(await nina.locator(".db-cell").count() === 7, "B153 unchanged: a client in a normal week has one row of seven");
    await ctx.close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough stopped: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} failed` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
