// B168 and DT349 (0.3.193, board B168 and DT349, canvas Page 6; nutrition rule N17): a serving is the recipe's equal share,
// the same for everyone; a portion is mine, calculated for a meal on a day.

// The Servings chips: 1 to 5, one tap each (Coach Milan 25 November 13:06), and the recipe's own number or the plan's when it
// is another; only numbers.
export const servingChips = (makesN: number, plannedCount?: number | null): number[] =>
  [...new Set([1, 2, 3, 4, 5, makesN, ...(plannedCount ? [plannedCount] : [])])].filter((n) => n >= 1).sort((a, b) => a - b);

// The − and + row is in use when it was tapped last, or when the count is no chip; otherwise it is grey.
export const stepping = (count: number, chips: number[], tappedLast: boolean): boolean => tappedLast || !chips.includes(count);

// My portion as a share of the whole recipe: the meal's energy over the recipe's, never more than the whole recipe.
export const portionShare = (mealKcal: number, wholeKcal: number | null | undefined): number =>
  wholeKcal && wholeKcal > 0 && mealKcal > 0 ? Math.min(1, mealKcal / wholeKcal) : 1;

// How many of these portions the whole recipe is, to a tenth: 3.0 of your dinner portions.
export const portionsInWhole = (share: number): number => Math.round((1 / share) * 10) / 10;
