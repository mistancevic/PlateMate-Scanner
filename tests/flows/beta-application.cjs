// DT279 (0.3.140, board Stories213; Coach Milan 11 November, 12 November 13:24 and 13:44, Go 13:49): a new beta tester application
// is the first thing in Waiting for you on Clients, as a full card, and counts in Waiting for you and the Clients badge. Invite sits
// on the right; Mark as handled sits on its own line below and needs a second tap. Handled, it leaves the top. Srpski and German.
// Changed by B155 (0.3.173, board B155; Coach Milan, Go 22 November 14:21): a request from a person already invited or
// already a client is not a new request: no card in Waiting for you, and the badge does not count it. Further down, under
// Access requests, it says what happened (Already a client, or Invited on that date and the code not used yet), and a
// request that came after the invite has one button that opens the mail app: Send how to sign in, or Send the code again.
// The server adds what the invites say to each request; here its answer is given in place of the server, and the rule
// itself has unit tests (src/applications.test.ts). New checks at the end, B155 AC1 to AC8.
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
  const open = async (lang = "en", width = 390, given = null) => {
    const ctx = await b.newContext({ viewport: { width, height: 900 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    const reqs = given ?? [{ id: "r1", name: "Ana", email: "ana@example.com", phone: "+490000000", note: "I cook for two.", createdAt: "2026-11-12T12:00:00.000Z", status: "new" },
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
    // ---- B155: a request from a person already invited or already a client
    const INV = "2026-11-20T10:00:00.000Z";
    const r1 = { id: "n1", name: "Nina", email: "nina@example.com", phone: "+490000000", note: "I want to help test it.", createdAt: "2026-11-20T09:10:00.000Z", status: "handled", handledAt: "2026-11-20T10:00:00.000Z" };
    const r2 = { ...r1, id: "n2", createdAt: "2026-11-21T18:30:00.000Z", status: "new", handledAt: undefined };
    const text = async (loc) => (await loc.innerText()).replace(/\s+/g, " ").trim();
    // AC8: a first request is as today (the checks above); here the numbers to compare with
    ({ ctx, page } = await open("en", 390, [{ ...r2, id: "first" }]));
    const nNew = await count(page), bNew = await badge(page);
    ok(await page.locator(".request-top").count() === 1 && await page.locator(".request-top").getByRole("button", { name: "Invite" }).count() === 1 && await page.locator(".request-top").getByRole("button", { name: "Mark as handled" }).count() === 1, "B155 AC8: a first request waits as a card with Invite and Mark as handled");
    await ctx.close();
    // AC1, AC3, AC5: already a client
    const USED = { status: "used", at: INV, coachName: "Milan" };
    ({ ctx, page } = await open("en", 390, [{ ...r2, invite: USED }, { ...r1, invite: USED }]));
    ok(await page.locator(".request-top").count() === 0 && await count(page) === nNew - 1 && await badge(page) === bNew - 1, "B155 AC1: she joined with my invite and sent the form once more: no card in Waiting for you, and the badge does not count it");
    let row = page.locator(".card.request:not(.request-top)").first();
    let t = await text(row);
    ok(await page.locator(".card.request").count() === 1 && /Nina · from the home page · 2 requests/.test(t) && /Already a client/.test(t), "B155 AC3: further down her request says 2 requests and Already a client: " + t.slice(0, 120));
    ok(await row.getByRole("button", { name: "Invite" }).count() === 0 && await row.getByRole("button", { name: "Mark as handled" }).count() === 0, "B155 AC3: it has no Invite and no Mark as handled");
    let link = row.locator(".request-answer a");
    let href = decodeURIComponent((await link.getAttribute("href")) || "");
    ok((await link.innerText()).trim() === "Send how to sign in" && href.startsWith("mailto:nina@example.com?subject=You already have access to Chef Mealan") && /Sign in with Google using this email address: nina@example\.com/.test(href) && /No code is needed again/.test(href), "B155 AC5: Send how to sign in opens a mail to her that says she already has access and how to sign in");
    ok(await link.evaluate((x) => x.getBoundingClientRect().height >= 44) && await row.evaluate((x) => getComputedStyle(x).opacity === "1"), "B155: the button is 44 px high, and the request is not greyed out");
    await ctx.close();
    // AC2, AC3, AC4: invited, the code not used
    const OPEN = { status: "open", at: INV, code: "ABC123", coachName: "Milan" };
    ({ ctx, page, calls } = await open("en", 390, [{ ...r2, invite: OPEN }, { ...r1, invite: OPEN }]));
    ok(await page.locator(".request-top").count() === 0 && await count(page) === nNew - 1 && await badge(page) === bNew - 1, "B155 AC2: she is invited, the code is not used, and she sent the form once more: no card, and the badge does not count it");
    row = page.locator(".card.request:not(.request-top)").first(); t = await text(row);
    ok(/2 requests/.test(t) && /Invited on 20 Nov\. The code is not used yet\./.test(t), "B155 AC3: further down: 2 requests, Invited on 20 Nov. The code is not used yet.");
    link = row.locator(".request-answer a"); href = decodeURIComponent((await link.getAttribute("href")) || "");
    ok((await link.innerText()).trim() === "Send the code again" && href.startsWith("mailto:nina@example.com?subject=Your Chef Mealan invite") && /your personal code for Chef Mealan: ABC123/.test(href), "B155 AC4: Send the code again opens a mail to her with the same code and the steps");
    ok(calls.invited.length === 0, "B155 AC4: no new code is made");
    await ctx.close();
    // AC7: an invite made by hand closes the request that was waiting; it came before the invite, so there is no button
    ({ ctx, page } = await open("en", 390, [{ ...r1, status: "new", handledAt: undefined, invite: OPEN }]));
    row = page.locator(".card.request:not(.request-top)").first();
    ok(await page.locator(".request-top").count() === 0 && /Invited on 20 Nov\. The code is not used yet\./.test(await text(row)) && await row.locator(".request-answer").count() === 0, "B155 AC7: a request that waited when the invite was made by hand left Waiting for you and says Invited on 20 Nov; no button, she did not ask again");
    await ctx.close();
    // AC6: Invite on a card of two requests: the app closes the one it shows; the server closes every request of that email
    ({ ctx, page, calls } = await open("en", 390, [{ ...r2 }, { ...r1, status: "new", handledAt: undefined }]));
    ok(/2 requests/.test(await text(page.locator(".request-top"))), "B155 AC6: two requests before I answered: one card, 2 requests");
    await page.locator(".request-top").getByRole("button", { name: "Invite" }).click(); await page.waitForTimeout(1500);
    ok(calls.marked.join() === "n2" && await page.locator(".request-top").count() === 0, "B155 AC6: Invite closes the card, and it does not come back");
    await ctx.close();
    // the new lines in Srpski and German, at 390 and 360 px
    for (const [lang, width, line, btn] of [["de", 360, "Schon Klient", "Senden, wie man sich anmeldet"], ["de", 390, "Schon Klient", "Senden, wie man sich anmeldet"]]) {
      ({ ctx, page } = await open(lang, width, [{ ...r2, invite: USED }, { ...r1, invite: USED }]));
      row = page.locator(".card.request:not(.request-top)").first();
      ok(new RegExp(line).test(await text(row)) && (await row.locator(".request-answer a").innerText()).trim() === btn && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth) && await row.locator(".request-answer a").evaluate((x) => x.getBoundingClientRect().right <= window.innerWidth - 8), `B155 ${lang} ${width}: ${line}, ${btn}, fits`);
      await ctx.close();
      ({ ctx, page } = await open(lang, width, [{ ...r2, invite: OPEN }, { ...r1, invite: OPEN }]));
      row = page.locator(".card.request:not(.request-top)").first();
      ok(/Eingeladen am 20\. Nov\., der Code ist noch nicht eingelöst\./.test(await text(row)) && (await row.locator(".request-answer a").innerText()).trim() === "Code noch einmal senden" && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `B155 ${lang} ${width}: the invited line and Code noch einmal senden, fits: ` + (await text(row)).slice(-90));
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
