// DT287 (0.3.142, board Stories215): Fill the open slots on the goal, and a different week
import { test } from "node:test";
import assert from "node:assert/strict";
import { kindOfName, proteinOf, weekAround, weekPenalty, slotChoices } from "./variety";
import { fillDay, type PlannedMeal } from "./planned";
const food = (name: string, kcal: number, protein: number) => ({ id: name, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", calories: kcal, protein, fats: 5, carbs: 10, fiber: 0 }) as any;
const meal = (title: string, main: string, kcal = 600, protein = 45): PlannedMeal => ({ title, kcal, protein, source: "mine", items: [{ id: "a", food: food(main, 150, 25), grams: 150, locked: false }, { id: "b", food: food("Rice, cooked", 130, 2.7), grams: 150, locked: false }] });
test("DT287: the kind of protein, by name in three languages", () => {
  assert.equal(kindOfName("Salmon, cooked"), "fish"); assert.equal(kindOfName("Ćureće grudi"), "poultry"); assert.equal(kindOfName("Hähnchenbrust"), "poultry");
  assert.equal(kindOfName("Eggs"), "eggs"); assert.equal(kindOfName("Skyr, natural"), "dairy"); assert.equal(kindOfName("Pasulj"), "legumes"); assert.equal(kindOfName("Rinderhack"), "meat");
  assert.equal(proteinOf(meal("Bowl", "Salmon, cooked")), "fish");
});
test("DT287: the week counts eaten and planned meals; the same dish within 3 days is far back", () => {
  const fb = [{ id: "1", status: "eaten", taste: "", notes: "", createdAt: "2026-11-11T12:00:00", meal: { id: "x", title: "Chicken bowl", items: meal("Chicken bowl", "Chicken breast, cooked").items, savedAt: "" } }] as any;
  const wk = weekAround("2026-11-12", fb, { "2026-11-13": { dinner: meal("Chicken wrap", "Chicken breast, cooked") } });
  assert.equal(wk.kinds.poultry, 2); assert.equal(wk.days.get("chicken bowl"), 1);
  assert.ok(weekPenalty(meal("Chicken bowl", "Chicken breast, cooked"), wk) >= 5);
  assert.ok(weekPenalty(meal("Salmon bowl", "Salmon, cooked"), wk) < 0, "a kind new this week comes first");
});
test("DT287: the fill picks another protein than the week's, and gives two or three choices with why", () => {
  const slot = { id: "dinner", name: "Dinner", time: "20:00" } as any;
  const ms = [meal("Chicken bowl", "Chicken breast, cooked"), meal("Salmon bowl", "Salmon, cooked", 610, 44), meal("Egg skillet", "Eggs", 590, 40)];
  const fb = [1, 2].map((d) => ({ id: String(d), status: "eaten", taste: "", notes: "", createdAt: `2026-11-1${2 - d}T12:00:00`, meal: { id: "x" + d, title: "Chicken wrap", items: ms[0].items, savedAt: "" } })) as any;
  const wk = weekAround("2026-11-12", fb, {});
  const [row] = fillDay([slot], {}, ms, { kcal: 600, protein: 45 }, 7, undefined, wk);
  assert.notEqual(proteinOf(row.meal), "poultry");
  const cs = slotChoices(row, "goal", wk, () => 0);
  assert.ok(cs.length >= 2 && cs.length <= 3 && new Set(cs.map((c) => proteinOf(c.meal))).size === cs.length);
  assert.match(cs.find((c) => proteinOf(c.meal) === "fish")!.why, /Fish: none yet this week/);
  const lighter = slotChoices({ ...row, meal: ms[1] }, "lighter", wk, () => 0);
  assert.ok(lighter.every((c) => c.meal.kcal <= 610 * 0.85));
});
