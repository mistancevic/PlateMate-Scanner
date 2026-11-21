// B154 (0.3.172, board B154; Coach Milan, Go 21 November 23:43): a plate logged with the pencil and then cooked is one meal,
// not two. On the phone it is Sunday 15 November 2026, 13:50, and Lunch is at 13:45, so a tap on Lunch logs the plate. The
// button then says Prepare it (Prepare it again is gone). The cook stays on Lunch through Prep, Make and Eat. Save on Eat
// asks nothing about the meal and writes into the Lunch already logged: one record at 13:45, counted once. A portion makes
// Lunch the portion eaten. Later today and Not after all take the plate out of Lunch again, and the cook is kept as any
// cook is. The same foods another time start from the eaten meal, as a new plate. The checks name AC1 to AC9.
const start = require("./plate157.cjs");
const PORT = "3572";
(async () => { const h = await start(PORT); const { ok } = h; try {
  const eaten = async (p) => (await h.st(p)).feedback.filter((f) => f.status === "eaten");
  const grams = (f) => Math.round(f.meal.items.reduce((n, i) => n + i.grams, 0));
  const hhmm = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
  // the plate logged in Lunch with the pencil, then Prepare it, through Prep and Make, to Eat
  const toEat = async (check) => {
    const p = await h.open({ time: "2026-11-15T13:50:00+01:00" });
    await p.locator(".plan-line-pen").click(); await p.waitForTimeout(400);
    await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(700); await p.locator(".plan-line-close").click(); await p.waitForTimeout(300);
    if (check) {
      const e = await eaten(p);
      ok(e.length === 1 && e[0].slot?.slotId === "lunch" && hhmm(e[0].createdAt) === "13:45", "Given: it is 13:50 and the pencil logged the plate in today's Lunch at 13:45");
      ok(/^Prepare it › Save it to My recipes$/.test((await p.locator(".plate-end").innerText()).replace(/\s+/g, " ").trim()), "AC1: the end of the eaten plate says Prepare it, with Save it to My recipes under it");
      ok(!/Prepare it again/.test(await h.body(p)), "AC1: nothing says Prepare it again");
    }
    await p.locator(".plate-end .prepare-it").click(); await p.waitForTimeout(1200);
    if (check) ok(/How do you want to eat it\?/.test(await h.main(p)) && (await eaten(p)).length === 1 && (await h.st(p)).recorded?.live === true && (await h.st(p)).pick === "meal:lunch", "AC2: Prepare it opens Prep, and the plate is still today's Lunch");
    await p.locator(".way").first().click(); await p.getByRole("button", { name: "Make it this way ›" }).click(); await p.waitForTimeout(900);
    if (check) ok(/^Make:/.test((await p.locator("h2").first().innerText()).trim()) && (await eaten(p)).length === 1 && (await eaten(p))[0].slot?.slotId === "lunch", "AC2: on Make nothing is taken out of the meal");
    await p.getByRole("button", { name: /^Cooked\. Next: Eat/ }).click(); await p.waitForTimeout(800);
    return p;
  };
  // ---- AC1 to AC4, AC8: All of it
  let p = await toEat(true);
  await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(300);
  await p.locator(".eat-save").click(); await p.waitForTimeout(1200);
  ok(await p.locator(".eat-cal").count() === 0 && !/Which meal\?/.test(await h.body(p)), "AC3: Save asks nothing about the meal: no Which meal?");
  let e = await eaten(p), s = await h.st(p);
  ok(e.length === 1 && s.feedback.length === 1, "AC3: no second meal is logged");
  ok(e[0].slot?.slotId === "lunch" && hhmm(e[0].createdAt) === "13:45" && e[0].taste === "DaaM good" && grams(e[0]) === 448, "AC4: Lunch holds the plate once, at 13:45, with the taste of the cook");
  ok(s.meals.length === 1 && (s.meals[0].steps ?? []).length >= 2, "AC8: Yes, save it: the recipe is in My recipes with its steps, as for any cook");
  await h.tab(p, "Today");
  let body = await h.body(p);
  ok(/1 of 1 by the plan so far · 563 of 2,200 kcal/.test(body), "AC4: Today counts 563 kcal, one meal by the plan");
  // ---- AC9: the same foods another time, from the eaten meal
  await p.getByRole("button", { name: /Change or delete/ }).first().click(); await p.waitForTimeout(700);
  const again = p.locator(".pm-again");
  ok(await again.count() === 1, "AC9: the eaten Lunch opened from Today has its button to cook it again");
  await again.click(); await p.waitForTimeout(900);
  s = await h.st(p);
  ok(s.items.length === 3 && !s.recorded && (await eaten(p)).length === 1 && /No meal selected/.test(await h.line(p)), "AC9: the foods are on the Plate as a new plate with no meal set, and Lunch stays as logged");
  await p.context().close();
  // ---- AC5: A portion
  p = await toEat(false);
  await p.getByRole("button", { name: "A portion", exact: true }).click(); await p.waitForTimeout(400);
  await p.getByRole("button", { name: "DaaM good" }).click(); await p.locator(".rq-makes input").first().fill("2"); await p.waitForTimeout(300);
  await p.locator(".eat-save").click(); await p.waitForTimeout(1200);
  e = await eaten(p); s = await h.st(p);
  ok(await p.locator(".eat-cal").count() === 0 && e.length === 1 && s.feedback.length === 1 && e[0].slot?.slotId === "lunch" && hhmm(e[0].createdAt) === "13:45" && grams(e[0]) === 224, "AC5: A portion of 2: Lunch holds the one portion I ate, 224 g, at 13:45");
  ok(s.meals[0]?.makes?.n === 2, "AC5: the recipe says it makes 2, as for any cook");
  await p.context().close();
  // ---- AC6: Later today
  p = await toEat(false);
  await p.getByRole("button", { name: "Later today", exact: true }).click(); await p.waitForTimeout(400);
  await p.locator(".eat-save").click(); await p.waitForTimeout(1200);
  s = await h.st(p);
  ok((await eaten(p)).length === 0 && s.feedback.length === 1 && s.feedback[0].status === "prepared" && !s.recorded, "AC6: Later today: the plate is out of Lunch again, and the cooked meal is kept for later");
  await h.tab(p, "Today");
  ok(/Nothing logged yet today/.test(await h.body(p)) && await p.getByRole("button", { name: "I ate it" }).count() >= 1, "AC6: Today has nothing logged, and the cooked meal waits with I ate it");
  await p.context().close();
  // ---- AC7: Not after all
  p = await toEat(false);
  await p.getByRole("button", { name: "Not after all", exact: true }).click(); await p.waitForTimeout(400);
  await p.locator(".eat-save").click(); await p.waitForTimeout(1200);
  s = await h.st(p);
  ok((await eaten(p)).length === 0 && s.feedback.every((f) => f.status === "not-used") && !s.recorded, "AC7: Not after all: the plate is out of Lunch again, and nothing is logged");
  await h.tab(p, "Today");
  ok(/Nothing planned or eaten yet today/.test(await h.body(p)) && await p.getByRole("button", { name: "I ate it" }).count() === 0, "AC7: Today has nothing logged, and nothing waits");
  await p.context().close();
  // ---- unchanged: a plate with no meal is still asked Which meal? at Save
  p = await h.open({ time: "2026-11-15T13:50:00+01:00" });
  await p.locator(".plate-end .prepare-it").click(); await p.waitForTimeout(1200);
  await p.locator(".way").first().click(); await p.getByRole("button", { name: "Make it this way ›" }).click(); await p.waitForTimeout(900);
  await p.getByRole("button", { name: /^Cooked\. Next: Eat/ }).click(); await p.waitForTimeout(800);
  await p.getByRole("button", { name: "DaaM good" }).click(); await p.locator(".eat-save").click(); await p.waitForTimeout(900);
  ok(await p.locator(".eat-cal").count() === 1 && (await h.st(p)).feedback.length === 0, "unchanged: a plate with no meal set is asked Which meal? under Save");
  // ---- a plate logged on a past day: its cook today is a cook of its own
  p = await h.open({ time: "2026-11-15T13:50:00+01:00" });
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(400);
  await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Sat 14" }).click(); await p.waitForTimeout(400);
  await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(700); await p.locator(".plan-line-close").click(); await p.waitForTimeout(300);
  ok(/^Prepare it › Save it to My recipes$/.test((await p.locator(".plate-end").innerText()).replace(/\s+/g, " ").trim()), "a plate logged on Saturday says Prepare it too");
  await p.locator(".plate-end .prepare-it").click(); await p.waitForTimeout(1200);
  e = await eaten(p);
  ok(e.length === 1 && e[0].slot?.date === "2026-11-14" && !(await h.st(p)).recorded && /How do you want to eat it\?/.test(await h.main(p)), "its cook today is a cook of its own: Saturday's Dinner stays as logged");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
