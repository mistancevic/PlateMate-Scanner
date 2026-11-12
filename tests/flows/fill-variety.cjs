// DT287 (0.3.142, board Stories215; Coach Milan 12 November 13:28 and 13:32; brainstorm 15:00 to 15:35, Go 15:50): Fill the open
// slots, on the goal and a different week. Each open slot has two or three choices, each with why; the protein of the week
// rotates (chicken twice this week comes after fish); chips per slot: Another protein, Lighter, Something I crave; a tap picks;
// Put them in the plan, on the right, puts the picks in. Serbian.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "seed.json"), "utf8")); seed.items = [];
const F = (n) => seed.foods.find((x) => x.name === n);
const beans = { id: "f-beans", name: "Kidney beans, cooked", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-01T10:00:00Z", readyToEat: true, calories: 127, protein: 8.7, fats: 0.5, carbs: 22.8, fiber: 6.4 };
seed.foods = [...seed.foods, beans];
const it = (id, food, g) => ({ id, food, grams: g, locked: true });
const R = (id, title, main, g) => ({ id, title, savedAt: "2026-10-01T08:00:00Z", items: [it(id + "a", main, g), it(id + "b", F("Rice, cooked"), 150)], portion: g + 150 });
seed.meals = [R("chk", "Chicken and rice", F("Chicken breast, cooked"), 170), R("sal", "Salmon and rice", F("Salmon, cooked"), 170), R("egg", "Eggs and rice", F("Eggs"), 220), R("bea", "Beans and rice", beans, 300)];
const ate = (d, id) => ({ id: "fb" + d, status: "eaten", taste: "", notes: "", createdAt: `2026-11-${String(12 - d).padStart(2, "0")}T13:00:00.000Z`, recipeId: "chk", meal: { ...seed.meals[0], id: "m" + d } });
seed.feedback = [ate(1), ate(2)];
const PORT = "3507", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang = "en", width = 390) => {
    const ctx = await b.newContext({ viewport: { width, height: 1400 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-12T07:00:00+01:00"));
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: seed, lang });
    await require("./adult.cjs")(page);
    await page.goto(U + "/plan"); await page.waitForTimeout(1500);
    await page.locator("button.plan-fill").click(); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const logOf = (page, ev) => page.evaluate((e) => JSON.parse(localStorage.getItem("chefmealan-log") || "[]").filter((x) => x.event === e), ev);
  try {
    let { ctx, page } = await open();
    const fill = page.locator(".fill-rows").last();
    const slots = fill.locator(".fill-slot");
    const n = await slots.count();
    ok(n >= 2, "each open slot is its own block: " + n);
    const counts = []; for (let k = 0; k < n; k++) counts.push(await slots.nth(k).locator(".fill-choice").count());
    ok(counts.every((c) => c >= 2 && c <= 3), "two or three choices per slot: " + counts.join(","));
    ok(await fill.locator(".fill-choice.on").count() === n, "one pick per slot");
    const whys = await fill.locator(".fill-why").allInnerTexts();
    ok(whys.length >= 2 * n && whys.every((x) => x.trim().length > 3) && whys.some((x) => /none yet this week/.test(x)), "each choice says why; a new kind says none yet this week: " + whys.slice(0, 3).join(" | "));
    const picks = await fill.locator(".fill-choice.on b").allInnerTexts();
    ok(picks[0] !== "Chicken and rice" && new Set(picks).size === picks.length, "chicken, twice this week, is not the first pick; no meal twice: " + picks.join(", "));
    const first = slots.first();
    const kindsBefore = await first.locator(".fill-choice b").allInnerTexts();
    await first.getByRole("button", { name: "Another protein" }).click(); await page.waitForTimeout(400);
    const kindsAfter = await first.locator(".fill-choice b").allInnerTexts();
    ok(kindsAfter.length >= 1 && kindsAfter.every((x) => !kindsBefore.includes(x)) && await first.getByRole("button", { name: "Another protein" }).getAttribute("aria-pressed") === "true", "Another protein: other choices, the chip lit: " + kindsAfter.join(", "));
    await first.locator(".fill-choice").nth(kindsAfter.length > 1 ? 1 : 0).click(); await page.waitForTimeout(300);
    const picked = (await first.locator(".fill-choice.on b").innerText()).trim();
    ok(await fill.locator(".fill-choice, .fill-chips button").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "every choice and chip is 44 px or more");
    const put = fill.getByRole("button", { name: "Put them in the plan" });
    const pb = await put.boundingBox(), fb = await fill.boundingBox();
    ok(pb.x + pb.width > fb.x + fb.width - 40, "Put them in the plan sits on the right");
    await put.click(); await page.waitForTimeout(600);
    const planned = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned"))["2026-11-12"]);
    ok(Object.values(planned).some((m) => m.title === picked), "the picks go into the plan: " + picked);
    const ev = { c: await logOf(page, "fill_chip"), p: await logOf(page, "fill_choice") };
    ok(ev.c.length === 1 && ev.c[0].mode === "protein" && ev.p.length === 1, "logged: the chip and the choice");
    await ctx.close();
    ({ ctx, page } = await open("sr-Latn", 390));
    const t = await page.locator(".fill-rows").last().innerText();
    ok(/nijednom ove nedelje|jednom ove nedelje|Po tvom cilju/.test(t) && /Drugi protein/.test(t) && !/none yet this week|Another protein/.test(t) && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "sr-Latn: why and chips in Serbian, fits 390 px");
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
