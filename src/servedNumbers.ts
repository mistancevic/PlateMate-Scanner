// DT268 step 2 (0.3.119, board Stories201; Coach Milan 9 November 22:53 to 23:44, Go): the guessed numbers of a Served plate,
// each with its range. The range comes from the read: every food has a low and a high amount (est); a food whose amount you
// settled counts once. Fat reaches further up: a photo misses oil and butter far more often than it invents them, so the
// high side of fat, and of the energy with it, carries a share more (HIDDEN_FAT, our own figure, not calibrated: the photo
// eval waits for weighed plates). PD follows from protein and energy. Nothing here asks the AI.
import type { Ingredient } from "./pilot";

export const HIDDEN_FAT = 0.25;
export type Range = { mid: number; low: number; high: number };
export type Numbers = { kcal: Range; protein: Range; fat: Range; carbs: Range; pd: Range; ranged: boolean };

const sum = (items: Ingredient[], per100: (i: Ingredient) => number, g: (i: Ingredient) => number) => items.reduce((n, i) => n + (per100(i) * g(i)) / 100, 0);
const lowG = (i: Ingredient) => (i.est ? Math.min(i.est.low, i.grams) : i.grams), highG = (i: Ingredient) => (i.est ? Math.max(i.est.high, i.grams) : i.grams), midG = (i: Ingredient) => i.grams;
const pdOf = (protein: number, kcal: number) => (kcal > 0 ? Math.round((protein / kcal) * 1000) / 10 : 0);

export function numbersOf(items: Ingredient[]): Numbers {
  const ranged = items.some((i) => !!i.est && (i.est.low < i.grams || i.est.high > i.grams));
  const of = (per100: (i: Ingredient) => number): Range => ({ mid: sum(items, per100, midG), low: sum(items, per100, lowG), high: sum(items, per100, highG) });
  const kcal = of((i) => i.food.calories ?? 0), protein = of((i) => i.food.protein ?? 0), fat = of((i) => i.food.fats ?? 0), carbs = of((i) => i.food.carbs ?? 0);
  // the hidden fat, on the high side only, and only where there is a range at all
  const extra = ranged ? fat.high * HIDDEN_FAT : 0;
  fat.high += extra; kcal.high += extra * 9;
  // with no range at all the three are the one number
  const r = (x: Range, step = 1): Range => (ranged ? { mid: Math.round(x.mid / step) * step, low: Math.floor(x.low / step) * step, high: Math.ceil(x.high / step) * step } : { mid: Math.round(x.mid), low: Math.round(x.mid), high: Math.round(x.mid) });
  const k = r(kcal, 10), p = r(protein), f = r(fat), c = r(carbs);
  // PD at its lowest is the least protein in the most energy, and the other way round
  const pd: Range = { mid: pdOf(protein.mid, kcal.mid), low: pdOf(protein.low, kcal.high), high: pdOf(protein.high, kcal.low) };
  return { kcal: { ...k, mid: Math.round(kcal.mid) }, protein: p, fat: f, carbs: c, pd, ranged };
}
// several plates as one meal
export const numbersOfAll = (lists: Ingredient[][]): Numbers => numbersOf(lists.flat());
