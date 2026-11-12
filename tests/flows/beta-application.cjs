// DT279 (0.3.140, board Stories213; Coach Milan 11 November, 12 November 13:24 and 13:44, Go 13:49): a new beta tester application
// is the first thing in Waiting for you on Clients, as a full card, and counts in Waiting for you and the Clients badge. Invite sits
// on the right; Mark as handled sits on its own line below and needs a second tap. Handled, it leaves the top. Srpski and German.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const PORT = "3504", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang = "en", width = 390) => {
    const ctx = await b.newContext({ viewport: { width, height: 900 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    const reqs = [{ id: "r1", name: "Ana", email: "ana@example.com", phone: "+490000000", note: "I cook for two.", createdAt: "2026-11-12T12:00:00.000Z", status: "new" },
      { id: "r0", name: "Bo", email: "bo@example.com", createdAt: "2026-11-01T12:00:00.000Z", status: "handled", handledAt: { _seconds: 1762000000 } }];
    const calls = { marked: [], invited: [] };
    await page.route("**/api/access-requests", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ requests: reqs }) }));
    await page.route("**/api/access-requests/*", (r) => { const id = r.request().url().split("/").pop(); calls.marked.push(id); const x = reqs.find((q) => q.id === id); if (x) x.status = "handled"; r.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" }); });
    await page.route("**/api/invites", (r) => { calls.invited.push(JSON.parse(r.request().postData() || "{}").email); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ email: "ana@example.com", name: "Ana", code: "ABC123", coachName: "Milan" }) }); });
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: seed, lang });
    await require("./adult.cjs")(page);
    await page.goto(U + "/today?coachdemo"); await page.waitForTimeout(1500);
    await page.locator(".bottom-nav button").last().click(); await page.waitForTimeout(1000);
    return { ctx, page, calls };
  };
  const badge = (page) => page.locator(".bottom-nav button").last().locator(".badge").innerText().then(Number).catch(() => 0);
  const count = async (page) => Number(((await page.locator("section.card.waiting > b").first().innerText()).match(/\((\d+)\)/) || [])[1]);
  try {
    let { ctx, page, calls } = await open();
    const wq = page.locator("section.card.waiting");
    const first = wq.locator(":scope > section, :scope > button").first();
    ok(await first.evaluate((x) => x.classList.contains("request-top")), "the application is the first thing in Waiting for you");
    const top = wq.locator(".request-top");
    ok((await top.locator(".request-chip").innerText()).trim() === "New beta tester application", "it says New beta tester application");
    ok(/Ana/.test(await top.innerText()) && /ana@example.com/.test(await top.innerText()) && /WhatsApp/.test(await top.innerText()) && /I cook for two/.test(await top.innerText()), "a full card: name, email, WhatsApp, their words");
    const n0 = await count(page), b0 = await badge(page), rows = await wq.locator("button.menu-row").count();
    ok(n0 === rows + 1 && b0 === n0, `it counts in Waiting for you and the badge: ${n0}, badge ${b0}, ${rows} other rows`);
    ok(await page.locator(".request-top").count() === 1, "the handled one is not at the top");
    const inv = await top.getByRole("button", { name: "Invite" }).boundingBox(), card = await top.boundingBox(), mk = await top.getByRole("button", { name: "Mark as handled" }).boundingBox();
    ok(card.x + card.width - (inv.x + inv.width) < 40 && inv.x > card.x + card.width / 2, "Invite is on the right");
    ok(mk.y > inv.y + inv.height && mk.x < card.x + card.width / 2, "Mark as handled is on its own line, below and away from Invite");
    ok(await top.locator("button").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "every button is 44 px or more");
    await top.getByRole("button", { name: "Mark as handled" }).click(); await page.waitForTimeout(300);
    ok(calls.marked.length === 0 && await top.getByRole("button", { name: "Sure? Tap again to mark as handled" }).count() === 1 && /without an invite/.test(await top.innerText()), "one tap: Sure? Tap again, nothing handled yet");
    await top.getByRole("button", { name: "Keep it" }).click(); await page.waitForTimeout(300);
    ok(calls.marked.length === 0 && await top.getByRole("button", { name: "Mark as handled" }).count() === 1, "Keep it: back, nothing handled");
    await top.getByRole("button", { name: "Mark as handled" }).click(); await page.waitForTimeout(200);
    await top.getByRole("button", { name: "Sure? Tap again to mark as handled" }).click(); await page.waitForTimeout(1200);
    ok(calls.marked.join() === "r1" && await page.locator(".request-top").count() === 0, "the second tap: handled, it leaves the top");
    ok(await count(page) === n0 - 1 && await badge(page) === b0 - 1, "Waiting for you and the badge drop by one");
    await ctx.close();
    // Invite: one tap, the invite is made, the request handled, the card leaves the top
    ({ ctx, page, calls } = await open());
    await page.locator(".request-top").getByRole("button", { name: "Invite" }).click(); await page.waitForTimeout(1500);
    ok(calls.invited.join() === "ana@example.com" && calls.marked.join() === "r1", "Invite: the invite is made and the request handled");
    ok(await page.locator(".request-top").count() === 0, "after Invite the card leaves the top");
    await ctx.close();
    for (const [lang, width, chip] of [["sr-Latn", 390, "Nova prijava za beta testiranje"], ["de", 360, "Neue Bewerbung für den Betatest"]]) {
      ({ ctx, page } = await open(lang, width));
      const t = page.locator(".request-top");
      ok((await t.locator(".request-chip").innerText()).trim() === chip && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${lang}: ${chip}, fits ${width} px`);
      await t.locator(".request-mark").click(); await page.waitForTimeout(200);
      const s = await t.locator(".request-handle").innerText();
      ok(!/Sure|Keep it|without an invite/.test(s), `${lang}: the second tap in the language: ${s.replace(/\n/g, " ")}`);
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
