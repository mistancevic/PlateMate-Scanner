// Me pages (fix pass, 11 October 2026, canvas S M4 to M8, T5): every page in Me has its own address, Back goes one page
// back and a reload stays; the top bar says Me and no tab is lit; Chef Mealan, never Mealan alone; the meal times set the
// eating window; Today shows its numbers whole from the first moment.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3193" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => {
    if (!localStorage.getItem("seeded")) {
      localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 }), lifestyle: { meals: 3, window: { from: "08:00", to: "19:00" } } }));
      localStorage.setItem("seeded", "1");
    }
    // T5: what the day card shows at its very first paint
    window.__first = null;
    const look = () => { const r = document.querySelector(".plan-row"); if (r && window.__first === null) window.__first = { row: r.textContent, macros: Boolean(document.querySelector(".plan-macros")) }; else if (!r) requestAnimationFrame(look); };
    requestAnimationFrame(look);
  }, seed);
  await require("./adult.cjs")(page);
  const url = () => new URL(page.url()).pathname;
  const h1 = () => page.locator("header h1").textContent();
  const title = () => page.locator(".menu-title").first().textContent();
  const lit = () => page.locator(".bottom-nav .active").count();
  await page.goto("http://127.0.0.1:3193/today"); await page.waitForTimeout(1000);
  const first = await page.evaluate(() => window.__first);
  ok(first && !/\?/.test(first.row) && first.macros, "T5: the day card is whole at its first paint: " + JSON.stringify(first));
  // Me, then Profile: each its own address; the top bar says Me; no tab lit
  await require("./me.cjs")(page);
  ok(url() === "/me" && await h1() === "Me" && await lit() === 0, `M6, M4: Me at /me, the top bar says Me, no tab lit (${url()}, ${await h1()}, ${await lit()})`);
  const nums = (await page.locator(".plan .plan-row b").allTextContents()).map((x) => Number(x.replace(/,/g, "")));
  ok(Math.abs(nums[0] - (100 * nums[2]) / nums[1]) < 0.06, "the Me card's PD is its own protein in its own kcal: " + nums.join(", "));
  await page.locator(".menu-row").filter({ hasText: /^Profile/ }).first().click(); await page.waitForTimeout(500);
  ok(url() === "/me/profile" && await title() === "Profile" && await h1() === "Me", "M6: Profile at /me/profile");
  const text = await page.locator("main").textContent();
  ok(/Chef Mealan is an AI chef/.test(text) && !/(^|[^f] )Mealan is/.test(text.replace(/Chef Mealan/g, "")), "M5: Chef Mealan is an AI chef");
  // Back: one page at a time
  await page.goBack(); await page.waitForTimeout(500);
  ok(url() === "/me" && await title() === "Me", "M6: Back from Profile goes to Me: " + url());
  await page.goBack(); await page.waitForTimeout(500);
  ok(url() === "/menu" && await h1() === "Menu", "M6: Back from Me goes to the Menu it was opened from: " + url());
  await page.goBack(); await page.waitForTimeout(500);
  ok(url() === "/today" && await h1() === "Today" && await page.locator(".menu-title").count() === 0 && await lit() === 1, "M6: Back from the Menu goes to Today: " + url());
  // a reload on a page in Me stays there; Back walks out through Me
  await require("./me.cjs")(page);
  await page.locator(".menu-row").filter({ hasText: /^Lifestyle/ }).first().click(); await page.waitForTimeout(500);
  ok(url() === "/me/lifestyle", "M6: Lifestyle at /me/lifestyle");
  await page.reload(); await page.waitForTimeout(1200);
  ok(url() === "/me/lifestyle" && await title() === "Lifestyle", "M6: a reload stays on Lifestyle: " + url());
  // M8: no window fields, the window from the meal times
  ok(await page.getByText("Set my window").count() === 0, "M8: no Set my window");
  ok(/Eating window: 08:00 to 19:00\. From your first and last meal\./.test(await page.locator(".window-line").textContent()), "M8: the window from the meal times: " + await page.locator(".window-line").textContent());
  await page.getByLabel("Dinner time").fill("20:30"); await page.waitForTimeout(400);
  ok(/08:00 to 20:30/.test(await page.locator(".window-line").textContent()), "M8: a later dinner moves the window: " + await page.locator(".window-line").textContent());
  await page.goBack(); await page.waitForTimeout(500);
  ok(url() === "/me" && await title() === "Me", "M6: Back after the reload goes to Me: " + url());
  await page.goBack(); await page.waitForTimeout(500);
  ok(url() === "/today" && await h1() === "Today", "M6: and then to Today: " + url());
  // the goal opened straight from Today: the link up goes to Me, Back from there to Today
  await page.getByRole("button", { name: "Open my goal" }).click(); await page.waitForTimeout(500);
  ok(url() === "/me/goal", "M6: the goal from Today at /me/goal: " + url());
  await page.locator(".menu-head .link").first().click(); await page.waitForTimeout(500);
  ok(url() === "/me" && await title() === "Me", "M6: the link up goes to Me: " + url());
  await page.goBack(); await page.waitForTimeout(500);
  ok(url() === "/today" && await h1() === "Today", "M6: Back from there to Today: " + url());
  // Close from two pages deep, and a tab tapped from inside Me
  await require("./me.cjs")(page);
  await page.locator(".menu-row").filter({ hasText: /^Training week/ }).first().click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Close" }).first().click(); await page.waitForTimeout(700);
  ok(url() === "/today" && await page.locator(".menu-title").count() === 0, "M6: Close from Training week goes to Today: " + url());
  await require("./me.cjs")(page);
  await page.locator(".menu-row").filter({ hasText: /^Profile/ }).first().click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: /^Plan$/ }).first().click(); await page.waitForTimeout(800);
  ok(url() === "/plan" && await h1() === "Plan", "M6: Plan tapped from Profile opens Plan: " + url());
  await page.goBack(); await page.waitForTimeout(600);
  ok(url() === "/today" && await h1() === "Today", "M6: Back from there goes to Today: " + url());
  ok(errs.length === 0, errs.length ? "page errors: " + errs.join(" | ") : "no page errors");
  await b.close(); server.kill();
  process.exit(fail ? 1 : 0);
})();
