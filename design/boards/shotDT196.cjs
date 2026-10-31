// DT196 (Coach Milan 31 October 21:41 "Privacy. Yes. Redraw"): the privacy leftovers from the tracker: f15 accounts nobody uses
// (12 months, an email, a month later deleted), f16 sign in again after 30 days, and the silent ones f03, f10, f13.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.36, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3393", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-11-05T12:40:00"));
  await page.addInitScript(([s]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed]);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); for (const t of document.querySelectorAll(".toast")) t.style.display = "none"; }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };

  // the notice, section 4 only: hide every other section
  const section4 = async () => {
    await page.goto(U + "/privacy"); await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const hs = [...document.querySelectorAll("h2")]; const h4 = hs.find((h) => h.textContent.startsWith("4."));
      // hide everything between the first h2 and h4, and everything from the h2 after h4
      let on = false; let n = hs[0];
      while (n) { if (n === h4) on = true; else if (n.tagName === "H2" && on) on = false, n.dataset.stop = "1"; if (!on && n !== h4) n.style.display = "none"; if (n.dataset.stop) break; n = n.nextElementSibling; }
      while (n) { n.style.display = "none"; n = n.nextElementSibling; }
      window.scrollTo(0, 0);
    });
  };
  const note = (t, where = "h2") => page.evaluate(({ t, NOTE, where }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; const h = [...document.querySelectorAll(where)].find((x) => x.style.display !== "none"); h.before(d); window.scrollTo(0, 0); }, { t, NOTE, where });
  const after4 = (html) => page.evaluate(({ html }) => { const h4 = [...document.querySelectorAll("h2")].find((h) => h.textContent.startsWith("4.")); h4.nextElementSibling.insertAdjacentHTML("afterend", html); }, { html });
  const P = (t) => `<p style="${mark}">${t}</p>`;

  // a: now: section 4, while your account exists
  await section4();
  await note("Now: section 4 of the privacy notice. Everything is kept while the account exists, also when nobody has opened it for years. Nothing asks you to sign in again. (Tracker f15, f16)");
  await shot("r196a");

  // b: new: two more paragraphs in section 4
  await section4();
  await after4(P("<b>An account nobody uses.</b> When you have not opened Chef Mealan for 12 months, we send one email to the address you signed in with. If you do not open the app within a month after it, the account and everything in it is deleted, the way Delete my account does it. Open the app once and the clock starts again.")
    + P("<b>Sign in again.</b> When you have not opened the app on a phone for 30 days, that phone asks you to sign in again before it shows anything. Nothing is lost: your data is in your account. If a different person signs in on that phone, the phone is cleared first."));
  await note("New: two paragraphs in section 4. The numbers are the ones agreed on 30 October: 12 months and a month's notice; 30 days on a phone.");
  await shot("r196b");

  // c: new: the sign in again screen, drawn on the goal-screen shell
  await page.goto(U + "/privacy"); await page.waitForTimeout(800);
  await page.evaluate(({ mark }) => {
    const main = document.querySelector("main") || document.body;
    for (const c of main.children) c.style.display = "none";
    main.insertAdjacentHTML("beforeend", `<div class="goal-screen" style="${mark}">
      <div class="hero"><h2>Welcome back, Lena</h2><p>It has been more than 30 days since this phone opened Chef Mealan. Sign in again, so we know it is you.</p></div>
      <section class="card"><b>Nothing is lost</b><p class="small">Your foods, plates, recipes and plan are in your account. They are back the moment you sign in.</p>
        <button class="pill pill-primary" style="min-height:44px;width:100%;margin-top:8px">Sign in with Google</button></section>
      <section class="card"><b>Not your phone?</b><p class="small">If someone else signs in here, this phone is cleared first, and nothing of yours is shown to them.</p></section>
    </div>`);
    window.scrollTo(0, 0);
  }, { mark });
  await page.evaluate(({ NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New: the phone asks once, before anything shows. The sign-in is the same Google sign-in as on day one. The app notes the day it was last opened, on the phone, and checks it at start."; document.querySelector(".goal-screen").before(d); }, { NOTE });
  await shot("r196c");

  // d: new: the email after 12 months, drawn as it would read
  await page.goto(U + "/privacy"); await page.waitForTimeout(800);
  await page.evaluate(({ mark }) => {
    const main = document.querySelector("main") || document.body;
    for (const c of main.children) c.style.display = "none";
    main.insertAdjacentHTML("beforeend", `<div class="goal-screen"><section class="card" style="${mark}">
      <small style="display:block;color:var(--muted)">From: Chef Mealan &lt;hello@chefmealan.com&gt;</small>
      <small style="display:block;color:var(--muted)">To: lena@…</small>
      <b style="display:block;margin-top:8px">Your Chef Mealan account</b>
      <p style="line-height:1.5">Hi Lena,</p>
      <p style="line-height:1.5">You have not opened Chef Mealan since 5 November 2025. We do not keep accounts nobody uses.</p>
      <p style="line-height:1.5">Open the app once before 5 December 2026 and your account stays, with everything in it.</p>
      <p style="line-height:1.5">If you do nothing, your account and all its data are deleted on 5 December 2026. This is the same as Delete my account in the app: profile, foods, plates, photos, recipes, the sign-in.</p>
      <p style="line-height:1.5">Want it gone now? Open the app, Menu, Account, Delete my account.</p>
      <p style="line-height:1.5">Coach Milan<br>chefmealan.com</p>
    </section></div>`);
    window.scrollTo(0, 0);
  }, { mark });
  await page.evaluate(({ NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = "New: the one email, sent once, a month before. Plain words, the two dates, no link to tap (a link in an email about deleting an account looks like phishing). No second email. The deletion itself is the server's Delete my account."; document.querySelector(".goal-screen").before(d); }, { NOTE });
  await shot("r196d");

  await b.close(); server.kill();
})();
