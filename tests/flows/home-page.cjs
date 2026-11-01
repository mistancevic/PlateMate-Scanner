// HP3 (0.3.42, board Stories147; Coach Milan 1 November 10:48 to 13:24 Go): the home page for individuals and coaches. The top
// bar on one line (Chef Mealan, Coaches, Sign in on a phone); the beta box with the spots left from the number set under
// Clients, the commitment and the waiting list one link away; two ways in; Cook it, Your day, Explorer, the coach section with
// Get a coach code; two more trust lines; the beta form and the waiting list, separate; at 0 spots the waiting list comes first.
// Local runs have no sign-in, so ?home shows the home page.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const PORT = "3319", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const txt = async (sel) => ((await page.locator(sel).first().innerText()) || "").replace(/\s+/g, " ");
  try {
    await fetch(U + "/api/beta/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spots: 12 }) });
    await page.goto(U + "/?home"); await page.waitForTimeout(1500);
    // the top bar, one line
    const top = await page.locator(".l-top").boundingBox();
    const navs = await page.locator(".l-topnav > *").evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none").map((e) => e.textContent.trim()));
    ok(navs.join("|") === "Coaches|Sign in" && top.height < 70, "the top bar on a phone: Coaches, Sign in, one line: " + navs.join(", ") + ", " + Math.round(top.height) + " px");
    // the beta box
    const cta = await txt(".l-cta-hook");
    ok(/Join the beta, free/.test(cta) && /12 spots left in this round/.test(cta) && /most days for four weeks, and tell us what breaks/.test(cta) && /Not ready to test\? Join the waiting list/.test(cta), "the beta box: the button, 12 spots, the commitment, the waiting list link");
    // two ways in; the new sections
    const ways = await page.locator(".l-ways-grid .l-way h3").allTextContents();
    ok(ways.join("|") === "A barcode or a label|A photo of your meal", "two ways in: " + ways.join(", "));
    const h2 = await page.locator(".landing h2").allTextContents();
    for (const h of ["Cook it, hands free", "Your day as it really goes", "Know why, not only what", "Coach your clients' real days", "Join the beta, free", "The waiting list"]) ok(h2.includes(h), "the section: " + h);
    const vids = await page.locator(".landing video source[type='video/mp4']").evaluateAll((s) => s.map((x) => x.getAttribute("src")));
    for (const v of ["cook", "situation", "explorer", "coach"]) {
      const r = await fetch(U + `/landing/way-${v}.mp4`, { method: "HEAD" });
      ok(vids.includes(`/landing/way-${v}.mp4`) && r.ok, `the ${v} clip is on the page and served`);
    }
    // Coach Milan 14:35: who it is for, new; the disclaimer on its own; the line from the book cover
    ok(h2.includes("For people who eat by a plan, and the coaches who make it") && h2.includes("Chef Mealan is not a doctor") && !h2.includes("For adults with a nutrition plan"), "who it is for, and the disclaimer, separate");
    ok(/^Product and recipe builder, and the maker of Chef Mealan\.$/.test((await page.locator(".l-behind .l-role").textContent()).trim()), "Milan's line from the book cover");
    // Coach Milan 14:06: the situations section is Explorer, and says so
    const eyebrows = await page.locator(".l-new .l-eyebrow").allTextContents();
    ok(eyebrows.join("|") === "Cook|Explorer · Situations|Explorer · The body and nutrients", "the new sections' labels: " + eyebrows.join(", "));
    ok(/Papers read again/.test(await txt(".l-built")) && /Nothing kept for nothing/.test(await txt(".l-built")), "two more trust lines");
    // Coaches scrolls to the coach section; Get a coach code opens the beta form as a coach
    await page.getByRole("button", { name: "Coaches", exact: true }).click(); await page.waitForTimeout(2500);
    const cb = await page.locator("#coaches").boundingBox();
    ok(cb && cb.y < 300 && cb.y > -50, "Coaches scrolls to the coach section: y " + (cb && Math.round(cb.y)));
    await page.getByRole("button", { name: "Get a coach code" }).click(); await page.waitForTimeout(900);
    const beta = page.locator("section.l-request").first();
    ok((await beta.getByRole("button", { name: "I am a coach" }).getAttribute("aria-pressed")) === "true", "Get a coach code: the beta form with I am a coach picked");
    // the waiting list: the tick is needed; one email, kept once
    const wait = page.locator("#wait");
    await wait.getByRole("textbox", { name: "Email for the waiting list" }).fill("lena@example.com");
    ok(await wait.getByRole("button", { name: "Join the waiting list" }).isDisabled(), "the waiting list needs the tick");
    await wait.getByRole("button", { name: "I train on my own" }).click();
    await wait.locator("input[type=checkbox]").check(); await page.waitForTimeout(3200);
    await wait.getByRole("button", { name: "Join the waiting list" }).click(); await page.waitForTimeout(800);
    ok(/You're on the waiting list\. We write to lena@example\.com once/.test(await txt("#wait")), "joined: the line says it");
    const list = await (await fetch(U + "/api/waitlist", { headers: { "x-local-as": "coach" } })).json().catch(() => ({}));
    ok((list.waiting || []).some((x) => x.email === "lena@example.com" && x.who === "self"), "the waiting list holds the email and which fits: " + JSON.stringify(list).slice(0, 160));
    // the notice says it
    await page.goto(U + "/privacy"); await page.waitForTimeout(800);
    ok(/The waiting list, from the home page\./.test(await txt("main, body")), "the privacy notice names the waiting list");
    // spots at 0: the waiting list comes first and is the main button
    await fetch(U + "/api/beta/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spots: 0 }) });
    await page.goto(U + "/?home"); await page.waitForTimeout(1500);
    ok((await page.locator(".l-cta-hook .l-cta-big").textContent()) === "Join the waiting list" && /This round of the beta is full/.test(await txt(".l-cta-hook")), "0 spots: the main button is the waiting list");
    const forms = await page.locator("section.l-request h2").allTextContents();
    ok(forms.join("|") === "The waiting list|The next beta round", "0 spots: the waiting list first, then the next beta round: " + forms.join(", "));
    await fetch(U + "/api/beta/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spots: null }) });
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
