// DT208 (0.3.49, board Stories155 version 6; Coach Milan 1 November 21:49 Go): one row under the goal on Today and Me: To set:
// and what is missing by name, or Profile and plan fully set. Target today:; the PD number says of PD; Me says To do on a step
// still to set; Profile says a needed field is missing when you leave it, and under Next what is still needed, as a link.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const PORT = "3343", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const SAFE = { situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (personal, goal) => {
    const page = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.addInitScript(([s, personal, goal, safe]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      if (goal) localStorage.setItem("chefmealan-goal", JSON.stringify(goal)); localStorage.setItem("chefmealan-region", "munich");
      localStorage.setItem("chefmealan-personal", JSON.stringify(personal)); localStorage.setItem("chefmealan-safety", JSON.stringify(safe)); localStorage.setItem("seeded", "1"); }, [seed, personal, goal, SAFE]);
    await require("./adult.cjs")(page);
    return page;
  };
  const url = (page) => new URL(page.url()).pathname;
  try {
    // something missing: the height, the goal, the training week
    let page = await open({ dayMode: "same", sex: "female", birthYear: 1990, weightKg: 68, kitchens: ["Balkan"], lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }, null);
    await page.goto(U + "/today"); await page.waitForTimeout(1500);
    const nn = page.getByRole("button", { name: "Not now" }); if (await nn.count()) { await nn.first().click(); await page.waitForTimeout(600); }
    const row = page.locator("section.plan .setup-line");
    ok((await row.textContent()).trim() === "To set: height, goal, training week", "Today: To set: height, goal, training week: " + (await row.textContent()).trim());
    ok(await page.locator(".strip-button").filter({ hasText: "Set your goal" }).count() === 0 && !/Today so far, against your goal/.test(await page.locator("section.plan").textContent()), "no strip Set your goal, no Today so far line");
    ok(/^of PD /.test((await page.locator("section.plan .plan-row small").first().textContent()).trim()), "the PD number says of PD");
    await row.click(); await page.waitForTimeout(1200);
    ok(url(page) === "/me/profile" && await page.evaluate(() => document.activeElement?.closest("#pf-height") !== null), "a tap opens Profile on the height: " + url(page));
    // Profile: leaving the height empty says so; under Next, what is still needed
    await page.locator("#pf-weight input").focus(); await page.locator("#pf-height input").focus(); await page.locator("#pf-weight input").focus(); await page.waitForTimeout(300);
    ok(await page.locator(".field-need").filter({ hasText: "Height: needed for your numbers." }).count() === 1, "Height: needed for your numbers.");
    const still = page.locator(".setup-line").filter({ hasText: "Still needed for your numbers: height" });
    ok(await still.count() === 1 && await page.getByRole("button", { name: /^Next: Goal/ }).isEnabled(), "Next: Goal goes on; under it, Still needed for your numbers: height");
    await page.locator("#pf-height input").fill("170"); await page.waitForTimeout(1200);
    ok(await page.locator(".setup-line").filter({ hasText: "Still needed" }).count() === 0, "typed, the line goes");
    // Me: To do on the steps still to set (a reload without a goal opens the goal screen first, so through the menu)
    await page.goBack(); await page.waitForTimeout(800); await require("./me.cjs")(page);
    const todo = await page.locator(".me-rows .menu-row").evaluateAll((rs) => rs.filter((r) => r.querySelector(".me-todo")).map((r) => r.querySelector("b").textContent));
    ok(todo.join(",") === "Goal,Training week", "Me: To do on Goal and Training week: " + todo.join(","));
    ok(/To set: goal, training week/.test(await page.locator(".plan .setup-line").textContent()), "Me's goal card says it too");
    await page.context().close();
    // nothing missing
    page = await open({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }, { band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" });
    await page.goto(U + "/today"); await page.waitForTimeout(1500);
    ok((await page.locator("section.plan .setup-done").textContent()).trim() === "✓ Profile and plan fully set. Target today:" && await page.locator("section.plan .setup-line").count() === 0, "all set: Profile and plan fully set. Target today:");
    await page.goto(U + "/me"); await page.waitForTimeout(1300);
    ok(await page.locator(".me-todo").count() === 0 && (await page.locator(".plan .setup-done").textContent()).trim() === "✓ Profile and plan fully set", "Me: no To do, Profile and plan fully set");
    await page.context().close();
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
