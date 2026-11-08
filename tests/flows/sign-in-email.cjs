// DT259 (0.3.113, board Stories194; Coach Milan Go 8 November 09:12): sign in with any email. Sign in on the home page opens
// the choice under the top bar: Continue with Google, or your email and Send me a link. Check your inbox names spam; Send it
// again waits 60 seconds. The link back on the same phone signs in with no question; on another phone it asks for the email.
// Local runs have no Firebase: window.__authStub stands in for it (the live app has none).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const PORT = "3487", U = `http://127.0.0.1:${PORT}`;
const STUB = () => {
  window.__sent = []; window.__finished = [];
  window.__authStub = {
    sendLink: async (e, p) => { window.__sent.push([e, p]); },
    isLink: (href) => href.includes("oobCode="),
    finishLink: async (e, p) => { window.__finished.push([e, p]); },
  };
};
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const fresh = async (keep) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.install();
    await page.addInitScript(STUB);
    if (keep) await page.addInitScript((e) => { localStorage.setItem("chefmealan-link-email", e); localStorage.setItem("chefmealan-link-at", String(Date.now())); }, keep);
    return page;
  };
  const text = async (page, sel) => ((await page.locator(sel).first().innerText()) || "").replace(/\s+/g, " ").trim();
  try {
    // 1. Sign in opens the choice; nothing goes to Google by itself
    let page = await fresh();
    await page.goto(U + "/?home"); await page.waitForTimeout(900);
    ok(await page.locator(".signin-panel").count() === 0, "no panel before Sign in");
    await page.locator(".l-signin").click(); await page.waitForTimeout(300);
    ok(await page.locator(".signin-panel").isVisible(), "Sign in opens the panel");
    const top = await page.evaluate(() => { const h = document.querySelector(".l-top").getBoundingClientRect(), p = document.querySelector(".signin-panel").getBoundingClientRect(); return p.top >= h.bottom - 1; });
    ok(top, "the panel sits under the top bar");
    ok(await text(page, ".si-google") === "Continue with Google", "Continue with Google first");
    ok(/Any email works/.test(await text(page, ".si-line")), "the line says any email works");
    ok(await page.locator(".si-send").isDisabled(), "Send me a link waits for an email");
    const small = await page.locator(".signin-panel button, .signin-panel input").evaluateAll((xs) => xs.filter((x) => x.getBoundingClientRect().height > 0 && x.getBoundingClientRect().height < 44).map((x) => x.className));
    ok(small.length === 0, "every button and the field at least 44 px: " + small.join(", "));
    // 2. a wrong email is named; a right one sends the link
    await page.locator(".si-email").fill("dajana@hotmail"); await page.locator(".si-send").click(); await page.waitForTimeout(200);
    ok(await text(page, ".si-err") === "Check the email.", "an email without its ending: Check the email.");
    await page.locator(".si-email").fill("Dajana@Hotmail.com "); await page.locator(".si-send").click(); await page.waitForTimeout(300);
    const sent = await page.evaluate(() => window.__sent);
    ok(sent.length === 1 && sent[0][0] === "dajana@hotmail.com" && sent[0][1] === "signin", "the link goes to the email, small letters: " + JSON.stringify(sent));
    ok(await text(page, ".signin-panel h2") === "Check your inbox", "Check your inbox");
    ok(/We sent a link to dajana@hotmail\.com\./.test(await text(page, ".si-sent")), "it names the email");
    ok(/Look in spam/.test(await text(page, ".signin-panel .si-line")), "it names spam");
    ok(await page.locator(".si-again").isDisabled() && /Send it again in 1:00|Send it again in 0:59/.test(await text(page, ".si-again")), "Send it again waits: " + await text(page, ".si-again"));
    ok(await page.evaluate(() => localStorage.getItem("chefmealan-link-email")) === "dajana@hotmail.com", "the email is kept on this phone for the link");
    await page.clock.fastForward(30_000); await page.waitForTimeout(200);
    ok(/in 0:3\d/.test(await text(page, ".si-again")), "half a minute later it still waits: " + await text(page, ".si-again"));
    await page.clock.fastForward(31_000); await page.waitForTimeout(200);
    ok(!(await page.locator(".si-again").isDisabled()) && await text(page, ".si-again") === "Send it again", "after a minute: Send it again");
    await page.locator(".si-again").click(); await page.waitForTimeout(300);
    ok((await page.evaluate(() => window.__sent)).length === 2 && await page.locator(".si-again").isDisabled(), "sent again, and it waits again");
    await page.locator(".si-other").click(); await page.waitForTimeout(200);
    ok(await page.locator(".si-email").isVisible(), "Use another email goes back to the field");
    await page.locator(".si-cancel").click(); await page.waitForTimeout(200);
    ok(await page.locator(".signin-panel").count() === 0, "Cancel closes it");
    await page.context().close();
    // 3. the link back on the same phone: no question
    page = await fresh("dajana@hotmail.com");
    await page.goto(U + "/?home&link=signin&apiKey=k&oobCode=abc&mode=signIn"); await page.waitForTimeout(900);
    const fin = await page.evaluate(() => window.__finished);
    ok(fin.length === 1 && fin[0][0] === "dajana@hotmail.com" && fin[0][1] === "signin", "the same phone signs in with the kept email: " + JSON.stringify(fin));
    ok(!page.url().includes("oobCode"), "the link leaves the address bar");
    ok(await page.evaluate(() => localStorage.getItem("chefmealan-link-email")) === null, "the kept email goes once used");
    await page.context().close();
    // 4. on another phone: Which email is this link for?
    page = await fresh();
    await page.goto(U + "/?home&link=signin&apiKey=k&oobCode=abc&mode=signIn"); await page.waitForTimeout(900);
    ok(await text(page, ".signin-panel h2") === "Which email is this link for?", "another phone asks for the email");
    ok(await page.locator(".si-finish").isDisabled(), "Sign in waits for an email");
    await page.locator(".si-email").fill("dajana@hotmail.com"); await page.locator(".si-finish").click(); await page.waitForTimeout(300);
    ok(JSON.stringify(await page.evaluate(() => window.__finished)) === JSON.stringify([["dajana@hotmail.com", "signin"]]), "it signs in with the typed email");
    await page.context().close();
    // 5. in Srpski and German
    for (const [l, h, s] of [["sr-Latn", "Prijava", "Pošalji mi link"], ["de", "Anmelden", "Schick mir einen Link"]]) {
      page = await fresh();
      await page.addInitScript((l) => localStorage.setItem("chefmealan-lang", l), l);
      await page.goto(U + "/?home"); await page.waitForTimeout(900);
      await page.locator(".l-signin").click(); await page.waitForTimeout(300);
      ok(await text(page, ".signin-panel h2") === h && await text(page, ".si-send") === s, `${l}: ${await text(page, ".signin-panel h2")}, ${await text(page, ".si-send")}`);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      ok(wide, `${l}: no sideways scroll`);
      await page.context().close();
    }
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
