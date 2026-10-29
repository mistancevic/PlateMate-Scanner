// The chat in three kinds (0.2.8, canvas board CH, CH6). Without an AI key, so what is checked is the app's own part:
// the plate and the day answered from data, a meal moved around training after a tap, a swap from the app's own picks
// (the checks Chef Mealan's ideas must also pass), and the chips on Today offering only what the chat can do.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const ch = seed.foods.find((f) => /Chicken breast/.test(f.name)), co = seed.foods.find((f) => /Cottage/.test(f.name));
seed.items = [{ id: "a", food: ch, grams: 200, locked: false }, { id: "b", food: co, grams: 150, locked: false }];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const U = "http://127.0.0.1:3203";
const t = new Date(), today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
const planned = { [today]: { breakfast: { title: "Oats, skyr and banana", kcal: 472, protein: 36, source: "mine" }, lunch: { title: "Sarma with skyr", kcal: 702, protein: 52, source: "mine" }, dinner: { title: "Chicken, rice and greens", kcal: 640, protein: 52, source: "starter" } } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3203", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  await page.addInitScript(([s, pl]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-planned", JSON.stringify(pl));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "strength", intensity: "hard", minutes: 60, at: "19:00" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("seeded", "1"); }, [seed, planned]);
  await require("./adult.cjs")(page);
  await page.goto(U + "/today"); await page.waitForTimeout(1300);
  await page.locator(".chat-fab").click(); await page.waitForTimeout(600);
  const chips = await page.locator(".chips-start button").allTextContents();
  ok(/^Swap (breakfast|lunch|dinner) for something lighter\|What's left today\?\|Move dinner to after training\|I'm out, what do I take\?$/.test(chips.join("|")), "Today's chips: the next meal to swap, and only what the chat can do: " + chips.join(" | "));
  const send = async (q) => { await page.locator(".chat-input input").first().fill(q); await page.getByRole("button", { name: "Send" }).click(); await page.waitForTimeout(700); };
  const last = async () => (await page.locator(".bubble.mealan").last().textContent()).replace(/\s+/g, " ");
  // 1. from the app's data
  await send("What is on my plate?");
  ok((await last()) === "FROM YOUR PLATEChicken breast, cooked, 200 g and cottage cheese (Hüttenkäse), 150 g. 477 kcal and 80 g protein: PD 16.8, against your 6.4.", "1. the plate, from the app's data: " + await last());
  await send("What's left today?");
  ok(/^FROM YOUR DAYNothing eaten yet today\. Left: 2,800 kcal and 180 g protein\.$/.test(await last()), "1. what is left of the day: " + await last());
  await send("What is planned for lunch?");
  // Changed by story DT76 (board DT76): the starters' numbers come from their foods (1,814 kcal and 140 g before)
  ok(/^FROM YOUR DAYToday: breakfast at 07:30, oats, skyr and banana; lunch at 13:45, sarma with skyr; dinner at 20:00, chicken, rice and greens\. 1,821 kcal and 144 g protein planned of 2,800 and 180\.$/.test(await last()), "1. the day's plan: " + await last());
  // 2. a swap: the app's own picks here (no AI key), lighter and at the target
  await send("Swap lunch for something lighter"); await page.waitForTimeout(300);
  const sw = await last();
  ok(/^CHEF MEALANYour lunch is sarma with skyr, 702 kcal\. Two lighter lunches that keep your protein:/.test(sw), "2. the swap says what lunch is and offers two: " + sw.slice(0, 120));
  const rows = await page.locator(".bubble.mealan").last().locator(".fill-row").allTextContents();
  const kcals = rows.map((r) => Number((r.match(/([\d,]+) kcal/) || [])[1]?.replace(",", "")));
  ok(rows.length === 2 && kcals.every((k) => k > 0 && k <= 702 * 0.85), "2. both are lighter than 702 kcal: " + kcals.join(", "));
  await page.locator(".bubble.mealan").last().getByRole("button", { name: "Swap" }).first().click(); await page.waitForTimeout(500);
  const pl = await page.evaluate((d) => JSON.parse(localStorage.getItem("chefmealan-planned"))[d].lunch.title, today);
  ok(pl !== "Sarma with skyr" && rows[0].includes(pl), "2. Swap puts it in the plan: " + pl);
  // Changed by story DT153 (0.2.132, board Stories105): a plain tick, not a pill, with Undo under it while the chat is open
  const swb = page.locator(".bubble.mealan").last();
  ok(await swb.locator(".pill-done").count() === 0 && (await swb.locator(".done-tick").textContent()) === "✓ SwappedUndo", "2. the swap says ✓ Swapped, with Undo");
  await swb.getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(400);
  const back = await page.evaluate((d) => JSON.parse(localStorage.getItem("chefmealan-planned"))[d].lunch.title, today);
  ok(back === "Sarma with skyr" && await swb.getByRole("button", { name: "Swap" }).count() === 2, "DT153: Undo puts sarma back and the two options come back: " + back);
  await swb.getByRole("button", { name: "Swap" }).first().click(); await page.waitForTimeout(500);
  // 3. a change to the plan: dinner after training, for today only, after a tap
  await send("Move dinner to after training");
  ok((await last()).startsWith("YOUR PLANYour strength session is 19:00 to 20:00. Dinner moves from 20:00 to 20:30. The meal stays the same."), "3. the move, around the training: " + await last());
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).timesOn);
  ok(!before, "3. nothing moves before the tap");
  await page.locator(".bubble.mealan").last().getByRole("button", { name: "Move it" }).click(); await page.waitForTimeout(500);
  const per = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")));
  ok(per.timesOn?.[today]?.dinner === "20:30" && !per.lifestyle.slotTimes, "3. dinner at 20:30 today; the usual times stay");
  await send("What is planned for dinner?");
  ok(/dinner at 20:30/.test(await last()), "3. the day now says dinner at 20:30");
  await page.goto(U + "/plan"); await page.waitForTimeout(1200);
  ok(/20:30/.test(await page.locator("main").textContent()), "3. Plan shows dinner at 20:30 today");
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
