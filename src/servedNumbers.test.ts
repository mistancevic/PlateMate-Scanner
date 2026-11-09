import test from "node:test";
import assert from "node:assert/strict";
import { numbersOf, HIDDEN_FAT } from "./servedNumbers";

const item = (grams: number, est: { low: number; high: number } | undefined, f: { calories: number; protein: number; fats: number; carbs: number }) => ({ id: String(Math.random()), grams, locked: false, est, food: { id: "f", name: "f", ...f } }) as any;
const meat = { calories: 240, protein: 17, fats: 17, carbs: 5 }, mash = { calories: 110, protein: 2, fats: 4, carbs: 16 };

test("DT268 step 2: the middle is the plate as read; the range is each food at its low and its high", () => {
  const n = numbersOf([item(150, { low: 120, high: 195 }, meat), item(95, { low: 76, high: 124 }, mash)]);
  assert.equal(n.ranged, true);
  assert.equal(n.kcal.mid, Math.round(1.5 * 240 + 0.95 * 110));
  assert.equal(n.protein.mid, Math.round(1.5 * 17 + 0.95 * 2));
  assert.ok(n.kcal.low < n.kcal.mid && n.kcal.mid < n.kcal.high);
  assert.ok(n.protein.low < n.protein.mid && n.protein.mid < n.protein.high);
  assert.equal(n.protein.low, Math.round(1.2 * 17 + 0.76 * 2 - 0.5));
});
test("DT268 step 2: fat reaches further up than down, and the energy with it", () => {
  const n = numbersOf([item(100, { low: 80, high: 120 }, meat)]);
  const plainHigh = 1.2 * 17;
  assert.equal(n.fat.high, Math.ceil(plainHigh * (1 + HIDDEN_FAT)));
  assert.ok(n.fat.high - n.fat.mid > n.fat.mid - n.fat.low, "more room up than down");
  assert.ok(n.kcal.high >= Math.ceil((1.2 * 240 + plainHigh * HIDDEN_FAT * 9) / 10) * 10);
});
test("DT268 step 2: PD at its lowest is the least protein in the most energy", () => {
  const n = numbersOf([item(150, { low: 120, high: 195 }, meat), item(95, { low: 76, high: 124 }, mash)]);
  assert.ok(n.pd.low < n.pd.mid && n.pd.mid < n.pd.high);
});
test("DT268 step 2: a settled amount counts once: no range, no hidden fat", () => {
  const n = numbersOf([item(150, undefined, meat)]);
  assert.equal(n.ranged, false);
  assert.equal(n.kcal.low, n.kcal.high); assert.equal(n.fat.low, n.fat.high); assert.equal(n.fat.mid, Math.round(1.5 * 17));
});
test("DT268 step 2: settling one food narrows the range", () => {
  const wide = numbersOf([item(150, { low: 120, high: 195 }, meat), item(95, { low: 76, high: 124 }, mash)]);
  const narrow = numbersOf([item(150, undefined, meat), item(95, { low: 76, high: 124 }, mash)]);
  assert.ok(narrow.kcal.high - narrow.kcal.low < wide.kcal.high - wide.kcal.low);
});
