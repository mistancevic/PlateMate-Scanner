// Story DT308.11 (0.3.157, board Stories242, frames a to c and h to m; Coach Milan, Go 18 November 11:14): a plate without
// a photo ends with What do you do with it? Save it, Plan it, Ate it, all three white. Plan it opens your calendar under the
// button on tomorrow, with nothing marked; a tap on a free meal plans the plate at once, you land on Plan on that day, and
// the Plate is empty. Ate it opens it on today with the guess from the clock marked and its reason; a tap logs at once, you
// land on Today, the message says what was logged and where, and no amount is asked. Undo on the meal's card takes the meal
// out of Today and puts the plate back on the Plate, with no meal set. Save it keeps the plate in My recipes under the
// foods' name when none was typed, says which name, and the plate stays. With a meal already set with the pencil nothing is
// asked again (Coach Milan, 18 November): Ate it and Plan it act at once on that meal.
// The checks name the rows of the build brief (D1, D2, D8 to D10).
// Changed by B148 (0.3.158, board Stories252; Coach Milan, Go 18 November 15:45): new checks at the end, B148 AC1 to AC4.
// Under Ate it and under Plan it a tap on another day opens that day; in 0.3.157 the tap was lost. Nothing else changed.
const start = require("./plate157.cjs");
const PORT = "3562";
(async () => { const h = await start(PORT); const { ok } = h; try {
  // ---- D1: the end of the page
  let p = await h.open();
  const end = p.locator(".plate-end");
  ok(await end.count() === 1 && /^What do you do with it\? Save it Plan it Ate it$/.test((await end.innerText()).replace(/\s+/g, " ").trim()), "D1: foods on the plate, no photo, no meal set: What do you do with it? Save it, Plan it, Ate it");
  ok(await end.locator(".pill-primary").count() === 0 && await end.locator("button").evaluateAll((bs) => bs.every((b) => b.getBoundingClientRect().height >= 44 && getComputedStyle(b).backgroundColor === "rgb(255, 255, 255)")), "D1: all three are white, and 44 high");
  ok(await p.evaluate(() => { const a = document.querySelector(".prepare-it"), e = document.querySelector(".plate-end"); return !!a && !!e && (a.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; }), "D1: it stands at the end, under Prepare it");
  // ---- D2: Plan it, then a free meal
  await p.locator(".pe-plan").click(); await p.waitForTimeout(400);
  ok(/Which day and meal\?/.test(await end.innerText()) && (await end.locator(".pcal-day.on").innerText()).trim() === "Mon 16" && await end.locator(".pcal-row.on").count() === 0, "D2: the calendar opens under the button, on tomorrow, with nothing marked");
  ok((await h.rows(p, ".plate-end")).join(" | ") === "Breakfast 07:30 · nothing planned | Lunch 13:45 · nothing planned | Dinner 20:00 · nothing planned", "D2: Monday's meals, each nothing planned");
  ok(await end.locator(".pcal-day").first().isDisabled(), "D2: a day gone by cannot be planned");
  await h.row(p, "Lunch", ".plate-end").click(); await p.waitForTimeout(1200);
  let body = await h.body(p), plan = await h.plan(p), s = await h.st(p);
  ok(plan["2026-11-16"]?.lunch?.title === "Skyr, Oats & Banana" && plan["2026-11-16"].lunch.kcal === 563, "D2: planned at once: Monday's lunch is Skyr, Oats & Banana, 563 kcal");
  ok(/Monday, 16 November/.test(body) && /Lunch, 13:45 Skyr, Oats & Banana/.test(body), "D2: I land on Plan, on Monday, and the plate is its lunch");
  ok(/Skyr, Oats & Banana is Monday's lunch\. Saved to My recipes too\./.test(body), "D2: the message says so");
  ok(s.items.length === 0 && s.feedback.length === 0 && !s.pick, "D2: nothing is counted; the Plate is empty, with no meal set");
  ok(s.meals.some((m) => m.title === "Skyr, Oats & Banana"), "D2: the plate is in My recipes, as when a plate went into the plan before");
  await p.context().close();

  // ---- D8, D9: Ate it, then Undo on Today
  p = await h.open();
  await p.locator(".pe-ate").click(); await p.waitForTimeout(400);
  const e2 = p.locator(".plate-end");
  ok(/Which meal\? Based on the current time, 18:00:/.test(await e2.innerText()) && (await e2.locator(".pcal-day.on").innerText()).trim() === "Sun 15, today", "D8: the calendar opens on today and says why: based on the current time, 18:00");
  ok((await e2.locator(".pcal-row.on").innerText()).replace(/\s+/g, " ").trim() === "✓ Dinner 20:00 · next" && await e2.locator(".pcal-row.on").count() === 1, "D8: the guess from the clock is marked: Dinner");
  ok(await e2.locator(".pcal-day").filter({ hasText: "Mon 16" }).isDisabled(), "D8: a coming day cannot be eaten yet");
  await e2.locator(".pcal-row.on").click(); await p.waitForTimeout(1200);
  body = await h.body(p); s = await h.st(p);
  ok(s.feedback.length === 1 && s.feedback[0].status === "eaten" && s.feedback[0].slot?.slotId === "dinner" && s.feedback[0].slot.date === "2026-11-15" && Math.round(s.feedback[0].meal.items.reduce((n, i) => n + i.grams, 0)) === 448, "D8: logged at once as today's dinner, all of it: no amount is asked");
  ok(/Logged: Skyr, Oats & Banana is today's dinner, 563 kcal\. It's on Today\./.test(body), "D8: I land on Today and the message says what was logged and where");
  ok(s.items.length === 0, "D8: the Plate is empty");
  ok(await p.locator(".meal-undo").count() === 1, "D9: the meal's card on Today has Undo");
  await p.locator(".meal-undo").click(); await p.waitForTimeout(700);
  s = await h.st(p);
  ok(s.feedback.length === 0 && s.items.length === 3 && !s.pick, "D9: Undo: the meal leaves Today; the plate is back on the Plate with no meal set");
  ok(/Undone: Skyr, Oats & Banana is back on your Plate\./.test(await h.body(p)), "D9: the message says so");
  await h.tab(p, "Plate");
  ok(/^No meal selected$/.test(await h.line(p)) && /Skyr[\s\S]*Oats[\s\S]*Banana/.test(await h.main(p)), "D9: on the Plate the three foods are there again, No meal selected");
  // ---- D10: Save it
  ok(await p.locator(".step-head input").first().evaluate((e) => e.value === "" && e.placeholder === "Skyr, Oats & Banana"), "D10: no name typed: the top shows the foods' name in grey, not Meal title");
  await p.locator(".pe-save").click(); await p.waitForTimeout(500);
  s = await h.st(p);
  ok(s.meals.length === 1 && s.meals[0].title === "Skyr, Oats & Banana" && s.meals[0].items.length === 3, "D10: saved in My recipes under the foods' name, with its foods and amounts");
  ok(await p.locator(".pe-save").isDisabled() && /✓ Saved in My recipes/.test(await p.locator(".pe-save").innerText()), "D10: the button says Saved in My recipes with a tick and cannot be tapped again");
  ok(/Saved as Skyr, Oats & Banana, the foods' name\. A name you type on top renames it\./.test(await p.locator(".plate-end").innerText()), "D10: a line says which name");
  ok(s.items.length === 3 && s.feedback.length === 0 && /^No meal selected$/.test(await h.line(p)), "D10: the plate stays, nothing is counted, no meal is set");
  await p.locator(".step-head input").first().fill("Morning bowl"); await p.locator(".step-head input").first().blur(); await p.waitForTimeout(500);
  ok((await h.st(p)).meals[0].title === "Morning bowl", "D10: a name typed on top renames the recipe");
  await p.locator(".pe-plan").click(); await p.waitForTimeout(300); await h.row(p, "Dinner", ".plate-end").click(); await p.waitForTimeout(1200);
  s = await h.st(p); plan = await h.plan(p);
  ok(plan["2026-11-16"]?.dinner?.title === "Morning bowl" && s.meals.length === 1, "D10: Plan it still works after Save it, and makes no second recipe");
  await p.context().close();

  // ---- a meal set with the pencil: nothing is asked again (Coach Milan, 18 November)
  p = await h.open();
  await p.locator(".plan-line-pen").click(); await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(500);
  ok(await p.locator(".plate-end").count() === 1, "a meal set with the pencil: the plate still ends with What do you do with it?");
  await p.locator(".pe-ate").click(); await p.waitForTimeout(1200);
  s = await h.st(p);
  ok(s.feedback.length === 1 && s.feedback[0].slot?.slotId === "dinner" && await p.locator(".plate-end .pcal").count() === 0 && /Logged: Skyr, Oats & Banana is today's dinner/.test(await h.body(p)), "a meal set with the pencil, Ate it: logged to that meal at once, no calendar");
  await p.context().close();
  p = await h.open();
  await p.locator(".plan-line-pen").click(); await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Mon 16" }).click(); await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(500);
  ok(await p.getByRole("button", { name: /^Put it in/ }).count() === 0 && await p.locator(".plate-end").count() === 1, "D2: Monday's lunch set with the pencil: no Put it in Monday's lunch; the end is What do you do with it?");
  await p.locator(".pe-plan").click(); await p.waitForTimeout(1200);
  plan = await h.plan(p);
  ok(plan["2026-11-16"]?.lunch?.title === "Skyr, Oats & Banana" && /Monday, 16 November/.test(await h.body(p)), "a meal set with the pencil, Plan it: planned to that meal at once; I land on Plan on Monday");
  await p.context().close();
  // a tap that does not fit the set meal opens the calendar
  p = await h.open();
  await p.locator(".plan-line-pen").click(); await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Mon 16" }).click(); await h.row(p, "Lunch", ".meal-line-open").click(); await p.waitForTimeout(500);
  await p.locator(".pe-ate").click(); await p.waitForTimeout(500);
  ok(await p.locator(".plate-end .pcal").count() === 1 && (await h.st(p)).feedback.length === 0, "Monday's lunch is set and I tap Ate it: a meal still to come cannot be eaten, so the calendar opens on today");
  await p.context().close();
  // ---- B148: a tap on a day in the calendar under Ate it and under Plan it opens that day
  const pe = ".plate-end", days = async (q) => q.locator(pe + " .pcal-day.on").allInnerTexts();
  p = await h.open();
  await p.locator(".pe-ate").click(); await p.waitForTimeout(500);
  await p.locator(pe + " .pcal-day").filter({ hasText: "Sat 14" }).click(); await p.waitForTimeout(400);
  let rs = await h.rows(p, pe);
  ok((await days(p)).join() === "Sat 14" && rs.length === 4 && rs.every((r) => !/next|now/.test(r)) && /^Dinner 20:00 · not eaten/.test(rs[2]), "B148 AC1: Ate it, then Sat 14: Sat 14 is marked and the rows are Saturday's meals");
  await p.locator(pe + " .pcal-more").click(); await p.waitForTimeout(300);
  await p.locator(pe + " .pcal-date").fill("2026-11-12"); await p.waitForTimeout(400);
  ok((await days(p)).some((d) => /Thu 12/.test(d)) && await p.locator(pe + " .pcal-date").count() === 1, "B148 AC3: More, then 12 November: the calendar is on Thursday 12");
  await p.locator(pe + " .pcal-day").filter({ hasText: "Sat 14" }).click(); await p.waitForTimeout(400);
  ok((await days(p)).join() === "Sat 14" && await p.locator(pe + " .pcal-date").count() === 0 && !/ on/.test(await p.locator(pe + " .pcal-more").getAttribute("class")), "B148 AC3: then Sat 14: More closes, Sat 14 is marked");
  await h.row(p, "Lunch", pe).click(); await p.waitForTimeout(1200);
  const fb = (await h.st(p)).feedback;
  ok(fb.length === 1 && /Skyr, Oats & Banana is in Saturday's lunch, eaten/.test(await h.body(p)) && (await h.st(p)).items.length === 0, "B148 AC4: Sat 14 is marked and I tap Lunch: the plate is logged to Saturday's lunch");
  await p.context().close();
  p = await h.open();
  await p.locator(".pe-plan").click(); await p.waitForTimeout(500);
  await p.locator(pe + " .pcal-day").filter({ hasText: "Tue 17" }).click(); await p.waitForTimeout(400);
  ok((await days(p)).join() === "Tue 17" && (await h.rows(p, pe)).length === 3, "B148 AC2: Plan it, then Tue 17: Tue 17 is marked and the rows are Tuesday's meals");
  await h.row(p, "Dinner", pe).click(); await p.waitForTimeout(1200);
  ok((await h.plan(p))["2026-11-17"]?.dinner?.title === "Skyr, Oats & Banana", "B148 AC2: a tap on Dinner plans the plate for Tuesday's dinner");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
