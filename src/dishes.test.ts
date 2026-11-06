// DT240 to DT247 (0.3.96, boards Stories182 and Stories183; Coach Milan 6 November, Go 12:24): the rules behind the Plate fixes.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Feedback, Food, Ingredient } from "./pilot";
import { stillSame, followed, dishesOf, mealBar, roomFor, courseOf, secondDish, recordOf } from "./dishes";
import { cleanRead, foodOfRead } from "./mealPhoto";

const food = (id: string, name: string, kcal: number, protein: number): Food => ({ id, name, brand: "", basis: "100g", source: "test", calories: kcal, protein } as Food);
const row = (id: string, f: Food, grams: number): Ingredient => ({ id, food: f, grams, locked: false });
const salad = [row("r1", food("ch", "Chicken thigh, grilled", 209, 26), 120), row("r2", food("cu", "Cucumber", 15, 0.7), 120)];
const card = (id: string, items: Ingredient[], at: string, slot: Feedback["slot"] | undefined, x: Partial<Feedback> = {}): Feedback =>
  ({ id, meal: { id: "m" + id, title: "Chicken salad", items, portion: 240, savedAt: at }, status: "eaten", taste: "", notes: "", createdAt: at, ...(slot ? { slot } : {}), ...x } as Feedback);
const dinner = { date: "2026-11-06", slotId: "s3", name: "Dinner", time: "19:00" };

test("DT246: a recorded plate follows the Plate while it is the same plate", () => {
  const c = card("c1", salad, "2026-11-06T19:00:00", dinner);
  assert.equal(stillSame(salad, c), true);
  assert.equal(followed(c, salad, "Chicken salad"), null, "nothing changed, nothing written");
  const more = [...salad.map((i) => (i.id === "r1" ? { ...i, grams: 150 } : i)), row("r3", food("fe", "Feta", 264, 14), 40)];
  const next = followed(c, more, "Greek chicken salad")!;
  assert.equal(next.id, "c1"); assert.equal(next.meal.title, "Greek chicken salad");
  assert.deepEqual(next.meal.items.map((i) => [i.id, i.grams]), [["r1", 150], ["r2", 120], ["r3", 40]]);
  assert.equal(stillSame([row("x1", food("pa", "Pasta", 350, 12), 100)], c), false, "a new plate stops following");
});

test("DT246: a plate back on the Plate with the photo it was recorded with is that meal", () => {
  const c = card("c1", salad, "2026-11-06T17:20:00", dinner, { photo: "data:image/webp;base64,AAA" });
  const now = new Date("2026-11-07T00:30:00");
  assert.equal(recordOf([c], { items: salad, photo: { image: "data:image/webp;base64,AAA", who: "ate" } }, now)?.id, "c1");
  assert.equal(recordOf([c], { items: salad, photo: { image: "data:image/webp;base64,BBB" } }, now), null, "another photo is another meal");
  assert.equal(recordOf([c], { items: salad, photo: { image: "data:image/webp;base64,AAA", who: "idea" } }, now), null, "an idea is nobody's meal");
  assert.equal(recordOf([c], { items: [], photo: { image: "data:image/webp;base64,AAA" } }, now), null, "an empty plate follows nothing");
  assert.equal(recordOf([c], { items: [row("n1", food("pa", "Pasta", 350, 12), 100)], photo: { image: "data:image/webp;base64,AAA" } }, now), null, "a new read of the same picture is a new plate");
  assert.equal(recordOf([c], { items: salad, recorded: { cardId: "c1", date: dinner.date, slot: "Dinner", at: c.createdAt } }, now)?.id, "c1");
});

test("DT247: the dishes of one meal add up, and the room this dish has", () => {
  const cake = [row("k1", food("bc", "Brownie cheesecake", 380, 6), 110)];
  const fb = [card("c1", salad, "2026-11-06T19:00:00", dinner), card("c2", cake, "2026-11-06T19:30:00", dinner, { course: "dessert" }), card("c3", salad, "2026-11-06T12:00:00", { ...dinner, slotId: "s2", name: "Lunch" })];
  assert.deepEqual(dishesOf(fb, "2026-11-06", "s3").map((f) => f.id), ["c1", "c2"]);
  assert.deepEqual(dishesOf(fb, "2026-11-06", "s3", "c1").map((f) => f.id), ["c2"], "the plate's own record is not another dish");
  const bar = mealBar(688, [{ kcal: 600, protein: 40 }, { kcal: 460, protein: 7 }]);
  assert.equal(bar.kcal, 1060); assert.equal(bar.lo, 619); assert.equal(bar.hi, 757); assert.equal(bar.over, 300); assert.equal(bar.under, 0);
  assert.equal(mealBar(688, [{ kcal: 700, protein: 40 }]).over, 0);
  assert.deepEqual(roomFor(688, [{ kcal: 418, protein: 7 }], 50), { kcal: 270, protein: 43 }, "Fit makes room for the dessert as it was served");
  assert.equal(courseOf(0, {}), "main"); assert.equal(courseOf(1, { course: "dessert" }), "dessert"); assert.equal(courseOf(2, {}), "dish");
});

test("DT247: a second photo soon after a meal asks once; within an hour Dessert comes first", () => {
  const fb = [card("c1", salad, "2026-11-06T19:00:00", dinner)];
  const a = secondDish(fb, new Date("2026-11-06T19:30:00"))!;
  assert.equal(a.prev.id, "c1"); assert.equal(a.minutes, 30); assert.equal(a.dessertFirst, true);
  assert.equal(secondDish(fb, new Date("2026-11-06T20:30:00"))!.dessertFirst, false, "after an hour its own snack comes first");
  assert.equal(secondDish(fb, new Date("2026-11-06T23:30:00")), null, "hours later it is no question");
  assert.equal(secondDish([card("s", salad, "2026-11-06T16:00:00", { ...dinner, slotId: "s9", name: "Snack" })], new Date("2026-11-06T16:20:00")), null, "after a snack it is no question");
});

test("DT244: a food read from a photo is named in your language; English stays as its other name", () => {
  const read = cleanRead({ dish: "Chicken salad", dishLocal: "Pileća salata", foods: [{ name: "Grilled chicken skewers", local: "Pileći ražnjići na žaru", grams: 120, calories: 180, protein: 25, fats: 8, carbs: 1, confidence: "medium" }, { name: "Cucumber, raw", local: "Krastavac", grams: 100, calories: 15, protein: 1, fats: 0, carbs: 3, confidence: "high" }] })!;
  assert.equal(read.dishLocal, "Pileća salata");
  const est = foodOfRead(read.foods[0], [], null, () => "id1").food;
  assert.equal(est.name, "Pileći ražnjići na žaru"); assert.deepEqual(est.aliases, ["Grilled chicken skewers"]);
  const table = foodOfRead(read.foods[1], [], null, () => "id2").food;
  assert.ok(table.refId && table.brand === "", "a food of the food table stays the table's food, with the table's names");
  assert.notEqual(table.name, "Krastavac", "not the read's word: the table's own name");
  assert.equal(foodOfRead({ ...read.foods[0] }, [est], null, () => "id3").food.id, "id1", "the same food read again is found by its English name");
  assert.equal(cleanRead({ dish: "x", foods: [{ name: "Rice, cooked", local: "Rice, cooked", grams: 100, calories: 130, protein: 3, fats: 0, carbs: 28, confidence: "high" }] })!.foods[0].local, undefined, "in English there is no second name");
});
