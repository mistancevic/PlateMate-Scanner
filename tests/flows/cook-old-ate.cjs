// Story DT317 (0.3.161, board DT317; Coach Milan, Go 18 November 19:13): Start cooking with a plate from earlier on the
// Plate. Chef Mealan asks about the old plate first: Ate it, Save for later, Clear it, Cancel. Ate it now asks the meal, as
// it does on the Plate since DT314: the calendar opens under the buttons on the day the plate was started, the nearest meal
// marked, and nothing is logged yet. A tap on a meal logs the plate there, at the time it was started, and the recipe
// opens to cook. Save for later, Clear it and Cancel are as before.
// The checks name the acceptance criteria of the board (DT317 AC1, AC2).
const start = require("./plate157.cjs");
const PORT = "3576";
const F = (sd, n) => sd.foods.find((f) => f.name.startsWith(n));
const oldSeed = (sd) => { sd.items = [{ id: "o1", food: F(sd, "Skyr"), grams: 250, locked: false }, { id: "o2", food: F(sd, "Oats"), grams: 80, locked: false }]; sd.plateAt = "2026-11-14T19:10:00+01:00";
  sd.meals = [{ id: "r1", title: "Chicken and rice bowl", items: [{ id: "r1a", food: F(sd, "Rice"), grams: 200, locked: false }, { id: "r1b", food: F(sd, "Chicken"), grams: 190, locked: false }], portion: 390, savedAt: "2026-11-10T10:00:00Z", steps: ["Cook the rice.", "Grill the chicken.", "Put both in a bowl."] }]; };
(async () => { const h = await start(PORT); const { ok } = h; try {
  const toAsk = async () => { const p = await h.open({ foods: [], seed: oldSeed }); await h.tab(p, "Recipes"); await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(800);
    await p.getByRole("button", { name: "Start cooking" }).click(); await p.waitForTimeout(1200); return p; };
  const btn = (p, name) => p.locator(".chef-ask").getByRole("button", { name, exact: true });
  let p = await toAsk();
  ok((await btn(p, "Ate it").count()) === 1 && (await btn(p, "Save for later").count()) === 1 && (await btn(p, "Clear it").count()) === 1 && (await btn(p, "Cancel").count()) === 1, "Start cooking with Saturday's plate on the Plate: Chef Mealan asks, with Ate it, Save for later, Clear it, Cancel");
  ok(!(await p.locator(".old-ate-cal").count()), "no calendar before Ate it");
  // AC1
  await btn(p, "Ate it").click(); await p.waitForTimeout(600);
  const day = (await p.locator(".old-ate-cal .pcal-day.on").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
  const on = (await p.locator(".old-ate-cal .pcal-row.on").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim());
  ok(/^Sat 14/.test(day) && on.length === 1 && /Dinner/.test(on[0]), "DT317 AC1: Ate it opens the calendar on Sat 14 with Dinner marked: " + day + " / " + on.join(","));
  let s = await h.st(p);
  ok(s.feedback.filter((f) => f.status === "eaten").length === 0 && s.items.length === 2 && !s.cook, "DT317 AC1: nothing is logged, the plate is still there and nothing is cooking");
  const kids = await p.evaluate(() => [...document.querySelector(".chef-ask").children].map((e) => e.className || e.tagName));
  ok(kids.indexOf("old-ate-cal") > kids.findIndex((c) => /ca-links/.test(c)) && kids.indexOf("old-ate-cal") < kids.length - 1, "the calendar stands under the buttons, above the help line: " + kids.join(" | "));
  // AC2
  await p.locator(".old-ate-cal .pcal-row").filter({ hasText: "Dinner" }).first().click(); await p.waitForTimeout(1500);
  s = await h.st(p); const eaten = s.feedback.filter((f) => f.status === "eaten");
  const at = eaten[0] ? new Date(eaten[0].createdAt) : null, hm = at ? at.toLocaleTimeString("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" }) : "", d = at ? at.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }) : "";
  ok(eaten.length === 1 && eaten[0].slot && eaten[0].slot.date === "2026-11-14" && eaten[0].slot.slotId === "dinner" && d === "2026-11-14" && hm === "19:10", "DT317 AC2: a tap on Dinner logs the plate to Saturday's dinner at 19:10: " + JSON.stringify(eaten[0] && eaten[0].slot) + " " + d + " " + hm);
  ok(eaten[0] && eaten[0].meal.items.length === 2 && /Skyr/.test(eaten[0].meal.items[0].food.name), "the logged meal is the old plate: skyr and oats");
  ok(!!s.cook && /Chicken and rice bowl/.test(s.cook.title || "") && /Chicken and rice bowl/.test(await h.main(p)), "DT317 AC2: and the recipe opens to cook: " + (s.cook && s.cook.title));
  await p.context().close();
  // the rest as before: Cancel goes back to the recipe with nothing changed, also after the calendar was opened
  p = await toAsk(); await btn(p, "Ate it").click(); await p.waitForTimeout(400); await btn(p, "Cancel").click(); await p.waitForTimeout(800);
  s = await h.st(p);
  ok(s.items.length === 2 && !s.cook && s.feedback.filter((f) => f.status === "eaten").length === 0 && /Start cooking/.test(await h.main(p)), "Cancel: back on the recipe, the plate as it was, nothing logged");
  await p.context().close();
  p = await toAsk(); await btn(p, "Save for later").click(); await p.waitForTimeout(1200); s = await h.st(p);
  ok((s.later || []).length === 1 && !!s.cook && s.feedback.filter((f) => f.status === "eaten").length === 0, "Save for later: the plate waits under Saved for later and the cooking starts, as before");
  await p.context().close();
  p = await toAsk(); await btn(p, "Clear it").click(); await p.waitForTimeout(1200); s = await h.st(p);
  ok(!(s.later || []).length && !!s.cook && s.feedback.filter((f) => f.status === "eaten").length === 0, "Clear it: the plate is gone and the cooking starts, as before");
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
