// JOURNEY INVARIANT (Milan, 7 October 2026, canvas boards K1 to K3): Build muscle has a pace. Picking it shows Your pace,
// Steady or Faster, and How long have you trained regularly?, which sets the starting pace (under 1 year Faster, longer
// Steady). Maintain says you can still get stronger. Me › Goal shows the goal with its pace, the goal sheet (food,
// weight to expect in your kilos, counted as the 7-day average, progress, next check-in) and About your goal.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3195", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  try {
    await require("./adult.cjs")(page);
    await page.goto("http://127.0.0.1:3195/"); await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Not now" }).click(); await page.waitForTimeout(400);
    await page.getByText(/Set your goal/).click(); await page.waitForTimeout(400);
    await page.getByRole("button", { name: /^I agree$/ }).click(); await page.waitForTimeout(200);
    await page.getByRole("button", { name: /^Male$/ }).click();
    const inputs = page.locator(".calc-way input");
    await inputs.nth(0).fill("1981"); await inputs.nth(1).fill("182"); await inputs.nth(2).fill("96"); await inputs.nth(2).blur(); await page.waitForTimeout(200);
    ok(/With training, you can still get stronger/.test(await page.locator(".goal-cards").textContent()), "Maintain says you can still get stronger");
    ok(await page.getByRole("group", { name: "Your pace" }).count() === 0, "no pace until Build muscle is picked");
    await page.locator(".goal-pick").filter({ hasText: /^Build muscle/ }).click(); await page.waitForTimeout(200);
    const pace = page.getByRole("group", { name: "Your pace" });
    ok(await pace.count() === 1 && await pace.getByRole("button", { name: /^Steady/, pressed: true }).count() === 1, "Build muscle shows the pace, Steady to start");
    const age = page.getByRole("group", { name: "How long have you trained regularly?" });
    await age.getByRole("button", { name: "Under 1 year" }).click(); await page.waitForTimeout(200);
    ok(await pace.getByRole("button", { name: /^Faster/, pressed: true }).count() === 1, "under 1 year starts on Faster");
    await age.getByRole("button", { name: "Over 3 years" }).click(); await page.waitForTimeout(200);
    ok(await pace.getByRole("button", { name: /^Steady/, pressed: true }).count() === 1, "over 3 years starts on Steady");
    await page.getByRole("button", { name: /Set my day/ }).click(); await page.waitForTimeout(600);
    const g = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-goal") || "{}"));
    ok(g.band === "gainsteady", "the goal is kept with its pace: " + g.band);
    await require("./me.cjs")(page);
    await page.locator(".me-rows .menu-row").filter({ hasText: /^Goal/ }).first().click(); await page.waitForTimeout(400);
    const main = await page.locator("main").textContent();
    ok(/Build muscle · Steady/.test(main), "Me › Goal names the goal with its pace");
    const sheet = page.getByRole("region", { name: "Your goal sheet" });
    const st = await sheet.textContent();
    ok(/about 5 % more than you burn/.test(st) && /up 0\.25–0\.5 kg a month/.test(st) && /7-day average/.test(st) && /heavier lifts/.test(st) && /every 4 weeks/.test(st) && /Set by you on/.test(st), "the goal sheet: " + st.replace(/\s+/g, " ").slice(0, 200));
    await page.getByRole("button", { name: /About your goal/ }).click(); await page.waitForTimeout(200);
    const about = await page.getByRole("region", { name: "About your goal" }).textContent();
    ok(["What happens", "Training", "Food", "What to watch", "Common mistakes", "When to switch"].every((x) => about.includes(x)) && /0\.4–0\.55 g per kg/.test(about), "About your goal: the six parts");
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
