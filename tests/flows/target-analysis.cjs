// JOURNEY INVARIANT (Milan, 6 October 2026): own numbers are checked where they are. All four fields typeable per day;
// a blank one fills in and says so; a row that does not add up says what it comes to; a finding about a day sits under
// that day, one about the week under the week's line; Keep, on purpose remembers it; Save says how many are kept.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3184", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.addInitScript(() => {
    localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, life: "desk", week: { passive: 2, active: 1, easy: 2, hard: 2 }, easyMin: 60, hardMin: 75, dayMode: "each" }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], allergies: [], flags: [], consentBodyAt: "2026-10-05T10:00:00Z", consentBy: "self", none: true, declaredAt: "2026-10-05T10:00:00Z" }));
  });
  await page.goto("http://127.0.0.1:3184/"); await page.waitForTimeout(900);
  await page.getByRole("button", { name: /^My own numbers$/ }).click(); await page.waitForTimeout(200);
  await page.getByRole("button", { name: /^Maintain$/ }).click().catch(() => {}); await page.waitForTimeout(150);
  const put = async (label, v) => { const f = page.getByLabel(label, { exact: true }); await f.fill(v); await f.press("Enter"); await page.waitForTimeout(120); };
  await put("Rest, kcal", "2900"); await put("Rest, protein in grams", "185"); await put("Rest, fat in grams", "108"); await put("Rest, carbs in grams", "297");
  await put("Light, kcal", "3100"); await put("Light, protein in grams", "190");
  await put("Moderate, kcal", "3200"); await put("Moderate, protein in grams", "190"); await put("Moderate, fat in grams", "90"); await put("Moderate, carbs in grams", "400");
  const block = (name) => page.locator(".dt-block").filter({ has: page.locator(".dt-block-head b", { hasText: new RegExp("^" + name + "$") }) });
  ok(/Set by you/.test(await block("Rest").textContent()), "all four typed: Set by you");
  ok(/Fat and carbs filled/.test(await block("Light").textContent()), "a blank fat and carbs fill in and say so");
  ok(/These come to 3,170, not 3,200: 30 kcal apart/.test(await block("Moderate").textContent()), "a row that does not add up says what it comes to");
  ok(/Calculated, nothing typed/.test(await block("Hard").textContent()), "an empty day is calculated and says so");
  ok((await block("Moderate").locator(".finding").count()) === 1 && /Carbs are low for a training day/.test(await block("Moderate").locator(".finding").textContent()), "the carbs finding sits under its day");
  ok(/more like building than maintain/.test(await page.locator(".dt-week .finding").first().textContent()), "the energy finding sits under the week's line");
  const save = page.getByRole("button", { name: /Save, \d kept as|Set my day/ });
  ok(/Save, 2 kept as they are/.test(await save.textContent()), "Save says how many are kept: " + (await save.textContent()));
  await block("Moderate").getByRole("button", { name: "Keep, on purpose" }).click(); await page.waitForTimeout(200);
  ok(/Kept on purpose: carbs are low/.test(await block("Moderate").textContent()) && /Save, 1 kept as it is/.test(await save.textContent()), "Keep, on purpose remembers it, and Save counts one less");
  await page.locator(".dt-week .finding").first().getByRole("button", { name: "Change it" }).click(); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.activeElement && /kcal/.test(document.activeElement.getAttribute("aria-label") || "")), "Change it puts the cursor in the field it's about");
  await save.click(); await page.waitForTimeout(600);
  const pers = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")));
  ok(pers.kept && pers.kept.energy && pers.kept["carbs-easy"], "saving with one open keeps it on purpose: " + Object.keys(pers.kept || {}).join(","));
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
