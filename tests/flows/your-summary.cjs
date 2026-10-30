// DT167 (0.3.9, board Stories119 versions 1 and 2; Coach Milan 30 October 08:47 to 09:59): Your summary, the last row of Me and
// where the steps end; Taste in Lifestyle; Plan your week and Craft your first meal; what the coach sees, part by part, health
// data off until switched on; on the coach's side, the shared profile with what changed since the coach last looked.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3270" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const LIFE = { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3, wake: "early", bed: "mid", where: ["Cook at home", "Canteen at work"], diet: "Everything", alcohol: "Occasionally", travel: "sometimes" };
  await page.addInitScript(([s, life]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify({ ...s, preferences: "no coriander" }));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: life, tasteChips: { like: ["Creamy"], not: ["Sour"], how: [] } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed, LIFE]);
  await require("./adult.cjs")(page);
  const U = "http://127.0.0.1:3270/";
  const toMe = async () => { await page.goto(U); await page.waitForTimeout(900); await page.getByRole("button", { name: "Menu" }).first().click(); await page.waitForTimeout(300); await page.getByRole("button", { name: /^Me\b/ }).first().click(); await page.waitForTimeout(500); };
  await toMe();
  const rows = (await page.locator(".me-rows .menu-row b").allTextContents());
  ok(rows.join(",") === "Profile,Goal,Lifestyle,Training week,Google Calendar,Where I shop and cook,My coach,Your summary,Account", "Me: the steps, Your summary, then Account: " + rows.join(","));
  ok(await page.locator(".taste-card").count() === 0, "Taste no longer sits alone at the bottom of Me");
  await page.locator(".me-rows .menu-row", { hasText: "Lifestyle" }).click(); await page.waitForTimeout(500);
  const names = await page.locator(".seg").last().locator(".setting-name").allTextContents();
  ok(names.slice(0, 4).join(",") === "Where you eat,What you eat,Taste,Alcohol" && await page.locator(".taste-card .choice.on", { hasText: "Creamy" }).count() === 1, "Taste in Lifestyle, under Nutrition, after What you eat: " + names.join(","));
  // the steps end on Your summary
  await toMe(); await page.locator(".me-rows .menu-row", { hasText: "My coach" }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Next: Your summary/ }).click(); await page.waitForTimeout(500);
  ok(await page.locator(".menu-title").textContent() === "Your summary", "My coach's Next leads to Your summary");
  const heads = await page.locator(".summary .seg-head b").allTextContents();
  ok(heads.join(",") === "You,Goal and numbers,Your day,How you eat,Training week,Where you shop and cook,Health questions", "every part, by step: " + heads.join(","));
  const text = (k) => page.locator(".sum-row", { hasText: k }).first().innerText().then((t) => t.replace(/\s+/g, " ").trim());
  ok(/Body\s*health data Male, born 1981, 182 cm, 85 kg Your resting burn, about 1,770 kcal, and your protein range\. Numbers only/.test(await text("Body")), "You: body data, health data, numbers only: " + await text("Body"));
  ok(/Wake-up and bedtime Before 6:00 · 22:00 to midnight Your meals at 06:30, 13:15 and 20:00\. ✓ Chef reads/.test(await text("Wake-up and bedtime")), "Your day: wake-up and bedtime with the meal times they set");
  ok(/Where you eat Cook at home · Canteen at work .* ✓ Chef reads/.test(await text("Where you eat")) && /✓ Chef reads/.test(await text("Work travel")), "Where you eat and Work travel: Chef Mealan reads them now");
  ok(/Taste, in your own words no coriander/.test(await text("Taste, in your own words")), "taste in your own words, in the summary");
  // the next steps
  ok(await page.getByRole("button", { name: /Plan your week/ }).count() === 1 && await page.getByRole("button", { name: /Craft your first meal/ }).count() === 1 && await page.getByRole("button", { name: "Save as PDF" }).count() === 1, "Plan your week, Craft your first meal, Save as PDF");
  ok(await page.getByRole("button", { name: /^Choose what/ }).count() === 0, "without a coach, nothing to choose for one");
  await page.getByRole("button", { name: /Craft your first meal/ }).click(); await page.waitForTimeout(600);
  ok(/\/plate|\/journey|plate/i.test(page.url()) || await page.locator(".menu-title").count() === 0, "Craft your first meal opens Plate: " + page.url());
  await toMe(); await page.locator(".me-rows .menu-row", { hasText: "Your summary" }).click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Plan your week/ }).click(); await page.waitForTimeout(600);
  ok(await page.locator(".plan-day-head").count() > 0, "Plan your week opens Plan");
  // what the coach sees, chosen once (the example coach, ?coachdemo, stands in for an account)
  await page.goto(U + "me/summary?coachdemo"); await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /^Choose what .* sees$/ }).click(); await page.waitForTimeout(400);
  const st = async (n) => (await page.getByRole("button", { name: new RegExp(`^${n}: `) }).getAttribute("aria-label")).split(": ")[1];
  ok([await st("Goal and numbers"), await st("Your day"), await st("How you eat"), await st("What you eat"), await st("Alcohol"), await st("In your own words"), await st("Allergies and intolerances"), await st("Your body data")].join(",") === "on,on,on,off,off,off,off,off", "by default: the everyday parts on; diet, alcohol, own words, allergies and body data off");
  ok(await page.getByRole("button", { name: "Health questions: your coach sees it" }).isDisabled(), "the health questions stay as today: which and when");
  await page.getByRole("button", { name: /^Your body data: / }).click(); await page.getByRole("button", { name: /^Alcohol: / }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(500);
  const cs = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).coachShare);
  ok(cs && /^\d{4}-/.test(cs.on.body) && cs.on.alcohol && cs.off.includes("diet") && !cs.on.health, "saved: body data switched on with its date, your consent: " + JSON.stringify(cs).slice(0, 160));
  ok(/sees 8 of 11 parts, kept up to date/.test(await page.locator(".sum-foot").textContent()), "the summary says how much the coach sees");
  // the coach's side (example clients, ?coachdemo): what changed on the row and at the top of the page, the shared parts below
  await page.goto(U + "today?coachdemo"); await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /^Clients$/ }).first().click(); await page.waitForTimeout(800);
  const dav = page.locator(".cw-row", { hasText: "Davorka" }).first();
  ok(/Profile: 2 changes since you looked/.test(await dav.textContent()), "Clients marks a client whose shared profile changed");
  await dav.click(); await page.waitForTimeout(600);
  const ch = (await page.locator(".profile-changes").innerText()).replace(/\s+/g, " ");
  ok(/What changed since you last looked \d+ \w+ Wake-up and bedtime: 6:00 to 8:00 · 22:00 to midnight → Before 6:00 · 22:00 to midnight\. \d+ \w+ Meals: 3 a day, .* → 3 a day, 06:30/.test(ch), "the client's page starts with what changed: " + ch.slice(0, 200));
  const sp = (await page.locator(".shared-profile").innerText()).replace(/\s+/g, " ");
  ok(/Davorka's profile/.test(sp) && /Not shared What you eat, alcohol, in your own words, allergies and intolerances, your body data\. Davorka keeps these to themselves\./.test(sp) && !/Alcohol On weekends/.test(sp) && !/born 1985/.test(sp), "the shared parts below, what wasn't shared said, no private row: " + sp.slice(-260));
  await page.getByRole("button", { name: "‹ Clients" }).click(); await page.waitForTimeout(400);
  ok(!/Profile: \d+ change/.test(await page.locator(".cw-row", { hasText: "Davorka" }).first().textContent()), "looked at: the mark goes");
  // DT172 (privacy finding 14, option a): Lena shares no body data: her coach sees the trend in percent, no kilogram
  await page.locator(".cw-row", { hasText: "Lena" }).first().click(); await page.waitForTimeout(600);
  const lp = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  ok(/In percent of their weight: they share no body data\./.test(lp) && /Weigh-ins 2 this week|Weigh-ins \d this week/.test(lp) && !/\b6\d\.\d kg\b/.test(lp), "DT172: without body data, weigh-ins in percent and days weighed, no kilogram: " + (lp.match(/Weigh-ins[^.]*\./) || [""])[0]);
  ok(errs.length === 0, errs.length ? "page errors: " + errs.join(" | ") : "no page errors");
  await b.close(); server.kill();
  process.exit(fail ? 1 : 0);
})();
