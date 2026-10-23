import { test } from "node:test";
import assert from "node:assert/strict";
import { withPlanned, needOf, fitOf, sumOf, fromMeal, leftOf, dayOff, proteinOff, bandOf, fitPortions, usualPortions, plannedPortion, amountText } from "./planned";
import type { Slot } from "./slots";

const slots: Slot[] = [{ id: "breakfast", name: "Breakfast", time: "07:30" }, { id: "lunch", name: "Lunch", time: "12:30" }, { id: "snack", name: "Snack", time: "16:00" }, { id: "dinner", name: "Dinner", time: "20:00" }];
const food = { id: "f", name: "Skyr", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories: 63, protein: 11, fats: 0.2, carbs: 4, fiber: 0 } as any;

test("a meal goes into a slot and comes out again; an empty date disappears", () => {
  const a = withPlanned({}, "2026-10-12", "lunch", { title: "Sarma", kcal: 410, protein: 21, source: "starter" });
  assert.equal(a["2026-10-12"].lunch.title, "Sarma");
  const b = withPlanned(a, "2026-10-12", "lunch", null);
  assert.deepEqual(b, {});
});
test("what a slot needs: the day shared out, a snack half a meal", () => {
  const n = needOf(slots, slots[1], { kcal: 2100, protein: 175 });
  assert.deepEqual(n, { kcal: 600, protein: 50 });
  assert.deepEqual(needOf(slots, slots[2], { kcal: 2100, protein: 175 }), { kcal: 300, protein: 25 });
  assert.equal(needOf(slots, slots[0], null), null);
});
test("the mark: fits within a point of the target, else how far under", () => {
  assert.equal(fitOf({ kcal: 640, protein: 52 }, 8.2).state, "fits");
  const u = fitOf({ kcal: 410, protein: 21 }, 8.2);
  assert.equal(u.state, "under"); assert.equal(u.text, "3.1 under");
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 8.2, "pct").text, "12 % under");
  assert.equal(fitOf({ kcal: 410, protein: 21 }, null).state, "none");
});
test("the day as planned adds up", () => {
  const s = sumOf({ lunch: { title: "a", kcal: 640, protein: 52, source: "starter" }, dinner: { title: "b", kcal: 360, protein: 28, source: "mine" } });
  assert.equal(s.kcal, 1000); assert.equal(s.protein, 80); assert.equal(s.n, 2); assert.equal(Math.round(s.pd! * 10) / 10, 8);
});
test("a recipe becomes a planned meal at its portion", () => {
  const m = fromMeal({ id: "m", title: "Skyr bowl", items: [{ id: "i", food, grams: 300, locked: true }], portion: 150, savedAt: "" }, "mine");
  assert.equal(m.kcal, 95); assert.equal(m.protein, 17); assert.equal(m.source, "mine"); assert.equal(m.mealId, "m");
});

test("R16: I ate it logs one portion of the planned recipe, as the plan counts it", async () => {
  const { plannedPortion, fromMeal } = await import("./planned");
  const food = (id: string, calories: number, protein: number, fats: number, carbs: number) => ({ id, name: id, brand: "", basis: "100g", source: "estimate", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats, carbs, fiber: null }) as any;
  const recipe = { id: "r1", title: "Fritters", items: [{ id: "a", food: food("dough", 302, 8, 10, 45), grams: 2000, locked: true }, { id: "b", food: food("glaze", 400, 0, 0, 100), grams: 340, locked: true }], portion: 195, savedAt: "" } as any;
  const planned = fromMeal(recipe, "mine");
  const meal = plannedPortion(planned, "r1", "2026-10-19T07:05:00Z")!;
  assert.ok(Math.abs(meal.portion - 195) < 0.5, "one portion: " + meal.portion);
  const { parseState, aggregate, KEYS } = await import("./pilot");
  assert.ok(meal.portion <= aggregate(meal.items).weight, "the portion never weighs more than its foods");
  const st = { version: 1, goals: Object.fromEntries(KEYS.map((k) => [k, null])), foods: [], items: [], meals: [], feedback: [{ id: "f1", meal, status: "eaten", taste: "", notes: "", createdAt: "2026-10-19T07:05:00Z" }], preferences: "", title: "", portion: null };
  assert.doesNotThrow(() => parseState(JSON.stringify(st)), "the logged meal is read back");
  const kcal = meal.items.reduce((n, i) => n + (i.food.calories * i.grams) / 100, 0);
  assert.ok(Math.abs(kcal - planned.kcal) <= 1, `the log counts what the plan counts: ${kcal} vs ${planned.kcal}`);
  assert.equal(plannedPortion({ title: "Skyr bowl", kcal: 420, protein: 46, source: "starter" }, "x", ""), null, "a starter has no foods to log");
});

// DT74 (board DT74, Anna's first run): the day adds up
test("DT74: a slot has what is left once the other slots are planned; with nothing planned it is the share", () => {
  const day = { kcal: 2100, protein: 175 };
  assert.deepEqual(leftOf(slots, slots[1], day, {}), needOf(slots, slots[1], day));
  const held = { breakfast: { title: "Skyr bowl", kcal: 420, protein: 46, source: "starter" as const } };
  // 2100 − 420 = 1680 shared by Lunch, Snack (half) and Dinner: 2.5 shares, lunch one
  assert.deepEqual(leftOf(slots, slots[1], day, held), { kcal: 672, protein: 52 });
  // a skipped breakfast counts nothing: the day is shared by the other three; the slot being swapped does not count itself
  assert.deepEqual(leftOf(slots, slots[1], day, { breakfast: { ...held.breakfast, skipped: true } }), { kcal: 840, protein: 70 });
  assert.deepEqual(leftOf(slots, slots[0], day, held), needOf(slots, slots[0], day));
  assert.deepEqual(leftOf(slots, slots[1], day, { breakfast: { title: "Huge", kcal: 3000, protein: 200, source: "starter" } }), { kcal: 0, protein: 0 });
});
test("DT74: fits only when it fits; within a point under is close", () => {
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 5.6).state, "close");               // Sarma, PD 5.1 against 5.6
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 5.6).text, "close");
  assert.equal(fitOf({ kcal: 420, protein: 46 }, 5.6).state, "fits");
  assert.equal(fitOf({ kcal: 640, protein: 52 }, 8.2).state, "fits");                 // 8.1: the same number on screen
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 8.2).state, "under");
  // DT75: no size mark; protein already covered (target 0): any meal fits
  assert.equal(fitOf({ kcal: 260, protein: 28 }, 6).text, "fits");
  assert.equal(fitOf({ kcal: 410, protein: 21 }, 0).state, "fits");
});
test("DT75: the day's kcal is a range, a tenth either side, rounded to 50; off says how far from its edge", () => {
  assert.deepEqual(bandOf(2100), { lo: 1900, hi: 2300 });
  assert.deepEqual(bandOf(2150), { lo: 1950, hi: 2350 });
  assert.deepEqual(dayOff({ kcal: 1350, n: 3 }, { kcal: 2100 }, 0), { by: 550, short: true, lo: 1900, hi: 2300 });
  assert.equal(dayOff({ kcal: 1350, n: 3 }, { kcal: 2100 }, 1), null);                  // a slot still open: not yet
  assert.equal(dayOff({ kcal: 2000, n: 3 }, { kcal: 2100 }, 0), null);                  // inside the range: nothing to say
  assert.equal(dayOff({ kcal: 2290, n: 3 }, { kcal: 2100 }, 0), null);
  assert.deepEqual(dayOff({ kcal: 2500, n: 3 }, { kcal: 2100 }, 0), { by: 200, short: false, lo: 1900, hi: 2300 });
});
test("DT75: protein against the person's range, once every slot is set", () => {
  const r = { min: 100, max: 140 };
  assert.deepEqual(proteinOff({ protein: 167, n: 3 }, r, 0), { by: 27, above: true });
  assert.deepEqual(proteinOff({ protein: 90, n: 3 }, r, 0), { by: 10, above: false });
  assert.equal(proteinOff({ protein: 120, n: 3 }, r, 0), null);
  assert.equal(proteinOff({ protein: 167, n: 3 }, r, 1), null);
  assert.equal(proteinOff({ protein: 167, n: 3 }, null, 0), null);
});
test("DT75: fitting the portions aims at the target in quarters, inside the range, spread over the meals; back to the usual undoes it", () => {
  const held = { a: { title: "A", kcal: 420, protein: 46, source: "starter" as const }, b: { title: "B", kcal: 480, protein: 36, source: "starter" as const }, c: { title: "C", kcal: 450, protein: 34, source: "starter" as const, skipped: true } };
  const most = fitPortions(held, { kcal: 2100 });
  assert.equal(most.c, held.c);                                                           // skipped stays
  assert.equal(most.a.amount, 2); assert.equal(most.a.kcal, 840);                        // never more than double: as close as they get
  const fair = fitPortions({ a: held.a, b: held.b }, { kcal: 1200 });                    // range 1,100 to 1,300
  // 1,125 (both 1¼) is inside but 6 % off; 1,140 (one 1½) is within a twentieth
  assert.equal(fair.a.amount, undefined); assert.equal(fair.b.amount, 1.5); assert.equal(fair.a.kcal + fair.b.kcal, 1140);
  // Anna's kind of day: 420 + 480 + 450 against 2,100: all 1½, 2,025, not 1¼ at the range's edge
  const day = fitPortions({ a: held.a, b: held.b, c: { ...held.c, skipped: false } }, { kcal: 2100 });
  assert.deepEqual([day.a.amount, day.b.amount, day.c.amount], [1.5, 1.5, 1.5]);
  assert.equal(day.a.kcal + day.b.kcal + day.c.kcal, 2025);
  // already fitted: it starts from the usual portion, not from the fitted one
  assert.deepEqual(fitPortions(day, { kcal: 2100 }), day);
  assert.equal(amountText(day.a), "1½ portions"); assert.equal(amountText(held.a), null); assert.equal(amountText({ ...held.a, amount: 1.25 }), "1¼ portions");
  assert.equal(amountText({ ...held.a, amount: 0.5 }), "½ portion"); assert.equal(amountText({ ...held.a, amount: 0.75 }), "¾ portion");
  assert.equal(amountText({ ...held.a, amount: 1.5 }), "1½ portions"); assert.equal(amountText({ ...held.a, amount: 2 }), "2 portions");
  const back = usualPortions(fair);
  assert.equal(back.b.amount, undefined); assert.equal(back.a.kcal, 420); assert.equal(back.b.kcal, 480);
});
test("DT74: a fitted meal is eaten at its amount", () => {
  const m = fromMeal({ id: "m", title: "Skyr bowl", items: [{ id: "i", food, grams: 200, locked: true }], portion: 200, savedAt: "" } as any, "mine");
  const one = plannedPortion(m, "x", "")!, more = plannedPortion({ ...m, amount: 1.5 }, "x", "")!;
  assert.equal(Math.round(more.items[0].grams), Math.round(one.items[0].grams * 1.5));
});

// DT76 (board DT76, Anna's second run): starters with their foods
import { STARTERS, refreshPlanned } from "./planned";
import { shoppingList } from "./shopping";
test("DT76: every starter is its foods in grams; its numbers come from them, close to before", () => {
  const before: Record<string, [number, number]> = { "Skyr bowl with berries": [420, 46], "Oats, skyr and banana": [520, 38], "Omelette with bread": [450, 34], "Chicken, rice and greens": [640, 52], "Tuna salad wrap": [480, 36], "Protein pancakes": [520, 44], "Sarma": [410, 21], "Cottage cheese and fruit": [260, 28] };
  assert.equal(STARTERS.length, 8);
  for (const m of STARTERS) {
    assert.ok(m.items && m.items.length >= 2, m.title + " has foods");
    const [k, p] = before[m.title];
    assert.ok(Math.abs(m.kcal - k) / k <= 0.1, `${m.title}: ${m.kcal} kcal near ${k}`);
    assert.ok(Math.abs(m.protein - p) <= 6, `${m.title}: ${m.protein} g near ${p}`);
  }
  const om = STARTERS.find((m) => m.title === "Omelette with bread")!;
  assert.deepEqual(om.items!.find((i) => /^Egg, whole/.test(i.food.name))!.count, { kind: "egg", size: "M" });   // 3 eggs, M
});
test("DT76: 1½ portions of a starter is its grams times 1½; I ate it and the shopping list have its foods", () => {
  const skyr = STARTERS[0];
  const p = plannedPortion({ ...skyr, amount: 1.5 }, "x", "")!;
  assert.equal(Math.round(p.items.find((i) => /Skyr/.test(i.food.name))!.grams), 525);
  const list = shoppingList({ "2026-10-24": { breakfast: { ...skyr, amount: 1.5 }, lunch: STARTERS[3] } }, ["2026-10-24"]);
  assert.equal(list.without.length, 0);
  assert.ok(list.lines.some((l) => /Skyr/.test(l.name) && l.grams >= 520), "skyr on the list");
  assert.ok(list.lines.some((l) => /Rice, white, raw/.test(l.name)), "the rice bought raw");
});
test("DT76: a starter planned before 0.2.76 takes its foods, at its amount", () => {
  const old = { "2026-10-24": { breakfast: { title: "Skyr bowl with berries", kcal: 630, protein: 69, source: "starter" as const, amount: 1.5 } } };
  const next = refreshPlanned(old, []);
  const m = next["2026-10-24"].breakfast;
  assert.equal(m.items!.length, STARTERS[0].items!.length);
  assert.equal(m.kcal, Math.round(STARTERS[0].kcal * 1.5)); assert.equal(m.amount, 1.5);
  assert.equal(refreshPlanned(next, []), next);                                          // once
});
test("DT76: a fitted starter keeps eggs and bananas whole, and counts at those grams; back to the usual is exact", () => {
  const om = STARTERS.find((m) => m.title === "Omelette with bread")!;
  const p = plannedPortion({ ...om, amount: 1.25 }, "x", "")!;
  assert.equal(p.items.find((i) => /^Egg, whole/.test(i.food.name))!.grams, 4 * 52);     // 3¾ eggs is 4
  assert.equal(Math.round(p.items.find((i) => /^Egg white/.test(i.food.name))!.grams), 125);
  const fitted = fitPortions({ d: om }, { kcal: 585 });
  assert.equal(fitted.d.amount, 1.25);
  const egg = 52 * 1.43 / 1;                                                                // one more M egg: 74 kcal
  assert.ok(fitted.d.kcal > Math.round(om.kcal * 1.25) && fitted.d.kcal - Math.round(om.kcal * 1.25) < egg, `counted at whole eggs: ${fitted.d.kcal}`);
  assert.equal(usualPortions(fitted).d.kcal, om.kcal);
  // a share of a batch recipe stays a share
  const batch = { ...om, servings: 4, amount: 1.25 };
  assert.ok(plannedPortion(batch, "x", "")!.items.find((i) => /^Egg, whole/.test(i.food.name))!.grams % 52 !== 0);
});
import { piecesFor, withPieces, isFitted } from "./planned";
test("DT79: a batch recipe is planned in whole pieces, as many as the slot has left", () => {
  const one = { title: "Sarma", kcal: 180, protein: 10, source: "mine" as const, mealId: "sa", servings: 8, unit: "sarmas" };
  assert.equal(piecesFor(one, { kcal: 700 }), 4);                     // 700 ÷ 180 = 3.9
  assert.equal(piecesFor(one, { kcal: 560 }), 3);                     // a rest day's lunch
  assert.equal(piecesFor(one, { kcal: 5000 }), 8);                    // never more than the batch
  assert.equal(piecesFor(one, { kcal: 20 }), 1);                      // at least one
  const four = withPieces(one, 4, false);
  assert.equal(four.kcal, 720); assert.equal(four.amount, 4); assert.equal(four.usual, 4);
  assert.equal(amountText(four), "4 sarmas"); assert.equal(amountText(withPieces(one, 1)), "1 sarma");
  assert.equal(isFitted({ l: four }), false);
  // Fit the portions moves whole pieces; back to the usual returns to the count picked
  const fit = fitPortions({ l: four, b: { title: "Skyr bowl", kcal: 420, protein: 46, source: "mine" as const } }, { kcal: 2000 });
  assert.ok(Number.isInteger(fit.l.amount) && fit.l.amount! > 4, `more sarmas: ${fit.l.amount}`); assert.equal(fit.l.usual, 4);
  assert.equal(isFitted(fit), true);
  const back = usualPortions(fit);
  assert.equal(back.l.amount, 4); assert.equal(back.l.kcal, 720);
  // a share of the batch for the numbers
  assert.equal(plannedPortion({ ...four, items: [{ id: "c", food, grams: 800, locked: true }] }, "x", "")!.items[0].grams, 400);
});
import { refreshPlanned as refresh80 } from "./planned";
test("DT80: a recipe that now says it makes 8 sarmas: its planned meal takes the sarmas that keep its kcal", () => {
  const items = [{ id: "a", food, grams: 1600, locked: true }];
  const before = { id: "sa", title: "Sarma", items, portion: 400, savedAt: "" } as any;                       // the Plate divided it: 4 portions
  const m = fromMeal(before, "mine");
  assert.equal(m.servings, 4); assert.equal(m.unit, undefined);
  const plan = { "2026-10-24": { lunch: { ...m } } };
  const after = { ...before, makes: { n: 8, unit: "sarmas" }, portion: 200 };
  const next = refresh80(plan, [after]);
  const l = next["2026-10-24"].lunch;
  assert.equal(l.unit, "sarmas"); assert.equal(l.servings, 8); assert.equal(l.amount, 2); assert.equal(l.usual, 2);   // one portion was two sarmas
  assert.equal(Math.abs(l.kcal - m.kcal) <= 1, true);
  assert.equal(refresh80(next, [after]), next);                                                                    // once
});
import { sizedFor } from "./pilot";
test("DT81: Cook it sizes the recipe; a counted batch sets what one piece is", () => {
  const items = [{ id: "a", food, grams: 800, locked: true }];
  const sarma = { id: "sa", title: "Sarma", items, portion: 100, savedAt: "", makes: { n: 8, unit: "sarmas" } } as any;
  assert.equal(sizedFor(sarma, 10)[0].grams, 1000);                    // 10 of 8: every food times 10/8
  assert.equal(sizedFor(sarma, 8), sarma.items);                        // as written
  const one = fromMeal(sarma, "mine");
  assert.equal(one.servings, 8); assert.equal(one.kcal, Math.round(800 * food.calories / 100 / 8));
  // cooked for 10, it made 11: one sarma is an 11th of the 10-batch
  const after = fromMeal({ ...sarma, batch: { cooked: 10, made: 11, at: "" } }, "mine");
  assert.equal(after.servings, 11); assert.equal(after.kcal, Math.round(1000 * food.calories / 100 / 11));
  assert.equal(after.items![0].grams, 1000);
});
