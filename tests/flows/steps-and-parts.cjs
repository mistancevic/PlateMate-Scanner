// DT345 and B162 (0.3.188, boards Stories289 and Stories288; Coach Milan, Go 23 November 2026, 20:36), from his recipe Lazy
// burek: in Edit recipe, + Step here between two steps puts an empty step there with the cursor in it, saved in its place;
// + Add a step still adds at the end; an empty step goes on save. The recipe page shows each part once, in the order the
// parts first come; foods with no part last, under Other; a recipe with no parts shows no heading.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined });
const Q = food("q", "Grainy cream cheese", 100, 12, 3, 4.5, 0), P = food("p", "Puff pastry", 400, 6, 36, 25, 1.5), S = food("s", "Salt", 0, 0, 0, 0, 0), E = food("e", "Eggs", 143, 12.6, 0.7, 9.5, 0),
  SE = food("se", "Sesame seeds", 573, 18, 12, 50, 12), F = food("f", "Feta, light", 180, 17, 1, 12, 0), O = food("o", "Avocado oil", 884, 0, 0, 100, 0);
const it = (id, f, g, part) => ({ id, food: f, grams: g, locked: false, ...(part ? { part } : {}) });
const items = [it("a", Q, 250, "Filling"), it("b", P, 375, "Base"), it("c", S, 3, "Filling"), it("d", E, 122, "Filling"), it("g", SE, 15), it("h", F, 150, "Filling"), it("i", O, 10, "Filling")];
const recipe = { id: "m-burek", title: "Lazy burek", items, makes: { n: 4, unit: "portions" }, portion: 231, steps: ["Mix the filling in a bowl.", "Lay out the pastry on baking paper.", "Pour the filling onto the pastry.", "Bake at 200 °C for 25 minutes.", "Rest for 5 minutes before slicing."], savedAt: "2026-11-23T16:00:00Z" };
const plain = { id: "m-plain", title: "Rice and eggs", items: [it("x", E, 122), it("y", Q, 100)], portion: 222, steps: ["Mix."], savedAt: "2026-11-23T16:00:00Z" };
const PORT = "3613", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (id) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1000 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-23T20:30:00+01:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, Q, P, S, E, SE, F, O], meals: [recipe, plain], feedback: [] });
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + "/my-recipes/" + id); await page.waitForTimeout(1500);
    return page;
  };
  const foodsOrder = (page) => page.evaluate(() => { const c = [...document.querySelectorAll("section.card")].find((x) => (x.querySelector("b")?.textContent || "").trim() === "Foods"); return [...c.querySelectorAll(".rq-part, .rq-food small:first-child")].map((e) => (e.classList.contains("rq-part") ? "#" : "") + e.textContent.trim()); });
  const steps = async (page) => (await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals.find((m) => m.id === "m-burek").steps));
  try {
    let page = await open("m-burek");
    const order = await foodsOrder(page);
    ok(order.join(" | ") === "#Filling | Grainy cream cheese | Salt | Eggs | Feta, light | Avocado oil | #Base | Puff pastry | #Other | Sesame seeds", "B162 AC1, AC2: each part once, no part last under Other: " + order.join(" | "));
    ok((await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).meals[0].items.map((i) => i.food.id).join(" "))) === "q p s e se f o", "B162: nothing stored changes");
    await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(500);
    const between = page.getByRole("button", { name: /^Add a step between step \d and step \d$/ });
    ok(await between.count() === 4, "DT345: a button between each two of five steps (+ Add a step since DT348, 0.3.197): " + await between.count());
    ok(await between.first().evaluate((e) => e.getBoundingClientRect().height >= 44), "DT345: 44 px or more");
    await page.getByRole("button", { name: "Add a step between step 3 and step 4" }).click(); await page.waitForTimeout(400);
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    ok(focused === "Step 4", "DT345 AC1: an empty step 4, the cursor in it: " + focused);
    await page.keyboard.type("Spray the oil over the filling and sprinkle the sesame.");
    ok((await page.locator(".st-row").count()) === 6, "DT345 AC1: six steps now");
    await page.getByRole("button", { name: "Add a step between step 1 and step 2" }).click(); await page.waitForTimeout(300);
    await page.locator(".st-add").click(); await page.waitForTimeout(300); await page.keyboard.type("Serve warm.");
    await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(700);
    const st = await steps(page);
    ok(st.length === 7 && st[3] === "Spray the oil over the filling and sprinkle the sesame." && st[4] === "Bake at 200 °C for 25 minutes." && st[6] === "Serve warm.", "DT345 AC2, AC3, AC4: saved in its place, the end step at the end, the empty one gone: " + st.length);
    await page.context().close();
    page = await open("m-plain");
    ok((await foodsOrder(page)).every((x) => !x.startsWith("#")), "B162 AC3: no parts, no heading");
    await page.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
