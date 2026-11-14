// DT299 (0.3.147, board Stories220; Coach Milan 14 November 2026, Go 14:25): the home page forms say what is required.
// A label above each box, * on the required ones, (optional) on the rest; the grey text inside says what to do; Send can always
// be tapped, and a missing or wrong required box turns red and says what to do. Neutral lines. The waiting list and the book
// page's form the same. Srpski and German at 360 px.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const PORT = "3512", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (url, lang = "en", width = 390) => { const ctx = await b.newContext({ viewport: { width, height: 900 } }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    if (lang !== "en") await page.addInitScript((l) => localStorage.setItem("chefmealan-lang", l), lang);
    let sent = []; await page.route("**/api/access-request", (r) => { sent.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }); });
    await page.goto(U + url); await page.waitForTimeout(1500); return { ctx, page, sent }; };
  const t = async (l) => ((await l.count()) ? (await l.first().innerText()).replace(/\s+/g, " ").trim() : "");
  try {
    let { ctx, page, sent } = await open("/?home");
    const form = page.locator(".l-request:not(.l-wait)");
    // 1. labels, required and optional
    const labels = await form.locator(".l-label").evaluateAll((xs) => xs.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
    ok(labels.join("|") === "Name *|Email *|Mobile number (optional)|A short note (optional)", "labels above the boxes, * and (optional): " + labels.join(" | "));
    ok(/Which fits you\? \(optional\)/.test(await t(form.locator(".setting-name"))) && (await t(form.locator(".l-req"))) === "* required", "Which fits you? (optional); * required above Send");
    // 2. the grey text says what to do
    const ph = await form.locator(".l-field input, .l-field textarea").evaluateAll((xs) => xs.map((x) => x.placeholder));
    ok(ph.join("|") === "Type your name|Type the email you'll sign in with|Start with + and your country code|Write your goal, and a few words about you", "the grey text says what to do: " + ph.join(" | "));
    // 3. neutral lines
    const all = await t(form);
    ok(/and you get a personal code by email\./.test(all) && /You may get a message on WhatsApp or by text about joining\./.test(all) && !/Coach Milan/.test(all), "no name in the form's lines");
    // 4. Send can always be tapped; missing boxes say so, nothing is sent
    const send = form.getByRole("button", { name: "Send" });
    ok(!(await send.isDisabled()), "Send can be tapped with nothing filled");
    await send.click(); await page.waitForTimeout(400);
    const e1 = await form.locator(".l-err").allInnerTexts();
    ok(e1.join("|") === "Add your name|Add your email" && sent.length === 0, "empty: Add your name, Add your email, nothing sent: " + e1.join(" | "));
    ok(await form.locator(".l-field.l-bad").count() === 2 && await form.locator('input[aria-invalid="true"]').count() === 2, "both boxes are marked");
    await form.locator('input[autocomplete="name"]').fill("Ana"); await form.locator('input[type="email"]').fill("ana.k.example.com"); await page.waitForTimeout(200);
    const e2 = await form.locator(".l-err").allInnerTexts();
    ok(e2.join("|") === "Check the email: it needs an @", "a wrong email says so, the name's line is gone: " + e2.join(" | "));
    await send.click(); await page.waitForTimeout(300); ok(sent.length === 0, "still nothing sent");
    await form.locator('input[type="email"]').fill("ana.k@example.com"); await page.waitForTimeout(4200);
    await send.click(); await page.waitForTimeout(600);
    ok(sent.length === 1 && sent[0].name === "Ana" && sent[0].email === "ana.k@example.com" && /Thanks, Ana/.test(await t(form)), "filled: sent once, with the thanks");
    await ctx.close();
    // 5. the waiting list
    ({ ctx, page } = await open("/?home"));
    const wait = page.locator("#wait");
    ok((await t(wait.locator(".l-label"))) === "Email *" && (await wait.locator(".l-field input").getAttribute("placeholder")) === "Type your email address" && /hello@chefmealan\.com\. \*/.test(await t(wait.locator(".l-consent"))), "the waiting list: Email *, the tick *");
    await wait.getByRole("button", { name: "Join the waiting list" }).click(); await page.waitForTimeout(300);
    const e3 = await wait.locator(".l-err").allInnerTexts();
    ok(e3.join("|") === "Add your email|Tick the box, so we may write to you when it opens", "tapped empty: both say what is missing: " + e3.join(" | "));
    await ctx.close();
    // 6. the book page's form is the same component (RequestForm); it shows signed out only, which a local run cannot be
    // 7. Srpski and German fit 360 px
    for (const [l, name, miss] of [["sr-Latn", "Ime *", "Dodaj svoje ime"], ["de", "Name *", "Füge deinen Namen hinzu"]]) {
      ({ ctx, page } = await open("/?home", l, 360));
      const f = page.locator(".l-request:not(.l-wait)");
      await f.locator(".l-form > button.pill-primary").click(); await page.waitForTimeout(300);
      ok((await t(f.locator(".l-label"))) === name && (await t(f.locator(".l-err"))) === miss && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${l}: ${name}, ${miss}, fits 360 px`);
      await ctx.close();
    }
    ok(errs.length === 0, "no page errors: " + errs.join(" | "));
  } finally { await b.close(); server.kill(); }
  console.log(fail ? `${fail} FAILED` : "home-forms: all passed"); process.exit(fail ? 1 : 0);
})();
