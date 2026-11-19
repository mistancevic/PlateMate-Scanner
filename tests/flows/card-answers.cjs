// Story DT306 (0.3.163, board DT306; Coach Milan 16 and 18 November, Go 18 November 19:13 and 19 November 11:36): Chef Mealan's
// card on the Plate's screen of a photo, in the read's shape. With a meal set: under his word, Did you eat it? with All of it,
// Half, Part of it and Don't count it as choices, and Done as the one button; + Add more to your plate stands right above.
// Half logs half and keeps the other half on Today; Don't count it keeps the plate as Served, not counted. With no meal
// selected his card is his word alone (Coach Milan 19 November 11:36: Add a food and Don't count it leave it too), and the
// page ends with What do you do with it?. The checks name the acceptance criteria of the board (DT306 AC1 to AC5).
const start = require("./plate157.cjs");
const PORT = "3579";
(async () => { const h = await start(PORT); const { ok } = h; try {
  const toCard = async (meal) => { const p = await h.open({ foods: [] }); await h.toPhoto(p, false); if (meal) { await p.locator(".meal-line .plan-line-pen").click(); await p.waitForTimeout(300); await h.row(p, meal, ".meal-line-open").click(); await p.waitForTimeout(400); await p.locator(".meal-line .plan-line-close").click(); await p.waitForTimeout(300); }
    await h.readIt(p); await p.locator(".rv-change .rv-continue").click(); await p.waitForTimeout(800); return p; };
  let p = await toCard("Dinner");
  const opts = (await p.locator(".mp-say .mp-eat .pa-opt").allInnerTexts()).map((x) => x.trim());
  ok(/^Chef Mealan:/.test((await p.locator(".mp-say > small").first().innerText()).trim()) && /Did you eat it\?/.test(await p.locator(".mp-say .mp-eat").innerText()) && opts.join("|") === "All of it|Half|Part of it|Don't count it", "DT306 AC1: under his word, Did you eat it? with All of it, Half, Part of it and Don't count it as choices: " + opts.join("|"));
  const btns = (await p.locator(".mp-say button").allInnerTexts()).map((x) => x.trim());
  ok(btns.join("|") === "Done" && /pill-primary/.test(await p.locator(".mp-done").getAttribute("class")), "DT306 AC2: Done is the only button on the card: " + btns.join("|"));
  // as drawn on the board DT306 (frame DT306b): between them only the gates card of the plate, which this story does not touch
  ok(await p.evaluate(() => { const a = document.querySelector(".add-more-open").getBoundingClientRect(), c = document.querySelector(".mp-say").getBoundingClientRect(); return a.bottom <= c.top && ![...document.querySelectorAll("main section, main .card")].some((x) => { const r = x.getBoundingClientRect(); return r.top >= a.bottom && r.bottom <= c.top && r.height > 30 && !x.matches(".gate-card"); }); }), "DT306 AC2: + Add more to your plate stands above the card, with only the plate's gates card between, as drawn");
  ok(await p.locator(".mp-done").isDisabled(), "Done waits for an answer");
  ok(await p.locator(".mp-eat .pa-opt").evaluateAll((xs) => xs.every((x) => x.getBoundingClientRect().height >= 44)), "every choice is 44 px or more");
  // AC3
  await p.locator(".mp-eat .pa-opt").filter({ hasText: "Half" }).click(); await p.waitForTimeout(200);
  ok(await p.locator(".mp-grams").inputValue() === "165", "Half fills the grams: 165 of 330");
  await p.locator(".mp-done").click(); await p.waitForTimeout(900);
  let s = await h.st(p); const e = s.feedback.filter((f) => f.status === "eaten"), r = s.feedback.filter((f) => f.status === "prepared");
  ok(e.length === 1 && Math.round(e[0].meal.items.reduce((n, i) => n + i.grams, 0)) === 165 && e[0].slot && e[0].slot.slotId === "dinner" && r.length === 1, "DT306 AC3: Half, Done: half is logged as the dinner and the other half is kept, as Ate half did");
  ok(/Today/.test(await p.locator("header").innerText()) && /half/i.test((await h.main(p))), "the other half is on Today");
  await p.context().close();
  // AC4
  p = await toCard("Dinner");
  await p.locator(".mp-eat .pa-opt").filter({ hasText: "Don't count it" }).click(); await p.waitForTimeout(200);
  ok(await p.locator(".mp-grams").count() === 0, "Don't count it has no grams");
  await p.locator(".mp-done").click(); await p.waitForTimeout(900);
  s = await h.st(p);
  ok(s.feedback.filter((f) => f.status === "eaten").length === 0 && (s.served || []).length === 1 && await p.locator(".sv-plate").count() === 1 && /Not counted in your day/.test(await h.main(p)), "DT306 AC4: Don't count it, Done: not counted in my day, kept as Served, as Don't count it did");
  await p.context().close();
  // Part of it, with grams
  p = await toCard("Dinner");
  await p.locator(".mp-eat .pa-opt").filter({ hasText: "Part of it" }).click(); await p.waitForTimeout(200); await p.locator(".mp-grams").fill("100"); await p.locator(".mp-done").click(); await p.waitForTimeout(900);
  s = await h.st(p);
  ok(s.feedback.filter((f) => f.status === "eaten").length === 1 && Math.round(s.feedback[0].meal.items.reduce((n, i) => n + i.grams, 0)) === 100, "Part of it, 100 g, Done: 100 g are logged");
  await p.context().close();
  // AC5
  p = await toCard(null);
  const card = p.locator(".mp-say");
  ok(await card.count() === 1 && /^Chef Mealan:/.test((await card.innerText()).trim()) && await card.locator("button, .pa-opt").count() === 0, "DT306 AC5: no meal selected: his word alone, no Add a food, no Don't count it");
  ok(await p.locator(".plate-end").count() === 1 && /What do you do with it\?/.test(await p.locator(".plate-end").innerText()), "DT306 AC5: and the page ends with What do you do with it?");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
