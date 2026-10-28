// JOURNEY (0.2.128, DT147, board Stories99 version 2; Tester 3 works Canadian hours from Cyprus; Coach Milan 28 October, Go at
// 23:13): Working hours keeps 9 to 5, 8 to 4 and 7 to 3 and adds My hours, From and To. Then the hours count: meal times not set
// by hand fit around work, a time set by hand wins; training is suggested outside work, and every part of the day stays open;
// the chat knows the hours. Every time is one line, never past the card. How you eat reads What you eat. On Training week a day
// opens under itself and stays open until tapped again; Work or day off says what it is for; Move and Copy are one line at the
// end; a day off says Day off on the right.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const PORT = "3319", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  try {
    const page = await b.newPage({ viewport: { width: 375, height: 900 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-28T21:55:00"));
    const plan = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ work: i < 5, kind: "rest" }));
    await page.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, plan, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-28T16:00:00Z", consentBodyAt: "2026-10-28T16:00:00Z", declaredAt: "2026-10-28T16:00:00Z", aiConfirmedAt: "2026-10-28T16:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed, plan]);
    await require("./adult.cjs")(page);
    let outBody = null;
    await page.route("**/api/out", async (r) => { outBody = JSON.parse(r.request().postData() || "{}"); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reply: "Eat at 15:00, before work.", recognised: [], picks: [], skip: [], named: [] }) }); });
    const personal = () => page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")));
    const setting = (name) => page.locator(".setting").filter({ has: page.locator(".setting-name", { hasText: new RegExp(`^${name}$`) }) }).first();
    await page.goto(U + "/me/lifestyle"); await page.waitForTimeout(1500);
    // 9 to 5: the usual times already fit around work and stay
    const times = async () => (await setting("Meal times").locator("input[type=time]").evaluateAll((xs) => xs.map((x) => x.value))).join(" ");
    ok(await times() === "07:30 13:45 20:00", "9 to 5 keeps 07:30, 13:45, 20:00: " + await times());
    ok(await page.locator(".setting-name", { hasText: /^What you eat$/ }).count() === 1 && await page.locator(".setting-name", { hasText: /^How you eat$/ }).count() === 0, "How you eat reads What you eat");
    // My hours: From and To
    const wh = setting("Working hours");
    ok((await wh.locator(".chip-row button").allTextContents()).join("|") === "9 to 5|8 to 4|7 to 3|My hours", "three chips first, then My hours");
    await wh.getByRole("button", { name: "My hours" }).click(); await page.waitForTimeout(300);
    await page.getByLabel("Work from").fill("16:00"); await page.getByLabel("Work to").fill("23:00"); await page.waitForTimeout(400);
    let pe = await personal();
    ok(pe.lifestyle.slot === "my" && pe.lifestyle.workFrom === "16:00" && pe.lifestyle.workTo === "23:00", "My hours kept: 16:00 to 23:00");
    ok(/16:00 to 23:00, your time\. Meals and training fit around it\./.test(await wh.textContent()), "the line says your time");
    ok(await times() === "10:00 15:00 19:30", "late work: breakfast late morning, the main meal an hour before work, a small one at the break: " + await times());
    ok(/From your work hours, 16:00 to 23:00: breakfast late morning, the main meal an hour before work, a small one at the break\. Change any time and yours stays\./.test(await setting("Meal times").textContent()), "the line says where the times come from");
    // every time on one line, inside the card
    const inside = await page.evaluate(() => [...document.querySelectorAll(".time-row")].every((r) => { const card = r.closest(".card, section"); const a = r.querySelector("input").getBoundingClientRect(), c = card.getBoundingClientRect(); return a.right <= c.right && Math.abs(a.top - r.querySelector("span").getBoundingClientRect().top) < 30; }));
    ok(inside, "each time sits on its name's line, inside the card");
    // a time you set wins; the others still follow work
    await page.getByLabel("Breakfast time").fill("09:15"); await page.waitForTimeout(300);
    ok(await times() === "09:15 15:00 19:30", "a time you set wins: " + await times());
    await page.getByLabel("Work from").fill("15:00"); await page.waitForTimeout(300);
    ok(await times() === "09:15 14:00 19:00", "work moves: the times not set by hand follow, yours stays: " + await times());
    await page.getByLabel("Work from").fill("16:00"); await page.waitForTimeout(300);
    // past midnight
    await page.getByLabel("Work to").fill("01:00"); await page.waitForTimeout(300);
    ok(/16:00 to 01:00 the next day, your time/.test(await wh.textContent()), "hours past midnight end the next day");
    await page.getByLabel("Work to").fill("23:00"); await page.waitForTimeout(300);
    // Training week: the day opens under itself; Work or day off; training suggested outside work
    await page.goto(U + "/me/training-week"); await page.waitForTimeout(1300);
    ok(await page.locator(".agenda-open").count() === 0, "no day open at first");
    ok((await page.locator(".agenda-row").nth(5).locator("small").last().textContent()).trim() === "Day off" && (await page.locator(".agenda-row").nth(0).locator("small").last().textContent()).trim() === "Work", "Work and Day off on the right");
    await page.locator(".agenda-row").nth(1).click(); await page.waitForTimeout(300);
    const tue = page.getByRole("group", { name: "Tuesday, every week" });
    const between = await page.evaluate(() => { const r = document.querySelectorAll(".agenda-row"); const o = document.querySelector(".agenda-open"); return r[1].compareDocumentPosition(o) & 4 && o.compareDocumentPosition(r[2]) & 4; });
    ok(!!between, "Tuesday opens between Tuesday and Wednesday");
    ok(/^Work or day off/.test(await tue.locator(".setting-name").first().textContent()) && /Not your training: how the rest of the day goes\. A work day counts how you move at work; your training comes on top\. Your work hours, 16:00 to 23:00, keep training suggestions out of work\./.test(await tue.textContent()), "Work or day off says what it is for");
    ok(await tue.getByRole("button", { name: /Move to another day/ }).count() === 0 && await tue.getByRole("button", { name: /Copy to other days/ }).count() === 1, "a day without training: only Copy");
    await tue.locator(".day-editor").getByRole("button", { name: "Strength", exact: true }).click(); await page.waitForTimeout(300);
    pe = await personal();
    ok(pe.plan[1].when === "morning", "a new training day is suggested outside work: " + pe.plan[1].when);
    const when = tue.locator(".setting").filter({ has: page.locator(".setting-name", { hasText: /^When$/ }) });
    const ev = when.getByRole("button", { name: /Evening/ });
    ok(/in work hours/.test(await ev.textContent()) && await ev.isEnabled(), "Evening says in work hours and stays open");
    ok(/Chef Mealan suggests training outside your work hours, 16:00 to 23:00\. Every time stays open: a break at work can be gym time\./.test(await when.textContent()), "the line under When");
    await ev.click(); await page.waitForTimeout(300);
    ok((await personal()).plan[1].when === "evening", "Evening picked at work: kept");
    ok(await tue.locator(".chip-row[aria-label='How hard'] button").count() === 3 && /Zone 2/.test(await tue.locator(".hard-zones").textContent()) && !/Zone 4/.test(await tue.locator(".hard-zones").textContent()), "How hard: three chips, the zones of the one picked");
    ok(await tue.getByRole("button", { name: /Move to another day/ }).count() === 1, "a training day: Move and Copy in one line");
    // another day opens too; a second tap closes
    await page.locator(".agenda-row").nth(3).click(); await page.waitForTimeout(300);
    ok(await page.locator(".agenda-open").count() === 2, "Thursday opens; Tuesday stays open");
    await page.locator(".agenda-row").nth(1).click(); await page.waitForTimeout(300);
    ok(await page.locator(".agenda-open").count() === 1 && await page.getByRole("group", { name: "Tuesday, every week" }).count() === 0, "a second tap on Tuesday closes it");
    // Move: Thursday has no training; open Tuesday again and move it
    await page.locator(".agenda-row").nth(1).click(); await page.waitForTimeout(300);
    await page.getByRole("group", { name: "Tuesday, every week" }).getByRole("button", { name: /Move to another day/ }).click(); await page.waitForTimeout(200);
    await page.getByRole("group", { name: "Move Tuesday to" }).getByRole("button", { name: "Wed" }).click(); await page.waitForTimeout(400);
    pe = await personal();
    ok(pe.plan[2].kind === "strength" && pe.plan[2].when === "evening" && pe.plan[1].kind === "rest", "Move Tuesday to Wednesday keeps its time");
    // the chat knows the work hours
    await page.goto(U + "/"); await page.waitForTimeout(1200);
    await page.locator(".chat-fab").first().click(); await page.waitForTimeout(800);
    await page.locator(".talk-overlay .chat-input input").first().fill("When should I eat today?"); await page.locator(".talk-overlay .chat-input").getByRole("button", { name: "Send" }).click(); await page.waitForTimeout(1200);
    ok(outBody && outBody.work && outBody.work.from === "16:00" && outBody.work.to === "23:00", "the chat is sent the work hours: " + JSON.stringify(outBody?.work));
    // Me says the hours
    await page.goto(U + "/me"); await page.waitForTimeout(1000);
    ok(/Work, fixed hours, 16:00 to 23:00/.test(await page.locator("main").first().textContent()), "Me says Work, fixed hours, 16:00 to 23:00");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
