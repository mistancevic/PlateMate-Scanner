// Story DT308.4 to DT308.6 (0.3.157, board Stories237; Coach Milan, Go 18 November 11:14): the end of a read with no meal
// set. A photo is read and no meal is guessed: the line says Meal and day not set, and the read ends with What do you do
// with it? Save it, Plan it, Ate it, all three white. Ate it on a photo taken now opens your calendar under the button on
// today, with the guess from the clock marked and its reason. On an older photo it opens on the photo's day with the guess
// from the photo's time marked (this solves B147: the photo's day, not today's clock). A tap on a meal sets it in the line,
// and the read goes on as before: Did you eat it? All of it, Half, Part of it, then Done. Plan it opens the calendar on
// tomorrow with nothing marked; the tap plans it and you land on Plan on that day, with no Did you eat it?. Save it keeps it
// in My recipes with its photo; the plate stays and the button says Saved in My recipes.
// The checks name the rows of the build brief (C1 to C6).
const start = require("./plate157.cjs");
const PORT = "3564";
(async () => { const h = await start(PORT); const { ok } = h; try {
  // ---- C1, C2, C4: a photo taken now
  let p = await h.open({ foods: [] });
  await h.toPhoto(p, false);
  ok(/^Meal and day not set$/.test(await h.line(p)), "A2: on the photo screen the line says Meal and day not set");
  await h.readIt(p);
  ok(await p.locator(".read-view").count() === 1 && /^Meal and day not set$/.test(await h.line(p)), "A2: the photo is read: the line did not change, no meal is guessed");
  ok(/This plate/.test(await p.locator(".read-view .readout-top").innerText()), "C1: the read's result says This plate");
  const end = p.locator(".read-view .plate-end");
  ok(await end.count() === 1 && /^What do you do with it\? Save it Plan it Ate it$/.test((await end.innerText()).replace(/\s+/g, " ").trim()) && await end.locator(".pill-primary").count() === 0, "C1: the read ends with What do you do with it? Save it, Plan it, Ate it, all three white");
  ok(await p.locator(".rv-eat").count() === 0 && await p.locator(".rv-done").count() === 0, "C1: no Did you eat it? and no Done while no meal is set");
  await p.locator(".pe-ate").click(); await p.waitForTimeout(400);
  ok(/Which meal\? Based on the current time, 18:00:/.test(await end.innerText()) && (await end.locator(".pcal-day.on").innerText()).trim() === "Sun 15, today" && /Dinner/.test(await end.locator(".pcal-row.on").innerText()), "C2: Ate it: the calendar opens under the button on today; the guess from the clock, Dinner, is marked, with its reason");
  await h.row(p, "Dinner", ".read-view").click(); await p.waitForTimeout(600);
  ok(/^Dinner Sunday, 15 November, 20:00$/.test(await h.line(p)) && await p.locator(".meal-line .plan-line-x").count() === 1, "C4: the meal is set in the line: " + await h.line(p));
  ok(await p.locator(".read-view").count() === 1 && /Did you eat it\? All of it Half Part of it/.test((await p.locator(".rv-eat").innerText()).replace(/\s+/g, " ")) && await p.locator(".rv-done").count() === 1, "C4: the read goes on with Did you eat it? All of it, Half, Part of it, then Done");
  ok((await h.st(p)).feedback.length === 0, "C4: nothing is logged yet");
  await p.locator(".rv-eat .pa-opt").filter({ hasText: "All of it" }).click(); await p.waitForTimeout(200); await p.locator(".rv-done").click(); await p.waitForTimeout(1200);
  let s = await h.st(p);
  ok(s.feedback.length === 1 && s.feedback[0].slot?.slotId === "dinner" && s.feedback[0].slot.date === "2026-11-15" && (!!s.feedback[0].photo || !!s.feedback[0].hasPhoto || (s.feedback[0].photoCount ?? 0) >= 1), "C4: Done logs it as today's dinner, with its photo, as in 0.3.156");
  await p.context().close();

  // ---- C3, C4: an older photo
  p = await h.open({ foods: [] });
  await h.toPhoto(p, true);
  ok(/^Meal and day not set$/.test(await h.line(p)), "C3: an older photo waits: the line says Meal and day not set");
  await h.readIt(p);
  ok(/^Meal and day not set$/.test(await h.line(p)) && await p.locator(".read-view .plate-end").count() === 1, "C3: the read of the older photo: no meal set, the same end");
  await p.locator(".pe-ate").click(); await p.waitForTimeout(400);
  const e2 = p.locator(".read-view .plate-end");
  ok(/Which meal\? From the photo, Saturday 15:57:/.test(await e2.innerText()) && (await e2.locator(".pcal-day.on").innerText()).trim() === "Sat 14", "C3: the calendar opens on the photo's day, Saturday, and says: from the photo, Saturday 15:57");
  ok((await e2.locator(".pcal-row.on").innerText()).replace(/\s+/g, " ").trim() === "✓ Lunch 13:45 · not eaten", "C3: the guess from the photo's time is marked: lunch, not eaten that day (B147)");
  ok((await h.rows(p, ".read-view")).some((t) => t === "Snack at 15:57"), "C3: the snack of that day says the photo's time");
  await h.row(p, "Lunch", ".read-view").click(); await p.waitForTimeout(600);
  ok(/^Lunch Saturday, 14 November, 15:57$/.test(await h.line(p)), "C4: the line says Saturday's lunch at the photo's time: " + await h.line(p));
  ok(/Did you eat it\?/.test(await p.locator(".rv-eat").innerText()), "C4: the read goes on with Did you eat it?");
  await p.locator(".rv-eat .pa-opt").filter({ hasText: "Half" }).click(); await p.waitForTimeout(200); await p.locator(".rv-done").click(); await p.waitForTimeout(1200);
  s = await h.st(p);
  ok(s.feedback.length === 1 && s.feedback[0].slot?.slotId === "lunch" && s.feedback[0].slot.date === "2026-11-14" && new Date(s.feedback[0].createdAt).getDate() === 14 && Math.round(s.feedback[0].meal.items.reduce((n, i) => n + i.grams, 0)) === 165, "C4: Done logs half of it as Saturday's lunch, at the photo's time");
  await p.context().close();
  // X after the tap clears it again
  p = await h.open({ foods: [] }); await h.toPhoto(p, true); await h.readIt(p);
  await p.locator(".pe-ate").click(); await p.waitForTimeout(300); await h.row(p, "Lunch", ".read-view").click(); await p.waitForTimeout(500);
  await p.locator(".plan-line-x").click(); await p.waitForTimeout(400);
  ok(/^Meal and day not set$/.test(await h.line(p)) && await p.locator(".read-view .plate-end").count() === 1 && await p.locator(".rv-eat").count() === 0, "A7: X on the read: Meal and day not set again, and the read ends with What do you do with it? again");

  // ---- C5: Plan it
  await p.locator(".pe-plan").click(); await p.waitForTimeout(400);
  const e3 = p.locator(".read-view .plate-end");
  ok(/Which day and meal\?/.test(await e3.innerText()) && (await e3.locator(".pcal-day.on").innerText()).trim() === "Mon 16" && await e3.locator(".pcal-row.on").count() === 0, "C5: Plan it: the calendar opens on tomorrow with nothing marked");
  await h.row(p, "Lunch", ".read-view").click(); await p.waitForTimeout(1200);
  const plan = await h.plan(p); s = await h.st(p);
  ok(plan["2026-11-16"]?.lunch?.title === "Grilled chicken with rice" && /Monday, 16 November/.test(await h.body(p)) && /Lunch, 13:45 Grilled chicken with rice/.test(await h.body(p)), "C5: the tap plans it; I land on Plan on Monday");
  ok(s.feedback.length === 0 && s.items.length === 0 && !s.photo, "C5: no Did you eat it?: nothing is counted, and the Plate is empty");
  await p.context().close();

  // ---- C6: Save it
  p = await h.open({ foods: [] }); await h.toPhoto(p, false); await h.readIt(p);
  await p.locator(".pe-save").click(); await p.waitForTimeout(600);
  s = await h.st(p);
  ok(s.meals.length === 1 && s.meals[0].title === "Grilled chicken with rice" && ((s.meals[0].photos?.length ?? 0) + (s.meals[0].photoCount ?? 0) + (s.meals[0].photoSigs?.length ?? 0) + (s.meals[0].photo ? 1 : 0)) >= 1, "C6: saved in My recipes with its photo");
  ok(s.items.length === 2 && !!s.photo && s.feedback.length === 0, "C6: the plate stays; nothing is counted");
  ok(await p.locator(".pe-save").isDisabled() && /✓ Saved in My recipes/.test(await p.locator(".pe-save").innerText()), "C6: the button says Saved in My recipes with a tick");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
