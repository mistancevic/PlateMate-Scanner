// Story DT308.12 (0.3.157, boards Stories244 and Stories245; Coach Milan, Go 18 November 11:14; his words of 10:53, 11:01
// and 11:07 on Start a new plate): something is on the plate, and a photo, a barcode or a recipe comes. A photo: the photo
// screen warns as before and the meal line does not change; after the read one question on a screen of its own: what is on
// my plate, what the photo holds, Add to my plate, Start a new plate, with Back on the top left to the photo screen and a
// last line that says the old plate is saved in My recipes. Add to my plate: I land on the Plate with foods, the photo's
// foods joined and marked ~, the meal line as it was, no Did you eat it?; an older photo does not move a meal I set. Start a
// new plate: the old plate is saved in My recipes (the foods' name if none was typed); the new plate holds only what came
// and has no meal set; one line at its top, in the warning's colour, says what was saved, with Open it in My recipes, Undo
// and X, until it is closed. Undo puts the old plate back as if I had not tapped. A barcode joins with a message and no
// question. A recipe from Recipe link asks the same question in the same look, with Back to what was read; Add to my plate
// keeps my foods and the recipe joins as one dish row; Start a new plate as for a photo.
// The checks name the rows of the build brief (E1 to E12).
const start = require("./plate157.cjs");
const PORT = "3567";
const names = (s) => s.items.map((i) => i.food.name.split(",")[0] + (i.est ? "~" : "") + (i.dish ? "#" : "")).join(", ");
(async () => { const h = await start(PORT); const { ok } = h; try {
  // ---- E1, E2, E3: a photo taken now
  let p = await h.open();
  await h.toPhoto(p, false);
  ok(/Your plate is not empty\. It has Skyr, Oats & Banana\./.test(await h.main(p)), "E1: the photo screen warns that the plate is not empty, as in 0.3.152");
  ok(/^No meal selected$/.test(await h.line(p)), "E1: the meal line does not change");
  await h.readIt(p);
  let m = await h.main(p);
  ok(/Your plate is not empty It already has Skyr, Oats & Banana/.test(m) && /The photo holds chicken breast ~180 g and rice ~150 g\./.test(m) && await p.getByRole("button", { name: "Add to my plate" }).count() === 1 && await p.getByRole("button", { name: "Start a new plate" }).count() === 1 && await p.locator(".rows .swipe, .plate-card").count() === 0,
    "E2: Read the plate: the question on a screen of its own: what is on my plate, what the photo holds, Add to my plate, Start a new plate");
  ok(/Start a new plate: only the new foods\. Skyr, Oats & Banana is saved in My recipes, so nothing is lost\.$/.test(m.trim()), "E2: the last line says the old plate is saved in My recipes");
  ok(await p.locator(".ask-back").count() === 1 && /Back to the photo/.test(await p.locator(".ask-back").innerText()) && await p.evaluate(() => { const b = document.querySelector(".ask-back").getBoundingClientRect(), h2 = document.querySelector(".plate-ask-head").getBoundingClientRect(); return b.left < 60 && b.bottom <= h2.top + 2 && b.height >= 44; }), "E2: Back stands on the top left, 44 high");
  await p.locator(".ask-back").click(); await p.waitForTimeout(600);
  let s = await h.st(p);
  ok(await p.locator(".photo-screen").count() === 1 && /Your plate is not empty\./.test(await h.main(p)) && names(s) === "Skyr, Oats, Banana" && !s.photo && s.meals.length === 0, "E2: Back returns to the photo screen with nothing changed");
  await h.readIt(p);
  await p.getByRole("button", { name: "Add to my plate" }).click(); await p.waitForTimeout(1000);
  s = await h.st(p); m = await h.main(p);
  ok(names(s) === "Skyr, Oats, Banana, Chicken breast~, Rice~", "E3: the photo's foods joined, marked ~: " + names(s));
  ok(await p.locator(".read-view").count() === 0 && /On your plate/.test(m) && await p.locator(".fit-top").count() === 1 && await p.locator(".add-more-open").count() === 1 && await p.locator(".prepare-it").count() === 1, "E3: I land on the Plate with foods, the one landing, not on a read");
  ok(/^No meal selected$/.test(await h.line(p)) && !s.pick, "E3: the meal line is as it was");
  ok(!/Did you eat it\?/.test(m) && await p.locator(".chef-ask").count() === 0 && s.feedback.length === 0, "E3: no Did you eat it?");
  ok(await p.locator(".step-head input").first().evaluate((e) => /Chicken|Rice/.test(e.placeholder) && /Skyr/.test(e.placeholder)), "E3: the top shows the foods' name, now with the new foods");
  await p.context().close();

  // ---- E4: an older photo, on a plate whose meal is set
  p = await h.open();
  await p.locator(".plan-line-pen").click(); await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(500);
  await h.toPhoto(p, true);
  ok(/^Dinner Sunday, 15 November, 20:00 Planned$/.test(await h.line(p)), "E4: an older photo (Saturday 15:57) on the photo screen: the meal line still says Sunday's dinner; changed by B151: and Planned");
  await h.readIt(p); await p.getByRole("button", { name: "Add to my plate" }).click(); await p.waitForTimeout(1000);
  s = await h.st(p);
  ok(/^Dinner Sunday, 15 November, 20:00 Planned$/.test(await h.line(p)) && s.pick === "meal:dinner" && (await h.plan(p))["2026-11-15"]?.dinner?.items.length === 5, "E4: after Add to my plate the meal line still says the meal I set; changed by B151: the planned Dinner holds the joined foods too");
  ok(await p.locator(".chef-ask").count() === 0 && !/Did you eat it\?|Saturday/.test(await h.main(p)) && names(s) === "Skyr, Oats, Banana, Chicken breast~, Rice~", "E4: nothing asks about the photo's day; the foods joined");
  await p.context().close();
  // no meal set, an older photo joined: its day and time are the guess only when I say Ate it
  p = await h.open(); await h.toPhoto(p, true); await h.readIt(p); await p.getByRole("button", { name: "Add to my plate" }).click(); await p.waitForTimeout(1000);
  ok(await p.locator(".chef-ask").count() === 0 && /^No meal selected$/.test(await h.line(p)), "E3: an older photo joined a plate with no meal set: no question, the line as it was");
  await p.locator(".pe-ate").click(); await p.waitForTimeout(400);
  ok(/Which meal\? From the photo, Saturday 15:57:/.test(await p.locator(".plate-end").innerText()) && /Lunch/.test(await p.locator(".plate-end .pcal-row.on").innerText()), "E3: Ate it later: the photo's day and time are the marked guess in the calendar");
  await p.context().close();

  // ---- E5 to E8: Start a new plate
  p = await h.open(); await h.toPhoto(p, false); await h.readIt(p);
  await p.getByRole("button", { name: "Start a new plate" }).click(); await p.waitForTimeout(1000);
  s = await h.st(p);
  ok(s.meals.length === 1 && s.meals[0].title === "Skyr, Oats & Banana" && s.meals[0].items.length === 3, "E5: the old plate is saved in My recipes, under the foods' name");
  ok(names(s) === "Chicken breast~, Rice~" && !s.pick && /^No meal selected$/.test(await h.line(p)), "E5: the new plate holds only what came and has no meal set");
  ok(await p.locator(".read-view .plate-end").count() === 1, "E5: for a photo I am on its read, which ends with What do you do with it?");
  const line = p.locator(".old-plate");
  ok(await line.count() === 1 && /^Skyr, Oats & Banana is saved in My recipes\. This plate holds only the photo's foods\. Open it in My recipes › Undo$/.test((await line.innerText()).replace(/\s+/g, " ").trim()) && await line.locator(".old-plate-x").count() === 1, "E6: one line: what was saved, Open it in My recipes, Undo, X");
  ok(await p.evaluate(() => { const l = document.querySelector(".old-plate"), ml = document.querySelector(".meal-line"), w = document.querySelector(".plate-waits, .warn-box:not(.old-plate)"); const c = getComputedStyle(l); return l.previousElementSibling === ml && l.classList.contains("warn-box") && c.backgroundColor !== "rgba(0, 0, 0, 0)"; }), "E6: at the top of the new plate, under the meal line, in the warning's colour");
  ok(await p.evaluate(() => { const l = document.querySelector(".old-plate"); const after = [...document.querySelectorAll("main *")].filter((e) => /saved in My recipes/.test(e.textContent) && !l.contains(e) && !e.contains(l) && e.childElementCount === 0); return after.length === 0; }) && await p.locator(".later-card").count() === 0, "E6: nothing is added at the bottom: no row, no list");
  ok(await line.locator("button").evaluateAll((bs) => bs.every((b) => b.getBoundingClientRect().height >= 44)), "E6: its three controls are 44 high");
  await h.tab(p, "Today"); await h.tab(p, "Plate");
  ok(await p.locator(".old-plate").count() === 1, "E6: it stays until closed: still there after a trip to Today");
  // E8
  await p.locator(".old-plate-open").click(); await p.waitForTimeout(1000);
  ok(/Skyr, Oats & Banana/.test(await h.body(p)) && await p.locator(".read-view").count() === 0 && /On paper|Ingredients|Skyr/.test(await h.body(p)), "E8: Open it in My recipes: the recipe's page opens");
  await p.locator("main button").filter({ hasText: /^\s*Plate\s*$/ }).first().click(); await p.waitForTimeout(800);
  ok(await p.locator(".old-plate").count() === 1 && names(await h.st(p)) === "Chicken breast~, Rice~", "E8: Back returns to the new plate");
  // E7
  await p.locator(".old-plate-undo").click(); await p.waitForTimeout(800);
  s = await h.st(p);
  ok(names(s) === "Skyr, Oats, Banana" && !s.photo && s.meals.length === 0 && !s.oldPlate && await p.locator(".old-plate").count() === 0 && await p.locator(".read-view").count() === 0, "E7: Undo: the old plate is on the Plate again, as if I had not tapped (the recipe the tap made is gone too)");
  // X closes the line and keeps the recipe
  await h.toPhoto(p, false); await h.readIt(p); await p.getByRole("button", { name: "Start a new plate" }).click(); await p.waitForTimeout(1000);
  await p.locator(".old-plate-x").click(); await p.waitForTimeout(400);
  s = await h.st(p);
  ok(await p.locator(".old-plate").count() === 0 && s.meals.length === 1 && names(s) === "Chicken breast~, Rice~", "E6: X closes the line; the recipe stays in My recipes and the new plate stays");
  await p.context().close();
  // a name typed on the old plate is the recipe's name
  p = await h.open(); await p.locator(".step-head input").first().fill("Morning bowl"); await p.locator(".step-head input").first().blur(); await p.waitForTimeout(300);
  await h.toPhoto(p, false); await h.readIt(p); await p.getByRole("button", { name: "Start a new plate" }).click(); await p.waitForTimeout(1000);
  ok((await h.st(p)).meals[0]?.title === "Morning bowl" && /Morning bowl is saved in My recipes\./.test(await p.locator(".old-plate").innerText()), "E5: with a name typed, the old plate is saved under that name");
  await p.context().close();

  // ---- E9: a barcode
  p = await h.open({ seed: (sd) => { sd.foods.push({ id: "f-pudding", name: "Protein pudding", brand: "Ehrmann", barcode: "4006040000001", basis: "100g", source: "label", notes: "", reviewedAt: "2026-10-01T00:00:00.000Z", readyToEat: true, calories: 75, protein: 10, fats: 1.5, carbs: 5, fiber: 0, serving: { grams: 200, name: "pot" }, icon: "🍮" }); } });
  await h.toCam(p); await p.getByRole("button", { name: /^Barcode$/ }).click(); await p.waitForTimeout(500); await p.locator('input[aria-label^="Type t"]').fill("4006040000001"); await p.keyboard.press("Enter"); await p.waitForTimeout(1500);
  s = await h.st(p);
  ok(names(s) === "Skyr, Oats, Banana, Protein pudding", "E9: a barcode: the food joins the plate: " + names(s));
  ok(/Added/.test(await p.locator(".toast").innerText().catch(() => "")) && /pot|Protein pudding|200/.test(await p.locator(".toast").innerText().catch(() => "")), "E9: the message says what was added: " + (await p.locator(".toast").innerText().catch(() => "")).replace(/\s+/g, " "));
  ok(await p.locator(".plate-ask, .chef-ask").count() === 0 && /^No meal selected$/.test(await h.line(p)), "E9: no question; the meal line does not change");
  await p.context().close();

  // ---- E10, E11: a recipe by Recipe link
  const toRead = async (q) => { await q.locator(".add-more-open").click(); await q.waitForTimeout(300); await q.locator(".add-more").getByRole("button", { name: "Recipe link" }).click(); await q.waitForTimeout(500); await q.locator("main input[type=url]").fill("https://www.kitchenstories.com/en/recipes/margherita-pizza"); await q.getByRole("button", { name: "Read it" }).click(); await q.waitForTimeout(1500); };
  p = await h.open(); await toRead(p);
  await p.getByRole("button", { name: "Put it on my plate" }).click(); await p.waitForTimeout(800);
  m = await h.main(p);
  ok(/Your plate is not empty It already has Skyr, Oats & Banana, and the recipe brings its own foods/.test(m) && /The recipe is Margherita pizza: 5 foods, for 2 pizzas\./.test(m) && /Add it to your plate, or start a new plate\?/.test(m) && await p.locator(".plate-ask-photo").count() === 1 && await p.locator(".plate-ask-head .warn-title").count() === 1, "E10: Put it on my plate: the same question in the same look");
  ok(/Start a new plate: only the recipe\. Skyr, Oats & Banana is saved in My recipes, so nothing is lost\.$/.test(m.trim()) && (await h.st(p)).items.length === 3, "E10: its last line says the old plate is saved in My recipes; nothing has landed yet");
  ok(/Back to the recipe/.test(await p.locator(".ask-back").innerText()), "E10: with Back to the recipe");
  await p.locator(".ask-back").click(); await p.waitForTimeout(500);
  ok(/Margherita pizza/.test(await h.main(p)) && await p.getByRole("button", { name: "Put it on my plate" }).count() === 1 && (await h.st(p)).items.length === 3, "E10: Back returns to what was read, with nothing changed");
  await p.getByRole("button", { name: "Put it on my plate" }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Add to my plate" }).click(); await p.waitForTimeout(1200);
  s = await h.st(p);
  ok(names(s).startsWith("Skyr, Oats, Banana, ") && s.items.filter((i) => i.dish).length === 5 && s.items.filter((i) => !i.dish).length === 3, "E11: my foods stay; the recipe's five foods joined: " + names(s));
  ok(await p.locator(".dish-row, .dish-head, [class*=dish]").filter({ hasText: "Margherita pizza" }).count() >= 1 && new Set(s.items.filter((i) => i.dish).map((i) => i.dish.id)).size === 1 && s.items.find((i) => i.dish).dish.title === "Margherita pizza", "E11: the recipe joined as one dish row, Margherita pizza");
  ok(/^No meal selected$/.test(await h.line(p)) && s.meals.some((x) => x.title === "Margherita pizza"), "E11: the meal line is as it was; the recipe is in My recipes");
  await p.context().close();
  // ---- E12: Start a new plate with a recipe
  p = await h.open(); await toRead(p);
  await p.getByRole("button", { name: "Put it on my plate" }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Start a new plate" }).click(); await p.waitForTimeout(1200);
  s = await h.st(p);
  ok(s.items.length === 5 && s.items.every((i) => !/Skyr|Oats|Banana/.test(i.food.name)) && s.meals.some((x) => x.title === "Skyr, Oats & Banana") && !s.pick, "E12: only the recipe is on the plate; the old plate is saved in My recipes; no meal set");
  ok(/^Skyr, Oats & Banana is saved in My recipes\. This plate holds only the recipe\. Open it in My recipes › Undo$/.test((await p.locator(".old-plate").innerText()).replace(/\s+/g, " ").trim()), "E12: the same one line at the top, for a recipe");
  await p.locator(".old-plate-undo").click(); await p.waitForTimeout(800);
  s = await h.st(p);
  ok(names(s) === "Skyr, Oats, Banana" && !s.meals.some((x) => x.title === "Skyr, Oats & Banana") && await p.locator(".old-plate").count() === 0, "E12: Undo puts the old plate back");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
