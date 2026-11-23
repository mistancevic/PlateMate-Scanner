// B156 (0.3.181, board Stories281; Go 23 November 2026, 12:43): Clients keeps the names it knew when the invites do not load.
// The example coach with a third client whose Profile name is empty (chefmealan-coach-demo-invite), named from the invites;
// the walkthrough answers or refuses /api/invites, as a promote would. AC1 the last good answer kept, AC2 one more try with
// no tap, AC3 No name yet whole, AC4 a new answer replaces the kept one.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const PORT = "3606", U = `http://127.0.0.1:${PORT}`;
const SARA = { uid: "c3", name: "Sara Novak", email: "sara.novak@example.com", via: { kind: "invite", at: "2026-11-20T10:00:00Z" } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  // answers: one per request, "ok" or "fail"; the last repeats. kept: the answer this phone kept from before
  const open = async (answers, kept, answer = [SARA]) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1200 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    const asked = { n: 0 };
    await page.route("**/api/invites", (r) => { const a = answers[Math.min(asked.n++, answers.length - 1)]; return a === "ok" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ invites: [], joined: answer }) }) : r.fulfill({ status: 503, body: "" }); });
    await page.addInitScript(([s, kept]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("chefmealan-coach-demo-invite", "1"); if (kept) localStorage.setItem("chefmealan-joined-demo", JSON.stringify(kept)); localStorage.setItem("seeded", "1"); }, [seed, kept]);
    await require("./adult.cjs")(page);
    await page.goto(U + "/today?coachdemo"); await page.waitForTimeout(1500);
    await page.locator(".bottom-nav button").last().click(); await page.waitForTimeout(1000);
    return { page, asked };
  };
  const third = async (page) => { const c = page.locator("div.client-row:not(.cw-today)").last(); return { name: (await c.locator(".client-head b").first().innerText()).trim(), email: (await c.locator(".client-email").count()) ? (await c.locator(".client-email").innerText()).trim() : "" }; };
  try {
    // AC1: the invites do not load; this phone kept the last good answer
    let { page, asked } = await open(["fail"], [SARA]);
    let c = await third(page);
    ok(c.name === "Sara" && c.email === "sara.novak@example.com", `B156 AC1: the kept answer: ${c.name}, ${c.email}`);
    await page.context().close();
    // AC3 then AC2: never seen, the request fails, then the second try answers
    ({ page, asked } = await open(["fail", "ok"], null));
    c = await third(page);
    ok(c.name === "No name yet", "B156 AC3: a client never seen shows the whole line: " + c.name);
    await page.waitForTimeout(3800);
    c = await third(page);
    ok(c.name === "Sara" && c.email === "sara.novak@example.com", `B156 AC2: about 3 s later, with no tap, the name fills in: ${c.name}, ${c.email}`);
    ok(asked.n === 2, "B156 AC2: asked once more: " + asked.n);
    await page.waitForTimeout(3500);
    ok(asked.n === 2, "B156 AC2: and not again: " + asked.n);
    await page.context().close();
    // AC2: one more try, not more, when the second fails too
    ({ page, asked } = await open(["fail"], null));
    await page.waitForTimeout(7500);
    c = await third(page);
    ok(asked.n === 2 && c.name === "No name yet", `B156 AC2: two failures, two requests, still No name yet: ${asked.n}, ${c.name}`);
    await page.context().close();
    // AC4: a new answer replaces the kept one
    ({ page, asked } = await open(["ok"], [{ ...SARA, name: "Mara Novak" }]));
    c = await third(page);
    ok(c.name === "Sara", "B156 AC4: the new answer, not the kept one: " + c.name);
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-joined-demo"))[0].name) === "Sara Novak", "B156 AC4: and it is kept from now on");
    await page.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
