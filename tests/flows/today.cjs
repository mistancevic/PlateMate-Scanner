// Today: the plan, what was logged, a card kept for later, the last days.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
const skyr = seed.foods.find((f) => /skyr/i.test(f.name));
const card = (status, daysAgo, title) => ({ id: "c" + status + daysAgo, meal: { id: "m", title, items: [{ id: "i", food: skyr, grams: 300, locked: true }], portion: 300, savedAt: "" }, status, taste: "Good", notes: "", createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(), dayType: daysAgo === 1 ? "training" : undefined });
seed.feedback = [card("eaten", 0, "Skyr bowl"), card("prepared", 0, "Evening skyr"), card("eaten", 1, "Yesterday's bowl"), card("eaten", 1, "Second bowl")];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3193" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, life: "desk" })); localStorage.setItem("seeded", "1"); } }, seed);
  await require("./adult.cjs")(page);
  await page.goto("http://127.0.0.1:3193/"); await page.waitForTimeout(900);
  const line = await page.locator(".logged-line").textContent();
  ok(/1 meal logged, 189 kcal and 33 g protein so far/.test(line), "logged line is information: " + line.trim());
  ok(await page.getByText("Prepared for later").count() === 1, "a prepared card waits");
  await page.getByRole("button", { name: /I ate it/ }).click(); await page.waitForTimeout(300);
  ok(/2 meals logged, 378 kcal/.test(await page.locator(".logged-line").textContent()), "I ate it moves it into the log");
  const rows = await page.locator(".days .history-row").allTextContents();
  ok(rows.length === 2 && /Yesterday/.test(rows[0]) && /Moderate/.test(rows[0]) && /2 meals logged/.test(rows[0]), "yesterday: a training day, 2 meals logged");
  ok(/Nothing logged/.test(rows[1]), "two days ago: nothing logged, said plainly");
  // JOURNEY (approved design, 6 October 2026): without a Weekly plan Today asks, with Rest, Light, Moderate, Hard and a link
  // to the plan; with a plan Today reads it, and Change today's plan changes this date only.
  ok(/kcal, week's average/.test(await page.locator(".plan-row").textContent()), "until the day is known, the calories are the week's average");
  ok(await page.locator(".plan .day-row .choice").count() === 4 && /What kind of day is it/.test(await page.locator(".plan").textContent()), "without a Weekly plan, Today asks with four choices");
  ok(await page.getByRole("button", { name: /Set your Weekly plan/ }).count() === 1, "and links to the Weekly plan");
  const assumedKcal = (await page.locator(".plan-row b").nth(1).textContent()).trim();
  await page.getByRole("button", { name: "Hard", exact: true }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".plan .day-row .choice.on").textContent() === "Hard", "the picked day is marked");
  ok(/kcal today/.test(await page.locator(".plan-row").textContent()) && (await page.locator(".plan-row b").nth(1).textContent()).trim() !== assumedKcal, "calories follow the day");
  // with a Weekly plan (and the day picked above cleared, as a fresh week would be): today's line, the explanation inside the card, the button under it
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem("chefmealan-personal") || "{}"); const d = { work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }; p.plan = [d, d, d, d, d, d, d]; delete p.dated; Object.keys(localStorage).filter((k) => k.startsWith("chefmealan-today-")).forEach((k) => localStorage.removeItem(k)); localStorage.setItem("chefmealan-personal", JSON.stringify(p)); Object.keys(localStorage).filter((k) => k.startsWith("chefmealan-today-")).forEach((k) => localStorage.removeItem(k)); });
  await page.reload(); await page.waitForTimeout(900);
  const card = await page.locator(".today-plan").first().textContent();
  // the wording of this line changed in the plain English pass (approved 7 October 2026); it still says where the plan comes from
  ok(/Strength, hard, in the evening\. A hard day\./.test(card) && /tap the pencil/.test(card), "Today reads the plan and points at the pencil: " + card.slice(0, 80));
  await page.getByRole("button", { name: "Change today's plan" }).click(); await page.waitForTimeout(200);
  // since 7 October 2026 (canvas board T3) the day settings call a rest day No training
  await page.locator(".today-plan").getByRole("button", { name: "No training", exact: true }).click();
  await page.getByRole("button", { name: "Save for today" }).click(); await page.waitForTimeout(300);
  // plain English pass (approved 7 October 2026): a day without training says "No training today."
  ok(/No training today\./.test(await page.locator(".today-plan").first().textContent()) && /Changed for today only/.test(await page.locator(".today-plan").first().textContent()), "a change is for today only and says so");
  const plan = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).plan[0].kind);
  ok(plan === "strength", "the Weekly plan stays the same");
  await page.getByRole("button", { name: "Back to the Weekly plan" }).click(); await page.waitForTimeout(300);
  ok(/A hard day/.test(await page.locator(".today-plan").first().textContent()), "back to the Weekly plan");
  // approved on the canvas, 6 October 2026: the goal itself is the link, large; who set it is one small line above it
  ok(/^my goal$/i.test((await page.locator(".plan-goal small").first().textContent()).trim()), "a small line says My goal, nothing more when I set it myself");
  await page.getByRole("button", { name: "Open my goal" }).click(); await page.waitForTimeout(300);
  ok(await page.getByRole("button", { name: /Change the goal/ }).count() >= 1, "the goal's name opens Me, Goal");
  // JOURNEY INVARIANT (Milan, 7 October 2026, from a Today card that showed PD 3.0 for a 190 g, 3,200 kcal day):
  // a moment picked on the Plate changes the plate's target only; Today and Foods keep the day's target.
  await page.goto("http://127.0.0.1:3193/"); await page.waitForTimeout(600);
  const dayPd = (await page.locator(".plan-row b").first().textContent()).trim();
  const nums = (await page.locator(".plan-row b").allTextContents()).map((x) => Number(x.replace(/,/g, "")));
  ok(Math.abs(nums[0] - Math.round((nums[2] / nums[1]) * 1000) / 10) <= 0.1, `the day's PD is protein over calories: ${nums[2]} g in ${nums[1]} kcal is ${nums[0]}`);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(300);
  await require("./line.cjs")(page); await page.getByRole("button", { name: /^Before training$/ }).first().click().catch(() => {}); await page.waitForTimeout(200);
  const plateHint = await page.locator(".moment-hint").textContent().catch(() => "");
  await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(300);
  ok(/Target for this plate: PD 3/.test(plateHint) && (await page.locator(".plan-row b").first().textContent()).trim() === dayPd, `Before training sets the plate to PD 3; Today still shows the day's ${dayPd}`);
  await page.goto("http://127.0.0.1:3193/"); await page.waitForTimeout(600);
  const actions = await page.locator("main").evaluate((m) => Array.from(m.querySelectorAll(".pill-tall, .inbox")).map((e) => e.className.includes("inbox") ? "inbox" : "action"));
  ok(actions.slice(0, 3).every((x) => x === "action"), "the three actions sit directly under the plan");
  await page.screenshot({ path: "/tmp/today.png", fullPage: true });
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
