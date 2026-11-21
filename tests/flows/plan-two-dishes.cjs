// Story DT308.11, a meal that already holds something (0.3.157, board Stories242, frames d to g; Coach Milan, Go
// 18 November 11:14; Add as another dish is the main button, 18 November 10:53). Plan it on a plate: the calendar's row
// says what the meal holds. A tap on it opens one question right under the row, with three answers: Cancel, Replace it,
// Add as another dish. Add as another dish: the meal holds both, and Plan shows both. Replace it: the plate takes its
// place; the meal that was there leaves the plan and stays in My recipes. Cancel: nothing changes and the calendar stays
// open. The same question for Ate it on a meal already eaten. A meal that holds two dishes is still one meal for everything
// that reads the plan: the day's numbers count both, Today shows it and logs both, the shopping list has both dishes' foods.
// The checks name the rows of the build brief (D3 to D7).
// Changed by B151 (0.3.171, board B151; Coach Milan, Go 21 November 11:26): Plan it and Ate it left the end of a plate you
// build yourself. The pencil plans or logs the plate, and a meal that already holds a dish asks right in the pencil's
// block: Replace it, or Add as another dish. Until you answer, the plate is one more dish, so nothing is lost; there is no
// Cancel, No meal selected takes the plate out again. The plate stays on the Plate, and no message is needed. What reads
// the plan afterwards (Plan, Today, the shopping list) is as it was.
const start = require("./plate157.cjs");
const PORT = "3563";
(async () => { const h = await start(PORT); const { ok } = h; try {
  const pen = async (q) => { await q.locator(".plan-line-pen").click(); await q.waitForTimeout(400); };
  const mon = async (q) => { await q.locator(".meal-line-open .pcal-day").filter({ hasText: "Mon 16" }).click(); await q.waitForTimeout(400); };
  const empty = async (q) => { await q.locator(".plate-empty-link").click(); await q.waitForTimeout(300); await q.locator(".plate-empty-link").click(); await q.waitForTimeout(800); };
  let p = await h.open({ foods: ["Rice", "Chicken"] });
  await pen(p); await mon(p); await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(700);
  ok((await h.plan(p))["2026-11-16"]?.lunch?.title === "Rice & Chicken breast", "Given: Monday's lunch holds Rice & Chicken breast, planned with the pencil");
  await p.locator(".plan-line-close").click(); await p.waitForTimeout(300);
  await empty(p);
  ok((await h.plan(p))["2026-11-16"]?.lunch?.title === "Rice & Chicken breast" && /^No meal selected$/.test(await h.line(p)), "Given: the plate is emptied; Monday's lunch stays planned, and the new plate has no meal set");
  for (const n of ["Skyr", "Oats", "Banana"]) await h.addFood(p, n); await h.closeMore(p);
  // ---- D3: the row says what it holds
  await pen(p); await mon(p);
  ok((await h.rows(p, ".meal-line-open")).join(" | ") === "Breakfast 07:30 · nothing planned | Lunch 13:45 · planned: Rice & Chicken breast | Dinner 20:00 · nothing planned | ✓ No meal selected", "D3: the meal's row says what it holds: planned: Rice & Chicken breast");
  // ---- D4, changed by B151: the question stands in the pencil's block
  await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(700);
  const ask = p.locator(".meal-line-open .live-held");
  ok(await ask.count() === 1 && /^Lunch already holds Rice & Chicken breast\. Replace it Add as another dish$/.test((await ask.innerText()).replace(/\s+/g, " ").trim()), "D4, changed by B151: the block says Lunch already holds Rice & Chicken breast, with Replace it and Add as another dish");
  ok(await ask.locator(".pill-primary").count() === 1 && /Add as another dish/.test(await ask.locator(".pill-primary").innerText()), "D4: Add as another dish is the main button");
  ok(await ask.locator("button").evaluateAll((bs) => bs.every((b) => b.getBoundingClientRect().height >= 44)), "D4: the answers are 44 high");
  // ---- D7, changed by B151: no Cancel; No meal selected takes the plate out again
  await p.locator(".meal-line-open .pcal-looking").click(); await p.waitForTimeout(600);
  let m = (await h.plan(p))["2026-11-16"].lunch;
  ok(m.title === "Rice & Chicken breast" && !m.dishes && (await h.st(p)).items.length === 3 && await p.locator(".live-held").count() === 0, "D7, changed by B151: No meal selected: Monday's lunch is as it was, and the plate keeps its foods");
  // ---- D5: Add as another dish
  await mon(p); await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(700);
  await p.getByRole("button", { name: "Add as another dish" }).click(); await p.waitForTimeout(600);
  m = (await h.plan(p))["2026-11-16"].lunch;
  ok(m.dishes?.length === 2 && m.dishes[0].title === "Rice & Chicken breast" && m.dishes[1].title === "Skyr, Oats & Banana" && m.items.length === 5 && m.kcal === m.dishes[0].kcal + m.dishes[1].kcal, "D5: the meal holds both: two dishes, five foods, their kcal added up");
  await p.locator(".plan-line-close").click(); await p.waitForTimeout(300);
  ok(/^Lunch Monday, 16 November, 13:45 Planned/.test(await h.line(p)) && (await h.st(p)).items.length === 3, "D5, changed by B151: the plate stays on the Plate, and its line says Planned");
  await h.tab(p, "Plan"); await p.locator("[role=tab]").filter({ hasText: /Mon\s*16/ }).first().click(); await p.waitForTimeout(600);
  let body = await h.body(p);
  ok(await p.locator(".plan-dish-row").count() === 2 && /Lunch, 13:45 Rice & Chicken breast[\s\S]*Lunch, 13:45 Skyr, Oats & Banana/.test(body), "D5: Plan shows both, each as its own row under Lunch, 13:45");
  ok(new RegExp(`${m.kcal.toLocaleString("en-US")} of`).test(body), "D5: the day's numbers on top count both dishes");
  // everything that reads the plan: the shopping list
  await p.locator(".plan-shop").click(); await p.waitForTimeout(600);
  const shop = await h.body(p);
  ok(/Rice/.test(shop) && /Chicken/.test(shop) && /Skyr/.test(shop) && /Oats/.test(shop) && /Banana/.test(shop), "D5: the shopping list has both dishes' foods");
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  await p.context().close();

  // everything that reads the plan: Today shows the meal and I ate it logs both dishes
  p = await h.open({ foods: [], time: "2026-11-16T12:00:00+01:00", planned: { "2026-11-16": { lunch: m } } });
  await h.tab(p, "Today");
  body = await h.body(p);
  ok(/Rice & Chicken breast \+ Skyr, Oats & Banana/.test(body), "D5: Today shows the meal with both dishes");
  await p.getByRole("button", { name: /^I ate it$/ }).first().click(); await p.waitForTimeout(800);
  let s = await h.st(p);
  ok(s.feedback.length === 1 && s.feedback[0].meal.items.length === 5 && s.feedback[0].slot?.slotId === "lunch", "D5: I ate it on Today logs both dishes' foods as that lunch");
  // a dish taken out again on Plan
  await p.context().close();
  p = await h.open({ foods: [], planned: { "2026-11-16": { lunch: m } } });
  await h.tab(p, "Plan"); await p.locator("[role=tab]").filter({ hasText: /Mon\s*16/ }).first().click(); await p.waitForTimeout(600);
  ok(await p.locator(".plan-dish-row").count() === 2, "Plan, Monday: the two dishes");
  await p.getByRole("button", { name: /^Empty lunch: Rice & Chicken breast$/ }).dispatchEvent("click"); await p.waitForTimeout(600);
  const left = (await h.plan(p))["2026-11-16"].lunch;
  ok(left.title === "Skyr, Oats & Banana" && !left.dishes && left.items.length === 3, "Plan: one dish taken out: the meal keeps the other, as a meal planned on its own");
  await p.context().close();

  // ---- D6: Replace it
  p = await h.open({ planned: { "2026-11-16": { lunch: { title: "Rice & Chicken breast", kcal: 574, protein: 64, source: "mine", mealId: "r1" } } }, seed: (sd) => { const F = (n) => sd.foods.find((f) => f.name.startsWith(n)); sd.meals = [{ id: "r1", title: "Rice & Chicken breast", items: [{ id: "r1a", food: F("Rice"), grams: 200, locked: false }, { id: "r1b", food: F("Chicken"), grams: 190, locked: false }], portion: 390, savedAt: "2026-11-10T10:00:00Z" }]; } });
  await pen(p); await mon(p); await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(700);
  await p.getByRole("button", { name: "Replace it" }).click(); await p.waitForTimeout(700);
  m = (await h.plan(p))["2026-11-16"].lunch; s = await h.st(p);
  ok(m.title === "Skyr, Oats & Banana" && !m.dishes, "D6: Replace it: the plate takes its place");
  ok(s.meals.some((x) => x.title === "Rice & Chicken breast"), "D6: the meal that was there leaves the plan and stays in My recipes");
  await p.locator(".meal-line-open .pcal-looking").click(); await p.waitForTimeout(600);
  ok((await h.plan(p))["2026-11-16"].lunch.title === "Rice & Chicken breast", "D6, changed by B151: No meal selected after Replace it puts back what the meal held");
  await p.context().close();

  // ---- the same for a meal already eaten: it asks the same way. Lunch at 13:45, and it is 18:00, so the pencil logs
  p = await h.open({ seed: (sd) => { const F = (n) => sd.foods.find((f) => f.name.startsWith(n)); sd.feedback = [{ id: "e1", meal: { id: "me1", title: "Rice & Chicken breast", items: [{ id: "e1a", food: F("Rice"), grams: 200, locked: false }], portion: 200, savedAt: "2026-11-15T13:30:00+01:00" }, status: "eaten", taste: "", notes: "", createdAt: "2026-11-15T13:45:00+01:00", slot: { date: "2026-11-15", slotId: "lunch", name: "Lunch", time: "13:45" } }]; } });
  await pen(p);
  ok(/Lunch 13:45 · eaten/.test((await h.rows(p, ".meal-line-open")).join(" | ")), "today's lunch says eaten: " + (await h.rows(p, ".meal-line-open")).join(" | "));
  await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(700);
  ok(/^Lunch already holds Rice & Chicken breast\. Replace it Add as another dish$/.test((await p.locator(".meal-line-open .live-held").innerText()).replace(/\s+/g, " ").trim()), "a meal already eaten asks the same way, with the same two answers");
  await p.getByRole("button", { name: "Add as another dish" }).click(); await p.waitForTimeout(700);
  s = await h.st(p);
  ok(s.feedback.filter((f) => f.slot?.slotId === "lunch" && f.status === "eaten").length === 2, "Add as another dish: today's lunch holds both, eaten");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
