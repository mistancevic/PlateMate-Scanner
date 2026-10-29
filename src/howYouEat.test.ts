// DT160 and DT161 (0.3.3): Carbs and fat, the diets and the kitchens' dishes, what goes to Chef Mealan, Your day in the Explorer
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate, splitOf, fatShareOf, type Personal } from "./personal";
import { dishFits, dishesFor, tasteOf, another, KITCHEN, DISH_HAS } from "./kitchens";
import { eatsForReq } from "./eats";
import { yourDay, dayList, weekNumbers } from "./explorerDay";
import { lowCarbDays, weekDaysOf } from "./components/CarbsFatStep";

const base: Personal = { dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } } as Personal;
const days = (p: Personal) => calculate(p, "maintain")!.weekdays!.map((d) => [d.name, d.kcal, d.protein, d.fats, d.carbs]);

test("Balanced is the rule before DT161: fat 30 % of the week, the same numbers as 0.3.2", () => {
  const c = calculate(base, "maintain")!;
  assert.equal(splitOf(base, "maintain"), "balanced");
  assert.equal(c.kcal, 2500); assert.equal(c.protein, 160); assert.equal(c.fats, 83);
  assert.deepEqual(days(base)[0], ["Monday", 2850, 160, 83, 366]);
});

test("Performance starts on More carbs, its 25 % as before", () => {
  assert.equal(splitOf(base, "performance"), "carbs");
  assert.equal(fatShareOf(base, "performance"), 0.25);
});

test("More fat: 35 %, carbs take the rest", () => {
  const p = { ...base, carbsFat: { split: "fat" as const } };
  assert.equal(calculate(p, "maintain")!.fats, 97);
  assert.deepEqual(days(p).map((d) => d[4]), [334, 272, 197, 272, 222, 197, 197]);
});

test("Very low carb: the typed carbs every day, fat the rest of each day; Balanced until typed", () => {
  const p = { ...base, carbsFat: { split: "low" as const, carbs: 50 } };
  assert.deepEqual(days(p).map((d) => [d[3], d[4]]), [[223, 50], [196, 50], [162, 50], [196, 50], [173, 50], [162, 50], [162, 50]]);
  assert.equal(calculate({ ...base, carbsFat: { split: "low" } }, "maintain")!.fats, 83);
});

test("the days below 45 % carbs, named; most of the week as every day but one", () => {
  const c = calculate({ ...base, carbsFat: { split: "fat" } }, "maintain")!;
  assert.equal(lowCarbDays(weekDaysOf(c)), "On every day but Monday your carbs are");
  assert.equal(lowCarbDays(weekDaysOf(calculate(base, "maintain")!)), "On Wednesday, Friday, Saturday and Sunday your carbs are");
  assert.equal(dayList(["Wednesday", "Saturday"], 7), "Wednesday and Saturday");
});

test("every kitchen dish has what it holds written down", () => {
  for (const k of Object.values(KITCHEN)) for (const d of k.dishes) assert.ok(d in DISH_HAS, d);
});

test("the dishes shown follow What you eat", () => {
  assert.equal(dishesFor("Balkan", "Vegan").length, 0);
  assert.deepEqual(dishesFor("Indian", "Vegan"), ["Dal with rice", "Chana masala", "Rajma with rice"]);
  assert.ok(!dishFits("Bean stew with smoked meat", "No pork"));
  assert.ok(!dishFits("Pad thai", "Vegetarian"), "fish sauce");
  assert.ok(!dishFits("Mushroom risotto", "Paleo"));
  assert.ok(dishFits("Steak with a green salad", "Meat only") && !dishFits("Greek salad with feta", "Meat only"));
  assert.ok(dishFits("Sarma", "Other") && dishFits("Sarma", undefined));
});

test("a kept dish that no longer fits gives its place; Another stays within the diet", () => {
  const p = { kitchenTaste: { Italian: { shown: ["Pasta al pomodoro with chicken", "Mushroom risotto", "Minestrone"], out: [] } }, lifestyle: { diet: "Vegan" } } as unknown as Personal;
  const t = tasteOf(p, "Italian");
  assert.deepEqual(t.shown, ["Minestrone", "Pasta e fagioli"]);
  assert.deepEqual(another({ shown: ["Chana masala"], out: [] }, "Indian", 0, "Vegan").shown, ["Dal with rice"]);
});

test("what Chef Mealan gets: the diet in fixed words, Other in theirs, the split, drink and sleep", () => {
  const p = { ...base, carbsFat: { split: "low" as const, carbs: 50 }, lifestyle: { ...base.lifestyle, diet: "Other", dietOther: "  Mediterranean,   no gluten ", alcohol: "On weekends", bed: "late", wake: "mid" } } as Personal;
  assert.deepEqual(eatsForReq(p, "maintain"), { what_they_eat: "Other", in_their_words: "Mediterranean, no gluten", carbs_and_fat: "Very low carb, 50 g of carbs a day", how_often_they_drink: "On weekends", bed: "after midnight", wake: "6:00 to 8:00" });
  assert.deepEqual(eatsForReq(base, "performance"), { carbs_and_fat: "More carbs" });
});

test("Your day: fat on the week's average, carbs on today, the week's span", () => {
  const c = calculate(base, "maintain")!;
  const byDate = (d: Date) => { const w = c.weekdays![(d.getDay() + 6) % 7]; return { kcal: w.kcal, protein: w.protein, fats: w.fats, carbs: w.carbs }; };
  const thu = new Date("2026-10-29T10:00:00");
  const week = weekNumbers(byDate, thu);
  assert.equal(week.length, 7); assert.equal(week[0].name, "Monday");
  const d = yourDay(byDate(thu), week, c.kcal);
  assert.deepEqual(d.fat, { lo: 56, hi: 97, you: 83, pct: 30 });
  assert.equal(d.satUnder, 28);
  assert.deepEqual(d.carbs, { lo: 293, hi: 390, you: 303, pct: 47 });
  assert.deepEqual(d.span, { lo: 228, loName: "Wednesday", hi: 366, hiName: "Monday" });
  assert.deepEqual(d.below, ["Wednesday", "Friday", "Saturday", "Sunday"]);
  assert.equal(d.sugarsUnder, 65);
});
