// JOURNEY INVARIANT (Milan, 7 October 2026, approved on the canvas, boards R1 and R2): Chef Mealan is for adults.
// After the sign-in, the welcome says what Chef Mealan does and that AI can be wrong, and asks for one tap: "I'm 18 or older".
// Nothing else opens and nothing reaches the AI before the tap; the tap is kept with its date and leads to the profile setup.
// A birth year under 18 stops at "Chef Mealan is for adults", gives the reason (the AI), and offers to correct the year.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path");
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT: "3176", GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 2500));
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const api = []; page.on("request", (r) => { if (/\/api\/(scan|chef|out|plate|tip|judge|search|product)/.test(r.url())) api.push(r.url()); });
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  await page.goto("http://127.0.0.1:3176/"); await page.waitForTimeout(900);
  const w = await page.locator("main").textContent();
  ok(/Welcome/.test(w) && /Eat what you crave/.test(w), "the first screen is the welcome");
  ok(/Scan a label or a plate/.test(w) && /Pick what you want to eat/.test(w) && /Ask Chef Mealan/.test(w), "it says what Chef Mealan does, in three lines");
  ok(/AI can get things wrong/.test(w) && /calculator, not from the AI/.test(w) && /That AI is for adults, so Chef Mealan is too/.test(w), "it says AI can be wrong, the numbers come from a calculator, and why adults only");
  ok(await page.getByRole("button", { name: "I'm 18 or older, let's start" }).count() === 1, "one button: I'm 18 or older, let's start");
  ok(await page.locator("nav button").count() === 0 && await page.getByRole("button", { name: "Not now" }).count() === 0, "nothing else opens before the tap");
  ok(api.length === 0, "nothing reaches the server's AI before the tap" + (api.length ? ": " + api.join(", ") : ""));
  await page.getByRole("button", { name: "I'm 18 or older, let's start" }).click(); await page.waitForTimeout(500);
  const at = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-safety") || "{}").adultAt);
  ok(Boolean(at) && !isNaN(Date.parse(at)), "the tap is kept with its date: " + at);
  ok(await page.getByRole("button", { name: "Calculate for me" }).count() === 1, "the tap leads to the profile setup");
  // a birth year under 18, later: the same rule
  await page.evaluate(() => { localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "female", birthYear: new Date().getFullYear() - 16, heightCm: 165, weightKg: 55 })); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-07T08:00:00Z", source: "calc" })); });
  await page.reload(); await page.waitForTimeout(900);
  const stop = await page.locator("main").textContent();
  ok(/Chef Mealan is for adults/.test(stop) && /only allowed for adults/.test(stop) && /under 18/.test(stop), "a birth year under 18: Chef Mealan is for adults, and the reason is the AI");
  ok(await page.locator("nav button").count() === 0, "nothing else opens");
  ok(await page.getByRole("button", { name: "Correct my birth year" }).count() === 1, "the way out: Correct my birth year");
  console.log(errs.length ? "FAIL page errors: " + errs.join("; ") : "ok   no page errors"); if (errs.length) fail++;
  await b.close(); server.kill(); process.exitCode = fail ? 1 : 0;
})();
