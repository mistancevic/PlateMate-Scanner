import test from "node:test";
import assert from "node:assert/strict";
import { shoppingList, shoppingText, shopGrams } from "./shopping";

const food = (name: string, brand = "") => ({ id: name, name, brand, basis: "100g", calories: 100, protein: 10, fats: 1, carbs: 10, fiber: 0, source: "label", notes: "", reviewedAt: "", readyToEat: true }) as any;
const it = (f: any, grams: number) => ({ id: f.name + grams, food: f, grams, locked: true });
const chicken = food("Chicken breast, raw"), rice = food("Rice, cooked"), skyr = food("Skyr, natural", "Arla");
// a recipe for four: 800 g chicken, 1,200 g rice; one portion is a quarter
const curry = { title: "Chicken curry", kcal: 600, protein: 50, source: "mine" as const, mealId: "c", items: [it(chicken, 800), it(rice, 1200)], portion: 500, servings: 4 };
const bowl = { title: "Skyr bowl", kcal: 300, protein: 30, source: "mine" as const, mealId: "s", items: [it(skyr, 250)], portion: 250 };
const starter = { title: "Chicken, rice and greens", kcal: 640, protein: 52, source: "starter" as const };

test("seven days of the plan, one portion per meal, every food added up by name", () => {
  const plan = { "2026-10-20": { lunch: curry, breakfast: bowl }, "2026-10-21": { lunch: curry, dinner: starter, snack: { ...bowl, skipped: true } }, "2026-10-30": { lunch: curry } };
  const l = shoppingList(plan, ["2026-10-20", "2026-10-21", "2026-10-22"]);
  assert.equal(l.meals, 4, "the skipped snack is left out; 30 October is outside the days");
  assert.deepEqual(l.lines.map((x) => [x.name, x.grams, x.meals]), [["Chicken breast, raw", 400, 2], ["Rice, cooked", 600, 2], ["Skyr, natural", 250, 1]]);
  assert.deepEqual(l.without, [{ date: "2026-10-21", title: "Chicken, rice and greens" }]);
});

test("grams read as a shop reads them, and the text leaves out what is ticked", () => {
  assert.equal(shopGrams(7.4), 7); assert.equal(shopGrams(0.2), 1); assert.equal(shopGrams(123), 120); assert.equal(shopGrams(605), 610);
  const l = shoppingList({ "2026-10-20": { lunch: curry, breakfast: bowl } }, ["2026-10-20"]);
  assert.equal(shoppingText(l, "20 to 26 October", new Set(["rice, cooked|"])), "Shopping list, 20 to 26 October\n\nChicken breast, raw: 200 g\nSkyr, natural (Arla): 250 g");
});

test("SL3: lists are saved and numbered, the next starts after the last, finishing can carry what wasn't ticked", async () => {
  const { makeList, nextStart, daysFrom, tickIn, finishList, openList, listText } = await import("./shopping");
  const plan = { "2026-10-20": { lunch: curry }, "2026-10-21": { lunch: curry, breakfast: bowl }, "2026-10-23": { lunch: curry } };
  let s = { lists: [], carry: null } as any;
  assert.equal(nextStart(s, "2026-10-20"), "2026-10-20", "the first list starts today");
  s = makeList(s, plan, daysFrom("2026-10-20", 3), "2026-10-20T15:00:00Z");
  const one = openList(s)!;
  assert.equal(one.n, 1); assert.equal(one.from, "2026-10-20"); assert.equal(one.to, "2026-10-22"); assert.equal(one.meals, 3);
  assert.equal(nextStart(s, "2026-10-20"), "2026-10-23", "the next list starts the day after");
  // the plan changes: the saved list does not
  (plan as any)["2026-10-21"].dinner = curry;
  assert.equal(openList(s)!.meals, 3);
  s = tickIn(s, 1, "chicken breast, raw|");
  s = finishList(s, 1, true, "2026-10-21T10:00:00Z");
  assert.equal(openList(s), null);
  assert.deepEqual(s.carry.lines.map((x: any) => x.name), ["Rice, cooked", "Skyr, natural"], "the two not ticked wait for the next list");
  s = makeList(s, plan, daysFrom(nextStart(s, "2026-10-21"), 1), "2026-10-22T09:00:00Z");
  const two = openList(s)!;
  assert.equal(two.n, 2); assert.equal(two.from, "2026-10-23"); assert.equal(two.carriedFrom, 1); assert.equal(two.carried.length, 2); assert.equal(s.carry, null);
  assert.ok(listText(two, "Friday 23 October").startsWith("Shopping list 2, Friday 23 October\n\nRice, cooked: 600 g\nSkyr, natural (Arla): 250 g\nChicken breast, raw: 200 g\nRice, cooked: 300 g"), "carried first, then the new days");
  // leave them: nothing waits
  s = finishList(s, 2, false, "2026-10-23T10:00:00Z");
  assert.equal(s.carry, null);
});

test("SL4: a food knows its meals; By meal; a tap goes to buy, in the basket, not this time", async () => {
  const { makeList, daysFrom, tickIn, stateOf, shortMeals, byMeal, openList, notTicked, listText } = await import("./shopping");
  const plan = { "2026-10-20": { lunch: curry, breakfast: bowl }, "2026-10-21": { lunch: curry } };
  let s = makeList({ lists: [], carry: null }, plan as any, daysFrom("2026-10-20", 2), "2026-10-20T15:00:00Z");
  const l = openList(s)!;
  const rice = l.lines.find((x) => x.name === "Rice, cooked")!;
  assert.deepEqual(rice.uses, [{ date: "2026-10-20", slot: "lunch", title: "Chicken curry", grams: 300 }, { date: "2026-10-21", slot: "lunch", title: "Chicken curry", grams: 300 }]);
  assert.deepEqual(byMeal(l).map((m) => `${m.date} ${m.slot} ${m.title}: ${m.foods.map((f) => `${f.line.name} ${f.grams}`).join(", ")}`), [
    "2026-10-20 lunch Chicken curry: Chicken breast, raw 200, Rice, cooked 300", "2026-10-20 breakfast Skyr bowl: Skyr, natural 250", "2026-10-21 lunch Chicken curry: Chicken breast, raw 200, Rice, cooked 300"]);
  s = tickIn(s, 1, rice.key); assert.equal(stateOf(openList(s)!, rice.key), "got");
  s = tickIn(s, 1, rice.key); assert.equal(stateOf(openList(s)!, rice.key), "missing");
  assert.deepEqual(shortMeals(openList(s)!).map((m) => `${m.date} ${m.slot}: ${m.foods.join(",")}`), ["2026-10-20 lunch: Rice, cooked", "2026-10-21 lunch: Rice, cooked"]);
  assert.ok(notTicked(openList(s)!).some((x) => x.key === rice.key), "not there counts as not bought");
  assert.ok(/Rice, cooked: 600 g \(not bought last time\)/.test(listText(openList(s)!, "x")));
  s = tickIn(s, 1, rice.key); assert.equal(stateOf(openList(s)!, rice.key), "buy");
});

test("SL5: a short meal changed with Chef Mealan's help: the list follows the plan's new meal", async () => {
  const { makeList, daysFrom, tickIn, openList, replanMeal, shortMeals } = await import("./shopping");
  const plan = { "2026-10-20": { lunch: curry }, "2026-10-21": { lunch: curry } };
  let s = makeList({ lists: [], carry: null }, plan as any, daysFrom("2026-10-20", 2), "x");
  const rice = "rice, cooked|", chicken = "chicken breast, raw|";
  s = tickIn(s, 1, chicken);                      // chicken in the basket
  s = tickIn(tickIn(s, 1, rice), 1, rice);        // rice not there
  assert.equal(shortMeals(openList(s)!).length, 2);
  // Tuesday's lunch: bulgur stands in for rice
  s = replanMeal(s, 1, "2026-10-20", "lunch", "Chicken curry with bulgur", [{ name: "Chicken breast, raw", brand: "", grams: 200 }, { name: "Bulgur, cooked", brand: "", grams: 320 }]);
  let l = openList(s)!;
  assert.deepEqual(l.lines.map((x) => [x.name, x.grams, x.meals, Boolean(x.added)]), [["Bulgur, cooked", 320, 1, true], ["Chicken breast, raw", 400, 2, false], ["Rice, cooked", 300, 1, false]]);
  assert.deepEqual(shortMeals(l).map((m) => m.date), ["2026-10-21"], "only Wednesday is short now");
  // Wednesday's lunch: another meal, no rice, no chicken
  s = replanMeal(s, 1, "2026-10-21", "lunch", "Skyr bowl", [{ name: "Skyr, natural", brand: "Arla", grams: 250 }]);
  l = openList(s)!;
  assert.deepEqual(l.lines.map((x) => [x.name, x.grams]), [["Bulgur, cooked", 320], ["Chicken breast, raw", 200], ["Skyr, natural", 250]], "rice leaves the list; chicken is in the basket, so it stays");
  assert.deepEqual(l.missing, [], "nothing is short");
  // a food the new meal shares with the old one stays as it was, not as added
  let t = makeList({ lists: [], carry: null }, { "2026-10-20": { lunch: curry } } as any, daysFrom("2026-10-20", 1), "x");
  t = tickIn(tickIn(t, 1, rice), 1, rice);
  t = replanMeal(t, 1, "2026-10-20", "lunch", "Chicken curry with bulgur", [{ name: "Chicken breast, raw", brand: "", grams: 200 }, { name: "Bulgur, cooked", brand: "", grams: 300 }]);
  assert.deepEqual(openList(t)!.lines.map((x) => [x.name, Boolean(x.added)]), [["Bulgur, cooked", true], ["Chicken breast, raw", false]]);
});

test("SL6: a meal changed from the foods carried from the last list: the carried food leaves, the change is kept", async () => {
  const { makeList, daysFrom, tickIn, openList, replanMeal, shortMeals, finishList } = await import("./shopping");
  let s = makeList({ lists: [], carry: null }, { "2026-10-21": { snack: bowl, lunch: curry } } as any, daysFrom("2026-10-21", 1), "x");
  s = finishList(s, 1, true, "y");                                 // nothing ticked: all carried to list 2
  s = makeList(s, {} as any, daysFrom("2026-10-22", 1), "z");
  const skyr = "c:skyr, natural|arla";
  s = tickIn(tickIn(s, 2, skyr), 2, skyr);                         // skyr not there
  assert.equal(shortMeals(openList(s)!).length, 1);
  s = replanMeal(s, 2, "2026-10-21", "snack", "Quark bowl", [{ name: "Quark", brand: "", grams: 250 }], "Skyr bowl", ["Skyr, natural"]);
  const l = openList(s)!;
  assert.equal(shortMeals(l).length, 0, "the snack is no longer short");
  assert.ok(!l.carried.some((x) => x.key === skyr) && !(l.missing ?? []).length, "the carried skyr leaves, nothing is short");
  assert.ok(l.carried.some((x) => x.name === "Rice, cooked"), "the carried foods of other meals stay");
  assert.deepEqual(l.changes, [{ date: "2026-10-21", slot: "snack", from: "Skyr bowl", to: "Quark bowl", because: ["Skyr, natural"] }]);
  s = replanMeal(s, 2, "2026-10-21", "snack", "Cottage cheese", [{ name: "Cottage cheese", brand: "", grams: 200 }], "Quark bowl");
  assert.deepEqual(openList(s)!.changes, [{ date: "2026-10-21", slot: "snack", from: "Skyr bowl", to: "Cottage cheese", because: ["Skyr, natural"] }], "a second change keeps what the meal was at first, and why");
});
