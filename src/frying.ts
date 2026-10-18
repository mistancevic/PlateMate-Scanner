// R3 (0.2.38, Milan 18 October 2026, 14:17 to 14:36, board RS2): oil is counted, but never more than the food can take up.
// A splash in a pan is all eaten and counted in full. When a recipe fries, the oil it cooks in is capped at what the fried
// food takes up: an estimate, 15% of the food's weight. The source: a glazed yeast doughnut holds 22.7 g fat per 100 g
// (USDA SR Legacy, FDC 172758), its dough, filling and glaze about 5 g; so frying adds 15 to 18 g per 100 g. The recipe
// still lists the whole pot, as it needs it; the app says the amount counted is an estimate wherever it shows.
export const TAKEN_UP = 0.15;
export const TAKEN_UP_LINE = "taken up in frying, an estimate: 15% of the food";
// the plate row has one short line; the word that matters goes first
export const TAKEN_UP_SHORT = "An estimate: taken up in frying";
// the oil a dish cooks in; butter is never one (it goes into doughs and sauces, not under a fryer)
const OIL = /(\boil\b|öl\b|shortening|\blard\b|schmalz|frying fat|frittierfett|\bghee\b|\btallow\b|rindertalg)/i;
const NOT_OIL = /\bspray\b/i;
// the recipe fries: its steps say so, or the oil comes by the pot
const FRIES = /(deep[- ]?fr|\bfry\b|\bfried\b|\bfrying\b|pan[- ]?fr|shallow[- ]?fr|frittier|ausbacken|\bbraten\b|anbraten)/i;
const POT = /(quart|litre|liter|\b\d+(\.\d+)?\s*l\b|for (deep[- ])?frying|zum frittieren)/i;
// the parts that never go into the oil: they are not the fried food
const NOT_FRIED = /(glaze|icing|frosting|topping|sauce|dressing|\bdip\b|syrup|garnish|to serve|for serving|glasur|soße|guss)/i;

export type Fried<T> = T & { fry?: { pot: number } };
export function capOil<T extends { name: string; written: string; grams: number; optional?: boolean; part?: string }>(items: T[], steps: string[]): Fried<T>[] {
  const fries = FRIES.test(steps.join(" ")) || items.some((i) => OIL.test(i.name) && POT.test(i.written));
  if (!fries) return items;
  const isOil = (i: T) => OIL.test(i.name) && !NOT_OIL.test(i.name) && !NOT_OIL.test(i.written) && !i.optional;
  const food = items.filter((i) => !isOil(i) && !i.optional && !(i.part && NOT_FRIED.test(i.part))).reduce((n, i) => n + i.grams, 0);
  const cap = Math.round(food * TAKEN_UP);
  return items.map((i) => (isOil(i) && food > 0 && i.grams > cap ? { ...i, grams: cap, fry: { pot: i.grams } } : i));
}
