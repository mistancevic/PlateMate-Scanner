// B141 (0.3.146, board Stories219; Coach Milan 14 November 2026, Go 13:08): a client is never unnamed, and the coach sees how they
// came in. The card shows the name, the email and where from; below it the coach's own note. Create invite needs a name. The home
// page form's note box says who reads it, and remembers the link it was opened from. The goal step is titled Your goal.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const PORT = "3511", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang = "en") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: seed, lang });
    await require("./adult.cjs")(page);
    await page.goto(U + "/today?coachdemo"); await page.waitForTimeout(1500);
    await page.locator(".bottom-nav button").last().click(); await page.waitForTimeout(1000);
    return { ctx, page };
  };
  const t = async (l) => ((await l.count()) ? (await l.first().innerText()).replace(/\s+/g, " ").trim() : "");
  try {
    // 1. the card: name, email, where from
    let { ctx, page } = await open();
    const card = page.locator("div.client-row:not(.cw-today)").first();
    const head = await t(card.locator(".client-head"));
    ok(/^N Nina nina@example\.com From the home page form · QR · \d{1,2} [A-Z][a-z]+/.test(head), "the card: name, email, where from: " + head);
    ok(!/unnamed/i.test(await t(page.locator("main").last())), "nothing on Clients says unnamed");
    const lena = await t(page.locator("div.client-row:not(.cw-today)").nth(1).locator(".client-head"));
    ok(/lena@example\.com From your invite · /.test(lena), "an invite made by hand: From your invite: " + lena);
    // 2. the coach's own note
    ok(await t(card.locator(".client-note-own")) === "Add a note", "no note yet: Add a note");
    await card.getByRole("button", { name: "Add a note" }).click(); await page.waitForTimeout(200);
    ok(/Only you see this note\. Nina doesn't\./.test(await t(card.locator(".client-note-own"))), "the box says only you see it");
    const order = await card.locator(".client-note-go").evaluate((g) => [...g.children].map((x) => x.textContent.trim()));
    ok(order.join("|") === "Cancel|Save", "Cancel on the left, Save on the right: " + order.join("|"));
    await card.locator("textarea").fill("Met at the High Performers meetup, Friday 13 November."); await card.getByRole("button", { name: "Save" }).click(); await page.waitForTimeout(400);
    ok(/Your note: Met at the High Performers meetup, Friday 13 November\. Edit note/.test(await t(card.locator(".client-note-own"))), "the note stays on the card, with Edit note: " + await t(card.locator(".client-note-own")));
    ok(await page.locator(".cw-person").count() === 0, "writing a note does not open the client");
    const small = await card.locator("button").evaluateAll((xs) => xs.filter((x) => x.getBoundingClientRect().height > 0 && x.getBoundingClientRect().height < 44).map((x) => x.textContent.trim()));
    ok(small.length === 0, "buttons at least 44 px: " + small.join(", "));
    // 3. the card still opens the client
    await card.locator(".client-open").click(); await page.waitForTimeout(600);
    ok(await page.locator(".cw-person").count() === 1 && /Nina/.test(await t(page.locator(".cw-person"))), "a tap on the card opens the client");
    await ctx.close();
    // 4. Srpski and German
    for (const [l, from, add] of [["sr-Latn", "Preko prijave na početnoj stranici · QR", "Dodaj belešku"], ["de", "Über das Formular auf der Startseite · QR", "Notiz hinzufügen"]]) {
      ({ ctx, page } = await open(l));
      const c = page.locator("div.client-row:not(.cw-today)").first();
      ok((await t(c.locator(".client-head"))).includes(from) && (await t(c.locator(".client-note-own"))) === add, `${l}: ${from}; ${add}`);
      await ctx.close();
    }
    // 5. the home page form: the note box, and the link it was opened from
    const ctx2 = await b.newContext({ viewport: { width: 390, height: 900 } }); const hp = await ctx2.newPage(); hp.on("pageerror", (e) => errs.push(e.message));
    let sent = null; await hp.route("**/api/access-request", (r) => { sent = JSON.parse(r.request().postData() || "{}"); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }); });
    await hp.goto(U + "/?home&from=qr"); await hp.waitForTimeout(1500);
    const form = hp.locator(".l-request:not(.l-wait)");
    ok(await form.locator("textarea").getAttribute("placeholder") === "Write your goal, and a few words about you", "the note box says what to write (DT299)");
    await form.locator('input[autocomplete="name"]').fill("Ana"); await form.locator('input[type="email"]').fill("ana.k@example.com");
    await hp.waitForTimeout(4200); await form.getByRole("button", { name: "Send" }).click(); await hp.waitForTimeout(600);
    ok(sent && sent.name === "Ana" && sent.src === "qr", "the form sends the name and the link it was opened from: " + JSON.stringify(sent && { name: sent.name, src: sent.src }));
    await ctx2.close();
    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
  } finally { await b.close(); server.kill(); }
  console.log(fail ? `${fail} FAILED` : "client-card: all passed"); process.exit(fail ? 1 : 0);
})();
