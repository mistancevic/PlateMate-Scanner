// Story B150 (0.3.160, board B150; Coach Milan, Go 19 November 01:00): setting the meal and its time on a photo. The meal
// line has a small title, Meal and day; under it No meal selected, or the meal with its day and time; the pencil is always
// there. A tap opens edit mode, the calendar, and the pencil is the X that closes it and does nothing else. Edit mode opens
// on the photo's day, with the photo's time as a reference, taken or saved. A tap on a meal sets it, saved at once, and edit
// mode stays open. The time in that meal's row is a field: the meal's time for this meal on this day. The row No meal
// selected takes the meal off. A meal is logged on the day of the meal that is set, at that meal's time. A record that
// holds two days is repaired when the app opens. The words Just looking are gone; a plate with no name says Untitled plate.
// The checks name the acceptance criteria of the board (B150 AC1 to AC17).
const start = require("./plate157.cjs");
const fs = require("node:fs"), path = require("node:path");
const PORT = "3571";
const F = (sd, n) => sd.foods.find((f) => f.name.startsWith(n));
const day = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
const hm = (iso) => new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
(async () => { const h = await start(PORT); const { ok } = h; try {
  const sd0 = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8"));
  const bowl = { title: "Chicken rice bowl", kcal: 574, protein: 64, source: "plate", items: [{ id: "a", food: F(sd0, "Rice"), grams: 200, locked: false }, { id: "b", food: F(sd0, "Chicken"), grams: 190, locked: false }], portion: 390 };
  const planned = { "2026-11-14": { dinner: bowl }, "2026-11-15": { dinner: bowl } };
  const open = ".meal-line-open", pen = ".meal-line .plan-line-pen";
  const eaten = async (p) => (await h.st(p)).feedback.filter((f) => f.status === "eaten");
  // the line without its small title (drawn in capitals); the title itself is checked once
  const ln = h.line;
  const titled = async (p) => (await p.locator(".meal-line .meal-line-title").textContent()).trim() === "Meal and day";
  const edit = async (p) => { await p.locator(pen).click(); await p.waitForTimeout(500); };
  // ---- AC14: a plate with no name
  let p = await h.open({ foods: [], planned }); await h.toPhoto(p, true);
  const title = p.locator(".step-head input.title-input");
  ok(await title.getAttribute("placeholder") === "Untitled plate" && await title.inputValue() === "" && await p.locator(".step-head .title-pen").count() === 1 && await p.locator(".step-head p").count() === 0, "B150 AC14: the photo's plate has no name: Untitled plate, with the pencil, and no line under it");
  await p.locator(".step-head .title-pen").click(); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.activeElement === document.querySelector(".step-head input.title-input")), "B150 AC14: a tap on the pencil puts the cursor in the name");
  // ---- AC1: no meal selected, said on the line
  ok(await ln(p) === "No meal selected" && await titled(p) && await p.locator(pen).count() === 1, "B150 AC1: before the read the line says Meal and day, No meal selected, with the pencil");
  await h.readIt(p);
  ok(await ln(p) === "No meal selected" && await titled(p) && await p.locator(pen).count() === 1 && await p.locator(".plan-line-x").count() === 0 && !/Not counted/.test(await h.main(p)), "B150 AC1: after the read the line is the same: the title, No meal selected, the pencil, and no Not counted");
  ok(/What do you do with it\?/.test(await h.main(p)) && await p.locator(".plate-end .pe-ate").count() === 1, "B150 AC1: the read ends with What do you do with it?");
  // ---- AC17: the line under the title says who named it
  ok((await p.locator(".step-head p").innerText()).trim() === "Chef Mealan named it from your photo." && !/Read from your photo/.test(await h.main(p)), "B150 AC17: under the title: Chef Mealan named it from your photo.");
  // ---- AC2: the pencil opens edit mode, the X closes it
  await edit(p);
  ok(await p.locator(open + " .pcal").count() === 1 && (await p.locator(open + " .pcal-day.on").innerText()).trim() === "Sat 14", "B150 AC2: a tap on the pencil opens edit mode on Sat 14, the photo's day");
  ok(/^✓\s*No meal selected$/.test((await p.locator(open + " .pcal-row.on").innerText()).replace(/\s+/g, " ").trim()) && await p.locator(open + " .pcal-row.on").count() === 1, "B150 AC2: the row No meal selected is marked, and no other");
  ok(await p.locator(".meal-line .plan-line-close").count() === 1 && await p.locator(".meal-line .plan-line-close svg.lucide-x").count() === 1, "B150 AC2: the pencil turned into an X");
  // ---- AC3: the photo's time is a reference; this photo carries only the time it was saved
  const ref = p.locator(open + " .pcal-ref");
  ok((await ref.innerText()).trim() === "The photo was saved on Saturday, 15:57. When it was taken is not known.", "B150 AC3: a photo with no time of its own: The photo was saved on Saturday, 15:57. When it was taken is not known.");
  await ref.click(); await p.waitForTimeout(300);
  ok(await p.locator(open + " .pcal").count() === 1 && await ln(p) === "No meal selected", "B150 AC3: a tap on the line does nothing");
  await p.locator(".meal-line .plan-line-close").click(); await p.waitForTimeout(400);
  ok(await p.locator(open).count() === 0 && await ln(p) === "No meal selected" && (await h.st(p)).photo && !(await h.st(p)).photo.meal, "B150 AC2: a tap on the X closes edit mode and changes nothing");
  // ---- AC4: a meal is set and saved at once
  await edit(p); await h.row(p, "Dinner", open).click(); await p.waitForTimeout(700);
  ok(await ln(p) === "Dinner Saturday, 14 November, 20:00" && await p.locator(open + " .pcal").count() === 1, "B150 AC4: a tap on Dinner: the line says Dinner, Saturday, 14 November, 20:00 at once, and edit mode stays open");
  ok(/^✓\s*Dinner/.test((await p.locator(open + " .pcal-row.on").innerText()).trim()) && await p.locator(open + " .pcal-row.on").count() === 1 && await p.locator(open).getByRole("button", { name: /^Done$/ }).count() === 0, "B150 AC4: Dinner is marked, and there is no Done");
  // ---- AC5: the meal's time in the calendar
  const time = p.locator(open + " .pcal-row.on .pcal-time");
  ok(await time.count() === 1 && await time.inputValue() === "20:00", "B150 AC5: the time in Dinner's row is a field, at 20:00");
  await time.fill("19:30"); await p.waitForTimeout(600);
  ok(await ln(p) === "Dinner Saturday, 14 November, 19:30", "B150 AC5: set to 19:30: the line says Dinner, Saturday, 14 November, 19:30");
  // ---- AC6: only this meal, only this day
  await p.locator(open + " .pcal-day").filter({ hasText: "Mon 16" }).click(); await p.waitForTimeout(400);
  ok((await h.rows(p, open)).some((r) => /^Dinner 20:00/.test(r)), "B150 AC6: on another day Dinner is at 20:00");
  const pers = await p.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")));
  ok(pers.timesOn && Object.keys(pers.timesOn).join() === "2026-11-14" && pers.timesOn["2026-11-14"].dinner === "19:30" && !(pers.lifestyle.slotTimes && pers.lifestyle.slotTimes.dinner), "B150 AC6: the time is kept for Saturday 14 November only; Slots and times is as it was");
  await p.locator(open + " .pcal-day").filter({ hasText: "Sat 14" }).click(); await p.waitForTimeout(400);
  // ---- AC7: closed, the line keeps the meal and the pencil
  await p.locator(".meal-line .plan-line-close").click(); await p.waitForTimeout(500);
  ok(await p.locator(open).count() === 0 && await ln(p) === "Dinner Saturday, 14 November, 19:30" && await p.locator(pen).count() === 1 && await p.locator(".plan-line-x").count() === 0, "B150 AC7: closed with the X: the line shows Dinner, Saturday, 14 November, 19:30 with the pencil");
  ok(/Did you eat it\?/.test(await h.main(p)) && await p.locator(".rv-done").count() === 1, "B150 AC7: the rest of the page is as it is today: Did you eat it?, and Done");
  await edit(p);
  ok(await p.locator(open + " .pcal").count() === 1 && (await p.locator(open + " .pcal-day.on").innerText()).trim() === "Sat 14" && /^✓\s*Dinner/.test((await p.locator(open + " .pcal-row.on").innerText()).trim()), "B150 AC7: a tap on the pencil opens edit mode again, on the meal's day, with Dinner marked");
  // ---- AC9: back to no meal selected
  await p.locator(open + " .pcal-row.pcal-looking").click(); await p.waitForTimeout(500);
  ok(await ln(p) === "No meal selected" && /^✓\s*No meal selected$/.test((await p.locator(open + " .pcal-row.on").innerText()).replace(/\s+/g, " ").trim()) && /What do you do with it\?/.test(await h.main(p)), "B150 AC9: a tap on the row No meal selected: the line says No meal selected again");
  // ---- AC8: one dinner on the photo's day
  await h.row(p, "Dinner", open).click(); await p.waitForTimeout(600);
  ok(await ln(p) === "Dinner Saturday, 14 November, 19:30", "the time set for Saturday's dinner is still 19:30 when Dinner is set again");
  await p.locator(".meal-line .plan-line-close").click(); await p.waitForTimeout(400);
  await p.locator(".rv-eat .pa-opt").first().click(); await p.waitForTimeout(300); await p.locator(".rv-done").click(); await p.waitForTimeout(1500);
  let e = await eaten(p);
  ok(e.length === 1 && e[0].slot.date === "2026-11-14" && e[0].slot.slotId === "dinner" && day(e[0].createdAt) === "2026-11-14" && hm(e[0].createdAt) === "19:30", "B150 AC8: logged as eaten: one record, Saturday's dinner, on Saturday at 19:30");
  await p.locator("main button").filter({ hasText: /^Sat 14/ }).first().click(); await p.waitForTimeout(700);
  let sat = await h.main(p);
  ok(/Grilled chicken with rice Dinner, 19:30/.test(sat) && !/I skipped it/.test(sat), "B150 AC8: Saturday in the Plan shows my meal as Dinner, 19:30, and the planned Chicken rice bowl no longer asks");
  await p.locator("main button").filter({ hasText: /^Today 15/ }).first().click(); await p.waitForTimeout(700);
  ok(!/Grilled chicken with rice (Breakfast|Lunch|Dinner)/.test(await h.main(p)) && /Dinner, 20:00 Chicken rice bowl/.test(await h.main(p)) && (await eaten(p)).every((f) => f.slot.date !== "2026-11-15"), "B150 AC8: today shows nothing of it: its planned dinner is as it was");
  // ---- AC10: a meal of today, when I mean today
  p = await h.open({ foods: [], planned }); await h.toPhoto(p, true); await h.readIt(p); await edit(p);
  await p.locator(open + " .pcal-day").filter({ hasText: "Sun 15" }).click(); await p.waitForTimeout(400); await h.row(p, "Dinner", open).click(); await p.waitForTimeout(600);
  ok(/^Dinner Sunday, 15 November/.test(await ln(p)), "B150 AC10: Sun 15, today, then Dinner: the line says Dinner, Sunday, 15 November");
  await p.locator(".meal-line .plan-line-close").click(); await p.waitForTimeout(400);
  await p.locator(".rv-eat .pa-opt").first().click(); await p.waitForTimeout(300); await p.locator(".rv-done").click(); await p.waitForTimeout(1500);
  e = await eaten(p);
  ok(e.length === 1 && e[0].slot.date === "2026-11-15" && e[0].slot.slotId === "dinner" && day(e[0].createdAt) === "2026-11-15", "B150 AC10: logged as eaten: today's dinner, on today, and Saturday holds nothing of it");
  // ---- AC11: one day per record, also by Ate it and its calendar
  p = await h.open({ foods: [], planned }); await h.toPhoto(p, true); await h.readIt(p);
  await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(500); await p.locator(".plate-end .pcal-day").filter({ hasText: "Sun 15" }).click(); await p.waitForTimeout(400); await h.row(p, "Lunch", ".plate-end").click(); await p.waitForTimeout(900);
  ok(/^Lunch Sunday, 15 November/.test(await ln(p)), "Ate it, then today, then Lunch: the line says Lunch, Sunday, 15 November");
  await p.locator(".rv-eat .pa-opt").first().click(); await p.waitForTimeout(300); await p.locator(".rv-done").click(); await p.waitForTimeout(1500);
  e = await eaten(p);
  ok(e.length === 1 && e[0].slot.date === day(e[0].createdAt) && e[0].slot.date === "2026-11-15" && hm(e[0].createdAt) === "13:45", "B150 AC11: a photo from Saturday logged by Ate it as today's lunch: the record is on today, at lunch's time, and on no other day");
  // ---- AC12: the record that holds two days is repaired when the app opens
  // the record as 0.3.159 made it: a real record of Saturday's dinner, given Sunday's dinner as its meal, then the app opens
  p = await h.open({ foods: [], planned }); await h.toPhoto(p, true); await h.readIt(p); await edit(p);
  await h.row(p, "Dinner", open).click(); await p.waitForTimeout(600); await p.locator(".meal-line .plan-line-close").click(); await p.waitForTimeout(400);
  await p.locator(".rv-eat .pa-opt").first().click(); await p.waitForTimeout(300); await p.locator(".rv-done").click(); await p.waitForTimeout(1500);
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); for (const f of s.feedback) if (f.status === "eaten") f.slot.date = "2026-11-15"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  e = await eaten(p);
  ok(e.length === 1 && e[0].slot.date === "2026-11-15" && day(e[0].createdAt) === "2026-11-14", "a record as it was made before: Saturday's time, and Sunday's dinner as its meal");
  await p.goto(h.U + "/plan"); await p.waitForTimeout(1800);
  await p.locator("main button").filter({ hasText: /^Sat 14/ }).first().click(); await p.waitForTimeout(700);
  sat = await h.main(p);
  ok(/Grilled chicken with rice Dinner, 20:00/.test(sat) && !/I skipped it/.test(sat), "B150 AC12: after the app opens it is Saturday's dinner, and Saturday's planned dinner no longer asks");
  await p.locator("main button").filter({ hasText: /^Today 15/ }).first().click(); await p.waitForTimeout(700);
  ok(!/Grilled chicken with rice (Breakfast|Lunch|Dinner)/.test(await h.main(p)) && /Dinner, 20:00 Chicken rice bowl/.test(await h.main(p)), "B150 AC12: today's dinner is open again, with its planned Chicken rice bowl");
  // ---- AC13: a plate without a photo
  p = await h.open({ foods: ["Skyr", "Oats"] }); await edit(p);
  ok(await p.locator(open + " .pcal").count() === 1 && (await p.locator(open + " .pcal-day.on").innerText()).trim() === "Sun 15, today" && await p.locator(open + " .pcal-ref").count() === 0, "B150 AC13: a plate with no photo: edit mode opens on today, with no line about a photo");
  await h.row(p, "Dinner", open).click(); await p.waitForTimeout(600);
  ok(/^Dinner Sunday, 15 November, 20:00/.test(await ln(p)) && await p.locator(open + " .pcal-row.on .pcal-time").count() === 1, "B150 AC13: everything else is the same: Dinner is set at once, with its time as a field");
  // ---- AC3: a photo that carries its own time
  p = await h.open({ foods: [], seed: (sd) => { sd.items = [{ id: "p1", food: F(sd, "Chicken"), grams: 180, locked: false, fromPhoto: true, est: { low: 140, high: 240 } }]; sd.title = "Grilled chicken"; sd.photo = { image: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", at: "2026-11-14T15:57:00+01:00", who: "ate", view: "read", namedAs: "Grilled chicken" }; } });
  await edit(p);
  ok((await p.locator(open + " .pcal-ref").innerText()).trim() === "The photo was taken on Saturday, 15:57.", "B150 AC3: a photo that carries its own time: The photo was taken on Saturday, 15:57.");
  await p.locator(".meal-line .plan-line-close").click(); await p.waitForTimeout(300);
  // ---- AC17: the line goes when I rename the plate
  ok((await p.locator(".step-head p").innerText()).trim() === "Chef Mealan named it from your photo.", "the plate still has the name Chef Mealan gave it, and the line says so");
  await p.locator(".step-head input.title-input").fill("My Saturday chicken"); await p.locator(".step-head input.title-input").blur(); await p.waitForTimeout(400);
  ok(await p.locator(".step-head p").count() === 0, "B150 AC17: I change the name myself: the line under the title is gone");
  // ---- AC15: Just looking is gone
  await edit(p);
  const openText = (await p.locator(open).innerText()).replace(/\s+/g, " ");
  ok(!/Just looking/.test(await h.body(p)) && /No meal selected: nothing is logged until you select a meal\./.test(openText), "B150 AC15: edit mode says No meal selected where it said Just looking, in the row and in the help under it");
  const en = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/i18n/en.json"), "utf8"));
  ok(!Object.values(en).some((v) => /Just looking/.test(typeof v === "string" ? v : Object.values(v).join(" "))), "B150 AC15: no English line of the app says Just looking");
  // ---- AC16: three languages
  const sr = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/i18n/sr-Latn.json"), "utf8")).screens, de = JSON.parse(fs.readFileSync(path.join(__dirname, "../../src/i18n/de.json"), "utf8")).screens;
  const keys = ["photoask.namesIt", "plate.mealAndDay", "plate.mealNotSet", "plate.namedFromPhoto", "plate.photoTakenOn", "plate.photoSavedOn"];
  ok(keys.every((k) => sr[k] && sr[k].text && sr[k].text !== en[k]) && sr["plate.mealNotSet"].text === "Obrok nije izabran" && sr["photoask.namesIt"].text === "Tanjir bez naziva", "B150 AC16: Untitled plate, Meal and day, No meal selected, the line under the title and the two lines about the photo's time are in Serbian");
  ok(keys.every((k) => de[k] && de[k].text && de[k].text !== en[k]) && de["plate.mealNotSet"].text === "Keine Mahlzeit gewählt" && de["photoask.namesIt"].text === "Teller ohne Titel", "B150 AC16: and in German");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
