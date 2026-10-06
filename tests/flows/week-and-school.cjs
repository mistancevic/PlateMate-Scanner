// JOURNEY INVARIANT (Milan, 6 October 2026, as approved on the canvas):
// the Weekly plan has real weeks with dates; a change belongs to its date only, the usual week stays;
// earlier weeks can be browsed, and a past day shows what was eaten.
// For anyone under 18 the app switches by itself: School instead of Work, sport at school, no alcohol and no eating window,
// and resting burn from the Schofield equations.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const plan = [
  { work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 },
  { work: true, kind: "rest" },
  { work: true, kind: "cardio", intensity: "moderate", when: "morning", minutes: 45 },
  { work: true, kind: "yoga", intensity: "easy", when: "evening", minutes: 30 },
  { work: true, kind: "strength", intensity: "moderate", when: "morning", minutes: 60 },
  { work: false, kind: "walk", intensity: "easy", when: "day", minutes: 60 },
  { work: false, kind: "rest" },
];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3197" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const open = async (birthYear) => {
    const page = await b.newPage({ viewport: { width: 390, height: 1500 } });
    const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.errs = errs;
    await page.addInitScript(([s, by, pl]) => {
      if (localStorage.getItem("seeded")) return; localStorage.setItem("seeded", "1");
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "calc" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "female", birthYear: by, heightCm: 168, weightKg: 60, dayMode: "each", plan: pl, lifestyle: { hours: "fixed", slot: "9-5", move: "sitting" } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], allergies: [], flags: [], consentBodyAt: "2026-10-05T10:00:00Z", consentBy: "self", none: true, declaredAt: "2026-10-05T10:00:00Z" }));
    }, [seed, birthYear, plan]);
    await page.goto("http://127.0.0.1:3197/"); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Me" }).click(); await page.waitForTimeout(300);
    return page;
  };
  // an adult: weeks with dates
  const a = await open(1981);
  await a.getByText("Weekly plan", { exact: true }).first().click(); await a.waitForTimeout(400);
  const nav = await a.locator(".week-nav").textContent();
  ok(/Week \d+/.test(nav) && /this week/.test(nav), "the plan opens on this week, with its number and dates: " + nav.trim());
  ok(/Today/.test(await a.locator(".agenda-row.on").textContent()), "today is picked and says so");
  // change one date: the agenda says so, the usual week stays
  const rows = a.locator(".agenda-row");
  const target = (await rows.nth(6).getAttribute("aria-pressed")) === "true" ? 5 : 6; // a day that is not today
  await rows.nth(target).click(); await a.waitForTimeout(200);
  const isPast = (await a.getByRole("button", { name: "Change what was planned" }).count()) > 0;
  if (isPast) { await a.getByRole("button", { name: "Change what was planned" }).click(); await a.waitForTimeout(200); }
  await a.locator(".day-editor").getByRole("button", { name: /^Strength$/ }).click(); await a.waitForTimeout(300);
  ok(/Changed for this date/.test(await rows.nth(target).textContent()), "a changed date says so in the agenda");
  const kept = await a.evaluate((i) => JSON.parse(localStorage.getItem("chefmealan-personal")).plan[i].kind, target);
  ok(kept === plan[target].kind, "the usual week stays as it was: " + kept);
  await a.getByRole("tab", { name: "Usual week" }).click(); await a.waitForTimeout(200);
  ok(!/Changed for this date/.test(await a.locator(".week-card").textContent()), "the Usual week tab shows the plan, not the changes");
  // an earlier week, and a past day
  await a.getByRole("tab", { name: "By date" }).click(); await a.waitForTimeout(200);
  await a.getByRole("button", { name: "Week before" }).click(); await a.waitForTimeout(200);
  await a.locator(".agenda-row").nth(0).click(); await a.waitForTimeout(200);
  ok((await a.getByRole("button", { name: "Change what was planned" }).count()) === 1 && /Nothing was logged|What you ate/.test(await a.locator("main").textContent()), "a past day shows what was eaten, or says nothing was");
  ok(/Alcohol/.test(await (async () => { await a.getByRole("button", { name: /Me/ }).first().click().catch(() => {}); await a.locator("nav button").filter({ hasText: "Me" }).click(); await a.waitForTimeout(200); await a.getByText("Lifestyle", { exact: true }).first().click(); await a.waitForTimeout(300); return a.locator("main").textContent(); })()), "an adult is asked about alcohol");
  ok(a.errs.length === 0, "no page errors (adult)" + (a.errs.length ? ": " + a.errs.join("; ") : ""));
  // a 17-year-old: school
  const k = await open(2009);
  await k.getByText("Lifestyle", { exact: true }).first().click(); await k.waitForTimeout(300);
  const life = await k.locator("main").textContent();
  ok(/School hours/.test(life) && /Sport at school/.test(life), "under 18, Work becomes School, with sport at school");
  ok(!/Alcohol/.test(life) && !/Eating window/.test(life), "no alcohol question and no eating window under 18");
  await k.locator("nav button").filter({ hasText: "Me" }).click(); await k.waitForTimeout(200);
  await k.getByText("Weekly plan", { exact: true }).first().click(); await k.waitForTimeout(300);
  ok(/School/.test(await k.locator(".agenda-row").first().textContent()), "the week says School, not Work");
  ok(/Sport at school/.test(await k.locator(".day-editor").textContent()), "a school day can have sport at school");
  await k.locator("nav button").filter({ hasText: "Me" }).click(); await k.waitForTimeout(200);
  await k.getByText("Goal", { exact: true }).first().click(); await k.waitForTimeout(300);
  const how = k.getByRole("button", { name: /How/ }).first();
  if (await how.count()) { await how.click(); await k.waitForTimeout(200); }
  ok(/Schofield/.test(await k.locator("main").textContent()), "under 18, resting burn comes from the Schofield equations");
  ok(k.errs.length === 0, "no page errors (17)" + (k.errs.length ? ": " + k.errs.join("; ") : ""));
  await b.close(); server.kill(); process.exit(fail ? 1 : 0);
})();
