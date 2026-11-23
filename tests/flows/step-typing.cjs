// B161 (0.3.190, board Stories291; Coach Milan 23 November 2026, 21:39: implement it and we will see): with Samsung Keyboard a
// space at the end of a step dropped the cursor. The keyboard builds each word in a draft (composition); nothing is read while
// a word is built, the steps go up a moment after the last key or when the field is left. Typed here with the browser's own
// keyboard commands, a space then a word built letter by letter: the cursor stays, the word is kept, Save changes keeps it.
const { chromium, devices } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8")); seed.items = [];
const P = { ...seed.foods[0], id: "p", name: "Frischer Blätterteig", brand: "", source: "label", barcode: "1", calories: 400, protein: 6, carbs: 36, fats: 25, fiber: 1, photo: undefined, photos: undefined };
const recipe = { id: "m-burek", title: "Lazy Burek", items: [{ id: "b", food: P, grams: 375, locked: false }], portion: 375, savedAt: "2026-11-23T16:00:00Z", steps: ["Preheat your oven to 200 °C.", "Put baking paper and lay out [[i:b|frischer blätterteig]]", "Bake at 200 °C for 25 minutes."] };
const PORT = "3615", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const ctx = await b.newContext({ ...devices["Pixel 7"], timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, P], meals: [recipe], feedback: [] });
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  try {
    await page.goto(U + "/my-recipes/m-burek"); await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(500);
    const f = page.getByRole("textbox", { name: "Step 2" }); await f.tap(); await page.waitForTimeout(200);
    await page.evaluate(() => { const el = document.querySelector('[aria-label="Step 2"]'); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    const cdp = await ctx.newCDPSession(page);
    const word = async (w) => { for (let i = 1; i <= w.length; i++) await cdp.send("Input.imeSetComposition", { text: w.slice(0, i), selectionStart: i, selectionEnd: i }); await cdp.send("Input.insertText", { text: w }); };
    await cdp.send("Input.insertText", { text: " " }); await page.waitForTimeout(100);
    ok(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")) === "Step 2", "B161 AC1: after a space at the end, the cursor is still in step 2");
    await word("on"); await cdp.send("Input.insertText", { text: " " }); await word("the"); await cdp.send("Input.insertText", { text: " " }); await word("tray.");
    await page.waitForTimeout(100);
    ok(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")) === "Step 2", "B161 AC1: words built by the keyboard, the cursor stays");
    ok(/375 g Frischer Blätterteig on the tray\.$/.test((await f.innerText()).trim()), "B161 AC1: the step holds the new words: " + (await f.innerText()).trim());
    ok(await page.locator(".st-chip.used").count() === 1, "B161 AC3: the food's button keeps its tick");
    await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(700);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals[0].steps[1]);
    ok(st === "Put baking paper and lay out [[i:b|frischer blätterteig]] on the tray.", "B161 AC2: Save changes keeps it: " + st);
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
