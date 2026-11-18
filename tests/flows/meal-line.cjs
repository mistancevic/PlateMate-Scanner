// Story DT308.1, DT308.9 and DT308.10 (0.3.157, boards Stories236 and Stories241; Coach Milan, Go 18 November 11:14):
// the meal line and Fit with no meal set. A new plate says Meal and day not set, in grey, with a pencil, and nothing is
// counted or planned. No meal is guessed when a food lands. The pencil opens your calendar: the days on top, that day's
// meals with their time and state, as the last row Just looking, and under them What is it? and Chef Mealan's What kind of moment?, as they were. A tap
// on a meal sets the meal and the day and closes it; a tap on a chip keeps it open; the pencil closes it with no meal set.
// Once set, the line says the meal, then the day, date and time, and the moment when it is not a regular meal, and an X
// stands in the pencil's place: it clears the meal and the day, and the moment is Regular meal again. With no meal set, Fit
// to my target aims only at your PD target: the result says This plate, and Chef Mealan says first what Fit aimed at.
// The checks name the rows of the build brief (A1 to A8, B1, B2).
const start = require("./plate157.cjs");
const PORT = "3561";
(async () => { const h = await start(PORT); const { ok } = h; try {
  // ---- A1, A2: a new plate, empty and with foods
  let p = await h.open({ foods: [] });
  ok(/^Meal and day not set$/.test(await h.line(p)) && await p.locator(".meal-line .plan-line-pen").count() === 1 && await p.locator(".meal-line .plan-line-x").count() === 0, "A1: an empty plate: the line says Meal and day not set, with a pencil");
  ok(await p.locator(".meal-line-unset").evaluate((e) => { const c = getComputedStyle(e).color.match(/\d+/g).map(Number); return c[0] > 80 && c[0] < 140 && Math.abs(c[0] - c[1]) < 30; }), "A1: the line is grey");
  for (const n of ["Skyr", "Oats", "Banana"]) await h.addFood(p, n); await h.closeMore(p);
  let s = await h.st(p);
  ok(/^Meal and day not set$/.test(await h.line(p)) && !s.pick, "A2: three foods from the list landed: the line did not change, no meal is guessed");
  ok(/This plate/.test(await p.locator(".readout-top").innerText()) && !/Dinner|Lunch|Breakfast/.test(await p.locator(".readout").innerText()), "A1: the result says This plate, sized for no meal");
  ok(s.feedback.length === 0 && Object.keys(await h.plan(p)).length === 0, "A1: nothing is counted or planned");
  // ---- A3: the pencil opens the calendar
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(400);
  const days = (await p.locator(".meal-line-open .pcal-day").allInnerTexts()).map((t) => t.trim());
  ok(days.join(" | ") === "Sat 14 | Sun 15, today | Mon 16 | Tue 17 | More", "A3: the days on top: Sat 14, Sun 15 today, Mon 16, Tue 17, More: " + days.join(" | "));
  let rows = await h.rows(p, ".meal-line-open");
  ok(rows.join(" | ") === "Breakfast 07:30 · not eaten | Lunch 13:45 · not eaten | Dinner 20:00 · next | Snack now | Just looking nothing is counted", "A3: today's meals with their time and state, and as the last row Just looking, nothing is counted (board DT308, frame DT308.1b): " + rows.join(" | "));
  ok(await p.locator(".meal-line-open .pcal-row.on").count() === 0, "A3: nothing is marked");
  const open = await p.locator(".meal-line-open").innerText();
  ok(/What is it\?[\s\S]*Savoury[\s\S]*Sweet, a DaaM[\s\S]*Both[\s\S]*What kind of moment\?[\s\S]*Regular meal[\s\S]*Before training/.test(open), "A3: under the meals What is it? and What kind of moment?, as in 0.3.156");
  ok(!/Which day\?|What is it for\?/.test(open), "A3: Which day? and What is it for? are gone: the calendar took their place");
  // ---- A5: a chip is chosen and the calendar stays open
  await p.locator(".meal-line-open .moment-row .choice").filter({ hasText: "Before training" }).click(); await p.waitForTimeout(300);
  ok(await p.locator(".meal-line-open .moment-row .choice.on").innerText().then((t) => /Before training/.test(t)) && await p.locator(".meal-line-open .pcal").count() === 1, "A5: Before training is chosen with a tick, and the calendar stays open");
  await p.locator(".meal-line-open .taste-row .choice").filter({ hasText: "Savoury" }).click(); await p.waitForTimeout(300);
  ok(await p.locator(".meal-line-open .taste-row .choice.on").count() === 1 && await p.locator(".meal-line-open .pcal").count() === 1, "A5: a taste chip is chosen and the calendar stays open");
  // ---- A6: the pencil again closes it with no meal set
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(300);
  ok(await p.locator(".meal-line-open").count() === 0 && /^Meal and day not set/.test(await h.line(p)) && !(await h.st(p)).pick, "A6: the pencil again: closed, no meal set");
  ok(/Before training/.test(await h.line(p)), "A5: a moment chosen with no meal set holds for the plate: the line names it");
  // ---- A4: a tap on a meal sets meal and day
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(300);
  await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(500);
  ok(await p.locator(".meal-line-open").count() === 0, "A4: a tap on Dinner: the calendar closes");
  ok(/^Dinner Sunday, 15 November, 20:00 Before training/.test(await h.line(p)), "A4: the line says the meal, then day, date and time, and the moment: " + await h.line(p));
  ok(await p.locator(".meal-line .plan-line-x").count() === 1 && await p.locator(".meal-line .plan-line-pen").count() === 0, "A4: an X stands in the pencil's place");
  // ---- A8: the plate works for that meal as in 0.3.156
  ok(/Dinner/.test(await p.locator(".readout-top").innerText()) && (await h.st(p)).pick === "meal:dinner", "A8: the result is for the dinner, as in 0.3.156");
  // ---- A7: X clears
  await p.locator(".plan-line-x").click(); await p.waitForTimeout(400);
  s = await h.st(p);
  ok(/^Meal and day not set( Savoury)?$/.test(await h.line(p).then((t) => t.replace(/ · /g, " "))) && !s.pick, "A7: X: Meal and day not set again: " + await h.line(p));
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(300);
  ok(/Regular meal/.test(await p.locator(".meal-line-open .moment-row .choice.on").innerText()), "A7: the moment is Regular meal again");
  // ---- A4: a meal of another day
  await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Mon 16" }).click(); await p.waitForTimeout(300);
  rows = await h.rows(p, ".meal-line-open");
  ok(rows.join(" | ") === "Breakfast 07:30 · nothing planned | Lunch 13:45 · nothing planned | Dinner 20:00 · nothing planned | Just looking nothing is counted", "A3: Monday's meals as they stand in the plan; no Snack row on a coming day with no snack among its meals: " + rows.join(" | "));
  await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(500);
  ok(/^Lunch Monday, 16 November, 13:45/.test(await h.line(p)) && /Goes into your plan\./.test(await h.line(p)), "A4: Monday's lunch is set: " + await h.line(p));
  ok(await p.getByRole("button", { name: /^Put it in/ }).count() === 0, "D2: the button Put it in Monday's lunch no longer exists");
  await p.locator(".plan-line-x").click(); await p.waitForTimeout(400);
  ok(/^Meal and day not set/.test(await h.line(p)), "A7: X clears a meal of another day too");
  // Just looking, the last row (Coach Milan, 18 November: the row of frames DT308.1 b and c stays)
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(300);
  await p.locator(".meal-line-open .pcal-looking").click(); await p.waitForTimeout(400);
  ok(/^Just looking · not sized for a meal/.test(await h.line(p)) && (await h.st(p)).pick === "exploring" && await p.locator(".meal-line-open").count() === 0 && /As it stands/.test(await p.locator(".readout-top").innerText()), "A3: Just looking: the line says so and nothing is sized or counted, as in 0.3.156");
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(300);
  ok(await p.locator(".meal-line-open .pcal-looking.on").count() === 1, "A3: in the calendar Just looking is marked with a tick");
  await p.locator(".meal-line-open .pcal-looking").click(); await p.waitForTimeout(400);
  ok(/^Meal and day not set/.test(await h.line(p)) && !(await h.st(p)).pick, "A3: a second tap on Just looking: Meal and day not set again");
  // More: another day
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(300);
  await p.locator(".meal-line-open .pcal-more").click(); await p.waitForTimeout(200); await p.locator(".meal-line-open .pcal-date").fill("2026-11-20"); await p.waitForTimeout(400);
  ok((await p.locator(".meal-line-open .pcal-day.on:not(.pcal-more)").innerText()).trim() === "Fri 20", "A3: More: another day joins the days and its meals show");
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(200);
  await p.context().close();

  // ---- B1, B2: Fit to my target with no meal set
  p = await h.open({ foods: ["Oats", "Banana", "Skyr"] });
  const inp = p.locator(".plate-card .rows .swipe, .plate-card .rows .row").filter({ hasText: "Skyr" }).first().locator("input").first(); await inp.fill("30"); await inp.blur(); await p.waitForTimeout(600);
  const before = await h.st(p), g0 = Object.fromEntries(before.items.map((i) => [i.food.name.split(",")[0], Math.round(i.grams)]));
  ok(/under your/i.test(await p.locator(".readout").innerText()) && /^Meal and day not set$/.test(await h.line(p)), "B1: the plate is under the PD target and no meal is set");
  await p.locator(".fit-top").click(); await p.waitForTimeout(1200);
  const after = await h.st(p), g1 = Object.fromEntries(after.items.map((i) => [i.food.name.split(",")[0], Math.round(i.grams)]));
  ok(g1.Skyr > g0.Skyr && g1.Oats === g0.Oats && g1.Banana === g0.Banana && after.items.length === 3, `B1: Fit moved my own foods only: skyr ${g0.Skyr} g to ${g1.Skyr} g, oats and banana as they were`);
  ok(/fits your plan/.test(await p.locator(".readout").innerText()), "B1: the plate reaches the PD target; the energy is what the foods give");
  ok(/This plate/.test(await p.locator(".readout-top").innerText()), "B2: the result says This plate");
  const notes = (await p.locator(".fit-note").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  ok(notes.length === 2 && notes[0] === "No meal is set, so Fit aimed at your PD target only: 4.8 or more. The energy is what your foods give.", "B2: Chef Mealan says first what Fit aimed at: " + notes[0]);
  ok(/Undo/.test(notes[1]), "B2: under it what Fit did, with Undo: " + notes[1]);
  ok(/^Meal and day not set$/.test(await h.line(p)), "A2: after Fit the line still says Meal and day not set");
  // with a meal set, Fit says nothing about no meal (A8)
  await p.locator(".plan-line-pen").click(); await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(500);
  await p.locator(".fit-top").click(); await p.waitForTimeout(1200);
  ok(await p.locator(".fit-aim").count() === 0, "A8: with a meal set, Fit works for that meal as in 0.3.156: no line about no meal");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
