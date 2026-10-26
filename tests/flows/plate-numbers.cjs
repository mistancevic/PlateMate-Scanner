// JOURNEY (0.2.109, board Stories86, DT129; Milan 26 October 13:09 to 15:06): the PD block reads at a glance, the numbers on a
// tap. The heading is the meal by name; beside PD the status and Energy, Weight, Protein with the plate's numbers, right
// aligned; under the number the four letters on one line. A tap opens Against your planned day: the plate against the meal
// planned in this slot (Plate, Planned, %), then what is in it (g, kcal, % plate, % day, a Total). No meal planned: no first part.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, fiber) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, table: undefined });
const CH = F("ch", "Chicken breast, grilled", 165, 31, 3.6, 0, 0), RI = F("ri", "Rice, cooked", 130, 2.7, 0.3, 28, 0.4);
seed.foods = [CH, RI, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: CH, grams: 200, locked: false }, { id: "b", food: RI, grams: 250, locked: false }];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3274", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (planned) => {
    const page = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-26T13:05:00"));
    await page.addInitScript(([s, planned]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (planned) localStorage.setItem("chefmealan-planned", JSON.stringify({ "2026-10-26": { lunch: planned } }));
      localStorage.setItem("seeded", "1"); }, [seed, planned]);
    await require("./adult.cjs")(page);
    await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "A plain plate.", around: "", better_as: "" }) }));
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + "/plate"); await page.waitForTimeout(1600);
    return page;
  };
  const txt = (page, sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " ").trim());
  // a lunch planned with its foods: chicken 250 g, rice 300 g
  const planned = { title: "Chicken and rice", kcal: 803, protein: 86, source: "mine", items: [{ id: "p1", food: CH, grams: 250, locked: false }, { id: "p2", food: RI, grams: 300, locked: false }], portion: 550 };
  let page = await open(planned);
  ok(/^Lunch/.test(await txt(page, ".plate-card .readout-top")), "DT129: the heading is the meal by name: " + await txt(page, ".plate-card .readout-top"));
  const rows = await txt(page, ".readout .rd-rows");
  ok(/^Energy ?655 ?kcal ?Weight ?450 ?g ?Protein ?69 ?g$/.test(rows), "DT129: beside PD, Energy, Weight, Protein with the plate's numbers: " + rows);
  ok(!/ of /.test(await txt(page, ".readout")), "DT129: nothing about the plan in the block");
  const letters = await page.locator(".readout .letters-line .letters").allTextContents();
  ok(letters.length === 4, "DT129: the four letters on one line: " + letters.join(" "));
  ok(await page.locator(".nt").count() === 0, "DT129: the numbers wait for a tap");
  await page.locator(".readout .letters-row").click(); await page.waitForTimeout(300);
  ok(await page.locator(".nt").count() === 1 && await page.locator(".readout .nt").count() === 0, "DT129: the tap opens the numbers under the PD block");
  const plan = (await page.locator(".nt-plan.nt-row").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(/^Energy ?655 kcal ?803 kcal ?82%$/.test(plan[0]) && /^Weight ?450 g ?550 g ?82%$/.test(plan[1]) && /^Protein ?69 g ?86 g ?80%$/.test(plan[2]), "DT129: the plate and your plan, Plate, Planned, %: " + plan.join(" | "));
  const tot = await txt(page, ".nt-total");
  ok(/^Total ?450 ?655 ?100 ?\d+$/.test(tot), "DT129: the Total row: weight, kcal, 100, share of the day: " + tot);
  const fat = await txt(page, ".nt-in.nt-row");
  ok(/^Fat ?8 ?72 ?11 ?\d+$/.test(fat), "DT129: fat: 8 g, 72 kcal, 11% of the plate, its share of the day: " + fat);
  await page.locator(".nt").getByRole("button", { name: /Per 100 kcal/ }).click(); await page.waitForTimeout(200);
  ok(/protein: [\d.]+ g per 100 kcal/.test(await txt(page, ".nt")), "DT129: Per 100 kcal keeps the four sentences");
  await page.locator(".readout .letters-row").click(); await page.waitForTimeout(200);
  ok(await page.locator(".nt").count() === 0, "DT129: a second tap closes it");
  await page.close();
  // no meal planned: the table has no first part
  page = await open(null);
  await page.locator(".readout .letters-row").click(); await page.waitForTimeout(300);
  ok(await page.locator(".nt").count() === 1 && await page.locator(".nt-plan").count() === 0 && await page.locator(".nt-total").count() === 1, "DT129: no meal planned: only what is in it");
  await page.close();
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
