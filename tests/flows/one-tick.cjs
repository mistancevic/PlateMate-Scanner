// Story B149 (0.3.161, board B149; Coach Milan, Go 18 November 19:13): a chosen choice shows one tick, the one its look
// draws. The tick that was written into the words is gone: on the pot question of the photo screen, on Good for of a
// recipe's page, and, found while building, on Did you eat it? of the read (the same chip, the same two ticks).
// The checks name the acceptance criteria of the board (B149 AC1, AC2) and the third place (AC3).
const start = require("./plate157.cjs");
const PORT = "3573";
const F = (sd, n) => sd.foods.find((f) => f.name.startsWith(n));
(async () => { const h = await start(PORT); const { ok } = h; try {
  const ticks = (p, sel) => p.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => ({ text: e.textContent.trim(), written: (e.textContent.match(/✓/g) || []).length, look: (getComputedStyle(e, "::before").content.match(/✓/g) || []).length })), sel);
  // AC1: the pot question on the photo screen
  let p = await h.open({ foods: [] });
  await p.unroute("**/api/plate-look"); await p.route("**/api/plate-look", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ vessel: "pot", course: "main" }) }));
  await h.toCam(p); await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(700); await p.locator(".cam-analyze").click(); await p.waitForTimeout(1800);
  let t = await ticks(p, ".pa-share .pa-opt.on");
  ok(t.length === 1 && t[0].written === 0 && t[0].look === 1, "B149 AC1: a photo of a pot: the chosen answer shows one tick: " + JSON.stringify(t));
  const other = p.locator(".pa-share .pa-opt:not(.on)").first(); const name = (await other.innerText()).trim(); await other.click(); await p.waitForTimeout(300);
  t = await ticks(p, ".pa-share .pa-opt.on");
  ok(t.length === 1 && t[0].text === name && t[0].written === 0 && t[0].look === 1, "B149: a tap chooses the other answer, as before, with one tick: " + JSON.stringify(t));
  await p.context().close();
  // AC3: Did you eat it? on the read, with dinner set
  p = await h.open({ foods: [] }); await h.toPhoto(p, false);
  await p.locator(".meal-line .plan-line-pen").click(); await p.waitForTimeout(300);
  await p.locator(".meal-line-open .pcal-row").filter({ hasText: "Dinner" }).first().click(); await p.waitForTimeout(400);
  await p.locator(".meal-line .plan-line-close").click(); await p.waitForTimeout(300);
  await h.readIt(p);
  await p.locator(".rv-eat .pa-opt").filter({ hasText: "All of it" }).click(); await p.waitForTimeout(300);
  t = await ticks(p, ".rv-eat .pa-opt.on");
  ok(t.length === 1 && t[0].text === "All of it" && t[0].written === 0 && t[0].look === 1, "B149 AC3: Did you eat it? on the read: All of it shows one tick: " + JSON.stringify(t));
  await p.context().close();
  // AC2: Good for on a recipe's page
  p = await h.open({ foods: [], seed: (sd) => { sd.meals = [{ id: "r1", title: "Chicken and rice bowl", items: [{ id: "r1a", food: F(sd, "Rice"), grams: 200, locked: false }, { id: "r1b", food: F(sd, "Chicken"), grams: 190, locked: false }], portion: 390, savedAt: "2026-11-10T10:00:00Z", steps: ["Cook the rice.", "Grill the chicken.", "Put both in a bowl."] }]; } });
  await h.tab(p, "Recipes"); await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(800);
  t = await ticks(p, ".rq-goodfor-chips .choice.on");
  ok(t.length >= 1 && t.every((x) => x.written === 0 && x.look === 1), "B149 AC2: Good for: each chosen meal shows one tick: " + JSON.stringify(t));
  const off = p.locator(".rq-goodfor-chips .choice:not(.on)").first();
  if (await off.count()) { const n0 = t.length; await off.click(); await p.waitForTimeout(400); t = await ticks(p, ".rq-goodfor-chips .choice.on"); ok(t.length === n0 + 1 && t.every((x) => x.written === 0 && x.look === 1), "B149: a tap chooses one more meal, as before, each with one tick: " + JSON.stringify(t)); }
} catch (e) { ok(false, "walkthrough error: " + (e && e.message)); } finally { await h.end(); } })();
