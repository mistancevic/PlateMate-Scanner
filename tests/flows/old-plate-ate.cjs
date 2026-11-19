// Story DT314 (0.3.159, board Stories251; Coach Milan, Go 18 November 15:56): a plate from an earlier meal asks Did you eat
// it? Ate it no longer logs at once to a meal the app picks. It opens the calendar under the buttons, on the day the plate
// was started, with the nearest meal marked as the guess and the reason above it. A tap on a row logs the plate there, at
// the time it was started; another meal or another day is one tap more. A meal that already holds something asks first,
// Replace it or Add as another dish. A plate with a photo opens on the photo's day and time.
// The checks name the acceptance criteria of the board (DT314 AC1 to AC6).
const start = require("./plate157.cjs");
const PORT = "3569";
const F = (sd, n) => sd.foods.find((f) => f.name.startsWith(n));
const oldItems = (sd) => [{ id: "o1", food: F(sd, "Skyr"), grams: 250, locked: false }, { id: "o2", food: F(sd, "Oats"), grams: 80, locked: false }];
const oldSeed = (sd) => { sd.items = oldItems(sd); sd.plateAt = "2026-11-14T19:10:00+01:00"; };
const hm = (iso) => new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
const day = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
(async () => { const h = await start(PORT); const { ok } = h; try {
  const cal = ".old-ate-cal", ate = async (p) => { await p.locator(".old-ate").click(); await p.waitForTimeout(500); };
  const eaten = async (p) => (await h.st(p)).feedback.filter((f) => f.status === "eaten");
  // ---- AC1: Ate it opens the calendar, nothing is logged yet
  let p = await h.open({ foods: [], seed: oldSeed });
  ok(/Your plate from yesterday, 19:10\. Skyr and oats\. Did you eat it\?/.test(await h.main(p)) && await p.locator(cal).count() === 0, "the plate from Saturday asks Did you eat it?, with no calendar yet");
  await ate(p);
  ok(await p.locator(cal + " .pcal").count() === 1 && (await p.locator(cal + " .pcal-day.on").innerText()).trim() === "Sat 14" && /^✓?\s*Dinner/.test((await p.locator(cal + " .pcal-row.on").innerText()).trim()) && await p.locator(cal + " .pcal-row.on").count() === 1, "DT314 AC1: Ate it opens the calendar on Sat 14 with Dinner marked");
  ok((await p.locator(cal + " .pcal-q").innerText()).trim() === "Which meal? The plate was started on Saturday, 19:10:" && (await eaten(p)).length === 0 && (await h.st(p)).items.length === 2, "DT314 AC1: the line above says the plate was started on Saturday, 19:10, and nothing is logged");
  // Changed by story DT325 (0.3.162, board DT325; Coach Milan, Go 19 November 09:48): the help line names no time
  ok(/Ate it asks which meal, and saves it there\. Save for later/.test(await h.main(p)), "DT314 AC1: the help under the buttons says Ate it asks which meal");
  await ate(p);
  ok(await p.locator(cal).count() === 0, "a second tap on Ate it closes the calendar");
  await ate(p);
  // ---- AC2: a tap on a row logs it there
  await h.row(p, "Dinner", cal).click(); await p.waitForTimeout(1200);
  let e = await eaten(p);
  ok(e.length === 1 && e[0].slot && e[0].slot.date === "2026-11-14" && e[0].slot.slotId === "dinner" && day(e[0].at ?? e[0].createdAt) === "2026-11-14" && hm(e[0].at ?? e[0].createdAt) === "19:10", "DT314 AC2: a tap on Dinner: logged to Saturday's dinner at 19:10: " + JSON.stringify(e[0] && { slot: e[0].slot, at: e[0].at, createdAt: e[0].createdAt }));
  ok((await h.st(p)).items.length === 0 && /Skyr & Oats is in Saturday's dinner, eaten/.test(await h.body(p)), "DT314 AC2: the Plate is free, and one line says Skyr & Oats is in Saturday's dinner, eaten");
  // ---- AC5: a meal that already holds something asks first
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const f = (n) => s.foods.find((x) => x.name.startsWith(n)); s.items = [{ id: "n1", food: f("Banana"), grams: 118, locked: false }, { id: "n2", food: f("Oats"), grams: 60, locked: false }]; s.plateAt = "2026-11-14T20:30:00+01:00"; s.plateAsked = undefined; s.title = ""; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await p.goto(h.U + "/plate"); await p.waitForTimeout(1500);
  await ate(p);
  await h.row(p, "Dinner", cal).click(); await p.waitForTimeout(600);
  ok(await p.locator(cal + " .pcal-held").count() === 1 && /Replace it/.test(await p.locator(cal + " .pcal-held").innerText()) && /Add as another dish/.test(await p.locator(cal + " .pcal-held").innerText()) && (await eaten(p)).length === 1, "DT314 AC5: Saturday's dinner already holds a meal: I am asked Replace it or Add as another dish, and nothing is logged yet");
  await p.locator(cal + " .pcal-held").getByRole("button", { name: "Add as another dish" }).click(); await p.waitForTimeout(1200);
  e = await eaten(p);
  ok(e.length === 2 && e.every((f) => f.slot && f.slot.date === "2026-11-14" && f.slot.slotId === "dinner"), "DT314 AC5: Add as another dish: Saturday's dinner holds both");
  await p.context().close();
  // ---- AC3: another meal
  p = await h.open({ foods: [], seed: oldSeed });
  await ate(p); await h.row(p, "Snack", cal).click(); await p.waitForTimeout(1200);
  e = await eaten(p);
  ok(e.length === 1 && (!e[0].slot || e[0].slot.slotId !== "dinner") && day(e[0].at ?? e[0].createdAt) === "2026-11-14" && hm(e[0].at ?? e[0].createdAt) === "19:10", "DT314 AC3: a tap on Snack: logged to Saturday as a snack at 19:10: " + JSON.stringify(e[0] && { slot: e[0].slot, at: e[0].at }));
  await p.context().close();
  // ---- AC4: another day
  p = await h.open({ foods: [], seed: oldSeed });
  await ate(p);
  await p.locator(cal + " .pcal-day").filter({ hasText: "Sun 15" }).click(); await p.waitForTimeout(400);
  ok((await p.locator(cal + " .pcal-day.on").innerText()).trim() === "Sun 15, today" && await p.locator(cal + " .pcal-row.on").count() === 0, "DT314 AC4: a tap on Sun 15, today: today's meals, with no guess marked on a day the plate was not started");
  await h.row(p, "Snack", cal).click(); await p.waitForTimeout(1200);
  e = await eaten(p);
  ok(e.length === 1 && day(e[0].at ?? e[0].createdAt) === "2026-11-15" && (await h.st(p)).items.length === 0, "DT314 AC4: then Snack: logged to today as a snack: " + JSON.stringify(e[0] && { slot: e[0].slot, at: e[0].at }));
  await p.context().close();
  // ---- AC6: a plate with a photo opens on the photo's day and time
  const img = "data:image/jpeg;base64," + require("node:fs").readFileSync(require("node:path").join(__dirname, "plate.jpg")).toString("base64");
  p = await h.open({ foods: [], seed: (sd) => { sd.items = oldItems(sd); sd.photo = { image: img, at: "2026-11-14T15:57:00+01:00", who: "now" }; } });
  if (await p.locator(".old-ate").count() === 0) console.log("AC6 page: " + (await h.main(p)).slice(0, 300));
  await ate(p);
  ok((await p.locator(cal + " .pcal-day.on").innerText()).trim() === "Sat 14" && /^✓?\s*Lunch/.test((await p.locator(cal + " .pcal-row.on").innerText()).trim()) && (await p.locator(cal + " .pcal-q").innerText()).trim() === "Which meal? From the photo, Saturday 15:57:", "DT314 AC6: a plate from a photo of Saturday 15:57: the calendar opens on Saturday with the nearest meal marked: " + (await p.locator(cal + " .pcal-q").innerText()).trim());
  await h.row(p, "Lunch", cal).click(); await p.waitForTimeout(1200);
  e = await eaten(p);
  ok(e.length === 1 && e[0].slot && e[0].slot.slotId === "lunch" && hm(e[0].at ?? e[0].createdAt) === "15:57" && (await h.st(p)).items.length === 0, "DT314 AC6: a tap on Lunch: logged to Saturday's lunch at the photo's time");
  await p.context().close();
  // ---- must not change: Save for later, Keep working on it
  p = await h.open({ foods: [], seed: oldSeed });
  await p.getByRole("button", { name: "Keep working on it" }).click(); await p.waitForTimeout(700);
  ok(await p.locator(".old-ate").count() === 0 && (await h.st(p)).items.length === 2 && await p.locator(".plate-end").count() === 1, "must not change: Keep working on it opens the plate as it is");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
