// JOURNEY INVARIANT (Milan, 6 October 2026, as approved on the canvas):
// Plan has real weeks with dates; a change belongs to its date only, the Training week stays;
// earlier weeks can be browsed, and a past day shows what was eaten (canvas board TW, 13 October 2026).
// Release A (Milan, 7 October 2026): Chef Mealan is for adults. A birth year under 18 stops at "Chef Mealan is for adults",
// with the reason (the AI) and a way to correct the year.
// Release B (Milan, 7 October 2026, canvas B0 to B3): any adult can work, study, or both, or be at home. Lifestyle asks
// what fills the weekdays first, and only the questions that fit follow. A day is a Work day, a Study day or a Day off;
// the week keeps its colors, and Today says "Study day" on a study day.
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
  const open = async (birthYear, life = { hours: "fixed", slot: "9-5", move: "sitting" }) => {
    const page = await b.newPage({ viewport: { width: 390, height: 1500 } });
    const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.errs = errs;
    await page.addInitScript(([s, by, pl, li]) => {
      if (localStorage.getItem("seeded")) return; localStorage.setItem("seeded", "1");
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "calc" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "female", birthYear: by, heightCm: 168, weightKg: 60, dayMode: "each", plan: pl, lifestyle: li }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], allergies: [], flags: [], consentBodyAt: "2026-10-05T10:00:00Z", consentBy: "self", none: true, declaredAt: "2026-10-05T10:00:00Z", adultAt: "2026-10-05T09:00:00Z" }));
    }, [seed, birthYear, plan, life]);
    await page.goto("http://127.0.0.1:3197/"); await page.waitForTimeout(900);
    if (birthYear > new Date().getFullYear() - 18) return page;
    await require("./me.cjs")(page);
    return page;
  };
  // an adult (canvas board TW, 13 October 2026): the Training week holds the usual week only; Plan is the one calendar with
  // dates. A change on Plan belongs to its date only, and the usual week stays.
  const a = await open(1981);
  await a.getByText("Training week", { exact: true }).first().click(); await a.waitForTimeout(400);
  ok(await a.locator(".seg-tabs").count() === 0 && await a.locator(".week-nav").count() === 0 && /Your usual training week/.test(await a.locator(".week-card").textContent()), "the Training week has no tabs and no dates");
  ok(a.url().endsWith("/me/training-week"), "its address is /me/training-week: " + a.url());
  await a.goto("http://127.0.0.1:3197/me/weekly-plan"); await a.waitForTimeout(900);
  ok(/Training week/.test(await a.locator(".menu-title").textContent()), "the old address still opens it");
  // Plan: next Wednesday holds cardio; its training row opens this date only
  await a.getByRole("button", { name: /^Plan$/ }).first().click(); await a.waitForTimeout(500);
  await a.evaluate(() => document.querySelectorAll(".day-strip .choice")[9].click()); await a.waitForTimeout(300);
  ok(/From my Training week/.test(await a.locator(".plan-training").textContent()), "the training row comes from the Training week");
  await a.locator(".plan-training").click(); await a.waitForTimeout(300);
  ok(/This date only/.test(await a.locator(".date-sheet").textContent()) && await a.locator(".date-sheet .day-editor").count() === 1, "the training row opens the day editor, for this date only");
  await a.locator(".date-sheet .day-editor").getByRole("button", { name: /^Strength$/ }).click(); await a.waitForTimeout(200);
  await a.getByRole("button", { name: "Save for this date" }).click(); await a.waitForTimeout(300);
  ok(/Changed for this date/.test(await a.locator(".plan-training").textContent()) && /Strength/.test(await a.locator(".plan-training").textContent()), "the changed date says so on Plan");
  const kept = await a.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).plan[2].kind);
  ok(kept === plan[2].kind, "the usual week stays as it was: " + kept);
  await a.locator(".plan-training").click(); await a.waitForTimeout(300);
  await a.getByRole("button", { name: "Back to the usual Wednesday" }).click(); await a.waitForTimeout(300);
  ok(/From my Training week/.test(await a.locator(".plan-training").textContent()) && /Cardio/.test(await a.locator(".plan-training").textContent()), "Back to the usual Wednesday puts the date back");
  // a date without training: the pencil by the date
  await a.evaluate(() => document.querySelectorAll(".day-strip .choice")[13].click()); await a.waitForTimeout(300);
  ok(await a.getByRole("button", { name: "Change the training for this date" }).count() === 1, "a rest day has the pencil by the date");
  // an earlier week, and a past day
  await a.getByRole("button", { name: "Week before" }).click(); await a.waitForTimeout(300);
  ok(/Week \d+/.test(await a.locator(".week-arrows").textContent()) && await a.getByRole("button", { name: "Week after" }).isEnabled(), "the arrows go back a week, and forward again");
  await a.evaluate(() => document.querySelectorAll(".day-strip .choice")[0].click()); await a.waitForTimeout(300);
  ok(await a.locator(".plan-past").count() === 1 && /Nothing was logged|What you ate/.test(await a.locator(".plan-past").textContent()) && await a.locator(".plan-slot").count() === 0, "a past day shows what was eaten, or says nothing was");
  ok(/Alcohol/.test(await (async () => { await require("./me.cjs")(a); await a.getByText("Lifestyle", { exact: true }).first().click(); await a.waitForTimeout(300); return a.locator("main").textContent(); })()), "an adult is asked about alcohol");
  ok(a.errs.length === 0, "no page errors (adult)" + (a.errs.length ? ": " + a.errs.join("; ") : ""));
  // an apprentice: work and study
  const t = await open(2003, { weekdays: "both", hours: "fixed", slot: "7-3", move: "feet", commute: "bike", peWeek: "none" });
  await t.getByText("Lifestyle", { exact: true }).first().click(); await t.waitForTimeout(300);
  let life = await t.locator("main").textContent();
  ok(/Work and study/.test(life) && /Your weekdays/.test(life) && /Working hours/.test(life) && /Study hours/.test(life), "work and study: both sets of questions");
  ok(!/No fixed work/.test(life), "No fixed work is gone from Working hours; At home covers it");
  await t.getByRole("button", { name: /^Work a job/ }).click(); await t.waitForTimeout(200);
  life = await t.locator("main").textContent();
  ok(/Working hours/.test(life) && !/Study hours/.test(life), "Work only: no study questions");
  await t.getByRole("button", { name: /^Study university/ }).click(); await t.waitForTimeout(200);
  life = await t.locator("main").textContent();
  ok(/Study hours/.test(life) && !/Working hours/.test(life), "Study only: no work questions");
  await t.getByRole("button", { name: /^At home/ }).click(); await t.waitForTimeout(200);
  life = await t.locator("main").textContent();
  ok(!/Study hours/.test(life) && !/Working hours/.test(life) && /Your days are spent at home/.test(life), "At home: nothing more is asked, and it says what it means");
  await t.getByRole("button", { name: /^Work and study/ }).click(); await t.waitForTimeout(200);
  await require("./me.cjs")(t);
  await t.getByText("Training week", { exact: true }).first().click(); await t.waitForTimeout(300);
  await t.locator(".agenda-row").nth(2).click(); await t.waitForTimeout(200);
  const ed = await t.locator(".day-editor").textContent();
  ok(/Work day/.test(ed) && /Study day/.test(ed) && /Day off/.test(ed), "a day is a Work day, a Study day or a Day off");
  await t.locator(".day-editor").getByRole("button", { name: "Study day" }).click(); await t.waitForTimeout(200);
  ok(/Study/.test(await t.locator(".agenda-row").nth(2).locator("small").last().textContent()), "the week says Study on that day");
  ok(await t.locator(".agenda-row .load-bar").count() === 7 && await t.locator(".agenda-row").nth(2).locator(".load-bar.load-easy").count() === 1, "the week keeps its colored bars");
  ok((await t.locator(".agenda-row").nth(5).locator("small").last().textContent()).trim() === "", "a day off has no word on the right");
  await t.evaluate(() => { const p = JSON.parse(localStorage.getItem("chefmealan-personal")); const i = (new Date().getDay() + 6) % 7; p.plan[i] = { work: true, study: true, kind: "team", intensity: "moderate", when: "evening", minutes: 60 }; localStorage.setItem("chefmealan-personal", JSON.stringify(p)); });
  await t.reload(); await t.waitForTimeout(900);
  // since 0.1.84 a reload opens on the same tab (canvas board C5, approved 7 October 2026), so Today is one tap away
  await t.locator("nav button").filter({ hasText: "Today" }).click(); await t.waitForTimeout(300);
  ok(/Study day, then team sport in the evening\. A moderate day\./.test(await t.locator(".today-what").textContent()), "Today: Study day, then team sport in the evening. A moderate day.");
  ok(t.errs.length === 0, "no page errors (apprentice)" + (t.errs.length ? ": " + t.errs.join("; ") : ""));
  // a 17-year-old: Chef Mealan is for adults, and says why
  const k = await open(2009);
  const stop = await k.locator("main").textContent();
  ok(/Chef Mealan is for adults/.test(stop) && /AI/.test(stop), "a birth year under 18 stops at Chef Mealan is for adults, and the reason is the AI");
  ok(await k.locator("nav button").count() === 0, "nothing else opens: no Today, Plate, Foods or Me");
  await k.getByRole("button", { name: "Correct my birth year" }).click(); await k.waitForTimeout(300);
  ok(await k.locator("main input").count() > 0 && /Birth year/.test(await k.locator("main").textContent()), "Correct my birth year opens the profile");
  ok(k.errs.length === 0, "no page errors (17)" + (k.errs.length ? ": " + k.errs.join("; ") : ""));
  await b.close(); server.kill(); process.exit(fail ? 1 : 0);
})();
