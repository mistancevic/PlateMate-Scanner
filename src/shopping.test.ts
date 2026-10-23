import test from "node:test";
import assert from "node:assert/strict";
import { shoppingList, shoppingText, shopGrams, shopAmount } from "./shopping";

const food = (name: string, brand = "") => ({ id: name, name, brand, basis: "100g", calories: 100, protein: 10, fats: 1, carbs: 10, fiber: 0, source: "label", notes: "", reviewedAt: "", readyToEat: true }) as any;
const it = (f: any, grams: number) => ({ id: f.name + grams, food: f, grams, locked: true });
const chicken = food("Chicken breast, raw"), rice = food("Rice salad"), skyr = food("Skyr, natural", "Arla");
// a recipe for four: 800 g chicken, 1,200 g rice; one portion is a quarter
const curry = { title: "Chicken curry", kcal: 600, protein: 50, source: "mine" as const, mealId: "c", items: [it(chicken, 800), it(rice, 1200)], portion: 500, servings: 4 };
const bowl = { title: "Skyr bowl", kcal: 300, protein: 30, source: "mine" as const, mealId: "s", items: [it(skyr, 250)], portion: 250 };
const starter = { title: "Chicken, rice and greens", kcal: 640, protein: 52, source: "starter" as const };

test("seven days of the plan, one portion per meal, every food added up by name", () => {
  const plan = { "2026-10-20": { lunch: curry, breakfast: bowl }, "2026-10-21": { lunch: curry, dinner: starter, snack: { ...bowl, skipped: true } }, "2026-10-30": { lunch: curry } };
  const l = shoppingList(plan, ["2026-10-20", "2026-10-21", "2026-10-22"]);
  assert.equal(l.meals, 4, "the skipped snack is left out; 30 October is outside the days");
  assert.deepEqual(l.lines.map((x) => [x.name, x.grams, x.meals]), [["Chicken breast, raw", 400, 2], ["Rice salad", 600, 2], ["Skyr, natural", 250, 1]]);
  assert.deepEqual(l.without, [{ date: "2026-10-21", title: "Chicken, rice and greens" }]);
});

test("grams read as a shop reads them, and the text leaves out what is ticked", () => {
  assert.equal(shopGrams(7.4), 7); assert.equal(shopGrams(0.2), 1); assert.equal(shopGrams(123), 120); assert.equal(shopGrams(605), 610);
  const l = shoppingList({ "2026-10-20": { lunch: curry, breakfast: bowl } }, ["2026-10-20"]);
  assert.equal(shoppingText(l, "20 to 26 October", new Set(["rice salad|"])), "Shopping list, 20 to 26 October\n\nChicken breast, raw: 200 g\nSkyr, natural (Arla): 250 g");
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
  assert.deepEqual(s.carry.lines.map((x: any) => x.name), ["Rice salad", "Skyr, natural"], "the two not ticked wait for the next list");
  s = makeList(s, plan, daysFrom(nextStart(s, "2026-10-21"), 1), "2026-10-22T09:00:00Z");
  const two = openList(s)!;
  assert.equal(two.n, 2); assert.equal(two.from, "2026-10-23"); assert.equal(two.carriedFrom, 1); assert.equal(two.carried.length, 2); assert.equal(s.carry, null);
  assert.ok(listText(two, "Friday 23 October").startsWith("Shopping list 2, Friday 23 October\n\nRice salad: 600 g\nSkyr, natural (Arla): 250 g\nChicken breast, raw: 200 g\nRice salad: 300 g"), "carried first, then the new days");
  // leave them: nothing waits
  s = finishList(s, 2, false, "2026-10-23T10:00:00Z");
  assert.equal(s.carry, null);
});

test("SL4: a food knows its meals; By meal; a tap goes to buy, in the basket, not this time", async () => {
  const { makeList, daysFrom, tickIn, stateOf, shortMeals, byMeal, openList, notTicked, listText } = await import("./shopping");
  const plan = { "2026-10-20": { lunch: curry, breakfast: bowl }, "2026-10-21": { lunch: curry } };
  let s = makeList({ lists: [], carry: null }, plan as any, daysFrom("2026-10-20", 2), "2026-10-20T15:00:00Z");
  const l = openList(s)!;
  const rice = l.lines.find((x) => x.name === "Rice salad")!;
  assert.deepEqual(rice.uses, [{ date: "2026-10-20", slot: "lunch", title: "Chicken curry", grams: 300 }, { date: "2026-10-21", slot: "lunch", title: "Chicken curry", grams: 300 }]);
  assert.deepEqual(byMeal(l).map((m) => `${m.date} ${m.slot} ${m.title}: ${m.foods.map((f) => `${f.line.name} ${f.grams}`).join(", ")}`), [
    "2026-10-20 lunch Chicken curry: Chicken breast, raw 200, Rice salad 300", "2026-10-20 breakfast Skyr bowl: Skyr, natural 250", "2026-10-21 lunch Chicken curry: Chicken breast, raw 200, Rice salad 300"]);
  s = tickIn(s, 1, rice.key); assert.equal(stateOf(openList(s)!, rice.key), "got");
  s = tickIn(s, 1, rice.key); assert.equal(stateOf(openList(s)!, rice.key), "missing");
  assert.deepEqual(shortMeals(openList(s)!).map((m) => `${m.date} ${m.slot}: ${m.foods.join(",")}`), ["2026-10-20 lunch: Rice salad", "2026-10-21 lunch: Rice salad"]);
  assert.ok(notTicked(openList(s)!).some((x) => x.key === rice.key), "not there counts as not bought");
  assert.ok(/Rice salad: 600 g \(not bought last time\)/.test(listText(openList(s)!, "x")));
  s = tickIn(s, 1, rice.key); assert.equal(stateOf(openList(s)!, rice.key), "buy");
});

test("SL5: a short meal changed with Chef Mealan's help: the list follows the plan's new meal", async () => {
  const { makeList, daysFrom, tickIn, openList, replanMeal, shortMeals } = await import("./shopping");
  const plan = { "2026-10-20": { lunch: curry }, "2026-10-21": { lunch: curry } };
  let s = makeList({ lists: [], carry: null }, plan as any, daysFrom("2026-10-20", 2), "x");
  const rice = "rice salad|", chicken = "chicken breast, raw|";
  s = tickIn(s, 1, chicken);                      // chicken in the basket
  s = tickIn(tickIn(s, 1, rice), 1, rice);        // rice not there
  assert.equal(shortMeals(openList(s)!).length, 2);
  // Tuesday's lunch: bulgur stands in for rice
  s = replanMeal(s, 1, "2026-10-20", "lunch", "Chicken curry with bulgur", [{ name: "Chicken breast, raw", brand: "", grams: 200 }, { name: "Bulgur, cooked", brand: "", grams: 320 }]);
  let l = openList(s)!;
  assert.deepEqual(l.lines.map((x) => [x.name, x.grams, x.meals, Boolean(x.added)]), [["Bulgur, cooked", 320, 1, true], ["Chicken breast, raw", 400, 2, false], ["Rice salad", 300, 1, false]]);
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
  assert.ok(l.carried.some((x) => x.name === "Rice salad"), "the carried foods of other meals stay");
  assert.deepEqual(l.changes, [{ date: "2026-10-21", slot: "snack", from: "Skyr bowl", to: "Quark bowl", because: ["Skyr, natural"] }]);
  s = replanMeal(s, 2, "2026-10-21", "snack", "Cottage cheese", [{ name: "Cottage cheese", brand: "", grams: 200 }], "Quark bowl");
  assert.deepEqual(openList(s)!.changes, [{ date: "2026-10-21", slot: "snack", from: "Skyr bowl", to: "Cottage cheese", because: ["Skyr, natural"] }], "a second change keeps what the meal was at first, and why");
});

test("0.2.65: the list follows a plan already changed; a food doubled by a second swap is kept once", async () => {
  const { makeList, daysFrom, tickIn, openList, shortMeals, followPlan } = await import("./shopping");
  const { refreshPlanned } = await import("./planned");
  const plan: any = { "2026-10-21": { lunch: curry } };
  let s = makeList({ lists: [], carry: null }, plan, daysFrom("2026-10-21", 1), "x");
  s = tickIn(tickIn(s, 1, "rice salad|"), 1, "rice salad|");
  assert.equal(shortMeals(openList(s)!).length, 1);
  // the plan changed elsewhere: lunch has bulgur now, twice, as the old second Use this left it
  const est = (name: string) => ({ ...food(name), source: "estimate" });
  const changed = { title: "Chicken curry with bulgur", kcal: 1, protein: 1, source: "mine", items: [it(food("Chicken breast, raw"), 200), it(est("Bulgur salad"), 300), it(est("Bulgur salad"), 300)], portion: 800 };
  const fixed = refreshPlanned({ "2026-10-21": { lunch: changed } } as any, []);
  assert.deepEqual(fixed["2026-10-21"].lunch.items!.map((i: any) => i.food.name), ["Chicken breast, raw", "Bulgur salad"], "bulgur once");
  assert.equal(fixed["2026-10-21"].lunch.portion, 500);
  s = followPlan(s, fixed);
  const l = openList(s)!;
  assert.equal(shortMeals(l).length, 0, "lunch is no longer short");
  assert.deepEqual(l.lines.map((x) => [x.name, x.grams]), [["Bulgur salad", 300], ["Chicken breast, raw", 200]], "rice leaves; the list holds what the plan holds");
  assert.equal((l.changes ?? []).length, 0, "followed quietly, not said as a change you made");
});

test("SL7: a food counted cooked is bought raw; the list says both", async () => {
  const { rawOf, REFERENCE } = await import("./reference");
  assert.equal(rawOf("Rice, cooked", 130)!.raw.id, "rice-white-raw");
  assert.equal(rawOf("Pirinač, kuvan", 130)!.raw.id, "rice-white-raw");
  assert.equal(rawOf("Rice, brown, cooked", 123)!.raw.id, "rice-brown-raw");
  assert.equal(rawOf("Chicken breast, cooked", 165)!.raw.id, "chicken-breast-raw");
  assert.equal(rawOf("Hähnchenbrust, gegart", 165)!.raw.id, "chicken-breast-raw");
  assert.equal(rawOf("Rice, white, raw", 365), null, "raw stays raw");
  assert.equal(rawOf("Rice pudding", 120), null, "a dish is not a cooked food");
  assert.ok(REFERENCE.some((r) => r.id === "lentils-dry") && REFERENCE.some((r) => r.id === "bulgur-dry"));
  const rice = { ...food("Rice, cooked"), calories: 130 }, chicken = { ...food("Chicken breast, cooked"), calories: 165 };
  const sarma = { title: "Sarma", kcal: 1, protein: 1, source: "mine" as const, mealId: "s", items: [it(rice, 1200), it(chicken, 800)], portion: 500, servings: 4 };
  const l = shoppingList({ "2026-10-22": { dinner: sarma } } as any, ["2026-10-22"]);
  assert.deepEqual(l.lines.map((x) => [x.name, x.grams, x.cooked]), [["Chicken breast, raw", 280, 200], ["Rice, white, raw", 110, 300]]);
  assert.equal(shoppingText(l, "Thursday 22 October", new Set()), "Shopping list, Thursday 22 October\n\nChicken breast, raw: 280 g\nRice, white, raw: 110 g");
});

test("SL7: a list follows the plan's changes; a day shopped for keeps its meals off the next list, a meal added later comes on", async () => {
  const { makeList, daysFrom, nextStart, openList, finishList, planChanges, updateList } = await import("./shopping");
  const plan: any = { "2026-10-22": {} };
  let s = makeList({ lists: [], carry: null }, plan, daysFrom("2026-10-22", 1), "x");          // list 1 for an empty Thursday
  s = finishList(s, 1, false, "y");
  // meals are added to Thursday afterwards: the next list starts on Thursday with them
  plan["2026-10-22"] = { lunch: curry, dinner: bowl };
  assert.equal(nextStart(s, "2026-10-20", plan), "2026-10-22");
  s = makeList(s, plan, daysFrom("2026-10-22", 1), "z");
  let l = openList(s)!;
  assert.equal(l.meals, 2); assert.deepEqual(l.counted!.map((c) => c.slot), ["lunch", "dinner"]);
  // the plan changes while list 2 is open: dinner swapped, a snack added, lunch taken off
  plan["2026-10-22"] = { dinner: { ...curry, title: "Chicken curry, small" }, snack: bowl };
  assert.deepEqual(planChanges(l, plan).map((c) => `${c.kind} ${c.slot} ${c.title}${c.was ? ` was ${c.was}` : ""}`), ["changed dinner Chicken curry, small was Skyr bowl", "new snack Skyr bowl", "gone lunch Chicken curry"]);
  s = updateList(s, 2, plan, "t");
  l = openList(s)!;
  assert.deepEqual(planChanges(l, plan), [], "after Update the list, nothing is left to update");
  assert.deepEqual(l.lines.map((x) => [x.name, x.grams]), [["Chicken breast, raw", 200], ["Rice salad", 300], ["Skyr, natural", 250]]);
  assert.equal(l.meals, 2);
  // the same meals never come on a next list again
  s = finishList(s, 2, false, "u");
  assert.notEqual(nextStart(s, "2026-10-20", plan), "2026-10-22");
});
test("DT76: eggs and bananas are bought by the piece", () => {
  assert.equal(shopAmount("Egg, whole, raw", 210), "4 eggs");
  assert.equal(shopAmount("Banana, raw", 120), "1 banana");
  assert.equal(shopAmount("Banana, raw", 40), "1 banana");
  assert.equal(shopAmount("Egg white, raw", 130), "130 g");
  assert.equal(shopAmount("Oats, rolled", 1200), "1,200 g");
  // DT77: a part of one is bought whole: 90 g of eggs is 2, an apple and a half is 2 apples
  assert.equal(shopAmount("Eggs", 90), "2 eggs");
  assert.equal(shopAmount("Apple, raw", 270), "2 apples");
  assert.equal(shopAmount("Eggs", 110), "2 eggs");                 // 2.1 eggs: the slack keeps it at 2
});

// DT79 (Milan 23 October 11:12 and 11:15): a recipe that says what it makes is cooked, and bought, as whole batches
test("DT79: pieces of a batch recipe add up, and the list buys whole batches", () => {
  const cabbage = food("Cabbage, raw"), mince = food("Beef mince, raw");
  const sarma = { title: "Sarma", kcal: 360, protein: 20, source: "mine" as const, mealId: "sa", items: [it(cabbage, 800), it(mince, 600)], portion: 175, servings: 8, unit: "sarmas", amount: 3 };
  const l = shoppingList({ "2026-10-20": { lunch: sarma }, "2026-10-22": { lunch: { ...sarma, amount: 4 } } }, ["2026-10-20", "2026-10-21", "2026-10-22"]);
  assert.deepEqual(l.batches, [{ title: "Sarma", n: 8, pieces: 7, batches: 1 }]);
  assert.deepEqual(l.lines.map((x) => [x.name, x.grams]), [["Beef mince, raw", 600], ["Cabbage, raw", 800]]);
  assert.deepEqual(l.lines.find((x) => /Cabbage/.test(x.name))!.uses!.map((u) => u.grams), [300, 400]);   // each meal its share
  const two = shoppingList({ "2026-10-20": { lunch: { ...sarma, amount: 6 } }, "2026-10-22": { lunch: { ...sarma, amount: 5 } } }, ["2026-10-20", "2026-10-22"]);
  assert.equal(two.batches![0].batches, 2); assert.equal(two.lines.find((x) => /Cabbage/.test(x.name))!.grams, 1600);
});
