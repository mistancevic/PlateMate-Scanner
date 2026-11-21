// B151 (0.3.171, board B151; Coach Milan 21 November, Go 11:26): the pencil sets the meal, the day and the time, and asks
// nothing. The clock on the phone decides: a meal whose time is now or earlier counts (the plate is logged in that meal, at
// the meal's time, and the Plate stays on it); a meal still ahead is a plan. One line under the meals says which. The top
// line says Planned, or Eaten with Changes to this plate change this meal, and there is no second line. No meal selected
// takes it back. A meal that already holds a dish asks right there: Replace it, or Add as another dish. The end of the plate
// has no question, no Plan it and no Ate it: Prepare it (Prepare it again for an eaten plate) and Save it to My recipes.
// The phone's clock: Sunday 15 November 2026, 18:00. Lunch was at 13:45, Dinner is at 20:00. The checks name AC1 to AC10.
const start = require("./plate157.cjs");
const PORT = "3571";
(async () => { const h = await start(PORT); const { ok } = h; try {
  const pen = async (p) => { await p.locator(".plan-line-pen").click(); await p.waitForTimeout(400); };
  const says = async (p) => ((await p.locator(".live-line").innerText()) ?? "").replace(/\s+/g, " ").trim();
  const eaten = async (p) => (await h.st(p)).feedback.filter((f) => f.status === "eaten");
  const day = async (p, name) => { await p.locator(".meal-line-open .pcal-day").filter({ hasText: name }).click(); await p.waitForTimeout(400); };
  const hhmm = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
  // ---- AC10 first: a plate with no meal
  let p = await h.open();
  let end = p.locator(".plate-end");
  ok(await end.count() === 1 && /^Prepare it › Save it to My recipes$/.test((await end.innerText()).replace(/\s+/g, " ").trim()), "AC10: no meal set: the end is Prepare it and Save it to My recipes");
  ok(!/What do you do with it|Plan it|Ate it/.test(await h.main(p)), "AC10: no question, no Plan it and no Ate it");
  ok(await p.locator(".prepare-it").count() === 1, "AC10: Prepare it is there once");
  await pen(p);
  ok(await says(p) === "Nothing counts. You are just looking.", "no meal selected: the line says Nothing counts. You are just looking.");
  ok(await p.locator(".for-say").count() === 0, "the old words about Exploring and A meal are gone from the block");
  // ---- AC1: a meal in the past counts
  await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(700);
  ok(await says(p) === "This counts in today's Lunch. Your day is calculated again.", "AC1: a tap on today's Lunch (13:45, it is 18:00): the line says it counts in today's Lunch");
  ok(await p.locator(".meal-line-open").count() === 1 && await p.locator(".live-held").count() === 0, "AC1: nothing is asked, and edit mode stays open");
  let e = await eaten(p);
  ok(e.length === 1 && e[0].slot?.slotId === "lunch" && e[0].slot.date === "2026-11-15" && hhmm(e[0].createdAt) === "13:45" && e[0].meal.title === "Skyr, Oats & Banana" && e[0].meal.items.length === 3, "AC1: Lunch of today holds the plate, at 13:45");
  ok((await h.st(p)).items.length === 3, "AC1: the plate stays on the Plate");
  // ---- AC7: the top line, and changes follow
  await p.locator(".plan-line-close").click(); await p.waitForTimeout(400);
  ok(/Lunch Sunday, 15 November, 13:45 Eaten\. Changes to this plate change this meal\./.test(await h.line(p)), "AC7: the top line says Eaten. Changes to this plate change this meal.");
  ok(await p.locator(".recorded-line").count() === 0, "AC7: there is no second line under it");
  end = p.locator(".plate-end");
  ok(/^Prepare it again › Save it to My recipes$/.test((await end.innerText()).replace(/\s+/g, " ").trim()), "AC10: an eaten plate: Prepare it again, and Save it to My recipes");
  await h.addFood(p, "Egg"); await h.closeMore(p); await p.waitForTimeout(600);
  e = await eaten(p);
  ok(e.length === 1 && e[0].meal.items.length === 4 && /Egg/.test(e[0].meal.items.map((i) => i.food.name).join()), "AC7: a food added on the Plate is in Lunch too, still one record");
  await h.tab(p, "Today");
  ok(/Lunch/.test(await h.body(p)) && new RegExp(e[0].meal.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(await h.body(p)), "AC1: Today shows the plate in Lunch");
  await h.tab(p, "Plate");
  // ---- AC8: taking it back
  await pen(p);
  await p.locator(".pcal-looking").click(); await p.waitForTimeout(600);
  ok(await says(p) === "Taken out again. Nothing counts. You are just looking.", "AC8: No meal selected: the line says Taken out again. Nothing counts.");
  ok((await eaten(p)).length === 0 && (await h.st(p)).items.length === 4, "AC8: the plate is out of Lunch again, and still on the Plate");
  // ---- AC2: a meal still ahead is a plan
  await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(700);
  ok(await says(p) === "This goes into today's Dinner in your plan. Nothing counts yet. Today will ask if you ate it.", "AC2: a tap on today's Dinner (20:00): the line says it goes into today's Dinner in the plan");
  let plan = await h.plan(p);
  ok((await eaten(p)).length === 0 && plan["2026-11-15"]?.dinner?.source === "plate" && plan["2026-11-15"].dinner.items.length === 4, "AC2: nothing counts, and the plate is today's Dinner in the plan");
  ok((await h.st(p)).meals.length === 0, "AC2: nothing was saved to My recipes on the way");
  await p.locator(".plan-line-close").click(); await p.waitForTimeout(400);
  ok(/Dinner Sunday, 15 November, 20:00 Planned/.test(await h.line(p)), "AC2: the top line says Planned");
  ok(/^Prepare it › Save it to My recipes$/.test((await p.locator(".plate-end").innerText()).replace(/\s+/g, " ").trim()), "AC10: a planned plate: Prepare it");
  // a change on the Plate is in the plan as it stands
  await h.addFood(p, "Apple"); await h.closeMore(p); await p.waitForTimeout(600);
  plan = await h.plan(p);
  ok(plan["2026-11-15"].dinner.items.length === 5, "a food added on the Plate is in the planned Dinner too");
  // ---- AC3: Today asks when the time comes (the app's own question, unchanged)
  await h.tab(p, "Today");
  ok(/Dinner/.test(await h.body(p)) && /Skyr/.test(await h.body(p)), "AC3: Today shows the plate as the planned Dinner");
  await h.tab(p, "Plate");
  {
    // past 20:00 Today's own card for the planned Dinner has I ate it; the answer logs it, and the Plate is free again
    const q = await h.open();
    await pen(q); await h.row(q, "Dinner", ".meal-line-open").click(); await q.waitForTimeout(600); await q.locator(".plan-line-close").click();
    await q.clock.fastForward("02:31:00"); await q.waitForTimeout(400);
    await h.tab(q, "Today");
    ok(/dinner, 20:00 Skyr, Oats & Banana/i.test(await h.body(q)) && await q.getByRole("button", { name: "I ate it" }).count() >= 1, "AC3: past 20:00, Today has the planned Dinner with I ate it, as for any planned meal");
    ok(/Planned/.test(await (async () => { await h.tab(q, "Plate"); const t = await h.line(q); await h.tab(q, "Today"); return t; })()), "AC3: the clock alone changes nothing: the plate is still Planned");
    await q.getByRole("button", { name: "I ate it" }).first().click(); await q.waitForTimeout(900);
    const ev = await eaten(q);
    ok(ev.length === 1 && ev[0].slot?.slotId === "dinner", "AC3: I ate it on Today logs the Dinner");
    await h.tab(q, "Plate"); await q.waitForTimeout(500);
    ok(/No meal selected/.test(await h.line(q)) && !(await h.st(q)).plannedAt && (await eaten(q)).length === 1, "AC3: after that the plate on the Plate is no longer the plan's, and nothing is logged twice");
  }
  // ---- AC4: changing the time changes it
  await pen(p);
  await p.locator(".meal-line-open .pcal-time").fill("18:00"); await p.waitForTimeout(800);
  ok(await says(p) === "This counts in today's Dinner. Your day is calculated again.", "AC4: Dinner's time set to 18:00: the line says it counts in today's Dinner");
  e = await eaten(p); plan = await h.plan(p);
  ok(e.length === 1 && e[0].slot?.slotId === "dinner" && hhmm(e[0].createdAt) === "18:00" && !plan["2026-11-15"]?.dinner, "AC4: it is counted at 18:00, and it is out of the plan");
  // ---- AC5: a coming day is a plan
  await day(p, "Mon 16");
  await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(700);
  ok(await says(p) === "This goes into Monday's Lunch in your plan. Nothing counts yet. Today will ask if you ate it.", "AC5: Monday and Lunch: the line says it goes into Monday's Lunch in the plan");
  plan = await h.plan(p);
  ok((await eaten(p)).length === 0 && plan["2026-11-16"]?.lunch?.items.length === 5, "AC5: it is in the Plan on Monday, and out of today's Dinner");
  // ---- AC6: a past day counts
  await day(p, "Sat 14");
  await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(700);
  ok(await says(p) === "This counts in Saturday's Dinner. Your day is calculated again.", "AC6: Saturday and Dinner: the line says it counts in Saturday's Dinner");
  e = await eaten(p); plan = await h.plan(p);
  ok(e.length === 1 && e[0].slot?.date === "2026-11-14" && e[0].slot.slotId === "dinner" && e[0].createdAt.slice(0, 10) === "2026-11-14" && !plan["2026-11-16"]?.lunch, "AC6: it is counted on Saturday at Dinner, and Monday's Lunch is free again");
  // ---- AC10: Prepare it again cooks the same foods as a new cook; the logged meal stays
  await p.locator(".plan-line-close").click(); await p.waitForTimeout(400);
  await p.locator(".plate-end .prepare-it").click(); await p.waitForTimeout(1200);
  e = await eaten(p);
  ok(e.length === 1 && e[0].slot?.date === "2026-11-14" && (await h.st(p)).items.length === 5 && !(await h.st(p)).recorded, "AC10: Prepare it again: the cook starts with the same foods, and Saturday's Dinner stays as logged");
  ok(!/What do you do with it/.test(await h.main(p)) && !/Meal and day/i.test(await h.main(p)), "AC10: I am on How to make it");
  // ---- AC9: a meal that holds a dish asks
  // Lunch gets a dish first: an egg, logged with the pencil; then the plate is emptied and the new plate is built
  const withLunch = async () => {
    const q = await h.open({ foods: ["Egg"] });
    await pen(q); await h.row(q, "Lunch", ".meal-line-open").click(); await q.waitForTimeout(600); await q.locator(".plan-line-close").click(); await q.waitForTimeout(300);
    await q.locator(".plate-empty-link").click(); await q.waitForTimeout(300); await q.locator(".plate-empty-link").click(); await q.waitForTimeout(800);
    for (const n of ["Skyr", "Oats", "Banana"]) await h.addFood(q, n);
    await h.closeMore(q); await pen(q); return q;
  };
  p = await withLunch();
  const first = (await eaten(p))[0].meal.title;
  ok((await eaten(p)).length === 1 && /No meal selected/.test(await h.line(p)), "AC9: Lunch holds an egg, and the new plate has no meal set");
  await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(700);
  let held = p.locator(".live-held");
  ok(await held.count() === 1 && (await held.innerText()).replace(/\s+/g, " ").trim() === `Lunch already holds ${first}. Replace it Add as another dish`, "AC9: Lunch already holds a dish: the block says so and offers Replace it and Add as another dish");
  ok((await eaten(p)).length === 2, "AC9: until I say otherwise the plate is one more dish in Lunch");
  await held.locator(".live-add").click(); await p.waitForTimeout(500);
  ok(await p.locator(".live-held").count() === 0 && (await eaten(p)).length === 2, "AC9: Add as another dish: both dishes are in Lunch");
  // Replace it, on a fresh plate
  p = await withLunch();
  await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(700);
  await p.locator(".live-held .live-replace").click(); await p.waitForTimeout(700);
  e = await eaten(p);
  ok(e.length === 1 && e[0].meal.title === "Skyr, Oats & Banana" && e[0].slot.slotId === "lunch", "AC9: Replace it: Lunch holds this plate only");
  ok(/Eaten\. Changes to this plate change this meal\./.test(await h.line(p)), "AC9: and the plate is still that meal");
  // a planned meal that holds a recipe asks the same way
  p = await h.open({ planned: { "2026-11-15": { dinner: { title: "Lentil soup", kcal: 420, protein: 24, source: "mine" } } } });
  await pen(p);
  await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(700);
  held = p.locator(".live-held");
  ok(await held.count() === 1 && /^Dinner already holds Lentil soup\./.test((await held.innerText()).replace(/\s+/g, " ").trim()), "AC9: a planned Dinner that holds Lentil soup asks too");
  plan = await h.plan(p);
  ok(plan["2026-11-15"].dinner.dishes?.length === 2, "AC9: until I say otherwise the plate is one more dish in the planned Dinner");
  await p.locator(".pcal-looking").click(); await p.waitForTimeout(600);
  plan = await h.plan(p);
  ok(plan["2026-11-15"].dinner.title === "Lentil soup" && !plan["2026-11-15"].dinner.dishes, "AC8: No meal selected takes the plate out of the plan; Lentil soup is Dinner again");
  // ---- the meal first, the foods after: the first food logs it
  p = await h.open({ foods: [] });
  await pen(p);
  await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(500);
  ok((await eaten(p)).length === 0, "the meal set on an empty plate: nothing is logged yet");
  await p.locator(".plan-line-close").click(); await p.waitForTimeout(300);
  await h.addFood(p, "Skyr"); await h.closeMore(p); await p.waitForTimeout(700);
  e = await eaten(p);
  ok(e.length === 1 && e[0].slot?.slotId === "lunch" && e[0].meal.items.length === 1, "the first food on the plate is in Lunch");
  // ---- an emptied plate is a new plate: Lunch keeps what was logged, and no meal is set
  await p.locator(".plate-empty-link").click(); await p.waitForTimeout(300); await p.locator(".plate-empty-link").click(); await p.waitForTimeout(800);
  e = await eaten(p);
  ok(e.length === 1 && e[0].meal.items.length === 1 && (await h.st(p)).items.length === 0 && !(await h.st(p)).recorded, "Empty plate: Lunch keeps the plate as logged, and the Plate is empty");
  ok(/No meal selected/.test(await h.line(p)), "Empty plate: no meal is set for the new plate");
  // ---- Save it to My recipes
  p = await h.open();
  await p.locator(".plate-end .pe-save").click(); await p.waitForTimeout(600);
  ok((await h.st(p)).meals.length === 1 && /Saved in My recipes/.test(await p.locator(".plate-end").innerText()) && (await h.st(p)).items.length === 3, "AC10: Save it to My recipes keeps the plate as a recipe, and the plate stays");
  // ---- a snack has no time: it counts as now
  await pen(p);
  await h.row(p, "Snack", ".meal-line-open").click(); await p.waitForTimeout(700);
  e = await eaten(p);
  ok(e.length === 1 && !e[0].slot && hhmm(e[0].createdAt) === "18:00" && /^This counts in today's Snack\./.test(await says(p)), "a Snack has no time of its own: it counts now, at 18:00");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
