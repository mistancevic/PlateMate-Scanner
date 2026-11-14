// JOURNEY (B143, 0.3.149, board Stories222; Coach Milan 14 November 17:20, Go 17:54): on Plan, Fill with Chef Mealan opens at the
// top of his answer, under the sticky heads, with the first meal in view. A tap on a meal, a chip or Put them in the plan leaves the
// page where it is: the page moves only when a new message arrives. After Put them in the plan: In the plan on its own line, in line
// with the meal names; under it one row, Undo on the left and Back to the plan on the right, both 44 px and level. Undo is a white
// button with a blue border, no underline. Run on a phone-sized screen.
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
const PORT = "3522", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: path.resolve(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang = "en", width = 390) => {
    const ctx = await b.newContext({ viewport: { width, height: 844 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
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
    const { ctx, page } = await open();
    const top = () => page.evaluate(() => { const bs = [...document.querySelectorAll(".chat-screen .chat > .bubble")]; const last = bs[bs.length - 1]; const head = document.querySelector(".chat-screen .chat-head").getBoundingClientRect(); return { y: Math.round(scrollY), max: Math.round(document.scrollingElement.scrollHeight - innerHeight), lastTop: Math.round(last.getBoundingClientRect().top), headBottom: Math.round(head.bottom) }; });
    const t0 = await top();
    ok(t0.y > 0 && t0.lastTop >= t0.headBottom && t0.lastTop <= t0.headBottom + 40 && t0.y < t0.max, "Fill opens at the top of Chef Mealan's answer, under the heads, not at the bottom: " + JSON.stringify(t0));
    ok(await page.locator(".fill-rows .fill-choice").first().evaluate((e) => { const r = e.getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; }), "the first meal to choose is in view");
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(200);
    await page.locator(".fill-rows .fill-slot").first().locator(".fill-choice").nth(1).dispatchEvent("click"); await page.waitForTimeout(700);
    ok((await top()).y === 0, "a tap on a meal leaves the page where it is");
    await page.locator(".fill-rows .fill-slot").first().getByRole("button", { name: "Lighter" }).dispatchEvent("click"); await page.waitForTimeout(700);
    ok((await top()).y === 0, "a chip leaves the page where it is");
    const before = await top();
    await page.locator(".fill-rows").last().getByRole("button", { name: "Put them in the plan" }).dispatchEvent("click"); await page.waitForTimeout(700);
    ok((await top()).y <= before.y, "Put them in the plan does not move the page down");
    const g = await page.evaluate(() => { const r = (e) => { const b = e.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), h: Math.round(b.height) }; }; const f = document.querySelector(".fill-done"); const u = f.querySelector(".pill-action"); return { line: r(f.querySelector(".fill-done-line")), line_t: f.querySelector(".fill-done-line").textContent, undo: r(u), undo_t: u.textContent, deco: getComputedStyle(u).textDecorationLine, back: r(f.querySelector(".pill-primary")), back_t: f.querySelector(".pill-primary").textContent, meal: r(document.querySelector(".fill-rows .fill-row b")), row: r(document.querySelector(".fill-rows .fill-row")) }; });
    ok(/✓ In the plan/.test(g.line_t) && g.line.l === g.meal.l, "In the plan on its own line, in line with the meal names");
    ok(g.undo_t === "Undo" && g.back_t === "Back to the plan" && g.undo.t === g.back.t && g.undo.t > g.line.t + g.line.h - 2, "under it one row: Undo and Back to the plan, level");
    ok(g.undo.h >= 44 && g.back.h >= 44 && g.undo.r - g.undo.l >= 60 && g.deco === "none", "both 44 px or more; Undo has no underline: " + JSON.stringify({ u: g.undo, b: g.back, deco: g.deco }));
    ok(g.undo.l === g.meal.l && Math.abs(g.back.r - g.row.r) <= 1, "Undo on the left, in line with the meals; Back to the plan's edge in line with the lines between the meals");
    await page.locator(".fill-done .pill-action").dispatchEvent("click"); await page.waitForTimeout(500);
    ok(await page.getByRole("button", { name: "Put them in the plan" }).count() >= 1, "Undo takes the meals out again");
    await ctx.close();
  } catch (e) { ok(false, "walkthrough crashed: " + (e && e.message)); }
  ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  await b.close(); server.kill();
  console.log(fail ? `\n${fail} FAILED` : "\nall passed"); process.exit(fail ? 1 : 0);
})();
