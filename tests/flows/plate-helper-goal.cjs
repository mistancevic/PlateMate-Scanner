// DT286 (0.3.142, board Stories215; Coach Milan with Tester 2, 12 November; brainstorm 15:00 to 15:35, Go 15:50): Chef Mealan on
// the Plate. It opens with the answer for the goal; each suggestion shows its amount and what it does to PD and kcal, and Add puts
// that amount on the plate; More like this asks for more of the same, never the same again; chips pick the direction; Something I
// crave adds how to stay close to the goal; one conversation, no second chat; what was said for this dish is not said again.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.feedback = []; seed.meals = [];
const salad = { id: "f-orijenta", name: "Orijenta salad", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-01T10:00:00Z", readyToEat: true, calories: 19, protein: 1.3, fats: 0.4, carbs: 2.6, fiber: 1.5 };
seed.foods = [...seed.foods, salad]; seed.items = [{ id: "i1", food: salad, grams: 150, locked: false }];
const S = (food, grams, kcal, prot, why) => ({ action: "add", food, replaces: null, grams, calories: kcal, protein: prot, fats: 2, carbs: 0, why, known: false });
const ANS = {
  goal: [{ reply: "Your plate is low on protein: PD 5.3, your target 6.5. Three ways to get there:", suggestions: [S("Turkey breast, cooked", 120, 110, 24, "Mild and juicy."), S("Eggs, boiled", 100, 155, 13, "A classic."), S("Tuna in water", 110, 105, 24, "Quick.")] },
    { reply: "", suggestions: [S("Shrimp, cooked", 100, 99, 24, "Light and sweet."), S("Chickpeas, cooked", 120, 164, 9, "Nutty."), S("Mozzarella light", 60, 160, 19, "Creamy.")] }],
  crave: [{ reply: "Something tasty, then. Here is how each one changes your plate.", close: "To stay close to your goal: add 120 g turkey breast too.", suggestions: [S("Feta, crumbled", 50, 264, 14, "Salty and creamy.")] }],
};
const PORT = "3506", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang = "en", width = 390) => {
    const ctx = await b.newContext({ viewport: { width, height: 1300 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-12T12:40:00+01:00"));
    const asked = []; const seen = { goal: 0, crave: 0 };
    await page.route("**/api/plate", (r) => { const body = JSON.parse(r.request().postData() || "{}"); asked.push(body); const d = body.direction || "goal"; const list = ANS[d] || ANS.goal; const a = list[Math.min(seen[d] ?? 0, list.length - 1)]; seen[d] = (seen[d] ?? 0) + 1; r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...a, direction: d, ms: 5 }) }); });
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: seed, lang });
    await require("./adult.cjs")(page);
    await page.goto(U + "/plate"); await page.waitForTimeout(1500);
    return { ctx, page, asked };
  };
  const logOf = (page, ev) => page.evaluate((e) => JSON.parse(localStorage.getItem("chefmealan-log") || "[]").filter((x) => x.event === e), ev);
  try {
    let { ctx, page, asked } = await open();
    await page.locator(".chat-fab").click(); await page.waitForTimeout(1000);
    const h = page.locator(".helper");
    ok(asked.length === 1 && asked[0].direction === "goal" && asked[0].context && /Lunch/.test(asked[0].context.meal) && typeof asked[0].context.leftKcal === "number", "it opens with the goal, and sends the meal and what is left today: " + JSON.stringify(asked[0] && asked[0].context));
    ok(/Your plate is low on protein/.test(await h.innerText()) && /Lunch, 13:45/.test(await h.locator(".helper-context").innerText()), "the answer for the goal, under the meal and what is left today");
    const nums = await h.locator(".helper-nums").allInnerTexts();
    ok(nums.length === 3 && nums.every((x) => /^\d+ g · PD [\d.]+ → [\d.]+ · \+\d+ kcal$/.test(x)), "each suggestion says its amount and what it does: " + nums[0]);
    ok((await h.locator(".helper-take").first().innerText()).trim() === "+ 120 g", "Add says the amount: + 120 g");
    ok(await h.getByRole("button", { name: /Talk to Chef Mealan/ }).count() === 0 && (await h.locator("input").first().inputValue()) === "" && await h.locator("input").first().getAttribute("placeholder") === "Ask about this plate…", "one conversation: no second chat, the field empty");
    const chips = (await h.locator(".helper-dirs button").allInnerTexts()).map((x) => x.trim());
    ok(chips.join(" | ") === "Better for my goal | Another protein | Other carbs | Crunchier | Something I crave | Something else entirely" && await h.locator(".helper-dirs button[aria-pressed=true]").innerText() === "Better for my goal", "the six chips, the goal lit");
    ok(await h.locator(".helper-dirs button, .helper-take, .helper-more").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "every button is 44 px or more");
    await h.getByRole("button", { name: "More like this" }).click(); await page.waitForTimeout(800);
    ok(asked[1].direction === "goal" && ["Turkey breast, cooked", "Eggs, boiled", "Tuna in water"].every((n) => asked[1].avoid.includes(n)) && await h.locator(".suggestion").count() === 6, "More like this: the same direction, the three shown not again, six now");
    await h.locator(".helper-take").first().click(); await page.waitForTimeout(500);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items);
    ok(st.length === 2 && st[1].food.name === "Turkey breast, cooked" && st[1].grams === 120, "Add puts 120 g turkey breast on the plate");
    await h.locator(".helper-dirs").getByRole("button", { name: "Something I crave" }).click(); await page.waitForTimeout(800);
    ok(asked[2].direction === "crave" && /To stay close to your goal/.test(await h.locator(".helper-close").innerText()), "Something I crave: how to stay close to the goal, in its own box");
    const ev = { d: await logOf(page, "plate_direction"), m: await logOf(page, "plate_more"), a: await logOf(page, "plate_add") };
    ok(ev.d.length === 2 && ev.d[1].dir === "crave" && ev.m.length === 1 && ev.a.length === 1 && ev.a[0].dir === "goal" && ev.a[0].grams === 120, "logged: the directions, More like this, and Add with its direction");
    await h.getByRole("button", { name: "Close" }).first().click(); await page.waitForTimeout(400);
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = s.items.slice(0, 1); localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
    await page.reload(); await page.waitForTimeout(1500);
    await page.locator(".chat-fab").click(); await page.waitForTimeout(1000);
    ok(asked[3].direction === "goal" && asked[3].avoid.includes("Turkey breast, cooked") && asked[3].avoid.includes("Shrimp, cooked") && !asked[3].library.slice(0, 3).some((f) => asked[3].avoid.includes(f.name)), "the same dish again: what was said before is sent as not to repeat, and kept out of the foods");
    await ctx.close();
    for (const [lang, width, goal] of [["sr-Latn", 390, "Bolje za moj cilj"], ["de", 360, "Besser für mein Ziel"]]) {
      ({ ctx, page } = await open(lang, width));
      await page.locator(".chat-fab").click(); await page.waitForTimeout(1000);
      const t = await page.locator(".helper-dirs").innerText();
      ok(t.includes(goal) && !/Another protein|More like this/.test(await page.locator(".helper").innerText()) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${lang}: the chips in the language, fits ${width} px`);
      await ctx.close();
    }
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
