// R12 (0.2.38, Milan 18 October 2026, 13:55 and 14:36, board RS9): the whole recipe in your portions, not the recipe's numbers.
// A plate sized for your lunch makes the whole recipe about N of your lunches; the rest is left, each the size of your lunch.
export const plural = (w: string) => (/(ch|sh|s|x|z)$/.test(w) ? `${w}es` : `${w}s`);
export const yourPortions = (wholeKcal: number, plateKcal: number) => (plateKcal > 0 ? Math.max(1, Math.round(wholeKcal / plateKcal)) : 1);
