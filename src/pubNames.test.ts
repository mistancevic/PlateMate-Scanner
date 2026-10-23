import { test } from "node:test";
import assert from "node:assert/strict";
import { keptName, nameFits } from "./pubNames";
import { mergeFoods } from "./dedupe";

const f = (id: string, name: string, brand = "") => ({ id, name, brand, basis: "100g" as const, calories: 100, protein: 5, fats: 1, carbs: 10, fiber: 0, source: "", notes: "", reviewedAt: "", readyToEat: true });
const sarma = (third: ReturnType<typeof f>) => ({ id: "m", title: "Sarma", savedAt: "", items: [f("cab", "Cabbage, raw"), f("min", "Beef mince, 15 % fat, raw"), third].map((food, i) => ({ id: "s" + i, food, grams: 100, locked: true })) }) as any;

test("the live page's food names follow the food, not the row (Milan 23:27, Sarma)", () => {
  const oats = sarma(f("oat", "Oats"));
  // an older draft without ids, written when the third row was cooked rice
  assert.equal(keptName(oats, 2, { names: ["Cabbage", "Beef mince", "Rice, cooked"] }, null), "Oats", "the rice name does not stay on the oats row");
  assert.equal(keptName(oats, 0, { names: ["Cabbage", "Beef mince", "Rice, cooked"] }, null), "Cabbage", "a name that still names its food stays");
  assert.equal(keptName(oats, 0, { names: ["White cabbage", "", ""] }, null), "White cabbage", "a name the person wrote for the same food stays");
  assert.equal(keptName(oats, 2, {}, { items: [{ name: "Cabbage" }, { name: "Mince" }, { name: "Rice, cooked" }] }), "Oats", "nor from the live page");
  assert.equal(keptName(sarma(f("raw", "Rice, white, raw")), 2, { names: ["", "", "Rice, cooked"] }, null), "Rice, white, raw", "cooked rice's name does not stay on raw rice");
  // a draft with ids: the person's own name stays with its food, whatever it says
  assert.equal(keptName(oats, 2, { names: ["", "", "Porridge oats"], nameIds: ["cab", "min", "oat"] }, null), "Porridge oats");
  assert.equal(keptName(oats, 2, { names: ["", "", "Rice"], nameIds: ["cab", "min", "ric"] }, null), "Oats");
  assert.ok(nameFits("Skyr", f("x", "Skyr, natural", "Arla")) && !nameFits("Rice, cooked", f("y", "Oats")));
});

test("a can read again and saved as an Update keeps the new pack and serving", () => {
  const old = f("t", "Tuna in olive oil", "Rio Mare");
  const read = { ...f("n", "Tuna in olive oil", "Rio Mare"), serving: { grams: 160, name: "can" }, pack: { net: 160, drained: 120, liquid: "olive oil", per: "drained" as const } };
  const m = mergeFoods(old as any, read as any);
  assert.deepEqual(m.pack, read.pack); assert.deepEqual(m.serving, read.serving); assert.equal(m.id, "t", "the old food stays the one in My foods");
  assert.deepEqual(mergeFoods({ ...old, serving: { grams: 150, name: "can" } } as any, read as any).serving, { grams: 150, name: "can" }, "a serving the old food already has stays");
});
