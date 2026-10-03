// JOURNEY INVARIANT (safety, 4 October 2026): consent before body data; the door asks the situations; a ticked eating situation
// switches Mealan's chat off and the plate keeps working; a declared allergy never shows up as a partner and the label check says
// what a pack contains; Export my data gives one file with everything. Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8"));
seed.items = [];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3197", GEMINI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const ctx = await b.newContext({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 2, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
  await page.goto("http://127.0.0.1:3197/"); await page.waitForTimeout(900);
  const safety = () => page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-safety") || "null"));

  // consent before body data
  await page.getByRole("button", { name: "Settings" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Profile/ }).first().click(); await page.waitForTimeout(400);
  ok(await page.getByText("Before your numbers").count() === 1, "the consent screen comes before the body fields");
  ok(await page.locator(".form.shut").count() === 1, "the body fields are shut until consent");
  await page.getByRole("button", { name: /^I agree$/ }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".form.shut").count() === 0 && (await safety()).consentBodyAt, "I agree opens the fields and records consent");

  // the door: a situation ticked, an allergy declared
  await page.getByText("A difficult relationship with eating").click(); await page.waitForTimeout(100);
  await page.getByPlaceholder("milk, peanuts, gluten").fill("milk");
  await page.locator(".door").getByRole("button", { name: /^Save$/ }).click(); await page.waitForTimeout(400);
  const s1 = await safety();
  ok(s1.situations.includes("eating") && s1.situations.includes("allergies") && s1.allergies[0] === "milk", "the door is recorded: " + s1.situations.join(","));
  ok(s1.flags.some((f) => f.situation === "eating" && f.source === "door"), "the flag carries its source and date");
  ok(await page.locator(".door .notice").count() === 1 && /coach confirms/.test(await page.locator(".door .notice").textContent()), "the person is told the chat is off until the coach confirms");

  // the chat is off, the plate works
  await page.getByRole("button", { name: /Back|Close/ }).first().click().catch(() => {}); await page.waitForTimeout(300);
  await page.goto("http://127.0.0.1:3197/"); await page.waitForTimeout(800);
  await page.locator(".chat-fab").first().click(); await page.waitForTimeout(500);
  ok(await page.locator(".safety-note.off").count() >= 1, "the chat shows Mealan, chef only here, and that it is off");
  await page.getByRole("button", { name: /No idea, inspire me/ }).click().catch(() => {}); await page.waitForTimeout(400);
  ok(/until your coach confirms/.test(await page.locator(".chat-screen").first().textContent()), "a question gets the fixed line, not the model");
  await page.getByRole("button", { name: /^Close$/ }).first().click().catch(() => {}); await page.waitForTimeout(300);

  // the allergy: never a partner, and the label check says so
  await page.locator("nav button").filter({ hasText: "Foods" }).click(); await page.waitForTimeout(400);
  await page.locator("button", { hasText: /^Nutella$/ }).first().click(); await page.waitForTimeout(500);
  const chips = await page.locator(".mix-chip").allTextContents();
  ok(chips.every((c) => !/Skyr|Quark|yogurt|Cottage|Whey|Milk/i.test(c)), "no dairy partner for someone avoiding milk: " + (chips.length ? chips.join(" | ").slice(0, 60) : "no mix offered"));
  await page.locator(".sheet-backdrop").first().click({ position: { x: 5, y: 5 } }).catch(() => {}); await page.waitForTimeout(200);
  await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^Type it$/ }).click(); await page.waitForTimeout(400);
  const sheet = page.locator(".modal").last();
  await sheet.locator("input").first().fill("Molke Drink");
  const names = await sheet.locator(".lt-row .lt-name").allTextContents();
  const fill = async (re, v) => { const i = names.findIndex((n) => re.test(n)); await sheet.locator(".lt-row input").nth(i).fill(v); };
  await fill(/Energ/i, "60"); await fill(/Protein|Eiwei/i, "8"); await page.waitForTimeout(300);
  ok(/Contains what you avoid: milk/.test(await sheet.textContent()), "the label check says the pack contains what they avoid");
  await page.getByRole("button", { name: "Close dialog" }).first().click(); await page.waitForTimeout(300);

  // export: one file with everything
  await page.getByRole("button", { name: "Settings" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Account/ }).first().click(); await page.waitForTimeout(400);
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }).catch(() => null), page.getByRole("button", { name: /Export my data/ }).click()]);
  if (dl) {
    const file = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
    ok(file.personal && file.safety && Array.isArray(file.foods) && Array.isArray(file.cards) && file.goal, "the export holds profile, safety, foods, cards and goal");
    ok(file.safety.allergies[0] === "milk", "and the declarations are in it");
  } else ok(false, "no export file came");
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
