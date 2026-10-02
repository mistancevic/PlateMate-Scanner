import test from "node:test";
import assert from "node:assert/strict";
import { playbookFor, tipBreaks } from "./playbook";
const f = (name: string, calories: number, protein: number, fats: number, carbs: number, fiber = 0, table: any[] = []) => ({ id: name, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", readyToEat: true, calories, protein, fats, carbs, fiber, table }) as any;
const nutella = f("Nutella", 539, 6.3, 30.9, 57.5, 0, [{ key: "sugars", amount: 56.3, unit: "g" }, { key: "saturates", amount: 10.6, unit: "g" }]);
const banana = f("Banana", 89, 1.1, 0.3, 20, 2.6), skyr = f("Skyr, natural", 63, 11, 0.2, 4);
test("Nutella: not before training, not alone, high fat, saturates and sugars", () => {
  const p = playbookFor(nutella);
  assert.equal(p.beforeTraining.ok, false); assert.match(p.beforeTraining.reason, /30\.9 g per 100 g fat/);
  assert.equal(p.alone.ok, false);
  assert.equal(p.caveats.length, 3);
});
test("banana suits before training, skyr after", () => { assert.equal(playbookFor(banana).beforeTraining.ok, true); assert.equal(playbookFor(skyr).afterTraining.ok, true); });
test("the tip Mealan wrote for Nutella breaks three rules", () => {
  const b = tipBreaks("Nutella is great for a quick energy boost before training when paired with oats. Note that it is high in sugar, so enjoy it in moderation.", playbookFor(nutella));
  assert.deepEqual(b, ["recommends it before training", "sells a flavour food as energy", 'says "in moderation"']);
});
test("saying not before training is fine", () => { assert.deepEqual(tipBreaks("A spoon of it stirred into your Skyr after training; not before training, the fat slows digestion.", playbookFor(nutella)), []); });
