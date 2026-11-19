// Story DT330 (0.3.167, board DT330; Coach Milan 19 November 20:26 to 20:30, Go 20:41): How to feedback that needs Coach Milan
// waits in Waiting for you at the top of Clients, after the beta applications, and counts in its title and the Clients badge.
// Every Didn't work, and every I did it with face 1 or 2 or with words. A tap opens that tester's How to on its own, ‹ Clients
// goes back, and the row is gone. Only the owner's account reads the feedback. Made-up testers: Ana and Bo.
// The checks name the acceptance criteria of the board (DT330 AC1 to AC8).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3587";
const reqs = [{ id: "r1", name: "Ana", email: "ana@example.com", note: "I cook for two.", createdAt: "2026-11-19T12:00:00.000Z", status: "new" }];
const testers = [
  { uid: "t1", name: "Ana", email: "ana@example.com", items: {
    scanAnywhere: { s: "didnt", at: "2026-11-19T18:40:00.000Z", note: "Holding Plate opened the menu, but Barcode showed a black camera.", v: "0.3.166" },
    photoLog: { s: "tried", at: "2026-11-19T13:10:00.000Z", r: 2, note: "The read missed the rice.", v: "0.3.166" },
    handsFree: { s: "tried", at: "2026-11-19T12:00:00.000Z", r: 5, v: "0.3.166" } } },
  { uid: "t2", name: "Bo", email: "bo@example.com", items: {
    otherLang: { s: "tried", at: "2026-11-19T17:05:00.000Z", r: 4, note: "German worked, the voice too.", v: "0.3.166" },
    eatNow: { s: "tried", at: "2026-11-19T09:00:00.000Z", r: 4, v: "0.3.166" } } }];
const serve = (port, env = {}) => spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "", ...env }, stdio: "ignore" });
(async () => {
  const s1 = serve(PORT);
  for (const p of [PORT]) for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${p}/`); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (port, { lang, routed = true, no = false } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-19T20:35:00"));
    await page.route("**/api/access-requests", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ requests: reqs }) }));
    if (no) await page.route("**/api/howto", (r) => r.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: "Only the owner's account reads these." }) }));
    if (routed) await page.route("**/api/howto", (r) => r.request().method() === "GET" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ testers }) }) : r.fulfill({ status: 200, body: "{}" }));
    await page.addInitScript(([s, lang]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang) localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, [seed, lang || null]);
    await require("./adult.cjs")(page);
    await page.goto(`http://127.0.0.1:${port}/today?coachdemo`); await page.waitForTimeout(1500);
    await page.locator(".bottom-nav button").last().click(); await page.waitForTimeout(1200);
    return page;
  };
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const badge = (page) => page.locator(".bottom-nav button").last().locator(".badge").innerText().then(Number).catch(() => 0);
  const count = async (page) => Number(((await page.locator("section.card.waiting > b").first().innerText()).match(/\((\d+)\)/) || [])[1]);
  try {
    let page = await open(PORT);
    const rows = page.locator("section.card.waiting .ht-wait");
    // AC1, AC2, AC3
    const texts = (await rows.allInnerTexts()).map(clean);
    ok(texts.length === 3, "DT330 AC2: three rows: Ana's Didn't work, Bo's 4 of 5 with words, Ana's 2 of 5; not Ana's plain 5, not Bo's plain 4: " + texts.length);
    ok(/^Ana · Scan a pack from any screen Didn't work “Holding Plate opened the menu, but Barcode showed a black camera\.” How to · 19 Nov/.test(texts[0]), "DT330 AC1: the newest row first: first name, situation, Didn't work, the line, How to and the day: " + texts[0]);
    const order = await page.locator("section.card.waiting > section, section.card.waiting > button").evaluateAll((xs) => xs.map((x) => x.classList.contains("request-top") ? "app" : x.classList.contains("ht-wait") ? "howto" : "client"));
    ok(order.join(",").startsWith("app,howto,howto,howto"), "DT330 AC1: after the beta application, before what clients sent: " + order.slice(0, 5).join(","));
    ok(/Bo · A recipe in another language 4 of 5 “German worked, the voice too\.”/.test(texts[1]) && await rows.nth(1).locator(".ht-face svg circle").count() === 1, "DT330 AC3: the face, 4 of 5 and the line: " + texts[1]);
    ok(/Ana · I ate something: log it with a photo 2 of 5 “The read missed the rice\.”/.test(texts[2]), "DT330 AC3: " + texts[2]);
    // AC4: the counts
    const n0 = await count(page), b0 = await badge(page), clientRows = await page.locator("section.card.waiting button.menu-row:not(.ht-wait)").count();
    ok(n0 === 1 + 3 + clientRows && b0 === n0, `DT330 AC4: Waiting for you ${n0} and the badge ${b0} count the application, the three rows and ${clientRows} from clients`);
    // AC5: a tap opens the tester on her own
    await rows.first().click(); await page.waitForTimeout(800);
    ok(clean(await page.locator(".howto-tester h3").innerText()) === "Ana: 2 of 9 done" && await page.locator(".howto-tester .ht-trow").count() === 9 && /Holding Plate opened the menu/.test(await page.locator(".howto-tester").innerText()) && await page.locator("section.card.waiting").count() === 0, "DT330 AC5: Ana's How to on its own, every situation, her line");
    ok(clean(await page.locator(".howto-tester .ht-back").innerText()) === "‹ Clients", "DT330 AC5: ‹ Clients");
    // AC6: opened, it leaves
    await page.locator(".howto-tester .ht-back").click(); await page.waitForTimeout(900);
    ok(await rows.count() === 2 && await count(page) === n0 - 1 && await badge(page) === b0 - 1, `DT330 AC6: the row is gone and the counts are one less: ${await count(page)}, badge ${await badge(page)}`);
    // AC7: an account that is not the owner reads no feedback, so nothing waits. Without the cloud every local account is the
    // owner (metricsOwner), so the server's no is played here as the cloud answers it: 403, Only the owner's account reads these
    page = await open(PORT, { routed: false, no: true });
    ok(await page.locator(".ht-wait").count() === 0 && await count(page) === 1 + (await page.locator("section.card.waiting button.menu-row").count()), "DT330 AC7: not the owner: the feedback answers 403, no row waits, and nothing more counts");
    // AC8: Serbian and German
    for (const [lang, from, back] of [["sr-Latn", "Kako da · 19.", "‹ Klijenti"], ["de", "So geht's · 19.", "‹ Klienten"]]) {
      const p = await open(PORT, { lang }); const t = clean(await p.locator(".ht-wait").first().innerText());
      await p.locator(".ht-wait").first().click(); await p.waitForTimeout(600);
      ok(t.includes(from) && clean(await p.locator(".howto-tester .ht-back").innerText()) === back, `DT330 AC8: ${lang}: ${t.slice(-24)} · ${back}`);
    }
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough stopped: " + e.message); }
  await b.close(); s1.kill();
  console.log(fail ? `\n${fail} failed` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
