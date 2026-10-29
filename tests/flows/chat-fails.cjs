// DT152 (0.2.132, canvas Page 2, board Stories104; Coach Milan 29 October 10:22 and 10:55 "Go", from Tester 3 Marko's testing):
// when Chef Mealan doesn't answer, the chat says so as his answer, right under the question: the reason in one line, and
// Your question and the plate are kept. Ask again sends the same question; Back to the plate when the chat came from the
// Plate. The app's message at the bottom is not used for it. After Ask again the failed line greys, with Asked again.
// Chef Mealan's answers are stand-ins (no AI).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, favorite: false, ...extra });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, { serving: { grams: 50, name: "bar" } });
const YE = F("yeast", "Active dry yeast", 325, 40, 7, 41, { favorite: true }), SKYR = F("skyr", "Skyr, natural", 63, 11, 0.2, 4);
seed.foods = [BAR, YE, SKYR, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 50, locked: false }, { id: "b", food: YE, grams: 7, locked: false }];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3327", U = `http://127.0.0.1:${PORT}`;
const ANSWER = { reply: "Low-fat quark and an apple go well with your protein bar. You can skip the active dry yeast unless you are planning to bake.", recognised: [], picks: [], skip: ["Active dry yeast"], named: ["low-fat quark", "apple"] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-29T12:30:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { week: 5 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: false, why: "A bar and yeast do not make a lunch.", around: "Clean Protein Bar Peanut Love", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const calls = []; let mode = "slow";
  await page.route("**/api/out", (r) => { calls.push(r.request().postDataJSON());
    if (mode === "slow") return r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Chef Mealan took too long and stopped. Try again in a moment." }) });
    if (mode === "offline") return r.abort("internetdisconnected");
    return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ANSWER) }); });
  const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
  await page.goto(U + "/plate"); await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Ask Chef Mealan for a dish around it" }).first().click(); await page.waitForTimeout(1500);
  // the failure is his answer, under the question
  const bubbles = page.locator(".chat .bubble");
  const failed = page.locator(".bubble.mealan").last();
  ok(await bubbles.count() === 2 && await page.locator(".bubble.you").count() === 1, "DT152: two bubbles, the question and the answer");
  ok(await text(failed.locator("p")) === "I didn't answer this time: I took too long and stopped. Your question and the plate are kept.", "DT152: the reason in one line, and what is kept: " + await text(failed));
  ok(await failed.getByRole("button", { name: "Ask again" }).count() === 1 && await failed.getByRole("button", { name: "Back to the plate" }).count() === 1, "DT152: Ask again and Back to the plate under it");
  ok(await page.locator(".toast.notice").count() === 0, "DT152: no message at the bottom");
  // Ask again sends the same question; the answer lands under it
  mode = "ok";
  await failed.getByRole("button", { name: "Ask again" }).click(); await page.waitForTimeout(1200);
  ok(calls.length === 2 && calls[1].text === calls[0].text && /^What dish can I make around what is on my plate/.test(calls[1].text), "DT152: Ask again sends the same question: " + calls[1]?.text);
  ok(!JSON.stringify(calls[1].history).includes("didn't answer"), "DT152: the failed line is not sent as history");
  ok(await page.locator(".bubble.you").count() === 1, "DT152: the question is not repeated in the chat");
  const first = page.locator(".bubble.mealan").first();
  ok(await first.evaluate((el) => el.classList.contains("bubble-greyed")) && /Asked again/.test(await text(first)) && await first.getByRole("button", { name: "Ask again" }).count() === 0, "DT152: the failed line greys, Asked again, no button");
  ok(/Low-fat quark and an apple/.test(await text(page.locator(".bubble.mealan").last())) && await page.locator(".bubble.mealan").last().locator(".chat-rows .tip-row").count() >= 2, "DT152: the answer lands under it, with its rows");
  // no connection: says so
  mode = "offline";
  await page.getByPlaceholder("Or ask in your words").fill("Something sweet for after lunch?"); await page.getByRole("button", { name: "Send" }).click(); await page.waitForTimeout(1200);
  const off = page.locator(".bubble.mealan").last();
  ok(/^I didn't answer this time: I couldn't be reached just now\. Check the connection\. Your question and the plate are kept\.$/.test(await text(off.locator("p"))), "DT152: no connection, said plainly: " + await text(off.locator("p")));
  // Back to the plate closes the chat
  await off.getByRole("button", { name: "Back to the plate" }).click(); await page.waitForTimeout(500);
  ok(await page.locator(".talk-overlay").count() === 0 && /\/plate/.test(page.url()), "DT152: Back to the plate closes the chat on the Plate");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
