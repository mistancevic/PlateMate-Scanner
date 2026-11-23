// JOURNEY INVARIANT (DT335, 0.3.184, board Stories284; Coach Milan, Go 23 November 2026, 14:13): Gain healthy weight is a
// goal, after Maintain. The list of goals stays whole; a goal that does not fit the body is greyed, Not for your body now,
// and a tap opens the reason in place, from her own numbers and never a BMI number; the goal is not picked. Too light from
// height and weight greys Recomposition and Lose fat; too much body fat, only when body fat is given, greys Gain healthy
// weight and Build muscle. Gain healthy weight and Lose fat take a target body weight, never a change: the line says the
// change, the pace and the time; a target outside the healthy weight for the height is not taken. Me › Goal shows the
// target, the weight now and how far she has come, and it moves with each weigh-in. No target with the eating situation.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
const PORT = 3609;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const errs = [];
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const txt = async (l) => ((await l.textContent()) || "").replace(/\s+/g, " ");
  // the goal step, from a new phone: I agree, the safety question, then her body
  const start = async (sex, year, h, kg, eating) => {
    const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await require("./adult.cjs")(page);
    await page.goto(`http://127.0.0.1:${PORT}/`); await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Not now" }).click(); await page.waitForTimeout(400);
    await require("./goal-open.cjs")(page);
    await page.getByRole("button", { name: /^I agree$/ }).click(); await page.waitForTimeout(200);
    if (eating) {
      const q = page.locator("#safety-question");
      await q.getByText("A difficult relationship with eating", { exact: false }).first().click(); await page.waitForTimeout(200);
      await q.getByRole("button", { name: /^Next/ }).click(); await page.waitForTimeout(300);
    } else await require("./door.cjs")(page);
    await page.getByRole("button", { name: sex === "female" ? /^Female$/ : /^Male$/ }).click();
    const inputs = page.locator(".calc-way input");
    await inputs.nth(0).fill(String(year)); await inputs.nth(1).fill(String(h)); await inputs.nth(2).fill(String(kg)); await inputs.nth(2).blur(); await page.waitForTimeout(250);
    return page;
  };
  const card = (page, name) => page.locator(".goal-pick").filter({ has: page.locator(".goal-pick-head b", { hasText: new RegExp(`^${name}$`) }) });
  const target = async (page, v) => { const f = page.getByLabel(/Your target weight/); await f.fill(String(v)); await f.blur(); await page.waitForTimeout(200); return (await page.locator(".target-line").count()) ? txt(page.locator(".target-line")) : ""; };
  try {
    // AC1, AC2, AC4, AC5, AC7: 48 kg at 168 cm, a woman of 28, no coach
    const page = await start("female", 1998, 168, 48);
    const names = await page.locator(".goal-cards .goal-pick-head b").allTextContents();
    ok(names.join(",") === "Recomposition,Lose fat,Maintain,Gain healthy weight,Build muscle,Performance", "AC1: Gain healthy weight is a goal, after Maintain: " + names.join(", "));
    const hw = await txt(card(page, "Gain healthy weight"));
    ok(/about 10 % more/.test(hw) && /roughly 1 kg a month, to the weight you choose/.test(hw) && /Training is welcome, not required/.test(hw), "AC1: its card: " + hw);
    const greyed = await page.locator(".goal-pick.greyed .goal-pick-head b").allTextContents();
    ok(greyed.join(",") === "Recomposition,Lose fat", "AC2: too light greys Recomposition and Lose fat: " + greyed.join(", "));
    ok(/Not for your body now · tap to see why/.test(await txt(card(page, "Lose fat"))) && await card(page, "Lose fat").getAttribute("aria-disabled") === "true", "AC2: Not for your body now, tap to see why");
    await card(page, "Lose fat").click({ force: true }); await page.waitForTimeout(200);
    const why = await txt(page.locator(".goal-why"));
    ok(/48 kg at 168 cm/.test(why) && /Eating less than you burn is not safe here/.test(why) && !/BMI/.test(why), "AC2: the reason in place, her own numbers, no BMI number: " + why);
    ok(/height and weight in Profile/.test(why) && /correct it there/.test(why) && /doctor or a nutrition professional/.test(why), "AC4: without a coach, where the numbers come from and who to ask");
    ok(await page.locator(".goal-pick.on").count() === 0, "AC2: the greyed goal is not picked");
    await card(page, "Gain healthy weight").click(); await page.waitForTimeout(200);
    ok(await page.getByLabel(/Your target weight/).count() === 1, "AC5: Gain healthy weight asks for a target weight");
    const up = await target(page, 55);
    ok(/^55 kg: 7 kg more\. Roughly 1 kg a month, about 7 months\.$/.test(up), "AC5: 55 kg: 7 kg more, roughly 1 kg a month, about 7 months: " + up);
    const high = await target(page, 71);
    ok(/up to 70 kg/.test(high), "AC5: above the healthy weight for her height is not taken: " + high);
    let ps = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal") || "{}"));
    ok(ps.targetKg === 55 && ps.targetFor === "healthy", "AC5: 55 kg is kept, 71 is not: " + ps.targetKg);
    await target(page, 55);
    await page.getByRole("button", { name: /^Apply from today/ }).click(); await page.waitForTimeout(600); await require("./shop-step.cjs")(page);
    const g = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-goal") || "{}"));
    ok(g.band === "healthy", "the goal is Gain healthy weight: " + g.band);
    const meGoal = async () => { await require("./me.cjs")(page); await page.locator(".me-rows .menu-row").filter({ hasText: /^Goal/ }).first().click(); await page.waitForTimeout(400); return txt(page.getByRole("region", { name: "Your goal sheet" })); };
    let sheet = await meGoal();
    ok(/Target weight/.test(sheet) && /55 kg\. 48 kg now, 0 kg of 7 kg so far/.test(sheet) && /up roughly 1 kg a month/.test(sheet) && /about 10 % more than you burn/.test(sheet), "AC7: the goal sheet shows the target, her weight now and how far: " + sheet.slice(0, 260));
    await page.evaluate(() => { const k = "chefmealan-personal", p = JSON.parse(localStorage.getItem(k) || "{}"); const d = new Date(); d.setDate(d.getDate() - 1); p.weighIns = [...(p.weighIns || []), { date: d.toISOString().slice(0, 10), kg: 49.5 }]; localStorage.setItem(k, JSON.stringify(p)); });
    await page.reload(); await page.waitForTimeout(900);
    sheet = await meGoal();
    ok(/49\.5 kg now, 1\.5 kg of 7 kg so far/.test(sheet), "AC7: it moves with a weigh-in: " + (sheet.match(/Target weight[^]*?so far/) || [""])[0]);
    await page.getByRole("button", { name: /About your goal/ }).click(); await page.waitForTimeout(200);
    const about = await txt(page.getByRole("region", { name: "About your goal" }));
    ok(/Gain healthy weight/.test(about) && /Training is welcome, not required/.test(about) && /At your target weight: Maintain/.test(about), "its own goal page");
    await page.context().close();

    // AC3, AC6: 82 kg at 168 cm, a woman of 36; first no body fat, then 38 %
    const p2 = await start("female", 1990, 168, 82);
    ok(await p2.locator(".goal-pick.greyed").count() === 0, "AC3: no body fat given, nothing greyed on the heavy side");
    await card(p2, "Lose fat").click(); await p2.waitForTimeout(200);
    const down = await target(p2, 72);
    ok(/^72 kg: 10 kg less\. 0\.5 to 1 % of your weight a week, about 3 to 6 months\.$/.test(down), "AC6: 72 kg: 10 kg less, 0.5 to 1 % a week, about 3 to 6 months: " + down);
    const low = await target(p2, 52);
    ok(/down to 53 kg/.test(low), "AC6: under the healthy weight for her height is not taken: " + low);
    const big = await target(p2, 79);
    ok(/3(\.0)? kg less/.test(big), "AC6: no top limit: " + big);
    const bf = p2.getByLabel(/Body fat %/);
    if (!(await bf.count())) { await p2.locator(".you-card, .calc-you").first().click().catch(() => {}); await p2.waitForTimeout(200); }
    await bf.fill("38"); await bf.blur(); await p2.waitForTimeout(250);
    const g2 = await p2.locator(".goal-pick.greyed .goal-pick-head b").allTextContents();
    ok(g2.join(",") === "Gain healthy weight,Build muscle", "AC3: body fat 38 % greys Gain healthy weight and Build muscle: " + g2.join(", "));
    await card(p2, "Build muscle").click({ force: true }); await p2.waitForTimeout(200);
    const why2 = await txt(p2.locator(".goal-why"));
    ok(/38 %, is above the healthy range for a woman of 36/.test(why2) && /body fat in Profile/.test(why2), "AC3: the reason: " + why2);
    await p2.context().close();

    // AC8: the eating situation, no target weight
    const p3 = await start("female", 1998, 168, 48, true);
    await card(p3, "Gain healthy weight").click(); await p3.waitForTimeout(200);
    ok(await p3.locator(".goal-pick.on").count() === 1 && await p3.getByLabel(/Your target weight/).count() === 0, "AC8: with the eating situation, Gain healthy weight has no target weight");
    await p3.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
