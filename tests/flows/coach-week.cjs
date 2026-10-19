// The coach's week, 0.2.6 (canvas board CW, Milan 13 and 15 October 2026). Skip a meal on purpose on Today; the coach's
// note on Today; Clients with check-ins and the week as bars; a client's page with the week, a day opened, the note, the
// check-in day and a goal from a date. Without accounts, Clients opens on two example clients (?coachdemo).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3197" }, stdio: ["ignore", "pipe", "pipe"] });
  process.on("unhandledRejection", (e) => { console.log("FAIL " + e.message); server.kill(); process.exit(1); });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const today = ymd(new Date());
  const noteAt = new Date(); noteAt.setHours(noteAt.getHours() - 1);
  await page.addInitScript(([s, today, at]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("seeded", "1");
    localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "fatloss", setBy: "coach", coachName: "Milan", setAt: "2026-09-28T08:00:00Z", source: "coach" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "female", birthYear: 1985, heightCm: 168, weightKg: 78, dayMode: "each", plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 4 } }));
    localStorage.setItem("chefmealan-planned", JSON.stringify({ [today]: { breakfast: { title: "Oats, skyr and banana", kcal: 472, protein: 36, source: "mine" }, lunch: { title: "Sarma with skyr", kcal: 602, protein: 68, source: "mine" }, snack: { title: "Cottage cheese and apple", kcal: 230, protein: 24, source: "starter" }, dinner: { title: "Chicken, rice and greens", kcal: 640, protein: 52, source: "coach" } } }));
    localStorage.setItem("chefmealan-coach", JSON.stringify({ checkinDay: 4, notes: [{ at, by: "coach", name: "Milan", verdict: "approved", text: "Good week. Keep the skyr on the side at lunch." }] }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], allergies: [], flags: [], consentBodyAt: "2026-10-05T10:00:00Z", consentBy: "self", none: true, declaredAt: "2026-10-05T10:00:00Z", adultAt: "2026-10-05T09:00:00Z" }));
  }, [seed, today, noteAt.toISOString()]);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3197/today"); await page.waitForTimeout(1200);
  // CW7: skip on purpose
  const snack = page.locator(".plan-slot-row").filter({ hasText: "Cottage cheese" });
  // Changed by story R19 (Milan 06:04 to 06:41, board RS18): Skip left the row; a swipe to the right skips, as on the Plate
  await require("./swipe.cjs")(page, snack, "right");
  ok(/Skipped on purpose/.test(await snack.textContent()) && await snack.getByRole("button", { name: "Undo" }).count() === 1, "Skip: the row says Skipped on purpose, with Undo");
  ok(await page.evaluate((t) => JSON.parse(localStorage.getItem("chefmealan-planned"))[t].snack.skipped === true, today), "the skip is kept with the plan");
  await snack.getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(300);
  ok(!/Skipped on purpose/.test(await page.locator(".plan-slot-row").filter({ hasText: "Cottage cheese" }).textContent()), "Undo brings the meal back");
  // CW5: the coach's note, once
  const note = page.locator(".coach-week-note");
  ok(await note.count() === 1 && /Your week: approved/.test(await note.textContent()) && /Coach Milan/.test(await note.textContent()), "Today shows the coach's note");
  await note.getByRole("button", { name: "Got it" }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".coach-week-note").count() === 0 && await page.evaluate(() => !!JSON.parse(localStorage.getItem("chefmealan-coach")).notes[0].readAt), "Got it: the note leaves Today and is marked read");
  // CW1: Clients, the example clients
  await page.goto("http://127.0.0.1:3197/today?coachdemo"); await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /^Clients$/ }).first().click(); await page.waitForTimeout(800);
  ok(/Check-ins today/.test(await page.locator("main").textContent()), "Clients starts with Check-ins today");
  const row = page.locator(".cw-row").first();
  ok(await row.locator(".cw-bar").count() === 7 && /lived by the plan/.test(await row.textContent()) && /check-in today/.test(await row.textContent()), "a client row: seven bars and the days lived by the plan");
  // CW2: Davorka's page
  await row.click(); await page.waitForTimeout(500);
  ok(await page.getByRole("button", { name: "‹ Clients" }).count() === 1 && /Planned against eaten/.test(await page.locator(".cw-week").textContent()), "the client opens on a page of her own, with the week");
  ok(/Today so far/.test(await page.locator(".cw-week").textContent()), "today says so far");
  await page.locator(".cw-week").getByRole("button", { name: "Week before" }).click(); await page.waitForTimeout(300);
  const wk = await page.locator(".cw-week").textContent();
  ok(/✓ By the plan/.test(wk) && /2 changes/.test(wk) && /lunch swapped, dinner not eaten/.test(wk) && /lived by the plan/.test(wk) && (wk.match(/✓/g) || []).length >= 5, "last week: lived days with ✓, a changed day with what changed");
  // CW3: a day opened
  await page.getByRole("button", { name: /^Wednesday: 2 changes/ }).click(); await page.waitForTimeout(300);
  const sheet = await page.locator(".cw-day-sheet").textContent();
  ok(/Swapped/.test(sheet) && /Not eaten/.test(sheet) && /Chicken wrap, canteen/.test(sheet) && /1 extra: pizza, 3 slices/.test(sheet) && /Shared with you, pizza, 3 slices: “team dinner/.test(sheet), "a day: planned against eaten per meal, the extra, the words only from a shared card");
  await page.locator(".cw-day-sheet").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(200);
  // CW4: the note, the check-in day
  await page.getByLabel("Your note").fill("Good week. Wednesday happens."); await page.getByRole("button", { name: "Send the note" }).click(); await page.waitForTimeout(300);
  ok(/Good week\. Wednesday happens\./.test(await page.locator("main").textContent()) && /Approved the week/.test(await page.locator("main").textContent()), "the note is sent and listed");
  await page.getByRole("group", { name: "Check-in day" }).getByRole("button", { name: "Mon" }).click(); await page.waitForTimeout(200);
  ok(/Check-in: Monday/.test(await page.locator(".cw-person").textContent()), "the check-in day changes");
  // CW8: a goal from a date
  await page.locator(".cw-goal").getByRole("button", { name: /^Maintain/ }).click();
  await page.locator(".cw-goal").getByRole("group", { name: "Apply from" }).locator(".choice").nth(2).click(); await page.waitForTimeout(200);
  const apply = page.locator(".cw-goal").getByRole("button", { name: /^Apply from/ });
  ok(/^Apply from Monday \d+ \w+$/.test((await apply.textContent()).trim()), "the date is on the button");
  await apply.click(); await page.waitForTimeout(300);
  ok(/Next: Maintain, from Monday/.test(await page.locator("main").textContent()), "the goal waits for its date");
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill(); process.exit(fail ? 1 : 0);
})();
