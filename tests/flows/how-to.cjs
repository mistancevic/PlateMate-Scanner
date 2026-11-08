// DT260 (0.3.114, board Stories195; Coach Milan 8 November 08:53 to 09:22, Go): How to. The Menu's first row with the count;
// the list by part of the day with New; one situation with its steps, Try it, Tried it and Didn't work with a line that goes
// to Coach Milan; the card on Today below the title and the goal, Not now until the next release.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3488", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  const text = async (sel) => ((await page.locator(sel).first().innerText()) || "").replace(/\s+/g, " ").trim();
  try {
    // 1. Today: the card below the title and the goal
    await page.goto(U + "/today"); await page.waitForTimeout(1200);
    ok(await page.locator(".howto-today").count() === 1, "a card on Today after a release with new ways");
    const below = await page.evaluate(() => { const g = document.querySelector("section.plan").getBoundingClientRect(), c = document.querySelector(".howto-today").getBoundingClientRect(); return c.top >= g.bottom - 1; });
    ok(below, "the card sits below the goal");
    ok(/^2 new ways to use Chef Mealan/.test(await text(".howto-today b")), "it names how many: " + await text(".howto-today b"));
    ok(/Cook hands free\. A recipe in another language\./.test(await text(".howto-today p")), "and which: " + await text(".howto-today p"));
    // 2. See how opens How to
    await page.locator(".ht-see").click(); await page.waitForTimeout(600);
    ok(await text(".menu-title") === "How to", "See how opens How to");
    ok(/Beta: 0 of 8 tried/.test(await text(".ht-beta")), "the beta count");
    ok(/Coach Milan sees what you tried/.test(await text(".ht-beta")), "it says Coach Milan sees what you tried");
    const groups = await page.locator(".ht-group .label").allInnerTexts();
    ok(groups.map((x) => x.toUpperCase()).join("|") === "EVERY DAY|RECIPES AND COOKING|YOUR WEEK", "three parts of the day: " + groups.join("|"));
    ok(await page.locator(".ht-sit").count() === 8, "eight situations");
    ok(await page.locator(".ht-handsFree .ht-new").count() === 1 && await page.locator(".ht-eatNow .ht-new").count() === 0, "New on the new ones only");
    // 3. one situation: steps, Tried it, Didn't work
    await page.locator(".ht-screenshot").click(); await page.waitForTimeout(400);
    ok(await text(".howto-one h3") === "A recipe from a screenshot", "the situation opens");
    ok(await page.locator(".ht-steps li").count() === 4, "four steps");
    ok(/Screenshot/.test(await text(".ht-steps li")), "step 1 names the button: " + await text(".ht-steps li"));
    const small = await page.locator(".howto-one button").evaluateAll((xs) => xs.filter((x) => x.getBoundingClientRect().height < 44).map((x) => x.className + " " + x.getBoundingClientRect().height + " " + getComputedStyle(x).minHeight + " " + getComputedStyle(x).height));
    ok(small.length === 0, "every button at least 44 px: " + small.join(", "));
    const posted = []; page.on("request", (r) => { if (r.url().endsWith("/api/howto") && r.method() === "POST") posted.push(JSON.parse(r.postData() || "{}")); });
    await page.locator(".ht-tried").click(); await page.waitForTimeout(400);
    ok(await page.locator(".ht-tried").getAttribute("aria-pressed") === "true", "Tried it is on");
    ok(posted.length === 1 && posted[0].id === "screenshot" && posted[0].s === "tried", "it goes to Coach Milan: " + JSON.stringify(posted));
    await page.locator(".ht-back").click(); await page.waitForTimeout(300);
    ok(/Beta: 1 of 8 tried/.test(await text(".ht-beta")) && await page.locator(".ht-screenshot .ht-done").count() === 1, "the list counts it");
    await page.locator(".ht-busyDay").click(); await page.waitForTimeout(300);
    await page.locator(".ht-didnt").click(); await page.waitForTimeout(300);
    ok(await text(".howto-ask h3") === "What happened?", "Didn't work asks what happened");
    ok(await page.locator(".ht-send").isDisabled(), "Send waits for a line");
    await page.locator(".ht-note").fill("Step 1: I have no Google account."); await page.locator(".ht-send").click(); await page.waitForTimeout(500);
    ok(posted.length === 2 && posted[1].s === "didnt" && posted[1].note === "Step 1: I have no Google account.", "the note goes to Coach Milan");
    ok(/I have no Google account/.test(await text(".ht-yournote")), "the note stays under the situation");
    const all = await (await fetch(U + "/api/howto")).json();
    const me = (all.testers ?? [])[0]?.items ?? {};
    ok(me.screenshot?.s === "tried" && me.busyDay?.s === "didnt" && me.busyDay?.note === "Step 1: I have no Google account.", "the coach's list holds both: " + JSON.stringify(me));
    // 4. Try it opens the first screen
    await page.locator(".ht-try").click(); await page.waitForTimeout(700);
    ok(/\/me\/calendar$/.test(page.url()), "Try it for A busy day opens Google Calendar: " + page.url());
    await page.goto(U + "/today"); await page.waitForTimeout(1000);
    await page.locator("header .menu-button").click(); await page.waitForTimeout(500);
    ok(await page.locator(".menu-list .menu-row").nth(1).evaluate((x) => x.classList.contains("howto-row")) && /How to\s*1 of 8 tried · 2 new/.test(await text(".howto-row")), "the Menu's second row, under Me (0.3.116): " + await text(".howto-row"));
    await page.locator(".howto-row").click(); await page.waitForTimeout(400);
    await page.locator(".ht-eatNow").click(); await page.waitForTimeout(300);
    await page.locator(".ht-try").click(); await page.waitForTimeout(700);
    ok(/\/plate$/.test(page.url()) && await page.locator(".menu-title").count() === 0, "Try it for What should I eat now? opens the Plate: " + page.url());
    // 5. Not now: gone until the next release
    await page.goto(U + "/today"); await page.waitForTimeout(1000);
    await page.locator(".ht-later").click(); await page.waitForTimeout(300);
    ok(await page.locator(".howto-today").count() === 0, "Not now closes the card");
    await page.reload(); await page.waitForTimeout(1200);
    ok(await page.locator(".howto-today").count() === 0, "and it stays closed in this release");
    // 6. in Srpski and German, no sideways scroll
    for (const l of ["sr-Latn", "de"]) {
      await page.evaluate((l) => localStorage.setItem("chefmealan-lang", l), l);
      await page.goto(U + "/today"); await page.waitForTimeout(900);
      await page.locator("header .menu-button").click(); await page.waitForTimeout(400);
      await page.locator(".howto-row").click(); await page.waitForTimeout(400);
      ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${l}: How to fits the width`);
      ok(!/Every day|Try it/.test(await text(".howto")), `${l}: How to in the language`);
    }
    await page.evaluate(() => localStorage.removeItem("chefmealan-lang"));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
