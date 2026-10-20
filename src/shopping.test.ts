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
