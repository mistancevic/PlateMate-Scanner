// HP3 (0.3.42, board Stories147; Coach Milan 1 November 10:48 to 13:24 Go): the home page for individuals and coaches. The top
// bar on one line (Chef Mealan, Coaches, Sign in on a phone); the beta box with the spots left from the number set under
// Clients, the commitment and the waiting list one link away; two ways in; Cook it, Your day, Explorer, the coach section with
// Get a coach code; two more trust lines; the beta form and the waiting list, separate; at 0 spots the waiting list comes first.
// HP5 1d (0.3.46): the first screen is the photo carousel with the button on it; the calculator under it.
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
    const heroAsked = []; page.on("request", (r) => { if (r.url().includes("/landing/hero/")) heroAsked.push(r.url().split("/").pop()); });
    await page.goto(U + "/?home"); await page.waitForTimeout(900);
    ok(heroAsked.length === 1 && heroAsked[0] === "curry-m.webp", "only the first photo loads with the page: " + heroAsked.join(", "));
    await page.waitForTimeout(1200);
    // the top bar, one line
    const top = await page.locator(".l-top").boundingBox();
    const navs = await page.locator(".l-topnav > *").evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none").map((e) => e.textContent.trim()));
    // DT236 v3 (0.3.93): the language switch sits between them
    ok(navs.join("|") === "Coaches|EN|Sign in" && top.height < 70, "the top bar on a phone: Coaches, the language, Sign in, one line: " + navs.join(", ") + ", " + Math.round(top.height) + " px");
    // HP5 1d (0.3.46): the beta box on the first screen, over the photo carousel
    const cta = await txt(".l-photo");
    ok(/Join the beta, free/.test(cta) && /12 spots left in this round/.test(cta) && /Use it most days for four weeks, and tell us what breaks/.test(cta) && /Or join the waiting list/.test(cta) && /Milan's own cooking, at home\./.test(cta), "the beta box on the photo: the button, 12 spots, the commitment, the waiting list link, whose cooking");
    const fold = await page.evaluate(() => ({ b: document.querySelector(".l-photo-cta .l-cta-big").getBoundingClientRect().bottom, own: document.querySelector(".l-photo-own").getBoundingClientRect().bottom, sw: document.documentElement.scrollWidth }));
    ok(fold.own <= 844 && fold.sw === 390, "the button and its lines on the first screen, no sideways scroll: " + JSON.stringify(fold));
    // HP6 (0.3.48): the calculator in the shape of the other sections
    const tc = async (sel) => ((await page.locator(sel).first().textContent()) || "").trim();
    ok((await tc(".l-calc .l-eyebrow")) === "Try it here" && (await tc(".l-calc h2")) === "Make your craving fit your plan" && /^Pick what you crave and a food you have at home/.test(await tc(".l-calc-text p")) && (await page.locator(".l-calc .l-try-box").count()) === 1, "the calculator under the photo: Try it here, the title, one line");
    const gap = await page.evaluate(() => { const l = document.querySelector(".l-photo .l-beta .link").getBoundingClientRect(), p = document.querySelector(".l-photo .l-beta .link").closest("p"); const lh = parseFloat(getComputedStyle(p).lineHeight); return { tap: Math.round(l.height), lines: Math.round(p.getBoundingClientRect().height / lh) , h: Math.round(p.getBoundingClientRect().height), lh }; });
    ok(gap.tap >= 44 && gap.h <= gap.lines * gap.lh + 2, "the waiting-list link is 44 px to tap and keeps the line height: " + JSON.stringify(gap));
    // five photos, the first loads with the page; dots; a tap on a dot shows that dish
    ok((await page.locator(".l-photo-pic").count()) === 5 && (await page.locator(".l-photo-pic.on").getAttribute("data-photo")) === "curry", "five photos, the curry first");
    ok(heroAsked.filter((u) => /curry-m\.webp/.test(u)).length >= 1 && heroAsked.length >= 1, "the curry loads with the page: " + heroAsked.join(", "));
    await page.locator(".l-photo-dots button").nth(2).click(); await page.waitForTimeout(400);
    ok((await page.locator(".l-photo-pic.on").getAttribute("data-photo")) === "quesadilla" && (await page.locator(".l-photo-dots button").nth(2).getAttribute("aria-pressed")) === "true", "a tap on the third dot shows the quesadilla");
    ok(heroAsked.some((u) => /meatballs-m\.webp/.test(u)), "the other photos load after the page");
    await page.waitForTimeout(6200);
    ok((await page.locator(".l-photo-pic.on").getAttribute("data-photo")) === "waffle", "the carousel moves on by itself");
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
    ok((await page.locator(".l-photo-cta .l-cta-big").textContent()) === "Join the waiting list" && /This round of the beta is full/.test(await txt(".l-photo-cta")), "0 spots: the main button is the waiting list");
    const forms = await page.locator("section.l-request h2").allTextContents();
    ok(forms.join("|") === "The waiting list|The next beta round", "0 spots: the waiting list first, then the next beta round: " + forms.join(", "));
    // a phone set to reduce motion: the first photo only, no dots, nothing else loads
    const still = await b.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const stillAsked = []; still.on("request", (r) => { if (r.url().includes("/landing/hero/")) stillAsked.push(r.url().split("/").pop()); });
    await still.goto(U + "/?home"); await still.waitForTimeout(2500);
    ok((await still.locator(".l-photo-pic").count()) === 1 && (await still.locator(".l-photo-dots").count()) === 0 && stillAsked.join() === "curry-m.webp", "reduce motion: the curry only, no dots: " + stillAsked.join(", "));
    // a computer: the large photos, the words at the left
    const desk = await b.newPage({ viewport: { width: 1366, height: 820 } });
    const deskAsked = []; desk.on("request", (r) => { if (r.url().includes("/landing/hero/")) deskAsked.push(r.url().split("/").pop()); });
    await desk.goto(U + "/?home"); await desk.waitForTimeout(1200);
    const dw = await desk.evaluate(() => ({ w: document.querySelector(".l-photo").getBoundingClientRect().width, x: document.querySelector(".l-photo-words").getBoundingClientRect().x, b: document.querySelector(".l-photo-cta .l-cta-big").getBoundingClientRect().bottom }));
    ok(deskAsked.join() === "curry-l.webp" && dw.w === 1366 && dw.x < 400 && dw.b < 820, "a computer: the large curry, full width, the words at the left, the button on the first screen: " + deskAsked.join(", ") + " " + JSON.stringify(dw));
    await still.close(); await desk.close();
    await fetch(U + "/api/beta/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spots: null }) });
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
