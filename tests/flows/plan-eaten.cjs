// B167 (0.3.191, board Stories292; Coach Milan, Go 23 November 22:57): one dinner, the same on Today and in Plan. On the
// phone it is Monday 23 November 2026, 22:24; Dinner is at 18:00; Lazy Burek was eaten at 18:28. Plan on today shows the
// eaten dinner as a past day does, and its numbers count it (AC1 to AC3). Save at the end of a cook into Dinner asks
// first: Dinner is already eaten today, Update that meal, Keep both, Back (AC4, AC5). Deleting the meal the cook saved
// ends the cook (AC6). Today counts a meal once (AC7). The checks name AC1 to AC7.
const fs = require("node:fs"), path = require("node:path");
const start = require("./plate157.cjs");
const PORT = "3616";
const base = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8"));
const food = (id, name, brand, calories, protein, carbs, fats, fiber) => ({ ...base.foods[0], id, name, brand, source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined });
const Q = food("q", "Körniger Frischkäse Tworog 2,5% Fett", "Milbona", 100, 12, 3, 4.5, 0), P = food("p", "Frischer Blätterteig", "Henglein", 400, 6, 36, 25, 1.5),
  T = food("t", "Feta leicht", "Salakis", 200, 17, 1, 14, 0), E = food("e", "Eggs", "", 143, 12.6, 0.7, 9.5, 0);
const it = (id, f, g) => ({ id, food: f, grams: g, locked: false });
const items = [it("a", Q, 250), it("b", P, 375), it("c", T, 150), it("d", E, 120)];
const recipe = { id: "m-burek", title: "Lazy Burek", items, portion: 895, steps: ["Mix the cheeses and eggs.", "Spread on the pastry, roll and bake at 200 °C for 30 minutes."], savedAt: "2026-11-23T16:00:00Z" };
const DINNER = { date: "2026-11-23", slotId: "dinner", name: "Dinner", time: "18:00" };
const ate = { id: "c1", meal: { ...recipe }, recipeId: "m-burek", status: "eaten", taste: "DaaM good", notes: "", createdAt: "2026-11-23T17:28:00.000Z", slot: DINNER, moment: "dinner" };
const planned = { "2026-11-23": { dinner: { title: "Lazy Burek", kcal: 2318, protein: 113, source: "mine", mealId: "m-burek", items, portion: 895 } } };
(async () => { const h = await start(PORT); const { ok } = h; try {
  const open = async (o = {}) => {
    const p = await h.open({ time: "2026-11-23T22:24:00+01:00", foods: [], planned: o.plan === false ? undefined : planned, seed: (s) => {
      s.foods = [...s.foods, Q, P, T, E]; s.meals = [recipe]; s.feedback = o.nothingEaten ? [] : [ate];
      if (o.plate) { s.items = items.map((x, i) => ({ ...x, id: "pl" + i })); s.title = "Lazy Burek"; }
    } });
    await p.evaluate((lang) => { const pe = JSON.parse(localStorage.getItem("chefmealan-personal")); pe.lifestyle = { ...pe.lifestyle, slotTimes: { dinner: "18:00" } }; localStorage.setItem("chefmealan-personal", JSON.stringify(pe)); if (lang) localStorage.setItem("chefmealan-lang", lang); }, o.lang);
    await p.reload(); await p.waitForTimeout(1500);
    return p;
  };
  const eaten = async (p) => (await h.st(p)).feedback.filter((f) => f.status === "eaten");
  const toSave = async (p) => {
    await p.locator(".plate-end .prepare-it").click(); await p.waitForTimeout(1200);
    const lock = p.getByRole("button", { name: /Lock it and cook/ });
    if (await lock.count()) { await lock.first().click(); await p.waitForTimeout(900); } else { await p.locator(".way").first().click(); await p.getByRole("button", { name: "Make it this way ›" }).click(); await p.waitForTimeout(900); }
    await p.getByRole("button", { name: /^Cooked\. Next: Eat/ }).click(); await p.waitForTimeout(800);
    await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(300);
    await p.locator(".eat-save").click(); await p.waitForTimeout(500);
    await p.locator(".eat-cal .pcal-row").filter({ hasText: /Dinner/ }).first().click(); await p.waitForTimeout(600);
    const big = p.getByRole("button", { name: "Yes, I ate it", exact: true }); if (await big.count()) { await big.first().click(); await p.waitForTimeout(800); }
  };
  // ---- AC1, AC2: Plan on today shows the eaten dinner, and counts it
  let p = await open();
  await h.tab(p, "Plan");
  const row = p.locator(".plan-day .plan-slot-eaten");
  const rowText = (await row.innerText().catch(() => "")).replace(/\s+/g, " ");
  ok(await row.count() === 1 && /Dinner, 18:00 Lazy Burek ✓ Eaten 18:28 · 2,222 kcal · 93 g protein/.test(rowText), "AC1: Dinner shows Lazy Burek, ✓ Eaten 18:28, kcal and protein: " + rowText);
  ok(!/Pick a meal/.test(await p.locator(".plan-day .plan-eaten-wrap").innerText()) && await p.locator(".plan-day .plan-eaten-wrap").getByRole("button", { name: /Swap|Empty/ }).count() === 0, "AC1: no Swap and no Empty on it");
  ok(/2,222/.test(await p.locator(".plan-head").innerText()) && !/2,318/.test(await p.locator(".plan-head").innerText()), "AC2: the day's numbers count the dinner eaten (2,222), not the plan (2,318)");
  await row.click(); await p.waitForTimeout(700);
  ok(/Lazy Burek/.test(await h.main(p)) && await p.locator(".pm-delete").count() === 1, "AC1: a tap opens the meal, where Delete is");
  await p.context().close();
  // AC2: a meal with nothing eaten counts its plan
  p = await open({ nothingEaten: true });
  await h.tab(p, "Plan");
  ok(/2,318/.test(await p.locator(".plan-head").innerText()) && await p.locator(".plan-slot-eaten").count() === 0, "AC2: nothing eaten: Dinner as planned, 2,318 kcal");
  await p.context().close();
  // ---- AC3: the plan's Dinner emptied, the eaten meal stays
  p = await open({ plan: false });
  await h.tab(p, "Plan");
  const dinner = (await p.locator(".plan-day").innerText()).replace(/\s+/g, " ");
  ok(/Dinner, 18:00 Lazy Burek ✓ Eaten 18:28/.test(dinner) && !/Dinner, 18:00 Pick a meal/.test(dinner), "AC3: an emptied plan keeps the eaten dinner, not Pick a meal");
  await p.context().close();
  // ---- AC4, AC5: Save asks; Update that meal
  p = await open({ plate: true });
  await toSave(p);
  const ask = p.locator(".same-ask");
  const askText = (await ask.innerText().catch(() => "")).replace(/\s+/g, " ");
  ok(await ask.count() === 1 && /^Dinner is already eaten today\. Monday, dinner, 18:28 Lazy Burek, 895 g Update that meal Keep both Back/.test(askText), "AC4: Save asks first: " + askText.slice(0, 110));
  ok((await eaten(p)).length === 1, "AC4: nothing saved while it asks");
  ok(await ask.locator("button").evaluateAll((xs) => xs.filter((x) => !x.classList.contains("link")).every((x) => x.getBoundingClientRect().height >= 44)), "AC4: its buttons are 44 px or more");
  await ask.getByRole("button", { name: "Update that meal" }).click(); await p.waitForTimeout(1000);
  let e = await eaten(p);
  ok(e.length === 1 && e[0].id === "c1" && e[0].createdAt === ate.createdAt && e[0].slot.slotId === "dinner" && e[0].meal.items.some((x) => x.grams === 122), "AC5: Update that meal: one dinner, at 18:28, with the cook's foods (eggs 122 g)");
  await h.tab(p, "Today");
  ok(/1 of 1 by the plan/.test(await h.body(p)), "AC5: Today: 1 of 1 by the plan");
  await p.context().close();
  // ---- AC5: Back
  p = await open({ plate: true });
  await toSave(p);
  await p.locator(".same-ask").getByRole("button", { name: "Back" }).click(); await p.waitForTimeout(600);
  ok((await eaten(p)).length === 1 && await p.locator(".same-ask").count() === 0 && await p.locator(".eat-save").count() === 1, "AC5: Back saves nothing, Save is there again");
  await p.context().close();
  // ---- AC5, AC7, AC6: Keep both, counted once; then the delete ends the cook
  p = await open({ plate: true });
  await toSave(p);
  await p.locator(".same-ask").getByRole("button", { name: "Keep both" }).click(); await p.waitForTimeout(1000);
  e = await eaten(p);
  ok(e.length === 2 && e.every((f) => f.slot?.slotId === "dinner"), "AC5: Keep both: two meals in Dinner");
  await h.tab(p, "Today");
  const line = (await p.locator(".meals-card .logged-line").innerText()).replace(/\s+/g, " ");
  ok(/^1 of 1 by the plan · 4,446 of 2,200 kcal/.test(line), "AC7: Today counts the meal once, both dishes in the kcal: " + line);
  ok(await p.locator(".cook-strip").count() === 1 && /Eaten 22:2\d/.test(await p.locator(".cook-strip").innerText()), "Given: the strip says Eaten 22:24");
  const second = e.find((f) => f.id !== "c1");
  await p.locator(".meals-card .log-card").filter({ hasText: /10:2\d PM|22:2\d/ }).first().getByRole("button", { name: /Change or delete/ }).click(); await p.waitForTimeout(700);
  await p.locator(".pm-delete").click(); await p.waitForTimeout(400); await p.locator(".pm-sure").click(); await p.waitForTimeout(900);
  const s = await h.st(p);
  ok(!s.feedback.some((f) => f.id === second.id) && !s.cook && await p.locator(".cook-strip").count() === 0, "AC6: the cook's meal deleted: the cook ends, no strip");
  ok(await p.locator(`[data-carry="${second.id}"]`).count() === 0 && await p.locator(".carry-in").evaluateAll((xs) => xs.every((x) => x.getAttribute("data-carry") === "c1")), "AC6: nothing asks how a deleted meal carried me (the 18:28 dinner keeps its own question)");
  await p.context().close();
  // ---- Srpski and German: Plan's line
  for (const [lang, want] of [["sr-Latn", /Pojedeno u 18:28/], ["de", /Gegessen um 18:28/]]) {
    p = await open({ lang });
    await p.locator("nav button").nth(1).click(); await p.waitForTimeout(700);
    ok(want.test(await p.locator(".plan-day").innerText()), `${lang}: Plan's eaten line`);
    await p.context().close();
  }
} finally { await h.end(); } })();
