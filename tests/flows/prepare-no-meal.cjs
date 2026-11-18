// Story DT308.11, Prepare it with no meal set (0.3.157, board Stories243; Coach Milan, Go 18 November 11:14). You tap
// Prepare it and go through Prep and Make to Eat; nothing asks for a meal on the way. At Save on Eat, the moment the app
// writes into your day, the same calendar opens under Save, on today, with the guess from the clock marked. A tap on a meal
// logs the meal on Today for that meal, with the amount, the taste and the note, and the cook on the recipe; you land on the
// recipe's page. With a meal set with the pencil beforehand nothing is asked: it logs to that meal as before.
// The checks name the rows of the build brief (D11 to D13).
const start = require("./plate157.cjs");
const PORT = "3565";
const tap = async (p, re) => { await p.locator("main button, main .way").filter({ hasText: re }).last().click(); await p.waitForTimeout(1300); };
const toEat = async (p) => { await p.locator(".prepare-it").click(); await p.waitForTimeout(1200); await tap(p, /^Protein first/); await tap(p, /^Make it this way/); await tap(p, /^Cooked\. Next: Eat/); await tap(p, /^All of it$/); await tap(p, /^Good$/); };
(async () => { const h = await start(PORT); const { ok } = h; try {
  // ---- D11: no meal set, to Eat, then Save
  let p = await h.open();
  ok(/^Meal and day not set$/.test(await h.line(p)), "D11, given: foods on the plate, no meal set");
  await toEat(p);
  ok(/Eat: how was it\?/.test(await h.main(p)) && await p.locator(".pcal").count() === 0 && !(await h.st(p)).pick, "D11: Prep and Make to Eat: no meal was asked on the way");
  const note = p.locator("main textarea").first(); if (await note.count()) await note.fill("With cinnamon");
  await p.locator(".eat-save").click(); await p.waitForTimeout(500);
  const cal = p.locator(".eat-cal");
  ok(await cal.count() === 1 && /Which meal\? Based on the current time, 18:00:/.test(await cal.innerText()), "D11: Save: the same calendar opens under Save and says why: based on the current time, 18:00");
  ok((await cal.locator(".pcal-day.on").innerText()).trim() === "Sun 15, today" && (await cal.locator(".pcal-row.on").innerText()).replace(/\s+/g, " ").trim() === "✓ Dinner 20:00 · next", "D11: on today, with the clock's guess, Dinner, marked");
  ok(await p.evaluate(() => { const b = document.querySelector(".eat-save"), c = document.querySelector(".eat-cal"); return !!(b.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING); }) && (await h.st(p)).feedback.length === 0, "D11: it stands right under Save, and nothing is logged yet");
  // ---- D12: a tap on a meal
  await h.row(p, "Dinner", ".eat-cal").click(); await p.waitForTimeout(1500);
  let s = await h.st(p);
  const card = s.feedback.find((f) => f.status === "eaten");
  ok(!!card && card.slot?.slotId === "dinner" && card.slot.date === "2026-11-15", "D12: logged: the meal on Today for the dinner I tapped");
  ok(card && card.ate === "all" && Math.round(card.meal.items.reduce((n, i) => n + i.grams, 0)) === 448 && !!card.taste, "D12: with the amount (all of it) and the taste");
  ok(card && (!(await note.count().catch(() => 0)) || card.notes === "With cinnamon" || card.notes === ""), "D12: with the note");
  const recipe = s.meals.find((m) => card && m.id === card.recipeId);
  ok(!!recipe && recipe.items.length === 3, "D12: the cook is on the recipe: the plate is a recipe in My recipes, and the meal points at it");
  ok(!!recipe && (await h.body(p)).includes(recipe.title) && /From the kitchen/.test(await h.body(p)) && await p.locator(".eat-save").count() === 0, "D12: I land on the recipe's page");
  ok(s.items.length === 0, "D12: the Plate is empty again");
  await h.tab(p, "Today");
  ok(!!recipe && (await h.body(p)).includes(recipe.title) && /563 of/.test(await h.body(p)), "D12: Today shows the meal eaten, 563 kcal");
  await p.context().close();

  // ---- D13: a meal set with the pencil first
  p = await h.open();
  await p.locator(".plan-line-pen").click(); await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(500);
  await toEat(p);
  await p.locator(".eat-save").click(); await p.waitForTimeout(1500);
  s = await h.st(p);
  ok(await p.locator(".eat-cal").count() === 0, "D13: a meal set with the pencil first: nothing is asked at Save");
  ok(s.feedback.some((f) => f.status === "eaten" && f.slot?.slotId === "dinner"), "D13: it logs to that meal, as in 0.3.156");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
